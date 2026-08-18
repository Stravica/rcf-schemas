// Byte-for-byte back-compat freeze.
//
// Proves that a frozen pre-0.4.4 manifest fixture is validated by the
// current schemas WITHOUT any content mutation. If the schemas ever require
// content coercion or default-injection at read time, this test will fail:
// the fixture is read as raw bytes, its sha256 is pinned, and it is parsed
// and validated exactly as-is.
//
// The fixture is the sort of manifest a project on 0.4.3 or earlier would
// have written before the blueprints[] and standards[] sections shipped.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { buildAjv, getSchemaByName, REPO_ROOT } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'manifest.schema.json');

const FIXTURE_PATH = join(REPO_ROOT, 'fixtures', 'valid', 'manifest', 'manifest-011-preblueprint-chain-frozen.json');
const EXPECTED_SHA256 = '080074d8bc6d29088a2d194dbce34c95e6a9c9e5752d2de9e75f3343d65b4d8a';
const EXPECTED_BYTES = 283;

test('back-compat freeze: frozen pre-0.4.4 fixture bytes have not drifted', async () => {
  const bytes = await readFile(FIXTURE_PATH);
  assert.equal(bytes.length, EXPECTED_BYTES, 'fixture byte length changed; do NOT reset the pin without a matching 0.x bump');
  const actual = createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual, EXPECTED_SHA256, 'fixture sha256 changed; do NOT reset the pin without a matching 0.x bump');
});

test('back-compat freeze: frozen pre-0.4.4 fixture validates on the current schemas byte-for-byte', async () => {
  const bytes = await readFile(FIXTURE_PATH);
  const doc = JSON.parse(bytes.toString('utf8'));
  const ok = validate(doc);
  if (!ok) {
    assert.fail(`frozen fixture failed validation: ${JSON.stringify(validate.errors, null, 2)}`);
  }
  assert.equal(ok, true);
});
