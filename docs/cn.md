# cn.schema.json

Code Node. One file per node. Bridges the requirements graph to source code: identity is a working-tree path, `implementsAcIds` anchors the node into the AC layer, `dependencies` declares CN-to-CN edges.

## Canonical `$id`

`https://schemas.stravica.io/rcf/v0.3.0/cn.schema.json`

## Required fields

| Field | Type | Notes |
|---|---|---|
| `cnId` | `^CN-\d{3,}$` | This node's identifier. |
| `path` | string, min 1 | Repo-relative source path, optionally `#symbol`-suffixed. |
| `implementsAcIds` | array of `acId`, `minItems: 0` | Acceptance criteria this node satisfies. May be empty: an orphan CN (utilities, glue, wiring) is a legitimate state. |
| `version` | semver | Per-document version. |
| `status` | `cnStatus` enum (`draft`, `approved`, `deprecated`) | Lifecycle status. |
| `createdAt` / `updatedAt` | ISO 8601 date-time | Lifecycle timestamps. |

## Optional fields

| Field | Type | Purpose |
|---|---|---|
| `title` | string | Short human-readable label. |
| `description` | string | Free-form description of what the node does. |
| `dependencies` | array of `cnId`, `minItems: 0` | Code nodes this node depends on (CN-to-CN edges). Hand-declared. |

## Identity: `path`, optionally `#symbol`-suffixed

Two granularities, both supported by the same `path` field:

- **File-level:** `"src/store/validator.js"` - coarse "this module serves these ACs" mapping.
- **Symbol-level:** `"src/store/validator.js#getAjv"` - precise, load-bearing nodes.

Granularity is not a stored field. It is fully derivable from the presence of `#` in `path`: a stored copy would be a cross-field consistency bug waiting to happen. A tool that needs to distinguish the two checks for `#` in the path string.

The `path` pattern (`^[^#]+(#[A-Za-z_$][A-Za-z0-9_$]*)?$`) allows at most one `#symbol` suffix, and the symbol portion must look like a valid JS/TS identifier start. This is a shape check only: the schema does not (and cannot) verify the path exists or the symbol resolves in any particular working tree. That is validation-time tooling's job, not the schema's.

## Edges

- **`implementsAcIds[]`** (CN -> AC): the anchor into the spec graph. May be empty.
- **`dependencies[]`** (CN -> CN): what this node depends on. Optional, hand-declared in this schema version. Auto-derivation from static analysis tooling is a consumer-side concern, not a schema concern.

## Example

See `fixtures/valid/cn/cn-002-comprehensive.json` for a symbol-level CN with both edge types populated.

## Recommended file layout

`rcf/code-nodes/`, file naming `cn-NNN.json` (or `CN-NNN.json`; the schema does not constrain filenames). See [file-layout](./file-layout.md).
