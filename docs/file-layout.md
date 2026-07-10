# File layout (recommended)

The schemas validate documents by content, not by where they sit on disk. This page documents the **recommended canonical layout**. Adopters may deviate; nothing here is schema-enforced.

## Recommendation

Put all RCF docs under a `rcf/` top-level folder at project root. Test Suites live under `rcf/test-suites/`.

```
project-root/
|-- rcf/
|   |-- rcf-manifest.json
|   |-- prd.json
|   |-- requirements/
|   |   |-- REQ-001.json
|   |   `-- REQ-002.json
|   |-- user-stories/
|   |   |-- US-101.json
|   |   `-- US-102.json
|   |-- tad.json
|   |-- tacs/
|   |   |-- TAC-001.json
|   |   `-- TAC-002.json
|   |-- adrs/
|   |   |-- ADR-001.json
|   |   `-- ADR-002.json
|   |-- build-sequence.json
|   |-- fbs/
|   |   |-- FBS-001.json
|   |   `-- FBS-002.json
|   |-- test-suites/
|   |   |-- ts-001.json
|   |   `-- ts-002.json
|   `-- code-nodes/
|       |-- cn-001.json
|       `-- cn-002.json
```

## Why everything lives under `rcf/`

A single top-level folder keeps structured RCF artefacts cleanly separable from source code. Tools that walk the RCF tree (linters, query tools, the `rcf view` viewer) have a single boundary to read from.

The Test Suite JSON is the *spec* of what the tests do; the *executable* test file (Jest, pytest, JUnit, ...) lives with the implementation and is linked from a TC's optional `testPointer` field (`filePath::testName`). This keeps the spec walkable by tooling without prescribing where executable tests live.

## Conventions, not constraints

The schema does not enforce file naming or directory layout. Adopters can:

- Pick different filenames (`prd-2026.json` instead of `prd.json`).
- Co-locate FBS files with the source they build (legal; the recommendation just keeps them under `rcf/fbs/` for discoverability).

Tooling MAY enforce a layout per project, but the schemas repo deliberately does not.

## Convention-derived paths from id

Tools that walk from the manifest roots can resolve child paths by convention:

- REQ-001 -> `rcf/requirements/REQ-001.json`
- US-101 -> `rcf/user-stories/US-101.json`
- TAC-001 -> `rcf/tacs/TAC-001.json`
- ADR-001 -> `rcf/adrs/ADR-001.json`
- FBS-001 -> `rcf/fbs/FBS-001.json`
- TS-001 -> `rcf/test-suites/ts-001.json`
- CN-001 -> `rcf/code-nodes/cn-001.json`

A future minor bump may introduce an optional `paths` override block on the manifest for adopters who deviate from the recommendation; 0.2.0 ships convention-only.
