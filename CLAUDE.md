# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BLEU.LIVE** (Believe, Love, Evolve, Unite) — "The Longevity Operating System." An AI wellness intelligence platform powered by a persona called **Alvai**. The system provides personalized health guidance across 14 tab modes (general, dashboard, directory, vessel, map, protocols, learn, community, passport, therapy, recovery, cannaiq, missions, finance) with therapy and recovery sub-modes.

## Running the Application

```bash
node server.js          # Start the HTTP server (default port 8080)
python engine.py        # Run full data pipeline (10 sources)
python engine.py --source npi   # Run single data source
python engine.py --status       # Show database totals
```

There are no test, lint, or build commands configured. The project uses vanilla JS with no build step.

## Architecture

### Backend: `server.js`
Node.js HTTP server (~1000 lines). Key endpoints:
- `POST /api/chat` — single-turn AI chat (JSON)
- `POST /api/chat/stream` — streaming chat (SSE)
- `GET /api/practitioners` — practitioner lookup (855K+ NPI records in Supabase)
- `GET /api/safety-check` — drug interaction analysis (FDA + RxNorm)
- `GET /api/track` — affiliate click tracking with redirect
- `POST /stripe-webhook` — Stripe payment completion handler

Uses `querySupabase(table, query, limit, method, body)` helper for all Supabase REST API calls (service key auth via headers).

### Frontend: `index.html`
Single-page app (~12,500 lines), no framework. Vanilla JS with event delegation. Key functions:
- `ask(tab, query)` — send message to backend
- `goTab(name)` — switch tab view
- `vesselShowPicker(id)` / `_vShow(id)` — supplement comparison modals

### Edge Functions: `supabase/functions/`
- `alvai/index.ts` — Deno-based 20-agent architecture (v5.0) with 6 Super-Fields (Input, Intent, Simulation, Reality, Control, Output+Evolution)
- `stripe-checkout/index.ts` — payment processing

### Data Pipeline: `engine.py`
Python script pulling from 10 sources (NPI, FDA, Google Places, YouTube, Reddit, Amazon, PubMed, Open Food Facts, Yelp, iHerb). Runs 4x daily via GitHub Actions (`.github/workflows/beast.yml`).

### AI Model Routing
- **70%** → GPT-4o Mini (navigation, simple lookups)
- **25%** → GPT-4o (synthesis, emotion, finance)
- **5%** → Claude Opus (drug interactions, crisis, research)

Intent detection: mini queries (≤4 words) → GPT-4o-mini; deep patterns (protocol, anxiety) → GPT-4o; clinical patterns (CYP450, meta-analysis) → Claude.

## Supabase Tables
`practitioners`, `locations`, `sessions`, `clicks`, `pageviews`, `profiles` (Stripe integration with citizenship tiers and active protocols).

## Environment Variables
Required: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_PLACES_KEY`, `CLAUDE_API_KEY`, `AMAZON_PARTNER_TAG`

## Alvai Voice & Design Rules
- Emotional-first protocol: feel → validate → solve (never lead with product recommendations)
- Flowing prose style — no bullet points or dashes in AI responses
- Always specific: brand names, prices, addresses, phone numbers, links
- Always ends with a specific action step + personal follow-up question
- Crisis detection overrides everything — 988 Suicide Line, Crisis Text Line
- Never diagnose; always include therapist disclaimer
- Multi-option: always 3+ choices (budget, mid, premium)
- Color system: Gold (#C9A84C) default, Teal (#2D8A7A) calming, Purple (#A78BFA) learning, Green (#22C55E) wellness, Orange (#FB923C) recovery, Blue (#7EC8F7) sleep

## Deployment
Railway (Node.js 20 via Nixpacks). Config in `railway.json` and `nixpacks.toml`.
