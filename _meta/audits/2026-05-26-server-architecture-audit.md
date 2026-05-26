# server.js Architecture Audit — 2026-05-26 (read-only)

**LOC: 4,162.** Single-file raw Node `http` server, no framework. Verified via grep/read.

## Section map (banner comments)
| Lines | Section |
|---|---|
| 1–217 | env/config, sendSMS, ALVAI_CORE prompt |
| 218–784 | BUD v5 / cannaiq intercept |
| 785–1130 | fallback + session-intent (commerce suppression) |
| 1131–1172 | `querySupabase` |
| 1173–1247 | audit helpers (hashEmail/hashPhone/logEvent/logDecision) |
| 1248–1302 | Trust Packet (buildTrustPacket/logTrustPacket) |
| 1303–1380 | Comms (sendEmail) |
| 1381–1458 | Auth (magic-link: sessionSecret/signSession/verifySession/parseCookies/getSessionCitizen/rate) |
| 1459–1536 | Day-7 outcome capture |
| 1537–1660 | Five Brains (intentBrain etc.) |
| 1662–2039 | additional brains / processing |
| 1869–2039 | memory helpers (conversation_history + pgvector) |
| 2040–2412 | routing, intent detection, enrichment, SEO engine |
| 2413–end | HTTP server + all route handlers + crisis regression harness |

## Findings
- **Helpers are well-factored** with consistent never-throws pattern (logEvent/logDecision/sendEmail/logTrustPacket all swallow + log). 67 try/catch blocks, 117 `json(res,...)` responses.
- **Only 2 TODO/FIXME** in 4,162 lines — low comment debt.
- **Error handling is consistent** on the new (Mission 6/7) code; the legacy enrichment/BUD sections (218–1130) are denser and less uniformly guarded — 🔍 not line-audited this pass.
- **`querySupabase` is the right seam** and now correct after the Day-80 `return=representation` fix.
- **Routing is a long if/else `pn===` chain** (~33 routes) in one function — works, but at ~1,700 lines the handler is the main refactor candidate.

## Refactor candidates (Day 81+, not urgent)
1. Extract helpers into `lib/` modules: `lib/supabase.js` (querySupabase), `lib/auth.js` (session+magic-link), `lib/comms.js` (sendEmail/sendSMS), `lib/audit.js` (logEvent/logDecision/logTrustPacket). ~600 LOC out of the monolith.
2. Split the route dispatcher into a small router table `{ 'METHOD /path': handler }`.
3. The BUD/cannaiq block (218–784, ~560 LOC) reads as a self-contained subsystem → own module.

## Top 5 risks if traffic 10×'s tomorrow
1. **No connection pooling / rate limiting** on the HTTP server — every request spawns fetches to Supabase REST; a burst could exhaust sockets.
2. **In-memory magic-link rate limiter** (`_magicLinkRate` Map) resets on restart and is per-instance — useless if Render scales to >1 instance.
3. **Ephemeral SESSION_SECRET fallback** — if `SESSION_SECRET` unset and Render runs multiple instances, cookies signed by one instance fail on another → random logouts.
4. **`/api/chat` enrichment fires many external APIs in parallel** per request — cost + latency cliff under load.
5. **No caching** on hot read endpoints (catalog, practitioners) → every hit is a Supabase round-trip.
