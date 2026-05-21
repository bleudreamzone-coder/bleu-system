-- RLS policies + RLS-enable statements extracted from schema-snapshot-2026-05-21.sql
-- Generated 2026-05-21T21:32:41Z by SHIP_IT_PROMPT.md TASK 1
-- Source: supabase db dump --linked --schema public (Supabase CLI 2.101.0)

-- ============================================================
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY statements
-- ============================================================
ALTER TABLE "public"."affiliate_clicks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."care_twin_embeddings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clinical_trials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."fda_adverse_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."fda_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legal_disclaimers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."life_stabilization_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."nola_providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."outcome_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."practitioners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."real_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."scrape_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_reviews" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REVOKE / GRANT statements
-- ============================================================
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON FUNCTION "public"."calculate_practitioner_trust"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_practitioner_trust"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_practitioner_trust"("p_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."calculate_product_trust"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_product_trust"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_product_trust"("p_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."calculate_user_lss"("p_user_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_lss"("p_user_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_lss"("p_user_id" "uuid", "p_days" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."match_conversation_history"("p_query_embedding" "public"."vector", "p_user_id" "text", "p_exclude_session" "text", "p_min_similarity" double precision, "p_match_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."match_conversation_history"("p_query_embedding" "public"."vector", "p_user_id" "text", "p_exclude_session" "text", "p_min_similarity" double precision, "p_match_count" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."match_session_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."match_session_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_session_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_user_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."semantic_search_care_twin"("query_embedding" "public"."vector", "target_user_id" "uuid", "match_count" integer, "match_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."semantic_search_care_twin"("query_embedding" "public"."vector", "target_user_id" "uuid", "match_count" integer, "match_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."semantic_search_care_twin"("query_embedding" "public"."vector", "target_user_id" "uuid", "match_count" integer, "match_threshold" double precision) TO "service_role";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_all_practitioner_scores"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_all_practitioner_scores"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_all_practitioner_scores"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_all_product_scores"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_all_product_scores"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_all_product_scores"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";
GRANT ALL ON TABLE "public"."affiliate_clicks" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_clicks" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_clicks" TO "service_role";
GRANT ALL ON TABLE "public"."agent11_syntheses" TO "anon";
GRANT ALL ON TABLE "public"."agent11_syntheses" TO "authenticated";
GRANT ALL ON TABLE "public"."agent11_syntheses" TO "service_role";
GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";
GRANT ALL ON TABLE "public"."care_twin_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."care_twin_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."care_twin_embeddings" TO "service_role";
GRANT ALL ON TABLE "public"."care_twin_patterns" TO "anon";
GRANT ALL ON TABLE "public"."care_twin_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."care_twin_patterns" TO "service_role";
GRANT ALL ON TABLE "public"."cities" TO "anon";
GRANT ALL ON TABLE "public"."cities" TO "authenticated";
GRANT ALL ON TABLE "public"."cities" TO "service_role";
GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";
GRANT ALL ON TABLE "public"."clinical_trials" TO "anon";
GRANT ALL ON TABLE "public"."clinical_trials" TO "authenticated";
GRANT ALL ON TABLE "public"."clinical_trials" TO "service_role";
GRANT ALL ON TABLE "public"."commitments" TO "anon";
GRANT ALL ON TABLE "public"."commitments" TO "authenticated";
GRANT ALL ON TABLE "public"."commitments" TO "service_role";
GRANT ALL ON TABLE "public"."conditions" TO "anon";
GRANT ALL ON TABLE "public"."conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."conditions" TO "service_role";
GRANT ALL ON TABLE "public"."conversation_history" TO "service_role";
GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";
GRANT ALL ON TABLE "public"."daily_reports" TO "anon";
GRANT ALL ON TABLE "public"."daily_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_reports" TO "service_role";
GRANT ALL ON TABLE "public"."dr_felicia_reviews" TO "anon";
GRANT ALL ON TABLE "public"."dr_felicia_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."dr_felicia_reviews" TO "service_role";
GRANT ALL ON TABLE "public"."emotional_signals" TO "anon";
GRANT ALL ON TABLE "public"."emotional_signals" TO "authenticated";
GRANT ALL ON TABLE "public"."emotional_signals" TO "service_role";
GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";
GRANT ALL ON TABLE "public"."fda_adverse_events" TO "anon";
GRANT ALL ON TABLE "public"."fda_adverse_events" TO "authenticated";
GRANT ALL ON TABLE "public"."fda_adverse_events" TO "service_role";
GRANT ALL ON SEQUENCE "public"."fda_adverse_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fda_adverse_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fda_adverse_events_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."fda_data" TO "anon";
GRANT ALL ON TABLE "public"."fda_data" TO "authenticated";
GRANT ALL ON TABLE "public"."fda_data" TO "service_role";
GRANT ALL ON SEQUENCE "public"."fda_data_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fda_data_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fda_data_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."food_sources" TO "anon";
GRANT ALL ON TABLE "public"."food_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."food_sources" TO "service_role";
GRANT ALL ON TABLE "public"."legal_disclaimers" TO "anon";
GRANT ALL ON TABLE "public"."legal_disclaimers" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_disclaimers" TO "service_role";
GRANT ALL ON TABLE "public"."life_stabilization_scores" TO "anon";
GRANT ALL ON TABLE "public"."life_stabilization_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."life_stabilization_scores" TO "service_role";
GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";
GRANT ALL ON TABLE "public"."marketplace_practitioners" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_practitioners" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_practitioners" TO "service_role";
GRANT ALL ON TABLE "public"."nola_providers" TO "anon";
GRANT ALL ON TABLE "public"."nola_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."nola_providers" TO "service_role";
GRANT ALL ON SEQUENCE "public"."nola_providers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nola_providers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nola_providers_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."outcome_events" TO "anon";
GRANT ALL ON TABLE "public"."outcome_events" TO "authenticated";
GRANT ALL ON TABLE "public"."outcome_events" TO "service_role";
GRANT ALL ON TABLE "public"."pipeline_log" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_log" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_log" TO "service_role";
GRANT ALL ON SEQUENCE "public"."pipeline_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pipeline_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pipeline_log_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."practitioner_bookings" TO "anon";
GRANT ALL ON TABLE "public"."practitioner_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."practitioner_bookings" TO "service_role";
GRANT ALL ON TABLE "public"."practitioners" TO "anon";
GRANT ALL ON TABLE "public"."practitioners" TO "authenticated";
GRANT ALL ON TABLE "public"."practitioners" TO "service_role";
GRANT ALL ON TABLE "public"."predictive_signals" TO "anon";
GRANT ALL ON TABLE "public"."predictive_signals" TO "authenticated";
GRANT ALL ON TABLE "public"."predictive_signals" TO "service_role";
GRANT ALL ON TABLE "public"."product_practitioner_links" TO "anon";
GRANT ALL ON TABLE "public"."product_practitioner_links" TO "authenticated";
GRANT ALL ON TABLE "public"."product_practitioner_links" TO "service_role";
GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."protocols" TO "anon";
GRANT ALL ON TABLE "public"."protocols" TO "authenticated";
GRANT ALL ON TABLE "public"."protocols" TO "service_role";
GRANT ALL ON TABLE "public"."pubmed_studies" TO "anon";
GRANT ALL ON TABLE "public"."pubmed_studies" TO "authenticated";
GRANT ALL ON TABLE "public"."pubmed_studies" TO "service_role";
GRANT ALL ON TABLE "public"."real_events" TO "anon";
GRANT ALL ON TABLE "public"."real_events" TO "authenticated";
GRANT ALL ON TABLE "public"."real_events" TO "service_role";
GRANT ALL ON TABLE "public"."reddit_mentions" TO "anon";
GRANT ALL ON TABLE "public"."reddit_mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."reddit_mentions" TO "service_role";
GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";
GRANT ALL ON TABLE "public"."safety_checks" TO "anon";
GRANT ALL ON TABLE "public"."safety_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."safety_checks" TO "service_role";
GRANT ALL ON SEQUENCE "public"."safety_checks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."safety_checks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."safety_checks_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."scrape_log" TO "anon";
GRANT ALL ON TABLE "public"."scrape_log" TO "authenticated";
GRANT ALL ON TABLE "public"."scrape_log" TO "service_role";
GRANT ALL ON TABLE "public"."seo_pages" TO "anon";
GRANT ALL ON TABLE "public"."seo_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_pages" TO "service_role";
GRANT ALL ON TABLE "public"."session_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."session_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."session_embeddings" TO "service_role";
GRANT ALL ON TABLE "public"."symptom_specialist_map" TO "anon";
GRANT ALL ON TABLE "public"."symptom_specialist_map" TO "authenticated";
GRANT ALL ON TABLE "public"."symptom_specialist_map" TO "service_role";
GRANT ALL ON SEQUENCE "public"."symptom_specialist_map_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."symptom_specialist_map_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."symptom_specialist_map_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."user_arcs" TO "anon";
GRANT ALL ON TABLE "public"."user_arcs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_arcs" TO "service_role";
GRANT ALL ON TABLE "public"."user_coherence" TO "anon";
GRANT ALL ON TABLE "public"."user_coherence" TO "authenticated";
GRANT ALL ON TABLE "public"."user_coherence" TO "service_role";
GRANT ALL ON TABLE "public"."user_reviews" TO "anon";
GRANT ALL ON TABLE "public"."user_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reviews" TO "service_role";
GRANT ALL ON TABLE "public"."validation_log" TO "anon";
GRANT ALL ON TABLE "public"."validation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."validation_log" TO "service_role";
GRANT ALL ON TABLE "public"."workforce_signals" TO "anon";
GRANT ALL ON TABLE "public"."workforce_signals" TO "authenticated";
GRANT ALL ON TABLE "public"."workforce_signals" TO "service_role";
GRANT ALL ON TABLE "public"."youtube_videos" TO "anon";
GRANT ALL ON TABLE "public"."youtube_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."youtube_videos" TO "service_role";

-- ============================================================
-- CREATE POLICY statements (full bodies)
-- ============================================================
CREATE POLICY "Allow public read" ON "public"."cities" FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON "public"."locations" FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON "public"."practitioners" FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON "public"."products" FOR SELECT USING (true);

CREATE POLICY "Anyone can insert clicks" ON "public"."affiliate_clicks" FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert events" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert reviews" ON "public"."user_reviews" FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read clinical_trials" ON "public"."clinical_trials" FOR SELECT USING (true);

CREATE POLICY "Public read disclaimers" ON "public"."legal_disclaimers" FOR SELECT USING (true);

CREATE POLICY "Public read events" ON "public"."events" FOR SELECT USING (true);

CREATE POLICY "Public read nola_providers" ON "public"."nola_providers" FOR SELECT USING (true);

CREATE POLICY "Public read real_events" ON "public"."real_events" FOR SELECT USING (true);

CREATE POLICY "Public read reviews" ON "public"."user_reviews" FOR SELECT USING (true);

CREATE POLICY "Users delete convos" ON "public"."conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users insert convos" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users insert own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users read convos" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users read own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));

CREATE POLICY "Users update convos" ON "public"."conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users update own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

CREATE POLICY "allow_all_fda_adverse_events" ON "public"."fda_adverse_events" USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_fda_data" ON "public"."fda_data" USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_scrape_log" ON "public"."scrape_log" USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert_embeddings" ON "public"."care_twin_embeddings" FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_insert_lss" ON "public"."life_stabilization_scores" FOR INSERT WITH CHECK (true);

CREATE POLICY "service_role_all_outcome_events" ON "public"."outcome_events" TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "users read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));

CREATE POLICY "users update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

CREATE POLICY "users_own_embeddings" ON "public"."care_twin_embeddings" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "users_own_lss" ON "public"."life_stabilization_scores" USING (("auth"."uid"() = "user_id"));

