// Wave 9 smoke: validly-signed checkout.session.completed → handler reaches the
// order-confirmation wire-up → sendEmail fires (defers, no Resend) → 200. Booted
// with only a local STRIPE_WEBHOOK_SECRET; no Supabase/Resend, so DB no-ops.
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const SECRET = 'whsec_smoke_local_test';
const child = spawn(process.execPath, ['server.js'], {
  cwd: path.resolve(__dirname, '../..'),
  env: Object.assign({}, process.env, { STRIPE_WEBHOOK_SECRET: SECRET, PORT: '8080',
    SUPABASE_URL: '', SUPABASE_SERVICE_KEY: '', RESEND_API_KEY: '' }),
  stdio: ['ignore', 'pipe', 'pipe']
});
let logs = '';
child.stdout.on('data', d => logs += d); child.stderr.on('data', d => logs += d);

const wait = async () => { for (let i = 0; i < 60; i++) { try { const r = await fetch('http://localhost:8080/api/ping'); if (r.ok) return true; } catch {} await new Promise(r => setTimeout(r, 250)); } return false; };

(async () => {
  let pass = 0, fail = 0;
  const ok = n => { pass++; console.log('  ✅', n); };
  const no = (n, d) => { fail++; console.log('  ❌', n, d != null ? '— ' + d : ''); };
  try {
    if (!await wait()) { console.error('server did not boot'); child.kill(); process.exit(1); }

    const event = { id: 'evt_smoke_' + Date.now(), type: 'checkout.session.completed', data: { object: {
      id: 'cs_smoke_123', client_reference_id: null, customer: 'cus_smoke',
      customer_details: { email: 'smoke+stripe@bleu.live', name: 'Smoke Tester' },
      amount_total: 4900, currency: 'usd', metadata: { price_id: 'price_smoke' } } } };
    const body = JSON.stringify(event);
    const t = Math.floor(Date.now() / 1000);
    const v1 = crypto.createHmac('sha256', SECRET).update(t + '.' + body).digest('hex');

    // 1. valid signature → 200
    let r = await fetch('http://localhost:8080/stripe-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` }, body });
    let j = await r.json().catch(() => ({}));
    (r.status === 200 && j.received === true) ? ok(`valid event → 200 ${JSON.stringify(j)}`) : no('valid event 200', r.status + ' ' + JSON.stringify(j));

    // 2. bad signature → 400 (sanity: verification still enforced)
    r = await fetch('http://localhost:8080/stripe-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': `t=${t},v1=deadbeef` }, body });
    (r.status === 400) ? ok('bad signature → 400') : no('bad sig 400', r.status);

    await new Promise(r => setTimeout(r, 300)); // let async handler log
    /order_confirmation_v1/.test(logs) ? ok('sendEmail invoked with order_confirmation_v1 (deferred, no Resend)') : no('order_confirmation_v1 not in logs');
    !/order confirmation wire-up failed/.test(logs) ? ok('no wire-up exception') : no('wire-up threw', logs.match(/order confirmation wire-up failed.*/)?.[0]);
  } catch (e) { no('smoke error', e.message); }
  finally {
    child.kill('SIGTERM');
    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
    setTimeout(() => process.exit(fail ? 1 : 0), 200);
  }
})();
