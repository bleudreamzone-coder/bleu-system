'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { NotImplementedError } = require('../_adapter');

const recordSchemaPath = path.join(__dirname, '../../schemas/memory_record_v1.1.schema.json');
const querySchemaPath = path.join(__dirname, '../../schemas/memory_query_v1.1.schema.json');
const ajvPath = path.join(__dirname, '../../../node_modules/ajv');
const ajvFormatsPath = path.join(__dirname, '../../../node_modules/ajv-formats');

const recordSchema = JSON.parse(fs.readFileSync(recordSchemaPath, 'utf8'));
const querySchema = JSON.parse(fs.readFileSync(querySchemaPath, 'utf8'));

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(ajvPath) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv = require(ajvPath);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function fallbackRecordValidator(record) {
  const errors = [];
  const required = recordSchema.required;
  const kinds = recordSchema.$defs.memory_kind.enum;
  const authorities = recordSchema.$defs.retention_authority.enum;

  if (!record || typeof record !== 'object' || Array.isArray(record)) errors.push('record must be an object');
  for (const field of required) {
    if (!record || record[field] === undefined) errors.push(`missing required property ${field}`);
  }
  if (record && record.record_id !== undefined && !isUuid(record.record_id)) errors.push('record_id must be uuid');
  if (record && record.session_id !== undefined && typeof record.session_id !== 'string') errors.push('session_id must be string');
  if (record && record.citizen_id !== null && record.citizen_id !== undefined && !isUuid(record.citizen_id)) errors.push('citizen_id must be uuid or null');
  if (record && record.kind !== undefined && !kinds.includes(record.kind)) errors.push(`invalid kind ${record.kind}`);
  if (record && record.schema_version !== undefined && record.schema_version !== '1.1') errors.push('schema_version must be 1.1');
  if (record && record.created_at !== undefined && !isDateTime(record.created_at)) errors.push('created_at must be date-time');
  if (record && record.updated_at !== undefined && !isDateTime(record.updated_at)) errors.push('updated_at must be date-time');
  if (record && record.ttl_days !== null && record.ttl_days !== undefined && (!Number.isInteger(record.ttl_days) || record.ttl_days < 1)) errors.push('ttl_days must be integer or null');
  if (record && record.retention_authority !== undefined && !authorities.includes(record.retention_authority)) errors.push('invalid retention_authority');

  const td010 = record && record.td_010;
  if (td010) {
    if (td010.pii_hashed !== true) errors.push('td_010.pii_hashed must be true');
    if (td010.plaintext_email_stored !== false) errors.push('td_010.plaintext_email_stored must be false');
    if (td010.plaintext_phone_stored !== false) errors.push('td_010.plaintext_phone_stored must be false');
  }

  const payload = record && record.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) errors.push('payload must be object');
  if (record && payload && record.kind === 'semantic') {
    if (!Array.isArray(payload.citizen_facts)) errors.push('semantic citizen_facts must be array');
    for (const fact of payload.citizen_facts || []) {
      if (typeof fact !== 'string' || /plaintext_(email|phone)/.test(fact)) errors.push('semantic citizen_facts must not contain plaintext markers');
    }
    if (typeof payload.confidence !== 'number' || payload.confidence < 0 || payload.confidence > 1) errors.push('semantic confidence must be 0-1');
  }

  fallbackRecordValidator.errors = errors;
  return errors.length === 0;
}

function fallbackQueryValidator(query) {
  const errors = [];
  const kinds = querySchema.$defs.memory_kind.enum;
  const tiers = querySchema.$defs.decision_matrix_tier.enum;

  if (!query || typeof query !== 'object' || Array.isArray(query)) errors.push('query must be an object');
  for (const field of querySchema.required) {
    if (!query || query[field] === undefined) errors.push(`missing required property ${field}`);
  }
  if (query && query.query_id !== undefined && !isUuid(query.query_id)) errors.push('query_id must be uuid');
  if (query && query.session_id !== undefined && typeof query.session_id !== 'string') errors.push('session_id must be string');
  if (query && (!Array.isArray(query.kinds) || query.kinds.length < 1 || query.kinds.some((kind) => !kinds.includes(kind)))) errors.push('invalid kinds');
  if (query && query.tier !== undefined && !tiers.includes(query.tier)) errors.push('invalid tier');
  if (query && (!Number.isInteger(query.max_records) || query.max_records < 1 || query.max_records > 50)) errors.push('max_records must be 1-50');
  if (query && query.include_expired !== undefined && typeof query.include_expired !== 'boolean') errors.push('include_expired must be boolean');

  fallbackQueryValidator.errors = errors;
  return errors.length === 0;
}

const compiledRecord = compileWithAjv(recordSchema);
const compiledQuery = compileWithAjv(querySchema);
const validateRecordSchema = compiledRecord ? compiledRecord.validate : fallbackRecordValidator;
const recordErrorsText = compiledRecord
  ? (errors) => compiledRecord.errorsText(errors)
  : (errors) => (errors || fallbackRecordValidator.errors || []).join(', ');
const validateQuerySchema = compiledQuery ? compiledQuery.validate : fallbackQueryValidator;
const queryErrorsText = compiledQuery
  ? (errors) => compiledQuery.errorsText(errors)
  : (errors) => (errors || fallbackQueryValidator.errors || []).join(', ');

function validateRecord(record) {
  if (!validateRecordSchema(record)) {
    throw new TypeError(`Invalid MemoryRecord: ${recordErrorsText(validateRecordSchema.errors)}`);
  }
}

function withQueryDefaults(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) return query;
  return {
    query_id: crypto.randomUUID(),
    include_expired: false,
    ...query,
  };
}

function validateQuery(query) {
  const normalized = withQueryDefaults(query);
  if (!validateQuerySchema(normalized)) {
    throw new TypeError(`Invalid MemoryQuery: ${queryErrorsText(validateQuerySchema.errors)}`);
  }
  return normalized;
}

function isLiveStoreConfig(config) {
  return Boolean(config && (config.store || config.supabase || config.sink === 'supabase' || config.live === true));
}

/**
 * Create a dormant Memory adapter contract for the future Orchestrator and agents.
 *
 * The default adapter validates every read and write shape, then returns stub values
 * without touching Supabase or production memory. If configured with a live store
 * placeholder, methods throw the Golf scaffold NotImplementedError until a future
 * PR wires the real durable adapter.
 *
 * @param {Object} [config={}] Future memory adapter configuration placeholder.
 * @returns {{read: (query: Object) => Promise<Array<Object>>, write: (record: Object) => Promise<{record_id: string}>, expire: () => Promise<{records_expired_count: number}>}} Dormant memory adapter.
 */
function createMemoryAdapter(config = {}) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('Memory adapter config must be an object');
  }

  const liveStore = isLiveStoreConfig(config);

  return Object.freeze({
    /**
     * Validate a MemoryQuery and return matching MemoryRecords from the future durable store.
     *
     * @param {Object} query MemoryQuery v1.1 input. query_id and include_expired default for import smoke compatibility.
     * @returns {Promise<Array<Object>>} Empty array while shadow-mode memory remains dormant.
     */
    async read(query) {
      validateQuery(query);
      if (liveStore) throw new NotImplementedError('Memory adapter live store not yet wired');
      return [];
    },

    /**
     * Validate a MemoryRecord and return the record id that a future durable write would persist.
     *
     * @param {Object} record MemoryRecord v1.1 input.
     * @returns {Promise<{record_id: string}>} Stub record id while memory remains dormant.
     */
    async write(record) {
      validateRecord(record);
      if (liveStore) throw new NotImplementedError('Memory adapter live store not yet wired');
      return { record_id: record.record_id || '00000000-0000-4000-8000-000000000000' };
    },

    /**
     * Expire old memory records in the future durable store.
     *
     * @returns {Promise<{records_expired_count: number}>} Zero while TTL cleanup is not wired.
     */
    async expire() {
      if (liveStore) throw new NotImplementedError('Memory adapter live store not yet wired');
      return { records_expired_count: 0 };
    },
  });
}

module.exports = { createMemoryAdapter };
