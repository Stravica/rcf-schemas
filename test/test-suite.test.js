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

// -- 0.4.0 additions (Track A runtime provenance) -----------------------

test('test-suite: TC runtimeProvenance with a live profile validates', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-001-happy',
        acId: 'AC-001',
        description: 'x',
        status: 'passing',
        runtimeProvenance: {
          profile: 'live',
          envVarsRequired: ['RESEND_API_KEY'],
          externalHostsReached: ['api.resend.com']
        }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: TC runtimeProvenance rejects unknown profile', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-001-happy',
        acId: 'AC-001',
        description: 'x',
        status: 'passing',
        runtimeProvenance: { profile: 'somehow' }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('test-suite: TC runtimeProvenance rejects unknown property', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-001-happy',
        acId: 'AC-001',
        description: 'x',
        status: 'passing',
        runtimeProvenance: { profile: 'mock', credential: 'secret' }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('test-suite: pre-0.4.0 TS (no runtimeProvenance) still validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

// -- 0.4.3 additions (widened TS/TC id patterns) ------------------------

test('test-suite: four-digit tsId validates (widened to \\d{3,})', () => {
  const doc = { ...base, id: 'TS-1000' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: TC id with four-digit TS suffix validates', () => {
  const doc = {
    ...base,
    id: 'TS-1000',
    testCases: [
      { id: 'TC-1000-happy-path', acId: 'AC-001', description: 'x', status: 'pending' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: two-digit tsId still rejected (three-digit minimum)', () => {
  const doc = { ...base, id: 'TS-42' };
  assert.equal(validate(doc), false);
});

// -- 0.4.3 additions (optional TC scope tag) ----------------------------

test('test-suite: TC without scope still validates (field is optional, back-compat)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('test-suite: TC with scope=library validates', () => {
  const doc = {
    ...base,
    testCases: [
      { id: 'TC-001-happy', acId: 'AC-001', description: 'x', status: 'passing', scope: 'library' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: TC with scope=runtime validates', () => {
  const doc = {
    ...base,
    testCases: [
      { id: 'TC-001-boot', acId: 'AC-001', description: 'boot smoke', status: 'passing', scope: 'runtime' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: TC with scope=deployed validates', () => {
  const doc = {
    ...base,
    testCases: [
      { id: 'TC-001-deploy', acId: 'AC-001', description: 'deploy smoke', status: 'passing', scope: 'deployed' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: TC with scope=unclassified validates (migration state)', () => {
  const doc = {
    ...base,
    testCases: [
      { id: 'TC-001-legacy', acId: 'AC-001', description: 'x', status: 'passing', scope: 'unclassified' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: TC with unknown scope value rejected', () => {
  const doc = {
    ...base,
    testCases: [
      { id: 'TC-001-x', acId: 'AC-001', description: 'x', status: 'passing', scope: 'production' }
    ]
  };
  assert.equal(validate(doc), false);
});

test('test-suite: TC with scope alongside runtimeProvenance validates', () => {
  const doc = {
    ...base,
    testCases: [
      {
        id: 'TC-001-live',
        acId: 'AC-001',
        description: 'live-provider smoke',
        status: 'passing',
        scope: 'deployed',
        runtimeProvenance: {
          profile: 'live',
          envVarsRequired: ['RESEND_API_KEY'],
          externalHostsReached: ['api.resend.com']
        }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

// -- 0.4.4 additions (slug-prefixed tsId + usId for blueprint-contributed TS fragments) -

test('test-suite: slug-prefixed tsId (spa-TS-001) with slug-prefixed usId validates', () => {
  const doc = {
    id: 'spa-TS-001',
    usId: 'spa-US-101',
    title: 'Blueprint-owned test suite',
    purpose: 'Cover blueprint-contributed AC surfaces.',
    testLevel: 'unit',
    acIds: ['AC-001'],
    testCases: [
      {
        id: 'TC-001-happy-path',
        acId: 'AC-001',
        description: 'happy path',
        status: 'pending'
      }
    ],
    status: 'draft',
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('test-suite: uppercase slug prefix on tsId (SPA-TS-001) is rejected', () => {
  const doc = {
    id: 'SPA-TS-001',
    usId: 'US-101',
    title: 'bad',
    purpose: 'bad',
    testLevel: 'unit',
    acIds: ['AC-001'],
    testCases: [
      { id: 'TC-001-x', acId: 'AC-001', description: 'x', status: 'pending' }
    ],
    status: 'draft',
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  };
  assert.equal(validate(doc), false);
});
