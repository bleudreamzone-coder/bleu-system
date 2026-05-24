-- Phase 1.6 — Open Window foundation tables (Mission 4.1)
-- ============================================================================
-- Substrate for Phase 3 Layer 29 (Receptivity-Stability gate, Mission 4.2)
-- and the future Phase 8 Open Window meta-arc. Server-mediated only,
-- RLS locked, anon/authenticated revoked. Apply via Management API.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.bleu_open_windows (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          text          NOT NULL,
  user_id             uuid,
  cue_event_type      text          NOT NULL,
  -- health_scare | diagnosis | therapy_start | grief | breakup |
  -- substance_quit | retreat | self_declared
  cue_event_timestamp timestamptz   NOT NULL,
  receptivity_score   numeric(3,2),  -- 0.00 to 1.00
  stability_score     numeric(3,2),  -- 0.00 to 1.00
  open_window_score   numeric(3,2),  -- receptivity * stability
  phase               text,
  -- stabilize | repattern | reinforce | root | maintenance | closed
  phase_started_at    timestamptz,
  red_flags           jsonb         DEFAULT '[]',
  opted_in            boolean       DEFAULT false,
  commerce_allowed    boolean       DEFAULT false,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bleu_open_window_actions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  open_window_id  uuid        REFERENCES public.bleu_open_windows(id),
  phase           text        NOT NULL,
  action_type     text        NOT NULL,
  -- sleep_protect | hydration | medication_adherence | one_human_checkin |
  -- trigger_remove | cue_action_pair | identity_sentence | if_then_plan |
  -- reflection | calendar_anchor | support_contract | rescue_plan
  action_content  text,
  delivered_at    timestamptz,
  completed       boolean     DEFAULT false,
  completed_at    timestamptz,
  helped          boolean,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ow_session
  ON public.bleu_open_windows(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ow_phase_active
  ON public.bleu_open_windows(phase) WHERE phase != 'closed';
CREATE INDEX IF NOT EXISTS idx_owa_window
  ON public.bleu_open_window_actions(open_window_id);

ALTER TABLE public.bleu_open_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_open_window_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bleu_open_windows FROM anon;
REVOKE ALL ON TABLE public.bleu_open_windows FROM authenticated;
REVOKE ALL ON TABLE public.bleu_open_window_actions FROM anon;
REVOKE ALL ON TABLE public.bleu_open_window_actions FROM authenticated;

COMMIT;
