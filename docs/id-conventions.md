# ID conventions

The pattern, the prefix table, the AC sub-id form, the optional slug suffix, and the file/nested asymmetry.

## The pattern

```
^<PREFIX>-\d{3,}$
```

Three-digit minimum, unbounded above. `PRD-001` through `PRD-999` use the clean visual; `PRD-1000+` works without a schema migration. A single digit (`PRD-1`) is rejected.

One family layers the same three-digit-minimum tail onto a slug: `TC-\d{3,}-<slug>` (TS-suffix, three-digit minimum, unbounded above, joined to a lowercase alphanumeric slug).

## Optional slug suffix (0.4.3)

Four families accept an optional kebab-case slug tail: `FBS`, `CN`, `ADR`, `TAC`. The full pattern is:

```
^<PREFIX>-\d{3,}(-[a-z0-9]+(?:-[a-z0-9]+)*)?$
```

The slug is derived from the document title (kebab-case, lowercase alphanumeric segments joined by single hyphens). Leading hyphens, trailing hyphens, double hyphens, uppercase letters, and underscores are rejected.

Both forms remain valid: `FBS-004` and `FBS-004-user-login` both validate. Existing numeric-only ids continue to validate; there is no forcing function. Consumers that address documents by id treat the slug as part of the id string, not a separately parseable field.

Rationale: parallel authoring on branches can allocate the same number for different titles. The slug makes those distinct addresses at the filesystem and id layer, converting an add/add merge conflict into a clean co-existence. See the `rcf-lite` slug-train design for the full argument.

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
| `TS`  | Test Suite | yes (one file per suite, sequential id `TS-\d{3}`) | `test-suite.schema.json` |
| `TC`  | Test Case | no (nested in TS, id `TC-<TS-suffix>-<slug>`) | `test-suite.schema.json` |
| `CN`  | Code Node | yes | `cn.schema.json` |

All prefixes are defined exactly once in `common.schema.json#/$defs` and referenced via `$ref` everywhere.

## AC ids: flat or hierarchical

The `acId` pattern is `^AC-\d{3,}(-\d+)?$`. Two forms are accepted:

- **Flat:** `AC-001`, `AC-201` - single numeric space, fine for small projects.
- **Hierarchical:** `AC-101-1`, `AC-101-2` - encodes the parent US id (`US-101`) in the prefix. Useful for FBS scope queries and grep.

Pick per project; the schema does not enforce either form. The published `Stravica/rcf-examples` `comprehensive-product` tree uses the hierarchical form for clarity.

## TS ids

`^TS-\d{3,}$`. Sequential, not parent-grouped: a US may have multiple TSs across levels (unit, integration, e2e, ...) and a parent-grouped id would collide. Recommended path: `rcf/test-suites/ts-001.json`.

## TC ids

`^TC-\d{3,}-[a-z0-9-]+$`. TCs are nested in their parent TS's `testCases[]`. The pattern is `TC-<TS-suffix>-<slug>` where slug is a lowercase alphanumeric identifier chosen by the author (hyphens allowed). Examples: `TC-001-happy-path`, `TC-001-rejects-empty`, `TC-042-integration-boundary`. Slug uniqueness is within-TS, not global.

Rationale: sequential numbering for TCs is brittle if you renumber; slug-based ids give readable pointers in test-suite bodies and traceability queries.

## CN ids

`^CN-\d{3,}$`, same shape as the family default. A CN's *identity within the working tree* is a separate field, `path` (optionally `#symbol`-suffixed) - see [cn](./cn.md). The `cnId` is the document id used for cross-references (`dependencies[]`, and inbound from any future kind that anchors to a CN); `path` is what the CN actually points at.

## File-level vs nested-level: the asymmetry

| Lives in its own file | Lives nested inside a parent |
|---|---|
| PRD, REQ, US, TAD, TAC, ADR, BS, FBS, TS, CN | AC (inside US), TC (inside TS) |

**The rule:** narrative-heavy structured documents that grow over time live in their own files (per-doc git history, parallel-safe authoring, no merge conflict on append). Tightly-coupled child structures (AC inside US, TC inside TS) stay nested, splitting them multiplies file counts without benefit.

An AC outside its US has no meaning, the Given/When/Then only makes sense in the context of the asA / iWant / soThat triple. Same for TCs.
