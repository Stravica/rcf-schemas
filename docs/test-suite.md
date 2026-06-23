# test-suite.schema.json

Test Suite. One file per AC. The JSON specification of what Test Cases must exist for an AC. **Code-adjacent, not doc-adjacent**: lives with the implementation, not under `rcf/`.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.1.0/test-suite.schema.json`

## TS-as-JSON: what this schema is for

The TS schema validates the *specification* of test cases (id, Given/When/Then for each TC). It is the **contract for the test-writer** (human or AI). The executable test (Jest, pytest, JUnit, ...) is the *implementation* of that spec.

The JSON form is what lets Phase 5 traceability tooling walk `AC -> TS -> TC` programmatically, without parsing source-language test code. Whether the executable test file matches its TS spec is a separate concern (a test-of-the-test, owned by Phase 5 or by the test-writer's own discipline).

## TS file location

TS files live with the implementation (e.g. `test/auth/AC-201.test.json`), **not** under `rcf/`. Recommended filename: `<AC-id>.test.json`. The schema validates the JSON shape; location is an implementation choice and is not enforced by schema or enumerated by manifest.

TSs are discovered by walking ACs (each TS carries `acId`) or by convention scan of the test tree.

## Required fields

| Field | Type | Notes |
|---|---|---|
| `acId` | `^AC-\d{3,}(-\d+)?$` | The AC this suite covers. |
| `usId` | `^US-\d{3,}$` | Parent US (denormalised for fast lookup). |
| `prdId` | `^PRD-\d{3,}$` | Root PRD (denormalised). |
| `version` | semver | Per-document version. |
| `testCases` | array, min 1 | The TCs that implement the AC. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `title` | string | Human-readable suite title. |

## Test case shape

Each entry in `testCases[]`:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `id` | `^TC-\d{3,}$` | yes | TC identifier. |
| `given` | string, min 1 | yes | Preconditions. |
| `when` | string, min 1 | yes | Trigger. |
| `then` | string, min 1 | yes | Observable outcome. |
| `notes` | string | no | Implementation hints, references to fixtures, etc. |

## What's NOT here

- **`status` on TS or TC.** Pass/fail is runtime state derived by Phase 5 traceability tooling from observed test runs. The schema describes the test definitions, not their last run.
- **`lastRun` timestamps.** Same reason.

## Why TCs stay nested

A TC outside its TS (and its AC) is meaningless. TCs are small (Given/When/Then triples); inline is the natural shape. One TS file per AC keeps the TC count per file bounded.

## Why denormalise `usId` and `prdId` at root

Fast lookup without walking the manifest. Cross-ref validation (that these match the AC's actual parent) is a tooling concern, not a schema one.
