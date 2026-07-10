# prd.schema.json

Product Requirements Document. One per project. Pure shell document; REQ bodies live in [req.schema.json](./req.md) files and each REQ carries the mandatory `prdId` back-reference. The walker computes the PRD's requirement list by inverting `REQ.prdId` at load time.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.3.0/prd.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `prdId` | `^PRD-\d{3,}$` | The PRD identifier. |
| `productName` | string, min 1 | Human-readable product name. |
| `version` | semver string | Per-document version, independent of the schema bundle's. |
| `status` | `authoringStatus` enum | `draft`, `review`, `needsRevision`, `approved`, `superseded`. |
| `problemStatement` | string, min 1 | One-paragraph framing of the problem the product solves. |
| `objectives` | array, min 1 | Outcomes the product is judged on. |
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

- **REQ bodies.** The PRD is a shell. REQ content lives in [req.schema.json](./req.md) files; each REQ carries the mandatory `prdId` back-reference. The walker inverts these to produce the PRD's requirement list.
- **`requirementIds[]`.** Removed in 0.2.0; parents no longer store child lists.
- **Architecture.** That belongs in [tad.schema.json](./tad.md).
- **Test suites.** Those live per US, see [test-suite.schema.json](./test-suite.md).

## Example

```json
{
  "prdId": "PRD-001",
  "productName": "Acme Notes",
  "version": "0.1.0",
  "status": "draft",
  "problemStatement": "Users keep losing track of meeting notes scattered across tools.",
  "objectives": ["Single home for personal notes across devices."],
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

Each REQ carries `prdId`; the walker inverts these into a `childrenByParent` map to walk PRD -> REQ. Each US in turn carries `reqId` for the next hop.
