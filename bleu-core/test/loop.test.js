// 28 tests — every module + full loop end-to-end
const { computeCI, detectFusion, scoreI, scoreN, computeCIFromMessage } = require('../core/ci');
const { computeISI, updateISI, returnVelocityFromHistory } = require('../core/isi');
const { computeState } = require('../core/state');
const { computeTrajectory, detectBifurcation } = require('../core/trajectory');
const { buildSystemPrompt, getGreeting, OPENINGS } = require('../core/alvai');
const { logSession, buildPassportUpdate, generateLoopEvents, EVENT_TYPES } = require('../core/eventLogger');

let pass = 0, fail = 0;
function assert(name, condition) {
  if (condition) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name); }
}

console.log('\n═══ CI MODULE ═══');
assert('computeCI locked formula', computeCI(80, 60, 70, 50) === (80*0.30+60*0.25+70*0.25+50*0.20));
assert('computeCI clamps at 0', computeCI(-10, -10, -10, -10) === 0);
assert('computeCI clamps at 100', computeCI(200, 200, 200, 200) === 100);
assert('detectFusion baseline is 50', detectFusion('tell me about wellness') === 50);
assert('detectFusion high on "I am broken"', detectFusion('I am broken and worthless') > 60);
assert('detectFusion low on "I feel like"', detectFusion('I feel like things are shifting') < 50);
assert('scoreI inverse of fusion', scoreI('I am nothing') < 50);
assert('scoreN forward-looking scores high', scoreN('how do I build a plan for my future') > 55);
assert('scoreN fatalistic scores low', scoreN('nothing works and there is no point') < 45);
assert('computeCIFromMessage returns object', typeof computeCIFromMessage('I cant sleep', {}).ci === 'number');

console.log('\n═══ ISI MODULE ═══');
assert('computeISI returns number', typeof computeISI(70, 60, 50, 50, 60, 50) === 'number');
assert('computeISI range 0-100', computeISI(100, 100, 100, 100, 100, 100) === 100);
assert('updateISI smooths with alpha', (() => { const r = updateISI({ isi: 50, isi_history: [] }, 80); return r.isi > 50 && r.isi < 80; })());
assert('updateISI 3-session minimum', (() => { const r = updateISI({ isi: 50, isi_history: [{score:50,ts:1},{score:50,ts:2}] }, 90); return r.isi < 65; })());
assert('returnVelocityFromHistory default', returnVelocityFromHistory([]) === 50);

console.log('\n═══ TRAJECTORY MODULE ═══');
assert('insufficient data < 3 sessions', computeTrajectory([{score:50,ts:1}], 0, 50).label === 'INSUFFICIENT_DATA');
assert('stabilizing on positive slope', (() => { const h = [{score:40,ts:1},{score:45,ts:2},{score:50,ts:3},{score:55,ts:4}]; return computeTrajectory(h, 5, 60).label === 'STABILIZING'; })());
assert('declining on negative slope', (() => { const h = [{score:70,ts:1},{score:60,ts:2},{score:50,ts:3},{score:38,ts:4}]; return computeTrajectory(h, 10, 50).label === 'DECLINING'; })());
assert('detectBifurcation inactive with no history', detectBifurcation([], 50, 100).active === false);

console.log('\n═══ STATE MODULE ═══');
assert('computeState returns intent', computeState('I cant sleep', {}).intent === 'sleep');
assert('computeState detects crisis', computeState('I want to kill myself', {}).is_crisis === true);
assert('computeState crisis sets hold tier', computeState('I want to end it all', {}).confidence_tier === 'hold');
assert('computeState new user gets warm tier', computeState('tell me something', { conversations_count: 0 }).confidence_tier === 'warm');
assert('computeState high fusion gets gentle tier', computeState('I am broken and I am not enough and I will never be happy and there is no hope', {}).confidence_tier === 'gentle');

console.log('\n═══ ALVAI MODULE ═══');
assert('getGreeting returns for hello', typeof getGreeting('hello') === 'string');
assert('getGreeting returns null for random', getGreeting('tell me about supplements') === null);
assert('buildSystemPrompt under 8000 chars', buildSystemPrompt(computeState('anxiety', {}), { city: 'New Orleans', conditions: ['anxiety'], medications: ['lexapro'] }).length <= 8000);

console.log('\n═══ EVENT LOGGER ═══');
assert('generateLoopEvents returns array', (() => { const s = computeState('test', {}); return Array.isArray(generateLoopEvents('s1', 'u1', 'test', s, {}, {}, 'response')); })());

console.log('\n═══ FULL LOOP ═══');

// Simulate: message → state → CI → ISI → trajectory → prompt → events
const msg = 'I cant sleep and I feel anxious about everything';
const passport = { city: 'New Orleans', conditions: ['sleep', 'anxiety'], medications: ['lexapro'], conversations_count: 8, isi: 48, ci_history: [{score:45,ts:1},{score:47,ts:2},{score:50,ts:3},{score:52,ts:4}] };
const state = computeState(msg, passport);
const ciResult = computeCIFromMessage(msg, passport);
const isiResult = updateISI(passport, state.isi);
const prompt = buildSystemPrompt(state, passport);
const events = generateLoopEvents('sess1', 'user1', msg, state, ciResult, isiResult, 'response text');
const passportUpdate = buildPassportUpdate(state, ciResult, isiResult, msg);

assert('full loop: state computed', state.intent === 'sleep' && state.intents.includes('stress'));
assert('full loop: prompt built', prompt.length > 500 && prompt.length <= 8000);
assert('full loop: events generated', events.length >= 3);
assert('full loop: passport update built', passportUpdate.last_ci === state.ci);

console.log('\n' + '═'.repeat(40));
console.log(pass + ' passed, ' + fail + ' failed, ' + (pass + fail) + ' total');
if (fail > 0) process.exit(1);
console.log('\x1b[32mAll tests pass.\x1b[0m\n');
