# TimeEntryLine — Field Map

> Source: GraphQL introspection of `TimeEntryLine` type + UI observation  
> Endpoint: `https://195.23.16.22:3310/xtrem/api`  
> Package: `x3ProjectManagement`

## Additional fields observed in UI (Time Sheet - Sevways)

| UI Label | GraphQL field (likely) | Notes |
|---|---|---|
| Tipo | `entryType` | Type of entry (e.g. Suport) |
| Contacto | — | Contact person |
| Título Tarefa | `localizedDescription` | Short task title (e.g. "Registo de data") |
| Tarefas JIRA | — | JIRA ticket reference (custom field?) |
| Descrição Tarefa | `longDescription` | Long task description |

---

## Field Classification

### 🔒 Read-Only (system fields — cannot be set)

| Field | Type | Description |
|---|---|---|
| `_id` | ID | Unique identifier of the record |
| `_createUser` | SysUser | User who created the record |
| `_updateUser` | SysUser | User who last updated the record |
| `_createStamp` | Datetime | Creation timestamp |
| `_updateStamp` | Datetime | Last update timestamp |
| `_etag` | String | Optimistic concurrency token |
| `_access` | List | Access bindings |
| `status` | Enum (TimeEntryStatus) | Current status (Awaiting, Validated, Rejected...) |
| `origin` | Enum (TimeEntryOrigin) | How entry was created |
| `isValidated` | Boolean | Whether entry is validated |
| `validatedBy` | User | Who validated |
| `approvedBy` | User | Who approved |
| `rejectedBy` | User | Who rejected |
| `controlledBy` | User | Who controlled |
| `postedBy` | User | Who posted |
| `journal` | Journal | Accounting journal reference |
| `journalNumber` | String | Accounting journal number |
| `accountingDate` | Date | Date of accounting posting |
| `billedQuantity` | Decimal | Quantity already billed |
| `lineNumber` | Int | Line number (auto-assigned) |
| `connectedEmployee` | ProjectUser | Linked employee (computed) |
| `defaultTimeCategory` | TimeCategory | Default category (computed) |
| `defaultUnit` | UnitOfMeasure | Default unit (computed) |
| `isNegativeTimeSpentAllowed` | Boolean | Business rule flag |
| `isTimeEntryAdministrator` | Boolean | Permission flag |
| `isTimeEntryEmployee` | Boolean | Permission flag |
| `isValidatedDefault` | Boolean | Default validation flag |

---

### ✅ Required on Creation (must be provided)

| Field | Type | Description |
|---|---|---|
| `employee` | ProjectUser | The employee logging the hours |
| `date` | Date | Date of the work |
| `project` | Project | Project where hours are logged |
| `timeSpent` | Decimal | Number of hours worked |

---

### 🔧 Optional on Creation

| Field | Type | Description |
|---|---|---|
| `task` | Task | Specific task within the project |
| `taskLink` | ProjectLink | Link to task |
| `budgetLink` | ProjectLink | Link to budget |
| `operation` | Operation | Manufacturing operation (if applicable) |
| `assignmentLine` | OperationAssignment | Assignment line |
| `budget` | Budget | Budget reference |
| `financialSite` | Site | Financial site |
| `currency` | Currency | Currency for billing |
| `rateType` | Enum (ExchangeRateType) | Exchange rate type |
| `projectCostType` | CostType | Cost type for project |
| `employeeCostType` | CostType | Cost type for employee |
| `projectLaborRate` | Decimal | Labor rate for project |
| `employeeLaborRate` | Decimal | Labor rate for employee |
| `unit` | UnitOfMeasure | Unit of measure (hours, days...) |
| `timeCategory` | TimeCategory | Category of time (normal, overtime...) |
| `rateMultiplier` | Decimal | Rate multiplier |
| `localizedDescription` | String | Short description of work done |
| `isBillable` | Boolean | Whether hours are billable |
| `billableFrom` | Date | Date from which hours are billable |
| `longComment` | TextStream | Long comment |
| `longDescription` | TextStream | Long description |
| `entryType` | EntryType | Type of entry |
| `firstOperationSplit` | Int | Operation split index |
| `currencyRates` | Collection | Currency rate lines |
| `dimensions` | Collection | Dimension lines |
| `billingPlan` | ProjectBillingPlan | Billing plan |
| `billingPlanLine` | ProjectBillingPlanLine | Billing plan line |

---

## Minimum viable create mutation fields

```graphql
mutation createTimeEntry {
  x3ProjectManagement {
    timeEntryLine {
      create(input: {
        employee: { _id: "ONAL" }
        date: "2026-06-01"
        project: { _id: "SW012403000255" }
        timeSpent: 8
        localizedDescription: "Desenvolvimento MCP Server"
      }) {
        _id
        date
        timeSpent
        status
      }
    }
  }
}
```
