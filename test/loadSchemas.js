// Shared helper for the schemas repo's internal test runner.
// Reads every schema file under schemas/, returns a configured ajv instance
// with all 11 schemas registered, plus the parsed schema bundle keyed by name.
//
// This helper exists for the schemas repo's own CI quality gate. It is NOT
// shipped to consumers (excluded from package.json:files[]).

import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SCHEMAS_DIR = join(REPO_ROOT, 'schemas');

export async function loadSchemas() {
  const files = (await readdir(SCHEMAS_DIR)).filter((f) => f.endsWith('.schema.json'));
  const schemas = {};
  for (const file of files) {
    const raw = await readFile(join(SCHEMAS_DIR, file), 'utf8');
    schemas[file] = JSON.parse(raw);
  }
  return schemas;
}

export async function buildAjv() {
  const ajv = new Ajv({
    strict: true,
    allErrors: true,
    allowUnionTypes: false
  });
  addFormats(ajv);

  const schemas = await loadSchemas();
  // common.schema.json must be added first so $refs from the other schemas resolve.
  if (schemas['common.schema.json']) {
    ajv.addSchema(schemas['common.schema.json']);
  }
  for (const [name, schema] of Object.entries(schemas)) {
    if (name === 'common.schema.json') continue;
    ajv.addSchema(schema);
  }
  return { ajv, schemas };
}

export function getSchemaByName(ajv, name) {
  const idMap = {
    'common.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/common.schema.json',
    'prd.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/prd.schema.json',
    'req.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/req.schema.json',
    'user-story.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/user-story.schema.json',
    'tad.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/tad.schema.json',
    'tac.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/tac.schema.json',
    'adr.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/adr.schema.json',
    'build-sequence.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/build-sequence.schema.json',
    'fbs.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/fbs.schema.json',
    'test-suite.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/test-suite.schema.json',
    'manifest.schema.json': 'https://schemas.stravica.io/rcf/v0.1.0/manifest.schema.json'
  };
  const id = idMap[name];
  if (!id) throw new Error(`Unknown schema file: ${name}`);
  const validator = ajv.getSchema(id);
  if (!validator) throw new Error(`Validator not registered for ${id}`);
  return validator;
}

export const SCHEMA_NAMES = [
  'common',
  'prd',
  'req',
  'user-story',
  'tad',
  'tac',
  'adr',
  'build-sequence',
  'fbs',
  'test-suite',
  'manifest'
];

export const DOC_TYPE_SCHEMAS = SCHEMA_NAMES.filter((n) => n !== 'common');

export { REPO_ROOT };
