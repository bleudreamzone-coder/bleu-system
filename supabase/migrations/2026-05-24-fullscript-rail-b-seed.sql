-- Mission 7.7 — Fullscript Rail B catalog seed (10 Dr. Stoler clinical plans)
-- ============================================================================
-- Adapted to the live bleu_catalog schema: Rail B uses fullscript_template_id
-- for the plan URL/slug (there is NO url/dosing/clinical_curator column).
-- Curator + dosing folded into description. felicia_signoff=true (Dr. Stoler
-- curated). Substrate ONLY — card renderer + ALVAI intent mapping are 7.7B/7.7C.
-- ============================================================================

BEGIN;

INSERT INTO public.bleu_catalog
  (sku, rail, name, description, category, fullscript_template_id, felicia_signoff, active)
VALUES
  ('fstoler-sleep-restoration', 'B', 'Sleep Restoration',
   'Dr. Stoler clinical protocol for sleep quality. Methylated forms, once daily.',
   'sleep', 'https://us.fullscript.com/plans/fstoler-sleep-restoration', true, true),
  ('fstoler-anxiety-relief', 'B', 'Anxiety Relief',
   'Dr. Stoler clinical protocol for anxiety + HPA support. Methylated forms, once daily.',
   'stress', 'https://us.fullscript.com/plans/fstoler-anxiety-relief', true, true),
  ('fstoler-anti-inflammation', 'B', 'Anti-Inflammation',
   'Dr. Stoler clinical protocol for inflammation reduction. Methylated forms, once daily.',
   'longevity', 'https://us.fullscript.com/plans/fstoler-anti-inflammation', true, true),
  ('fstoler-energy-focus', 'B', 'Energy + Focus',
   'Dr. Stoler clinical protocol for sustained energy + cognition. Methylated forms, once daily.',
   'longevity', 'https://us.fullscript.com/plans/fstoler-energy-focus', true, true),
  ('fstoler-mood-mental-health', 'B', 'Mood + Mental Health',
   'Dr. Stoler clinical protocol for mood support. Methylated forms, once daily.',
   'stress', 'https://us.fullscript.com/plans/fstoler-mood-mental-health', true, true),
  ('fstoler-metabolic-reset', 'B', 'Metabolic Reset',
   'Dr. Stoler clinical protocol for metabolic health. Methylated forms, once daily.',
   'gut', 'https://us.fullscript.com/plans/fstoler-metabolic-reset', true, true),
  ('fstoler-longevity-protocol', 'B', 'Longevity Protocol',
   'Dr. Stoler clinical protocol for healthspan. Methylated forms, once daily.',
   'longevity', 'https://us.fullscript.com/plans/fstoler-longevity-protocol', true, true),
  ('fstoler-immune-support', 'B', 'Immune Support',
   'Dr. Stoler clinical protocol for immune resilience. Methylated forms, once daily.',
   'longevity', 'https://us.fullscript.com/plans/fstoler-immune-support', true, true),
  ('fstoler-perimenopause-menopause', 'B', 'Perimenopause & Menopause Support',
   'Dr. Stoler clinical protocol for hormonal balance + bone density. Methylated forms, once daily.',
   'longevity', 'https://us.fullscript.com/plans/fstoler-perimenopause-menopause', true, true),
  ('fstoler-daily-foundation', 'B', 'Daily Foundation',
   'Dr. Stoler clinical baseline protocol. Methylated forms, once daily.',
   'longevity', 'https://us.fullscript.com/plans/fstoler-daily-foundation', true, true)
ON CONFLICT (sku) DO UPDATE SET
  fullscript_template_id = EXCLUDED.fullscript_template_id,
  description = EXCLUDED.description,
  updated_at = now();

COMMIT;
