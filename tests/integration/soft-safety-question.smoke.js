const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { classifyCrisisPhrase } = require('../../core/safety/canonical_crisis_patterns');
const src = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

function grabConst(name) {
  const re = new RegExp(`const ${name} = [^;]+;`);
  const m = src.match(re);
  if (!m) throw new Error(`could not extract const ${name}`);
  return m[0].replace(`const ${name}`, `var ${name}`);
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
  grabConst('SOFT_SAFETY_QUESTION_PLACEHOLDER'),
  grabFunction('softSafetyQuestionEnabled'),
  grabFunction('shouldEmitSoftSafetyQuestion'),
  grabFunction('writeSoftSafetyQuestionSSE'),
].join('\n'));

function fakeRes() {
  return {
    chunks: [],
    write(chunk) {
      this.chunks.push(chunk);
    },
  };
}

function parseFirstSseChunk(res) {
  assert.equal(res.chunks.length, 1);
  assert.match(res.chunks[0], /^data: /);
  return JSON.parse(res.chunks[0].slice(6).trim());
}

(() => {
  console.log('TEST: soft safety question');
  process.env.TERMINAL_ILLNESS_CRISIS_RULE_ENABLED = 'true';

  const terminal = classifyCrisisPhrase("I have stage 4 cancer and I'm going to die — I need help planning");
  assert.equal(terminal.classification, 'serious_illness');
  assert.equal(terminal.soft_safety_question_required, true);
  assert.equal(terminal.crisis_takeover, false);

  process.env.SOFT_SAFETY_QUESTION_ENABLED = '';
  assert.equal(softSafetyQuestionEnabled(), false);
  let res = fakeRes();
  assert.equal(writeSoftSafetyQuestionSSE(res, terminal, { detected: false }), false, 'flag off emits no text');
  assert.equal(res.chunks.length, 0, 'flag-off path must be byte-identical at SSE output');

  process.env.SOFT_SAFETY_QUESTION_ENABLED = 'true';
  assert.equal(softSafetyQuestionEnabled(), true);
  res = fakeRes();
  assert.equal(writeSoftSafetyQuestionSSE(res, terminal, { detected: false }), true, 'terminal amber emits soft question');
  let event = parseFirstSseChunk(res);
  assert.equal(event.softSafetyQuestion, true);
  assert.equal(event.classification, 'serious_illness');
  assert.ok(event.text.startsWith(SOFT_SAFETY_QUESTION_PLACEHOLDER), 'response opens with placeholder question');
  assert.ok(event.text.endsWith('\n\n'), 'question separates from support content');

  const caregiver = classifyCrisisPhrase("My mother is dying, I can't do this anymore");
  assert.equal(caregiver.classification, 'caregiver_overload');
  assert.equal(caregiver.soft_safety_question_required, true);
  res = fakeRes();
  assert.equal(writeSoftSafetyQuestionSSE(res, caregiver, { detected: false }), true, 'caregiver amber emits soft question');
  event = parseFirstSseChunk(res);
  assert.equal(event.classification, 'caregiver_overload');

  const crisis = classifyCrisisPhrase("I'm terminal and I want to end it myself before it gets bad");
  assert.equal(crisis.crisis_takeover, true);
  res = fakeRes();
  assert.equal(writeSoftSafetyQuestionSSE(res, crisis, { detected: true }), false, 'red crisis owns the banner path');
  assert.equal(res.chunks.length, 0, 'crisis path must not prepend amber question');

  assert.match(
    src,
    /if \(pn === '\/api\/chat'[\s\S]*writeSoftSafetyQuestionSSE\(res, seriousIllnessClassification, crisis\);[\s\S]*writeCrisisBannerSSE\(\);/,
    '/api/chat should write soft question before streamed model content'
  );
  assert.match(
    src,
    /if \(pn === '\/api\/chat\/stream'[\s\S]*writeSoftSafetyQuestionSSE\(res, seriousIllnessClassification, crisis\);[\s\S]*if \(crisis\.detected\)/,
    '/api/chat/stream should write soft question before streamed model content'
  );
  assert.match(
    src,
    /Clinical placeholder for Dr\. Stoler's Monday wording replacement\.\nconst SOFT_SAFETY_QUESTION_PLACEHOLDER/,
    'placeholder should be clearly labeled for clinical replacement'
  );

  process.env.SOFT_SAFETY_QUESTION_ENABLED = '';
  console.log('  passed soft safety question smoke tests');
})()
