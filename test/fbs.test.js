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
