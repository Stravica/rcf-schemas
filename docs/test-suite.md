# test-suite.schema.json

Test Suite. One file per Test Suite. The JSON specification of what Test Cases exist for one or more Acceptance Criteria on a single User Story.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.3.0/test-suite.schema.json`

## TS-as-JSON: what this schema is for

The TS schema validates the *specification* of the test cases (id, description, AC covered, authored status). It is the **contract for the test-writer** (human or AI). The executable test (Jest, pytest, JUnit, ...) is the *implementation* of that spec; the optional `testCase.testPointer` field points to the executable location.

The JSON form is what lets Phase 5 traceability tooling walk `AC -> TS -> TC` programmatically, without parsing source-language test code. Whether the executable test file matches its TS spec is a separate concern (a test-of-the-test, owned by Phase 5 or the test-writer's own discipline).

## TS file location

Recommended path under the RCF tree: `rcf/test-suites/ts-001.json`. The schema validates the JSON shape; location is an implementation choice and is not enforced by schema or enumerated by manifest.

## Required fields

| Field | Type | Notes |
|---|---|---|
| `id` | `^TS-\d{3}$` | Test Suite identifier. Sequential, not parent-grouped (a US can have multiple TSs across levels). |
| `usId` | `^US-\d{3,}$` | Parent User Story. Mandatory back-reference. |
| `title` | string, min 1 | Human-readable suite title. |
| `purpose` | string, min 1 | One-paragraph "what this suite is testing and why". |
| `testLevel` | enum | `unit`, `integration`, `e2e`, `contract`, `manual`. |
| `acIds` | array of `acId`, min 1 | The ACs this suite verifies. TS holds the reference; ACs stay clean of downstream references. |
| `testCases` | array of `testCase`, min 0 | Inline TCs. Empty array allowed (a suite may be a purpose-only skeleton pre-authoring). |
| `status` | `authoringStatus` enum | Lifecycle status of the suite itself. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Test case shape

Each entry in `testCases[]`:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `id` | `^TC-\d{3}-[a-z0-9-]+$` | yes | TC identifier. `TC-<TS-suffix>-<slug>`; slug is a lowercase alphanumeric identifier (hyphens allowed). Slug uniqueness is within-TS, not global. |
| `acId` | `^AC-\d{3,}(-\d+)?$` | yes | Which AC on the parent US this TC verifies. |
| `description` | string, min 1 | yes | What the TC covers. |
| `testPointer` | string | no | Pointer to the executable test, `filePath::testName` format. |
| `status` | enum | yes | `pending`, `passing`, `failing`, `skipped`. Authored in 0.2.0; derived from real test runs in Phase 6+. |

## What changed in 0.2.0

The 0.1.0 shape was per-AC (`acId` + `prdId` + `version` + `testCases[given/when/then]`). 0.2.0 makes the suite per-US-and-across-ACs, keeps the TS id in `common.schema.json` (`tsId`), and moves the Given/When/Then verbiage into the TC's `description` (specialised BDD-style step language belongs in the executable test, not the JSON spec).

## What's NOT here

- **`given/when/then` on the TC.** The `description` field carries the intent; the executable test carries the BDD step language.
- **`prdId` on the TS.** Removed in 0.2.0. Walk `usId` -> `US.reqId` -> `REQ.prdId` if you need the PRD.

## Why TCs stay nested

A TC outside its TS (and its AC) is meaningless. TCs are small; inline is the natural shape. `testPointer` links out to the executable location without hoisting the TC into a separate file.
