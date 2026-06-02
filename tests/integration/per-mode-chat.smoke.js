// Per-mode chat smoke harness (PR 0 — regression guard for upcoming Bud excision).
//
// What it does:
//   POSTs a tagged probe message to /api/chat for each non-cannaiq mode and
//   asserts: (1) HTTP 200, (2) the SSE stream emits at least one text chunk
//   and a [DONE] terminator, (3) no Bud-voice tokens leak into the response
//   (the actual excision regression guard). Cannaiq mode is exercised too,
//   but as a no-leak assertion only — the prompt's content can change with
//   the Bud excision PRs without breaking this test.
//
// Why opt-in (RUN_LIVE=1):
//   Every /api/chat call costs real OpenAI tokens AND writes rows to
//   bleu_events, user_coherence, conversation_history, conversation_memory.
//   Running this in CI by default would cost money and pollute prod data,
//   so default is a dry-run that only validates the test's own internal
//   shape. Set RUN_LIVE=1 to actually fire against the prod URL.
//
// Tagging:
//   Every probe message starts with "[SMOKE-PER-MODE-<datestamp>]" so the
//   resulting DB rows are findable via:
//     select * from bleu_events where payload->>'msg_len' is not null
//       and created_at > now() - interval '15 minutes'
//   (Better yet: query conversation_history.content_preview if available.)
//
// Run safely:
//   node tests/integration/per-mode-chat.smoke.js           # dry-run, no network
//   RUN_LIVE=1 node tests/integration/per-mode-chat.smoke.js # live against prod
//
// Exit code: 0 on all-pass, 1 on any-fail, 2 on env-not-ready.

const TARGET = process.env.SMOKE_TARGET_URL || 'https://bleu-system.onrender.com';
const LIVE = process.env.RUN_LIVE === '1';
const TAG = '[SMOKE-PER-MODE-2026-05-29]';
const PROBE = `${TAG} Brief check-in — I'm tracking my morning routine and want to keep it simple today.`;
const PER_REQUEST_TIMEOUT_MS = 30000;

// 13 non-cannaiq modes from CLAUDE.md. Cannaiq added separately as a no-leak-only
// check (its content is the Bud-adjacent surface and may legitimately change).
const NON_CANNAIQ_MODES = [
  'general', 'dashboard', 'directory', 'vessel', 'map', 'protocols',
  'learn', 'community', 'passport', 'therapy', 'recovery', 'missions', 'finance'
];

// Retired Bud voice tokens — these came from the pre-excision BUD V5 prompt
// and are specific enough that a leak into any other mode's output is a true
// regression. Keep tight; loose substrings produce false positives.
const BUD_LEAK_TOKENS = [
  "I'm Bud",
  'cannabis intelligence concierge',
  'CannaIQ.net',
  '302,516',
];

const results = [];
const pass = (n) => { results.push([true, n]); console.log('  ✅', n); };
const fail = (n, d) => { results.push([false, n, d]); console.log('  ❌', n, d != null ? '— ' + (typeof d === 'string' ? d : JSON.stringify(d).slice(0, 200)) : ''); };

function timeoutFetch(url, opt, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, Object.assign({}, opt, { signal: ctrl.signal })).finally(() => clearTimeout(timer));
}

// /api/chat responds with text/event-stream. Parse `data: {...}` lines, accumulate
// `.text` fields, stop on `data: [DONE]`. Returns { status, chunks, fullText, done }.
async function postChatSSE(mode) {
  const body = JSON.stringify({ message: PROBE, mode, session_id: 'smoke_per_mode_' + Date.now() });
  const r = await timeoutFetch(TARGET + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body
  }, PER_REQUEST_TIMEOUT_MS);

  const status = r.status;
  if (status !== 200) {
    const text = await r.text().catch(() => '');
    return { status, chunks: 0, fullText: '', done: false, errorBody: text.slice(0, 400) };
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let fullText = '';
  let chunks = 0;
  let done = false;

  while (true) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const ln of lines) {
      if (!ln.startsWith('data: ')) continue;
      const payload = ln.slice(6).trim();
      if (payload === '[DONE]') { done = true; continue; }
      try {
        const j = JSON.parse(payload);
        const t = j.text || (j.choices?.[0]?.delta?.content) || j.delta?.content || j.output;
        if (typeof t === 'string' && t.length > 0) { fullText += t; chunks++; }
      } catch { /* ignore non-JSON SSE payloads (e.g. partial frames) */ }
    }
  }
  return { status, chunks, fullText, done };
}

function assertNoBudLeak(modeLabel, fullText) {
  const lc = fullText.toLowerCase();
  const leaks = BUD_LEAK_TOKENS.filter(tok => lc.includes(tok.toLowerCase()));
  if (leaks.length === 0) return { ok: true };
  return { ok: false, leaks };
}

async function runModeCheck(mode, expectBudContentOk) {
  const label = `mode='${mode}'`;
  let r;
  try {
    r = await postChatSSE(mode);
  } catch (e) {
    fail(`${label} — network/timeout`, e.message);
    return;
  }
  if (r.status !== 200) { fail(`${label} — HTTP ${r.status}`, r.errorBody); return; }
  if (!r.done) { fail(`${label} — stream did not terminate ([DONE] not seen)`, `chunks=${r.chunks}`); return; }
  if (r.chunks === 0 || r.fullText.length === 0) { fail(`${label} — empty response`, `chunks=${r.chunks}`); return; }
  pass(`${label} — HTTP 200 + SSE complete (${r.chunks} chunks, ${r.fullText.length} chars)`);

  if (!expectBudContentOk) {
    const leak = assertNoBudLeak(label, r.fullText);
    if (!leak.ok) {
      fail(`${label} — Bud voice tokens leaked`, leak.leaks);
    } else {
      pass(`${label} — no Bud voice token leak`);
    }
  }
}

async function dryRun() {
  console.log('per-mode-chat.smoke — DRY RUN (set RUN_LIVE=1 to fire against', TARGET + ')');
  console.log('  modes that would be checked:');
  for (const m of NON_CANNAIQ_MODES) console.log('    -', m, '(no-leak + response-shape asserts)');
  console.log('    - cannaiq', '(response-shape only; content may legitimately change with excision)');
  console.log('  probe message:', PROBE);
  console.log('  Bud leak tokens:', BUD_LEAK_TOKENS.map(t => JSON.stringify(t)).join(', '));
  console.log('  per-request timeout:', PER_REQUEST_TIMEOUT_MS + 'ms');
  // Lint-equivalent: confirm the test's own helpers are well-formed.
  const sanity = assertNoBudLeak('self-test', 'hello world');
  if (!sanity.ok) { console.error('  ❌ self-test: leak helper false-positive on neutral text'); process.exit(1); }
  console.log('  ✅ leak helper passes self-test on neutral text');
  console.log('DRY RUN OK — re-run with RUN_LIVE=1 to execute live.');
  process.exit(0);
}

async function liveRun() {
  console.log('per-mode-chat.smoke — LIVE against', TARGET);
  console.log('  probe message:', PROBE);
  console.log('  modes:', NON_CANNAIQ_MODES.length, '(non-cannaiq) +', '1 (cannaiq, leak-only)');
  console.log('');

  // Ping first — fail fast if prod is down.
  try {
    const ping = await timeoutFetch(TARGET + '/api/ping', { method: 'GET' }, 5000);
    if (!ping.ok) { console.error('  ❌ prod /api/ping returned', ping.status); process.exit(2); }
    pass('prod /api/ping reachable');
  } catch (e) {
    console.error('  ❌ prod /api/ping unreachable:', e.message); process.exit(2);
  }

  // Sequential — don't hammer the chat endpoint or the OpenAI rate limit.
  for (const mode of NON_CANNAIQ_MODES) {
    await runModeCheck(mode, /*expectBudContentOk=*/false);
  }
  await runModeCheck('cannaiq', /*expectBudContentOk=*/true);

  const passed = results.filter(r => r[0]).length;
  const failed = results.length - passed;
  console.log('');
  console.log(`SUMMARY: ${passed}/${results.length} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('');
    console.log('FAILED CHECKS:');
    for (const r of results) if (!r[0]) console.log('  -', r[1], r[2] != null ? '— ' + JSON.stringify(r[2]).slice(0, 300) : '');
    process.exit(1);
  }
  process.exit(0);
}

(LIVE ? liveRun : dryRun)().catch(e => { console.error('FATAL:', e); process.exit(1); });
