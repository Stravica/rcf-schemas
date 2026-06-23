# fbs.schema.json

Functional Build Specification. One per build session. **Outside the traceability chain**: FBS owns `acIds[]` for build-time work assignment but is not load-bearing for "did REQ-001 get tested?" queries. See `id-conventions.md` for the chain detail.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.1.0/fbs.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `fbsId` | `^FBS-\d{3,}$` | This FBS's identifier. |
| `prdId` | `^PRD-\d{3,}$` | Root PRD. |
| `bsId` | `^BS-\d{3,}$` | Parent Build Sequence. |
| `title` | string, min 1 | One-line title. |
| `summary` | string, min 1 | One-paragraph "what is this build doing". |
| `acIds` | array of `acId`, min 1 | The ACs this build session delivers. Flat top-level array. |
| `status` | `executionStatus` enum | `notStarted`, `inProgress`, `complete`, `verified`. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `approach` | string | "How to think about this build" narrative, distinct from `summary` (what) and `notes` (gotchas). |
| `contextRequirements` | object | What the SDD adapter needs to walk for the BUILD prompt. See below. |
| `dependencies` | array of `fbsId` | Other FBS items this one depends on. The build tool builds a DAG from these. |
| `estimatedSize` | enum: `small`, `medium`, `large` | Rough sizing. |
| `estimatedHours` | number, 0.5..16 | Tighter estimate. |
| `deliverables` | array of strings | Concrete artefacts expected from the build session. |
| `riskLevel` | enum: `low`, `medium`, `high` | Risk classification. |
| `domain` | string | Free-form domain label. |
| `notes` | string | FBS-specific gotchas. |

## `contextRequirements` shape

Tells the SDD adapter (Phase 6 of `rcf-build-lite`) what to walk when assembling the BUILD prompt:

| Field | Type | Purpose |
|---|---|---|
| `prdSections` | array of strings | PRD section names to inline. |
| `tadSections` | array of strings | TAD section names to inline. |
| `tacIds` | array of `tacId` | Specific TACs to inline. |
| `adrIds` | array of `adrId` | Specific ADRs to inline. |
| `existingModules` | array of strings | Source files the build should be aware of. |
| `schemas` | array of strings | Schema files relevant to this build. |
| `externalDocs` | array of strings | Third-party docs (URLs or paths). |
| `other` | array of strings | Anything else. |

## Why flat `acIds[]`

Round-3 had `storyScope: [{ acIds: [...] }]`. The wrapping object served no purpose: the parent US is derivable from each AC id (each AC lives inside its US doc's `acceptanceCriteria[]`). Strict-by-default discipline: if it's derivable, don't store it.

## Why FBS is outside the traceability chain

The RCF traceability chain is `PRD -> REQ -> US -> AC -> TS -> TC`. FBS is a build-time work artefact, useful for "what's being built this session" but not for "did REQ-001 get tested?" Phase 5 traceability tooling in `rcf-build-lite` walks the chain without going through FBS.

## What's NOT here

- **`testableOutcomes`** dropped. Derivable from referenced ACs (each AC's `then` clause IS the testable outcome). SSoT: AC is the source.
- **`constraints`** dropped. Architectural constraints live in TAC / ADR (referenced via `contextRequirements`). FBS-specific gotchas go in `notes`.
- **Markdown narrative.** The schema is pure JSON. The BUILD-phase markdown prompt is assembled at build time by the SDD adapter from JSON FBS + walked references.

## SDD adapter (informative, not in this repo)

`rcf build FBS-XXX` reads the FBS JSON, walks `acIds[]` to parent US ACs, walks `contextRequirements.tacIds[]` and `adrIds[]` to TAC/ADR files, and assembles a single markdown prompt for the coding LLM. The adapter lives in `rcf-build-lite` (Phase 6 of that project). The schemas repo's job is to make sure the FBS schema carries every field the adapter needs.
