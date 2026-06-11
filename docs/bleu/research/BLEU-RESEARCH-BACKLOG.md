# BLEU-RESEARCH-BACKLOG
## Open verification items · Owner · Gate
### June 11, 2026 · Nothing here blocks the wedge build unless marked GATE

| Item | Why | Owner | Gate |
|---|---|---|---|
| Exact CMS PFS rates (CCM/APCM/TCM/BHI/PIN/CHI, current year + locality) | no buyer-facing number without verification | Dr. Stoler | GATE before any external quote |
| HIPAA posture (BAA inventory: Supabase, Render, Twilio, OpenAI; PHI flow map) | required before any PHI badge or clinical SMS | Bleu + counsel | GATE before live PHI / SMS_ENABLED=true |
| Twilio toll-free verification status | blocks live sends | Bleu | GATE for SMS_ENABLED=true |
| TCPA/consent policy text for SMS opt-in | consent gate needs legal-grade language | Bleu + Dr. Stoler | GATE before live sends |
| Model tier decision (gpt-4o stack vs Claude tier vs role-split) | pickModel currently OpenAI-only; decide before tuning | Bleu | GATE before prompt tuning |
| Practitioner geocoding plan (485k rows, lat/lng NULL) | true per-row radius later; zip-set matching suffices now | Bleu/Codex | not blocking |
| Desert resource content (telehealth/FQHC/211/988/SAMHSA wording) | routing copy is clinical-adjacent | Dr. Stoler | GATE before desert copy ships |
| SLEEP clinical-completeness directive | staged, additive | Dr. Stoler | GATE — written sign-off |
| Reading-grade rewrite (Home/Local/Learn/Supply to 6th grade) | staged | Dr. Stoler voice review | GATE |
| City-page attribution regeneration (~6.5k pages, entity separation) | correction touching clinician name | Bleu executes, Felicia informed | reviewed job |
| FQHC/RHC care-management billing rules (post-Jan-2025 individual codes; CY26 proposals) | buyer-ladder accuracy | Dr. Stoler | before FQHC pitch |
| Medicaid Reentry §1115 — Louisiana status specifically | reentry pathway depends on LA posture | Bleu (Hutch/LED channel) | before reentry pilot framing |
| SBIR Phase Zero application package | Sept 5 R43/NIMH target; Phase Zero first | Bleu + Dr. Stoler (PI) | calendar-gated |
| GOOGLE_API_KEY + ANON-JWT rotation | lower-priority hygiene | Bleu | not blocking |
| Branch protection: required status check on green CI | Rulesets block force-push, not merge-over-red | Bleu (GitHub settings) | after Phase 6 CI fix |
| AGENTS.md §4 priority update post-summit | Lexapro demo priority expires with summit close | Bleu | doctrine edit, Bleu lane |
