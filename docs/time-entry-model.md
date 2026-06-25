# Time Entry — Modelo, Operações e Investigação Custom

> Entregável da Semana 2 do estágio. Documenta o modelo de dados do timesheet,
> as operações disponíveis na API GraphQL, e a investigação que levou à
> descoberta de que a SEVWAYS usa um **objeto custom**, não o standard do X3.

---

## 1. Resumo executivo

A SEVWAYS regista timesheets num **objeto desenvolvido à medida** (ecrã `GESYTS`),
exposto na API GraphQL como o nó custom **`sevwaysYtimesheet.timeSheet`**. O nó
standard do Project Management (`x3ProjectManagement.timeEntryLine`) existe no
schema mas **não é utilizado** pela empresa.

Estado do acesso à API (endpoint `SWPTINT`):

| Operação | Estado |
|---|---|
| `timeSheet` (cabeçalho) — leitura | ✅ ativa |
| `timesheetLine` (linhas) — leitura | ⏳ direito `TimesheetLine.read` por conceder |
| `create` / `update` (escrita) | ⏳ mutations por expor (`sevwaysYtimesheetMutation` ainda nulo) |
| Standard `timeEntryLine` | ❌ não usado / não ativado |

---

## 2. Modelo de dados

Dois níveis — cabeçalho (`TimeSheet`) e linhas de detalhe (`TimesheetLine`).
Mapa completo dos campos, tipos e classificação: **[`graphql-field-map.md`](graphql-field-map.md)**.

### Cabeçalho `TimeSheet`
`timesheetId` (auto), `facility` (Site), `user` (User), `date`, `validated`,
`lines` (coleção de `TimesheetLine`).

### Linha `TimesheetLine`
`lineNumber`, `project`, `businessPartner`, `startTime`/`endTime` (`HHMM`),
`totalHours`, `interruptionHours`, `billedHours`, `overtime`, `taskType`,
`taskTitle`, `jiraTask`, `done`, `location`, `contact`, `visible`.

**Enums:** `Local` = {`remoto`, `presencial`}; `TipoTarefa` = {`suporte`,
`desenvolvimento`, `correcaoBug`, `explicacao`, `formacao`, `reuniao`, `testes`,
`interno`, `implementacao`, `ausencia`}.

### Regras funcionais
- Cada `TimeSheet` corresponde a **um dia** de um utilizador.
- Pode ter **várias linhas** (vários projetos/tarefas no mesmo dia).
- `timesheetId` é gerado automaticamente: `[Facility][User][Ano]/[Sequência]`.
- `project` na linha é uma **referência obrigatória**.

---

## 3. Operações na API GraphQL

Snippets testados e prontos: **[`graphql-snippets.md`](graphql-snippets.md)**.

- **Leitura (query):** `sevwaysYtimesheet.timeSheet.query(first, filter)`.
  Filtro é uma string JSON: `"{user:{login:{_eq:'ONAL'}}}"`, com operadores
  `_eq`/`_gte`/`_lte`; combinar chaves faz AND implícito.
- **Por ID:** filtro `"{timesheetId:{_eq:'...'}}"`.
- **Escrita:** `create(data: TimeSheet_Input!)` / `update(data: TimeSheet_Input!)`
  — tipos de input já existem, mutations por ativar.
- **Delete:** não utilizado (decisão de design — ver §6).

---

## 4. Investigação custom (como chegámos aqui)

O processo (documentado porque é o entregável, não só o resultado):

1. **Hipótese inicial (errada):** o briefing assume o nó standard `timeEntryLine`.
   A introspeção mostrou que ele existe (≈50 campos), mas todas as operações
   devolviam `"Operação TimeEntryLine.read não está ativada pela configuração da
   aplicação"`.
2. **Verificação cruzada:** outros módulos (`x3MasterData.businessPartner`,
   `x3System.user`) liam dados normalmente no mesmo endpoint → o acesso à API
   funcionava; só o Project Management standard estava desativado.
3. **Pista funcional:** o mentor funcional (José Marcos) confirmou que as
   timesheets da SEVWAYS **não pertencem a esse módulo** — o ecrã usado é o
   `GESYTS` (desenvolvimento custom; prefixo `Y` = reservado a clientes no X3).
4. **Confirmação por enumeração:** percorrendo **todos** os nós de **todos** os
   pacotes do schema (8255 tipos OBJECT), o único nó de timesheet standard era o
   `timeEntryLine`. O objeto custom **não estava exposto** na API.
5. **Resolução:** o objeto custom foi **publicado como nó GraphQL**
   (`sevwaysYtimesheet`). A partir daí, a leitura do cabeçalho passou a devolver
   dados reais (ex.: `SW01ONAL26/001531`).

**Lição (4 Ds — Discernment):** introspeção mostra a *estrutura* mesmo com
operações desativadas; ter dados ≠ ter o nó certo. Validar sempre o objeto
funcional real com quem conhece o domínio antes de construir.

### Mecanismo de ativação no X3 (para a equipa)
A exposição de um objeto custom na API GraphQL envolve, do lado do X3:
publicar o nó (X3 Builder / node bindings, `GESANODEB`), ativar as operações
desejadas (`GESAPIOPE` — flag *Active* + *Validation*) e conceder os direitos de
operação ao utilizador/perfil (`read`, e depois `create`/`update`). Em falta
neste momento: direito `TimesheetLine.read` e as mutations.

---

## 5. Spec proposta — mutations custom (create / update)

| | |
|---|---|
| **create** | `sevwaysYtimesheet.timeSheet.create(data: TimeSheet_Input!)` |
| Inputs (cabeçalho) | `user` (req), `facility` (req), `date` (req), `validated` (opc, default false) |
| Inputs (linhas) | via `TimesheetLine_Input`: `project` (req), `startTime`, `endTime`, `taskType`, `taskTitle`, `location`, … |
| Output | `{ timesheetId, date, validated }` |
| Validações | `date` válida; `project` existente; `endTime > startTime`; `taskType`/`location` ∈ enum |
| **update** | só permitido enquanto `validated = false` (não validado) |

Referências (`user`, `facility`, `project`, `businessPartner`) passam como
**ExternalReference** (código natural); enums via `*_EnumInput`.

---

## 6. Decisões de design (4 Ds — Diligence)

- **Sem delete:** o servidor MCP nunca expõe eliminação. Em uso interno,
  escrever pode-se reverter; apagar não.
- **Confirmação antes de escrever:** a descrição das tools `create`/`update`
  declara explicitamente que criam/alteram um registo no ERP e que o agente deve
  confirmar com o utilizador antes de chamar.
- **Propagar erros:** os erros do X3 são devolvidos como `warnings`, nunca
  engolidos — o agente precisa de os ver para se corrigir.
- **Logging em stderr:** `console.error` apenas; stdout é do protocolo MCP.

---

## 7. Próximos passos

1. **X3:** conceder `TimesheetLine.read` → ativa as linhas de detalhe (sem
   alteração de código no servidor).
2. **X3:** expor as mutations `create`/`update` no nó custom.
3. **MCP:** assim que as mutations existirem, validar `create_time_entry` /
   `update_time_entry` (já implementadas como stubs que propagam o erro real).
4. **Semana 5:** migrar de Basic Auth para JWT / Connected App.
