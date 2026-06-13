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
  grabConst('BARRIER_RULES'),
  grabFunction('barrierLedgerEnabled'),
  grabFunction('classifyBarrierSignal'),
  grabFunction('barrierLedgerFields'),
  grabFunction('applyBarrierLedgerFields'),
  grabFunction('returnBarrierResolutionPatch'),
].join('\n'));

(() => {
  console.log('TEST: barrier ledger');

  process.env.BARRIER_LEDGER_ENABLED = '';
  assert.equal(barrierLedgerEnabled(), false);
  assert.deepEqual(barrierLedgerFields("I don't understand the new dose."), {}, 'flag off must add no ledger fields');
  assert.deepEqual(applyBarrierLedgerFields({ status: 'open' }, "I don't understand the new dose."), { status: 'open' }, 'flag off event payload remains unchanged');

  assert.equal(classifyBarrierSignal("I can't afford the copay.").barrier_type, 'cost');
  assert.equal(classifyBarrierSignal('The pharmacy is closed and my prescription is not ready.').barrier_type, 'pharmacy_access');
  assert.equal(classifyBarrierSignal('I need a ride to get there.').barrier_type, 'transportation');
  assert.equal(classifyBarrierSignal('My internet is out and I cannot connect.').barrier_type, 'broadband');
  assert.equal(classifyBarrierSignal('My mother is dying and I am burned out from caring.').barrier_type, 'caregiver_burden');
  assert.equal(classifyBarrierSignal('hello from 71457'), null, 'neutral messages do not create barrier labels');

  process.env.BARRIER_LEDGER_ENABLED = 'true';
  assert.equal(barrierLedgerEnabled(), true);
  const fields = barrierLedgerFields("I was discharged and don't understand the new dose.");
  assert.deepEqual(fields, {
    barrier_type: 'confusion',
    barrier_confidence: 0.84,
    user_confirmed: true,
    barrier_resolved_status: 'open',
    aggregate_allowed: false,
  });
  assert.deepEqual(barrierLedgerFields('hello from 71457'), {}, 'flag on without a signal still adds no fields');

  const event = applyBarrierLedgerFields({ status: 'open', catalyst_type: 'medication_change' }, 'I have no ride.');
  assert.equal(event.status, 'open');
  assert.equal(event.catalyst_type, 'medication_change');
  assert.equal(event.barrier_type, 'transportation');
  assert.equal(event.aggregate_allowed, false);

  assert.deepEqual(
    returnBarrierResolutionPatch('closed', { barrier_type: 'confusion' }, { enabled: true }),
    { barrier_resolved_status: 'resolved' },
    'closed Return should resolve a captured barrier'
  );
  assert.deepEqual(
    returnBarrierResolutionPatch('reopened', { barrier_type: 'transportation' }, { enabled: true }),
    { barrier_resolved_status: 'still_blocked' },
    'HELP Return should mark the barrier still blocked'
  );
  assert.deepEqual(returnBarrierResolutionPatch('closed', { barrier_type: 'confusion' }, { enabled: false }), {});
  assert.deepEqual(returnBarrierResolutionPatch('closed', {}, { enabled: true }), {});

  process.env.BARRIER_LEDGER_ENABLED = '';
  console.log('  passed barrier ledger smoke tests');
})()
