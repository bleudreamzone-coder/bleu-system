const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');
process.env.SESSION_SECRET = 'smoke-secret-deterministic';

function grab(re, label) { const m = src.match(re); if (!m) throw new Error('could not extract ' + label); return m[0]; }

// Extract REAL functions from server.js (top-level → close at column-0 brace)
const blocks = [
  'let TWILIO_AUTH = "smoke-twilio-token";',            // stand-in for module const (real one reads env)
  grab(/function hashPhone\(phone\) \{[\s\S]*?\n\}/, 'hashPhone'),
  'let _ephemeralSessionSecret = null;',
  grab(/function sessionSecret\(\) \{[\s\S]*?\n\}/, 'sessionSecret'),
  grab(/function signSession\(payload\) \{[\s\S]*?\n\}/, 'signSession'),
  grab(/function verifySession\(value\) \{[\s\S]*?\n\}/, 'verifySession'),
  grab(/function twilioSignatureValid\(req, params, fullUrl\) \{[\s\S]*?\n\}/, 'twilioSignatureValid'),
  grab(/const TRUST_PACKET_ENUMS = \{[\s\S]*?\n\};/, 'TRUST_PACKET_ENUMS'),
  grab(/function buildTrustPacket\(args\) \{[\s\S]*?\n\}/, 'buildTrustPacket'),
];
eval(blocks.join('\n'));

let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log('  ✅', n); };
const no = (n, d) => { fail++; console.log('  ❌', n, d ? '— ' + d : ''); };
const throws = (fn) => { try { fn(); return false; } catch { return true; } };

console.log('TEST: buildTrustPacket validator');
const valid = { signal_detected:'sleep', risk_level:'low', evidence_tier:'established', claim_boundary:'wellness_support', action_route:'protocol', commerce_gate_state:'green', outcome_check_scheduled:'day_7', reviewer_version:'felicia_review_v1' };
const p = buildTrustPacket(valid);
(Object.keys(p).length === 10 && p.safety_flags.length === 0 && p.timestamp) ? ok('valid args build 10-key packet w/ default safety_flags + timestamp') : no('valid build', JSON.stringify(p));
throws(() => buildTrustPacket(Object.assign({}, valid, { signal_detected:'banana' }))) ? ok('bad enum throws') : no('bad enum did not throw');
throws(() => buildTrustPacket({ signal_detected:'sleep' })) ? ok('missing field throws') : no('missing field did not throw');
throws(() => buildTrustPacket(Object.assign({}, valid, { safety_flags:'oops' }))) ? ok('non-array safety_flags throws') : no('safety_flags did not throw');
throws(() => buildTrustPacket(Object.assign({}, valid, { reviewer_version:'' }))) ? ok('empty reviewer_version throws') : no('reviewer_version did not throw');

console.log('TEST: session cookie HMAC');
const cookie = signSession({ cid:'abc', eh:'h', exp: Date.now() + 60000 });
const v = verifySession(cookie);
(v && v.cid === 'abc') ? ok('sign → verify round-trip recovers payload') : no('round-trip', JSON.stringify(v));
const tampered = cookie.replace(/^./, cookie[0] === 'a' ? 'b' : 'a');
(verifySession(tampered) === null) ? ok('tampered cookie rejected') : no('tamper not rejected');
(verifySession(signSession({ cid:'x', exp: Date.now() - 1000 })) === null) ? ok('expired session rejected') : no('expired not rejected');

console.log('TEST: Twilio signature validation');
const crypto = require('crypto');
const params = { From:'+15045551212', Body:'BETTER', MessageSid:'SM123' };
const fullUrl = 'https://bleu.live/api/sms/inbound';
const data = Object.keys(params).sort().reduce((s,k)=>s+k+params[k], fullUrl);
const goodSig = crypto.createHmac('sha1', 'smoke-twilio-token').update(Buffer.from(data,'utf-8')).digest('base64');
const reqGood = { headers: { 'x-twilio-signature': goodSig } };
let r = twilioSignatureValid(reqGood, params, fullUrl);
(r.ok === true && r.deferred === false) ? ok('valid signature accepted') : no('valid sig', JSON.stringify(r));
r = twilioSignatureValid({ headers:{ 'x-twilio-signature': goodSig } }, Object.assign({}, params, { Body:'WORSE' }), fullUrl);
(r.ok === false) ? ok('tampered params → signature rejected') : no('tampered sig accepted');
{
  // deferred path: re-eval twilioSignatureValid in an isolated scope whose
  // closed-over TWILIO_AUTH is empty (can't reassign the outer eval-scoped const).
  let TWILIO_AUTH = '';
  eval(grab(/function twilioSignatureValid\(req, params, fullUrl\) \{[\s\S]*?\n\}/, 'twilioSignatureValid'));
  const rd = twilioSignatureValid(reqGood, params, fullUrl);
  (rd.deferred === true && rd.ok === false) ? ok('no auth token → deferred (cannot verify)') : no('deferred path', JSON.stringify(rd));
}

console.log('TEST: inbound SMS classifier (mirrors /api/sms/inbound regexes)');
const classify = (b) => /^(stop|unsubscribe|cancel|end|quit)/i.test(b) ? 'opt_out'
  : /^better/i.test(b) ? 'better' : /^same/i.test(b) ? 'same' : /^worse/i.test(b) ? 'worse' : 'unparseable';
const cases = [['BETTER','better'],['better today','better'],['Same','same'],['WORSE','worse'],['STOP','opt_out'],['unsubscribe','opt_out'],['Quit','opt_out'],['asdf','unparseable'],['','unparseable']];
let cok = true; for (const [inp,exp] of cases) { if (classify(inp.trim()) !== exp) { cok = false; no(`classify("${inp}") expected ${exp} got ${classify(inp.trim())}`); } }
if (cok) ok(`all ${cases.length} reply cases classify correctly`);

console.log('TEST: hashPhone normalization (TD-010)');
(hashPhone('+1 (504) 555-1212') === hashPhone('15045551212')) ? ok('formatting variants hash equal') : no('normalization');
(hashPhone('15045551212') !== hashPhone('15045551213')) ? ok('different numbers hash different') : no('collision');
(hashPhone('') === null && hashPhone(null) === null) ? ok('empty/null → null') : no('null handling');

const body = "Hi from BLEU. It's been 7 days since you started your protocol. Reply BETTER, SAME, or WORSE so Dr. Felicia can review your trajectory. Reply STOP to opt out.";
(body.length <= 160) ? ok(`day7 SMS body ${body.length} chars ≤160 (single segment)`) : no('SMS too long', body.length);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
