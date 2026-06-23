# RCF Schemas docs

Per-schema reference + cross-cutting conventions for `@stravica/rcf-schemas`.

## Per-schema pages

One page per schema file under `schemas/`.

- [common](./common.md) - shared `$defs` referenced from every other schema.
- [prd](./prd.md) - Product Requirements Document (shell).
- [req](./req.md) - individual Requirement.
- [user-story](./user-story.md) - User Story with inline Acceptance Criteria.
- [tad](./tad.md) - master Technical Architecture Document.
- [tac](./tac.md) - Technical Architecture Component.
- [adr](./adr.md) - Architectural Decision Record.
- [build-sequence](./build-sequence.md) - ordered FBS plan.
- [fbs](./fbs.md) - Functional Build Specification.
- [test-suite](./test-suite.md) - Test Suite for a single AC.
- [manifest](./manifest.md) - project roots-only manifest.

## Cross-cutting

- [id-conventions](./id-conventions.md) - the `^<PREFIX>-\d{3,}$` pattern, prefix table, hierarchical AC ids, and the file/nested asymmetry.
- [file-layout](./file-layout.md) - recommended `rcf/` tree, with TS files outside it (code-adjacent).

## Out of scope (deliberately)

What lives elsewhere:

- No validator CLI ships from this repo. Use the JSON Schema validator native to your language.
- No language-specific consumer SDKs or wrappers.
- No cross-document reference validation (Phase 5 traceability tooling territory).
- No status derivation from runtime test evidence (Phase 5 traceability).
- No file-layout enforcement (the schemas describe documents, not where they sit on disk).
- No SDD adapter (Phase 6 of `rcf-build-lite`).

See the top-level [README](../README.md) for install and consumer-setup guidance across Node, Python, and Java.
