# 05 — Revenue Audit

**Audit date:** 2026-05-21
**Constraint:** this audit has access to the codebase only. Stripe Dashboard, Plausible Dashboard, Fullscript Partner Portal, and Amazon Associates Dashboard are external and were **not** accessed. Where a number is required and the dashboard is the only source of truth, this audit says so explicitly.

---

## What the code permits

bleu.live has **four wired commerce paths**, classified by who collects the money and who pays the commission:

| Path | Money to | Commission to bleu.live | Tracking in repo |
|---|---|---|---|
| Stripe subscriptions (4 protocols + PRO) | Fleur De BleuDream LLC (direct) | n/a — direct revenue | webhook event → `profiles.active_protocol`, `stripe_customer_id` |
| Fullscript link-out (`fstoler` ID) | Fullscript (with practitioner credit to Dr. Stoler) | per Fullscript practitioner contract | Plausible `fullscript_click` event only; no postback |
| Amazon Associates affiliate (`bleulive20-20`) | Amazon | per Amazon Associates contract | Plausible only; no postback |
| BetterHelp / Brightside / ClassPass / Oura / Cost Plus Drugs / GoodRx etc. | the partner | per partner contract | `clicks` table writes (`server.js:1391 /api/track`) |

---

## Stripe — the only direct revenue line

### Products in code
```
price_1TEKQmK4cATmIFbokmkYg47S → sleep_reset       $49/mo
price_1TEKS6K4cATmIFbo1OW7BeCW → stress_reset      $45/mo
price_1TEKSWK4cATmIFbojDTEJng9 → longevity_core    $69/mo   [BROKEN]
price_1TEKSsK4cATmIFbouxOBHtwQ → gut_reset         $55/mo
price_1TBPtAK4cATmIFboFVb9m0QN → pro                $9.99/mo
```

### Critical revenue leak
**server.js:1805 maps the wrong price ID for Longevity Core.** Frontend sends `price_1TEKSWK4...`; webhook PROTOCOL_MAP has `price_1TEKSWK...` (missing the `4`). Every Longevity Core subscription succeeds in Stripe but gets `active_protocol = 'pro'` in `profiles` (via the `|| 'pro'` fallback at `server.js:1819`). The user pays $69/mo and the system records them as a $9.99/mo PRO subscriber.

**Downstream effects:**
- Per-protocol revenue reporting from `profiles.active_protocol` is wrong for every Longevity customer.
- If anyone gates content by `active_protocol = 'longevity_core'`, Longevity customers cannot access it. (Today, no gating exists, so this consequence is theoretical.)
- Cohort analysis that joins Stripe → `profiles` will misattribute revenue.

**Fix:** one character. Then back-fill any `profiles` row where Stripe shows a Longevity subscription but `active_protocol = 'pro'`.

### Other Stripe gaps
- **No idempotency check on webhook.** Stripe retries on 5xx; this could double-grant.
- **Signature verification conditional** — if env vars missing, anyone can POST a fake `checkout.session.completed`.
- **No handler for `customer.subscription.deleted`** — cancellations leave `active_protocol` set forever.
- **No handler for `invoice.payment_failed`** — payment retries from Stripe Smart Retries are invisible to the platform.
- **No handler for `customer.subscription.updated`** — protocol changes (e.g., user upgrades from Sleep to Longevity) leave the *original* protocol still active.
- **Lookup-by-email fallback** (when `client_reference_id` is missing) PATCHes `profiles?email=eq.<email>` — **but no `email` column is documented** on `profiles`. If the column doesn't exist, the email-fallback fails silently (the PATCH 400's, gets caught at `server.js:1879`). For anonymous-checkout-to-protocol-attribution, this matters.

---

## Pioneer / Citizenship — what it is and isn't

**Pioneer Founding Citizen** is granted via the `startStripeCheckout` button (`index.html:12241`) which:
1. Sets `profiles.citizenship_status = 'citizen'`, `citizen_tier = 'pioneer_founding'`, `citizen_since = now()`, `fee_waived = true`.
2. **Does not call Stripe.** This is the "free 12-month founding citizen" grant.

**Backend enforcement:** zero. No server endpoint checks `citizenship_status`. It is a frontend display flag. Per `docs/bleu-system-state.md` §7, "Pioneer status is a database flag with light UI gating … Enforced on the backend: zero times."

**Pioneer count fetch:** `index.html:3671` selects `count` from `profiles` where `citizenship_status = 'citizen'` and displays in hero. **This is the only place Pioneer status is read.**

**12-month aging:** no code clears `fee_waived` after 12 months. The "founding" period never expires programmatically. Marketing copy promises something the code does not implement.

---

## Direct revenue to date

**UNKNOWN — not in the repo.** This is the single number the platform most needs to know.

Honest answer template the audit can support:
- If Stripe Dashboard shows ≤ 10 active paid subscribers: the protocols are pre-revenue. The marketing infrastructure exists; the funnel converts at a rate too low to measure.
- If 10–100: early traction; revenue is real but small. Cohort analytics become meaningful.
- If 100+: a separate revenue dashboard becomes necessary; ad-hoc Stripe queries no longer scale.

**Action:** populate `_meta/audit/2026-05-21/STRIPE_PULL.md` with output of:
- Stripe → Customers → total count, all-time
- Stripe → Subscriptions → active count per `price_id`
- Stripe → Payouts → year-to-date gross
- Stripe → Disputes / Refunds → year-to-date

---

## Fullscript revenue

**UNKNOWN.** Repo has no API integration; cannot count clicks → conversions.

What the repo knows:
- Practitioner ID `fstoler` is the affiliation
- Daily Foundation Protocol shipped recently (commit `2e77f0f`)
- 30+ deep links in `index.html` point at Fullscript named plans
- Plausible event `fullscript_click` fires per `index.html:12912`

What the repo does not know:
- How many clicks per month
- How many conversions per month
- Commission rate (set by Fullscript)
- Gross commission to date

**Action:** Fullscript Partner Portal → Practitioner Stoler → Reports.

---

## Amazon affiliate revenue

**UNKNOWN.** Repo has no postback integration; commissions are reported only in Amazon Associates Dashboard.

What the repo knows:
- Tag `bleulive20-20` embedded in frontend product links
- Tag `bleu-live-20` written into `products.affiliate_tag` by `engine.py:39` default
- Two different tags in use — verify both are owned by the same Associates account, otherwise commission is split.

**Action:** Amazon Associates → Reports → Earnings.

---

## Other affiliate partners

The `clicks` table writes every `/api/track` redirect (`server.js:1391`). Partners surfaced in the system prompt or UI:

| Partner | Mention frequency in prompts | Tracked in clicks |
|---|---|---|
| BetterHelp (`betterhelp.com/bleu`) | high — therapy default | yes |
| Brightside, Done, Cerebral, Talkspace | medium | yes |
| ClassPass, Headspace, Calm | medium | yes |
| Oura Ring | medium | yes |
| Cost Plus Drugs, GoodRx | medium (finance / Rx) | yes |
| Charlotte's Web, Extract Labs (CBD) | medium | yes |
| Leafly, Dutchie (cannabis) | medium | yes |
| Cronometer, AG1 | low | yes |

`clicks` row schema: `{partner, source_tab, product_or_service, session_id, city, timestamp}`. **Fire-and-forget — nothing in this repo reads it back.** Click → conversion attribution requires querying Supabase ad hoc. There is no dashboard.

---

## Attribution: can we trace revenue back to an ALVAI conversation?

**Partially.**

- Stripe webhook receives `client_reference_id` (set by `index.html:12280 startPaidCheckout`) — this is the Supabase `currentUser.id` if logged in.
- `clicks` table stores `session_id`.
- `conversation_history` stores `session_id` and `user_id`.
- So in principle, a join `conversation_history` × `clicks` × `profiles` (via `stripe_customer_id`) × Stripe could trace "what ALVAI conversation led to which paid sub."

**In practice:**
- The join is ad hoc; no view exists.
- Anonymous → authenticated identity stitching just shipped (wire 1, `f70426a`); pre-wire conversations are stranded under `conversation_id` and cannot be joined to a user that logged in afterward.
- Most users don't log in before clicking BetterHelp / Amazon — those clicks are forever anonymous.
- No multi-touch attribution; only last-touch via `clicks.source_tab`.

---

## Cart funnel

**The cart is a Vessel-tab feature** for stacking supplements before redirecting to Amazon or Fullscript (commits `c2f5919`, `5ea29b8`, `338762c`, `789c86b`).

Stages, ordered:
1. Add to cart (`vsAddToStack`) → `stack_add` Plausible event + localStorage `bleu_cart`
2. Cart drawer open (`cart_open` Plausible event)
3. Safety intercept (CLEAR / CAUTION / FLAG) per commit `338762c`
4. Redirect to Amazon (with `bleulive20-20` tag) or Fullscript

**What's measured:** 1, 2, and 4 (via Plausible).
**What's not measured:** drop-off between 1 and 2; drop-off between 2 and 4; whether the click converted at Amazon / Fullscript.

There is no funnel report. There is no cohort. There is no "conversion rate per surface." The audit cannot supply these numbers because the code doesn't produce them. The only way is the Plausible dashboard, which itself shows clicks, not conversions.

---

## Refunds / chargebacks / churn

**UNKNOWN.** No code handles `charge.refunded`, `charge.dispute.created`, or any churn telemetry. Stripe Dashboard is the only source.

---

## B2B / institutional revenue

**Pre-revenue.** No enterprise endpoint, no contract management, no SaaS license seat enforcement, no admin invitation flow. The `enterprise` tab in `index.html:10077` is a marketing surface — no operating system behind it.

---

## Honest revenue picture

Without Stripe/Plausible dashboard data:
- **Direct revenue (Stripe): UNKNOWN but likely small.** The Longevity protocol bug means even reported numbers in `profiles.active_protocol` are wrong. No churn handling means MRR figures from `profiles` will overstate (cancelled subs still show as active).
- **Affiliate revenue (Fullscript + Amazon + others): UNKNOWN.** Tracked clicks exist; conversions are off-platform.
- **B2B: $0.** No infrastructure.
- **Attribution: weak.** Anonymous click majority. The wire-1 anon→auth merge improves this prospectively but does not back-fill.

If this audit must produce **one number for a grant reviewer**, it can only honestly say: **"Total revenue to date — pull from Stripe, Fullscript, Amazon dashboards. The code does not aggregate it."**

---

## Revenue priority list

1. **Fix Stripe Longevity Core bug** (1 character). Back-fill affected rows.
2. **Add Stripe webhook idempotency** and **fail-closed signature verification.**
3. **Handle `customer.subscription.deleted` / `updated` / `invoice.payment_failed`.**
4. **Build a simple revenue view** — daily Stripe pull (cron job) → `revenue_daily` table → admin page. Two days of work.
5. **Unify Amazon affiliate tag** (`bleulive20-20` vs `bleu-live-20`).
6. **Wire the `clicks` table to a funnel view** — at minimum, partner × week aggregation.
7. **Document a "what we don't know" page** — for grant applications, be explicit that affiliate-conversion attribution requires partner dashboards.
8. **Implement 12-month Pioneer expiry** (or remove the "founding citizen 12 months free" marketing claim).
