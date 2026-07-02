// Targeted tests for test-suite.schema.json - new 0.2.0 shape (id, usId,
// title, purpose, testLevel, acIds[], testCases[] inline, status).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'test-suite.schema.json');

const base = {
  id: 'TS-001',
  usId: 'US-001',
  title: 'Note persistence smoke',
  purpose: 'Cover the create-and-reopen round trip.',
  testLevel: 'unit',
  acIds: ['AC-001'],
  testCases: [
    {
      id: 'TC-001-happy-path',
      acId: 'AC-001',
      description: 'Note survives reopen.',
      status: 'pending'
    }
  ],
  status: 'draft',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('test-suite: minimal TS validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('test-suite: missing usId rejected', () => {
  const doc = { ...base };
  delete doc.usId;
  assert.equal(validate(doc), false);
});

test('test-suite: empty acIds rejected (minItems 1)', () => {
  const doc = { ...base, acIds: [] };
  assert.equal(validate(doc), false);
});

test('test-suite: empty testCases[] accepted (minItems 0)', () => {
  const doc = { ...base, testCases: [] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: TC id pattern accepts hyphenated slug', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-042-happy-path',
        acId: 'AC-001',
        description: 'x',
        status: 'passing'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: TC id pattern rejects two-digit TS suffix', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-42-slug',
        acId: 'AC-001',
        description: 'x',
        status: 'pending'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('test-suite: TC id pattern rejects uppercase slug', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-001-HappyPath',
        acId: 'AC-001',
        description: 'x',
        status: 'pending'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('test-suite: TC status enum enforced', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-001-a',
        acId: 'AC-001',
        description: 'x',
        status: 'approved'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('test-suite: testLevel enum enforced (performance is not a level)', () => {
  const doc = { ...base, testLevel: 'performance' };
  assert.equal(validate(doc), false);
});

test('test-suite: TC testPointer is optional string', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-001-a',
        acId: 'AC-001',
        description: 'x',
        testPointer: 'packages/notes/test/persist.test.js::persistsOnReopen',
        status: 'passing'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: legacy prdId field rejected (0.2.0 drops it)', () => {
  const doc = { ...base, prdId: 'PRD-001' };
  assert.equal(validate(doc), false);
});
