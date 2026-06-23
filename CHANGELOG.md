# Changelog

All notable changes to `@stravica/rcf-schemas` are documented in this file.

The format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Pre-1.0 breaking changes are signalled by a minor bump per semver 0.x convention.

## 0.1.0 (initial release)

The first private release of the RCF JSON Schema bundle.

- 11 schema files in `schemas/`: `common`, `prd`, `req`, `user-story`, `tad`, `tac`, `adr`, `build-sequence`, `fbs`, `test-suite`, `manifest`.
- Per-schema docs in `docs/` (one page per schema) plus cross-cutting `id-conventions.md` and `file-layout.md`.
- JSON test fixtures in `fixtures/valid/` and `fixtures/invalid/` covering every schema.
- Strict by default (`additionalProperties: false`) on every object schema.
- Cross-file `$ref` via `common.schema.json`: shared id patterns, status enums, version string, timestamp format, and `docRef` shape live in one place.
- Canonical `$id` URLs (`https://schemas.stravica.io/rcf/v0.1.0/<name>.schema.json`) declared from the first release; the host goes live at Phase 9.
- Apache 2.0 license.

Published as `@stravica/rcf-schemas@0.1.0` on npm with `--access restricted` (private during the build phase; public flip at Phase 9 alongside PyPI and Maven Central simultaneously).
