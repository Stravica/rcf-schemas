# @stravica-ai/rcf-schemas

JSON Schemas for the [Requirements Confidence Framework (RCF)](https://stravica.ai/rcf-methodology/).

**Language-neutral. No code in this package, only schema files, docs, and fixtures.** Every consumer language is first-class: Node, Python, Java, or anything else with a JSON Schema 2020-12 validator.

> **Status:** v0.2.0 - public preview.
>
> This package is available on the public npm registry as a preview. Ship-quality contract, small consumer surface. The methodology's reference implementation (`Stravica/rcf-build-lite`) is being migrated to consume 0.2.0 during Phase 3.7 of the RCF build and stays private until Phase 9; expect the public consumer path to sharpen up as that lands. If you want to experiment, `npm install @stravica-ai/rcf-schemas` is stable; docs at `https://schemas.stravica.io/` land at Phase 9.

## What's here

- **11 schema files** in `schemas/`:
  - `common.schema.json` - shared `$defs` (id patterns, status enums, version, timestamp, `docRef`). Referenced via `$ref` from every other schema.
  - `prd`, `req`, `user-story`, `tad`, `tac`, `adr`, `build-sequence`, `fbs`, `test-suite`, `manifest`.
- **Per-schema docs** in `docs/` (one page per schema) plus cross-cutting `id-conventions.md` and `file-layout.md`.
- **JSON test fixtures** in `fixtures/valid/` and `fixtures/invalid/` (every schema covered).
- **CHANGELOG** in `CHANGELOG.md`.

## Install

### Node consumers

```sh
npm install @stravica-ai/rcf-schemas
```

The package is on the public npm registry. No scope-registry configuration is needed for installation.

### Python consumers (Phase 9 onwards)

```sh
pip install stravica-rcf-schemas
```

### Java consumers (Phase 9 onwards)

Maven coordinate:

```
io.stravica.rcf:rcf-schemas:0.2.0
```

### Direct fetch (Phase 9 onwards)

Each schema is fetchable by its canonical `$id`:

```
https://schemas.stravica.io/rcf/v0.2.0/<name>.schema.json
```

## Use

The schemas use cross-file `$ref` into `common.schema.json`. Register the bundle once at validator init; after that `$ref` resolution is transparent.

### Node + ajv

```js
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkgRoot = require.resolve('@stravica-ai/rcf-schemas/package.json').replace(/\/package\.json$/, '');

const names = [
  'common', 'prd', 'req', 'user-story', 'tad', 'tac', 'adr',
  'build-sequence', 'fbs', 'test-suite', 'manifest'
];

const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);

for (const name of names) {
  const schema = JSON.parse(await readFile(`${pkgRoot}/schemas/${name}.schema.json`, 'utf8'));
  ajv.addSchema(schema);
}

const validatePrd = ajv.getSchema('https://schemas.stravica.io/rcf/v0.2.0/prd.schema.json');
const ok = validatePrd(myPrdDoc);
if (!ok) console.error(validatePrd.errors);
```

### Python + jsonschema

```python
from importlib.resources import files
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
import json

# Phase 9: pip install stravica-rcf-schemas
pkg = files('stravica_rcf_schemas') / 'schemas'

names = [
    'common', 'prd', 'req', 'user-story', 'tad', 'tac', 'adr',
    'build-sequence', 'fbs', 'test-suite', 'manifest'
]

resources = []
for name in names:
    schema = json.loads((pkg / f'{name}.schema.json').read_text())
    resources.append((schema['$id'], Resource.from_contents(schema)))

registry = Registry().with_resources(resources)
prd_schema = json.loads((pkg / 'prd.schema.json').read_text())
validator = Draft202012Validator(prd_schema, registry=registry)
errors = list(validator.iter_errors(my_prd_doc))
```

### Java + everit-json-schema or networknt/json-schema-validator

Configure a `SchemaClient` (everit) or `SchemaLoader` (networknt) that resolves `$id` URLs from a local map populated from the bundled schemas on the classpath. See your validator's docs for the exact recipe; both libraries support multi-file `$ref` for JSON Schema 2020-12.

### Any other language

The schemas use JSON Schema Draft 2020-12. Any validator that supports 2020-12 + multi-file `$ref` will work. Register the 11 schemas (with `common.schema.json` first) and resolve by `$id`.

## Chain shape (0.2.0)

Every parent-child edge in the RCF chain is encoded exactly once, on the child, as a mandatory `<parent>Id` field. Parents never store child lists; walkers invert the child references at load time to build the `childrenByParent` map. This makes tree drift structurally impossible.

- PRD is the root of the requirements chain. REQ carries `prdId`.
- US carries `reqId` (unchanged from 0.1.0). AC lives inline in US as `acceptanceCriteria[]`.
- TAD is the root of the architecture chain. TAC and ADR each carry `tadId`.
- BS is the root of the build-sequence chain. FBS carries `bsId`, `buildOrder`, `executionStatus`, and `dependsOnFbsIds[]`.
- TS carries `usId` and `acIds[]` (the ACs verified). TC lives inline in TS with per-TC `acId`.

## Schema reference

Per-schema docs in [`docs/`](./docs/README.md):

- [common](./docs/common.md) | [prd](./docs/prd.md) | [req](./docs/req.md) | [user-story](./docs/user-story.md)
- [tad](./docs/tad.md) | [tac](./docs/tac.md) | [adr](./docs/adr.md)
- [build-sequence](./docs/build-sequence.md) | [fbs](./docs/fbs.md) | [test-suite](./docs/test-suite.md)
- [manifest](./docs/manifest.md)

Cross-cutting:

- [id-conventions](./docs/id-conventions.md) - the `^<PREFIX>-\d{3,}$` pattern, prefix table, hierarchical AC ids.
- [file-layout](./docs/file-layout.md) - recommended `rcf/` tree (not enforced).

## What's deliberately NOT shipped

The schemas repo is intentionally narrow:

- **No validator CLI.** Pick the JSON Schema validator native to your language.
- **No language-specific consumer SDKs or wrappers.**
- **No cross-document reference validation.** That's traceability tooling (Phase 5 of `rcf-build-lite`).
- **No status derivation from runtime evidence.** TS/TC pass/fail is runtime state, derived by traceability tooling.
- **No file-layout enforcement.** Recommendations live in `docs/file-layout.md`; the schemas describe documents, not where they sit on disk.
- **No SDD adapter.** The `rcf build <fbs-id>` markdown-assembly logic lives in `rcf-build-lite` (Phase 6 of that project), not here.

## Versioning

Pre-1.0 (0.x): breaking changes are signalled by a minor bump (`0.1.0` -> `0.2.0`) per semver 0.x convention. Patch bumps are additive only.

Post-1.0: breaking changes require a documented migration path.

See [CHANGELOG.md](./CHANGELOG.md).

## License

Apache 2.0, see [LICENSE](./LICENSE).
