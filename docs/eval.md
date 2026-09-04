# eval.schema.json

EVAL document. One file per EVAL. Grades the observable output of one or more non-deterministic Acceptance Criteria on the User Story identified by `usId`. EVAL is the graded-output peer of a Test Suite: TS/TC verify deterministic behaviour, EVAL grades non-deterministic behaviour (LLM-generated text, ranked results, generated code, judgement calls).

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.6.0/eval.schema.json`

## When to author one

EVAL is optional in the chain. Consumers require it only for ACs marked `determinism: nonDeterministic` on the parent US (see [user-story.md](./user-story.md)). Deterministic ACs are covered by TS/TC alone; TS/TC and EVAL are peer contracts on non-deterministic ACs, neither replaces the other.

## Required fields

| Field | Type | Notes |
|---|---|---|
| `id` | `evalId` | `EVAL-001` or slug-prefixed `spa-EVAL-001`. Same shape as `tsId`. |
| `usId` | `usId` | Parent User Story. Mandatory back-reference. |
| `acIds` | array of `acId`, min 1 | ACs this EVAL grades. All ACs must live on the parent US (cross-US coverage is not permitted at v1; the AC-to-EVAL binding is scoped by the parent US the same way TS is). |
| `title` | string, min 1 | Human-readable one-line intent. |
| `purpose` | string, min 1 | Multi-sentence rationale. What non-deterministic behaviour is being graded, and why the criteria set is the right one. |
| `criteria` | array, min 1 | Rubric criteria. See below. |
| `cases` | array, min 1 | Graded examples. See below. |
| `judge` | object | Judge configuration. See below. |
| `passThreshold` | object | Aggregate-pass rule. See below. |
| `status` | `authoringStatus` enum | Reuses the shared enum: `draft`, `review`, `needsRevision`, `approved`, `superseded`. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `runRecord` | array | Append-only history of graded runs. The most recent entry is what the merge gate reads for `EVAL-BELOW-THRESHOLD`. Absent or empty means no run has landed yet (audit reports the EVAL as pending). |

## Criterion shape

Each entry in `criteria[]`:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `id` | kebab-slug | yes | Unique within the EVAL. |
| `description` | string, min 1 | yes | One-line prose describing what this criterion grades. |
| `critical` | boolean | no | When true, any case that fails this criterion fails the whole run even if the aggregate score would otherwise pass. Consumers default to false. |
| `weight` | number > 0 | no | Positive weight for aggregate scoring under `llmJudge` and `scriptedMetric`. Consumers default to 1. Unused when `judge.type` is `rubric` and every criterion is boolean. |

## Case shape

Each entry in `cases[]`:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `id` | kebab-slug | yes | Unique within the EVAL. |
| `input` | free-shape JSON | yes | The inputs the AC's system-under-test receives on this case. |
| `expected` | free-shape JSON | no | The reference output where one exists. Many non-deterministic cases have no single reference. |
| `criteriaIds` | array of kebab-slug | no | Subset of `criteria[].id` this case is graded against. Empty array or omission means all criteria. |
| `notes` | string | no | Free text; case-specific guidance for the judge to consume. |

A case is not a TC in the test-runner sense; TCs count executions of code paths, EVAL cases count graded outputs.

## Judge shape

```json
"judge": {
  "type": "rubric" | "llmJudge" | "scriptedMetric",
  "harness": { ... },   // required when type is llmJudge
  "script":  { ... }    // required when type is scriptedMetric
}
```

- **`rubric`**: deterministic scoring against declared boolean criteria, no external process.
- **`llmJudge`**: spawn the subscription-authenticated LLM CLI (`claude` on PATH; `codex` also permitted) with the assembled prompt on stdin, capture stdout, validate against the declared response schema. Estate rule: subscription-only. No API keys, no direct HTTP to Anthropic. The `harness` object carries `invoker` (`claude` | `codex`), optional `modelHint`, optional `systemPromptPath`, and required `responseSchemaPath`.
- **`scriptedMetric`**: run a project-owned executable whose stdout is a scored JSON envelope. The `script` object carries `command` (argv, min 1 entry) and `responseSchemaPath`.

## passThreshold shape

| Field | Type | Required | Purpose |
|---|---|---|---|
| `aggregateScore` | number, 0..1 | yes | Minimum weighted aggregate for a run to be counted a pass. |
| `criticalMustPass` | boolean | no | When true, any critical criterion failing on any case fails the run even if `aggregateScore` is met. Consumers default to true. |
| `minCasesPassing` | integer >= 0 | no | Optional floor on how many cases must fully pass (all criteria met, no critical failure). Absent means no case-count floor is enforced. |

## runRecord shape

Append-only list. Each entry:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `runId` | string, min 1 | yes | Unique identifier for this run. Free-form; runners commonly use an ISO timestamp plus a short suffix. |
| `runAt` | ISO 8601 date-time | yes | When the run completed. |
| `runner` | string, min 1 | yes | Free-form identifier for what produced the record (for example, `claude-cli:0.1.28`, `rcf-lite:0.17.0`, `hand-authored`). |
| `modelPinned` | string, min 1 | no | Model pin captured at run time (relevant for `llmJudge` runs). |
| `aggregateScore` | number, 0..1 | yes | Weighted aggregate for this run. |
| `criticalFailures` | array of kebab-slug | yes | Criterion ids that failed a critical check on at least one case. Empty means no critical failures. |
| `perCaseScores` | array | no | Optional per-case detail. Absent for compact records; present for full grading detail. |
| `verdict` | enum: `pass`, `fail`, `pending` | yes | Overall verdict. `pending` is used when a run is recorded but grading is not complete; the coverage audit treats `pending` as absent for resolving-EVAL purposes. |
| `artefactPointer` | string, min 1 | no | Path relative to project root of a raw-judge-output artefact. Consumers do not read the pointed file at coverage time; it is retained for post-hoc review. |
| `notes` | string | no | Free text; runners record fallbacks (for example, `modelHint` not honoured by the invoker) here. |

## Why not fold EVAL into TS

TS is a test-runner artefact (per-AC coverage via TC pointers, resolved against the working tree). EVAL is a graded-output artefact with its own case set and judge. Merging them would force one runner to speak both surfaces or force a fake pointer-shape on EVAL cases. The peer document is honest.

## Example

See `fixtures/valid/eval/eval-002-llm-judge-full.json` for a full `llmJudge` EVAL with three criteria (two of them critical), two cases, a populated `passThreshold`, and one `runRecord` entry.
