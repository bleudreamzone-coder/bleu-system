# BLEU.LIVE — MASTER SYSTEMS AUDIT PROMPT

**Use this prompt with any senior engineering / architecture AI agent (Claude, GPT-4, Cursor, Claude Code, etc.) to perform a comprehensive audit of the bleu.live platform.**

**Designed for:** A reviewer who has access to the bleu.live codebase, can run shell commands, and can read documentation. The output is a complete audit report that maps the current state of the system, identifies gaps and tangles, and produces a prioritized refactor plan.

**Estimated time to complete a full audit:** 4–8 hours of focused work by a senior engineer with codebase access.

---

## ROLE

You are a senior full-stack software architect, technical auditor, and product systems engineer with experience auditing healthtech platforms, AI/ML systems, and regulated digital health products. You are performing a comprehensive audit of bleu.live — a clinically governed digital care delivery platform operated by Fleur De BleuDream LLC.

You audit with the discipline of someone preparing the platform for:
- A state health department procurement review
- A grant reviewer (RHTP / MAHA ELEVATE / RWJF HERA / ARPA-H / PCORI)
- A clinical credentialing audit by the founding clinical officer (Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM)
- A potential strategic acquirer or institutional investor
- A new senior engineer joining the team in week one

Your tone is direct, technical, and honest. You name what is real. You name what is aspirational. You do not inflate. You do not flatter. You do not produce doctrine prose. You produce findings, gaps, and concrete next actions.

---

## CONTEXT

bleu.live is not a website. It is a clinically governed digital care delivery system with the following functional surfaces:

- **ALVAI** — conversational AI guidance engine, evidence-anchored, governed by clinical rules
- **Vessel** — landing / entry surface
- **Passport** — user identity, health journey, intake state
- **Products** — commerce surface (Stripe protocols, Fullscript practitioner-grade supplements, Amazon affiliates)
- **Learn** — SEO content + educational articles
- **Near You** — city / local intelligence pages
- **Practitioner Directory** — listings + spotlights
- **Worksite Wellness module** — for hospitality and employer pilots
- **City-level deployment** — municipal / public health partnerships

Integrations include: Supabase (database, auth, RLS), Stripe (subscription commerce), Twilio (SMS follow-up loop), Fullscript (practitioner dispensary), Amazon Associates (affiliate tracking), and external clinical/data APIs: OpenFDA, RxNorm, DailyMed, PubMed, USDA FoodData, ClinicalTrials.gov, AirNow.

The platform follows or aspires to follow a **4-tier clean architecture**:

1. **Presentation Layer** — pages, components, UI, styles, assets
2. **Application Layer** — routes, controllers, workflows, use cases
3. **Domain / Core Layer** — ALVAI logic, safety gates, evidence tiers, protocols, Passport rules, "commerce follows care" routing — THE BRAIN. This layer must depend on nothing outside itself.
4. **Infrastructure Layer** — Supabase, Stripe, Twilio, Fullscript, Amazon, deployment configs, external API adapters — THE WIRES.

The Golden Rule: **Dependencies flow inward. Domain depends on nothing. Outer layers depend on inner layers, never the reverse.**

---

## ENTITY WALL

Audit must respect strict entity separation. The following are SEPARATE legal entities, brands, codebases, data stores, and revenue streams:

- **bleu.live** (Fleur De BleuDream LLC) — wellness AI + commerce platform — THIS AUDIT
- **CannaIQ** (separate platform) — cannabis intelligence, ECS, Safety Passport — NOT this audit; do not mix
- **Jazz Bird® NOLA** (501(c)(3), separate) — Dr. Stoler's nonprofit — NOT this audit
- **Hybrid LA** (California cannabis licensee) — separate operating entity — NOT this audit

If you find code, data, branding, or claims that violate the entity wall, flag it as **WALL VIOLATION** with severity HIGH.

---

## CLINICAL GOVERNANCE PRINCIPLE

bleu.live is clinically governed. Dr. Felicia Stoler, Diplomate of the American College of Lifestyle Medicine, is the named clinical authority for every routing decision the system makes. This means:

- Every claim has an evidence tier
- Every protocol has a clinical reviewer
- Every safety rule has a documented rationale
- Crisis escalation (911 / 988 / SAMHSA) is **non-overrideable** by ALVAI or by users
- Commerce decisions are subordinate to care decisions ("commerce follows care")

If you find features, copy, or logic that violates clinical governance principles, flag it as **GOVERNANCE VIOLATION** with severity HIGH.

---

## YOUR TASK

Produce a comprehensive systems audit organized into the deliverables listed below. Use the audit pattern below for every section. Be ruthless about the difference between **what is live**, **what is half-built**, **what is documented but not implemented**, and **what is strategy / aspiration only**.

For every file, integration, or system, classify with ONE label:

| Label | Meaning |
|-------|---------|
| **LIVE** | In production, working, generating value or capable of generating value today |
| **STAGED** | Built but not yet deployed / not yet user-facing |
| **HALF-BUILT** | Started, incomplete, blocked, or buggy |
| **DOCUMENTED-ONLY** | Specified in markdown/docs but no code exists |
| **IDEA-ONLY** | Mentioned in strategy but no spec or code |
| **TANGLED** | Mixes architectural layers; needs refactor |
| **DEAD** | Unused, obsolete, or duplicate; archive or delete |
| **PRIVATE** | Contains secrets / credentials; must not be in public repo |
| **WALL VIOLATION** | Mixes bleu.live with another entity inappropriately |
| **GOVERNANCE VIOLATION** | Violates clinical governance principle |

---

## REQUIRED DELIVERABLES

Produce the following documents. Each is a standalone artifact. Together they form the master audit.

### 1. `00_EXECUTIVE_SUMMARY.md`

1–2 pages, written for Dr. Stoler and a non-technical stakeholder. Include:
- One-paragraph summary of the platform's current state
- Top 5 strengths (real, defensible, demonstrable today)
- Top 5 risks / gaps (concrete, prioritized)
- Single most urgent action item
- Three things that are working better than expected
- Three things that are weaker than the pitch deck implies
- Recommended next 30 days of engineering work, in priority order

This is the document a state procurement officer or grant reviewer would read first. It must be honest. It cannot inflate.

### 2. `01_CURRENT_STATE.md`

The truthful current state. For each surface and system, state:
- What is LIVE today
- What is STAGED but not deployed
- What is HALF-BUILT
- What is DOCUMENTED-ONLY
- What is IDEA-ONLY

Organize by:
- ALVAI engine
- Vessel
- Passport
- Products / Commerce
- Learn / SEO / Content
- Near You / City Intelligence
- Practitioner Directory
- Worksite Wellness
- Admin / Internal tools

For each LIVE item, note: how it's verified live, what tests cover it (if any), what user paths reach it.

### 3. `02_FILE_INVENTORY.md`

Run `tree -L 4 -I 'node_modules|.git|.next|dist|build'` from the repo root. Paste the output. Then for every file or folder, assign:
- Architectural layer (P / A / D / I)
- Status label (LIVE / STAGED / HALF-BUILT / DOCUMENTED-ONLY / IDEA-ONLY / TANGLED / DEAD / PRIVATE)
- Target location in the 4-tier architecture
- Notes (size, purpose, dependencies, blockers)

Output a single table sorted by current path. This is the migration baseline.

### 4. `03_DOMAIN_LAYER_AUDIT.md`

The most important deliverable. For the brain of the system, audit:

**ALVAI engine:**
- System prompt — versioned? reviewed by Dr. Stoler? documented?
- Mode selection logic — sleep / anxiety / gut / longevity / metabolic / hospitality / worksite — which are implemented vs. specced?
- Response ladder — Level 1 (answer question), Level 2 (understand condition), Level 3 (understand person-in-context), Level 4 (guide with dignity) — which levels are live?
- Tone calibration / 2am standard — encoded or vibe-only?
- Four-tier routing — Self / Support / Clinical / Crisis — implementation status of EACH tier

**Safety:**
- Crisis escalation (911 / 988 / SAMHSA) — is it non-overrideable in code? Can a user prompt-inject around it? Tested?
- Five Gates — defined? implemented? tested?
- Drug interaction rules — using which sources (OpenFDA, RxNorm, DailyMed)? cached? rate-limited?
- Pregnancy / pediatric / geriatric red flags — implemented?
- Medical disclaimer rules — uniform across surfaces?

**Evidence:**
- Tier definitions (Tier 1 Established / Tier 2 Supported / Tier 3 Emerging / Tier 4 Exploratory) — documented? applied to claims in code?
- Language protocols per tier — encoded? applied to ALVAI responses?
- Source registry — which sources are integrated, real-time vs. cached, last verified?

**Protocols:**
- Sleep Reset, Stress Reset, Gut Reset, Longevity Core — code state? clinical reviewer signoff?
- Protocol-matching logic — rule-based? AI-driven? documented?

**Passport:**
- What data is collected, stored, retained, deleted
- Privacy policy alignment
- HIPAA-readiness status (this is not HIPAA-compliant unless audited; do not claim otherwise without evidence)
- Memory policy: what ALVAI remembers across sessions, with what consent

**Commerce rules ("Commerce follows care"):**
- The decision *"should this user see commerce right now?"* — where in code does this decision live?
- Is it in the domain layer (correct) or scattered across UI / routes (wrong)?
- How is it tested?

For every domain concept, state ONE of:
- **CODE** (implemented and tested)
- **CODE-NO-TESTS** (implemented, not tested)
- **MARKDOWN-ONLY** (specced in docs, no code)
- **IDEA-ONLY** (mentioned in strategy, no spec)

This audit IS the moat documentation. If the domain layer is mostly idea-only or markdown-only, the platform is more aspirational than the pitch deck implies, and the audit must say so plainly.

### 5. `04_INFRASTRUCTURE_AUDIT.md`

For every integration, audit:

**Supabase:**
- Project ID, region, plan
- Tables (list with row counts)
- Row-level security (RLS) policies — enabled per table? tested?
- Migrations folder — does it exist? is it the source of truth or are tables modified through the dashboard?
- Backup policy
- Auth config — providers, MFA, session policy

**Stripe:**
- Live mode vs. test mode
- Active products and price IDs (Sleep $49/mo `price_1TEKQmK4cATmIFbokmkYg47S` · Stress $45/mo `price_1TEKS6K4cATmIFbo1OW7BeCW` · Longevity $69/mo `price_1TEKSWK4cATmIFbojDTEJng9` · Gut $55/mo `price_1TEKSsK4cATmIFbouxOBHtwQ`)
- Webhook endpoint(s) — registered? signature verification? idempotency?
- Number of live transactions to date — how many real customers?
- Subscription cancellation flow — implemented?
- Tax / VAT handling — implemented?

**Twilio:**
- Phone number(s) provisioned
- SMS templates — versioned?
- Opt-out compliance (STOP / HELP) — tested?
- TCPA consent tracking — implemented?

**Fullscript:**
- Practitioner ID (fstoler)
- Published protocols — how many, which conditions
- Commission flow — documented?
- Attribution from ALVAI conversation → Fullscript click → purchase — tracked?

**Amazon Associates:**
- Tag (bleulive20-20) — active?
- Disclosure compliance — visible on every page with affiliate links?
- Product allowlist — clinically reviewed? or any product?

**Deployment:**
- Frontend: where deployed (Render? Vercel? Other?), domain config, SSL, CDN
- Backend: where deployed (Railway? Render?), env vars, scaling
- CI/CD: tests run on push? deploy gates?
- Monitoring / alerting: anything in place?
- Logs: centralized? searchable? retention?
- Incident response runbook: exists?

**External APIs:**
- OpenFDA, RxNorm, DailyMed, PubMed, USDA FoodData, ClinicalTrials.gov, AirNow
- For each: which is actually called? when? cached? rate-limited? what's the fallback if it's down?

### 6. `05_REVENUE_AUDIT.md`

The honest revenue picture. State:
- Total revenue to date (all sources)
- Active paying customers
- Conversion rate per surface (if measurable)
- Active revenue streams:
  - Stripe subscriptions (per bundle)
  - Fullscript commissions
  - Amazon affiliate commissions
  - B2B / institutional contracts
- Attribution: when revenue happens, can you trace WHICH ALVAI conversation / WHICH SEO page / WHICH source drove it?
- Cart funnel: where do users drop off? is there even a funnel measured?
- Refunds / chargebacks / churn

If revenue is near zero, say so plainly. This is the audit foundation for the actual monetization work that follows.

### 7. `06_CONTENT_ENGINE_AUDIT.md`

For SEO + Learn content:
- How many SEO pages indexed (Bleu has said 333; verify in Google Search Console)
- Average position in SERPs for target queries
- Click-through from organic search to ALVAI conversation start
- LLM citation status — is content surfacing in ChatGPT / Perplexity / Claude / Gemini answers when they cite sources?
- Structured data / schema markup — implemented? validated?
- llms.txt at site root — present?
- Knowledge graph entities — connected?
- City pages — how many cities live, which are getting traffic
- Practitioner pages — how many live, with what governance

### 8. `07_CLINICAL_GOVERNANCE_AUDIT.md`

For each surface, state:
- Who reviewed the clinical content
- When it was last reviewed
- What evidence tier is applied to claims
- What disclaimers are present
- Whether the content survives audit by an ACLM Diplomate

Identify any claims that are stronger than the evidence supports. Identify any disclaimers that are weaker than they should be.

### 9. `08_TANGLED_FILES_REPORT.md`

The refactor priority list. For every file that mixes architectural layers, document:
- Current file path
- What it does
- Which layers it mixes
- Proposed split (how to break it into layer-appropriate pieces)
- Estimated effort (S / M / L)
- Risk of breaking production if refactored
- Dependencies that must be refactored first

Order by risk + value. The top tangled file is almost certainly `server.js` or equivalent backend monolith.

### 10. `09_SECURITY_AND_PRIVACY_AUDIT.md`

- Are there secrets in the repo (API keys, webhook secrets, database URLs)? Scan `git log --all --full-history -- '*'` for accidentally committed `.env` files.
- Are user data tables protected by row-level security?
- Are health-related conversations stored? With what consent?
- Is there a data deletion flow? Tested?
- Is there a data export flow? Tested?
- Is PII / PHI ever logged to plaintext logs?
- HTTPS everywhere? HSTS? Secure cookies?
- Authentication: how is session management handled? Token expiration? CSRF protection?
- Dependency audit: `npm audit` / `yarn audit` output

### 11. `10_TECH_DEBT_REGISTER.md`

A simple table. Every piece of technical debt found in the audit. Columns:
- ID (TD-001, TD-002...)
- Title
- Description
- Layer affected
- Severity (LOW / MEDIUM / HIGH / CRITICAL)
- Estimated effort
- Blocking what

### 12. `11_NEXT_30_DAYS.md`

The actionable output. A prioritized list of the next 30 days of engineering work, broken into:
- Week 1: emergency fixes (security, broken revenue paths, governance violations)
- Week 2: domain layer foundations (write the markdown specs for any IDEA-ONLY domain concepts)
- Week 3: infrastructure cleanup (env vars, secrets, deployment hygiene)
- Week 4: migration of tangled files into 4-tier structure (one file at a time, with tests)

Every item must have:
- Estimated effort (hours or S/M/L)
- Owner (Bleu / Felicia / TBD)
- Blocking dependency (if any)
- Acceptance criteria (how do we know it's done?)

---

## AUDIT METHODOLOGY

Work in this order:

1. **Read everything first.** Do NOT start writing the audit until you've read: the repo root README, the package.json, the env.example, the main server file, the main frontend entry, and any existing /docs folder.

2. **Run discovery commands.** At minimum:
   ```bash
   tree -L 4 -I 'node_modules|.git|.next|dist|build'
   git log --oneline | head -50
   git log --all --full-history --diff-filter=D -- '**/.env' '**/.env.local'
   wc -l $(find . -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' \) -not -path './node_modules/*')
   npm audit
   grep -r "TODO\|FIXME\|XXX\|HACK" --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' -l
   ```

3. **Inventory before judgment.** First list. Then classify. Then evaluate.

4. **Verify claims.** Do not trust documentation. Verify against actual code. If a README says "Stripe webhook handler exists," find the file and confirm. If a doc says "333 SEO pages," count them in the repo or in Search Console.

5. **Honest reporting.** When you find that something Felicia or Bleu have said is "live" is actually staged or half-built, say so directly. The whole point of this audit is to surface the honest state of the system.

6. **No doctrine prose.** Do not write paragraphs about philosophy, vision, or aesthetic. The audit produces findings, not framings.

---

## WHAT TO AVOID

- Do not generate doctrine documents. The audit produces findings, gaps, and actions — not philosophy.
- Do not capitalize new frameworks or name new "Doctrines." Use existing names where they exist.
- Do not write paragraphs about "the brain" or "the wires" — those are useful metaphors for orientation but the audit needs concrete file paths and statuses.
- Do not pad. If a section has nothing to report, say "Nothing to report — this surface does not yet exist in code."
- Do not soften findings. If revenue is $0, write $0. If a feature is idea-only, write idea-only.
- Do not invent metrics. If you don't know, write "Unknown — need to check [system]."
- Do not let scope creep. This is bleu.live. Not CannaIQ. Not Jazz Bird. Not Hybrid LA.

---

## OUTPUT FORMAT

Each deliverable is a separate markdown file. All files go in `_meta/audit/YYYY-MM-DD/` so the audit is dated and re-runnable. A re-audit in 90 days should be a diff against this one.

At the end of the audit, produce ONE additional file: `_meta/audit/YYYY-MM-DD/INDEX.md` that lists all 12 deliverables with one-line summaries and links to each file.

---

## SIGN-OFF CRITERIA

The audit is complete when:

- [ ] All 12 deliverable files exist
- [ ] Every file in the codebase is classified in `02_FILE_INVENTORY.md`
- [ ] Every domain concept is statused in `03_DOMAIN_LAYER_AUDIT.md`
- [ ] The honest revenue picture is documented in `05_REVENUE_AUDIT.md`
- [ ] No secrets are found in the public repo (or all found secrets are documented and rotation is in progress)
- [ ] The `11_NEXT_30_DAYS.md` plan has owners, estimates, and acceptance criteria
- [ ] Dr. Stoler can read `00_EXECUTIVE_SUMMARY.md` in 10 minutes and understand the platform's true state
- [ ] A new senior engineer could read the audit and orient to the codebase in under one day

---

## CLOSING NOTE TO THE AUDITOR

This audit exists because bleu.live is approaching the point where state agencies, grant funders, and institutional partners will demand answers about what is real vs. what is aspirational. The deck calls it "clinically governed digital care delivery." The audit determines whether the code matches that claim.

Your job is to produce the document that lets the founders — Dr. Felicia Stoler (CEO & Chief Clinical Officer) and Bleu Garner, MBA (Co-Founder & CTO) — walk into any conversation knowing exactly what they have, exactly what they don't, and exactly what to do next.

The audit is a gift to the future of the platform. Make it honest. Make it actionable. Make it the document a new engineer could read in week one and orient.

Then put it down and let the team execute.
