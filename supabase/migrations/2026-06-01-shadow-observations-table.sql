-- PR Hotel: Shadow observations table schema only.
-- NOT applied automatically. Captain applies manually in the Supabase dashboard
-- SQL editor when the dormant shadow runner is approved for activation.

create table if not exists public.shadow_observations (
  observation_id uuid primary key,
  session_id text not null,
  timestamp timestamptz not null,
  candidate_agent_id text not null,
  candidate_decision jsonb,
  candidate_trust_packet jsonb,
  live_response_hash text,
  shadow_response_hash text,
  parity_match boolean,
  latency_ms integer not null check (latency_ms >= 0),
  errors text[] not null default '{}',
  td_010_compliance jsonb not null,
  created_at timestamptz not null default now(),
  constraint shadow_observations_td_010_required check (
    td_010_compliance = '{"pii_hashed": true, "plaintext_email_stored": false, "plaintext_phone_stored": false}'::jsonb
  )
);

alter table public.shadow_observations enable row level security;

-- Only the service role may read implementation-detail shadow observations.
create policy "service_role_select_shadow_observations"
  on public.shadow_observations
  for select
  to service_role
  using (true);

-- Only the service role may insert shadow observations.
create policy "service_role_insert_shadow_observations"
  on public.shadow_observations
  for insert
  to service_role
  with check (true);

-- No anon/authenticated policies are created. Those roles cannot read or insert
-- shadow observations unless Captain adds an explicit future policy.
