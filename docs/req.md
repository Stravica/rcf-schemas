# req.schema.json

Individual Requirement within a PRD. One file per REQ. Recommended path: `rcf/requirements/REQ-001.json`.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.3.0/req.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `reqId` | `^REQ-\d{3,}$` | This requirement's identifier. |
| `prdId` | `^PRD-\d{3,}$` | The parent PRD. |
| `title` | string, min 1 | One-line title. |
| `description` | string, min 1 | One-paragraph description. |
| `category` | enum: `functional`, `nonFunctional`, `technical`, `security` | Per-doc-type enum; lives local to this schema. |
| `domain` | string, min 1 | Free-form domain label (`auth`, `sync`, `billing`, etc.). Authors pick conventions per project. |
| `priority` | enum: `must`, `should`, `could`, `wont` | MoSCoW. |
| `version` | semver string | Per-document version. |
| `status` | `authoringStatus` enum | `draft`, `review`, `needsRevision`, `approved`, `superseded`. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `rationale` | string | Why this REQ exists. |
| `tags` | array of strings | Free-form tags for grouping or filtering. |

## Why REQ is its own file

REQs grow over time, and a single PRD can carry hundreds. Inline REQ bodies on the PRD shell hit the GitHub API 1 MB file-fetch limit on rich PRDs and create merge-conflict pressure on the PRD whenever any REQ is edited. One file per REQ gives per-REQ git history, parallel-safe authoring, and a shell PRD that stays small. Same reasoning as ADR-per-file, TAC-per-file, FBS-per-file, US-per-file.

## Cross-doc consistency

The schema validates each REQ in isolation. Whether the `prdId` back-reference resolves to a loaded PRD is a walker-time referential-integrity check (Phase 5 traceability in `rcf-build-lite`), not a schema one.

## Example

```json
{
  "reqId": "REQ-001",
  "prdId": "PRD-001",
  "title": "Capture markdown notes",
  "description": "The system must let a user write a markdown note and persist it.",
  "category": "functional",
  "domain": "capture",
  "priority": "must",
  "version": "0.1.0",
  "status": "draft",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

Fuller example in `fixtures/valid/req/req-002-comprehensive.json`; invalid cases in `fixtures/invalid/req/`.
