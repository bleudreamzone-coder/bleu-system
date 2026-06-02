#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node tests/audits/rls-remediation-check.js <migration.sql>');
  process.exit(1);
}

let sql;
try {
  sql = fs.readFileSync(file, 'utf8');
} catch (error) {
  console.error(`Unable to read migration file: ${error.message}`);
  process.exit(1);
}

const normalized = sql.replace(/\r\n/g, '\n');
const withoutLineComments = normalized
  .split('\n')
  .map((line) => line.replace(/--.*$/, ''))
  .join('\n');

function countMatches(pattern, source = withoutLineComments) {
  return (source.match(pattern) || []).length;
}

function fail(message) {
  console.error(`RLS remediation check failed: ${message}`);
  process.exit(1);
}

if (!/-- 2026-06-02 RLS Exposure Remediation/.test(normalized)) {
  fail('missing required header comment');
}

if (!/\bBEGIN\s*;/.test(withoutLineComments) || !/\bCOMMIT\s*;/.test(withoutLineComments)) {
  fail('migration must contain BEGIN; and COMMIT;');
}

const beginCount = countMatches(/\bBEGIN\s*;/gi);
const commitCount = countMatches(/\bCOMMIT\s*;/gi);
if (beginCount !== 1 || commitCount !== 1) {
  fail(`expected exactly one BEGIN and one COMMIT, found BEGIN=${beginCount}, COMMIT=${commitCount}`);
}

const alterRlsCount = countMatches(/\bALTER\s+TABLE\s+(?:public\.)?[a-z_][\w]*\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY\s*;/gi);
const createPolicyCount = countMatches(/\bCREATE\s+POLICY\s+(?:"[^"]+"|[a-z_][\w]*)\s+ON\s+(?:public\.)?[a-z_][\w]*\s+[\s\S]*?;/gi);
const revokeCount = countMatches(/\bREVOKE\b[\s\S]*?\bFROM\b[\s\S]*?;/gi);
const feliciaMarkers = countMatches(/FELICIA-SIGNOFF-REQUIRED/g, normalized);
const grantAnonCount = countMatches(/\bGRANT\b[\s\S]*?\bTO\s+anon\b[\s\S]*?;/gi);
const destructiveCount = countMatches(/(?:^|;)\s*(DROP|DELETE|TRUNCATE)\b/gi);

if (alterRlsCount === 0) fail('no ALTER TABLE ... ENABLE ROW LEVEL SECURITY statements found');
if (createPolicyCount === 0) fail('no CREATE POLICY statements found');
if (revokeCount === 0) fail('no REVOKE statements found');
if (feliciaMarkers === 0) fail('no FELICIA-SIGNOFF-REQUIRED markers found');
if (grantAnonCount !== 0) fail('migration grants access to anon, which is forbidden');
if (destructiveCount !== 0) fail('migration contains DROP, DELETE, or TRUNCATE');

const statements = withoutLineComments
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

const allowedStarts = [
  /^BEGIN$/i,
  /^COMMIT$/i,
  /^ALTER\s+TABLE\s+/i,
  /^REVOKE\s+/i,
  /^GRANT\s+SELECT\s+ON\s+TABLE\s+/i,
  /^CREATE\s+POLICY\s+/i,
  /^SELECT\s+/i,
];

const unrecognized = statements.filter((statement) => !allowedStarts.some((pattern) => pattern.test(statement)));
if (unrecognized.length > 0) {
  fail(`unrecognized SQL pattern near: ${unrecognized[0].slice(0, 120).replace(/\s+/g, ' ')}`);
}

console.log('RLS remediation static check');
console.log(`Migration: ${path.normalize(file)}`);
console.log(`ALTER TABLE ... ENABLE ROW LEVEL SECURITY statements: ${alterRlsCount}`);
console.log(`CREATE POLICY statements: ${createPolicyCount}`);
console.log(`REVOKE statements: ${revokeCount}`);
console.log(`FELICIA-SIGNOFF-REQUIRED markers: ${feliciaMarkers}`);
console.log('No live Supabase connection attempted. Static SQL parse only.');
