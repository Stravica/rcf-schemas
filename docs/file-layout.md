# File layout (recommended)

The schemas validate documents by content, not by where they sit on disk. This page documents the **recommended canonical layout**. Adopters may deviate; nothing here is schema-enforced.

## Recommendation

Put all RCF docs under a `rcf/` top-level folder at project root. Keep TS files OUTSIDE `rcf/`, code-adjacent.

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
|   `-- fbs/
|       |-- FBS-001.json
|       `-- FBS-002.json
`-- test/                   (or wherever the implementation puts tests, outside rcf/)
    |-- auth/
    |   |-- AC-101-1.test.json
    |   `-- AC-101-2.test.json
    `-- sync/
        `-- AC-102-1.test.json
```

## Why TS files live outside `rcf/`

They're code-adjacent. The TS *spec* (the JSON file) and the *executable test* (Jest, pytest, JUnit, ...) live together so a test-writer can read both side by side and the engineer running tests doesn't bounce between trees.

The schema validates the JSON shape of a TS file regardless of where it lives; this is a convention, not a constraint.

## Why everything else lives under `rcf/`

A single top-level folder keeps generated and structured RCF artefacts cleanly separable from source code. Tools that walk the RCF tree (linters, query tools, the `rcf view` viewer) have a single boundary to read from.

## Conventions, not constraints

The schema does not enforce file naming or directory layout. Adopters can:

- Pick different filenames (`prd-2026.json` instead of `prd.json`).
- Inline children into one big file (legal per schema; not recommended).
- Co-locate FBS files with the source they build (legal; the recommendation just keeps them under `rcf/fbs/` for discoverability).

Tooling MAY enforce a layout per project, but the schemas repo deliberately does not.

## Convention-derived paths from id

Tools that walk from the manifest roots can resolve child paths by convention:

- REQ-001 -> `rcf/requirements/REQ-001.json`
- US-101 -> `rcf/user-stories/US-101.json`
- TAC-001 -> `rcf/tacs/TAC-001.json`
- ADR-001 -> `rcf/adrs/ADR-001.json`
- FBS-001 -> `rcf/fbs/FBS-001.json`
- TS for AC-101-1 -> implementation choice, scan or registry lookup

A future minor bump may introduce an optional `paths` override block on the manifest for adopters who deviate from the recommendation; Phase 1 ships convention-only.
