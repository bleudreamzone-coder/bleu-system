-- BLEU COHERENCE INDEX MIGRATION
-- Run in Supabase dashboard SQL editor: sqyzboesdpdussiwqpzk

CREATE TABLE IF NOT EXISTS user_coherence (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL,
  recorded_at           TIMESTAMPTZ DEFAULT NOW(),
  pc_score              FLOAT,
  bc_score              FLOAT,
  ic_score              FLOAT,
  nc_score              FLOAT,
  ci_raw                FLOAT,
  ci_adjusted           FLOAT,
  ci_display            FLOAT,
  velocity_3d           FLOAT,
  velocity_7d           FLOAT,
  velocity_class        TEXT CHECK (velocity_class IN ('RISING_FAST','RISING','STABLE','DECLINING','DECLINING_FAST')),
  al_proxy              FLOAT,
  al_ceiling            FLOAT,
  circadian_phase       TEXT,
  isi_fusion_score      FLOAT,
  isi_language_sample   TEXT,
  bifurcation_proximity BOOLEAN DEFAULT FALSE,
  quantum_cognition_eligible BOOLEAN DEFAULT FALSE,
  confidence            FLOAT,
  sessions_used         INTEGER,
  oura_connected        BOOLEAN DEFAULT FALSE,
  session_id            TEXT,
  tab_context           TEXT,
  city                  TEXT,
  neighborhood          TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_coherence_user_id
  ON user_coherence (user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_coherence_city
  ON user_coherence (city, neighborhood, recorded_at DESC);

CREATE OR REPLACE VIEW jazz_bird_ci_research AS
SELECT
  DATE_TRUNC('day', recorded_at)  AS cohort_date,
  AVG(ci_adjusted)                AS avg_ci,
  AVG(al_proxy)                   AS avg_allostatic_load,
  AVG(isi_fusion_score)           AS avg_identity_fusion,
  COUNT(CASE WHEN bifurcation_proximity THEN 1 END) AS bifurcation_events,
  COUNT(CASE WHEN velocity_class = 'RISING_FAST' THEN 1 END) AS rising_fast_users,
  COUNT(CASE WHEN velocity_class = 'DECLINING_FAST' THEN 1 END) AS declining_fast_users,
  AVG(ic_score)                   AS avg_identity_coherence,
  COUNT(*)                        AS n_readings
FROM user_coherence
GROUP BY 1
ORDER BY 1 DESC;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS city         TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS ci_current   FLOAT,
  ADD COLUMN IF NOT EXISTS ci_velocity  TEXT;
