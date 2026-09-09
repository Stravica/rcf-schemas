# user-story.schema.json

User Story document. One file per US. Contains Acceptance Criteria inline as `acceptanceCriteria[]`.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.6.0/user-story.schema.json`

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
| `tacIds` | array of `tacId` | Cross-link to TAC components this story exercises. |
| `tags` | array of string | Free-form tag list (0.6.0). Same shape as `req.tags`. Consumers may impose local conventions (for example, the rcf-lite blueprint-authoring checklist requires `blueprint:<slug>` on every US a blueprint contributes). Optional at schema; absence is not an error. |

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
| `scope` | `scopeTag` enum | no | `library`, `runtime`, `deployed`, `unclassified`. Optional at schema level (0.4.3). Names the scope at which the AC is observable; governs which test scopes count as coverage. |
| `determinism` | enum: `deterministic`, `nonDeterministic` | no | 0.6.0. Author's declaration of whether the AC's observable output is deterministic or non-deterministic (LLM-generated text, ranked results, generated code, judgement calls). Optional at schema level; absence is treated as `deterministic` by every consumer. Governs whether an EVAL is required by `rcf audit eval coverage --strict` and whether the merge gate emits `EVAL-MISSING` / `EVAL-BELOW-THRESHOLD` per-AC verdicts. |
| `ownerRef` | object: `{tacId?, adrId?, field?}` | no | 0.6.2. Back-reference naming the owning TAC or ADR the criterion observes rather than restating. `tacId` and `adrId` re-use the shared id patterns; `field` is an optional dotted path into the owning record (for example, `interfaces.principal.fields` or `decision.retryPolicy`) pinpointing the surface. All sub-fields optional at schema level so the record composes additively; consumers may require at least one of `tacId` or `adrId` when the criterion references an owning artefact. `additionalProperties: false`. |
| `disposition` | enum: `fixed`, `template` | no | 0.6.2. Marks whether the criterion is the blueprint's to fix (mechanism-invariant, inherited unchanged by every applying project) or the applying agent's to set (project-parameterised, shape-given and value-open). Optional at schema level; consumer rulesets that gate blueprint contributions may require it on every AC of a shipped blueprint. Absence carries no default: a consumer that requires the marker treats an unmarked AC as a defect, and a consumer that does not require it ignores the absence. |
| `vendorCitation` | object: `{url, verifiedOn}` | no | 0.6.2. Vendor citation for a criterion whose truth rests on a third-party platform fact. Both sub-fields required when the object is present: `url` is the vendor documentation URL (JSON Schema `format: uri`); `verifiedOn` is the ISO-8601 date (`format: date`, `YYYY-MM-DD`) the fact was verified against that URL. Consumers may fetch the URL at gate time so a dead link is a finding, and may compare `verifiedOn` against a tolerance window. `additionalProperties: false`. |

The Given/When/Then triple is optional at the schema level so non-Gherkin teams aren't forced into it; the `testable` boolean is required to make authors stop and confirm the AC can actually be tested.

## Why ACs stay nested

An AC outside its US is meaningless, the AC's Given/When/Then only makes sense in the context of the asA / iWant / soThat triple. Splitting would multiply file counts 5-10x with no benefit. Granular ids (`AC-101-1`) keep cross-doc references precise.

## Example

See `fixtures/valid/user-story/us-002-hierarchical-acs.json` for a US with three Given/When/Then ACs in the `AC-101-N` hierarchical form.

## AC id form: flat or hierarchical

The pattern `^AC-\d{3,}(-\d+)?$` accepts both:

- **Flat** (`AC-001`, `AC-201`) - fine for projects with a single numeric space.
- **Hierarchical** (`AC-101-1`, `AC-101-2`) - encodes the parent US id, useful for FBS scope queries and grep.

Pick per project; the schema does not enforce either.
