// Targeted tests for tac.schema.json - covers the 0.2.0 shape (tadId
// mandatory back-reference to TAD).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'tac.schema.json');

const base = {
  tacId: 'TAC-001',
  prdId: 'PRD-001',
  tadId: 'TAD-001',
  version: '0.1.0',
  status: 'draft',
  name: 'Editor',
  purpose: 'Browser-resident markdown editor.',
  responsibilities: ['Render markdown'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('tac: minimal TAC with tadId validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('tac: missing tadId is rejected', () => {
  const doc = { ...base };
  delete doc.tadId;
  assert.equal(validate(doc), false);
});

test('tac: bad tadId prefix is rejected', () => {
  const doc = { ...base, tadId: 'TAC-001' };
  assert.equal(validate(doc), false);
});
