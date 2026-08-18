// Targeted tests for req.schema.json - covers the 0.2.0 shape (prdId
// mandatory back-reference to PRD).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAjv, getSchemaByName } from './loadSchemas.js';

const { ajv } = await buildAjv();
const validate = getSchemaByName(ajv, 'req.schema.json');

const base = {
  reqId: 'REQ-001',
  prdId: 'PRD-001',
  title: 'Capture markdown notes',
  description: 'The system must let a user write a markdown note and persist it.',
  category: 'functional',
  domain: 'capture',
  priority: 'must',
  version: '0.1.0',
  status: 'draft',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

test('req: minimal REQ with prdId validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

test('req: missing prdId is rejected (0.2.0 back-reference is mandatory)', () => {
  const doc = { ...base };
  delete doc.prdId;
  assert.equal(validate(doc), false);
});

test('req: bad prdId prefix is rejected', () => {
  const doc = { ...base, prdId: 'PROD-001' };
  assert.equal(validate(doc), false);
});

test('req: unknown category rejected', () => {
  const doc = { ...base, category: 'operational' };
  assert.equal(validate(doc), false);
});

// -- 0.4.0 additions (Track C+D shape classification) -------------------

test('req: shapeClassification with a valid shapes list validates', () => {
  const doc = {
    ...base,
    shapeClassification: {
      shapes: ['webUi', 'auth'],
      reason: 'keyword-scan',
      signals: [
        { source: 'description', match: 'browser', shape: 'webUi' }
      ],
      classifiedAt: '2026-07-30T14:20:00Z'
    }
  };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('req: shapeClassification rejects unknown shape value', () => {
  const doc = {
    ...base,
    shapeClassification: {
      shapes: ['chatbot'],
      reason: 'keyword-scan',
      classifiedAt: '2026-07-30T14:20:00Z'
    }
  };
  assert.equal(validate(doc), false);
});

test('req: shapeClassification requires classifiedAt', () => {
  const doc = {
    ...base,
    shapeClassification: {
      shapes: ['webUi'],
      reason: 'keyword-scan'
    }
  };
  assert.equal(validate(doc), false);
});

test('req: pre-0.4.0 REQ (no shapeClassification) still validates', () => {
  assert.equal(validate(base), true, JSON.stringify(validate.errors));
});

// -- 0.4.4 additions (slug-prefixed reqId for blueprint contributions) -

test('req: slug-prefixed reqId (spa-REQ-001) validates', () => {
  const doc = { ...base, reqId: 'spa-REQ-001' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('req: multi-segment slug prefix (my-blueprint-REQ-042) validates', () => {
  const doc = { ...base, reqId: 'my-blueprint-REQ-042' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test('req: uppercase slug prefix (SPA-REQ-001) is rejected', () => {
  const doc = { ...base, reqId: 'SPA-REQ-001' };
  assert.equal(validate(doc), false);
});

test('req: double-hyphen slug prefix (spa--REQ-001) is rejected', () => {
  const doc = { ...base, reqId: 'spa--REQ-001' };
  assert.equal(validate(doc), false);
});

test('req: leading-hyphen slug prefix (-REQ-001) is rejected', () => {
  const doc = { ...base, reqId: '-REQ-001' };
  assert.equal(validate(doc), false);
});

test('req: numeric-only reqId still validates (back-compat)', () => {
  const doc = { ...base, reqId: 'REQ-999' };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});
