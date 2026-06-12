const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

function grabConst(name) {
  const re = new RegExp(`const ${name} = (?:` + '`[\\s\\S]*?`' + `|'[^']+'|[^;]+);`);
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
    if (parenDepth === 0) {
      argsEnd = i;
      break;
    }
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

const grantRouteStart = src.indexOf("if (pn === '/api/consent/grant' && req.method === 'POST')");
const revokeRouteStart = src.indexOf("if (pn === '/api/consent/revoke' && req.method === 'POST')");
const routeEnd = src.indexOf("\n\n  if (pn === '/geo'", revokeRouteStart);
if (grantRouteStart < 0 || revokeRouteStart < 0 || routeEnd < 0) throw new Error('could not extract consent route block');
const consentRouteBlock = src.slice(grantRouteStart, routeEnd);
const consentCopyPlaceholder = grabConst('CONSENT_COPY_PLACEHOLDER').match(/`([\s\S]*)`;/)[1];

var querySupabase = async () => { throw new Error('querySupabase stub not configured'); };

eval([
  grabFunction('consentCaptureEnabled'),
  grabConst('CONSENT_COPY_PLACEHOLDER'),
  grabFunction('consentHashSecret'),
  grabFunction('normalizeConsentContact'),
  grabFunction('consentContactHash'),
  grabFunction('consentTextHash'),
  grabFunction('consentBool'),
  grabFunction('normalizedConsentScopes'),
  grabFunction('publicConsentScopes'),
  grabFunction('normalizeConsentEventId'),
  grabFunction('buildConsentEventGrantPatch'),
  grabFunction('consentGrantResponse'),
  grabFunction('findConsentSubjectByContactHash'),
  grabFunction('grantConsentSubject'),
  grabFunction('revokeConsentSubject'),
  grabFunction('consentResponseLeaksSecret'),
  grabFunction('safeConsentErrorMessage'),
  grabFunction('json'),
  grabFunction('handleConsentGrant'),
  grabFunction('handleConsentRevoke'),
  grabFunction('returnLoopEnabled'),
  grabFunction('processDueReturnFollowUps'),
].join('\n'));

function makeRes() {
  return {
    statusCode: null,
    headers: null,
    rawBody: '',
    body: null,
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = headers || {};
    },
    end(raw) {
      this.rawBody = raw || '';
      this.body = this.rawBody ? JSON.parse(this.rawBody) : null;
    },
  };
}

const now = new Date('2026-06-12T20:00:00.000Z');
const eventId = '11111111-1111-4111-8111-111111111111';
const rawContact = '318-555-0100';
const hashSecret = 'consent-smoke-pepper';
const fixedSubjectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function makeState() {
  return {
    subjects: [],
    events: [
      {
        event_id: eventId,
        subject_id: null,
        consent_status: 'unknown',
        siren_level: 'amber',
        status: 'open',
        route_id: 'radius_71457_25mi_providers_found',
        rationale: 'original rationale must stay frozen',
        follow_up_due_at: '2026-06-12T19:59:00.000Z',
      },
      {
        event_id: '22222222-2222-4222-8222-222222222222',
        subject_id: fixedSubjectId,
        consent_status: 'granted',
        siren_level: 'yellow',
        status: 'open',
        route_id: 'radius_99999_100mi_honest_desert',
        rationale: 'another event',
      },
      {
        event_id: '33333333-3333-4333-8333-333333333333',
        subject_id: fixedSubjectId,
        consent_status: 'granted',
        siren_level: 'yellow',
        status: 'resolved',
        route_id: 'phase3_return_proof_71457',
        rationale: 'resolved event',
      },
    ],
    calls: [],
    catalystPatches: [],
    subjectPatches: [],
  };
}

function queryFor(state) {
  return async (table, query, limit, method, body) => {
    state.calls.push({ table, query, limit, method: method || 'GET', body });

    if (table === 'consent_subject' && !method) {
      const m = query.match(/contact_hash=eq\.([^&]+)/);
      const hash = m ? decodeURIComponent(m[1]) : '';
      return state.subjects.filter((row) => row.contact_hash === hash);
    }

    if (table === 'consent_subject' && method === 'POST') {
      assert.equal(body.contact_hash.includes(rawContact), false, 'raw contact must not be stored');
      state.subjects.push({ ...body });
      return true;
    }

    if (table === 'consent_subject' && method === 'PATCH') {
      const m = query.match(/subject_id=eq\.([^&]+)/);
      const subjectId = m ? decodeURIComponent(m[1]) : '';
      const subject = state.subjects.find((row) => row.subject_id === subjectId);
      assert(subject, 'subject patch must target an existing subject');
      Object.assign(subject, body);
      state.subjectPatches.push({ query, body });
      return [subject];
    }

    if (table === 'catalyst_event' && method === 'PATCH') {
      state.catalystPatches.push({ query, body });
      if (query.startsWith('event_id=eq.')) {
        const m = query.match(/event_id=eq\.([^&]+)/);
        const id = m ? decodeURIComponent(m[1]) : '';
        const event = state.events.find((row) => row.event_id === id);
        if (event) Object.assign(event, body);
        return event ? [event] : [];
      }
      if (query.startsWith('subject_id=eq.')) {
        const m = query.match(/subject_id=eq\.([^&]+)/);
        const subjectId = m ? decodeURIComponent(m[1]) : '';
        const updated = state.events.filter((row) => row.subject_id === subjectId && row.status === 'open');
        for (const event of updated) Object.assign(event, body);
        return updated;
      }
    }

    if (table === 'catalyst_event' && !method) {
      assert.match(query, /status=eq\.open/);
      assert.match(query, /follow_up_due_at=lte\./);
      return state.events.filter((event) => event.status === 'open' && event.follow_up_due_at && event.follow_up_due_at <= now.toISOString());
    }

    throw new Error(`unexpected query ${table} ${method || 'GET'} ${query}`);
  };
}

function grantBody() {
  return {
    event_id: eventId,
    contact: rawContact,
    scopes: {
      follow_up: true,
      loop_status: true,
      longitudinal_linkage: true,
      aggregate_reporting: true,
    },
    consent_text_version: 'v1-2026-06-12',
    consent_text: consentCopyPlaceholder,
  };
}

function assertNoContactLeak(value) {
  const text = JSON.stringify(value || {});
  assert.doesNotMatch(text, new RegExp(rawContact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(text, /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  assert.doesNotMatch(text, /contact_hash|CONSENT_HASH_SECRET|hash_secret/i);
}

(async () => {
  console.log('TEST: consent capture');

  process.env.CONSENT_CAPTURE_ENABLED = '';
  assert.equal(consentCaptureEnabled(), false);

  let state = makeState();
  let res = makeRes();
  await handleConsentGrant({}, res, JSON.stringify(grantBody()), {
    enabled: false,
    queryImpl: async () => { throw new Error('flag-off grant must not touch tables'); },
    hashSecret,
    now,
  });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Not found' });

  res = makeRes();
  await handleConsentRevoke({}, res, JSON.stringify({ contact: rawContact }), {
    enabled: false,
    queryImpl: async () => { throw new Error('flag-off revoke must not touch tables'); },
    hashSecret,
    now,
  });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Not found' });

  process.env.CONSENT_CAPTURE_ENABLED = 'true';
  assert.equal(consentCaptureEnabled(), true);

  state = makeState();
  res = makeRes();
  await handleConsentGrant({}, res, JSON.stringify(grantBody()), {
    enabled: true,
    queryImpl: queryFor(state),
    hashSecret,
    subjectId: fixedSubjectId,
    now,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.subject_id, fixedSubjectId);
  assert.equal(res.body.consent_status, 'granted');
  assert.deepEqual(res.body.scopes, {
    routing: true,
    follow_up: true,
    loop_status: true,
    longitudinal_linkage: true,
    aggregate_reporting: true,
  });
  assertNoContactLeak(res.body);
  assert.equal(state.subjects.length, 1, 'first grant creates one subject');
  assert.equal(state.subjects[0].contact_hash.length, 64);
  assert.equal(state.subjects[0].contact_hash.includes(rawContact), false);
  assert.equal(state.subjects[0].consent_text_hash.length, 64);

  assert.equal(state.catalystPatches.length, 1);
  const grantPatch = state.catalystPatches[0].body;
  assert.deepEqual(Object.keys(grantPatch).sort(), ['consent_status', 'subject_id']);
  assert.deepEqual(grantPatch, buildConsentEventGrantPatch(fixedSubjectId));
  const linkedEvent = state.events.find((row) => row.event_id === eventId);
  assert.equal(linkedEvent.consent_status, 'granted');
  assert.equal(linkedEvent.subject_id, fixedSubjectId);
  assert.equal(linkedEvent.siren_level, 'amber');
  assert.equal(linkedEvent.status, 'open');
  assert.equal(linkedEvent.route_id, 'radius_71457_25mi_providers_found');
  assert.equal(linkedEvent.rationale, 'original rationale must stay frozen');

  const second = await grantConsentSubject(grantBody(), {
    queryImpl: queryFor(state),
    hashSecret,
    subjectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    now,
  });
  assert.equal(second.subject_id, fixedSubjectId, 'same contact should reuse subject_id');
  assert.equal(state.subjects.length, 1, 'same contact should not duplicate subject rows');
  assert.equal(state.calls.filter((call) => call.table === 'consent_subject' && call.method === 'POST').length, 1);

  res = makeRes();
  await handleConsentGrant({}, res, JSON.stringify(grantBody()), {
    enabled: true,
    queryImpl: async () => { throw new Error(`write failed for ${rawContact}`); },
    hashSecret,
    subjectId: fixedSubjectId,
    now,
  });
  assert.equal(res.statusCode, 500);
  assertNoContactLeak(res.body);
  assert.match(res.body.error, /\[redacted\]/);

  res = makeRes();
  await handleConsentRevoke({}, res, JSON.stringify({ contact: rawContact }), {
    enabled: true,
    queryImpl: queryFor(state),
    hashSecret,
    now,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.subject_id, fixedSubjectId);
  assert.equal(res.body.consent_status, 'revoked');
  assert.equal(res.body.events_updated, 2);
  assertNoContactLeak(res.body);
  assert.equal(state.subjects[0].consent_status, 'revoked');
  assert.equal(state.subjects[0].consent_revoked_at, now.toISOString());
  const revokePatch = state.catalystPatches.at(-1).body;
  assert.deepEqual(Object.keys(revokePatch), ['consent_status']);
  assert.equal(revokePatch.consent_status, 'revoked');
  assert.equal(state.events.find((row) => row.event_id === eventId).consent_status, 'revoked');
  assert.equal(state.events.find((row) => row.event_id === '22222222-2222-4222-8222-222222222222').consent_status, 'revoked');
  assert.equal(state.events.find((row) => row.event_id === '33333333-3333-4333-8333-333333333333').consent_status, 'granted', 'resolved rows should not be patched by revoke');

  const unknownConsentState = {
    events: [{ event_id: eventId, consent_status: 'unknown', status: 'open', follow_up_due_at: '2026-06-12T19:59:00.000Z' }],
    calls: [],
  };
  process.env.RETURN_LOOP_ENABLED = 'true';
  const result = await processDueReturnFollowUps({
    now,
    queryImpl: async (table, query, limit, method, body) => {
      unknownConsentState.calls.push({ table, query, limit, method, body });
      assert.equal(method, undefined);
      return unknownConsentState.events;
    },
  });
  assert.equal(result.processed, 1);
  assert.equal(result.skipped_no_consent, 1);
  assert.equal(result.simulated_sent, 0);
  assert.equal(unknownConsentState.calls.length, 1, 'unknown consent must not reach sms_log dedupe or insert');

  assert.doesNotMatch(consentRouteBlock, /sendSMS|twilio/i);
  const consentWriteMatches = [...consentRouteBlock.matchAll(/\b(POST|PATCH|PUT|DELETE|INSERT|UPDATE|UPSERT)\b/g)].map((m) => m[1]);
  assert.deepEqual(consentWriteMatches, ['POST', 'POST'], 'route block should only expose the two POST route methods');

  const helperStart = src.indexOf('const CONSENT_COPY_PLACEHOLDER');
  const helperEnd = src.indexOf('\nasync function insertReturnSmsLog', helperStart);
  const helperBlock = src.slice(helperStart, helperEnd);
  assert.doesNotMatch(helperBlock, /sendSMS|twilio/i);
  assert.match(helperBlock, /queryImpl\('consent_subject', '', 0, 'POST'/);
  assert.match(helperBlock, /queryImpl\('consent_subject', `subject_id=eq\.\$\{encodeURIComponent\(subjectId\)\}`, 0, 'PATCH'/);
  assert.match(helperBlock, /queryImpl\('catalyst_event', `event_id=eq\.\$\{encodeURIComponent\(eventId\)\}`, 0, 'PATCH', buildConsentEventGrantPatch\(subjectId\)\)/);
  assert.match(helperBlock, /queryImpl\('catalyst_event', `subject_id=eq\.\$\{encodeURIComponent\(subjectId\)\}&status=eq.open`, 0, 'PATCH'/);

  console.log('  passed consent capture smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
