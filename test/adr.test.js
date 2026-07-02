// Targeted tests for adr.schema.json - covers the 0.2.0 shape (draft
// prepended to adrStatus enum; tadId mandatory back-reference).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'adr.schema.json');

const base = {
  adrId: 'ADR-001',
  prdId: 'PRD-001',
  tadId: 'TAD-001',
  version: '0.1.0',
  status: 'accepted',
  title: 'x',
  context: 'y',
  decision: 'z',
  consequences: 'w',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('adr: minimal ADR with accepted status validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('adr: status "draft" is accepted (0.2.0 prepends draft to adrStatus)', () => {
  const doc = { ...base, status: 'draft' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('adr: authoringStatus values are rejected as ADR status', () => {
  const doc = { ...base, status: 'approved' };
  assert.equal(validate(doc), false);
});

test('adr: missing tadId is rejected', () => {
  const doc = { ...base };
  delete doc.tadId;
  assert.equal(validate(doc), false);
});

test('adr: supersededBy that is not an ADR id is rejected', () => {
  const doc = { ...base, status: 'superseded', supersededBy: 'TAC-001' };
  assert.equal(validate(doc), false);
});
