# tad.schema.json

Master Technical Architecture Document. One per project. Pure shell for cross-cutting concerns; TAC and ADR each carry the mandatory `tadId` back-reference. The walker computes the TAD's component and decision lists by inverting `TAC.tadId` and `ADR.tadId` at load time. The schema defines the FULL set of possible sections; what's required for a given project is a tooling decision.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.3.0/tad.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `tadId` | `^TAD-\d{3,}$` | TAD identifier. |
| `prdId` | `^PRD-\d{3,}$` | Root PRD. |
| `version` | semver | Per-document version. |
| `status` | `authoringStatus` enum | Lifecycle status. |
| `systemOverview` | object | See sub-schema below. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional sections (all top-level)

When present, each section's own required fields apply.

| Field | When useful |
|---|---|
| `architecturePrinciples` | If the project codifies design principles. |
| `dataArchitecture` | For systems with non-trivial data stores or flows. |
| `integrationArchitecture` | For systems with external APIs or events. |
| `securityArchitecture` | For systems with non-trivial auth or threat models. |
| `deploymentArchitecture` | For systems with deployment topology worth describing. |
| `operationalConcerns` | For long-running services. |

## Sub-schemas (in `$defs`)

### `systemOverview` (required)

`executiveSummary`, `systemPurpose`, `architecturalApproach`, `keyCapabilities[]` (all required, non-empty).

### `principle`

Used inside `architecturePrinciples[]`. Required: `name`, `description`, `rationale`.

### `dataArchitecture`

Required: `dataStores[]` (each `{name, kind, purpose?}`), `coreEntities[]` (each `{name, description?}`). Optional: `dataFlow`, `retention`.

### `integrationArchitecture`

Required: `apiDesign`. Optional: `externalSystems[]`, `eventModel`.

### `securityArchitecture`

Required: `authenticationPattern`, `authorizationModel`. Optional: `secretsManagement`, `threatModel`, `complianceRequirements[]`.

### `deploymentArchitecture`

Required: `targetEnvironment`. Optional: `topology`, `scaling`, `cicd`.

### `operationalConcerns`

Required: `healthChecks`, `logging`. Optional: `metrics`, `alerting`, `backup`, `disasterRecovery`.

## TAD decomposition

TAD + TAC + ADR is intentional. The v1 monolithic TAD ran to thousands of lines and produced useless git history. Decomposition gives:

- **TAD** - project-wide architecture (overview + cross-cutting concerns).
- **TAC** (`tac.schema.json`) - one per architectural component, verbose descriptions OK. Each TAC carries `tadId`.
- **ADR** (`adr.schema.json`) - one per architectural decision, one file each (Nygard convention). Each ADR carries `tadId`.

## What's NOT here

- **Component bodies.** Live in [tac.schema.json](./tac.md); each TAC carries the mandatory `tadId` back-reference. The walker inverts these to produce the TAD's TAC list.
- **Decision bodies.** Live in [adr.schema.json](./adr.md); each ADR carries the mandatory `tadId` back-reference. The walker inverts these to produce the TAD's ADR list.
- **`componentIds[]` and `architecturalDecisionIds[]`.** Removed in 0.2.0; parents no longer store child lists.
- **Generation metadata.** LLM call counts, token usage, generation timestamps belong to tooling (e.g. `.rcf/generation-log.json` sidecar). The schema describes the document only.
