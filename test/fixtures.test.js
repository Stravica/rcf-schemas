// Validates every fixture under fixtures/valid/<schema>/*.json against the
// matching schema (must pass) and every fixture under fixtures/invalid/<schema>/*.json
// against the matching schema (must fail).
//
// Fixture file naming for invalid: <prefix>-NNN-<reason>.json, the reason is
// descriptive only (the test doesn't depend on it). Each invalid fixture is
// expected to fail for exactly one reason; the test asserts validation fails,
// it does not assert the specific error.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { buildAjv, getSchemaByName, DOC_TYPE_SCHEMAS, REPO_ROOT } from './loadSchemas.js';

const FIXTURES_DIR = join(REPO_ROOT, 'fixtures');

async function listFixtures(kind, schemaName) {
  const dir = join(FIXTURES_DIR, kind, schemaName);
  try {
    await stat(dir);
  } catch {
    return [];
  }
  const entries = await readdir(dir);
  return entries.filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
}

const { ajv } = await buildAjv();

for (const schemaName of DOC_TYPE_SCHEMAS) {
  const validator = getSchemaByName(ajv, `${schemaName}.schema.json`);

  test(`valid fixtures: ${schemaName} (at least one present)`, async () => {
    const files = await listFixtures('valid', schemaName);
    assert.ok(files.length >= 1, `expected at least one valid fixture under fixtures/valid/${schemaName}/`);
    for (const file of files) {
      const data = JSON.parse(await readFile(file, 'utf8'));
      const ok = validator(data);
      if (!ok) {
        const errs = JSON.stringify(validator.errors, null, 2);
        assert.fail(`expected ${file} to validate; ajv errors:\n${errs}`);
      }
    }
  });

  test(`invalid fixtures: ${schemaName} (at least one present, all fail)`, async () => {
    const files = await listFixtures('invalid', schemaName);
    assert.ok(files.length >= 1, `expected at least one invalid fixture under fixtures/invalid/${schemaName}/`);
    for (const file of files) {
      const data = JSON.parse(await readFile(file, 'utf8'));
      const ok = validator(data);
      assert.equal(ok, false, `expected ${file} to FAIL validation but it passed`);
    }
  });
}
