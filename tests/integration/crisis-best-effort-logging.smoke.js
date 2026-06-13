const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

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

eval([
  "const PACKAGE_VERSION = '1.0.0';",
  "const CRISIS_BANNER = '988 crisis banner';",
  grabFunction('crisisBestEffortLoggingEnabled'),
  grabFunction('crisisRouteId'),
  grabFunction('shouldAttemptCrisisBestEffortLogging'),
  grabFunction('buildCrisisBestEffortCatalystEvent'),
  grabFunction('runCrisisBestEffortLogging'),
  grabFunction('triggerCrisisBestEffortLogging'),
  grabFunction('writeCrisisBannerSSE'),
].join('\n'));

function fakeRes(order) {
  return {
    chunks: [],
    write(chunk) {
      order && order.push('banner');
      this.chunks.push(chunk);
    },
  };
}

function waitForMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

(async () => {
  console.log('TEST: crisis best-effort logging');

  const crisis = { detected: true, category: 'suicide', matched: 'I want to kill myself' };
  const p = { message: 'I want to kill myself', session: 'crisis-smoke' };

  process.env.CRISIS_BEST_EFFORT_LOGGING_ENABLED = '';
  assert.equal(crisisBestEffortLoggingEnabled(), false);
  assert.equal(shouldAttemptCrisisBestEffortLogging(crisis), false, 'flag-off must not attempt crisis logging');

  let writes = 0;
  const offRes = fakeRes();
  assert.equal(writeCrisisBannerSSE(offRes, crisis, {
    endpoint: '/api/chat',
    writeCatalystEvent: async () => {
      writes++;
      return { ok: true };
    },
  }), true, 'crisis banner still writes when logging flag is off');
  assert.equal(offRes.chunks.length, 1);
  assert.match(offRes.chunks[0], /988 crisis banner/);
  await waitForMicrotasks();
  assert.equal(writes, 0, 'flag-off banner path must not write catalyst_event');

  process.env.CRISIS_BEST_EFFORT_LOGGING_ENABLED = 'true';
  assert.equal(crisisBestEffortLoggingEnabled(), true);
  assert.equal(shouldAttemptCrisisBestEffortLogging(crisis), true);
  assert.equal(shouldAttemptCrisisBestEffortLogging({ detected: false }), false);
  assert.equal(crisisRouteId('/api/chat/stream'), 'crisis_banner_api_chat_stream');

  const recordedWrites = [];
  const recorded = await runCrisisBestEffortLogging({
    crisis,
    endpoint: '/api/chat/stream',
    now: new Date('2026-06-13T15:00:00.000Z'),
    writeCatalystEvent: async (event) => {
      recordedWrites.push(event);
      return { ok: true, row: { event_id: 'crisis-test' } };
    },
  });
  assert.equal(recorded.status, 'recorded');
  assert.equal(recorded.shouldContinue, true);
  assert.equal(recorded.gated, false);
  assert.equal(recordedWrites.length, 1, 'one best-effort crisis row expected');
  const event = recordedWrites[0];
  assert.equal(event.window_type, 'crisis');
  assert.equal(event.catalyst_type, 'crisis_signal');
  assert.equal(event.siren_level, 'red');
  assert.equal(event.workflow_rail, 'crisis_response');
  assert.equal(event.route_id, 'crisis_banner_api_chat_stream');
  assert.equal(event.staff_action_required, true);
  assert.equal(event.commerce_allowed, false);
  assert.equal(event.media_allowed, false);
  assert.equal(event.status, 'open');
  assert.equal(event.event_origin, 'organic');
  assert.equal(event.follow_up_due_at, null);
  assert.match(event.rationale, /988 banner emitted before best-effort ledger write/);
  assert.doesNotMatch(JSON.stringify(event), /kill myself|crisis-smoke/i, 'best-effort row must not copy raw user text or session id');

  const order = [];
  const onRes = fakeRes(order);
  const asyncWrites = [];
  assert.equal(writeCrisisBannerSSE(onRes, crisis, {
    endpoint: '/api/chat',
    writeCatalystEvent: async (eventToWrite) => {
      order.push('write');
      asyncWrites.push(eventToWrite);
      return { ok: true };
    },
  }), true);
  assert.deepEqual(order, ['banner'], 'banner must be emitted synchronously before the async log write');
  await waitForMicrotasks();
  assert.deepEqual(order, ['banner', 'write'], 'best-effort log starts after banner write');
  assert.equal(asyncWrites[0].route_id, 'crisis_banner_api_chat');

  const originalConsoleError = console.error;
  try {
    console.error = () => {};
    const failed = await runCrisisBestEffortLogging({
      crisis,
      endpoint: '/api/chat',
      writeCatalystEvent: async () => {
        throw new Error('simulated insert failure');
      },
    });
    assert.equal(failed.status, 'write_failed_fail_open');
    assert.equal(failed.shouldContinue, true, 'insert failure must not block the crisis response');
  } finally {
    console.error = originalConsoleError;
  }

  const safeRes = fakeRes();
  assert.equal(writeCrisisBannerSSE(safeRes, { detected: false }, { endpoint: '/api/chat' }), false);
  assert.equal(safeRes.chunks.length, 0);

  assert.match(src, /writeCrisisBannerSSE\(res, crisis, \{ endpoint: '\/api\/chat' \}\);/);
  assert.match(src, /writeCrisisBannerSSE\(res, crisis, \{ endpoint: '\/api\/chat\/stream' \}\);/);

  process.env.CRISIS_BEST_EFFORT_LOGGING_ENABLED = '';
  console.log('  passed crisis best-effort logging smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
