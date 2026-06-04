const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ajvPath = path.join(__dirname, '../../node_modules/ajv');

const taxonomyPath = path.join(__dirname, '../../core/config/variant_taxonomy_v1.json');
const signalSchemaPath = path.join(__dirname, '../../core/schemas/signal_object_v1.1.schema.json');
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
const signalSchema = JSON.parse(fs.readFileSync(signalSchemaPath, 'utf8'));

const taxonomyShape = {
  type: 'object',
  required: ['$id', 'version', 'doctrine_source', 'icps'],
  additionalProperties: false,
  properties: {
    $id: { type: 'string' },
    version: { type: 'string' },
    doctrine_source: { type: 'string' },
    icps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'label', 'variants'],
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          variants: {
            type: 'array',
            items: {
              type: 'object',
              required: [
                'variant_id',
                'label',
                'icp_id',
                'felicia_mandatory',
                'six_band_defaults',
                'clinical_watchouts',
                'external_language_allowed',
                'external_language_forbidden',
                'classifier_confidence_threshold',
                'doctrine_refs',
              ],
              additionalProperties: false,
              properties: {
                variant_id: { type: 'string' },
                label: { type: 'string' },
                icp_id: { type: 'string' },
                felicia_mandatory: { type: 'boolean' },
                six_band_defaults: {
                  type: 'object',
                  required: [
                    'life_stage',
                    'clinical_complexity',
                    'financial_capacity',
                    'readiness',
                    'trust',
                    'dose_tolerance',
                  ],
                  additionalProperties: false,
                  properties: {
                    life_stage: { type: 'string' },
                    clinical_complexity: { type: 'string' },
                    financial_capacity: { type: 'string' },
                    readiness: { type: 'string' },
                    trust: { type: 'string' },
                    dose_tolerance: { type: 'string' },
                  },
                },
                clinical_watchouts: { type: 'array', items: { type: 'string' } },
                external_language_allowed: { type: 'array', items: { type: 'string' } },
                external_language_forbidden: { type: 'array', items: { type: 'string' } },
                classifier_confidence_threshold: { type: 'number', minimum: 0, maximum: 1 },
                doctrine_refs: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
};

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(ajvPath)) return null;
  const Ajv = require(ajvPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackTaxonomyValidator(document) {
  const errors = [];
  if (!document || typeof document !== 'object' || Array.isArray(document)) errors.push('taxonomy must be an object');
  if (!Array.isArray(document.icps)) errors.push('icps must be an array');

  for (const icp of document.icps || []) {
    if (typeof icp.id !== 'string') errors.push('icp.id must be a string');
    if (!Array.isArray(icp.variants)) errors.push(`${icp.id || 'icp'}.variants must be an array`);
    for (const variant of icp.variants || []) {
      if (typeof variant.felicia_mandatory !== 'boolean') {
        errors.push(`${variant.variant_id || 'variant'}.felicia_mandatory must be boolean`);
      }
      if (typeof variant.classifier_confidence_threshold !== 'number') {
        errors.push(`${variant.variant_id || 'variant'}.classifier_confidence_threshold must be number`);
      }
      if (!variant.six_band_defaults || typeof variant.six_band_defaults !== 'object') {
        errors.push(`${variant.variant_id || 'variant'}.six_band_defaults must be object`);
      }
    }
  }

  fallbackTaxonomyValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(taxonomyShape);
const validateTaxonomy = compiled ? compiled.validate : fallbackTaxonomyValidator;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || fallbackTaxonomyValidator.errors || []).join(', ');

function allVariants(document = taxonomy) {
  return document.icps.flatMap((icp) => icp.variants);
}

function enumValues(defName) {
  return signalSchema.$defs[defName].allOf[1].properties.value.enum;
}

function assertValidTaxonomy(name, document) {
  assert.equal(validateTaxonomy(document), true, `${name} should validate: ${errorsText(validateTaxonomy.errors)}`);
}

function assertInvalidTaxonomy(name, document) {
  assert.equal(validateTaxonomy(document), false, `${name} should fail validation`);
}

function run() {
  assertValidTaxonomy('Variant Taxonomy v1 runtime config', taxonomy);
  assert.equal(taxonomy.icps.length, 5, 'taxonomy should define 5 ICPs');
  assert.deepEqual(taxonomy.icps.map((icp) => icp.variants.length), [11, 6, 5, 5, 7]);
  assert.equal(allVariants().length, 34, 'taxonomy should define exactly 34 variants');

  for (const variant of allVariants().filter((entry) => entry.variant_id.startsWith('V4.'))) {
    assert.equal(variant.felicia_mandatory, true, `${variant.variant_id} should require Felicia signoff`);
  }

  const v14 = allVariants().find((entry) => entry.variant_id === 'V1.4');
  assert.ok(v14, 'V1.4 should exist');
  assert.ok(enumValues('life_stage_band').includes(v14.six_band_defaults.life_stage));
  assert.ok(enumValues('clinical_complexity_band').includes(v14.six_band_defaults.clinical_complexity));
  assert.ok(enumValues('financial_capacity_band').includes(v14.six_band_defaults.financial_capacity));
  assert.ok(enumValues('readiness_band').includes(v14.six_band_defaults.readiness));
  assert.ok(enumValues('trust_band').includes(v14.six_band_defaults.trust));
  assert.ok(enumValues('dose_tolerance_band').includes(v14.six_band_defaults.dose_tolerance));

  const invalidTaxonomy = structuredClone(taxonomy);
  invalidTaxonomy.icps[0].variants[3].felicia_mandatory = 'true';
  assertInvalidTaxonomy('string felicia_mandatory', invalidTaxonomy);

  console.log('Variant Taxonomy v1 runtime config fixtures: 4/4 passed');
}

run();
