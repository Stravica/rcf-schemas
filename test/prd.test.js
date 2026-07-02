// Targeted tests for prd.schema.json - covers the 0.2.0 shape (no
// requirementIds; REQ carries prdId back-reference).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'prd.schema.json');

test('prd: PRD without requirementIds validates (field removed in 0.2.0)', () => {
  const doc = {
    prdId: 'PRD-001',
    productName: 'Acme Notes',
    version: '0.1.0',
    status: 'draft',
    problemStatement: 'Users lose track of their notes.',
    objectives: ['Single home for personal notes.'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('prd: PRD with legacy requirementIds is rejected', () => {
  const doc = {
    prdId: 'PRD-001',
    productName: 'Acme Notes',
    version: '0.1.0',
    status: 'draft',
    problemStatement: 'x',
    objectives: ['y'],
    requirementIds: ['REQ-001'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };
  assert.equal(validate(doc), false);
});

test('prd: missing objectives is rejected', () => {
  const doc = {
    prdId: 'PRD-001',
    productName: 'Acme Notes',
    version: '0.1.0',
    status: 'draft',
    problemStatement: 'x',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };
  assert.equal(validate(doc), false);
});

test('prd: authoring status enum enforced', () => {
  const doc = {
    prdId: 'PRD-001',
    productName: 'Acme Notes',
    version: '0.1.0',
    status: 'Draft',
    problemStatement: 'x',
    objectives: ['y'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };
  assert.equal(validate(doc), false);
});
