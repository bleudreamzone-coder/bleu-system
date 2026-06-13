const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const serverPath = path.join(repoRoot, 'server.js');
const src = fs.readFileSync(serverPath, 'utf8');

function extractPromptSource(source) {
  const start = source.indexOf('const ALVA_SYSTEM_PROMPT_LEGACY = `');
  if (start === -1) throw new Error('Could not find ALVA_SYSTEM_PROMPT_LEGACY in server.js');

  const endMarker = '\nconst ALVA_SYSTEM_PROMPT_V1 = `';
  const end = source.indexOf(endMarker, start);
  if (end === -1) throw new Error('Could not find end of legacy prompt before ALVA_SYSTEM_PROMPT_V1 in server.js');

  const promptSource = source.slice(start, end);
  if (!/const ALVA_SYSTEM_PROMPT_LEGACY\s*=\s*`/.test(promptSource)) {
    throw new Error('Could not find legacy prompt in extracted prompt source');
  }
  return promptSource;
}

const promptSource = extractPromptSource(src);
const promptSourceLower = promptSource.toLowerCase();

const forbiddenLiterals = [
  '127 years of healing lineage',
  'You are a therapist',
  'THE SALE COMES FROM THE SOUL',
  'Pick up Thorne Magnesium',
  'commerce follows care',
  'Add to Cart buttons. Trust',
  'cortisol dysregulation',
  'sleep architecture',
  'thorne.com',
];

const wisdomVoices = [
  'Martin Luther King',
  'Louis Armstrong',
  'Obama',
  'Hippocrates',
  'survivors',
  'Maya Angelou',
  'Mahalia Jackson',
  'Pema Chodron',
  'Rachel Naomi Remen',
  'Cicely Saunders',
  'Mother Teresa',
  'Leah Chase',
  'Marion Nestle',
  'Thich Nhat Hanh',
  'Merton',
  'Dalai Lama',
];

const failures = [];

for (const literal of forbiddenLiterals) {
  if (promptSourceLower.includes(literal.toLowerCase())) {
    failures.push(`forbidden prompt literal present: ${JSON.stringify(literal)}`);
  }
}

const dollarPrice = /\$\s?\d/;
if (dollarPrice.test(promptSource)) {
  failures.push(`forbidden literal dollar price present: ${dollarPrice}`);
}

for (const voice of wisdomVoices) {
  if (!promptSource.includes(voice)) {
    failures.push(`required wisdom voice missing: ${voice}`);
  }
}

if (failures.length) {
  console.error('PROMPT COMPLIANCE FAILURES');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`✅ Prompt compliance passed: ${forbiddenLiterals.length} forbidden literals absent, no literal dollar prices, ${wisdomVoices.length} wisdom voices present.`);
