const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

function grabConst(name) {
  const re = new RegExp(`const ${name} = [^;]+;`);
  const m = src.match(re);
  if (!m) throw new Error(`could not extract const ${name}`);
  return m[0];
}

function grabFunction(name) {
  const rawStart = src.indexOf(`function ${name}`);
  const start = rawStart >= 6 && src.slice(rawStart - 6, rawStart) === 'async ' ? rawStart - 6 : rawStart;
  if (start < 0) throw new Error(`could not extract function ${name}`);
  const argsOpen = src.indexOf('(', start);
  let parenDepth = 0;
  let argsEnd = -1;
  for (let i = argsOpen; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
    if (parenDepth === 0) { argsEnd = i; break; }
  }
  if (argsEnd < 0) throw new Error(`unterminated function args ${name}`);
  const open = src.indexOf('{', argsEnd);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const directoryStart = src.indexOf('const DIRECTORY_CITY_ZIP_PREFIX = {');
const directoryEnd = src.indexOf('\n\n// ─── RESTORED', directoryStart);
if (directoryStart < 0 || directoryEnd < 0) throw new Error('could not extract directory helper block');

var querySupabase = async () => { throw new Error('querySupabase stub not configured'); };
var callSupabaseRPC = async () => { throw new Error('callSupabaseRPC stub not configured'); };
var resolveLocation = async () => { throw new Error('resolveLocation stub not configured'); };
const SUPABASE_URL = '';
const SUPABASE_KEY = '';
const fetch = null;

eval([
  grabConst('RADIUS_ROUTING_RADII_MILES'),
  grabConst('RADIUS_ROUTING_SPARSE_ZIP_THRESHOLD'),
  grabFunction('radiusRoutingEnabled'),
  grabFunction('medChangeBiasEnabled'),
  src.slice(directoryStart, directoryEnd),
].join('\n'));

(async () => {
  console.log('TEST: radius routing');

  const high71457 = { zip: '71457', city: 'Natchitoches', state: 'LA', lat: 31.7607, lng: -93.0863, confidence: 'high', source: 'entry', provider_names_allowed: true };

  process.env.USE_RADIUS_ROUTING = 'true';
  let rpcCalls = [];
  let queryCalls = [];
  resolveLocation = async () => high71457;
  callSupabaseRPC = async (fn, body) => {
    rpcCalls.push({ fn, body });
    assert.equal(fn, 'zips_within_radius');
    return [
      { zip: '71458', city: 'Example', state: 'LA', distance_miles: 12 },
      { zip: '71457', city: 'Natchitoches', state: 'LA', distance_miles: 0.15 },
      { zip: '71497', city: 'Example', state: 'LA', distance_miles: 20 },
      { zip: '71456', city: 'Example', state: 'LA', distance_miles: 22 },
      { zip: '71469', city: 'Example', state: 'LA', distance_miles: 23 },
    ];
  };
  querySupabase = async (table, query, limit) => {
    queryCalls.push({ table, query, limit });
    assert.equal(table, 'practitioners');
    return [
      { full_name: 'Far Provider, LPC', specialty: 'Counselor', zip: '71458', city: 'Example', state: 'LA', phone: '318-555-0200' },
      { full_name: 'Near Provider, LPC', specialty: 'Counselor', zip: '71457', city: 'Natchitoches', state: 'LA', phone: '318-555-0100' },
    ];
  };
  const routedBlock = await getPractitioners('find me a counselor in 71457');
  assert.equal(rpcCalls.length, 1, 'high-confidence routing should call zips_within_radius once when 25mi is not sparse');
  assert.equal(rpcCalls[0].body.p_radius_miles, 25);
  assert.match(queryCalls[0].query, /zip=in\.\(/, 'radius route should use ZIP set filter');
  assert.doesNotMatch(queryCalls[0].query, /zip=like/, 'radius route must not use prefix matching');
  assert.ok(routedBlock.indexOf('Near Provider, LPC') < routedBlock.indexOf('Far Provider, LPC'), 'providers should be ordered by ZIP distance');

  const desert = await findRadiusPractitionerRoute(high71457, {
    rpcImpl: async () => [],
    queryImpl: async () => [{ full_name: 'Should Not Appear', zip: '71457' }],
  });
  assert.equal(desert.status, 'honest_desert');
  assert.equal(desert.rows.length, 0);
  assert.match(desert.directive, /No verified practitioners returned within 100 miles/i);
  assert.match(desert.directive, /Name NO practitioners/i);
  assert.doesNotMatch(desert.directive, /Should Not Appear/i);

  const low = await findRadiusPractitionerRoute({ zip: '70130', confidence: 'low', source: 'ip', provider_names_allowed: false });
  assert.equal(low.status, 'low_confidence');
  assert.equal(low.rows.length, 0);
  assert.match(low.directive, /confirm a 5-digit ZIP/i);
  assert.match(low.directive, /Name NO practitioners/i);

  const biasZipRows = [
    { zip: '71457', city: 'Natchitoches', state: 'LA', distance_miles: 0.1 },
    { zip: '71458', city: 'Example', state: 'LA', distance_miles: 12 },
  ];
  const biasRows = [
    { full_name: 'Near Counselor, LPC', specialty: 'Counselor', zip: '71457', city: 'Natchitoches', state: 'LA' },
    { full_name: 'Far Pharmacist, PharmD', specialty: 'Pharmacist', zip: '71458', city: 'Example', state: 'LA' },
    { full_name: 'Far Primary Clinic', specialty: 'Primary Care Clinic', zip: '71458', city: 'Example', state: 'LA' },
  ];
  const routeNames = (route) => route.rows.map((row) => row.full_name);
  const biasRpc = async () => biasZipRows;
  const biasQuery = async () => biasRows;

  process.env.MED_CHANGE_BIAS_ENABLED = '';
  assert.equal(medChangeBiasEnabled(), false);
  const flagOffRoute = await findRadiusPractitionerRoute(high71457, {
    rpcImpl: biasRpc,
    queryImpl: biasQuery,
    limit: 3,
    catalyst_type: 'medication_change',
  });
  assert.deepEqual(routeNames(flagOffRoute), ['Near Counselor, LPC', 'Far Pharmacist, PharmD', 'Far Primary Clinic'], 'flag-off med-change route should preserve existing ZIP-distance order');
  assert.equal(flagOffRoute.med_change_bias, undefined);

  process.env.MED_CHANGE_BIAS_ENABLED = 'true';
  assert.equal(medChangeBiasEnabled(), true);
  const biasedRoute = await findRadiusPractitionerRoute(high71457, {
    rpcImpl: biasRpc,
    queryImpl: biasQuery,
    limit: 3,
    catalyst_type: 'medication_change',
  });
  assert.deepEqual(routeNames(biasedRoute), ['Far Pharmacist, PharmD', 'Far Primary Clinic', 'Near Counselor, LPC'], 'flag-on med-change route should rank pharmacist, then clinic, then existing order');
  assert.equal(biasedRoute.med_change_bias, 'med_change_bias=pharmacist_first');

  const nonMedRoute = await findRadiusPractitionerRoute(high71457, {
    rpcImpl: biasRpc,
    queryImpl: biasQuery,
    limit: 3,
    catalyst_type: 'housing_support',
  });
  assert.deepEqual(routeNames(nonMedRoute), routeNames(flagOffRoute), 'flag-on non-med-change route should stay unchanged');
  assert.equal(nonMedRoute.med_change_bias, undefined);

  const desertWithoutBias = await findRadiusPractitionerRoute(high71457, {
    rpcImpl: biasRpc,
    queryImpl: async () => [],
    limit: 3,
    catalyst_type: 'housing_support',
  });
  const desertWithBias = await findRadiusPractitionerRoute(high71457, {
    rpcImpl: biasRpc,
    queryImpl: async () => [],
    limit: 3,
    catalyst_type: 'medication_change',
  });
  assert.deepEqual(desertWithBias, desertWithoutBias, 'zero candidates should still produce identical honest-desert routing');
  assert.equal(desertWithBias.med_change_bias, undefined);
  process.env.MED_CHANGE_BIAS_ENABLED = '';

  process.env.USE_RADIUS_ROUTING = '';
  rpcCalls = [];
  queryCalls = [];
  callSupabaseRPC = async () => { rpcCalls.push('called'); return []; };
  querySupabase = async (table, query, limit) => {
    queryCalls.push({ table, query, limit });
    return [{ full_name: 'Seeded Provider, LPC', specialty: 'Counselor', zip: '71457', city: 'Natchitoches', state: 'LA', phone: '318-555-0100' }];
  };
  const legacyBlock = await getPractitioners('find me a counselor in 71457');
  assert.equal(rpcCalls.length, 0, 'USE_RADIUS_ROUTING=false should not call radius RPC');
  assert.match(queryCalls[0].query, /zip=like\.71457\*/, 'legacy path should preserve ZIP-prefix query');
  assert.match(queryCalls[0].query, /order=full_name\.asc/, 'legacy path should preserve alphabetical order');
  assert.match(legacyBlock, /Seeded Provider, LPC/);

  console.log('  passed radius routing smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
