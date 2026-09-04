// Targeted tests for eval.schema.json (0.6.0 new doc type). EVAL is the
// graded-output peer of a Test Suite: TS/TC verify deterministic behaviour,
// EVAL grades non-deterministic behaviour (LLM-generated text, ranked
// results, generated code, judgement calls). EVAL is optional in the
// chain; consumers require it only for ACs marked determinism:
// nonDeterministic.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'eval.schema.json');

const base = {
  id: 'EVAL-001',
  usId: 'US-101',
  acIds: ['AC-101-1'],
  title: 'Answer relevance rubric',
  purpose: 'Grade the assistant answer for topical relevance against a hand-authored case set.',
  criteria: [
    { id: 'on-topic', description: 'Answer addresses the user question.' }
  ],
  cases: [
    { id: 'case-hello', input: { question: 'hello?' } }
  ],
  judge: { type: 'rubric' },
  passThreshold: { aggregateScore: 0.8 },
  status: 'draft',
  createdAt: '2026-09-04T00:00:00Z',
  updatedAt: '2026-09-04T00:00:00Z'
};

test('eval: minimal rubric EVAL validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('eval: missing usId rejected', () => {
  const doc = { ...base };
  delete doc.usId;
  assert.equal(validate(doc), false);
});

test('eval: empty acIds rejected (minItems 1)', () => {
  const doc = { ...base, acIds: [] };
  assert.equal(validate(doc), false);
});

test('eval: multi-AC acIds validates', () => {
  const doc = { ...base, acIds: ['AC-101-1', 'AC-101-2'] };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: id pattern accepts four-digit numeric', () => {
  const doc = { ...base, id: 'EVAL-1000' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: two-digit id rejected (three-digit minimum)', () => {
  const doc = { ...base, id: 'EVAL-42' };
  assert.equal(validate(doc), false);
});

test('eval: slug-prefixed id (spa-EVAL-001) validates', () => {
  const doc = { ...base, id: 'spa-EVAL-001', usId: 'spa-US-101' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: uppercase slug prefix (SPA-EVAL-001) rejected', () => {
  const doc = { ...base, id: 'SPA-EVAL-001' };
  assert.equal(validate(doc), false);
});

test('eval: additionalProperties false on the doc', () => {
  const doc = { ...base, unknownField: 1 };
  assert.equal(validate(doc), false);
});

test('eval: empty criteria rejected (minItems 1)', () => {
  const doc = { ...base, criteria: [] };
  assert.equal(validate(doc), false);
});

test('eval: empty cases rejected (minItems 1)', () => {
  const doc = { ...base, cases: [] };
  assert.equal(validate(doc), false);
});

test('eval: criterion id must be kebab slug', () => {
  const doc = { ...base, criteria: [{ id: 'OnTopic', description: 'x' }] };
  assert.equal(validate(doc), false);
});

test('eval: criterion accepts critical and weight', () => {
  const doc = {
    ...base,
    criteria: [
      { id: 'correctness', description: 'x', critical: true, weight: 2 },
      { id: 'brevity', description: 'y', weight: 1 }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: criterion weight must be positive', () => {
  const doc = {
    ...base,
    criteria: [{ id: 'x', description: 'x', weight: 0 }]
  };
  assert.equal(validate(doc), false);
});

test('eval: case accepts free-shape input and expected', () => {
  const doc = {
    ...base,
    cases: [
      { id: 'case-a', input: { q: 'x' }, expected: { a: 'y' }, criteriaIds: ['on-topic'], notes: 'edge case' }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: case additionalProperties false', () => {
  const doc = {
    ...base,
    cases: [{ id: 'case-a', input: {}, mystery: 1 }]
  };
  assert.equal(validate(doc), false);
});

test('eval: llmJudge requires harness', () => {
  const doc = { ...base, judge: { type: 'llmJudge' } };
  assert.equal(validate(doc), false);
});

test('eval: llmJudge with harness validates', () => {
  const doc = {
    ...base,
    judge: {
      type: 'llmJudge',
      harness: {
        invoker: 'claude',
        modelHint: 'opus-4-7',
        systemPromptPath: 'eval/prompts/judge.md',
        responseSchemaPath: 'eval/schemas/response.json'
      }
    }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: llmJudge harness requires invoker and responseSchemaPath', () => {
  const doc = {
    ...base,
    judge: {
      type: 'llmJudge',
      harness: { modelHint: 'x' }
    }
  };
  assert.equal(validate(doc), false);
});

test('eval: llmJudge harness invoker enum enforced', () => {
  const doc = {
    ...base,
    judge: {
      type: 'llmJudge',
      harness: {
        invoker: 'openai-cli',
        responseSchemaPath: 'eval/schemas/response.json'
      }
    }
  };
  assert.equal(validate(doc), false);
});

test('eval: llmJudge harness invoker codex validates (subscription-only rule)', () => {
  const doc = {
    ...base,
    judge: {
      type: 'llmJudge',
      harness: {
        invoker: 'codex',
        responseSchemaPath: 'eval/schemas/response.json'
      }
    }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: scriptedMetric requires script', () => {
  const doc = { ...base, judge: { type: 'scriptedMetric' } };
  assert.equal(validate(doc), false);
});

test('eval: scriptedMetric with script validates', () => {
  const doc = {
    ...base,
    judge: {
      type: 'scriptedMetric',
      script: {
        command: ['node', 'eval/score.mjs'],
        responseSchemaPath: 'eval/schemas/response.json'
      }
    }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: scriptedMetric command must be non-empty', () => {
  const doc = {
    ...base,
    judge: {
      type: 'scriptedMetric',
      script: {
        command: [],
        responseSchemaPath: 'eval/schemas/response.json'
      }
    }
  };
  assert.equal(validate(doc), false);
});

test('eval: judge.type enum rejects unknown value', () => {
  const doc = { ...base, judge: { type: 'vibes' } };
  assert.equal(validate(doc), false);
});

test('eval: judge additionalProperties false', () => {
  const doc = { ...base, judge: { type: 'rubric', mystery: 1 } };
  assert.equal(validate(doc), false);
});

test('eval: passThreshold aggregateScore required', () => {
  const doc = { ...base, passThreshold: {} };
  assert.equal(validate(doc), false);
});

test('eval: passThreshold aggregateScore must be in 0..1', () => {
  const doc = { ...base, passThreshold: { aggregateScore: 1.5 } };
  assert.equal(validate(doc), false);
});

test('eval: passThreshold accepts criticalMustPass and minCasesPassing', () => {
  const doc = {
    ...base,
    passThreshold: { aggregateScore: 0.85, criticalMustPass: true, minCasesPassing: 3 }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: minCasesPassing must be a non-negative integer', () => {
  const doc = { ...base, passThreshold: { aggregateScore: 0.85, minCasesPassing: -1 } };
  assert.equal(validate(doc), false);
});

test('eval: runRecord append-only entry validates', () => {
  const doc = {
    ...base,
    runRecord: [
      {
        runId: '2026-09-04T09-30-00Z-a',
        runAt: '2026-09-04T09:30:00Z',
        runner: 'claude-cli:0.1.28',
        modelPinned: 'claude-opus-4-7',
        aggregateScore: 0.91,
        criticalFailures: [],
        verdict: 'pass',
        artefactPointer: 'reports/eval/2026-09-04T09-30-00Z-a.jsonl'
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: runRecord verdict enum enforced', () => {
  const doc = {
    ...base,
    runRecord: [
      {
        runId: 'x',
        runAt: '2026-09-04T09:30:00Z',
        runner: 'x',
        aggregateScore: 0.5,
        criticalFailures: [],
        verdict: 'sorta'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('eval: runRecord requires runId', () => {
  const doc = {
    ...base,
    runRecord: [
      {
        runAt: '2026-09-04T09:30:00Z',
        runner: 'x',
        aggregateScore: 0.5,
        criticalFailures: [],
        verdict: 'pass'
      }
    ]
  };
  assert.equal(validate(doc), false);
});

test('eval: runRecord.perCaseScores validates deep detail', () => {
  const doc = {
    ...base,
    runRecord: [
      {
        runId: 'r1',
        runAt: '2026-09-04T09:30:00Z',
        runner: 'x',
        aggregateScore: 0.9,
        criticalFailures: [],
        verdict: 'pass',
        perCaseScores: [
          {
            caseId: 'case-hello',
            score: 0.95,
            criteriaScores: [
              { criterionId: 'on-topic', score: 1, rationale: 'ok' }
            ],
            criticalFailed: []
          }
        ]
      }
    ]
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: status enum reuses common.authoringStatus', () => {
  const doc = { ...base, status: 'notARealStatus' };
  assert.equal(validate(doc), false);
});

test('eval: superseded status validates', () => {
  const doc = { ...base, status: 'superseded' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('eval: createdAt must be RFC 3339 timestamp', () => {
  const doc = { ...base, createdAt: 'yesterday' };
  assert.equal(validate(doc), false);
});
