


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."calculate_practitioner_trust"("p_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  score INTEGER := 0;
  p RECORD;
  review_count INTEGER;
  avg_review NUMERIC;
BEGIN
  SELECT * INTO p FROM practitioners WHERE id = p_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- Base: Has NPI (verified federal registration) = 40 points
  IF p.npi IS NOT NULL AND p.npi != '' THEN score := score + 40; END IF;
  
  -- Has credential = 10 points
  IF p.credential IS NOT NULL AND p.credential != '' THEN score := score + 10; END IF;
  
  -- Has phone = 5 points
  IF p.phone IS NOT NULL AND p.phone != '' THEN score := score + 5; END IF;
  
  -- Has address = 5 points
  IF p.address_line1 IS NOT NULL AND p.address_line1 != '' THEN score := score + 5; END IF;
  
  -- Has website = 5 points
  IF p.website IS NOT NULL AND p.website != '' THEN score := score + 5; END IF;
  
  -- Has bio = 5 points
  IF p.bio IS NOT NULL AND p.bio != '' THEN score := score + 5; END IF;
  
  -- BLEU reviews: up to 15 points
  SELECT COUNT(*), COALESCE(AVG(rating), 0) INTO review_count, avg_review
  FROM user_reviews WHERE target_id = p_id AND target_type = 'practitioner';
  
  IF review_count >= 1 THEN score := score + 5; END IF;
  IF review_count >= 5 THEN score := score + 5; END IF;
  IF avg_review >= 4.0 THEN score := score + 5; END IF;
  
  -- Google rating bonus: up to 10 points
  IF p.avg_rating >= 4.0 THEN score := score + 5; END IF;
  IF p.avg_rating >= 4.5 THEN score := score + 5; END IF;
  
  -- License verified = 5 points
  IF p.license_verified = true THEN score := score + 5; END IF;
  
  -- Cap at 100
  IF score > 100 THEN score := 100; END IF;
  
  RETURN score;
END;
$$;


ALTER FUNCTION "public"."calculate_practitioner_trust"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_product_trust"("p_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  score INTEGER := 0;
  p RECORD;
  study_count INTEGER;
  review_count INTEGER;
BEGIN
  SELECT * INTO p FROM products WHERE id = p_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- Is BLEU Pick = 30 points
  IF p.is_bleu_pick = true THEN score := score + 30; END IF;
  
  -- Has brand = 10 points
  IF p.brand IS NOT NULL AND p.brand != '' THEN score := score + 10; END IF;
  
  -- Third party verified = 15 points
  IF p.third_party_verified = true THEN score := score + 15; END IF;
  
  -- NSF certified = 10 points
  IF p.nsf_certified = true THEN score := score + 10; END IF;
  
  -- Has PubMed studies linked = 10 points
  IF p.pubmed_studies IS NOT NULL AND p.pubmed_studies > 0 THEN score := score + 10; END IF;
  
  -- No FDA recalls = 10 points (penalty if recalled)
  IF p.fda_recall = true THEN score := score - 20; END IF;
  IF p.fda_recall IS NULL OR p.fda_recall = false THEN score := score + 10; END IF;
  
  -- BLEU reviews
  SELECT COUNT(*) INTO review_count
  FROM user_reviews WHERE target_id = p_id AND target_type = 'product';
  IF review_count >= 3 THEN score := score + 10; END IF;
  
  -- Amazon rating
  IF p.amazon_rating IS NOT NULL AND p.amazon_rating >= 4.0 THEN score := score + 5; END IF;
  
  IF score < 0 THEN score := 0; END IF;
  IF score > 100 THEN score := 100; END IF;
  
  RETURN score;
END;
$$;


ALTER FUNCTION "public"."calculate_product_trust"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_user_lss"("p_user_id" "uuid", "p_days" integer DEFAULT 30) RETURNS numeric
    LANGUAGE "sql" STABLE
    AS $$
  with signals as (
    select
      count(*) as total_sessions,
      count(*) filter (where 'sleep' = any(topics)) as sleep_q,
      count(*) filter (where 'stress' = any(topics) or 'anxiety' = any(topics) or 'cortisol' = any(topics)) as stress_q,
      count(*) filter (where 'therapy' = any(topics) or 'practitioner' = any(topics)) as care_q,
      count(*) filter (where 'financial' = any(topics) or 'prescription' = any(topics) or 'goodrx' = any(topics)) as financial_q,
      count(distinct date_trunc('day', created_at)) as days_active
    from care_twin_embeddings
    where user_id = p_user_id
      and created_at > now() - (p_days || ' days')::interval
  )
  select round(
    (greatest(0, 100 - (s.sleep_q::numeric / greatest(s.total_sessions, 1) * 200)) * 0.25) +
    (greatest(0, 100 - (s.stress_q::numeric / greatest(s.total_sessions, 1) * 200)) * 0.25) +
    (least(100, s.care_q::numeric * 20) * 0.20) +
    (least(100, 50 + s.financial_q::numeric * 10) * 0.15) +
    (least(100, s.days_active::numeric / p_days * 200) * 0.15)
  , 1)
  from signals s;
$$;


ALTER FUNCTION "public"."calculate_user_lss"("p_user_id" "uuid", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_conversation_history"("p_query_embedding" "public"."vector", "p_user_id" "text", "p_exclude_session" "text", "p_min_similarity" double precision, "p_match_count" integer) RETURNS TABLE("id" "uuid", "session_id" "text", "role" "text", "content" "text", "similarity" double precision)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT
    ch.id,
    ch.session_id,
    ch.role,
    ch.content,
    (1 - (ch.embedding <=> p_query_embedding))::float AS similarity
  FROM public.conversation_history ch
  WHERE
        ch.user_id    =  p_user_id
    AND ch.session_id <> p_exclude_session
    AND ch.deleted_at IS NULL
    AND ch.embedding  IS NOT NULL
    AND (1 - (ch.embedding <=> p_query_embedding)) >= p_min_similarity
  ORDER BY ch.embedding <=> p_query_embedding ASC
  LIMIT p_match_count;
$$;


ALTER FUNCTION "public"."match_conversation_history"("p_query_embedding" "public"."vector", "p_user_id" "text", "p_exclude_session" "text", "p_min_similarity" double precision, "p_match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_session_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_user_id" "text") RETURNS TABLE("id" "uuid", "session_date" "date", "summary_text" "text", "emotional_tone" "text", "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    id, session_date, summary_text, emotional_tone,
    1 - (embedding <=> query_embedding) AS similarity
  FROM session_embeddings
  WHERE user_id = p_user_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;


ALTER FUNCTION "public"."match_session_memories"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."semantic_search_care_twin"("query_embedding" "public"."vector", "target_user_id" "uuid", "match_count" integer DEFAULT 5, "match_threshold" double precision DEFAULT 0.75) RETURNS TABLE("user_message" "text", "alvai_response" "text", "topics" "text"[], "arc_stage" "text", "similarity" double precision, "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select
    cte.user_message,
    cte.alvai_response,
    cte.topics,
    cte.arc_stage,
    1 - (cte.embedding <=> query_embedding) as similarity,
    cte.created_at
  from care_twin_embeddings cte
  where
    cte.user_id = target_user_id
    and 1 - (cte.embedding <=> query_embedding) > match_threshold
  order by cte.embedding <=> query_embedding
  limit match_count;
$$;


ALTER FUNCTION "public"."semantic_search_care_twin"("query_embedding" "public"."vector", "target_user_id" "uuid", "match_count" integer, "match_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_all_practitioner_scores"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE practitioners SET trust_score = calculate_practitioner_trust(id);
END;
$$;


ALTER FUNCTION "public"."update_all_practitioner_scores"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_all_product_scores"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE products SET trust_score = calculate_product_trust(id);
END;
$$;


ALTER FUNCTION "public"."update_all_product_scores"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."affiliate_clicks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" character varying(200),
    "destination" character varying(50),
    "source_page" character varying(500),
    "user_agent" "text",
    "clicked_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."affiliate_clicks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent11_syntheses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "query_hash" "text" NOT NULL,
    "query_text" "text",
    "study_count" integer,
    "overall_grade" "text",
    "confidence_score" double precision,
    "causal_chain" "text",
    "effect_direction" "text",
    "synthesis_text" "text",
    "pmids" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent11_syntheses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "page" "text",
    "query" "text",
    "target_type" "text",
    "target_id" "uuid",
    "referrer" "text",
    "user_agent" "text",
    "session_id" "text",
    "city" "text",
    "state" "text",
    "device" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."care_twin_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "tab_context" "text",
    "user_message" "text" NOT NULL,
    "alvai_response" "text",
    "arc_stage" "text",
    "emotional_tone" "text",
    "topics" "text"[],
    "embedding" "public"."vector"(1536),
    "employer_id" "text",
    "city" "text" DEFAULT 'new_orleans'::"text",
    "shift_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."care_twin_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."care_twin_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employer_id" "text",
    "city" "text" DEFAULT 'new_orleans'::"text",
    "pattern_type" "text",
    "pattern_label" "text",
    "confidence" numeric(5,2),
    "sample_size" integer,
    "time_window" "text",
    "finding" "text",
    "recommendation" "text",
    "grant_language" "text",
    "status" "text" DEFAULT 'detected'::"text",
    "reviewed_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."care_twin_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "state" character varying(5) NOT NULL,
    "population" integer,
    "health_score" numeric(4,1) DEFAULT 0,
    "practitioner_count" integer DEFAULT 0,
    "location_count" integer DEFAULT 0,
    "product_count" integer DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "aqi_avg" numeric(5,1),
    "walkability" integer,
    "food_access_score" numeric(4,1),
    "ripple_zone" integer DEFAULT 0,
    "launched_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."cities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(300),
    "type" character varying(100),
    "location_id" "uuid",
    "instructor" character varying(200),
    "schedule" character varying(300),
    "price" character varying(100),
    "source" character varying(50),
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinical_trials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nct_id" "text",
    "title" "text",
    "brief_title" "text",
    "status" "text",
    "phase" "text",
    "summary" "text",
    "location" "text",
    "enrollment" integer DEFAULT 0,
    "start_date" "text",
    "search_topic" "text",
    "url" "text",
    "source" "text" DEFAULT 'clinicaltrials_gov'::"text",
    "trust_score" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clinical_trials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "commitment_text" "text",
    "kept" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conditions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "slug" character varying(200) NOT NULL,
    "category" character varying(100),
    "description" "text",
    "prevalence" character varying(100),
    "practitioner_types" "text"[],
    "related_products" "text"[],
    "related_protocols" "text"[],
    "search_volume" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."conditions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "session_id" "text" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "conversation_history_content_check" CHECK (("length"("content") <= 32000)),
    CONSTRAINT "conversation_history_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."conversation_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "mode" "text" DEFAULT 'general'::"text",
    "messages" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "report_date" "date" NOT NULL,
    "total_practitioners" integer DEFAULT 0,
    "total_products" integer DEFAULT 0,
    "total_locations" integer DEFAULT 0,
    "total_youtube" integer DEFAULT 0,
    "total_reddit" integer DEFAULT 0,
    "total_studies" integer DEFAULT 0,
    "new_today" "jsonb",
    "scrape_results" "jsonb",
    "pages_generated" integer DEFAULT 0,
    "affiliate_clicks_today" integer DEFAULT 0,
    "errors_today" integer DEFAULT 0,
    "active_cities" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dr_felicia_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practitioner_id" "uuid",
    "review_status" character varying(50) DEFAULT 'pending'::character varying,
    "clinical_competency_score" integer,
    "approval_decision" boolean,
    "review_notes" "text" NOT NULL,
    "reviewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dr_felicia_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emotional_signals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "session_id" "text",
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "hopelessness" double precision DEFAULT 0,
    "manic_energy" double precision DEFAULT 0,
    "dissociation" double precision DEFAULT 0,
    "grief_intensity" double precision DEFAULT 0,
    "anxiety_load" double precision DEFAULT 0,
    "resilience" double precision DEFAULT 0,
    "attachment_style" "text",
    "window_of_tolerance" "text" DEFAULT 'within'::"text",
    "raw_biomarkers" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."emotional_signals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "category" "text",
    "city" "text",
    "source" "text",
    "url" "text",
    "search_query" "text",
    "event_date" "text",
    "venue" "text",
    "price" "text",
    "trust_score" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fda_adverse_events" (
    "id" bigint NOT NULL,
    "drug_name" "text",
    "reaction" "text",
    "count" integer,
    "source" "text" DEFAULT 'fda_faers'::"text",
    "fetched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fda_adverse_events" OWNER TO "postgres";


ALTER TABLE "public"."fda_adverse_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."fda_adverse_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fda_data" (
    "id" bigint NOT NULL,
    "drug_name" "text",
    "brand_name" "text",
    "warnings" "text",
    "interactions" "text",
    "adverse_reactions" "text",
    "indications" "text",
    "source" "text" DEFAULT 'openfda'::"text",
    "fetched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fda_data" OWNER TO "postgres";


ALTER TABLE "public"."fda_data" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."fda_data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."food_sources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(300),
    "type" character varying(50),
    "address" character varying(500),
    "city" character varying(100),
    "state" character varying(5),
    "season" character varying(100),
    "products" "text"[],
    "source" character varying(50),
    "source_id" character varying(200),
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."food_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_disclaimers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "version" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."legal_disclaimers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."life_stabilization_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "employer_id" "text",
    "score_date" "date" DEFAULT CURRENT_DATE,
    "sleep_score" numeric(5,2) DEFAULT 50,
    "stress_score" numeric(5,2) DEFAULT 50,
    "care_score" numeric(5,2) DEFAULT 50,
    "financial_score" numeric(5,2) DEFAULT 50,
    "engagement_score" numeric(5,2) DEFAULT 50,
    "lss" numeric(5,2) GENERATED ALWAYS AS (((((("sleep_score" * 0.25) + ("stress_score" * 0.25)) + ("care_score" * 0.20)) + ("financial_score" * 0.15)) + ("engagement_score" * 0.15))) STORED,
    "lss_delta" numeric(5,2) DEFAULT 0,
    "lss_trend" "text" DEFAULT 'stable'::"text",
    "total_sessions" integer DEFAULT 0,
    "sleep_queries" integer DEFAULT 0,
    "stress_queries" integer DEFAULT 0,
    "care_actions" integer DEFAULT 0,
    "financial_queries" integer DEFAULT 0,
    "days_active" integer DEFAULT 0,
    "arc_stage" "text" DEFAULT 'searching'::"text",
    "arc_stage_days" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."life_stabilization_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(300) NOT NULL,
    "type" character varying(100),
    "subtype" character varying(100),
    "address" character varying(500),
    "city" character varying(100),
    "state" character varying(5),
    "zip" character varying(10),
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "phone" character varying(20),
    "website" character varying(500),
    "avg_rating" numeric(3,2),
    "review_count" integer DEFAULT 0,
    "price_level" integer,
    "hours" "jsonb",
    "trust_score" numeric(4,1) DEFAULT 0,
    "bleu_certified" boolean DEFAULT false,
    "validation_status" character varying(20) DEFAULT 'pending'::character varying,
    "source" character varying(50) NOT NULL,
    "source_id" character varying(200),
    "source_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "description" "text",
    "photo_url" "text",
    "booking_url" "text",
    "services" "text"[],
    "bleu_review_count" integer DEFAULT 0,
    "bleu_avg_rating" numeric(3,2) DEFAULT 0
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_practitioners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practitioner_name" character varying(255) NOT NULL,
    "practitioner_email" character varying(255) NOT NULL,
    "practitioner_phone" character varying(50),
    "primary_specialty" character varying(255) NOT NULL,
    "credentials_summary" "text" NOT NULL,
    "experience_years" character varying(20),
    "practice_description" "text",
    "pricing_structure" "jsonb" DEFAULT '{}'::"jsonb",
    "onboarding_status" character varying(50) DEFAULT 'pending'::character varying,
    "dr_felicia_reviewed" boolean DEFAULT false,
    "marketplace_approved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketplace_practitioners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nola_providers" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "subcategory" "text" DEFAULT ''::"text",
    "address" "text" DEFAULT ''::"text",
    "phone" "text" DEFAULT ''::"text",
    "description" "text" DEFAULT ''::"text",
    "website" "text" DEFAULT ''::"text",
    "price_info" "text" DEFAULT ''::"text",
    "insurance_info" "text" DEFAULT ''::"text",
    "city" "text" DEFAULT 'New Orleans'::"text",
    "state" "text" DEFAULT 'LA'::"text",
    "latitude" double precision,
    "longitude" double precision,
    "verified" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."nola_providers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."nola_providers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."nola_providers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."nola_providers_id_seq" OWNED BY "public"."nola_providers"."id";



CREATE TABLE IF NOT EXISTS "public"."outcome_events" (
    "event_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "event_type" "text" NOT NULL,
    "protocol_name" "text",
    "source" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."outcome_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_log" (
    "id" bigint NOT NULL,
    "city" "text",
    "state" "text",
    "practitioners_found" integer DEFAULT 0,
    "cycle_index" integer,
    "ran_at" timestamp with time zone DEFAULT "now"(),
    "errors" "text"
);


ALTER TABLE "public"."pipeline_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pipeline_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pipeline_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pipeline_log_id_seq" OWNED BY "public"."pipeline_log"."id";



CREATE TABLE IF NOT EXISTS "public"."practitioner_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "practitioner_id" "uuid",
    "session_datetime" timestamp with time zone NOT NULL,
    "session_fee" numeric(10,2) NOT NULL,
    "booking_status" character varying(50) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."practitioner_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practitioners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "npi" character varying(20),
    "first_name" character varying(100),
    "last_name" character varying(100),
    "full_name" character varying(200) NOT NULL,
    "credential" character varying(100),
    "gender" character varying(10),
    "specialty" character varying(200),
    "taxonomy_code" character varying(20),
    "taxonomy_description" "text",
    "practice_name" character varying(300),
    "address_line1" character varying(300),
    "address_line2" character varying(200),
    "city" character varying(100),
    "state" character varying(5),
    "zip" character varying(10),
    "county" character varying(100),
    "phone" character varying(20),
    "fax" character varying(20),
    "email" character varying(200),
    "website" character varying(500),
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "accepting_patients" boolean DEFAULT true,
    "languages" "text"[],
    "conditions_treated" "text"[],
    "insurance_accepted" "text"[],
    "trust_score" numeric(4,1) DEFAULT 0,
    "bleu_certified" boolean DEFAULT false,
    "credentials_verified" boolean DEFAULT false,
    "license_verified" boolean DEFAULT false,
    "license_number" character varying(50),
    "license_state" character varying(5),
    "license_expiry" "date",
    "background_checked" boolean DEFAULT false,
    "review_count" integer DEFAULT 0,
    "avg_rating" numeric(3,2),
    "positive_outcome_rate" numeric(5,2),
    "validation_status" character varying(20) DEFAULT 'pending'::character varying,
    "validated_at" timestamp without time zone,
    "validated_by" character varying(100),
    "flag_reason" "text",
    "source" character varying(50) NOT NULL,
    "source_id" character varying(200),
    "source_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "slug" "text",
    "has_content" boolean,
    "bio" "text",
    "photo_url" "text",
    "booking_url" "text",
    "hours" "jsonb",
    "services" "text"[],
    "bleu_review_count" integer DEFAULT 0,
    "bleu_avg_rating" numeric(3,2) DEFAULT 0,
    "validated" boolean DEFAULT false,
    "validation_source" "text",
    "license_status" "text" DEFAULT 'unverified'::"text",
    "board_certified" boolean,
    "credential_tier" integer DEFAULT 0,
    "specialty_codes" "text"[],
    "accepts_insurance" boolean,
    "insurance_networks" "text"[],
    "telehealth" boolean DEFAULT false,
    "last_npi_check" timestamp with time zone,
    "data_quality_score" integer DEFAULT 0,
    "duplicate_of" bigint,
    "lat" double precision,
    "lng" double precision
);


ALTER TABLE "public"."practitioners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."predictive_signals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "stall_detected" boolean DEFAULT false,
    "streak_break" boolean DEFAULT false,
    "escalation_score" double precision DEFAULT 0,
    "csd_warning" boolean DEFAULT false,
    "recommended_intervention" "text",
    "signal_data" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."predictive_signals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_practitioner_links" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid",
    "practitioner_id" "uuid",
    "relationship" character varying(50),
    "source" character varying(50),
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_practitioner_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(300) NOT NULL,
    "brand" character varying(200),
    "sku" character varying(100),
    "upc" character varying(20),
    "asin" character varying(20),
    "category" character varying(100),
    "subcategory" character varying(100),
    "form" character varying(50),
    "serving_size" character varying(100),
    "servings_per_container" integer,
    "description" "text",
    "short_description" character varying(500),
    "image_url" "text",
    "ingredients" "text",
    "active_ingredients" "jsonb",
    "allergens" "text"[],
    "certifications" "text"[],
    "price" numeric(10,2),
    "price_per_serving" numeric(10,2),
    "price_amazon" numeric(10,2),
    "price_iherb" numeric(10,2),
    "price_walmart" numeric(10,2),
    "url_amazon" "text",
    "url_iherb" "text",
    "url_walmart" "text",
    "url_brand" "text",
    "affiliate_tag" character varying(50),
    "price_updated_at" timestamp without time zone,
    "trust_score" numeric(4,1) DEFAULT 0,
    "bleu_certified" boolean DEFAULT false,
    "lab_tested" boolean DEFAULT false,
    "third_party_verified" boolean DEFAULT false,
    "nsf_certified" boolean DEFAULT false,
    "usp_verified" boolean DEFAULT false,
    "evidence_level" character varying(20),
    "review_count" integer DEFAULT 0,
    "avg_rating" numeric(3,2),
    "amazon_rating" numeric(3,2),
    "amazon_reviews" integer DEFAULT 0,
    "iherb_rating" numeric(3,2),
    "iherb_reviews" integer DEFAULT 0,
    "reddit_sentiment" numeric(3,2),
    "reddit_mentions" integer DEFAULT 0,
    "youtube_mentions" integer DEFAULT 0,
    "fda_recall" boolean DEFAULT false,
    "fda_recall_reason" "text",
    "adverse_events" integer DEFAULT 0,
    "drug_interactions" "text"[],
    "contraindications" "text"[],
    "pregnancy_safe" character varying(20),
    "conditions" "text"[],
    "pubmed_studies" integer DEFAULT 0,
    "clinical_trials" integer DEFAULT 0,
    "dosage_range" character varying(100),
    "bioavailability" character varying(50),
    "recommended_by" "text"[],
    "part_of_protocols" "text"[],
    "source" character varying(50) NOT NULL,
    "source_id" character varying(200),
    "source_url" "text",
    "validation_status" character varying(20) DEFAULT 'pending'::character varying,
    "positive_outcome_rate" numeric(5,2),
    "price_currency" character varying(3) DEFAULT 'USD'::character varying,
    "dosage" character varying(200),
    "url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "shield_category" "text",
    "emoji" "text",
    "is_bleu_pick" boolean DEFAULT false,
    "bleu_review_count" integer DEFAULT 0,
    "bleu_avg_rating" numeric(3,2) DEFAULT 0
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "tier" "text" DEFAULT 'community'::"text",
    "bleu_score" integer DEFAULT 0,
    "streak_days" integer DEFAULT 0,
    "conversations_count" integer DEFAULT 0,
    "wellness_goals" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "affiliate_transactions" "jsonb" DEFAULT '[]'::"jsonb",
    "stamps" "jsonb" DEFAULT '[]'::"jsonb",
    "citizenship_status" character varying(50) DEFAULT 'traveler'::character varying,
    "city" "text",
    "neighborhood" "text",
    "ci_current" double precision,
    "ci_velocity" "text",
    "weight_lbs" numeric(5,2),
    "resting_hr" smallint,
    "hrv_ms" smallint,
    "sleep_hrs" numeric(3,1),
    "steps_daily" integer,
    "energy_score" smallint,
    "anxiety_score" smallint,
    "mood_score" smallint,
    "primary_goal" "text",
    "health_updated_at" timestamp with time zone,
    "bhi_score" smallint,
    "bhi_updated_at" timestamp with time zone,
    "cart_items" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."weight_lbs" IS 'User-entered body weight in pounds. Written by syncHealthToSupabase from the Passport manual entry form.';



COMMENT ON COLUMN "public"."profiles"."resting_hr" IS 'Resting heart rate in beats per minute. Realistic range 30-220; not enforced at DB layer.';



COMMENT ON COLUMN "public"."profiles"."hrv_ms" IS 'Heart rate variability in milliseconds (RMSSD). Realistic range 10-200; not enforced at DB layer.';



COMMENT ON COLUMN "public"."profiles"."sleep_hrs" IS 'Average nightly sleep duration in hours.';



COMMENT ON COLUMN "public"."profiles"."steps_daily" IS 'Average daily step count.';



COMMENT ON COLUMN "public"."profiles"."energy_score" IS 'User-rated energy level, 0-100 scale. Higher = more energy.';



COMMENT ON COLUMN "public"."profiles"."anxiety_score" IS 'User-rated anxiety level, 0-100 scale. Higher = more anxious.';



COMMENT ON COLUMN "public"."profiles"."mood_score" IS 'User-rated mood, 0-100 scale. Higher = better mood.';



COMMENT ON COLUMN "public"."profiles"."primary_goal" IS 'Free-form text describing the user''s current wellness goal.';



COMMENT ON COLUMN "public"."profiles"."health_updated_at" IS 'Set by syncHealthToSupabase on every manual save or device import.';



COMMENT ON COLUMN "public"."profiles"."bhi_score" IS 'BLEU Health Index — the single composite wellness score, 0-100 scale. Computed client-side as the clamped mean of the 9 dimension scores (Sleep, Mind, Movement, Nutrition, Social, Finance, Spirit, Recovery, ECS). Range not enforced at DB layer. Formula v1 is heuristic pending clinical review by Dr. Felicia Stoler.';



COMMENT ON COLUMN "public"."profiles"."bhi_updated_at" IS 'Set by renderDashboardBHI on every BHI computation. Telemetry signal for when a user''s tier last changed. ISO 8601 TIMESTAMPTZ.';



CREATE TABLE IF NOT EXISTS "public"."protocols" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(300) NOT NULL,
    "slug" character varying(300),
    "creator" character varying(200),
    "category" character varying(100),
    "description" "text",
    "steps" "jsonb",
    "products" "text"[],
    "duration" character varying(100),
    "difficulty" character varying(20),
    "trust_score" numeric(4,1) DEFAULT 0,
    "user_count" integer DEFAULT 0,
    "avg_improvement" numeric(5,2),
    "source" character varying(50),
    "source_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."protocols" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pubmed_studies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pmid" character varying(20) NOT NULL,
    "title" "text",
    "abstract" "text",
    "authors" "text"[],
    "journal" character varying(300),
    "published_date" "date",
    "doi" character varying(100),
    "study_type" character varying(50),
    "conditions" "text"[],
    "products_studied" "text"[],
    "outcome" character varying(20),
    "sample_size" integer,
    "evidence_level" character varying(20),
    "url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "query_term" "text",
    "fetched_at" timestamp with time zone DEFAULT "now"(),
    "pub_date" "text",
    "category" "text",
    "search_topic" "text"
);


ALTER TABLE "public"."pubmed_studies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."real_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "event_type" "text",
    "venue_name" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "latitude" numeric,
    "longitude" numeric,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "recurrence" "text",
    "price" "text",
    "registration_url" "text",
    "organizer" "text",
    "source" "text",
    "source_url" "text",
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."real_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reddit_mentions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "post_id" character varying(20),
    "subreddit" character varying(50),
    "title" "text",
    "body" "text",
    "author" character varying(50),
    "score" integer DEFAULT 0,
    "num_comments" integer DEFAULT 0,
    "url" "text",
    "products_mentioned" "text"[],
    "practitioners_mentioned" "text"[],
    "sentiment" numeric(3,2),
    "posted_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."reddit_mentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_type" character varying(20) NOT NULL,
    "entity_id" "uuid",
    "rating" numeric(3,2),
    "title" character varying(300),
    "body" "text",
    "author" character varying(200),
    "source" character varying(50) NOT NULL,
    "source_id" character varying(200),
    "source_url" "text",
    "sentiment" numeric(3,2),
    "verified_purchase" boolean DEFAULT false,
    "reported_outcome" "text",
    "posted_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."safety_checks" (
    "id" bigint NOT NULL,
    "substances" "text"[],
    "interaction_count" integer,
    "risk_level" "text",
    "max_severity" numeric,
    "checked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."safety_checks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."safety_checks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."safety_checks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."safety_checks_id_seq" OWNED BY "public"."safety_checks"."id";



CREATE TABLE IF NOT EXISTS "public"."scrape_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "source" character varying(50) NOT NULL,
    "records_found" integer DEFAULT 0,
    "records_saved" integer DEFAULT 0,
    "errors" integer DEFAULT 0,
    "duration_seconds" integer,
    "cities_scraped" "text"[],
    "notes" "text",
    "ran_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."scrape_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_pages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "url_path" character varying(500) NOT NULL,
    "page_type" character varying(50),
    "entity_id" "uuid",
    "title" character varying(300),
    "meta_description" character varying(200),
    "google_indexed" boolean DEFAULT false,
    "indexed_at" timestamp without time zone,
    "monthly_traffic" integer DEFAULT 0,
    "generated_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "city" "text",
    "state" "text",
    "condition" "text",
    "practitioner_npi" "text",
    "h1" "text",
    "views" integer DEFAULT 0,
    "status" "text" DEFAULT 'published'::"text",
    "content_json" "jsonb"
);


ALTER TABLE "public"."seo_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "session_date" "date",
    "summary_text" "text",
    "topics" "text"[],
    "conditions_mentioned" "text"[],
    "medications_mentioned" "text"[],
    "commitments_made" "text"[],
    "emotional_tone" "text",
    "embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."symptom_specialist_map" (
    "id" bigint NOT NULL,
    "symptom" "text" NOT NULL,
    "symptom_aliases" "text"[] DEFAULT '{}'::"text"[],
    "primary_specialist" "text" NOT NULL,
    "secondary_specialists" "text"[] DEFAULT '{}'::"text"[],
    "urgency_level" integer DEFAULT 1,
    "red_flags" "text"[] DEFAULT '{}'::"text"[],
    "description" "text",
    "shield" "text"
);


ALTER TABLE "public"."symptom_specialist_map" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."symptom_specialist_map_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."symptom_specialist_map_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."symptom_specialist_map_id_seq" OWNED BY "public"."symptom_specialist_map"."id";



CREATE TABLE IF NOT EXISTS "public"."user_arcs" (
    "user_id" "text" NOT NULL,
    "arc_name" "text",
    "progress_score" integer DEFAULT 0,
    "stall_flag" boolean DEFAULT false,
    "arc_signals" "text"[],
    "last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_arcs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_coherence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "pc_score" double precision,
    "bc_score" double precision,
    "ic_score" double precision,
    "nc_score" double precision,
    "ci_raw" double precision,
    "ci_adjusted" double precision,
    "ci_display" double precision,
    "velocity_3d" double precision,
    "velocity_7d" double precision,
    "velocity_class" "text",
    "al_proxy" double precision,
    "al_ceiling" double precision,
    "circadian_phase" "text",
    "isi_fusion_score" double precision,
    "isi_language_sample" "text",
    "bifurcation_proximity" boolean DEFAULT false,
    "confidence" double precision,
    "sessions_used" integer,
    "oura_connected" boolean DEFAULT false,
    "session_id" "text",
    "tab_context" "text",
    "city" "text",
    "neighborhood" "text",
    "last_purchase_date" "date",
    "protocol_name" "text",
    "reorder_target_date" "date"
);


ALTER TABLE "public"."user_coherence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "user_display_name" "text" DEFAULT 'Anonymous'::"text",
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "rating" integer,
    "title" "text",
    "body" "text",
    "helpful_count" integer DEFAULT 0,
    "verified_purchase" boolean DEFAULT false,
    "verified_visit" boolean DEFAULT false,
    "status" "text" DEFAULT 'published'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."user_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."validation_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_type" character varying(20),
    "entity_id" "uuid",
    "action" character varying(20),
    "notes" "text",
    "validated_by" character varying(100) DEFAULT 'bleu'::character varying,
    "validated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."validation_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workforce_signals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employer_id" "text" NOT NULL,
    "signal_date" "date" DEFAULT CURRENT_DATE,
    "signal_week" "text",
    "active_employees" integer DEFAULT 0,
    "total_sessions" integer DEFAULT 0,
    "avg_session_depth" numeric(5,2) DEFAULT 0,
    "pct_sleep" numeric(5,2) DEFAULT 0,
    "pct_stress" numeric(5,2) DEFAULT 0,
    "pct_mental_health" numeric(5,2) DEFAULT 0,
    "pct_nutrition" numeric(5,2) DEFAULT 0,
    "pct_recovery" numeric(5,2) DEFAULT 0,
    "pct_financial" numeric(5,2) DEFAULT 0,
    "pct_physical" numeric(5,2) DEFAULT 0,
    "pct_crisis" numeric(5,2) DEFAULT 0,
    "pct_searching" numeric(5,2) DEFAULT 0,
    "pct_optimizing" numeric(5,2) DEFAULT 0,
    "pct_thriving" numeric(5,2) DEFAULT 0,
    "avg_lss" numeric(5,2) DEFAULT 0,
    "lss_week_delta" numeric(5,2) DEFAULT 0,
    "lss_trend" "text" DEFAULT 'stable'::"text",
    "supplement_engagements" integer DEFAULT 0,
    "therapy_referrals" integer DEFAULT 0,
    "practitioner_searches" integer DEFAULT 0,
    "sleep_alert" boolean DEFAULT false,
    "stress_alert" boolean DEFAULT false,
    "crisis_alert" boolean DEFAULT false,
    "engagement_drop" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workforce_signals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."youtube_videos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "video_id" character varying(20) NOT NULL,
    "channel_name" character varying(200),
    "channel_id" character varying(30),
    "title" "text" NOT NULL,
    "description" "text",
    "published_at" timestamp without time zone,
    "view_count" bigint DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "duration" character varying(20),
    "transcript" "text",
    "products_mentioned" "jsonb",
    "protocols_extracted" "jsonb",
    "claims_made" "jsonb",
    "tags" "text"[],
    "seo_pages_generated" "text"[],
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "search_topic" "text"
);


ALTER TABLE "public"."youtube_videos" OWNER TO "postgres";


ALTER TABLE ONLY "public"."nola_providers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."nola_providers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pipeline_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pipeline_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."safety_checks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."safety_checks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."symptom_specialist_map" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."symptom_specialist_map_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."affiliate_clicks"
    ADD CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent11_syntheses"
    ADD CONSTRAINT "agent11_syntheses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_twin_embeddings"
    ADD CONSTRAINT "care_twin_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_twin_patterns"
    ADD CONSTRAINT "care_twin_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_name_state_key" UNIQUE ("name", "state");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinical_trials"
    ADD CONSTRAINT "clinical_trials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commitments"
    ADD CONSTRAINT "commitments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conditions"
    ADD CONSTRAINT "conditions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."conditions"
    ADD CONSTRAINT "conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conditions"
    ADD CONSTRAINT "conditions_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."conversation_history"
    ADD CONSTRAINT "conversation_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_report_date_key" UNIQUE ("report_date");



ALTER TABLE ONLY "public"."dr_felicia_reviews"
    ADD CONSTRAINT "dr_felicia_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emotional_signals"
    ADD CONSTRAINT "emotional_signals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fda_adverse_events"
    ADD CONSTRAINT "fda_adverse_events_drug_name_reaction_key" UNIQUE ("drug_name", "reaction");



ALTER TABLE ONLY "public"."fda_adverse_events"
    ADD CONSTRAINT "fda_adverse_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fda_data"
    ADD CONSTRAINT "fda_data_drug_name_brand_name_key" UNIQUE ("drug_name", "brand_name");



ALTER TABLE ONLY "public"."fda_data"
    ADD CONSTRAINT "fda_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."food_sources"
    ADD CONSTRAINT "food_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_disclaimers"
    ADD CONSTRAINT "legal_disclaimers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."life_stabilization_scores"
    ADD CONSTRAINT "life_stabilization_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_source_source_id_key" UNIQUE ("source", "source_id");



ALTER TABLE ONLY "public"."marketplace_practitioners"
    ADD CONSTRAINT "marketplace_practitioners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_practitioners"
    ADD CONSTRAINT "marketplace_practitioners_practitioner_email_key" UNIQUE ("practitioner_email");



ALTER TABLE ONLY "public"."nola_providers"
    ADD CONSTRAINT "nola_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outcome_events"
    ADD CONSTRAINT "outcome_events_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."pipeline_log"
    ADD CONSTRAINT "pipeline_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practitioner_bookings"
    ADD CONSTRAINT "practitioner_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practitioners"
    ADD CONSTRAINT "practitioners_npi_key" UNIQUE ("npi");



ALTER TABLE ONLY "public"."practitioners"
    ADD CONSTRAINT "practitioners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictive_signals"
    ADD CONSTRAINT "predictive_signals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_practitioner_links"
    ADD CONSTRAINT "product_practitioner_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_practitioner_links"
    ADD CONSTRAINT "product_practitioner_links_product_id_practitioner_id_key" UNIQUE ("product_id", "practitioner_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_source_source_id_key" UNIQUE ("source", "source_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protocols"
    ADD CONSTRAINT "protocols_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pubmed_studies"
    ADD CONSTRAINT "pubmed_studies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pubmed_studies"
    ADD CONSTRAINT "pubmed_studies_pmid_key" UNIQUE ("pmid");



ALTER TABLE ONLY "public"."real_events"
    ADD CONSTRAINT "real_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reddit_mentions"
    ADD CONSTRAINT "reddit_mentions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reddit_mentions"
    ADD CONSTRAINT "reddit_mentions_post_id_key" UNIQUE ("post_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_source_source_id_key" UNIQUE ("source", "source_id");



ALTER TABLE ONLY "public"."safety_checks"
    ADD CONSTRAINT "safety_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scrape_log"
    ADD CONSTRAINT "scrape_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_pages"
    ADD CONSTRAINT "seo_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_pages"
    ADD CONSTRAINT "seo_pages_url_path_key" UNIQUE ("url_path");



ALTER TABLE ONLY "public"."session_embeddings"
    ADD CONSTRAINT "session_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."symptom_specialist_map"
    ADD CONSTRAINT "symptom_specialist_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_arcs"
    ADD CONSTRAINT "user_arcs_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_coherence"
    ADD CONSTRAINT "user_coherence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_reviews"
    ADD CONSTRAINT "user_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."validation_log"
    ADD CONSTRAINT "validation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workforce_signals"
    ADD CONSTRAINT "workforce_signals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."youtube_videos"
    ADD CONSTRAINT "youtube_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."youtube_videos"
    ADD CONSTRAINT "youtube_videos_video_id_key" UNIQUE ("video_id");



CREATE INDEX "agent11_created_idx" ON "public"."agent11_syntheses" USING "btree" ("created_at" DESC);



CREATE INDEX "agent11_query_hash_idx" ON "public"."agent11_syntheses" USING "btree" ("query_hash");



CREATE INDEX "care_twin_embedding_idx" ON "public"."care_twin_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "care_twin_employer_idx" ON "public"."care_twin_embeddings" USING "btree" ("employer_id", "created_at" DESC);



CREATE INDEX "care_twin_user_idx" ON "public"."care_twin_embeddings" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "conversation_history_embedding_idx" ON "public"."conversation_history" USING "hnsw" ("embedding" "public"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



CREATE INDEX "conversation_history_user_id_idx" ON "public"."conversation_history" USING "btree" ("user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "conversation_history_user_session_time_idx" ON "public"."conversation_history" USING "btree" ("user_id", "session_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "emotional_signals_user_idx" ON "public"."emotional_signals" USING "btree" ("user_id", "recorded_at" DESC);



CREATE INDEX "idx_analytics_date" ON "public"."analytics_events" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_clicks_date" ON "public"."affiliate_clicks" USING "btree" ("clicked_at" DESC);



CREATE INDEX "idx_convos_user" ON "public"."conversations" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_fae_drug" ON "public"."fda_adverse_events" USING "btree" ("drug_name");



CREATE INDEX "idx_fda_drug" ON "public"."fda_data" USING "btree" ("drug_name");



CREATE INDEX "idx_loc_city" ON "public"."locations" USING "btree" ("city", "state");



CREATE INDEX "idx_loc_trust" ON "public"."locations" USING "btree" ("trust_score" DESC);



CREATE INDEX "idx_loc_type" ON "public"."locations" USING "btree" ("type");



CREATE INDEX "idx_nola_providers_category" ON "public"."nola_providers" USING "btree" ("category");



CREATE INDEX "idx_nola_providers_desc" ON "public"."nola_providers" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_nola_providers_name" ON "public"."nola_providers" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));



CREATE INDEX "idx_outcome_events_created_at" ON "public"."outcome_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_outcome_events_event_type" ON "public"."outcome_events" USING "btree" ("event_type");



CREATE INDEX "idx_outcome_events_user_id" ON "public"."outcome_events" USING "btree" ("user_id");



CREATE INDEX "idx_pm_conditions" ON "public"."pubmed_studies" USING "gin" ("conditions");



CREATE INDEX "idx_pm_products" ON "public"."pubmed_studies" USING "gin" ("products_studied");



CREATE INDEX "idx_prac_city" ON "public"."practitioners" USING "btree" ("city", "state");



CREATE INDEX "idx_prac_name" ON "public"."practitioners" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_prac_spec" ON "public"."practitioners" USING "btree" ("specialty");



CREATE INDEX "idx_prac_status" ON "public"."practitioners" USING "btree" ("validation_status");



CREATE INDEX "idx_prac_trust" ON "public"."practitioners" USING "btree" ("trust_score" DESC);



CREATE INDEX "idx_pract_nocontent" ON "public"."practitioners" USING "btree" ("has_content") WHERE ("has_content" IS NULL);



CREATE INDEX "idx_pract_slug" ON "public"."practitioners" USING "btree" ("slug");



CREATE INDEX "idx_practitioners_active" ON "public"."practitioners" USING "btree" ("is_active");



CREATE INDEX "idx_practitioners_city" ON "public"."practitioners" USING "btree" ("city");



CREATE INDEX "idx_practitioners_name_trgm" ON "public"."practitioners" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_practitioners_npi" ON "public"."practitioners" USING "btree" ("npi");



CREATE INDEX "idx_practitioners_state" ON "public"."practitioners" USING "btree" ("state");



CREATE INDEX "idx_practitioners_tier" ON "public"."practitioners" USING "btree" ("credential_tier" DESC);



CREATE INDEX "idx_practitioners_trust" ON "public"."practitioners" USING "btree" ("trust_score" DESC);



CREATE INDEX "idx_practitioners_validated" ON "public"."practitioners" USING "btree" ("validated");



CREATE INDEX "idx_prod_asin" ON "public"."products" USING "btree" ("asin") WHERE ("asin" IS NOT NULL);



CREATE INDEX "idx_prod_brand" ON "public"."products" USING "btree" ("brand");



CREATE INDEX "idx_prod_cat" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_prod_conditions" ON "public"."products" USING "gin" ("conditions");



CREATE INDEX "idx_prod_name" ON "public"."products" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_prod_trust" ON "public"."products" USING "btree" ("trust_score" DESC);



CREATE INDEX "idx_products_trust" ON "public"."products" USING "btree" ("trust_score" DESC);



CREATE INDEX "idx_pub_query" ON "public"."pubmed_studies" USING "btree" ("query_term");



CREATE INDEX "idx_reddit_score" ON "public"."reddit_mentions" USING "btree" ("score" DESC);



CREATE INDEX "idx_reddit_sub" ON "public"."reddit_mentions" USING "btree" ("subreddit");



CREATE INDEX "idx_rev_entity" ON "public"."reviews" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_reviews_rating" ON "public"."user_reviews" USING "btree" ("rating");



CREATE INDEX "idx_reviews_target" ON "public"."user_reviews" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_seo_city" ON "public"."seo_pages" USING "btree" ("city");



CREATE INDEX "idx_seo_cond" ON "public"."seo_pages" USING "btree" ("condition");



CREATE INDEX "idx_seo_created" ON "public"."seo_pages" USING "btree" ("created_at");



CREATE INDEX "idx_seo_status" ON "public"."seo_pages" USING "btree" ("status");



CREATE INDEX "idx_seo_type" ON "public"."seo_pages" USING "btree" ("page_type");



CREATE INDEX "idx_user_coherence_user_id" ON "public"."user_coherence" USING "btree" ("user_id", "recorded_at" DESC);



CREATE INDEX "idx_yt_channel" ON "public"."youtube_videos" USING "btree" ("channel_id");



CREATE INDEX "idx_yt_pub" ON "public"."youtube_videos" USING "btree" ("published_at" DESC);



CREATE INDEX "lss_employer_idx" ON "public"."life_stabilization_scores" USING "btree" ("employer_id", "score_date" DESC);



CREATE INDEX "lss_user_date_idx" ON "public"."life_stabilization_scores" USING "btree" ("user_id", "score_date" DESC);



CREATE INDEX "practitioners_lat_lng_idx" ON "public"."practitioners" USING "btree" ("lat", "lng") WHERE ("lat" IS NOT NULL);



CREATE INDEX "predictive_signals_user_idx" ON "public"."predictive_signals" USING "btree" ("user_id", "recorded_at" DESC);



CREATE INDEX "session_embeddings_embedding_idx" ON "public"."session_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "workforce_employer_date_idx" ON "public"."workforce_signals" USING "btree" ("employer_id", "signal_date" DESC);



CREATE OR REPLACE TRIGGER "conversation_history_set_updated_at" BEFORE UPDATE ON "public"."conversation_history" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_cities" BEFORE UPDATE ON "public"."cities" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_locations" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_practitioners" BEFORE UPDATE ON "public"."practitioners" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_products" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_protocols" BEFORE UPDATE ON "public"."protocols" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_seo_pages" BEFORE UPDATE ON "public"."seo_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_youtube_videos" BEFORE UPDATE ON "public"."youtube_videos" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dr_felicia_reviews"
    ADD CONSTRAINT "dr_felicia_reviews_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."marketplace_practitioners"("id");



ALTER TABLE ONLY "public"."practitioner_bookings"
    ADD CONSTRAINT "practitioner_bookings_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."marketplace_practitioners"("id");



ALTER TABLE ONLY "public"."product_practitioner_links"
    ADD CONSTRAINT "product_practitioner_links_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."practitioners"("id");



ALTER TABLE ONLY "public"."product_practitioner_links"
    ADD CONSTRAINT "product_practitioner_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



ALTER TABLE "public"."affiliate_clicks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow_all_fda_adverse_events" ON "public"."fda_adverse_events" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_fda_data" ON "public"."fda_data" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_scrape_log" ON "public"."scrape_log" USING (true) WITH CHECK (true);



ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anon_insert_embeddings" ON "public"."care_twin_embeddings" FOR INSERT WITH CHECK (true);



CREATE POLICY "anon_insert_lss" ON "public"."life_stabilization_scores" FOR INSERT WITH CHECK (true);



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


CREATE POLICY "service_role_all_outcome_events" ON "public"."outcome_events" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."user_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "users_own_embeddings" ON "public"."care_twin_embeddings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_own_lss" ON "public"."life_stabilization_scores" USING (("auth"."uid"() = "user_id"));



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



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







