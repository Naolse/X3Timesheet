# X3Timesheet — MCP Server para SAGE X3

Servidor **MCP (Model Context Protocol)** que permite a agentes de IA (ex.: Claude)
**consultar e registar timesheets** diretamente no SAGE X3 da SEVWAYS, através da
sua API GraphQL.

> Estágio SEVWAYS — Desenvolvimento de MCP Server sobre SAGE X3 GraphQL.
> Âmbito: registo de timesheets. Uso interno / investigação.

---

## O que aprendi sobre time entries no X3

Na SEVWAYS, o registo de horas **não** usa o módulo standard de Project Management
(`timeEntryLine`). Usa um **objeto custom** desenvolvido internamente — o ecrã
`GESYTS`, exposto na API GraphQL como o nó **`sevwaysYtimesheet.timeSheet`**.

Cada Time Sheet representa **um dia de trabalho** de um utilizador e tem dois níveis:

**Cabeçalho (`TimeSheet`)** — identifica o registo:
- **timesheetId** — identificador único, formato `[Estab][User][Ano]/[Sequência]` (ex.: `SW01ONAL26/001531`)
- **facility** — estabelecimento (ex.: `SW01`)
- **user** — colaborador (ex.: `ONAL`)
- **date** — dia a que as horas dizem respeito
- **validated** — se foi aprovado pelo responsável

**Linhas (`TimesheetLine`)** — trabalho realizado nesse dia:
- **project** — projeto onde as horas são imputadas
- **businessPartner** — cliente associado
- **startTime / endTime** — hora de início e fim (formato `HHMM`)
- **totalHours / billedHours / interruptionHours** — horas trabalhadas, faturadas, de interrupção
- **taskType** — tipo de tarefa (`suporte`, `desenvolvimento`, `correcaoBug`, `reuniao`, …)
- **taskTitle / jiraTask** — título da tarefa e ticket JIRA
- **location** — `remoto` ou `presencial`
- **done / overtime / visible** — flags

Modelo completo e classificação dos campos: [`docs/graphql-field-map.md`](docs/graphql-field-map.md)
e [`docs/time-entry-model.md`](docs/time-entry-model.md).

---

## Ferramentas MCP

| Tool | Tipo | Estado | Descrição |
|---|---|---|---|
| `list_time_entries` | leitura | ✅ funcional (cabeçalho) | Lista timesheets, com filtros `user` / `dateFrom` / `dateTo` / `validated` |
| `get_time_entry` | leitura | ✅ funcional (cabeçalho) | Obtém um timesheet por `timesheetId` |
| `list_projects` | leitura | ⏳ depende de `TimesheetLine.read` | Projetos distintos referenciados nas linhas |
| `create_time_entry` | escrita | ⏳ mutations pendentes no X3 | Cria um timesheet (confirma com o utilizador antes) |
| `update_time_entry` | escrita | ⏳ mutations pendentes no X3 | Atualiza um timesheet ainda não validado |

> **Sem delete** — por opção de design, o servidor não expõe operações de eliminação.
> Estado atual do acesso: leitura do cabeçalho ativa; leitura das `lines` e mutations
> em curso do lado do X3 (ver [`docs/time-entry-model.md`](docs/time-entry-model.md)).

---

## Instalação

```bash
npm install
```

### Ligar ao Claude Desktop

Adicionar ao `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sevways-x3-timesheet": {
      "command": "node",
      "args": ["C:/Users/Alex/X3Timesheet/index.js"]
    }
  }
}
```

Reiniciar o Claude Desktop e confirmar que as tools aparecem.

---

## Arquitetura

```
Claude  ──MCP (stdio/JSON-RPC)──►  index.js  ──GraphQL──►  SAGE X3 /xtrem/api
                                  (este server)            sevwaysYtimesheet.timeSheet
```

- Transporte **stdio** — logging exclusivamente via `console.error` (stdout é do protocolo).
- Autenticação **Basic Auth** (utilizador ONAL) — migração para JWT/Connected App prevista.
- Endpoint GraphQL: `x-xtrem-endpoint: SWPTINT`.
- Erros do X3 são **propagados** (não engolidos) como `warnings` no resultado.

## Stack

Node.js 18+ · `@modelcontextprotocol/sdk` · `graphql-request` · `zod`
