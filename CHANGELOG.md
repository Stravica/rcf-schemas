# Changelog

All notable changes to `@stravica-ai/rcf-schemas` are documented in this file.

The format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Pre-1.0 breaking changes are signalled by a minor bump per semver 0.x convention.

## 0.4.1 - 2026-07-31

Additive patch bump: closes the verification-integrity B-1 finding on the 0.7.0 train by giving `rcf finalise --ship-without-verified` a durable, greppable manifest record.

### Added

- **`manifest.schema.json`**: new optional `shipWithoutVerified[]` array on the manifest. Each entry carries `id` (pattern `swv-<fbsId>-<n>`), `fbsId`, `ackedAt` timestamp, `declaredAcs[]` (each with `acId`, a `verdict` enum restricted to `MOCK-ONLY-DECLARED` or `BLOCKED-BY-DECLARATION`, and an optional `reason` string), and `reportPath`. New `$defs`: `shipWithoutVerifiedRecord`, `shipWithoutVerifiedDeclaredAc`. Written by build-side `rcf finalise --ship-without-verified` (rcf-build-lite 0.7.0 train, verification-integrity-cluster-spec section 5.2).
- Fixture: `fixtures/valid/manifest/manifest-006-ship-without-verified.json` proves the new field validates, alongside a fresh pre-0.4.1 back-compat fixture pass.
- Tests: `manifest.test.js` covers the new field, the id pattern, the verdict enum guard, and back-compat.

### Notes

- Additive-only: pre-0.4.0 and 0.4.0 manifests remain valid unchanged.
- Canonical `$id` URLs stay at `v0.4.0`, following the patch-release precedent set at 0.2.1 and 0.3.1.

## 0.4.0 - 2026-07-30

Additive minor bump carrying the 0.7.0 release-train schema surface for `rcf-lite`: three ratified track specs (verification-integrity, UI-design-gate, elicitation-and-playbook-hardening) co-ship every new schema field in one release, resolved through a single `$defs`-uniqueness sweep. Every field is optional at schema level; pre-0.4.0 chains remain valid. The 0.6.0 init-hygiene spec is pure build-side and touches no schemas here.

### Added

- **`common.schema.json`**: new `$defs.attestationMode` enum (`live | sandboxed | mocked | declaredMockOnly | notShipped`), shared between `fbs.dependsOnServices[]` and `manifest.preFlightConfig.servicesInScope[]`.
- **`test-suite.schema.json`**: optional `runtimeProvenance` on the `testCase` subschema, with `profile` enum (`mock | stub | fixture | live | mixed`), `envVarsRequired[]`, `externalHostsReached[]`, `notes`. `$defs.runtimeProvenance` defined locally.
- **`fbs.schema.json`**: optional `dependsOnServices[]` (Track A service attestation), plus Track B's `uiBearing` (boolean), `uiClassification`, `designStage` (journeys, navigation model, theme-and-a11y), and `designStageComplete` (boolean gate at `--mark complete`). New `$defs`: `serviceDependency`, `uiClassification`, `uiClassificationSignal`, `designStage`, `designJourney`, `designNavModel`, `designNavRoute`, `designThemeAndA11y`.
- **`req.schema.json`**: optional `shapeClassification` (Track C+D REQ-shape classifier verdict) with `shapes[]` enum (`webUi | httpApi | auth | persistence | notifications | none`), `reason`, `signals[]`, `classifiedAt`, and `operatorOverride`. New `$defs`: `reqShapeClassification`, `reqShapeSignal`, `reqShapeOperatorOverride`.
- **`user-story.schema.json`**: optional `provenance` on the acceptance-criterion subschema (Track C+D) with `authoredBy` enum (`operator | baseline | operatorEdited`), `baselineKey`, `injectedAt`, `sourceReqShape`, `acceptedByOperatorAt`. New `$defs.acProvenance`.
- **`manifest.schema.json`**: broad additive surface across the three tracks. New optional fields: `testCommand` (string), `preFlightConfig[]`, `reviewAudit[]`, `uiBaseline`, `uiBaselineHistory[]`, `browserVerification[]`, `baselineAcOptOuts[]`, `intakeClassification`, `registerCanary[]`, `reviewSurface`. New `$defs`: `preFlightConfigRecord`, `preFlightServiceEntry`, `designShapeAnswer`, `reviewAuditRecord`, `testTheatreFinding` (whose `kind` enum includes Track B's `uiBaselineDrift`), `mutationSamplingRecord`, `mutationSurvivor`, `uiBaselineRecord`, `uiBaselineDefaults`, `uiBaselineComponentVocabulary`, `uiBaselineTypography`, `uiBaselineInteractionDefaults`, `uiBaselineAuthFlow`, `uiBaselineOptOut`, `browserVerificationRecord`, `browserVerificationRoute`, `browserVerificationInvariantCheck`, `browserVerificationAuthSmokeCheck`, `baselineAcOptOutRecord`, `intakeClassificationRecord`, `intakeArtefact`, `intakeValidationFinding`, `intakeElicitationScope`, `registerCanaryRecord`, `registerCanaryGrades`, `registerCanaryPatternGrade`, `registerCanaryWordBudgetGrade`, `reviewSurfaceRecord`, `reviewSurfaceViewServer`. Load-bearing constraints: `baselineAcOptOutRecord.reason` carries `minLength: 20`; `browserVerificationRecord.routesChecked` and `invariantChecks` require `minItems: 1`; `preFlightConfigRecord.id`, `uiBaselineRecord.id`, `baselineAcOptOutRecord.id`, `intakeClassificationRecord.id`, and `registerCanaryRecord.id` carry monotonic id patterns.
- Fixtures: valid coverage under `fixtures/valid/fbs/`, `test-suite/`, `req/`, `user-story/`, `manifest/`, including a dedicated back-compat manifest fixture (`manifest-004-pre-040-backcompat.json`) proving a pre-0.4.0 manifest still validates against 0.4.0 unchanged. Invalid coverage under `fixtures/invalid/` exercises the enum, minLength, and boolean-type constraints most likely to catch drift downstream.
- Targeted per-schema tests extended for every new field: `fbs.test.js`, `test-suite.test.js`, `req.test.js`, `user-story.test.js`. New file `manifest.test.js` covers the manifest-level additions in depth, including the `baselineAcOptOutRecord.reason` 20-character floor and every enum shape.

### Changed

- **Canonical `$id`** URLs bumped from `https://schemas.stravica.io/rcf/v0.3.0/...` to `https://schemas.stravica.io/rcf/v0.4.0/...` on every schema, in lock-step with the bundle version. Matches the precedent set at 0.3.0.
- `manifest.schema.json` description now names the added optional records and states the back-compat guarantee explicitly.

### Notes

- Every addition is optional at schema level. The additive-only contract is proven by `fixtures/valid/manifest/manifest-004-pre-040-backcompat.json` (a bare 0.3.x-era manifest) validating cleanly, and by the `pre-0.4.0 ... still validates` tests in each per-schema test file.
- `$defs` uniqueness was audited across all three tracks before authoring; no shape-disagreeing collisions. The one intentionally shared def (`common.$defs.attestationMode`) is the enum both FBS's `dependsOnServices[]` and manifest's `preFlightServiceEntry` need.
- The 0.6.0 init-hygiene spec (`packages/{build,core}` in `rcf-lite`) confirmed schema-free and therefore not represented here.
- Pre-merge constraint alignments in the same 0.4.0 release: `fbs.$defs.designJourney.steps` `minItems` raised from 1 to 2 to match Track B §3.1 ("2-8 short strings"); `manifest.$defs.preFlightServiceEntry.sourceRefs` `minItems` relaxed from 1 to 0 so operator-added service candidates with no PRD or TAD reference validate. Negative-fixture symmetry back-filled for the enum and id-pattern constraints that lacked a dedicated fixture.

## 0.3.1 - 2026-07-10

Added optional `noCodeNodes` boolean to `fbs.schema.json`. It declares that a build spec produces no traceable code (docs-only or config-only): `rcf build --mark complete` records it via `--no-code-nodes` and the CodeNode gate skips the spec. Additive and backward-compatible - existing FBS documents without the field remain valid. Canonical `$id` URLs stay at `v0.3.0`, following the patch-release precedent set at 0.2.1.

## 0.3.0 - 2026-07-10

Adds the Code Node (`CN`) document kind, the eleventh in the family, bridging the requirements graph to source code.

### Added

- **`cn.schema.json`**: new schema. One file per Code Node. Identity is `path`, a repo-relative source location, optionally `#symbol`-suffixed (for example `src/store/validator.js` or `src/store/validator.js#getAjv`); granularity (file vs symbol) is derived from the presence of `#` and is never stored as its own field. Required: `cnId`, `path`, `implementsAcIds` (may be empty; an orphan CN is a legitimate state), `version`, `status`, `createdAt`, `updatedAt`. Optional: `title`, `description`, `dependencies[]` (CN-to-CN edges, hand-declared).
- **`common.schema.json`**: new `$defs.cnId` (`^CN-\d{3,}$`) and `$defs.cnStatus` (`draft` | `approved` | `deprecated`).
- Fixtures under `fixtures/valid/cn/` and `fixtures/invalid/cn/`; targeted tests in `test/cn.test.js`.
- Recommended file layout: `rcf/code-nodes/`, file naming `cn-NNN.json` (see `docs/file-layout.md`).

### Changed

- **Canonical `$id`** URLs bumped from `https://schemas.stravica.io/rcf/v0.2.0/...` to `https://schemas.stravica.io/rcf/v0.3.0/...` on every schema, in lock-step with the bundle version (unchanged content for the 10 pre-existing document schemas; only `common.schema.json` gains new `$defs` and `cn.schema.json` is new).

### Notes

- The project manifest (`manifest.schema.json`) is intentionally unchanged: it is roots-only (`prd`, `tad`, `bs`) and no document kind, including CN, is enumerated there. CN discovery follows the same convention-derived-path pattern as every other kind (see `docs/file-layout.md`), not a manifest field.

## 0.2.1 - 2026-07-02

Added optional `tacIds[]` cross-link field on `user-story.schema.json` to close a Phase 3.7 §D2/OQ-P37-1 silent miss. Forward-compatible; no consumer populates the field until Phase 4 CRUD. Backward-compatible - existing US docs without `tacIds` remain valid.

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
