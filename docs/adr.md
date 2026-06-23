# adr.schema.json

Architectural Decision Record. One per decision, one file each. Follows the Nygard convention (and MADR variant).

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.1.0/adr.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `adrId` | `^ADR-\d{3,}$` | This ADR's identifier. |
| `prdId` | `^PRD-\d{3,}$` | Root PRD. |
| `tadId` | `^TAD-\d{3,}$` | Parent TAD. |
| `version` | semver | Per-document version. |
| `status` | `adrStatus` enum: `proposed`, `accepted`, `superseded`, `deprecated` | ADR-specific lifecycle. |
| `title` | string, min 1 | One-line decision title. |
| `context` | string, min 1 | The situation that forced the decision. |
| `decision` | string, min 1 | The decision itself. |
| `consequences` | string, min 1 | What follows from it (positive and negative). |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `alternativesConsidered` | array of `alternative` | The MADR extension. |
| `supersededBy` | `adrId` | When status is `superseded`, point at the ADR that replaced this. |
| `relatedAdrs` | array of `adrId` | Cross-links between related decisions. |

## Status enum (different from the authoring-status used by other docs)

ADRs don't go through `draft -> review -> needsRevision -> approved`. They're `proposed`, then `accepted`, then potentially `superseded` (by a later decision) or `deprecated` (the area itself went away). This is intentional: the Nygard / MADR convention is widely understood and worth following.

## Why ADRs are one file each

Per-decision git history is the entire point. A decision evolves: it gets proposed, accepted, then years later superseded by a different decision. Squashing them into one big doc destroys that history and produces merge conflicts on every append. One file each: clean blame, clean supersession diff, append-friendly.

## Example

See `fixtures/valid/adr/adr-002-comprehensive.json` for a `superseded` ADR with alternatives considered and a `supersededBy` link.
