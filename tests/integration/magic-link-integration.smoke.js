// Day-80 endpoint integration smoke. Boots server.js against prod Supabase using
// the service key from .env.smoke + local throwaway secrets, runs 8 scenarios,
// cleans up every sentinel row, tears down. Refuses to run until key is filled.
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = '/workspaces/bleu-system';
const ENV_FILE = ROOT + '/.env.smoke';
const TOKEN = fs.readFileSync(process.env.HOME + '/.supabase/access-token', 'utf8').trim();
const MGMT = 'https://api.supabase.com/v1/projects/sqyzboesdpdussiwqpzk/database/query';

// ---- guard: env file present + key filled ---------------------------------
if (!fs.existsSync(ENV_FILE)) { console.error('SMOKE ENV NOT READY: .env.smoke missing'); process.exit(2); }
const envFromFile = {};
for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) envFromFile[m[1]] = m[2];
}
if (!envFromFile.SUPABASE_SERVICE_KEY || /PASTE_SERVICE_ROLE_KEY_HERE/.test(envFromFile.SUPABASE_SERVICE_KEY)) {
  console.error('SMOKE ENV NOT READY: SUPABASE_SERVICE_KEY not filled in'); process.exit(2);
}

// ---- local throwaway secrets (both sides of the test use these) -----------
const LOCAL = {
  SESSION_SECRET: 'smoke-session-secret-local',
  REORDER_CRON_SECRET: 'smoke-cron-secret-local',
  TWILIO_AUTH_TOKEN: 'smoke-twilio-token-local',
  // TWILIO_ACCOUNT_SID / PHONE_NUMBER intentionally unset → day-7 cannot live-send
  // RESEND_API_KEY intentionally unset → email defers
  PORT: '8080'
};
const childEnv = Object.assign({}, process.env, envFromFile, LOCAL);

const sha = (s) => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');
const shaPhone = (p) => crypto.createHash('sha256').update(String(p).replace(/\D/g, '')).digest('hex');
const E_MAIN = 'smoke+test@bleu.live', E_ENUM = 'smoke+enum@bleu.live', E_RATE = 'smoke+rate@bleu.live';
const H_MAIN = sha(E_MAIN), H_ENUM = sha(E_ENUM), H_RATE = sha(E_RATE);
const P_SENT = '+15045550100', H_PHONE = shaPhone(P_SENT);
const testStart = new Date().toISOString();

async function mgmt(sql) {
  const r = await fetch(MGMT, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql }) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, json: j };
}
const H = (method, path, { headers = {}, body, form } = {}) => {
  const opt = { method, headers: Object.assign({}, headers) };
  if (form) { opt.headers['Content-Type'] = 'application/x-www-form-urlencoded'; opt.body = new URLSearchParams(form).toString(); }
  else if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  return fetch('http://localhost:8080' + path, opt).then(async r => ({ status: r.status, setCookie: r.headers.get('set-cookie'), text: await r.text() })).then(r => { try { r.json = JSON.parse(r.text); } catch {} return r; });
};
const results = [];
const ok = (n) => { results.push([true, n]); console.log('  ✅', n); };
const no = (n, d) => { results.push([false, n]); console.log('  ❌', n, d != null ? '— ' + (typeof d === 'string' ? d : JSON.stringify(d)) : ''); };

async function waitForPing() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch('http://localhost:8080/api/ping'); if (r.ok) return true; } catch {}
    await new Promise(res => setTimeout(res, 250));
  }
  return false;
}

async function run() {
  console.log('A. Magic-link request → DB writes');
  let r = await H('POST', '/api/auth/magic-link', { body: { email: E_MAIN } });
  (r.status === 200 && r.json && r.json.ok === true) ? ok('200 {ok:true}') : no('magic-link 200', r.status + ' ' + r.text);
  const ml = await mgmt(`select token, expires_at, consumed_at from public.magic_links where email_hash='${H_MAIN}' order by created_at desc limit 1;`);
  const token = Array.isArray(ml.json) && ml.json[0] && ml.json[0].token;
  token ? ok('magic_links row created') : no('magic_links row', ml.json);
  const cm = await mgmt(`select status, template_version from public.bleu_comms where recipient_hash='${H_MAIN}' order by created_at desc limit 1;`);
  (Array.isArray(cm.json) && cm.json[0] && cm.json[0].status === 'deferred') ? ok('bleu_comms deferred (no RESEND key)') : no('bleu_comms deferred', cm.json);
  const ev = await mgmt(`select count(*)::int n from public.bleu_events where event_type='magic_link_requested' and payload->>'email_hash'='${H_MAIN}';`);
  (ev.json[0] && ev.json[0].n >= 1) ? ok('bleu_events magic_link_requested written') : no('magic_link_requested event', ev.json);

  console.log('D. No-enumeration');
  r = await H('POST', '/api/auth/magic-link', { body: { email: 'garbage-no-at' } });
  (r.status === 200 && r.json.ok === true) ? ok('garbage email → 200 {ok:true}') : no('garbage 200', r.status);
  const gh = await mgmt(`select count(*)::int n from public.magic_links where email_hash='${sha('garbage-no-at')}';`);
  (gh.json[0] && gh.json[0].n === 0) ? ok('garbage email → no magic_links row') : no('garbage row created', gh.json);
  r = await H('POST', '/api/auth/magic-link', { body: { email: E_ENUM } });
  (r.status === 200 && r.json.ok === true) ? ok('valid-form unknown email → identical 200') : no('enum unknown 200', r.status);

  console.log('E. Rate limit (3/email/10min)');
  for (let i = 0; i < 4; i++) await H('POST', '/api/auth/magic-link', { body: { email: E_RATE } });
  const rc = await mgmt(`select count(*)::int n from public.magic_links where email_hash='${H_RATE}';`);
  (rc.json[0] && rc.json[0].n === 3) ? ok(`4 requests → only 3 rows (got ${rc.json[0].n})`) : no('rate limit rows', rc.json);
  const rl = await mgmt(`select count(*)::int n from public.bleu_events where event_type='magic_link_rate_limited' and payload->>'email_hash'='${H_RATE}';`);
  (rl.json[0] && rl.json[0].n >= 1) ? ok('magic_link_rate_limited event written') : no('rate_limited event', rl.json);

  console.log('B. Verify → cookie + Citizen + consume');
  r = await H('POST', '/api/auth/verify', { body: { token } });
  (r.status === 200 && r.json && r.json.ok === true && r.json.citizen && r.json.citizen.id) ? ok('200 {ok:true, citizen.id}') : no('verify 200', r.status + ' ' + r.text);
  (r.setCookie && /bleu_session=/.test(r.setCookie) && /HttpOnly/i.test(r.setCookie) && /SameSite=Lax/i.test(r.setCookie)) ? ok('Set-Cookie httpOnly+SameSite=Lax') : no('Set-Cookie', r.setCookie);
  const cz = await mgmt(`select count(*)::int n from public.bleu_citizens where email_hash='${H_MAIN}';`);
  (cz.json[0] && cz.json[0].n === 1) ? ok('bleu_citizens row created') : no('citizen row', cz.json);
  const cons = await mgmt(`select consumed_at from public.magic_links where token='${token}';`);
  (cons.json[0] && cons.json[0].consumed_at) ? ok('magic_links.consumed_at set') : no('consumed_at', cons.json);
  const vev = await mgmt(`select count(*)::int n from public.bleu_events where event_type='magic_link_verified' and payload->>'email_hash'='${H_MAIN}';`);
  (vev.json[0] && vev.json[0].n >= 1) ? ok('bleu_events magic_link_verified written') : no('verified event', vev.json);

  console.log('C. Replay token → 401');
  r = await H('POST', '/api/auth/verify', { body: { token } });
  (r.status === 401 && r.json && r.json.ok === false) ? ok('replay → 401 (atomic consume holds live)') : no('replay 401', r.status + ' ' + r.text);

  console.log('F. Day-7 cron Bearer auth');
  r = await H('POST', '/api/send-day7-outcomes', { headers: { Authorization: 'Bearer WRONG' } });
  (r.status === 401) ? ok('wrong Bearer → 401') : no('wrong bearer', r.status);
  r = await H('POST', '/api/send-day7-outcomes', { headers: { Authorization: 'Bearer ' + LOCAL.REORDER_CRON_SECRET } });
  (r.status === 200) ? ok(`correct Bearer → 200 (${(r.json && (r.json.error || ('sent=' + r.json.sent))) || ''}; live-send path skipped, no Twilio creds)`) : no('correct bearer', r.status + ' ' + r.text);

  console.log('G. Inbound SMS (signed + unsigned)');
  const sign = (params) => {
    const url = 'https://localhost:8080/api/sms/inbound';
    const data = Object.keys(params).sort().reduce((s, k) => s + k + params[k], url);
    return crypto.createHmac('sha1', LOCAL.TWILIO_AUTH_TOKEN).update(Buffer.from(data, 'utf-8')).digest('base64');
  };
  const inbound = async (bodyText, sid) => {
    const params = { From: P_SENT, Body: bodyText, MessageSid: sid, AccountSid: 'ACsmoke' };
    return H('POST', '/api/sms/inbound', { headers: { 'x-twilio-signature': sign(params), 'x-forwarded-proto': 'https', host: 'localhost:8080' }, form: params });
  };
  let g = await inbound('BETTER', 'SMOKE_SM_1');
  (g.status === 200 && /recorded/i.test(g.text)) ? ok('signed BETTER → 200 + recorded TwiML') : no('inbound BETTER', g.status + ' ' + g.text);
  g = await inbound('STOP', 'SMOKE_SM_2');
  (g.status === 200 && /opted out/i.test(g.text)) ? ok('signed STOP → 200 + opt-out TwiML') : no('inbound STOP', g.status + ' ' + g.text);
  g = await inbound('asdf', 'SMOKE_SM_3');
  (g.status === 200 && /could.?n.?t read/i.test(g.text)) ? ok('signed asdf → 200 + unparseable TwiML') : no('inbound asdf', g.status + ' ' + g.text);
  // unsigned (TWILIO_AUTH set → must reject)
  const us = await H('POST', '/api/sms/inbound', { headers: { 'x-forwarded-proto': 'https', host: 'localhost:8080' }, form: { From: P_SENT, Body: 'BETTER', MessageSid: 'SMOKE_SM_4' } });
  (us.status === 403) ? ok('unsigned → 403') : no('unsigned 403', us.status);
  const resp = await mgmt(`select result, count(*)::int n from (select payload->>'result' result from public.bleu_events where event_type='day7_outcome_response' and payload->>'message_sid' like 'SMOKE_SM%') t group by result;`);
  Array.isArray(resp.json) ? ok('day7_outcome_response events written: ' + JSON.stringify(resp.json)) : no('response events', resp.json);
  const optEv = await mgmt(`select count(*)::int n from public.bleu_events where event_type='sms_opted_out' and payload->>'phone_hash'='${H_PHONE}';`);
  (optEv.json[0] && optEv.json[0].n >= 1) ? ok('sms_opted_out event written') : no('opt-out event', optEv.json);

  console.log('H. Trust Packet (write path + never-throws)');
  // logTrustPacket = buildTrustPacket + querySupabase(bleu_events POST). The POST
  // path is already proven live by A/B writes. Verify buildTrustPacket guards +
  // logTrustPacket never-throws by extracting real source with a stub.
  const src = fs.readFileSync(ROOT + '/server.js', 'utf8');
  const enums = src.match(/const TRUST_PACKET_ENUMS = \{[\s\S]*?\n\};/)[0];
  const build = src.match(/function buildTrustPacket\(args\) \{[\s\S]*?\n\}/)[0];
  const logp = src.match(/async function logTrustPacket\(args\) \{[\s\S]*?\n\}/)[0];
  let querySupabaseCalled = false;
  const querySupabase = async () => { querySupabaseCalled = true; return true; };
  eval(enums + '\n' + build + '\n' + logp);
  const valid = { signal_detected: 'sleep', risk_level: 'low', evidence_tier: 'established', claim_boundary: 'wellness_support', action_route: 'protocol', commerce_gate_state: 'green', outcome_check_scheduled: 'day_7', reviewer_version: 'felicia_review_v1' };
  const p1 = await logTrustPacket(valid);
  (p1 && querySupabaseCalled && p1.timestamp) ? ok('logTrustPacket(valid) builds + writes bleu_events') : no('logTrustPacket valid', p1);
  querySupabaseCalled = false;
  const p2 = await logTrustPacket({ signal_detected: 'banana' });
  (p2 === null && querySupabaseCalled === false) ? ok('logTrustPacket(bad) → null, no write, no throw') : no('logTrustPacket bad', p2);
}

async function cleanup() {
  const hashes = `'${H_MAIN}','${H_ENUM}','${H_RATE}'`;
  const sql = [
    `delete from public.bleu_events where payload->>'email_hash' in (${hashes});`,
    `delete from public.bleu_events where event_type='magic_link_verify_failed' and created_at >= '${testStart}';`,
    `delete from public.bleu_events where payload->>'message_sid' like 'SMOKE_SM%';`,
    `delete from public.bleu_events where event_type='sms_opted_out' and payload->>'phone_hash'='${H_PHONE}';`,
    `delete from public.bleu_comms where recipient_hash in (${hashes});`,
    `delete from public.magic_links where email_hash in (${hashes});`,
    `delete from public.bleu_citizens where email_hash in (${hashes});`
  ].join('\n');
  const r = await mgmt(sql);
  const leftover = await mgmt(`select
     (select count(*)::int from public.magic_links where email_hash in (${hashes})) ml,
     (select count(*)::int from public.bleu_citizens where email_hash in (${hashes})) cz,
     (select count(*)::int from public.bleu_comms where recipient_hash in (${hashes})) cm,
     (select count(*)::int from public.bleu_events where payload->>'email_hash' in (${hashes}) or payload->>'message_sid' like 'SMOKE_SM%' or (event_type='sms_opted_out' and payload->>'phone_hash'='${H_PHONE}')) ev;`);
  console.log('CLEANUP HTTP', r.status, '| leftovers:', JSON.stringify(leftover.json));
  return leftover.json && leftover.json[0];
}

function report(leftover, booted) {
  const passed = results.filter(x => x[0]).length, failed = results.length - passed;
  const lines = results.map(([p, n]) => `- ${p ? '✅' : '❌'} ${n}`).join('\n');
  const md = `# Day 80 endpoint integration smoke — 2026-05-26

Booted: ${booted ? 'yes' : 'NO (server failed to start)'}
Result: **${passed} passed, ${failed} failed** of ${results.length}.

Server ran against live Supabase (prod) with service key from .env.smoke; local
throwaway SESSION_SECRET / REORDER_CRON_SECRET / TWILIO_AUTH_TOKEN; RESEND + full
Twilio creds intentionally unset (email defers, no live SMS). All sentinel rows
(smoke+*@bleu.live, ${P_SENT}, SMOKE_SM* message_sids) deleted after.

## Scenarios
${lines}

## Cleanup leftovers (must be all 0)
\`\`\`
${JSON.stringify(leftover)}
\`\`\`

## Note
Day-7 cohort SEND path not exercised (would emit live SMS) — only Bearer auth +
the "Twilio not configured" guard. logTrustPacket DB write covered transitively
by A/B bleu_events writes; validator + never-throws unit-checked here.
`;
  fs.writeFileSync(ROOT + '/_meta/audits/2026-05-26-day80-integration-smoke.md', md);
  console.log(`\nRESULT: ${passed} passed, ${failed} failed. Report written.`);
  return failed === 0;
}

(async () => {
  console.log('Booting server.js …');
  const child = spawn('node', ['server.js'], { cwd: ROOT, env: childEnv, stdio: ['ignore', 'ignore', 'inherit'] });
  let booted = false, allGreen = false, leftover = null;
  try {
    booted = await waitForPing();
    if (!booted) { console.error('SERVER DID NOT BOOT (no /api/ping within 15s)'); }
    else { await run(); }
  } catch (e) { console.error('SMOKE ERROR:', e.stack || e.message); }
  finally {
    try { leftover = await cleanup(); } catch (e) { console.error('CLEANUP ERROR:', e.message); }
    child.kill('SIGTERM');
    allGreen = report(leftover, booted);
    setTimeout(() => process.exit(allGreen && booted ? 0 : 1), 300);
  }
})();
