const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { GraphQLClient, gql } = require("graphql-request");
const https = require("https");

// X3 Configuration
const X3_URL      = "https://195.23.16.22:3310/xtrem/api";
const X3_ENDPOINT = "SWPTPRD";
const X3_AUTH     = "Basic T05BTDpBZGVzdGUyNDE2IQ==";

// GraphQL client (ignore self-signed certificate)
const client = new GraphQLClient(X3_URL, {
  headers: {
    "Authorization":    X3_AUTH,
    "x-xtrem-endpoint": X3_ENDPOINT,
  },
  agent: new https.Agent({ rejectUnauthorized: false }),
});

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
    const query = gql`
      query listTimeEntries {
        x3ProjectManagement {
          timeEntryLine {
            query {
              edges {
                node {
                  _id
                  date
                  timeSpent
                  localizedDescription
                  isValidated
                  status
                  project { _id }
                  employee { _id }
                }
              }
            }
          }
        }
      }
    `;
    try {
      const data = await client.request(query);
      let entries = data.x3ProjectManagement.timeEntryLine.query.edges.map(e => e.node);
      if (employee) entries = entries.filter(e => e.employee?._id === employee);
      if (project)  entries = entries.filter(e => e.project?._id === project);
      if (dateFrom) entries = entries.filter(e => e.date >= dateFrom);
      if (dateTo)   entries = entries.filter(e => e.date <= dateTo);
      return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// Tool 2 — Get time entry by ID
server.tool(
  "get_time_entry",
  {
    id: z.string().describe("Time entry ID (e.g. SW01ONAL26/001531)"),
  },
  async ({ id }) => {
    const query = gql`
      query getTimeEntry($id: String!) {
        x3ProjectManagement {
          timeEntryLine {
            byId(id: $id) {
              _id
              date
              timeSpent
              localizedDescription
              isValidated
              status
              project { _id }
              employee { _id }
            }
          }
        }
      }
    `;
    try {
      const data = await client.request(query, { id });
      return { content: [{ type: "text", text: JSON.stringify(data.x3ProjectManagement.timeEntryLine.byId, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// Tool 3 — List projects
server.tool(
  "list_projects",
  {},
  async () => {
    const query = gql`
      query listProjects {
        x3ProjectManagement {
          project {
            query {
              edges {
                node {
                  _id
                  description1
                }
              }
            }
          }
        }
      }
    `;
    try {
      const data = await client.request(query);
      const projects = data.x3ProjectManagement.project.query.edges.map(e => e.node);
      return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
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
    const mutation = gql`
      mutation createTimeEntry($date: Date!, $project: String!, $timeSpent: Decimal!, $description: String) {
        x3ProjectManagement {
          timeEntryLine {
            create(input: {
              employee: { _id: "ONAL" }
              date: $date
              project: { _id: $project }
              timeSpent: $timeSpent
              localizedDescription: $description
            }) {
              _id
              date
              timeSpent
              status
            }
          }
        }
      }
    `;
    try {
      const data = await client.request(mutation, { date, project, timeSpent, description });
      return { content: [{ type: "text", text: JSON.stringify(data.x3ProjectManagement.timeEntryLine.create, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);
