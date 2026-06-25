# GraphQL Snippets — Reference File

> Endpoint: `https://195.23.16.22:3310/xtrem/api`
> Headers:
> ```json
> { "Authorization": "Basic T05BTDpBZGVzdGUyNDE2IQ==", "x-xtrem-endpoint": "SWPTINT" }
> ```
> Node: **custom** `sevwaysYtimesheet` (NOT `x3ProjectManagement.timeEntryLine`).

---

## 1. Introspection — confirm the custom node exists ✅

```graphql
query { __type(name: "TimeSheet") { name description fields { name } } }
```

Also: `__type(name: "TimesheetLine")`, `__type(name: "TimeSheet_Input")`.

---

## 2. List timesheets (header) — working ✅

```graphql
query {
  sevwaysYtimesheet {
    timeSheet {
      query(first: 50) {
        edges { node {
          timesheetId date validated
          facility { code }
          user { login }
        } }
      }
    }
  }
}
```

---

## 3. List filtered by user — working ✅

```graphql
query {
  sevwaysYtimesheet {
    timeSheet {
      query(first: 50, filter: "{user:{login:{_eq:'ONAL'}}}") {
        edges { node { timesheetId date validated } }
      }
    }
  }
}
```

Date range (combine keys — implicit AND):
`filter: "{user:{login:{_eq:'ONAL'}}, date:{_gte:'2026-06-01', _lte:'2026-06-30'}}"`

---

## 4. Get one by timesheetId — working ✅

```graphql
query {
  sevwaysYtimesheet {
    timeSheet {
      query(first: 1, filter: "{timesheetId:{_eq:'SW01ONAL26/001531'}}") {
        edges { node { timesheetId date validated facility { code } user { login } } }
      }
    }
  }
}
```

---

## 5. Header + detail lines — ⏳ needs `TimesheetLine.read` rights

```graphql
query {
  sevwaysYtimesheet {
    timeSheet {
      query(first: 5, filter: "{user:{login:{_eq:'ONAL'}}}") {
        edges { node {
          timesheetId date validated
          lines { query(first: 200) { edges { node {
            lineNumber startTime endTime totalHours billedHours
            taskType taskTitle jiraTask done location
            project { id localizedDescription }
          } } } }
        } }
      }
    }
  }
}
```

> Currently the header returns, but `lines.query` is `null` with the warning
> `"Não tem direitos para realizar esta operação. TimesheetLine.read"` until the
> read right is granted on the X3 side.

---

## 6. Create mutation — ⏳ pending (`sevwaysYtimesheetMutation` not yet exposed)

Expected shape once mutations are wired (the `TimeSheet_Input` type already exists):

```graphql
mutation($data: TimeSheet_Input!) {
  sevwaysYtimesheet {
    timeSheet {
      create(data: $data) { timesheetId date validated }
    }
  }
}
```
```json
{ "data": { "user": "ONAL", "facility": "SW01", "date": "2026-06-25", "validated": false } }
```

---

## 7. Update mutation — ⏳ pending

```graphql
mutation($data: TimeSheet_Input!) {
  sevwaysYtimesheet {
    timeSheet {
      update(data: $data) { timesheetId date validated }
    }
  }
}
```
```json
{ "data": { "timesheetId": "SW01ONAL26/001533", "validated": true } }
```

> No delete snippet — delete is intentionally not used by this project.
