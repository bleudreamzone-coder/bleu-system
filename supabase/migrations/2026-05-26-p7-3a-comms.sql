-- Mission 7.3 — bleu_comms transactional communications log
-- ============================================================================
-- One row per outbound transactional message (email now, SMS later). Records
-- delivery state so ops can audit what was sent, to which Citizen, and whether
-- the provider accepted/delivered/bounced it. Server-mediated only, RLS locked.
--
-- TD-010 privacy note: this table intentionally has NO plaintext recipient
-- column. The recipient is stored as recipient_hash (SHA-256 of lowercased
-- email — identical to server.js hashEmail) so ops can correlate a known
-- address to its messages without the table ever holding the address itself.
-- `subject` and `body` hold the rendered template; keep PII out of templates
-- (use first-name only where unavoidable) — see Soul-Gate notes.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.bleu_comms (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id        uuid        REFERENCES public.bleu_citizens(id) ON DELETE SET NULL,
  recipient_hash    text,
  comm_type         text        NOT NULL CHECK (comm_type IN ('email','sms')),
  template_version  text,
  subject           text,
  body              text,
  resend_message_id text,
  twilio_sid        text,
  status            text        NOT NULL CHECK (status IN ('sent','delivered','failed','bounced','deferred')),
  error_message     text,
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bleu_comms_citizen_id
  ON public.bleu_comms(citizen_id) WHERE citizen_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bleu_comms_sent_at
  ON public.bleu_comms(sent_at);
CREATE INDEX IF NOT EXISTS idx_bleu_comms_status
  ON public.bleu_comms(status);

ALTER TABLE public.bleu_comms ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bleu_comms FROM anon;
REVOKE ALL ON public.bleu_comms FROM authenticated;

COMMIT;
