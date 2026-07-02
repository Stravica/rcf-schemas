// Targeted tests for req.schema.json - covers the 0.2.0 shape (prdId
// mandatory back-reference to PRD).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'req.schema.json');

const base = {
  reqId: 'REQ-001',
  prdId: 'PRD-001',
  title: 'Capture markdown notes',
  description: 'The system must let a user write a markdown note and persist it.',
  category: 'functional',
  domain: 'capture',
  priority: 'must',
  version: '0.1.0',
  status: 'draft',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('req: minimal REQ with prdId validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('req: missing prdId is rejected (0.2.0 back-reference is mandatory)', () => {
  const doc = { ...base };
  delete doc.prdId;
  assert.equal(validate(doc), false);
});

test('req: bad prdId prefix is rejected', () => {
  const doc = { ...base, prdId: 'PROD-001' };
  assert.equal(validate(doc), false);
});

test('req: unknown category rejected', () => {
  const doc = { ...base, category: 'operational' };
  assert.equal(validate(doc), false);
});
