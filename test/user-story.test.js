// Targeted tests for user-story.schema.json - covers the 0.2.1 shape
// (optional tacIds[] cross-link to TAC components).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildAjv, getSchemaByName, REPO_ROOT } from './loadSchemas.js';

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

// -- 0.7.1 additions (per-AC probe, rcf-lite issue 349) -----------------

function withProbe(probe, extra = {}) {
  return {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'probe-bearing criterion', testable: true, ...extra, probe }
    ]
  };
}

function probeErrorShape(errors) {
  return errors.map((e) => [e.instancePath, e.keyword]);
}

// 0.9.0: the error set a probe with no assertion field produces (one required error per
// anyOf arm, then the anyOf itself).
const noAssertionErrors = [
  ['/acceptanceCriteria/0/probe', 'required'],
  ['/acceptanceCriteria/0/probe', 'required'],
  ['/acceptanceCriteria/0/probe', 'required'],
  ['/acceptanceCriteria/0/probe', 'required'],
  ['/acceptanceCriteria/0/probe', 'anyOf']
];

const fullProbe = {
  method: 'GET',
  path: '/api/notes?limit=1',
  expectStatus: 200,
  expectHeader: { name: 'content-type', match: 'application/json' },
  expectBody: { matches: '^\\{"notes":\\[' },
  selector: '[data-testid="notes-list"]',
  parityEnv: 'preview'
};

test('user-story: AC without probe still validates (back-compat, field is optional)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

// 0.9.0: a path-only probe asserts nothing and is rejected (validated from 0.7.1 to 0.8.0).
test('user-story: AC with a path-only probe is rejected on anyOf (a probe requires at least one assertion)', () => {
  assert.equal(validate(withProbe({ path: '/healthz' })), false);
  assert.deepEqual(probeErrorShape(validate.errors), noAssertionErrors);
});

test('user-story: AC with a minimal probe (path and expectStatus) validates', () => {
  assert.equal(validate(withProbe({ path: '/healthz', expectStatus: 200 })), true, JSON.stringify(validate.errors));
});

test('user-story: AC with a full probe (every field, expectBody.matches) validates', () => {
  assert.equal(validate(withProbe(fullProbe)), true, JSON.stringify(validate.errors));
});

test('user-story: probe with expectBody.contains validates', () => {
  const doc = withProbe({ path: '/', expectBody: { contains: 'Welcome' } });
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: probe accepts every method in the enum', () => {
  for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    assert.equal(validate(withProbe({ method, path: '/healthz', expectStatus: 200 })), true, `${method}: ${JSON.stringify(validate.errors)}`);
  }
});

test('user-story: probe method outside the enum (lowercase get) is rejected', () => {
  assert.equal(validate(withProbe({ method: 'get', path: '/healthz', expectStatus: 200 })), false);
  assert.deepEqual(probeErrorShape(validate.errors), [['/acceptanceCriteria/0/probe/method', 'enum']]);
});

test('user-story: probe without path is rejected', () => {
  assert.equal(validate(withProbe({ method: 'GET', expectStatus: 200 })), false);
});

test('user-story: probe with an empty path is rejected', () => {
  assert.equal(validate(withProbe({ path: '', expectStatus: 200 })), false);
  assert.deepEqual(probeErrorShape(validate.errors), [['/acceptanceCriteria/0/probe/path', 'minLength']]);
});

test('user-story: probe with an unknown property is rejected', () => {
  assert.equal(validate(withProbe({ path: '/healthz', expectStatus: 200, timeoutMs: 500 })), false);
  assert.deepEqual(probeErrorShape(validate.errors), [['/acceptanceCriteria/0/probe', 'additionalProperties']]);
});

test('user-story: probe as a bare string is rejected', () => {
  assert.equal(validate(withProbe('/healthz')), false);
});

test('user-story: probe expectBody with both contains and matches is rejected', () => {
  assert.equal(validate(withProbe({ path: '/', expectBody: { contains: 'notes', matches: '^\\{' } })), false);
});

test('user-story: probe expectBody with neither contains nor matches is rejected', () => {
  assert.equal(validate(withProbe({ path: '/', expectBody: {} })), false);
});

test('user-story: probe expectBody with an unknown property is rejected', () => {
  assert.equal(validate(withProbe({ path: '/', expectBody: { contains: 'notes', equals: 'notes' } })), false);
});

test('user-story: probe expectBody.contains as an empty string is rejected', () => {
  assert.equal(validate(withProbe({ path: '/', expectBody: { contains: '' } })), false);
});

test('user-story: probe expectStatus 600 is rejected', () => {
  assert.equal(validate(withProbe({ path: '/healthz', expectStatus: 600 })), false);
});

test('user-story: probe expectStatus 99 is rejected', () => {
  assert.equal(validate(withProbe({ path: '/healthz', expectStatus: 99 })), false);
});

test('user-story: probe expectStatus bounds 100 and 599 validate', () => {
  assert.equal(validate(withProbe({ path: '/healthz', expectStatus: 100 })), true, JSON.stringify(validate.errors));
  assert.equal(validate(withProbe({ path: '/healthz', expectStatus: 599 })), true, JSON.stringify(validate.errors));
});

test('user-story: probe expectStatus as a non-integer is rejected', () => {
  assert.equal(validate(withProbe({ path: '/healthz', expectStatus: 200.5 })), false);
  assert.equal(validate(withProbe({ path: '/healthz', expectStatus: '200' })), false);
});

test('user-story: probe expectHeader missing match is rejected', () => {
  assert.equal(validate(withProbe({ path: '/healthz', expectHeader: { name: 'content-type' } })), false);
});

test('user-story: probe expectHeader missing name is rejected', () => {
  assert.equal(validate(withProbe({ path: '/healthz', expectHeader: { match: 'application/json' } })), false);
});

test('user-story: probe expectHeader with an unknown property is rejected', () => {
  const doc = withProbe({ path: '/healthz', expectHeader: { name: 'content-type', match: 'json', mode: 'regex' } });
  assert.equal(validate(doc), false);
});

test('user-story: probe with an empty selector or empty parityEnv is rejected', () => {
  assert.equal(validate(withProbe({ path: '/', selector: '' })), false);
  assert.equal(validate(withProbe({ path: '/', expectStatus: 200, parityEnv: '' })), false);
  assert.deepEqual(probeErrorShape(validate.errors), [['/acceptanceCriteria/0/probe/parityEnv', 'minLength']]);
});

test('user-story: probe alongside scope, determinism, ownerRef, disposition and provenance validates', () => {
  const doc = withProbe(fullProbe, {
    scope: 'deployed',
    determinism: 'deterministic',
    ownerRef: { tacId: 'TAC-4150-ac-probe-catalog', field: 'interfaces.Probe' },
    disposition: 'template',
    provenance: { authoredBy: 'operator' }
  });
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

// -- 0.7.2 additions (acProbe assertion strings must carry a non-whitespace character) --
//
// rcf-lite FBS-218 review gate 3: a probe { path: '/', expectBody: { contains: ' ' } }
// passed the 0.7.1 schema (minLength 1, no trim) and resolved to a vacuous pass.
// Every assertion string on the probe now carries pattern \S alongside minLength 1.

const assertionFields = [
  {
    field: 'expectBody.contains',
    errorPath: '/acceptanceCriteria/0/probe/expectBody/contains',
    probe: (v) => ({ path: '/', expectBody: { contains: v } }),
    real: 'Welcome back'
  },
  {
    field: 'expectBody.matches',
    errorPath: '/acceptanceCriteria/0/probe/expectBody/matches',
    probe: (v) => ({ path: '/', expectBody: { matches: v } }),
    real: 'Hello, \\w+'
  },
  {
    field: 'expectHeader.name',
    errorPath: '/acceptanceCriteria/0/probe/expectHeader/name',
    probe: (v) => ({ path: '/', expectHeader: { name: v, match: 'application/json' } }),
    real: 'x-request-id'
  },
  {
    field: 'expectHeader.match',
    errorPath: '/acceptanceCriteria/0/probe/expectHeader/match',
    probe: (v) => ({ path: '/', expectHeader: { name: 'cache-control', match: v } }),
    real: 'public, max-age=60'
  },
  {
    field: 'selector',
    errorPath: '/acceptanceCriteria/0/probe/selector',
    probe: (v) => ({ path: '/', selector: v }),
    real: 'main [data-testid="notes-list"]'
  }
];

// ASCII and Unicode whitespace the JavaScript \s class covers (ajv compiles patterns with the u flag).
const whitespaceOnly = [' ', '   ', '\t', '\n', '\r\n', ' \t\n ', ' ', ' ', '﻿', ' '];

test('user-story: FBS-218 gate 3 regression, probe expectBody.contains of a single space is rejected', () => {
  assert.equal(validate(withProbe({ path: '/', expectBody: { contains: ' ' } })), false);
});

for (const { field, errorPath, probe, real } of assertionFields) {
  test(`user-story: probe ${field} whitespace-only is rejected on pattern`, () => {
    for (const value of whitespaceOnly) {
      assert.equal(validate(withProbe(probe(value))), false, `${JSON.stringify(value)} passed`);
      assert.deepEqual(
        validate.errors.map((e) => [e.instancePath, e.keyword]),
        [[errorPath, 'pattern']],
        `${JSON.stringify(value)}: ${JSON.stringify(validate.errors)}`
      );
    }
  });

  test(`user-story: probe ${field} with a real value validates, inner and outer whitespace allowed`, () => {
    for (const value of [real, ` ${real} `, `\t${real}\n`]) {
      assert.equal(validate(withProbe(probe(value))), true, `${JSON.stringify(value)}: ${JSON.stringify(validate.errors)}`);
    }
  });

  test(`user-story: probe ${field} of a single non-whitespace character validates (minLength 1 boundary kept)`, () => {
    assert.equal(validate(withProbe(probe('x'))), true, JSON.stringify(validate.errors));
  });

  test(`user-story: probe ${field} as an empty string is still rejected on minLength`, () => {
    assert.equal(validate(withProbe(probe(''))), false);
    assert.ok(
      validate.errors.some((e) => e.instancePath === errorPath && e.keyword === 'minLength'),
      JSON.stringify(validate.errors)
    );
  });
}

const fixtureCases = [
  ['us-009-ac-probe-expect-body-contains.json', 'us-014-ac-probe-expect-body-contains-whitespace.json', '/acceptanceCriteria/0/probe/expectBody/contains'],
  ['us-010-ac-probe-expect-body-matches.json', 'us-015-ac-probe-expect-body-matches-whitespace.json', '/acceptanceCriteria/0/probe/expectBody/matches'],
  ['us-011-ac-probe-expect-header-name.json', 'us-016-ac-probe-expect-header-name-whitespace.json', '/acceptanceCriteria/0/probe/expectHeader/name'],
  ['us-012-ac-probe-expect-header-match.json', 'us-017-ac-probe-expect-header-match-whitespace.json', '/acceptanceCriteria/0/probe/expectHeader/match'],
  ['us-013-ac-probe-selector.json', 'us-018-ac-probe-selector-whitespace.json', '/acceptanceCriteria/0/probe/selector']
];

function readFixture(kind, name) {
  return JSON.parse(readFileSync(join(REPO_ROOT, 'fixtures', kind, 'user-story', name), 'utf8'));
}

for (const [validName, invalidName, errorPath] of fixtureCases) {
  test(`user-story: fixture valid/${validName} validates`, () => {
    assert.equal(validate(readFixture('valid', validName)), true, JSON.stringify(validate.errors));
  });

  test(`user-story: fixture invalid/${invalidName} fails on exactly one pattern error`, () => {
    assert.equal(validate(readFixture('invalid', invalidName)), false);
    assert.deepEqual(validate.errors.map((e) => [e.instancePath, e.keyword]), [[errorPath, 'pattern']]);
  });
}

// -- 0.9.0 additions (criterion-level supersession; drafted as 0.8.1, never published) --
//
// rcf-lite FBS-220 supersession round: `rcf define update <AC> --set supersededBy=...`
// failed validate because an acceptance criterion had no supersededBy, status or note
// field. A retired criterion now carries supersededBy (an AC id), supersededOn (a date)
// and supersessionNote (why), and the three travel together (dependentRequired).

const supersession = {
  supersededBy: 'AC-101-2',
  supersededOn: '2026-10-17',
  supersessionNote: 'A pagination ruling caps the list at 25; AC-101-2 carries the bound.'
};

const successor = { id: 'AC-101-2', description: 'The list renders the 25 most recent notes.', testable: true };

function withRetiredAc(fields, extra = {}) {
  return {
    ...base,
    acceptanceCriteria: [
      { id: 'AC-101-1', description: 'retired criterion', testable: true, ...extra, ...fields },
      successor
    ]
  };
}

function errorShape(errors) {
  return errors.map((e) => [e.instancePath, e.keyword, e.params.missingProperty ?? null]);
}

test('user-story: AC without supersession fields still validates (back-compat, fields are optional)', () => {
  assert.equal(validate({ ...base, acceptanceCriteria: [base.acceptanceCriteria[0], successor] }), true, JSON.stringify(validate.errors));
});

test('user-story: superseded AC with supersededBy, supersededOn and supersessionNote validates', () => {
  assert.equal(validate(withRetiredAc(supersession)), true, JSON.stringify(validate.errors));
});

test('user-story: supersededBy accepts the flat AC id form', () => {
  assert.equal(validate(withRetiredAc({ ...supersession, supersededBy: 'AC-201' })), true, JSON.stringify(validate.errors));
});

test('user-story: superseded AC alongside scope, determinism, ownerRef, disposition, vendorCitation, probe and provenance validates', () => {
  const doc = withRetiredAc(supersession, {
    scope: 'deployed',
    determinism: 'deterministic',
    ownerRef: { tacId: 'TAC-001' },
    disposition: 'fixed',
    vendorCitation: { url: 'https://example.com/docs', verifiedOn: '2026-10-01' },
    probe: { path: '/notes', expectStatus: 200 },
    provenance: { authoredBy: 'operator' }
  });
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('user-story: supersededBy without supersessionNote is rejected on dependentRequired', () => {
  const { supersessionNote, ...rest } = supersession;
  assert.equal(validate(withRetiredAc(rest)), false);
  assert.deepEqual(errorShape(validate.errors), [['/acceptanceCriteria/0', 'dependentRequired', 'supersessionNote']]);
});

test('user-story: supersededBy without supersededOn is rejected on dependentRequired', () => {
  const { supersededOn, ...rest } = supersession;
  assert.equal(validate(withRetiredAc(rest)), false);
  assert.deepEqual(errorShape(validate.errors), [['/acceptanceCriteria/0', 'dependentRequired', 'supersededOn']]);
});

test('user-story: FBS-220 regression, supersededBy set alone is rejected naming both missing fields', () => {
  assert.equal(validate(withRetiredAc({ supersededBy: 'AC-101-2' })), false);
  assert.deepEqual(errorShape(validate.errors), [
    ['/acceptanceCriteria/0', 'dependentRequired', 'supersededOn'],
    ['/acceptanceCriteria/0', 'dependentRequired', 'supersessionNote']
  ]);
});

test('user-story: supersededOn or supersessionNote without supersededBy is rejected on dependentRequired', () => {
  for (const fields of [{ supersededOn: '2026-10-17' }, { supersessionNote: 'retired' }]) {
    assert.equal(validate(withRetiredAc(fields)), false, JSON.stringify(fields));
    assert.deepEqual(errorShape(validate.errors), [['/acceptanceCriteria/0', 'dependentRequired', 'supersededBy']], JSON.stringify(fields));
  }
});

test('user-story: supersededBy that is not an AC id is rejected on pattern', () => {
  for (const value of ['REQ-101', 'ac-101-2', 'AC-1', 'AC-101-', '']) {
    assert.equal(validate(withRetiredAc({ ...supersession, supersededBy: value })), false, value);
    assert.deepEqual(errorShape(validate.errors), [['/acceptanceCriteria/0/supersededBy', 'pattern', null]], value);
  }
});

test('user-story: supersededOn that is not an ISO-8601 date is rejected on format', () => {
  for (const value of ['17/10/2026', '2026-10-17T00:00:00Z', '2026-13-01', '']) {
    assert.equal(validate(withRetiredAc({ ...supersession, supersededOn: value })), false, value);
    assert.deepEqual(errorShape(validate.errors), [['/acceptanceCriteria/0/supersededOn', 'format', null]], value);
  }
});

test('user-story: supersessionNote whitespace-only is rejected on pattern, empty on minLength', () => {
  for (const value of whitespaceOnly) {
    assert.equal(validate(withRetiredAc({ ...supersession, supersessionNote: value })), false, JSON.stringify(value));
    assert.deepEqual(errorShape(validate.errors), [['/acceptanceCriteria/0/supersessionNote', 'pattern', null]], JSON.stringify(value));
  }
  assert.equal(validate(withRetiredAc({ ...supersession, supersessionNote: '' })), false);
  assert.ok(validate.errors.some((e) => e.instancePath === '/acceptanceCriteria/0/supersessionNote' && e.keyword === 'minLength'));
});

test('user-story: disposition superseded is still rejected (supersession is its own field, not a disposition)', () => {
  assert.equal(validate(withRetiredAc(supersession, { disposition: 'superseded' })), false);
  assert.deepEqual(validate.errors.map((e) => [e.instancePath, e.keyword]), [['/acceptanceCriteria/0/disposition', 'enum']]);
});

test('user-story: a status field on an AC is still rejected (the criterion carries no lifecycle status)', () => {
  assert.equal(validate(withRetiredAc(supersession, { status: 'superseded' })), false);
  assert.deepEqual(validate.errors.map((e) => [e.instancePath, e.keyword]), [['/acceptanceCriteria/0', 'additionalProperties']]);
});

test('user-story: self-supersession validates at schema level (successor existence and cycles are consumer rules)', () => {
  assert.equal(validate(withRetiredAc({ ...supersession, supersededBy: 'AC-101-1' })), true, JSON.stringify(validate.errors));
});

const supersessionFixtureCases = [
  ['us-019-ac-superseded-by-missing-note.json', '/acceptanceCriteria/0', 'dependentRequired', 'supersessionNote'],
  ['us-020-ac-superseded-by-missing-date.json', '/acceptanceCriteria/0', 'dependentRequired', 'supersededOn'],
  ['us-021-ac-supersession-note-without-superseded-by.json', '/acceptanceCriteria/0', 'dependentRequired', 'supersededBy'],
  ['us-022-ac-superseded-by-not-an-ac-id.json', '/acceptanceCriteria/0/supersededBy', 'pattern', null],
  ['us-023-ac-superseded-on-bad-date.json', '/acceptanceCriteria/0/supersededOn', 'format', null],
  ['us-024-ac-supersession-note-whitespace.json', '/acceptanceCriteria/0/supersessionNote', 'pattern', null]
];

test('user-story: fixture valid/us-014-ac-superseded.json validates', () => {
  assert.equal(validate(readFixture('valid', 'us-014-ac-superseded.json')), true, JSON.stringify(validate.errors));
});

for (const [invalidName, errorPath, keyword, missingProperty] of supersessionFixtureCases) {
  test(`user-story: fixture invalid/${invalidName} fails on exactly one ${keyword} error`, () => {
    assert.equal(validate(readFixture('invalid', invalidName)), false);
    assert.deepEqual(errorShape(validate.errors), [[errorPath, keyword, missingProperty]]);
  });
}

// -- 0.9.0 additions (a probe requires at least one response assertion) --
//
// rcf-lite FBS-218 finding BH-1: a probe carrying only path (optionally method or
// parityEnv) asserts nothing about the response, and rcf-lite's verify engine already
// refuses one at runtime (PROBE_ASSERTION_FIELDS in catalog.js). The schema now states
// the same contract: acProbe carries an anyOf over expectStatus, expectHeader,
// expectBody and selector. path, method and parityEnv are not assertions.

const assertionOnly = {
  expectStatus: 204,
  expectHeader: { name: 'content-type', match: 'application/json' },
  expectBody: { contains: 'ok' },
  selector: 'main h1'
};

for (const [field, value] of Object.entries(assertionOnly)) {
  test(`user-story: probe with path and only ${field} as its assertion validates`, () => {
    assert.equal(validate(withProbe({ path: '/healthz', [field]: value })), true, JSON.stringify(validate.errors));
  });
}

test('user-story: probe with path, method and parityEnv but no assertion is rejected on anyOf', () => {
  assert.equal(validate(withProbe({ method: 'HEAD', path: '/healthz', parityEnv: 'preview' })), false);
  assert.deepEqual(probeErrorShape(validate.errors), noAssertionErrors);
});

test('user-story: path-only probe is rejected for every method in the enum', () => {
  for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    assert.equal(validate(withProbe({ method, path: '/healthz' })), false, method);
    assert.deepEqual(probeErrorShape(validate.errors), noAssertionErrors, method);
  }
});

test('user-story: an assertion that is present but malformed fails on its own constraint, not on anyOf', () => {
  assert.equal(validate(withProbe({ path: '/', expectBody: {} })), false);
  assert.deepEqual(probeErrorShape(validate.errors), [['/acceptanceCriteria/0/probe/expectBody', 'minProperties']]);
});

test('user-story: fixture valid/us-007-ac-probe-minimal.json (path and expectStatus) validates', () => {
  assert.equal(validate(readFixture('valid', 'us-007-ac-probe-minimal.json')), true, JSON.stringify(validate.errors));
});

test('user-story: fixture invalid/us-025-ac-probe-path-only.json fails on the anyOf assertion rule alone', () => {
  assert.equal(validate(readFixture('invalid', 'us-025-ac-probe-path-only.json')), false);
  assert.deepEqual(probeErrorShape(validate.errors), noAssertionErrors);
});

test('user-story: fixture invalid/us-009-ac-probe-unknown-property.json (path-only, unknown timeoutMs) fails on anyOf and additionalProperties', () => {
  assert.equal(validate(readFixture('invalid', 'us-009-ac-probe-unknown-property.json')), false);
  assert.deepEqual(probeErrorShape(validate.errors), [
    ...noAssertionErrors,
    ['/acceptanceCriteria/0/probe', 'additionalProperties']
  ]);
});
