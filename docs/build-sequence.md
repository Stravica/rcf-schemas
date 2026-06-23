# build-sequence.schema.json

Build Sequence. One per project. Pure ordering plan: references FBS items by id. FBS dependencies live on the FBS file, not on the BS slot, single source of truth.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.1.0/build-sequence.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `bsId` | `^BS-\d{3,}$` | This Build Sequence's identifier. |
| `prdId` | `^PRD-\d{3,}$` | Root PRD. |
| `version` | semver | Per-document version. |
| `status` | `authoringStatus` enum | Lifecycle status of the sequence itself. |
| `fbs` | array, min 1 | Ordered FBS slots. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional top-level fields

| Field | Type | Purpose |
|---|---|---|
| `title` | string | Human-readable title for the sequence. |
| `buildPhilosophy` | string | One-paragraph "how we're going to attack this". |
| `generationStrategy` | enum: `verticalSlice`, `dependencyFirst`, `domainGrouped`, `riskFrontLoaded` | The strategy used to order FBS items. |

## FBS slot shape

Each entry in `fbs[]`:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `fbsId` | `fbsId` | yes | The FBS this slot refers to. |
| `order` | integer >= 1 | yes | The order in the sequence. |
| `status` | `executionStatus` enum | no | `notStarted`, `inProgress`, `complete`, `verified`. Optional convenience for tooling that wants a per-slot status; the FBS file's `status` is the source of truth. |
| `notes` | string | no | Slot-specific notes (e.g. "blocked on ADR-100"). |

**No `dependencies` field on the slot.** Dependencies live on the FBS file itself (`fbs.schema.json`). The build tool reconstructs the DAG by reading each FBS once and computing parallel-safe execution groups (Kahn's algorithm). One source of truth, no drift risk.

## Why this minimum-viable shape

The BS exists to encode ordering and high-level execution metadata. Everything else, what an FBS contains, what it depends on, what ACs it covers, lives on the FBS file. Keeping BS tight makes it easy to reorder slots and reason about strategy without churn on per-FBS detail.

## Example

See `fixtures/valid/build-sequence/bs-002-comprehensive.json` for a four-slot BS with mixed execution statuses and a `verticalSlice` strategy.
