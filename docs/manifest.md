# manifest.schema.json

Project manifest. Roots-only shape: declares `prd`, `tad`, `bs`. Children are owned by their parents and discovered by walking from the roots.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.3.0/manifest.schema.json`

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

- No `userStories[]`, `tacs[]`, `adrs[]`, `fbs[]`, `testSuites[]`, `requirements[]`, `codeNodes[]`.
- No `prds: [...]` array (single-PRD per project).
- No `activePrdId` (multi-PRD assumption retired).
- No `buildSequence` (renamed to `bs` for abbreviation consistency with `prd`, `tad`, `fbs`, `tac`, `adr`).

CN (added 0.3.0) follows the same rule as every other non-root kind: no manifest field. Discovery is by the convention-derived path (see [file-layout](./file-layout.md)), same as TAC, ADR, FBS and TS.

## Why roots-only

SSoT discipline. Every parent-child edge is encoded exactly once, on the child, as a mandatory `<parent>Id` field:

- Each **REQ** carries `prdId`; the walker inverts these to produce the PRD's requirement list.
- Each **TAC** carries `tadId`; likewise for the TAD's component list.
- Each **ADR** carries `tadId`; likewise for the TAD's decision list.
- Each **FBS** carries `bsId` (plus `buildOrder` and `executionStatus`); the walker computes the ordered per-BS FBS list by filter + sort.
- Each **US** carries `reqId`; the set of USs under a REQ is `childrenByParent.get(reqId)`.
- Each **TS** carries `usId` and the `acIds[]` it verifies; the walker inverts these into cross-link maps.

Enumerating children in the manifest as well would create two sources of truth; pick one. The child owns the reference. The manifest stays small (~8 properties) and a new US / TAC / ADR / FBS / REQ / TS never requires a manifest edit.

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
