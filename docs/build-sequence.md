# build-sequence.schema.json

Build Sequence. One per project. Pure planning shell. FBS files each carry the mandatory `bsId` back-reference plus `buildOrder` and `executionStatus`. The walker computes the ordered FBS list by loading every FBS under `rcf/fbs/`, filtering by `bsId`, and sorting by `buildOrder`. Duplicate `buildOrder` values within one BS are a validation error at walker load time.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.3.0/build-sequence.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `bsId` | `^BS-\d{3,}$` | This Build Sequence's identifier. |
| `prdId` | `^PRD-\d{3,}$` | Root PRD. |
| `version` | semver | Per-document version. |
| `status` | `authoringStatus` enum | Lifecycle status of the sequence itself. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional top-level fields

| Field | Type | Purpose |
|---|---|---|
| `title` | string | Human-readable title for the sequence. |
| `buildPhilosophy` | string | One-paragraph "how we're going to attack this". |
| `generationStrategy` | enum: `verticalSlice`, `dependencyFirst`, `domainGrouped`, `riskFrontLoaded` | The strategy used to order FBS items. |

## Ordering and execution status

Live on the FBS file, not on the BS. Each FBS carries:

- `bsId` - parent BS.
- `buildOrder` (integer >= 1) - position in the ordered sequence. Duplicates within one BS are a walker-time validation error.
- `executionStatus` - `notStarted`, `inProgress`, `complete`, `verified`.
- `dependsOnFbsIds[]` - other FBS ids this one depends on. Present on the derived (FBS) side; the walker inverts these into a dependents map at load time.

**No `fbs[]` array on the BS.** Removed in 0.2.0. This eliminates the sync burden between the BS slot and the FBS file and makes drift impossible by construction.

## Why this minimum-viable shape

The BS exists to encode strategy and high-level context. Ordering, execution status, and dependencies live on the FBS file so that inserting, reordering, or deleting an FBS is a single-file edit. One source of truth, no drift risk.

## Example

See `fixtures/valid/build-sequence/bs-002-comprehensive.json` for a BS with a `verticalSlice` strategy. FBS ordering examples: `fixtures/valid/fbs/`.
