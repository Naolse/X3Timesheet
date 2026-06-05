# GraphQL Snippets — Reference File

> Endpoint: `https://195.23.16.22:3310/xtrem/api`  
> Headers required:
> ```json
> {
>   "Authorization": "Basic T05BTDpBZGVzdGUyNDE2IQ==",
>   "x-xtrem-endpoint": "SWPTPRD"
> }
> ```

---

## 1. List Business Partners (warm-up — working ✅)

```graphql
query listBusinessPartners {
  x3MasterData {
    businessPartner {
      query {
        edges {
          node {
            _id
          }
        }
      }
    }
  }
}
```

---

## 2. List Time Entries (blocked — TimeEntryLine.read not activated ❌)

```graphql
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
            project {
              _id
            }
            employee {
              _id
            }
          }
        }
      }
    }
  }
}
```

---

## 3. List Time Entries with filters (to be tested)

```graphql
query listTimeEntriesFiltered {
  x3ProjectManagement {
    timeEntryLine {
      query(filter: "{employee:{_id:{_eq:'ONAL'}}}") {
        edges {
          node {
            _id
            date
            timeSpent
            localizedDescription
            isValidated
            project {
              _id
            }
          }
        }
      }
    }
  }
}
```

---

## 4. Get Time Entry by ID (to be tested)

```graphql
query getTimeEntry {
  x3ProjectManagement {
    timeEntryLine {
      byId(id: "REPLACE_WITH_ID") {
        _id
        date
        timeSpent
        localizedDescription
        isValidated
        status
        project {
          _id
        }
        employee {
          _id
        }
      }
    }
  }
}
```

---

## 5. Create Time Entry mutation (to be tested)

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

---

## 6. Update Time Entry mutation (to be tested)

```graphql
mutation updateTimeEntry {
  x3ProjectManagement {
    timeEntryLine {
      update(id: "REPLACE_WITH_ID", input: {
        timeSpent: 4
        localizedDescription: "Desenvolvimento MCP Server - atualizado"
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
