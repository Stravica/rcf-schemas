// Meta-tests over the schema files themselves.
// Verifies coverage (11 files), strict-by-default (additionalProperties: false
// on every object schema), $id stability, and JSON Schema 2020-12 declaration.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadSchemas, SCHEMA_NAMES } from './loadSchemas.js';

function walkForObjects(node, path, hits) {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) walkForObjects(node[i], `${path}/${i}`, hits);
    return;
  }
  // An object schema is one where type === "object" AND properties is present.
  // We deliberately ignore object schemas that exist only as containers in
  // $defs without their own properties block (none expected in this set).
  if (node.type === 'object' && node.properties && typeof node.properties === 'object') {
    hits.push({ path, hasAdditionalProperties: 'additionalProperties' in node, value: node.additionalProperties });
  }
  for (const [key, child] of Object.entries(node)) {
    walkForObjects(child, `${path}/${key}`, hits);
  }
}

test('schema set has the 11 expected files', async () => {
  const schemas = await loadSchemas();
  const got = Object.keys(schemas).sort();
  const want = SCHEMA_NAMES.map((n) => `${n}.schema.json`).sort();
  assert.deepEqual(got, want);
});

test('every schema declares $schema = JSON Schema 2020-12', async () => {
  const schemas = await loadSchemas();
  for (const [name, schema] of Object.entries(schemas)) {
    assert.equal(
      schema.$schema,
      'https://json-schema.org/draft/2020-12/schema',
      `${name} must declare $schema = JSON Schema 2020-12`
    );
  }
});

test('every schema declares canonical $id', async () => {
  const schemas = await loadSchemas();
  for (const [name, schema] of Object.entries(schemas)) {
    const expected = `https://schemas.stravica.io/rcf/v0.2.0/${name}`;
    assert.equal(schema.$id, expected, `${name} $id mismatch`);
  }
});

test('every object schema declares additionalProperties: false (AC-102-1)', async () => {
  const schemas = await loadSchemas();
  for (const [name, schema] of Object.entries(schemas)) {
    const hits = [];
    walkForObjects(schema, '#', hits);
    for (const hit of hits) {
      assert.equal(
        hit.hasAdditionalProperties,
        true,
        `${name}${hit.path} is an object schema with properties but no additionalProperties declared`
      );
      assert.equal(
        hit.value,
        false,
        `${name}${hit.path} must declare additionalProperties: false (got ${JSON.stringify(hit.value)})`
      );
    }
  }
});
