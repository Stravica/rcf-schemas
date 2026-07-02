# tac.schema.json

Technical Architecture Component. One file per architectural component. Verbose per-component descriptions are fine; the schema does not constrain length.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.2.0/tac.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `tacId` | `^TAC-\d{3,}$` | This component's identifier. |
| `prdId` | `^PRD-\d{3,}$` | Root PRD. |
| `tadId` | `^TAD-\d{3,}$` | Parent TAD. |
| `version` | semver | Per-document version. |
| `status` | `authoringStatus` enum | Lifecycle status. |
| `name` | string, min 1 | Human-readable component name. |
| `purpose` | string, min 1 | One-paragraph statement of what this component is for. |
| `responsibilities` | array of strings, min 1 | What the component owns. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `internalStructure` | string | Module breakdown, sub-component shape, key data types described in prose. |
| `interfaces` | array of `interfaceDef` | What the component exposes (APIs, events, CLIs, web components, daemons, etc.). |
| `dependencies` | array of `dependencyRef` | What this component depends on (other TACs or external systems). |
| `tradeoffs` | string | Design trade-offs accepted. |
| `notes` | string | Free-form notes the schema has no opinion on. |

## Sub-schemas

### `interfaceDef`

Required: `name`, `kind`. Optional: `description`.

`kind` is an **open string**, not an enum. Enumerating every kind of interface a component can expose (api, event, library, cli, SPA, web component, cron, daemon, microservice, batch...) is doomed; heavy `"other"` use in a closed enum signals the enum doesn't fit. The open string preserves the field for implementation-level filtering without imposing a brittle constraint.

### `dependencyRef`

Required: `name`, `kind`. Optional: `tacId` (when `kind` is `tac`), `description`.

`kind` IS a closed enum here: `tac` (internal TAC-to-TAC dependency) or `external` (third-party services, libraries, infrastructure). The internal/external split is genuinely binary at the schema level, so the enum fits.

## Example

See `fixtures/valid/tac/tac-002-comprehensive.json` for a fuller TAC with multiple interfaces, mixed internal and external dependencies, and trade-offs called out.
