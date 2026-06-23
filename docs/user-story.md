# user-story.schema.json

User Story document. One file per US. Contains Acceptance Criteria inline as `acceptanceCriteria[]`.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.1.0/user-story.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `usId` | `^US-\d{3,}$` | This story's identifier. |
| `prdId` | `^PRD-\d{3,}$` | The root PRD. |
| `reqId` | `^REQ-\d{3,}$` | The parent REQ. |
| `version` | semver | Per-document version. |
| `status` | `authoringStatus` enum | Lifecycle status. |
| `title` | string, min 1 | One-line title. |
| `asA` | string, min 1 | "As a {asA}..." |
| `iWant` | string, min 1 | "...I want {iWant}..." |
| `soThat` | string, min 1 | "...so that {soThat}." |
| `acceptanceCriteria` | array of `acceptanceCriterion`, min 1 | The testable conditions for this story. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `description` | string | Additional narrative beyond the asA / iWant / soThat triple. |

## Acceptance criterion shape

Each AC inside `acceptanceCriteria[]`:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `id` | `acId` | yes | `AC-201` (flat) or `AC-101-1` (hierarchical). |
| `description` | string, min 1 | yes | One-line description. |
| `given` | string | no | Given/When/Then preamble. |
| `when` | string | no | Trigger. |
| `then` | string | no | Observable outcome. |
| `testable` | boolean | yes | Author declares the AC is testable. |

The Given/When/Then triple is optional at the schema level so non-Gherkin teams aren't forced into it; the `testable` boolean is required to make authors stop and confirm the AC can actually be tested.

## Why ACs stay nested

An AC outside its US is meaningless, the AC's Given/When/Then only makes sense in the context of the asA / iWant / soThat triple. Splitting would multiply file counts 5-10x with no benefit. Granular ids (`AC-101-1`) keep cross-doc references precise.

## Example

See `fixtures/valid/user-story/us-002-hierarchical-acs.json` for a US with three Given/When/Then ACs in the `AC-101-N` hierarchical form.

## AC id form: flat or hierarchical

The pattern `^AC-\d{3,}(-\d+)?$` accepts both:

- **Flat** (`AC-001`, `AC-201`) — fine for projects with a single numeric space.
- **Hierarchical** (`AC-101-1`, `AC-101-2`) — encodes the parent US id, useful for FBS scope queries and grep.

Pick per project; the schema does not enforce either.
