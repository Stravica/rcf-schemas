# common.schema.json

Shared `$defs` referenced via `$ref` from every other RCF schema. ID patterns, status enums, version string, timestamp format, and the `docRef` shape live here. This file is not itself a document schema; consumers register it alongside the other 11 schemas at validator init.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.3.0/common.schema.json`

## What's in `$defs`

| Name | Shape | Used by |
|---|---|---|
| `prdId` | string, `^PRD-\d{3,}$` | every schema that references a PRD |
| `reqId` | string, `^REQ-\d{3,}$` | `prd`, `req`, `user-story` |
| `usId` | string, `^US-\d{3,}$` | `user-story`, `test-suite` |
| `acId` | string, `^AC-\d{3,}(-\d+)?$` | `user-story.acceptanceCriteria[].id`, `fbs.acIds[]`, `test-suite.acId` |
| `tadId` | string, `^TAD-\d{3,}$` | `tad`, `tac`, `adr` |
| `tacId` | string, `^TAC-\d{3,}$` | `tac`, `fbs.contextRequirements.tacIds[]` |
| `adrId` | string, `^ADR-\d{3,}$` | `adr`, `fbs.contextRequirements.adrIds[]` |
| `bsId` | string, `^BS-\d{3,}$` | `build-sequence`, `fbs.bsId` |
| `fbsId` | string, `^FBS-\d{3,}$` | `fbs.fbsId`, `fbs.dependsOnFbsIds[]` |
| `tsId` | string, `^TS-\d{3}$` | `test-suite.id` |
| `tcId` | string, `^TC-\d{3}-[a-z0-9-]+$` | `test-suite.testCases[].id` |
| `cnId` | string, `^CN-\d{3,}$` | `cn.cnId`, `cn.dependencies[]` |
| `version` | string, `^\d+\.\d+\.\d+$` | every doc-type schema |
| `timestamp` | string, format `date-time` | every doc-type schema |
| `authoringStatus` | enum: `draft`, `review`, `needsRevision`, `approved`, `superseded` | PRD, REQ, US, TAD, TAC, BS |
| `adrStatus` | enum: `draft`, `proposed`, `accepted`, `superseded`, `deprecated` | ADR |
| `executionStatus` | enum: `notStarted`, `inProgress`, `complete`, `verified` | FBS doc + BS slot |
| `cnStatus` | enum: `draft`, `approved`, `deprecated` | CN |
| `docRef` | object `{ id, path }` | manifest `prd`, `tad`, `bs` |

## Why these are shared

These types appear in many places and must stay identical. Inlining the patterns or enums in every schema would create a maintenance hazard, one edit becomes ten. The cross-file `$ref` setup eliminates that risk.

The trade-off is that consumers register the schema bundle once at validator init rather than per document. See the [top-level README](../README.md) for the language-by-language registration recipe.

## What's not here

Per-doc-type enums (REQ `category`, REQ `priority`, FBS `riskLevel`, BS `generationStrategy`, etc.) stay local to their schema; they're not shared, so they don't earn a slot in `common`.

## Version

Carried on the `$id` URL path segment (`/v0.3.0/`). Bumps in lock-step with the bundle.
