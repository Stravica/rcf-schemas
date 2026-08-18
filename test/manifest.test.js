// Targeted tests for manifest.schema.json, covers the 0.4.0 additions
// across Tracks A, B, and C+D (preFlightConfig, reviewAudit, uiBaseline,
// browserVerification, baselineAcOptOuts, intakeClassification,
// registerCanary, reviewSurface, testCommand), plus the back-compat
// guarantee that pre-0.4.0 manifests still validate.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'manifest.schema.json');

const base = {
  version: '2.0.0',
  projectName: 'Test project',
  prd: { id: 'PRD-001', path: 'rcf/prd.json' },
  tad: { id: 'TAD-001', path: 'rcf/tad.json' },
  bs:  { id: 'BS-001',  path: 'rcf/build-sequence.json' }
};

test('manifest: pre-0.4.0 shape (no optional 0.4.0 fields) validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('manifest: testCommand string validates', () => {
  const doc = { ...base, testCommand: 'pnpm -r test' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: testCommand empty string rejected (minLength 1)', () => {
  const doc = { ...base, testCommand: '' };
  assert.equal(validate(doc), false);
});

// -- Track A: preFlightConfig -------------------------------------------

test('manifest: preFlightConfig with a live service entry validates', () => {
  const doc = {
    ...base,
    preFlightConfig: [
      {
        id: 'pfc-2026-07-30-001',
        createdAt: '2026-07-30T14:20:00Z',
        prdId: 'PRD-001',
        servicesInScope: [
          {
            id: 'resend',
            displayName: 'Resend email API',
            sourceRefs: ['PRD-001#external-integrations'],
            attestationMode: 'live',
            credentialSupplied: true,
            sandboxProvisioned: false
          }
        ],
        operatorAckAt: '2026-07-30T14:22:00Z'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: preFlightConfig id pattern enforced', () => {
  const doc = {
    ...base,
    preFlightConfig: [
      {
        id: 'not-a-pfc-id',
        createdAt: '2026-07-30T14:20:00Z',
        prdId: 'PRD-001',
        servicesInScope: [],
        operatorAckAt: '2026-07-30T14:22:00Z'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: preFlightConfig designShapeAnswers optional field validates', () => {
  const doc = {
    ...base,
    preFlightConfig: [
      {
        id: 'pfc-2026-07-30-001',
        createdAt: '2026-07-30T14:20:00Z',
        prdId: 'PRD-001',
        servicesInScope: [],
        operatorAckAt: '2026-07-30T14:22:00Z',
        designShapeAnswers: [
          {
            questionId: 'auth.htmlLoginPage',
            reqId: 'REQ-012',
            answer: 'apiOnly',
            reason: 'API-only clients only',
            answeredAt: '2026-07-30T14:24:00Z'
          }
        ]
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: preFlightServiceEntry with an empty sourceRefs array validates (operator-added candidate)', () => {
  const doc = {
    ...base,
    preFlightConfig: [
      {
        id: 'pfc-2026-07-30-002',
        createdAt: '2026-07-30T14:20:00Z',
        prdId: 'PRD-001',
        servicesInScope: [
          {
            id: 'sentry',
            displayName: 'Sentry',
            sourceRefs: [],
            attestationMode: 'declaredMockOnly',
            credentialSupplied: false,
            sandboxProvisioned: false,
            operatorReason: 'operator-added at pre-flight, no PRD or TAD reference'
          }
        ],
        operatorAckAt: '2026-07-30T14:22:00Z'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: preFlightServiceEntry attestationMode rejects unknown value', () => {
  const doc = {
    ...base,
    preFlightConfig: [
      {
        id: 'pfc-2026-07-30-001',
        createdAt: '2026-07-30T14:20:00Z',
        prdId: 'PRD-001',
        servicesInScope: [
          {
            id: 'resend',
            displayName: 'Resend',
            sourceRefs: ['PRD-001#foo'],
            attestationMode: 'someday',
            credentialSupplied: false,
            sandboxProvisioned: false
          }
        ],
        operatorAckAt: '2026-07-30T14:22:00Z'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

// -- Track A: reviewAudit ------------------------------------------------

test('manifest: reviewAudit with the uiBaselineDrift kind validates', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-30T15:10:00Z',
        testTheatreFindings: [
          {
            tsId: 'TS-016',
            kind: 'uiBaselineDrift',
            detail: 'hex literals in view files',
            severity: 'block'
          }
        ],
        verdict: 'block'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: reviewAudit testTheatreFinding rejects unknown kind', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-011-1',
        fbsId: 'FBS-011',
        createdAt: '2026-07-30T15:10:00Z',
        testTheatreFindings: [
          {
            tsId: 'TS-015',
            kind: 'somethingElse',
            detail: 'x',
            severity: 'warn'
          }
        ],
        verdict: 'warn'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: reviewAudit verdict enum enforced', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-011-1',
        fbsId: 'FBS-011',
        createdAt: '2026-07-30T15:10:00Z',
        testTheatreFindings: [],
        verdict: 'green'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: reviewAudit accepts a clean audit with an empty findings array', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-011-1',
        fbsId: 'FBS-011',
        createdAt: '2026-07-30T15:10:00Z',
        testTheatreFindings: [],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

// -- Track B: uiBaseline + browserVerification + uiBaselineHistory ------

test('manifest: uiBaseline with defaults + operatorAckAt validates', () => {
  const doc = {
    ...base,
    uiBaseline: {
      id: 'uib-2026-07-30-001',
      createdAt: '2026-07-30T14:15:00Z',
      prdId: 'PRD-001',
      defaults: {
        themeMode: 'light-default-with-toggle',
        sharedLayoutModule: 'src/ui/layout.ts'
      },
      operatorAckAt: '2026-07-30T14:15:00Z'
    }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: uiBaseline id pattern enforced', () => {
  const doc = {
    ...base,
    uiBaseline: {
      id: 'baseline-001',
      createdAt: '2026-07-30T14:15:00Z',
      prdId: 'PRD-001',
      defaults: {},
      operatorAckAt: '2026-07-30T14:15:00Z'
    }
  };
  assert.equal(validate(doc), false);
});

test('manifest: uiBaseline defaults.themeMode enum enforced', () => {
  const doc = {
    ...base,
    uiBaseline: {
      id: 'uib-2026-07-30-001',
      createdAt: '2026-07-30T14:15:00Z',
      prdId: 'PRD-001',
      defaults: { themeMode: 'sepia' },
      operatorAckAt: '2026-07-30T14:15:00Z'
    }
  };
  assert.equal(validate(doc), false);
});

test('manifest: uiBaselineHistory (empty array) validates', () => {
  const doc = { ...base, uiBaselineHistory: [] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: browserVerification with a passing invariant validates', () => {
  const doc = {
    ...base,
    browserVerification: [
      {
        id: 'bv-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-30T15:22:00Z',
        mode: 'agentScreenshotCritique',
        runtimeProfile: 'local-dev',
        runtimeUrl: 'http://127.0.0.1:3000',
        routesChecked: [
          { path: '/', screenshotPath: '.rcf/artefacts/bv-FBS-016-1/dashboard.png', themeApplied: 'light' }
        ],
        invariantChecks: [
          { invariant: 'sharedNavPresent', verdict: 'pass' }
        ],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: browserVerification verdict enum enforced', () => {
  const doc = {
    ...base,
    browserVerification: [
      {
        id: 'bv-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-30T15:22:00Z',
        mode: 'agentScreenshotCritique',
        runtimeProfile: 'local-dev',
        runtimeUrl: 'http://127.0.0.1:3000',
        routesChecked: [
          { path: '/', screenshotPath: '.rcf/artefacts/x.png', themeApplied: 'light' }
        ],
        invariantChecks: [
          { invariant: 'sharedNavPresent', verdict: 'pass' }
        ],
        verdict: 'green'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: browserVerification mode enum enforced', () => {
  const doc = {
    ...base,
    browserVerification: [
      {
        id: 'bv-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-30T15:22:00Z',
        mode: 'somethingElse',
        runtimeProfile: 'local-dev',
        runtimeUrl: 'http://127.0.0.1:3000',
        routesChecked: [
          { path: '/', screenshotPath: '.rcf/x.png', themeApplied: 'light' }
        ],
        invariantChecks: [
          { invariant: 'sharedNavPresent', verdict: 'pass' }
        ],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

// -- Track C+D: baselineAcOptOuts (reason floor is load-bearing) --------

test('manifest: baselineAcOptOut with a well-formed reason validates', () => {
  const doc = {
    ...base,
    baselineAcOptOuts: [
      {
        id: 'boo-2026-07-30-001',
        createdAt: '2026-07-30T14:30:00Z',
        reqId: 'REQ-012',
        baselineKey: 'auth.htmlLoginPage',
        scope: 'req',
        reason: 'auth surface is API-only for SDK clients',
        operatorAckAt: '2026-07-30T14:30:00Z'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: baselineAcOptOut reason under 20 chars is rejected', () => {
  const doc = {
    ...base,
    baselineAcOptOuts: [
      {
        id: 'boo-2026-07-30-001',
        createdAt: '2026-07-30T14:30:00Z',
        reqId: 'REQ-012',
        baselineKey: 'auth.htmlLoginPage',
        scope: 'req',
        reason: 'too short',
        operatorAckAt: '2026-07-30T14:30:00Z'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: baselineAcOptOut reason exactly 20 chars accepted', () => {
  const doc = {
    ...base,
    baselineAcOptOuts: [
      {
        id: 'boo-2026-07-30-002',
        createdAt: '2026-07-30T14:30:00Z',
        reqId: 'REQ-012',
        baselineKey: 'auth.htmlLoginPage',
        scope: 'req',
        reason: 'twenty-chars-exact!!',
        operatorAckAt: '2026-07-30T14:30:00Z'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: baselineAcOptOut scope enum enforced', () => {
  const doc = {
    ...base,
    baselineAcOptOuts: [
      {
        id: 'boo-2026-07-30-003',
        createdAt: '2026-07-30T14:30:00Z',
        reqId: 'REQ-012',
        baselineKey: 'auth.htmlLoginPage',
        scope: 'story',
        reason: 'operator ruling on story scope only',
        operatorAckAt: '2026-07-30T14:30:00Z'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

// -- Track C+D: intakeClassification, registerCanary, reviewSurface ------

test('manifest: intakeClassification with briefStrong fidelity validates', () => {
  const doc = {
    ...base,
    intakeClassification: {
      id: 'ic-2026-07-30-001',
      createdAt: '2026-07-30T13:50:00Z',
      fidelity: 'briefStrong',
      artefacts: [
        { path: 'docs/brief.md', kind: 'productBrief', wordCount: 3200, operatorSourced: true }
      ],
      validationFindings: [],
      elicitationScope: {
        prdDrafted: 'drafted',
        reqDraftedFromArtefact: ['REQ-001'],
        reqRequiringElicitation: [],
        acsFromArtefact: 'none',
        acsFromElicitation: 'all'
      },
      operatorAckAt: '2026-07-30T13:55:00Z'
    }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: intakeClassification fidelity enum enforced', () => {
  const doc = {
    ...base,
    intakeClassification: {
      id: 'ic-2026-07-30-001',
      createdAt: '2026-07-30T13:50:00Z',
      fidelity: 'wireframeSet',
      artefacts: [],
      validationFindings: [],
      elicitationScope: {},
      operatorAckAt: '2026-07-30T13:55:00Z'
    }
  };
  assert.equal(validate(doc), false);
});

test('manifest: registerCanary with a passing verdict validates', () => {
  const doc = {
    ...base,
    registerCanary: [
      {
        id: 'rc-2026-07-30-001',
        createdAt: '2026-07-30T18:10:00Z',
        buildVersion: '0.7.0-rc.1',
        fixturePromptId: 'canary-prompt-01',
        responseWordCount: 152,
        grades: {
          internalRuleCitation: { verdict: 'pass', matches: [] },
          unglossedJargon: { verdict: 'pass', matches: [] },
          redundantPermissionAsk: { verdict: 'pass', matches: [] },
          bypassOffer: { verdict: 'pass', matches: [] },
          wordCountBudget: { verdict: 'pass', target: 200, actual: 152 }
        },
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: registerCanary grades missing a dimension is rejected', () => {
  const doc = {
    ...base,
    registerCanary: [
      {
        id: 'rc-2026-07-30-001',
        createdAt: '2026-07-30T18:10:00Z',
        buildVersion: '0.7.0-rc.1',
        fixturePromptId: 'canary-prompt-01',
        responseWordCount: 152,
        grades: {
          internalRuleCitation: { verdict: 'pass', matches: [] },
          unglossedJargon: { verdict: 'pass', matches: [] },
          redundantPermissionAsk: { verdict: 'pass', matches: [] },
          bypassOffer: { verdict: 'pass', matches: [] }
        },
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: reviewSurface viewServer detached mode validates', () => {
  const doc = {
    ...base,
    reviewSurface: {
      viewServer: {
        mode: 'detached',
        startedAt: '2026-07-30T09:40:00Z',
        socketPath: '.rcf/view.sock',
        pid: 42137,
        healthCheckPath: 'http://127.0.0.1:4373/healthz',
        lastHeartbeatAt: '2026-07-30T16:32:00Z'
      }
    }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: reviewSurface viewServer mode enum enforced', () => {
  const doc = {
    ...base,
    reviewSurface: {
      viewServer: {
        mode: 'daemon',
        startedAt: '2026-07-30T09:40:00Z',
        socketPath: '.rcf/view.sock',
        pid: 1,
        healthCheckPath: 'http://127.0.0.1:4373/healthz',
        lastHeartbeatAt: '2026-07-30T09:40:00Z'
      }
    }
  };
  assert.equal(validate(doc), false);
});

// -- N4 fixture-symmetry back-fill: enums and id patterns ---------------

test('manifest: intakeArtefact kind enum rejects unknown value', () => {
  const doc = {
    ...base,
    intakeClassification: {
      id: 'ic-2026-07-30-001',
      createdAt: '2026-07-30T13:50:00Z',
      fidelity: 'napkin',
      artefacts: [ { path: 'docs/x.md', kind: 'wireframe' } ],
      validationFindings: [],
      elicitationScope: {},
      operatorAckAt: '2026-07-30T13:55:00Z'
    }
  };
  assert.equal(validate(doc), false);
});

test('manifest: intakeValidationFinding kind enum rejects unknown value', () => {
  const doc = {
    ...base,
    intakeClassification: {
      id: 'ic-2026-07-30-001',
      createdAt: '2026-07-30T13:50:00Z',
      fidelity: 'briefLight',
      artefacts: [],
      validationFindings: [
        { kind: 'typoDetected', detail: 'x', raisedAt: '2026-07-30T13:52:00Z' }
      ],
      elicitationScope: {},
      operatorAckAt: '2026-07-30T13:55:00Z'
    }
  };
  assert.equal(validate(doc), false);
});

test('manifest: reviewAudit id pattern enforced (ra-<fbsId>-<n>)', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'audit-011-1',
        fbsId: 'FBS-011',
        createdAt: '2026-07-30T15:10:00Z',
        testTheatreFindings: [],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: browserVerification id pattern enforced (bv-<fbsId>-<n>)', () => {
  const doc = {
    ...base,
    browserVerification: [
      {
        id: 'verify-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-30T15:22:00Z',
        mode: 'operatorSession',
        runtimeProfile: 'local-dev',
        runtimeUrl: 'http://127.0.0.1:3000',
        routesChecked: [
          { path: '/', screenshotPath: '.rcf/x.png', themeApplied: 'light' }
        ],
        invariantChecks: [
          { invariant: 'sharedNavPresent', verdict: 'pass' }
        ],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: baselineAcOptOut id pattern enforced (boo-YYYY-MM-DD-NNN)', () => {
  const doc = {
    ...base,
    baselineAcOptOuts: [
      {
        id: 'optout-001',
        createdAt: '2026-07-30T14:30:00Z',
        reqId: 'REQ-012',
        baselineKey: 'auth.htmlLoginPage',
        scope: 'req',
        reason: 'operator ruling with sufficient length for the twenty-char floor',
        operatorAckAt: '2026-07-30T14:30:00Z'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: intakeClassification id pattern enforced (ic-YYYY-MM-DD-NNN)', () => {
  const doc = {
    ...base,
    intakeClassification: {
      id: 'intake-001',
      createdAt: '2026-07-30T13:50:00Z',
      fidelity: 'napkin',
      artefacts: [],
      validationFindings: [],
      elicitationScope: {},
      operatorAckAt: '2026-07-30T13:55:00Z'
    }
  };
  assert.equal(validate(doc), false);
});

test('manifest: registerCanary id pattern enforced (rc-YYYY-MM-DD-NNN)', () => {
  const doc = {
    ...base,
    registerCanary: [
      {
        id: 'canary-001',
        createdAt: '2026-07-30T18:10:00Z',
        buildVersion: '0.7.0-rc.1',
        fixturePromptId: 'canary-prompt-01',
        responseWordCount: 152,
        grades: {
          internalRuleCitation: { verdict: 'pass', matches: [] },
          unglossedJargon: { verdict: 'pass', matches: [] },
          redundantPermissionAsk: { verdict: 'pass', matches: [] },
          bypassOffer: { verdict: 'pass', matches: [] },
          wordCountBudget: { verdict: 'pass', target: 200, actual: 152 }
        },
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

// -- 0.4.1: shipWithoutVerified (rcf finalise --ship-without-verified ack) --

test('manifest: shipWithoutVerified with a MOCK-ONLY-DECLARED ack validates', () => {
  const doc = {
    ...base,
    shipWithoutVerified: [
      {
        id: 'swv-FBS-011-1',
        fbsId: 'FBS-011',
        ackedAt: '2026-07-31T10:15:00Z',
        declaredAcs: [
          { acId: 'AC-1001-2', verdict: 'MOCK-ONLY-DECLARED', reason: 'no live path' }
        ],
        reportPath: '.rcf-verify-report.json'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: shipWithoutVerified accepts BLOCKED-BY-DECLARATION and multiple ACs', () => {
  const doc = {
    ...base,
    shipWithoutVerified: [
      {
        id: 'swv-FBS-011-1',
        fbsId: 'FBS-011',
        ackedAt: '2026-07-31T10:15:00Z',
        declaredAcs: [
          { acId: 'AC-1001-2', verdict: 'MOCK-ONLY-DECLARED' },
          { acId: 'AC-1001-3', verdict: 'BLOCKED-BY-DECLARATION' }
        ],
        reportPath: '.rcf-verify-report.json'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: shipWithoutVerified id pattern enforced (swv-<fbsId>-<n>)', () => {
  const doc = {
    ...base,
    shipWithoutVerified: [
      {
        id: 'not-a-swv-id',
        fbsId: 'FBS-011',
        ackedAt: '2026-07-31T10:15:00Z',
        declaredAcs: [{ acId: 'AC-1001-2', verdict: 'MOCK-ONLY-DECLARED' }],
        reportPath: '.rcf-verify-report.json'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: shipWithoutVerified verdict enum restricted to MOCK-ONLY-DECLARED / BLOCKED-BY-DECLARATION', () => {
  const doc = {
    ...base,
    shipWithoutVerified: [
      {
        id: 'swv-FBS-011-1',
        fbsId: 'FBS-011',
        ackedAt: '2026-07-31T10:15:00Z',
        declaredAcs: [{ acId: 'AC-1001-2', verdict: 'PASS' }],
        reportPath: '.rcf-verify-report.json'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: shipWithoutVerified declaredAcs empty array rejected (minItems 1)', () => {
  const doc = {
    ...base,
    shipWithoutVerified: [
      {
        id: 'swv-FBS-011-1',
        fbsId: 'FBS-011',
        ackedAt: '2026-07-31T10:15:00Z',
        declaredAcs: [],
        reportPath: '.rcf-verify-report.json'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: shipWithoutVerified reportPath minLength 1 enforced', () => {
  const doc = {
    ...base,
    shipWithoutVerified: [
      {
        id: 'swv-FBS-011-1',
        fbsId: 'FBS-011',
        ackedAt: '2026-07-31T10:15:00Z',
        declaredAcs: [{ acId: 'AC-1001-2', verdict: 'MOCK-ONLY-DECLARED' }],
        reportPath: ''
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: shipWithoutVerified missing required fbsId rejected', () => {
  const doc = {
    ...base,
    shipWithoutVerified: [
      {
        id: 'swv-FBS-011-1',
        ackedAt: '2026-07-31T10:15:00Z',
        declaredAcs: [{ acId: 'AC-1001-2', verdict: 'MOCK-ONLY-DECLARED' }],
        reportPath: '.rcf-verify-report.json'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

// -- 0.4.2: uiBaselineDrift anchor + per-kind tsId requiredness ----------

test('manifest: 0.4.2 uiBaselineDrift finding without tsId (with anchorId) validates', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-31T15:10:00Z',
        testTheatreFindings: [
          {
            anchorId: 'FBS-016',
            kind: 'uiBaselineDrift',
            detail: 'hex literal in src/ui/dashboard.ts',
            severity: 'block'
          }
        ],
        verdict: 'block'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: 0.4.2 uiBaselineDrift finding without tsId and without anchorId still validates (anchorId is optional)', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-31T15:10:00Z',
        testTheatreFindings: [
          {
            kind: 'uiBaselineDrift',
            detail: 'hex literal in src/ui/dashboard.ts',
            severity: 'block'
          }
        ],
        verdict: 'block'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: 0.4.2 back-compat - uiBaselineDrift finding with the legacy tsId slot still validates', () => {
  // Pre-0.4.2 emitters (rcf-lite <= 0.7.0 Track B PR head) put the FBS id
  // into the tsId slot to satisfy the old blanket required rule. That
  // shape must remain valid so on-disk manifests written by those
  // versions still load.
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-31T15:10:00Z',
        testTheatreFindings: [
          {
            tsId: 'TS-016',
            kind: 'uiBaselineDrift',
            detail: 'hex literal in src/ui/dashboard.ts',
            severity: 'block'
          }
        ],
        verdict: 'block'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: 0.4.2 test-theatre kinds still require tsId - mockOnlyIntegrationClaim without tsId rejected', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-011-1',
        fbsId: 'FBS-011',
        createdAt: '2026-07-30T15:10:00Z',
        testTheatreFindings: [
          {
            kind: 'mockOnlyIntegrationClaim',
            detail: 'mock profile claim without live evidence',
            severity: 'block'
          }
        ],
        verdict: 'block'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: 0.4.2 test-theatre kinds still require tsId - testPointerBroken without tsId rejected', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-011-1',
        fbsId: 'FBS-011',
        createdAt: '2026-07-30T15:10:00Z',
        testTheatreFindings: [
          {
            kind: 'testPointerBroken',
            detail: 'AC-101-2 has no test',
            severity: 'warn'
          }
        ],
        verdict: 'warn'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: 0.4.2 test-theatre kinds still require tsId - otherDeclared without tsId rejected', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-011-1',
        fbsId: 'FBS-011',
        createdAt: '2026-07-30T15:10:00Z',
        testTheatreFindings: [
          {
            kind: 'otherDeclared',
            kindDescription: 'declared exception',
            detail: 'declared exception',
            severity: 'advisory'
          }
        ],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: 0.4.2 anchorId minLength 1 enforced', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-31T15:10:00Z',
        testTheatreFindings: [
          {
            anchorId: '',
            kind: 'uiBaselineDrift',
            detail: 'hex literal',
            severity: 'block'
          }
        ],
        verdict: 'block'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: 0.4.2 anchorId + tsId coexist on a uiBaselineDrift finding (either or both is legitimate)', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-016-1',
        fbsId: 'FBS-016',
        createdAt: '2026-07-31T15:10:00Z',
        testTheatreFindings: [
          {
            tsId: 'TS-016',
            anchorId: 'FBS-016',
            kind: 'uiBaselineDrift',
            detail: 'hex literal',
            severity: 'block'
          }
        ],
        verdict: 'block'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

// -- 0.4.3 additions (slugged FBS ids in composite record ids) ----------

test('manifest: reviewAudit id accepts a slugged FBS id (ra-FBS-<slug>-<n>)', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-016-user-login-1',
        fbsId: 'FBS-016-user-login',
        createdAt: '2026-08-12T09:00:00Z',
        testTheatreFindings: [],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: reviewAudit id still accepts a numeric-only FBS id (back-compat)', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-011-3',
        fbsId: 'FBS-011',
        createdAt: '2026-08-12T09:00:00Z',
        testTheatreFindings: [],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: browserVerification id accepts a slugged FBS id (bv-FBS-<slug>-<n>)', () => {
  const doc = {
    ...base,
    browserVerification: [
      {
        id: 'bv-FBS-016-dashboard-1',
        fbsId: 'FBS-016-dashboard',
        createdAt: '2026-08-12T09:00:00Z',
        mode: 'agentScreenshotCritique',
        runtimeProfile: 'local-dev',
        runtimeUrl: 'http://127.0.0.1:3000',
        routesChecked: [
          { path: '/', screenshotPath: '.rcf/artefacts/bv-FBS-016-dashboard-1/root.png', themeApplied: 'light' }
        ],
        invariantChecks: [{ invariant: 'sharedNavPresent', verdict: 'pass' }],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: shipWithoutVerified id accepts a slugged FBS id (swv-FBS-<slug>-<n>)', () => {
  const doc = {
    ...base,
    shipWithoutVerified: [
      {
        id: 'swv-FBS-011-notifier-1',
        fbsId: 'FBS-011-notifier',
        ackedAt: '2026-08-12T09:00:00Z',
        declaredAcs: [
          { acId: 'AC-011-1', verdict: 'MOCK-ONLY-DECLARED' }
        ],
        reportPath: '.rcf/artefacts/verify-report.json'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: composite FBS-embedded id with trailing hyphen still rejected', () => {
  const doc = {
    ...base,
    reviewAudit: [
      {
        id: 'ra-FBS-016--1',
        fbsId: 'FBS-016',
        createdAt: '2026-08-12T09:00:00Z',
        testTheatreFindings: [],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

// -- 0.4.4 additions (blueprints[] applied-blueprints registry) ---------

test('manifest: blueprints[] with one applied blueprint (required fields only) validates', () => {
  const doc = {
    ...base,
    blueprints: [
      {
        slug: 'spa',
        version: '1.0.0',
        appliedAt: '2026-08-18T10:00:00Z',
        source: '@stravica-ai/rcf-blueprint-spa@1.0.0'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: blueprints[] with contributions array validates', () => {
  const doc = {
    ...base,
    blueprints: [
      {
        slug: 'spa',
        version: '1.0.0',
        appliedAt: '2026-08-18T10:00:00Z',
        source: 'git+ssh://git@github.com/Stravica/rcf-blueprint-spa.git#v1.0.0',
        namespace: 'spa',
        contributions: [
          { id: 'spa-REQ-001', path: 'rcf/requirements/spa-req-001.json', kind: 'req' },
          { id: 'TAC-002-spa-tokens', path: 'rcf/tacs/tac-002-spa-tokens.json', kind: 'tac' }
        ]
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: blueprints[] with multiple composed blueprints validates', () => {
  const doc = {
    ...base,
    blueprints: [
      { slug: 'spa',  version: '1.0.0', appliedAt: '2026-08-18T10:00:00Z', source: 'a' },
      { slug: 'rest', version: '1.0.0', appliedAt: '2026-08-18T10:00:05Z', source: 'b' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: blueprint slug in uppercase rejected', () => {
  const doc = {
    ...base,
    blueprints: [
      { slug: 'SPA', version: '1.0.0', appliedAt: '2026-08-18T10:00:00Z', source: 'a' }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: blueprint missing required version rejected', () => {
  const doc = {
    ...base,
    blueprints: [
      { slug: 'spa', appliedAt: '2026-08-18T10:00:00Z', source: 'a' }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: blueprint with bad semver version rejected', () => {
  const doc = {
    ...base,
    blueprints: [
      { slug: 'spa', version: '1.0', appliedAt: '2026-08-18T10:00:00Z', source: 'a' }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: blueprint contribution missing path rejected', () => {
  const doc = {
    ...base,
    blueprints: [
      {
        slug: 'spa', version: '1.0.0', appliedAt: '2026-08-18T10:00:00Z', source: 'a',
        contributions: [ { id: 'spa-REQ-001' } ]
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: blueprint contribution kind unknown rejected', () => {
  const doc = {
    ...base,
    blueprints: [
      {
        slug: 'spa', version: '1.0.0', appliedAt: '2026-08-18T10:00:00Z', source: 'a',
        contributions: [ { id: 'x', path: 'y', kind: 'notADocKind' } ]
      }
    ]
  };
  assert.equal(validate(doc), false);
});

// -- 0.4.4 additions (standards[] standards-pack registry) --------------

test('manifest: standards[] with an in-repo pack (no copyPath) validates', () => {
  const doc = {
    ...base,
    standards: [
      {
        id: 'std-wsd-naming',
        slug: 'wsd-naming',
        sourcePath: 'docs/standards/wsd-naming',
        tags: ['naming', 'conventions'],
        testsProvidedBy: 'agent',
        provenance: 'corporate'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: standards[] with an out-of-root pack (copyPath present) validates', () => {
  const doc = {
    ...base,
    standards: [
      {
        id: 'std-security-baseline',
        slug: 'security-baseline',
        sourcePath: '/Users/thefoot/personal/patterns/security-baseline',
        copyPath: 'rcf/standards/security-baseline',
        tags: ['security'],
        summary: 'Baseline security posture for services.',
        testsProvidedBy: 'standard',
        provenance: 'personal'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: standards pack with bad id (missing std- prefix) rejected', () => {
  const doc = {
    ...base,
    standards: [
      {
        id: 'wsd-naming',
        slug: 'wsd-naming',
        sourcePath: 'docs/standards/wsd-naming',
        tags: ['naming'],
        testsProvidedBy: 'agent',
        provenance: 'corporate'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: standards pack with unknown testsProvidedBy rejected', () => {
  const doc = {
    ...base,
    standards: [
      {
        id: 'std-wsd-naming',
        slug: 'wsd-naming',
        sourcePath: 'docs/standards/wsd-naming',
        tags: ['naming'],
        testsProvidedBy: 'humans',
        provenance: 'corporate'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: standards pack with unknown provenance rejected', () => {
  const doc = {
    ...base,
    standards: [
      {
        id: 'std-wsd-naming',
        slug: 'wsd-naming',
        sourcePath: 'docs/standards/wsd-naming',
        tags: ['naming'],
        testsProvidedBy: 'agent',
        provenance: 'internal'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('manifest: blueprints + standards + preFlightConfig on one manifest validates (additive composition)', () => {
  const doc = {
    ...base,
    blueprints: [
      { slug: 'spa', version: '1.0.0', appliedAt: '2026-08-18T10:00:00Z', source: 'a' }
    ],
    standards: [
      {
        id: 'std-wsd-naming', slug: 'wsd-naming', sourcePath: 'docs/x',
        tags: ['naming'], testsProvidedBy: 'agent', provenance: 'corporate'
      }
    ],
    testCommand: 'pnpm -r test'
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('manifest: pre-0.4.4 manifest (no blueprints[] and no standards[]) still validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});
