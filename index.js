const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { GraphQLClient, gql } = require("graphql-request");

// ── X3 Configuration ──────────────────────────────────────────────────────
// SEVWAYS timesheets live in the CUSTOM node `sevwaysYtimesheet.timeSheet`
// (header) + `timesheetLine` (detail lines). The standard Sage node
// x3ProjectManagement.timeEntryLine is NOT used here.
const X3_URL      = "https://195.23.16.22:3310/xtrem/api";
const X3_ENDPOINT = "SWPTINT";
const X3_AUTH     = "Basic T05BTDpBZGVzdGUyNDE2IQ=="; // ONAL — Basic auth (briefing: migrate to JWT later)

// X3 server uses a self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Logging MUST go to stderr only — stdout is reserved for the MCP stdio protocol.
const log = (...a) => console.error("[sevways-x3]", ...a);

const client = new GraphQLClient(X3_URL, {
  headers: { "Authorization": X3_AUTH, "x-xtrem-endpoint": X3_ENDPOINT },
});

// X3 can return partial data alongside errors (e.g. when TimesheetLine.read
// rights are not yet granted, the header still comes back). Salvage the data
// but keep the error messages and surface them as warnings — never swallow
// them, so the agent can see and react to them.
async function runQuery(query, variables) {
  try {
    return { data: await client.request(query, variables), errors: [] };
  } catch (err) {
    const data = err.response && err.response.data;
    const errors = (err.response && err.response.errors) || [{ message: err.message }];
    if (data) {
      log("partial result with warnings:", errors.map((e) => e.message).join("; "));
      return { data, errors };
    }
    log("query failed:", errors.map((e) => e.message).join("; "));
    throw err;
  }
}

// Build an X3 filter string (JSON) from simple args.
function buildFilter({ user, dateFrom, dateTo, validated }) {
  const f = {};
  if (user) f.user = { login: { _eq: user } };
  if (dateFrom || dateTo) {
    f.date = {};
    if (dateFrom) f.date._gte = dateFrom;
    if (dateTo)   f.date._lte = dateTo;
  }
  if (typeof validated === "boolean") f.validated = { _eq: validated };
  return Object.keys(f).length ? JSON.stringify(f) : null;
}

const SHEET_FIELDS = gql`
  timesheetId
  date
  validated
  facility { code }
  user { login }
  lines {
    query(first: 200) {
      edges { node {
        lineNumber
        startTime
        endTime
        totalHours
        interruptionHours
        billedHours
        overtime
        taskType
        taskTitle
        jiraTask
        done
        location
        contact
        project { id localizedDescription }
      } }
    }
  }
`;

const sheetsFromData = (data) =>
  (data?.sevwaysYtimesheet?.timeSheet?.query?.edges || []).map((e) => e.node);
const linesOf = (node) => (node.lines?.query?.edges || []).map((e) => e.node);
const asText = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

const server = new McpServer({ name: "sevways-x3-timesheet", version: "2.0.0" });

// ── Tool 1 — list_time_entries (read) ───────────────────────────────────────
server.tool(
  "list_time_entries",
  {
    user:      z.string().optional().describe("User login, e.g. ONAL"),
    dateFrom:  z.string().optional().describe("Start date (YYYY-MM-DD)"),
    dateTo:    z.string().optional().describe("End date (YYYY-MM-DD)"),
    validated: z.boolean().optional().describe("Filter by validation status"),
    first:     z.number().optional().describe("Max timesheets to return (default 50)"),
  },
  async (args) => {
    const filter = buildFilter(args);
    const first = args.first ?? 50;
    const query = gql`
      query ListTimeEntries($first: Int!, $filter: String) {
        sevwaysYtimesheet { timeSheet {
          query(first: $first, filter: $filter) { edges { node { ${SHEET_FIELDS} } } }
        } }
      }`;
    const { data, errors } = await runQuery(query, { first, filter });
    const timesheets = sheetsFromData(data);
    return asText({ count: timesheets.length, timesheets, warnings: errors });
  }
);

// ── Tool 2 — get_time_entry (read) ──────────────────────────────────────────
server.tool(
  "get_time_entry",
  { timesheetId: z.string().describe("Timesheet ID, e.g. SW01ONAL26/001531") },
  async ({ timesheetId }) => {
    const filter = JSON.stringify({ timesheetId: { _eq: timesheetId } });
    const query = gql`
      query GetTimeEntry($filter: String) {
        sevwaysYtimesheet { timeSheet {
          query(first: 1, filter: $filter) { edges { node { ${SHEET_FIELDS} } } }
        } }
      }`;
    const { data, errors } = await runQuery(query, { filter });
    const timesheet = sheetsFromData(data)[0];
    if (!timesheet) return asText({ error: `Timesheet not found: ${timesheetId}` });
    return asText({ timesheet, warnings: errors });
  }
);

// ── Tool 3 — list_projects (read) ───────────────────────────────────────────
// Distinct projects referenced by timesheet lines (needs TimesheetLine.read).
server.tool(
  "list_projects",
  { user: z.string().optional().describe("Limit to a user's timesheets (login)") },
  async ({ user }) => {
    const filter = buildFilter({ user });
    const query = gql`
      query ListProjects($filter: String) {
        sevwaysYtimesheet { timeSheet {
          query(first: 200, filter: $filter) { edges { node {
            lines { query(first: 200) { edges { node { project { id localizedDescription } } } } }
          } } }
        } }
      }`;
    const { data, errors } = await runQuery(query, { filter });
    const map = new Map();
    for (const sheet of sheetsFromData(data))
      for (const line of linesOf(sheet))
        if (line.project?.id) map.set(line.project.id, line.project.localizedDescription || "");
    const projects = [...map].map(([id, description]) => ({ id, description }));
    return asText({ count: projects.length, projects, warnings: errors });
  }
);

// ── Tool 4 — create_time_entry (write) ──────────────────────────────────────
// WARNING: creates a record in the SEVWAYS X3 ERP. The agent MUST confirm the
// details with the user before calling this tool.
// NOTE: write operations on the custom node are not yet exposed by X3 (work in
// progress). This attempts the mutation and propagates the real X3 error.
server.tool(
  "create_time_entry",
  {
    user:      z.string().describe("User login, e.g. ONAL"),
    date:      z.string().describe("Date of the timesheet (YYYY-MM-DD)"),
    facility:  z.string().describe("Facility/site code, e.g. SW01"),
  },
  async ({ user, date, facility }) => {
    const mutation = gql`
      mutation CreateTimeEntry($data: TimeSheet_Input!) {
        sevwaysYtimesheet { timeSheet { create(data: $data) { timesheetId date validated } } }
      }`;
    try {
      const data = await client.request(mutation, { data: { user, date, facility } });
      return asText(data.sevwaysYtimesheet.timeSheet.create);
    } catch (err) {
      const msg = err.response?.errors?.map((e) => e.message).join("; ") || err.message;
      return asText({ status: "create not available yet (X3 write operations pending)", x3Error: msg });
    }
  }
);

// ── Tool 5 — update_time_entry (write) ──────────────────────────────────────
// WARNING: modifies a record in the SEVWAYS X3 ERP. The agent MUST confirm with
// the user first. Intended only for timesheets still awaiting validation
// (validated = false). No delete tool is exposed by design.
server.tool(
  "update_time_entry",
  {
    timesheetId: z.string().describe("Timesheet ID to update, e.g. SW01ONAL26/001533"),
    validated:   z.boolean().optional().describe("Set validation status"),
    date:        z.string().optional().describe("New date (YYYY-MM-DD)"),
  },
  async ({ timesheetId, validated, date }) => {
    const data = { timesheetId };
    if (typeof validated === "boolean") data.validated = validated;
    if (date) data.date = date;
    const mutation = gql`
      mutation UpdateTimeEntry($data: TimeSheet_Input!) {
        sevwaysYtimesheet { timeSheet { update(data: $data) { timesheetId date validated } } }
      }`;
    try {
      const res = await client.request(mutation, { data });
      return asText(res.sevwaysYtimesheet.timeSheet.update);
    } catch (err) {
      const msg = err.response?.errors?.map((e) => e.message).join("; ") || err.message;
      return asText({ status: "update not available yet (X3 write operations pending)", x3Error: msg });
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport).then(() => log(`MCP server ready — endpoint ${X3_ENDPOINT}`));
