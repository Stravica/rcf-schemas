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

// -- 0.4.0 additions (Track C+D AC provenance) --------------------------

test('user-story: AC with baseline provenance validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'shared nav renders on every authenticated route',
        testable: true,
        provenance: {
          authoredBy: 'baseline',
          baselineKey: 'webUi.sharedNav',
          injectedAt: '2026-07-30T14:22:00Z',
          sourceReqShape: 'webUi',
          acceptedByOperatorAt: '2026-07-30T14:25:00Z'
        }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC provenance rejects unknown authoredBy', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        provenance: { authoredBy: 'guessed' }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: AC provenance rejects unknown sourceReqShape', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        provenance: { authoredBy: 'baseline', sourceReqShape: 'chatbot' }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: AC provenance authoredBy=operator alone validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        provenance: { authoredBy: 'operator' }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

// -- 0.4.3 additions (optional AC scope tag) ----------------------------

test('user-story: AC without scope still validates (field is optional, back-compat)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('user-story: AC with scope=library validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'parser rejects empty string', testable: true, scope: 'library' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with scope=runtime validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'on startup, config loads', testable: true, scope: 'runtime' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with scope=deployed validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'probe fires against real target', testable: true, scope: 'deployed' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with scope=unclassified validates (migration state)', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'x', testable: true, scope: 'unclassified' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with unknown scope value rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'x', testable: true, scope: 'production' }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: AC with scope alongside provenance validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'boot-scope observable',
        testable: true,
        scope: 'runtime',
        provenance: { authoredBy: 'baseline', baselineKey: 'httpApi.bootIntegration', sourceReqShape: 'httpApi' }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

// -- 0.4.4 additions (slug-prefixed usId / reqId for blueprint contributions) -

test('user-story: slug-prefixed usId (spa-US-101) with slug-prefixed reqId validates', () => {
  const doc = { ...base, usId: 'spa-US-101', reqId: 'spa-REQ-001' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: uppercase slug prefix on usId (SPA-US-101) is rejected', () => {
  const doc = { ...base, usId: 'SPA-US-101' };
  assert.equal(validate(doc), false);
});

test('user-story: double-hyphen slug prefix on usId (spa--US-101) is rejected', () => {
  const doc = { ...base, usId: 'spa--US-101' };
  assert.equal(validate(doc), false);
});

test('user-story: numeric-only usId still validates (back-compat)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});
