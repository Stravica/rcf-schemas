// Targeted tests for cn.schema.json (0.3.0) - Code Node identity, path shape,
// implementsAcIds/dependencies edges, and the dropped granularity field (D2:
// derived from the presence of '#' in path, never stored).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'cn.schema.json');

const base = {
  cnId: 'CN-001',
  path: 'src/store/validator.js',
  implementsAcIds: [],
  version: '0.1.0',
  status: 'draft',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('cn: minimal file-level CN validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('cn: symbol-level path (#symbol suffix) validates', () => {
  const doc = { ...base, path: 'src/store/validator.js#getAjv' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('cn: empty implementsAcIds[] is accepted (orphan CN is legitimate)', () => {
  assert.equal(validate({ ...base, implementsAcIds: [] }), true);
});

test('cn: populated implementsAcIds[] validates', () => {
  const doc = { ...base, implementsAcIds: ['AC-101-1', 'AC-201'] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('cn: dependencies[] is optional and validates when present', () => {
  const doc = { ...base, dependencies: ['CN-002', 'CN-003'] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('cn: bad cnId prefix is rejected', () => {
  const doc = { ...base, cnId: 'CODE-001' };
  assert.equal(validate(doc), false);
});

test('cn: bad dependency cnId shape is rejected', () => {
  const doc = { ...base, dependencies: ['not-a-cn-id'] };
  assert.equal(validate(doc), false);
});

test('cn: malformed acId in implementsAcIds is rejected', () => {
  const doc = { ...base, implementsAcIds: ['NOT-AN-AC'] };
  assert.equal(validate(doc), false);
});

test('cn: path with a second # is rejected (single #symbol suffix only)', () => {
  const doc = { ...base, path: 'src/a.js#foo#bar' };
  assert.equal(validate(doc), false);
});

test('cn: missing implementsAcIds is rejected (mandatory, may be empty)', () => {
  const doc = { ...base };
  delete doc.implementsAcIds;
  assert.equal(validate(doc), false);
});

test('cn: status enum enforced (review is not a CN status)', () => {
  const doc = { ...base, status: 'review' };
  assert.equal(validate(doc), false);
});

test('cn: granularity field is not part of the schema (rejected as additionalProperty, D2)', () => {
  const doc = { ...base, granularity: 'file' };
  assert.equal(validate(doc), false);
});
