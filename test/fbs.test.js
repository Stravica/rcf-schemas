// Targeted tests for fbs.schema.json - covers the 0.2.0 shape
// (bsId, buildOrder, executionStatus, dependsOnFbsIds all mandatory;
// status renamed to executionStatus; dependencies renamed to dependsOnFbsIds).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'fbs.schema.json');

const base = {
  fbsId: 'FBS-001',
  prdId: 'PRD-001',
  bsId: 'BS-001',
  buildOrder: 1,
  executionStatus: 'notStarted',
  title: 'x',
  summary: 'y',
  acIds: ['AC-001'],
  dependsOnFbsIds: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('fbs: minimal FBS validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('fbs: missing buildOrder rejected', () => {
  const doc = { ...base };
  delete doc.buildOrder;
  assert.equal(validate(doc), false);
});

test('fbs: buildOrder < 1 rejected', () => {
  const doc = { ...base, buildOrder: 0 };
  assert.equal(validate(doc), false);
});

test('fbs: missing executionStatus rejected', () => {
  const doc = { ...base };
  delete doc.executionStatus;
  assert.equal(validate(doc), false);
});

test('fbs: authoring status value rejected on executionStatus', () => {
  const doc = { ...base, executionStatus: 'approved' };
  assert.equal(validate(doc), false);
});

test('fbs: legacy status field rejected', () => {
  const doc = { ...base, status: 'notStarted' };
  assert.equal(validate(doc), false);
});

test('fbs: legacy dependencies field rejected (renamed to dependsOnFbsIds)', () => {
  const doc = { ...base, dependencies: ['FBS-002'] };
  assert.equal(validate(doc), false);
});

test('fbs: dependsOnFbsIds accepts an empty array', () => {
  const doc = { ...base, dependsOnFbsIds: [] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('fbs: dependsOnFbsIds populated with FBS ids validates', () => {
  const doc = { ...base, dependsOnFbsIds: ['FBS-002', 'FBS-003'] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('fbs: noCodeNodes true validates (0.3.1, optional)', () => {
  const doc = { ...base, noCodeNodes: true };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('fbs: FBS without noCodeNodes remains valid (field is optional)', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('fbs: non-boolean noCodeNodes rejected', () => {
  const doc = { ...base, noCodeNodes: 'yes' };
  assert.equal(validate(doc), false);
});

// -- 0.4.0 additions (Track A + Track B) ---------------------------------

test('fbs: dependsOnServices with a valid attestationMode validates', () => {
  const doc = {
    ...base,
    dependsOnServices: [
      {
        id: 'resend',
        displayName: 'Resend email API',
        purpose: 'outbound transactional email delivery',
        attestationMode: 'live',
        acIds: ['AC-001']
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('fbs: dependsOnServices attestationMode rejects unknown value', () => {
  const doc = {
    ...base,
    dependsOnServices: [
      {
        id: 'resend',
        displayName: 'Resend',
        purpose: 'email',
        attestationMode: 'someday',
        acIds: ['AC-001']
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('fbs: dependsOnServices entry requires displayName', () => {
  const doc = {
    ...base,
    dependsOnServices: [
      {
        id: 'resend',
        purpose: 'email',
        attestationMode: 'live',
        acIds: ['AC-001']
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('fbs: uiBearing true with designStageComplete false validates', () => {
  const doc = { ...base, uiBearing: true, designStageComplete: false };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('fbs: designStageComplete non-boolean rejected', () => {
  const doc = { ...base, designStageComplete: 'yes' };
  assert.equal(validate(doc), false);
});

test('fbs: designStage themeMode enum enforced', () => {
  const doc = {
    ...base,
    uiBearing: true,
    designStage: {
      themeAndA11y: {
        themeMode: 'sepia',
        themeTokensModule: 'src/ui/tokens.ts',
        contrastTargets: 'WCAG AA',
        contrastTestPath: 'test/a11y.test.ts',
        contrastTestAuthoredBeforePalette: true
      }
    }
  };
  assert.equal(validate(doc), false);
});

test('fbs: designStage journeys accepts a minimal valid entry', () => {
  const doc = {
    ...base,
    uiBearing: true,
    designStage: {
      journeys: [
        {
          id: 'signed-in-owner-checks-status',
          actor: 'signed-in owner',
          goal: 'see status at a glance',
          steps: ['lands on /', 'sees tiles']
        }
      ]
    }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('fbs: designStage journey with a single step rejected (minItems 2 per Track B §3.1)', () => {
  const doc = {
    ...base,
    uiBearing: true,
    designStage: {
      journeys: [
        {
          id: 'signed-in-owner-checks-status',
          actor: 'signed-in owner',
          goal: 'see status at a glance',
          steps: ['lands on /']
        }
      ]
    }
  };
  assert.equal(validate(doc), false);
});

test('fbs: uiClassification verdict enum enforced', () => {
  const doc = {
    ...base,
    uiClassification: { verdict: 'maybe', reason: 'keyword-scan', classifiedAt: '2026-07-30T14:20:00Z' }
  };
  assert.equal(validate(doc), false);
});

test('fbs: pre-0.4.0 FBS (no track-A or track-B fields) still validates', () => {
  // The base fixture is the pre-0.4.0 shape: no dependsOnServices,
  // uiBearing, designStage, or designStageComplete. Back-compat check.
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});
