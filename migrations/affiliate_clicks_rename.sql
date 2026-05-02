-- Rename clicks table to affiliate_clicks for naming clarity
-- Aligns with outcome_events naming convention: descriptive table names
-- One-line ALTER, idempotent via IF EXISTS guard
-- Server.js line 1396 querySupabase('clicks', ...) is being updated to
-- querySupabase('affiliate_clicks', ...) in the same commit.
-- Run this SQL FIRST in Supabase, then deploy the code change.

ALTER TABLE IF EXISTS clicks RENAME TO affiliate_clicks;
