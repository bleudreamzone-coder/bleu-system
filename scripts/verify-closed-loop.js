#!/usr/bin/env node

const DEFAULT_EVENT_A_ID = '145bdeb8-97d3-4c03-b711-5e46c5aff813';
const DEFAULT_EVENT_B_ID = 'f47ed23f-259d-49ed-aae3-80d69b610c86';
const EXPECTED_EVENT_A_ROUTE_ID = 'radius_71457_25mi_providers_found';

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : '';
}

function eventId(name, fallback) {
  return argValue(name) || process.env[name.replace(/-/g, '_').toUpperCase()] || fallback;
}

function failConfig(message) {
  console.error(`CONFIG FAIL - ${message}`);
  process.exit(2);
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const EVENT_A_ID = eventId('event-a-id', DEFAULT_EVENT_A_ID);
const EVENT_B_ID = eventId('event-b-id', DEFAULT_EVENT_B_ID);

if (!SUPABASE_URL) failConfig('SUPABASE_URL is required');
if (!SUPABASE_KEY) failConfig('SUPABASE_SERVICE_KEY is required');

async function select(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`Supabase read failed with HTTP ${response.status}`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Supabase read returned non-array payload');
  return rows;
}

function pass(label, detail) {
  console.log(`PASS - ${label}${detail ? ` (${detail})` : ''}`);
  return true;
}

function fail(label, detail) {
  console.log(`FAIL - ${label}${detail ? ` (${detail})` : ''}`);
  return false;
}

function boolStatus(value) {
  return value === true ? 'true' : value === false ? 'false' : String(value);
}

(async () => {
  console.log('Closed-loop verification harness');
  console.log(`Event A: ${EVENT_A_ID}`);
  console.log(`Event B: ${EVENT_B_ID}`);

  const checks = [];

  const eventARows = await select(
    `catalyst_event?select=event_id,route_id,catalyst_type,siren_level,workflow_rail,status&event_id=eq.${encodeURIComponent(EVENT_A_ID)}`
  );
  const eventA = eventARows[0] || null;
  checks.push(eventA && eventA.route_id === EXPECTED_EVENT_A_ROUTE_ID
    && eventA.catalyst_type === 'medication_change'
    && eventA.siren_level === 'amber'
    && eventA.workflow_rail === 'care_transition'
    ? pass('Event A Route/Record row', `rows=${eventARows.length}, route_id=${eventA.route_id}, status=${eventA.status}`)
    : fail('Event A Route/Record row', `rows=${eventARows.length}`));

  const eventBRows = await select(
    `catalyst_event?select=event_id,status,outcome,staff_action_required&event_id=eq.${encodeURIComponent(EVENT_B_ID)}`
  );
  const eventB = eventBRows[0] || null;
  checks.push(eventB && eventB.status === 'resolved' && eventB.outcome === 'reached_support' && eventB.staff_action_required === false
    ? pass('Event B catalyst_event closed', `rows=${eventBRows.length}, status=${eventB.status}, outcome=${eventB.outcome}, staff_action_required=${boolStatus(eventB.staff_action_required)}`)
    : fail('Event B catalyst_event closed', `rows=${eventBRows.length}${eventB ? `, status=${eventB.status}, outcome=${eventB.outcome}, staff_action_required=${boolStatus(eventB.staff_action_required)}` : ''}`));

  const outboundRows = await select(
    `sms_log?select=sms_id,direction,status&event_id=eq.${encodeURIComponent(EVENT_B_ID)}&direction=eq.outbound&status=eq.simulated`
  );
  checks.push(outboundRows.length >= 1
    ? pass('Event B simulated outbound sms_log', `count=${outboundRows.length}, direction=outbound, status=simulated`)
    : fail('Event B simulated outbound sms_log', `count=${outboundRows.length}`));

  const inboundRows = await select(
    `sms_log?select=sms_id,direction,status&event_id=eq.${encodeURIComponent(EVENT_B_ID)}&direction=eq.inbound&status=eq.simulated&body=eq.REACHED`
  );
  checks.push(inboundRows.length >= 1
    ? pass('Event B simulated inbound REACHED sms_log', `count=${inboundRows.length}, direction=inbound, status=simulated`)
    : fail('Event B simulated inbound REACHED sms_log', `count=${inboundRows.length}`));

  if (checks.every(Boolean)) {
    console.log('FINAL PASS - closed loop proof holds');
    process.exit(0);
  }
  console.log('FINAL FAIL - closed loop proof is broken');
  process.exit(1);
})().catch((err) => {
  console.error(`FINAL FAIL - ${err.message}`);
  process.exit(1);
});
