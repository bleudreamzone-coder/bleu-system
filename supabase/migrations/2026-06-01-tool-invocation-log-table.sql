-- PR Juliet — Tool Invocation Log v1.1
-- Migration file only. Not applied in this PR.

create table if not exists public.tool_invocation_log (
  invocation_id uuid primary key,
  tool_id text not null check (tool_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  agent_id text not null,
  session_id text not null,
  decision_id uuid not null,
  parameters jsonb not null default '{}'::jsonb,
  result_status text not null check (result_status in ('success', 'failure', 'timeout', 'rate_limited', 'circuit_breaker_open')),
  latency_ms integer not null check (latency_ms >= 0),
  retries_attempted integer not null check (retries_attempted >= 0),
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  created_at timestamptz not null default now(),
  constraint tool_invocation_log_no_plaintext_email check (not (parameters ? 'plaintext_email')),
  constraint tool_invocation_log_no_plaintext_phone check (not (parameters ? 'plaintext_phone'))
);

create index if not exists tool_invocation_log_tool_created_idx
  on public.tool_invocation_log (tool_id, created_at desc);

create index if not exists tool_invocation_log_session_created_idx
  on public.tool_invocation_log (session_id, created_at desc);

create index if not exists tool_invocation_log_agent_created_idx
  on public.tool_invocation_log (agent_id, created_at desc);

alter table public.tool_invocation_log enable row level security;

revoke all on public.tool_invocation_log from anon, authenticated;
grant all on public.tool_invocation_log to service_role;

create policy "tool_invocation_log_service_role_only"
  on public.tool_invocation_log
  for all
  to service_role
  using (true)
  with check (true);
