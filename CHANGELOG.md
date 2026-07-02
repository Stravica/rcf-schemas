# Changelog

All notable changes to `@stravica-ai/rcf-schemas` are documented in this file.

The format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Pre-1.0 breaking changes are signalled by a minor bump per semver 0.x convention.

## 0.2.0 (2026-07-02)

Structural rework of every parent-child relationship in the RCF chain: each edge is now encoded exactly once, on the child, as a mandatory `<parent>Id` field. Parents no longer store child lists; walkers invert the child references at load time to build the `childrenByParent` map. This makes tree drift structurally impossible.

Package moves from GitHub Packages (private, `@stravica` scope) to the public npm registry as `@stravica-ai/rcf-schemas`. The `Stravica/rcf-schemas` and `Stravica/rcf-examples` repositories are made public alongside this release.

### Breaking changes

- **Package name** renamed from `@stravica/rcf-schemas` to `@stravica-ai/rcf-schemas`.
- **Publish target** moved from GitHub Packages to the public npm registry.
- **Canonical `$id`** URLs bumped from `https://schemas.stravica.io/rcf/v0.1.0/...` to `https://schemas.stravica.io/rcf/v0.2.0/...` on every schema.
- **`prd.schema.json`**: `requirementIds` removed. REQ carries the mandatory `prdId` back-reference (already present in 0.1.0; now the sole edge).
- **`tad.schema.json`**: `componentIds` and `architecturalDecisionIds` removed. TAC and ADR each carry the mandatory `tadId` back-reference (already present in 0.1.0; now the sole edges).
- **`build-sequence.schema.json`**: `fbs[]` array removed. FBS now carries `bsId`, `buildOrder`, `executionStatus`, and `dependsOnFbsIds[]`.
- **`fbs.schema.json`**:
  - Renamed `status` to `executionStatus` (same enum; new name makes the intent explicit and disambiguates from authoring status).
  - Renamed `dependencies` to `dependsOnFbsIds` (same shape, mandatory with `minItems: 0`).
  - New mandatory `buildOrder` integer (>= 1); duplicates within a BS are a walker-time validation error.
- **`test-suite.schema.json`**: rewritten to the 0.2.0 shape:
  - New fields: `id` (`TS-\d{3}`), `usId`, `title`, `purpose`, `testLevel` (`unit` | `integration` | `e2e` | `contract` | `manual`), `acIds[]` (mandatory, >= 1), `status` (authoring status).
  - Inline `testCases[]` with per-TC `id` (`TC-\d{3}-<slug>`), `acId`, `description`, optional `testPointer`, and `status` (`pending` | `passing` | `failing` | `skipped`).
  - Removed the 0.1.0 fields `acId`, `prdId`, `version`, and the `given/when/then` TC shape.

### Added

- **`common.schema.json`**:
  - `adrStatus` enum gains `draft` (prepended); enum is now `["draft", "proposed", "accepted", "superseded", "deprecated"]`.
  - New `$defs.tsId` (`^TS-\d{3}$`) and updated `$defs.tcId` (`^TC-\d{3}-[a-z0-9-]+$`) - the TC pattern now requires a slug suffix.
- Targeted per-schema test files (`test/prd.test.js`, `test/req.test.js`, `test/tad.test.js`, `test/tac.test.js`, `test/adr.test.js`, `test/build-sequence.test.js`, `test/fbs.test.js`, `test/test-suite.test.js`) covering the 0.2.0 shape changes. Fixture coverage broadened to match.

### Migration

Consumers on 0.1.0 must run the tree-migration script that ships with `Stravica/rcf-build-lite`'s Phase 3.7 walker rewrite. In summary:

- Drop `PRD.requirementIds`. REQ files already carry `prdId`.
- Add `REQ.prdId` if missing (mandatory in 0.2.0).
- Drop `TAD.componentIds` and `TAD.architecturalDecisionIds`. TAC and ADR files already carry `tadId`.
- Drop `BS.fbs[]`. For each FBS in the old array, on the corresponding FBS file set `bsId`, `buildOrder` (from the slot's `order`), `executionStatus` (from the slot's `status`), and `dependsOnFbsIds` (defaults to `[]`).
- Rename any existing `FBS.status` to `FBS.executionStatus` and any `FBS.dependencies` to `FBS.dependsOnFbsIds`.
- Rewrite any existing `test-suite/*.json` to the new shape (one TS per US, with inline TCs).

The build-lite Phase 3.7 PR carries a `scripts/migrate-to-0.2.0.js` that performs this deterministically for a dogfood tree.

## 0.1.0 (initial release)

The first private release of the RCF JSON Schema bundle.

- 11 schema files in `schemas/`: `common`, `prd`, `req`, `user-story`, `tad`, `tac`, `adr`, `build-sequence`, `fbs`, `test-suite`, `manifest`.
- Per-schema docs in `docs/` (one page per schema) plus cross-cutting `id-conventions.md` and `file-layout.md`.
- JSON test fixtures in `fixtures/valid/` and `fixtures/invalid/` covering every schema.
- Strict by default (`additionalProperties: false`) on every object schema.
- Cross-file `$ref` via `common.schema.json`: shared id patterns, status enums, version string, timestamp format, and `docRef` shape live in one place.
- Canonical `$id` URLs (`https://schemas.stravica.io/rcf/v0.1.0/<name>.schema.json`) declared from the first release; the host goes live at Phase 9.
- Apache 2.0 license.

Published as `@stravica/rcf-schemas@0.1.0` on GitHub Packages with `--access restricted` (private during the build phase; public flip in 0.2.0 alongside the npm move).
