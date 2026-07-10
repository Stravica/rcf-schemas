# Contributing to RCF Schemas

Thanks for taking the time to contribute. This package is deliberately narrow: JSON Schema files, docs and fixtures, no code. Most contributions are schema changes, fixture additions, or documentation fixes.

## Development setup

You need:

- Node.js >= 24
- pnpm 9

Then:

```sh
git clone https://github.com/Stravica/rcf-schemas.git
cd rcf-schemas
pnpm install
pnpm test
```

The test suite loads every schema under `schemas/`, validates it against the `fixtures/valid/` and `fixtures/invalid/` fixtures, and must pass before you open a pull request.

## Making a schema change

- Every document schema lives in `schemas/*.schema.json` and cross-references shared definitions in `schemas/common.schema.json` via `$ref`.
- Add or update fixtures under `fixtures/valid/<kind>/` and `fixtures/invalid/<kind>/` to cover the change.
- Update the matching page under `docs/` so the schema reference stays in sync.
- Breaking changes are signalled by a minor version bump under the pre-1.0 convention (see `README.md` Versioning section); additive changes are a patch bump. Record the change in `CHANGELOG.md`.

## Pull requests

- Branch from `main`, using a short descriptive branch name.
- CI must pass. The suite runs on every pull request; a red build will not be reviewed.
- Never force-push to `main`. Force-pushing your own feature branch to rework a review is fine.
- Keep pull requests focused. One schema change per PR reviews faster and traces cleaner.

## Where to ask

- **Bugs and defects:** open an [issue](https://github.com/Stravica/rcf-schemas/issues).
- **Security problems:** never open a public issue; see [SECURITY.md](./SECURITY.md).

## Licensing

This project is licensed under Apache-2.0, and contributions are accepted on the same inbound = outbound terms: by submitting a contribution you agree it is licensed under Apache-2.0. There is no CLA and no DCO ceremony.
