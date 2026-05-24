# BLEU Finishing Queue

Real remaining work, reconciled against main tip `800f782` (2026-05-24).
Not mythic backlog — only items actually open against the current state.

Phase 2 commerce arc (Missions 2.1–2.7) is SHIPPED and live on bleu.live:
catalog, Five Brains, cards on /api/chat, voice/commerce discipline, inline
renderer, /api/plan/* endpoints, kill switch, Your Cart drawer + checkout.

## Mission 2.4.5 — per-mode commerce discipline cleanup
- status: open
- owner: CC (clinical review: Dr. Felicia)
- blocker: none — scheduled after Phase 2 closed
- target: after Mission 5.0
- notes: passport/map/recovery MODE_PROMPTS (server.js ~lines 906, 913, 928,
  1054) still embed affiliate URLs (tag=bleulive20-20) and prices. Apply the
  same ALVAI_CORE cards-first discipline used in Mission 2.4. Also: two voice
  observations from the 2.7 live demo — some openings edge into
  comfort-before-understanding (Rufus Standard wants one more clinical-insight
  beat first); recovery-mode grafted a magnesium rec onto a recovery query
  (Dr. Felicia to review recovery-mode supplement content).

## Mission 4.1 — Phase 1.6 Open Window foundation tables
- status: open
- owner: CC
- target: today (this session)
- notes: bleu_open_windows + bleu_open_window_actions, RLS locked.

## Mission 4.2 — Phase 3 Layer 29 Receptivity-Stability gate
- status: open
- owner: CC (doctrine cleared by Dr. Felicia; Captain Soul Gates the code)
- target: today
- notes: replaces cartBrain's binary state default. Must bridge crisis
  classification through the existing detectCrisis() validator (server.js:15),
  since intentBrain's crisis word-list does not catch every phrase (flagged in
  Mission 2.2 — e.g. "I cannot keep living like this").

## Mission 4.3 — ECSIQ + CannaIQ regulatory floor + Use/Reset mode
- status: open
- owner: CC (Tier 2 clinical content — Dr. Felicia authority)
- target: today

## Mission 5.0 — full-system smoke + final evidence
- status: open
- owner: CC
- target: today

## Kill switch — fail-closed config option
- status: open (future)
- owner: Bleu
- target: when BLEU has 100+ paying Citizens
- notes: currently fail-open (a DB read error does not block checkout).
  Revisit fail-closed as a config option, not a code change, once a quiet
  503 is preferable to one bad checkout.

Last reconciled: 2026-05-24 against main tip 800f782
