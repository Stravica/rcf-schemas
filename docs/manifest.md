# manifest.schema.json

Project manifest. Roots-only shape: declares `prd`, `tad`, `bs`. Children are owned by their parents and discovered by walking from the roots.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.1.0/manifest.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `version` | string, `const: "2.0.0"` | Bundle major version. Lets tools dispatch on it. |
| `projectName` | string, min 1 | Human-readable project name. |
| `prd` | `docRef` | Root PRD. Singular. |
| `tad` | `docRef` | Root TAD. Singular. |
| `bs` | `docRef` | Root Build Sequence. Singular. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `description` | string | Short project description. |

## `docRef` shape

Defined once in `common.schema.json`:

```json
{
  "id": "<doc-id>",
  "path": "<relative-path-to-file>"
}
```

Both fields are required.

## What's NOT here

Singular by design; no child arrays:

- No `userStories[]`, `tacs[]`, `adrs[]`, `fbs[]`, `testSuites[]`, `requirements[]`.
- No `prds: [...]` array (single-PRD per project).
- No `activePrdId` (multi-PRD assumption retired).
- No `buildSequence` (renamed to `bs` for abbreviation consistency with `prd`, `tad`, `fbs`, `tac`, `adr`).

## Why roots-only

SSoT discipline. Children are owned by their parents:

- The **PRD** declares `requirementIds[]`.
- The **TAD** declares `componentIds[]` and `architecturalDecisionIds[]`.
- The **BS** declares its `fbs[]` slots.
- Each **US** declares its parent `reqId`; the set of USs under a REQ is discoverable by scan.
- Each **TS** file is co-located with its implementation (outside `rcf/`); its `acId` links it back.

Enumerating children in the manifest as well would create two sources of truth; pick one. The parent owns the list. The manifest stays small (~8 properties) and a new US / TAC / ADR / FBS / REQ never requires a manifest edit.

## Example

```json
{
  "version": "2.0.0",
  "projectName": "Acme Notes",
  "prd": { "id": "PRD-001", "path": "rcf/prd.json" },
  "tad": { "id": "TAD-001", "path": "rcf/tad.json" },
  "bs":  { "id": "BS-001",  "path": "rcf/build-sequence.json" }
}
```
