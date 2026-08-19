// Targeted tests for build-sequence.schema.json - covers the 0.2.0 shape
// (fbs[] array removed; FBS carries bsId + buildOrder + executionStatus).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'build-sequence.schema.json');

const base = {
  bsId: 'BS-001',
  prdId: 'PRD-001',
  version: '0.1.0',
  status: 'draft',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('build-sequence: BS without fbs[] validates (field removed in 0.2.0)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('build-sequence: BS with legacy fbs[] is rejected', () => {
  const doc = { ...base, fbs: [{ fbsId: 'FBS-001', order: 1 }] };
  assert.equal(validate(doc), false);
});

test('build-sequence: missing prdId is rejected', () => {
  const doc = { ...base };
  delete doc.prdId;
  assert.equal(validate(doc), false);
});

// -- 0.4.4 additions (slug-prefixed bsId for blueprint-contributed BS fragments) -

test('build-sequence: slug-prefixed bsId (spa-BS-001) validates', () => {
  const doc = {
    bsId: 'spa-BS-001',
    prdId: 'PRD-001',
    version: '0.1.0',
    status: 'draft',
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('build-sequence: uppercase slug prefix on bsId (SPA-BS-001) is rejected', () => {
  const doc = {
    bsId: 'SPA-BS-001',
    prdId: 'PRD-001',
    version: '0.1.0',
    status: 'draft',
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  };
  assert.equal(validate(doc), false);
});
