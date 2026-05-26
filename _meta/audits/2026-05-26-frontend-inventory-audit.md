# Front-end Inventory Audit — 2026-05-26 (read-only)

## File inventory
| File | LOC | Role |
|---|---|---|
| index.html | 1,309 | root / home sea |
| local.html | 1,733 | Local sea |
| supply.html | 1,409 | Supply sea |
| learn.html | 1,408 | Learn sea |
| support.html | 1,384 | Support sea |
| terms.html | 1 (minified) | ✅ real content (12 sections, 3,483 bytes) |
| privacy.html | 1 (minified) | ✅ real content (9 sections + founder note, 3,017 bytes) |
| js/bleu-prod-hooks.js | 841 | shared prod wiring (nav, stripe, auth) |
| sw.js | 6 | minimal service worker |
| dist/*.html | 335 files | generated SEO city pages |
| core/safety/*.js | 3 files | crisis validator + patterns (shared w/ server) |

No separate `css/` dir or `public/` dir — styles are inline in each HTML.

## Seven seas status
5 substantial sea pages (index/local/supply/learn/support) ~1.3–1.7k LOC each — implemented, not placeholders. (The "seven seas" naming in prod-hooks routes includes /, /local, /support, /learn, /supply + account/signin; "ECSIQ"/"Why BLEU" not found as standalone files 🔍.)

## JS module map
- `bleu-prod-hooks.js` is the single shared module (loaded `defer` on each sea): `sendPrompt`, `routeTo` (+`/signin`→magic-link intercept), `startStripeCheckout`, `authProvider`, `requestMagicLink`, verify-on-load, cart drawer, dead-surface watchdog. `AUTH_LIVE=true`.
- Each HTML also has an inline IIFE for page-local wiring (delegates to `window.*`).
- No bundler/build step; no external JS deps in-page except Stripe.js (loaded on demand).

## ⚠️ Findings
1. ~~`terms.html` + `privacy.html` are 1-line stubs.~~ **CORRECTION:** false alarm — both are **full, real legal pages minified onto one physical line** (`wc -l`=1 ≠ empty). terms = 12 sections, privacy = 9 + founder note. They DO need an accuracy/consistency review (terms says "18+ (or 13+ with parental consent)" — inconsistent for a paid health app; effective dates Feb 25 2026; refund window 30 days; mentions Patent Pending/CannaIQ/OCEAN) and ideally a licensed-attorney pass — but this is a 🟡 review item, not a 🔴 legal void.
2. **Styles fully inline per page** → palette/component drift across seas likely; no shared design-token file. (index has only 3 `@media` queries → **mobile responsiveness is thin**.)
3. **Accessibility:** index has 20 `aria-`, 9 `role=`, but **0 `alt=`** attributes — images (if any) lack alt text; partial ARIA.
4. **Performance:** large inline `<script>` + inline styles per page (no caching/minification); 335 static dist pages are fine (pre-rendered).
5. **sw.js is 6 lines** — minimal/possibly placeholder service worker; verify it isn't caching stale assets (could serve old prod-hooks.js after deploy). 🔍

## Top 5 front-end risks before Citizen #1 / Card B
1. Terms/Privacy exist but need an accuracy/attorney review (age inconsistency, dates, refund window) — NOT empty (corrected).
2. Thin mobile responsiveness (Card B traffic is phone-first — doorman scans).
3. Service worker caching stale JS after deploys (could mask the auth fixes).
4. Palette/component drift across the 5 seas (inline styles).
5. No alt text / partial a11y.
