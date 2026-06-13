const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const src = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

function grabConst(name) {
  const re = new RegExp(`const ${name} = [\\s\\S]*?;`);
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
  grabConst('PRIVATE_ADMIN_ROUTES'),
  grabConst('PUBLIC_SURFACE_FORBIDDEN_PATTERNS'),
  grabFunction('isPrivateAdminRoute'),
  grabFunction('publicSurfaceLeakReasons'),
  grabFunction('publicSurfaceHtmlIsSafe'),
].join('\n'));

function walkHtmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(p, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

(async () => {
  console.log('TEST: public/admin surface separation');

  assert.equal(isPrivateAdminRoute('/api/command/overview'), true);
  assert.equal(isPrivateAdminRoute('/api/command/overview/'), true);
  assert.equal(isPrivateAdminRoute('/api/navigator/queue'), true);
  assert.equal(isPrivateAdminRoute('/api/chat'), false);
  assert.equal(isPrivateAdminRoute('/cities'), false);

  assert.equal(publicSurfaceHtmlIsSafe('<html><body>City support and public resources</body></html>'), true);
  assert.deepEqual(publicSurfaceLeakReasons('<script>fetch("/api/command/overview")</script>'), ['command overview API route']);
  assert.deepEqual(publicSurfaceLeakReasons('<div>staff_action_required catalyst_event</div>'), ['ledger table name', 'staff-action ledger field']);
  assert.equal(publicSurfaceHtmlIsSafe('<div>subject_id</div>'), false);

  const commandRouteStart = src.indexOf("if (pn === '/api/command/overview' && req.method === 'GET')");
  const commandRouteEnd = src.indexOf("\n\n  if (pn === '/api/navigator/queue'", commandRouteStart);
  const navigatorRouteStart = src.indexOf("if (pn === '/api/navigator/queue' && req.method === 'GET')");
  const navigatorRouteEnd = src.indexOf("\n\n  if (pn === '/api/consent/grant'", navigatorRouteStart);
  assert.notEqual(commandRouteStart, -1);
  assert.notEqual(navigatorRouteStart, -1);
  const commandRouteBlock = src.slice(commandRouteStart, commandRouteEnd);
  const navigatorRouteBlock = src.slice(navigatorRouteStart, navigatorRouteEnd);
  assert.match(commandRouteBlock, /handleCommandOverview/);
  assert.match(navigatorRouteBlock, /handleNavigatorQueue/);
  assert.match(src, /isPrivateAdminRoute\(pn\) && req\.method !== 'GET'/, 'private admin routes should 404 non-GET attempts');

  const publicFiles = [
    'index.html',
    'support.html',
    'privacy.html',
    'supply.html',
    'learn.html',
    ...walkHtmlFiles(path.join(root, 'dist')),
  ].map((file) => path.isAbsolute(file) ? file : path.join(root, file))
    .filter((file) => fs.existsSync(file));

  assert(publicFiles.length > 1000, 'expected generated public HTML corpus to be present');
  for (const file of publicFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const reasons = publicSurfaceLeakReasons(html);
    assert.deepEqual(reasons, [], `${path.relative(root, file)} leaked admin markers: ${reasons.join(', ')}`);
  }

  assert.doesNotMatch(src, /betterhelp\.com\/bleu[\s\S]{0,120}command\/overview/i, 'public affiliate surfaces must not bridge to command overview');
  console.log(`  scanned ${publicFiles.length} public HTML files`);
  console.log('  passed public/admin surface separation smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
