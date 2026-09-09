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

// -- 0.6.0 additions (AC determinism marker + US tags) ------------------

test('user-story: AC without determinism validates (field is optional, absence resolves to deterministic in consumers)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('user-story: AC with determinism=deterministic validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'x', testable: true, determinism: 'deterministic' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with determinism=nonDeterministic validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'x', testable: true, determinism: 'nonDeterministic' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with unknown determinism value rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'x', testable: true, determinism: 'partial' }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: AC with determinism alongside scope and provenance validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'the assistant answers the user question',
        testable: true,
        scope: 'runtime',
        determinism: 'nonDeterministic',
        provenance: { authoredBy: 'operator' }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: US without tags validates (field is optional, back-compat)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('user-story: US with tags array of strings validates', () => {
  const doc = { ...base, tags: ['blueprint:spa', 'auth'] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: US with empty tags[] validates (no minItems)', () => {
  const doc = { ...base, tags: [] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: US with non-string tag entry rejected', () => {
  const doc = { ...base, tags: ['ok', 42] };
  assert.equal(validate(doc), false);
});

// -- 0.6.2 additions (AC ownership, disposition, and vendor citation) ---

test('user-story: AC with ownerRef pointing at a TAC field validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'response matches the owning TAC interface',
        testable: true,
        ownerRef: {
          tacId: 'TAC-401-durable-objects-namespace',
          field: 'interfaces.migration.keyword'
        }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with ownerRef pointing at an ADR validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'retry policy matches the owning ADR decision',
        testable: true,
        ownerRef: { adrId: 'ADR-011-retry-policy' }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with ownerRef as a bare string is rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        ownerRef: 'TAC-401'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: AC with ownerRef carrying an unknown property is rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        ownerRef: { tacId: 'TAC-401-turnstile', section: 'headers' }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: AC with disposition=fixed validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'x', testable: true, disposition: 'fixed' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with disposition=template validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'x', testable: true, disposition: 'template' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: AC with disposition outside the enum is rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'x', testable: true, disposition: 'invariant' }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: AC with a full vendorCitation validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        disposition: 'fixed',
        vendorCitation: {
          url: 'https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/',
          verifiedOn: '2026-09-08'
        }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: vendorCitation without verifiedOn is rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        vendorCitation: { url: 'https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/' }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: vendorCitation without url is rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        vendorCitation: { verifiedOn: '2026-09-08' }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: vendorCitation with a bad verifiedOn date is rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        vendorCitation: {
          url: 'https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/',
          verifiedOn: '08/09/2026'
        }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: vendorCitation with an unknown property is rejected', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'x',
        testable: true,
        vendorCitation: {
          url: 'https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/',
          verifiedOn: '2026-09-08',
          checkedBy: 'reviewer'
        }
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('user-story: AC combining ownerRef, disposition, vendorCitation with earlier optional fields validates', () => {
  const doc = {
    ...base,
    acceptanceCriteria: [
      {
        id: 'AC-101-1',
        description: 'combined shape',
        given: 'a Worker configuration',
        when: 'the deploy runs',
        then: 'the migration keyword matches the owning TAC field',
        testable: true,
        scope: 'deployed',
        ownerRef: {
          tacId: 'TAC-401-durable-objects-namespace',
          field: 'interfaces.migration.keyword'
        },
        disposition: 'fixed',
        vendorCitation: {
          url: 'https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/',
          verifiedOn: '2026-09-08'
        },
        provenance: { authoredBy: 'operator' }
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});
