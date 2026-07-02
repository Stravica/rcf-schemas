// Targeted tests for user-story.schema.json - covers the 0.2.1 shape
// (optional tacIds[] cross-link to TAC components).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'user-story.schema.json');

const base = {
  usId: 'US-101',
  prdId: 'PRD-001',
  reqId: 'REQ-001',
  version: '0.1.0',
  status: 'draft',
  title: 'Capture a markdown note',
  asA: 'writer',
  iWant: 'to jot a markdown note',
  soThat: 'I can come back to it later',
  acceptanceCriteria: [
    {
      id: 'AC-101-1',
      description: 'A note is persisted with its markdown body intact.',
      testable: true
    }
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('user-story: minimal US without tacIds validates (field is optional)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('user-story: US with populated tacIds validates', () => {
  const doc = { ...base, tacIds: ['TAC-001', 'TAC-002'] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: US with empty tacIds[] validates (minItems 0)', () => {
  const doc = { ...base, tacIds: [] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: US with a malformed tacId is rejected', () => {
  const doc = { ...base, tacIds: ['INVALID-ID'] };
  assert.equal(validate(doc), false);
});
