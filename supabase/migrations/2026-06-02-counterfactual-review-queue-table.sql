-- DO NOT APPLY without Dr. Felicia retention policy + queue prioritization signoff per Tier 2/4 master list items.
-- Counterfactual Review Queue table scaffold only; not applied by this PR.

create table if not exists public.counterfactual_review_queue (
  queue_entry_id uuid primary key,
  trust_packet_id uuid not null,
  counterfactual_class text not null check (
    counterfactual_class in (
      'crisis_missed',
      'unsafe_supplement',
      'overclaim',
      'premature_commerce',
      'wrong_dose',
      'missed_referral',
      'privacy_leak',
      'voice_drift',
      'none'
    )
  ),
  priority text not null check (
    priority in (
      'P0_clinical_urgent',
      'P1_clinical_routine',
      'P2_quality_review',
      'P3_documentation'
    )
  ),
  clinical_review_required boolean not null,
  staleness_threshold_hours integer not null,
  queued_at timestamptz not null default now(),
  dequeued_at timestamptz null,
  dequeued_by_reviewer_id text null,
  dequeued_by_reviewer_tier text null check (
    dequeued_by_reviewer_tier is null
    or dequeued_by_reviewer_tier in (
      'tier_1_captain',
      'tier_2_felicia',
      'tier_3_felicia_autonomous'
    )
  ),
  state text not null default 'queued' check (
    state in ('queued', 'in_review', 'completed', 'stale_escalated', 'deferred')
  ),
  completed_at timestamptz null,
  review_id uuid null,
  td_010 jsonb not null,
  constraint counterfactual_review_queue_clinical_authority_check check (
    (clinical_review_required = false)
    or (dequeued_by_reviewer_tier is null)
    or (dequeued_by_reviewer_tier in ('tier_2_felicia', 'tier_3_felicia_autonomous'))
  )
);

comment on table public.counterfactual_review_queue is
  'Dormant CounterfactualReview queue scaffold. Do not apply without Dr. Felicia retention, priority, and authority-chain signoff.';
comment on column public.counterfactual_review_queue.trust_packet_id is
  'Forward reference; eventual foreign key to trust_packets when that table exists.';
comment on column public.counterfactual_review_queue.review_id is
  'Links to counterfactual_reviews table once a queued item is completed.';

create index if not exists idx_crq_priority_queued
  on public.counterfactual_review_queue (priority, queued_at)
  where state = 'queued';

create index if not exists idx_crq_clinical_pending
  on public.counterfactual_review_queue (queued_at)
  where clinical_review_required = true and state = 'queued';

create index if not exists idx_crq_stale
  on public.counterfactual_review_queue (queued_at)
  where state = 'queued';

alter table public.counterfactual_review_queue enable row level security;

create policy "counterfactual_review_queue_service_role_all"
  on public.counterfactual_review_queue
  for all
  to service_role
  using (true)
  with check (true);

-- No authenticated policy: authenticated users have NO access to institutional infrastructure.
-- No anon policy: anonymous users have NO access to institutional infrastructure.
