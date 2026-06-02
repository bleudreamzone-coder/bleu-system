-- DO NOT APPLY without Dr. Felicia signoff on reviewer authority chain per Tier 2 master list item.
-- CounterfactualReview v1.1 shadow migration. trust_packet_id is a forward reference to a future trust_packets table.

CREATE TABLE IF NOT EXISTS counterfactual_reviews (
  review_id uuid PRIMARY KEY,
  trust_packet_id uuid NOT NULL,
  reviewer_id text NOT NULL,
  reviewer_tier text NOT NULL CHECK (reviewer_tier IN ('tier_1_captain', 'tier_2_felicia', 'tier_3_felicia_autonomous')),
  schema_version text NOT NULL DEFAULT '1.1',
  reviewed_at timestamptz NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('confirmed', 'disputed', 'requires_revision', 'insufficient_evidence')),
  verdict_reason text NOT NULL,
  suggested_revision text NULL,
  confidence numeric(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  counterfactual_class_reviewed text NOT NULL CHECK (
    counterfactual_class_reviewed IN (
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
  clinical_review_required boolean NOT NULL,
  td_010 jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT counterfactual_reviews_schema_version_check CHECK (schema_version = '1.1'),
  CONSTRAINT counterfactual_reviews_revision_check CHECK (
    (verdict = 'requires_revision' AND suggested_revision IS NOT NULL AND length(btrim(suggested_revision)) > 0)
    OR (verdict <> 'requires_revision' AND suggested_revision IS NULL)
  ),
  CONSTRAINT counterfactual_reviews_clinical_class_check CHECK (
    (counterfactual_class_reviewed IN ('crisis_missed', 'unsafe_supplement', 'missed_referral', 'wrong_dose') AND clinical_review_required = true)
    OR (counterfactual_class_reviewed NOT IN ('crisis_missed', 'unsafe_supplement', 'missed_referral', 'wrong_dose') AND clinical_review_required = false)
  ),
  CONSTRAINT counterfactual_reviews_authority_chain_check CHECK (
    (clinical_review_required = false)
    OR (reviewer_tier IN ('tier_2_felicia', 'tier_3_felicia_autonomous'))
  ),
  CONSTRAINT counterfactual_reviews_td010_check CHECK (
    td_010 ? 'pii_hashed'
    AND td_010 ? 'plaintext_email_stored'
    AND td_010 ? 'plaintext_phone_stored'
    AND (td_010->>'plaintext_email_stored')::boolean = false
    AND (td_010->>'plaintext_phone_stored')::boolean = false
  )
);

COMMENT ON TABLE counterfactual_reviews IS 'Human review layer for Trust Packet Counterfactual claims. trust_packet_id forward-references future trust_packets persistence.';
COMMENT ON COLUMN counterfactual_reviews.trust_packet_id IS 'Forward reference to a Trust Packet record; no FK until trust_packets table exists.';
COMMENT ON CONSTRAINT counterfactual_reviews_authority_chain_check ON counterfactual_reviews IS 'SQL mirror of schema/adapter authority chain: clinical counterfactuals require Felicia tier review.';

CREATE INDEX IF NOT EXISTS idx_cfr_trust_packet ON counterfactual_reviews (trust_packet_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cfr_reviewer ON counterfactual_reviews (reviewer_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cfr_verdict ON counterfactual_reviews (verdict, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cfr_clinical_pending ON counterfactual_reviews (reviewed_at DESC)
  WHERE clinical_review_required = true AND verdict = 'insufficient_evidence';

ALTER TABLE counterfactual_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY counterfactual_reviews_service_role_all
  ON counterfactual_reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
