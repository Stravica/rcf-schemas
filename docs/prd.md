# prd.schema.json

Product Requirements Document. One per project. Shell document carrying `requirementIds[]`; REQ bodies live in [req.schema.json](./req.md) files.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.1.0/prd.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `prdId` | `^PRD-\d{3,}$` | The PRD identifier. |
| `productName` | string, min 1 | Human-readable product name. |
| `version` | semver string | Per-document version, independent of the schema bundle's. |
| `status` | `authoringStatus` enum | `draft`, `review`, `needsRevision`, `approved`, `superseded`. |
| `problemStatement` | string, min 1 | One-paragraph framing of the problem the product solves. |
| `objectives` | array, min 1 | Outcomes the product is judged on. |
| `requirementIds` | array of `reqId`, min 1 | The REQs that belong to this PRD. Each REQ lives in its own file. |
| `createdAt` | ISO 8601 date-time | First creation. |
| `updatedAt` | ISO 8601 date-time | Last update. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `executiveSummary` | string | One-paragraph summary above the fold. |
| `targetUsers` | array of strings | The user populations the product addresses. |
| `inScope` | array of strings | What is included in this product. |
| `outOfScope` | array of strings | What is deliberately left out, to head off scope creep. |
| `constraints` | array of strings | Hard limits (budget, technology, regulatory). |

## What's NOT here

- **REQ bodies.** The PRD is a shell. REQ content lives in [req.schema.json](./req.md) files referenced via `requirementIds[]`.
- **Architecture.** That belongs in [tad.schema.json](./tad.md).
- **Test suites.** Those live with the implementation per AC, see [test-suite.schema.json](./test-suite.md).

## Example

```json
{
  "prdId": "PRD-001",
  "productName": "Acme Notes",
  "version": "0.1.0",
  "status": "draft",
  "problemStatement": "Users keep losing track of meeting notes scattered across tools.",
  "objectives": ["Single home for personal notes across devices."],
  "requirementIds": ["REQ-001"],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

Fuller and minimal valid examples: `fixtures/valid/prd/`. Invalid examples illustrating common rejection cases: `fixtures/invalid/prd/`.

## Traceability

A PRD is the root of the requirements chain.

```
PRD -> REQ -> US -> AC -> TS -> TC
```

`requirementIds[]` is how children are discovered from the PRD root. Each REQ in turn carries its own US discoverability via convention (USs reference their parent REQ).
