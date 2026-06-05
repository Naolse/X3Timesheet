const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const X3_URL = "https://195.23.16.22:3310/xtrem/api";
const X3_ENDPOINT = "SWPTPRD";
const X3_AUTH = "Basic T05BTDpBZGVzdGUyNDE2IQ==";

// TODO: replace mock data with real GraphQL calls when x3ProjectManagement is activated
const MOCK_TIME_ENTRIES = [
  { _id: "SW01ONAL26/001531", date: "2026-06-01", timeSpent: 8, localizedDescription: "Desenvolvimento MCP Server", project: { _id: "SW012403000255" }, employee: { _id: "ONAL" }, isValidated: false },
  { _id: "SW01ONAL26/001533", date: "2026-05-30", timeSpent: 8, localizedDescription: "Investigação GraphQL X3",    project: { _id: "SW012403000255" }, employee: { _id: "ONAL" }, isValidated: false },
  { _id: "SW01ONAL26/001534", date: "2026-05-29", timeSpent: 8, localizedDescription: "Estudo X3 Builder",          project: { _id: "SW012403000255" }, employee: { _id: "ONAL" }, isValidated: false },
];

const MOCK_PROJECTS = [
  { _id: "SW012403000255", description: "SEVWAYS ESTÁGIOS" },
  { _id: "SW012009000054", description: "SEVWAYS ANGOLA ADMINISTRATIVO" },
  { _id: "SW012008000012", description: "PSL MARKETING" },
];

const server = new McpServer({
  name: "sage-x3-timesheet",
  version: "1.0.0"
});

// Tool 1 — List time entries
server.tool(
  "list_time_entries",
  {
    employee: z.string().optional().describe("Employee code (e.g. ONAL)"),
    project:  z.string().optional().describe("Project code (e.g. SW012403000255)"),
    dateFrom: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    dateTo:   z.string().optional().describe("End date (YYYY-MM-DD)"),
  },
  async ({ employee, project, dateFrom, dateTo }) => {
    // TODO: replace with real GraphQL query when x3ProjectManagement is activated
    let entries = MOCK_TIME_ENTRIES;
    if (employee) entries = entries.filter(e => e.employee._id === employee);
    if (project)  entries = entries.filter(e => e.project._id === project);
    if (dateFrom) entries = entries.filter(e => e.date >= dateFrom);
    if (dateTo)   entries = entries.filter(e => e.date <= dateTo);

    return {
      content: [{ type: "text", text: JSON.stringify(entries, null, 2) }]
    };
  }
);

// Tool 2 — Get time entry by ID
server.tool(
  "get_time_entry",
  {
    id: z.string().describe("Time entry ID (e.g. SW01ONAL26/001531)"),
  },
  async ({ id }) => {
    // TODO: replace with real GraphQL query when x3ProjectManagement is activated
    const entry = MOCK_TIME_ENTRIES.find(e => e._id === id);
    if (!entry) {
      return { content: [{ type: "text", text: `Time entry ${id} not found.` }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
  }
);

// Tool 3 — List projects
server.tool(
  "list_projects",
  {},
  async () => {
    // TODO: replace with real GraphQL query when x3ProjectManagement is activated
    return {
      content: [{ type: "text", text: JSON.stringify(MOCK_PROJECTS, null, 2) }]
    };
  }
);

// Tool 4 — Create time entry
server.tool(
  "create_time_entry",
  {
    date:        z.string().describe("Date of work (YYYY-MM-DD)"),
    project:     z.string().describe("Project code (e.g. SW012403000255)"),
    timeSpent:   z.number().describe("Hours worked (e.g. 8)"),
    description: z.string().optional().describe("Description of work done"),
  },
  async ({ date, project, timeSpent, description }) => {
    // TODO: replace with real GraphQL mutation when x3ProjectManagement is activated
    const newEntry = {
      _id: `SW01ONAL26/MOCK${Date.now()}`,
      date,
      timeSpent,
      localizedDescription: description || "",
      project: { _id: project },
      employee: { _id: "ONAL" },
      isValidated: false,
    };
    return {
      content: [{ type: "text", text: `[MOCK] Time entry created:\n${JSON.stringify(newEntry, null, 2)}` }]
    };
  }
);

const transport = new StdioServerTransport();
server.connect(transport);
