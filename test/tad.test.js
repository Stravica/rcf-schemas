// Targeted tests for tad.schema.json - covers the 0.2.0 shape (no
// componentIds, no architecturalDecisionIds; TAC and ADR carry tadId).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'tad.schema.json');

const base = {
  tadId: 'TAD-001',
  prdId: 'PRD-001',
  version: '0.1.0',
  status: 'draft',
  systemOverview: {
    executiveSummary: 'x',
    systemPurpose: 'y',
    architecturalApproach: 'z',
    keyCapabilities: ['w']
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('tad: TAD without componentIds validates (field removed in 0.2.0)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('tad: TAD with legacy componentIds is rejected', () => {
  const doc = { ...base, componentIds: ['TAC-001'] };
  assert.equal(validate(doc), false);
});

test('tad: TAD with legacy architecturalDecisionIds is rejected', () => {
  const doc = { ...base, architecturalDecisionIds: ['ADR-001'] };
  assert.equal(validate(doc), false);
});
