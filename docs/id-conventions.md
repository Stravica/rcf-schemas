# ID conventions

The pattern, the prefix table, the AC sub-id form, and the file/nested asymmetry.

## The pattern

```
^<PREFIX>-\d{3,}$
```

Three-digit minimum, unbounded above. `PRD-001` through `PRD-999` use the clean visual; `PRD-1000+` works without a schema migration. A single digit (`PRD-1`) is rejected.

## Prefix table

| Prefix | Document | File? | Where defined |
|---|---|---|---|
| `PRD` | Product Requirements Document | yes | `prd.schema.json` |
| `REQ` | Requirement | yes | `req.schema.json` |
| `US`  | User Story | yes | `user-story.schema.json` |
| `AC`  | Acceptance Criterion | no (nested in US) | `user-story.schema.json $defs.acceptanceCriterion` |
| `TAD` | Technical Architecture Document | yes | `tad.schema.json` |
| `TAC` | Technical Architecture Component | yes | `tac.schema.json` |
| `ADR` | Architectural Decision Record | yes | `adr.schema.json` |
| `BS`  | Build Sequence | yes | `build-sequence.schema.json` |
| `FBS` | Functional Build Specification | yes | `fbs.schema.json` |
| `TS`  | Test Suite | yes (one file per AC; identified by parent `acId`, no prefix of its own) | `test-suite.schema.json` |
| `TC`  | Test Case | no (nested in TS) | `test-suite.schema.json` |

All prefixes are defined exactly once in `common.schema.json#/$defs` and referenced via `$ref` everywhere.

## AC ids: flat or hierarchical

The `acId` pattern is `^AC-\d{3,}(-\d+)?$`. Two forms are accepted:

- **Flat:** `AC-001`, `AC-201` — single numeric space, fine for small projects.
- **Hierarchical:** `AC-101-1`, `AC-101-2` — encodes the parent US id (`US-101`) in the prefix. Useful for FBS scope queries and grep.

Pick per project; the schema does not enforce either form. The published `Stravica/rcf-examples` `comprehensive-product` tree uses the hierarchical form for clarity.

## TS files: identified by `acId`, no prefix of their own

A Test Suite covers exactly one AC. The TS file's `acId` field is its primary identifier. Recommended filename: `<AC-id>.test.json` (e.g. `AC-101-2.test.json`).

## TC ids

`^TC-\d{3,}$`. TCs are nested in their parent TS's `testCases[]`. The TC id is unique within the TS but not necessarily globally (different projects pick different conventions).

## File-level vs nested-level: the asymmetry

| Lives in its own file | Lives nested inside a parent |
|---|---|
| PRD, REQ, US, TAD, TAC, ADR, BS, FBS, TS | AC (inside US), TC (inside TS) |

**The rule:** narrative-heavy structured documents that grow over time live in their own files (per-doc git history, parallel-safe authoring, no merge conflict on append). Tightly-coupled child structures (AC inside US, TC inside TS) stay nested, splitting them multiplies file counts without benefit.

An AC outside its US has no meaning, the Given/When/Then only makes sense in the context of the asA / iWant / soThat triple. Same for TCs.
