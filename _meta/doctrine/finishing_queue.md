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

## Missions 4.1, 4.2, 4.3 — SHIPPED 2026-05-24
- 4.1 Open Window tables (f01e874), 4.2 Receptivity-Stability gate (866a560),
  4.3 ECSIQ regulatory floor + Use/Reset (f01e874). All live + smoke-verified.

## detectCrisis() ↔ scoreStability suicidality-regex audit (Tier 3)
- status: open
- owner: Dr. Felicia (clinical decision) + CC (implementation)
- target: next session
- notes: VERIFIED that detectCrisis() (core/safety/crisis_validator.js, fires
  the 988 banner) does NOT catch passive ideation like "I cannot keep living
  like this" or "I cannot do this anymore". Mission 4.2's scoreStability
  suicidality regex catches them for the commerce gate, but the 988 CRISIS
  BANNER still won't fire for those phrasings. Audit the two word lists:
  either merge into one canonical list, or formally separate with each
  documenting what it catches that the other misses. HIGH priority — this is
  the 988 banner for passive suicidal ideation.

## scoreStability calibration for emotional overwhelm (Tier 2/3)
- status: open
- owner: Dr. Felicia (clinical) + CC (implementation)
- target: next session / 2.4.5
- notes: Mission 5.0 Scenario 1 ("I just lost my job and I cannot sleep,
  everything feels like too much") scored state=not_open (s=0.7, only the
  sleep_loss -0.3 penalty fired) and rendered a Sleep Reset card. The
  emotional-overwhelm / acute-loss signals ("everything feels like too much",
  "lost my job") are not in any stability penalty list, so a distressed 2 AM
  person can still see commerce. Dr. Felicia to decide whether overwhelm /
  acute-loss phrasings should reduce stability below the 0.4 commerce
  threshold. Do NOT auto-tune — clinical threshold decision.

## Mission 5.0 — full-system smoke + final evidence
- status: shipped 2026-05-24 — six scenarios run, audit-parity fix landed
- owner: CC
- target: done

## Kill switch — fail-closed config option
- status: open (future)
- owner: Bleu
- target: when BLEU has 100+ paying Citizens
- notes: currently fail-open (a DB read error does not block checkout).
  Revisit fail-closed as a config option, not a code change, once a quiet
  503 is preferable to one bad checkout.

Last reconciled: 2026-05-24 against main tip 800f782
