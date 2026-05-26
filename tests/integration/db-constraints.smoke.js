const fs = require('fs');
const token = fs.readFileSync(process.env.HOME + '/.supabase/access-token', 'utf8').trim();
const ENDPOINT = `https://api.supabase.com/v1/projects/sqyzboesdpdussiwqpzk/database/query`;
async function q(sql) {
  const r = await fetch(ENDPOINT, { method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, json: j };
}
const pass = (n) => console.log('  ✅', n);
const fail = (n, d) => console.log('  ❌', n, '—', d);

(async () => {
  try {
    // clean any leftovers first
    await q("delete from public.magic_links where token like 'SMOKE_%';");
    await q("delete from public.bleu_comms where recipient_hash = 'SMOKE_HASH';");

    console.log('TEST: atomic single-use consume');
    await q("insert into public.magic_links(email_hash, token, expires_at) values ('SMOKE_HASH','SMOKE_VALID', now()+interval '15 minutes');");
    const c1 = await q("update public.magic_links set consumed_at=now() where token='SMOKE_VALID' and consumed_at is null and expires_at>now() returning id;");
    const c2 = await q("update public.magic_links set consumed_at=now() where token='SMOKE_VALID' and consumed_at is null and expires_at>now() returning id;");
    const n1 = Array.isArray(c1.json) ? c1.json.length : -1;
    const n2 = Array.isArray(c2.json) ? c2.json.length : -1;
    (n1 === 1) ? pass(`first consume updates 1 row (got ${n1})`) : fail('first consume', JSON.stringify(c1.json));
    (n2 === 0) ? pass(`replay consume updates 0 rows (got ${n2}) — single-use holds`) : fail('replay consume', JSON.stringify(c2.json));

    console.log('TEST: expired token rejected by WHERE clause');
    await q("insert into public.magic_links(email_hash, token, expires_at) values ('SMOKE_HASH','SMOKE_EXPIRED', now()-interval '1 minute');");
    const ce = await q("update public.magic_links set consumed_at=now() where token='SMOKE_EXPIRED' and consumed_at is null and expires_at>now() returning id;");
    const ne = Array.isArray(ce.json) ? ce.json.length : -1;
    (ne === 0) ? pass(`expired token updates 0 rows (got ${ne})`) : fail('expired token', JSON.stringify(ce.json));

    console.log('TEST: bleu_comms CHECK constraints');
    const okIns = await q("insert into public.bleu_comms(recipient_hash, comm_type, status) values ('SMOKE_HASH','sms','deferred') returning id;");
    (okIns.status === 201 && Array.isArray(okIns.json) && okIns.json.length === 1) ? pass('valid (sms/deferred) insert accepted') : fail('valid insert', JSON.stringify(okIns.json));
    const badType = await q("insert into public.bleu_comms(recipient_hash, comm_type, status) values ('SMOKE_HASH','fax','deferred');");
    (badType.status >= 400) ? pass(`invalid comm_type='fax' rejected (HTTP ${badType.status})`) : fail('bad comm_type not rejected', JSON.stringify(badType.json));
    const badStatus = await q("insert into public.bleu_comms(recipient_hash, comm_type, status) values ('SMOKE_HASH','email','exploded');");
    (badStatus.status >= 400) ? pass(`invalid status='exploded' rejected (HTTP ${badStatus.status})`) : fail('bad status not rejected', JSON.stringify(badStatus.json));

    // cleanup
    const d1 = await q("delete from public.magic_links where token like 'SMOKE_%';");
    const d2 = await q("delete from public.bleu_comms where recipient_hash = 'SMOKE_HASH';");
    console.log('CLEANUP: magic_links + bleu_comms test rows deleted (HTTP', d1.status, '/', d2.status, ')');
    const leftM = await q("select count(*)::int as n from public.magic_links where token like 'SMOKE_%';");
    const leftC = await q("select count(*)::int as n from public.bleu_comms where recipient_hash='SMOKE_HASH';");
    console.log('CLEANUP VERIFY: magic_links leftovers =', JSON.stringify(leftM.json), '| bleu_comms leftovers =', JSON.stringify(leftC.json));
  } catch (e) { console.error('SMOKE ERROR:', e.message); }
})();
