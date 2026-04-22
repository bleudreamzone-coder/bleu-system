# Passport Function Inventory

Investigation of the 14 functions flagged in `docs/bleu-system-state.md` §8.5 as "referenced but not located in audit." All 14 are defined in the shipped `index.html` (13,378 lines). Source of every function below is `index.html`.

**Headline count: 14 Real / 0 Stub / 0 Missing.**

The prior audit missed every one — they exist, they have bodies, most of them already persist something somewhere. Block 1 is not a "build from scratch" task; it's a "wire together, harden, and close the write-path gaps" task. Exact gaps are in the Notes column.

## Inventory

| Function | Status | Line | Real / Stub / Missing | Writes to | Notes |
|---|---|---|---|---|---|
| `doSignUp` | Defined | 6889 | Real | Supabase Auth (`sbClient.auth.signUp`) | Async. Handles two flows: (a) session returned → set `currentUser`, call `showProfile()`; (b) email-confirm required → show message, switch UI to sign-in, prefill email. No direct `profiles` write on signup — that lands through `upsertProfile({})` inside `showProfile()`. |
| `doSignIn` | Defined | 6908 | Real | Supabase Auth (`sbClient.auth.signInWithPassword`) | One-liner. On success: `currentUser=data.user; showProfile()`. No separate `profiles` touch. |
| `toggleAuth` | Defined | 6888 | Real | DOM only | Flips `authMode` global and toggles display of `auth-signup` / `auth-signin` / `toggle-to-signin` / `toggle-to-signup`. 5 lines. |
| `showProfile` | Defined | 6935 | Real | Reads `profiles` (3 queries: cart_items+full_name+zip_code+bleu_score+streak_days; cellular_health_score; SELECT *); calls `upsertProfile({})` which writes `profiles` | Async. Hydrates localStorage cart/zip from `profiles`, welcomes user into Passport chat, fills dashboard CHS score + verdict, drives `stat-convos` / `stat-streak` / `stat-score`, restores `wellness_goals` chip state, calls `loadSessions()`. Also **wrapped** at `index.html:12397` during `activateCitizen()` — `window.showProfile` is monkey-patched one-shot to also fire `activateCitizen()` after the next call, then restored. |
| `showAuth` | Defined | 6934 | Real | DOM only | 2-line display toggle: `auth-screen` on, `profile-screen` off. |
| `saveManualHealthData` | Defined | 7336 | Real | localStorage (`bleu_health`) + `syncHealthToSupabase(hd)` | Reads fields `weight, rhr, hrv, sleep, steps, energy, anxiety, mood, meds, goal` from `hd-*` inputs. Saves merged object to localStorage, calls `syncHealthToSupabase` (async, fire-and-forget), calls `renderHealthData` + `updateBleScore`, hides the panel, toasts. The actual Supabase write path is inside `syncHealthToSupabase` — worth tracing during Block 1 to confirm what column/table it lands in. |
| `handleHealthFileImport` | Defined | 7695 | Real | localStorage (`bleu_health`) + `syncHealthToSupabase(merged)` | Reads FileReader text. Dispatches by extension: `.xml` → `parseAppleHealth`, `.json` → `parseOura`, `.csv` → `parseWellnessCSV`. Merges with existing localStorage, calls `syncHealthToSupabase`, toasts, hides import platforms panel. Sibling legacy function `handleHealthImport` at 7351 does nearly the same thing inline — possible dead duplicate worth flagging for cleanup. |
| `exportFHIR` | Defined | 9972 | Real | Nothing persistent — browser download only (plus `bleuSignal('fhir_export',...)` analytics) | Builds FHIR R4 Bundle: Patient resource with target_word / named_struggle / bleu_score / streak_days extensions, Observations (steps LOINC 55423-8, sleep 93832-4, HRV 80404-7), MedicationStatement per cart item, Goal per focus. Triggers `<a>.click()` download as `bleu-health-record-YYYY-MM-DD.fhir.json`. No server upload. |
| `startStripeCheckout` | Defined | 12241 | Real — **but name is misleading** | PATCH `profiles` via REST (`SUPABASE_URL/rest/v1/profiles?id=eq.{user_id}`) setting `citizenship_status:'citizen', citizen_tier:'pioneer_founding', citizen_since:<now>, fee_waived:true`; calls `upsertProfile()` | This does **not** call Stripe. It's a free "Pioneer Founding Citizen" grant path — clicks the upgrade button but writes a waived-fee citizen record directly. Requires logged-in user (redirects to passport tab otherwise). Re-reads `bleu_score` via `sbClient` afterward to re-animate the ring. |
| `startPaidCheckout` | Defined | 12280 | Real | Nothing directly — hands off to Stripe (`stripe.redirectToCheckout({lineItems,mode:'subscription',successUrl,cancelUrl,customerEmail})`) | This is the actual paid Stripe path. Profile promotion happens later server-side when Stripe posts to `/stripe-webhook` in `server.js`. Note: file has `successUrl` defined twice in the same object (lines 12287 and 12289) — the second wins; harmless but worth cleaning. Does not null-guard `currentUser` before reading `.email` even though the comment says "No login required" — crashes for anonymous users. |
| `toggleHealthPanel` | Defined | 7317 | Real | DOM only | 4-line toggle of `pp-health-panel` display. |
| `showManualEntry` | Defined | 7323 | Real | DOM + reads localStorage (`bleu_health`) | Toggles `pp-manual-form` visibility, pre-fills the 10 `hd-*` inputs from localStorage. |
| `toggleFocus` | Defined | 7393 | Real | localStorage (`bleu_focuses` array) | Toggles active class on a chip and keeps localStorage array in sync. No Supabase write — focus chips currently live only locally. This is likely one of the Block 1 gaps: focuses should probably flow into `profiles` or a dedicated `passport_focuses` column alongside `wellness_goals`. |
| `initPassport` | Defined | 7771 | Real | No direct write — orchestrator | Boots the Passport tab. Calls, in order: `renderAffStrip`, `renderCart`, `renderPaths`, `renderHealthData`, `loadSessions`, `renderProtocolCard`, `checkRetentionTriggers`, `checkPendingProtocol`, and optionally `checkAndShowSharePrompt`, `renderReferralStats`, `renderJourneyHeader`, `renderJourneyMetrics`. Restores focus chip active state from `bleu_focuses`. Delayed (`setTimeout 1200`) identity-protocol onboarding check. |

## What this means for Block 1 scope

14 Real / 0 Stub / 0 Missing. The audit's "not located" label was a search gap, not an absence. Every Passport function listed already has a real body and most already persist. The actual Block 1 work is therefore scoped to:

1. **Trace `syncHealthToSupabase`** — both manual entry and file import call it. This is the single remaining blind spot: what column/table does it actually write to, does it upsert, does it coexist with the `profiles.*` columns the rest of the code reads? That determines whether Passport health data is actually reaching the database.
2. **Wire `toggleFocus` to Supabase** — focuses live only in `localStorage['bleu_focuses']`. They should flow to `profiles` so they survive device change. This is a real gap.
3. **Null-guard `startPaidCheckout`** — the "No login required" comment is aspirational; the code reads `currentUser.email` and would crash for anonymous users. Either guard it or enforce the login.
4. **Resolve the `startStripeCheckout` vs `startPaidCheckout` naming** — the former bypasses Stripe entirely (free Pioneer grant); the latter is the actual paid flow. Names swap the meanings readers will expect. Rename during Block 1 to avoid future confusion.
5. **Audit the `showProfile` monkey-patch at 12397** — a one-shot `window.showProfile` override during `activateCitizen()` is fragile. If `showProfile` fires twice in quick succession, the second call runs the already-restored original without the citizen activation side effect. Worth hardening.
6. **Deduplicate `handleHealthImport` (7351) vs `handleHealthFileImport` (7695)** — very similar parse-and-persist logic, different dispatch. One likely dead; verify callers and delete the loser.

Everything else (auth flows, FHIR export, Passport boot, panel toggles) is already working code — Block 1 does not need to invent it.

---

## End-to-end write/read path verification

### Summary

- **Write path:** `saveManualHealthData` → `syncHealthToSupabase` → `upsertProfile` → `profiles` table — **partial / likely broken at schema layer**
- **Read path:** `initPassport` → `/api/personalize` → UI tiles — **broken** (the endpoint returns 4 fields, none of which are the health fields just written; no UI element binds to server-returned health data)
- **BHI score (dashboard, `#bhi-num`):** **hardcoded** — always computes 466 ("Developing") from a static 7-entry `dims` array, regardless of user state
- **Life dimensions (9 Passport tiles at `.pp-life-grid`):** **hardcoded** to `--`; nothing in the codebase sets `.pp-li-val`
- **Life dimensions (5 Dashboard stat boxes at lines 2207–2211):** **hardcoded** to `--`; no code updates them either (distinct from the `#stat-score` ring inside the profile screen, which *is* populated by `showProfile` from `profiles.bleu_score`)

### Does Passport health data persist end-to-end today? **Partial — write is probably silent, read is definitely broken.**

Data flows in, then stops. There is no round trip back to the UI from Supabase for any health metric; every health display renders from `localStorage` only.

---

### 1. Write path detail

**`syncHealthToSupabase(hd)` — `index.html:7499`**

```js
async function syncHealthToSupabase(hd) {
  if (!sbClient || !currentUser) return;          // silent no-op if anon
  const clean = {};
  if (hd.weight)  clean.weight_lbs   = parseFloat(hd.weight);
  if (hd.rhr)     clean.resting_hr   = parseInt(hd.rhr);
  if (hd.hrv)     clean.hrv_ms       = parseInt(hd.hrv);
  if (hd.sleep)   clean.sleep_hrs    = parseFloat(hd.sleep);
  if (hd.steps)   clean.steps_daily  = parseInt(hd.steps);
  if (hd.energy)  clean.energy_score = parseInt(hd.energy);
  if (hd.anxiety) clean.anxiety_score= parseInt(hd.anxiety);
  if (hd.mood)    clean.mood_score   = parseInt(hd.mood);
  if (hd.meds)    clean.medications  = hd.meds;
  if (hd.goal)    clean.primary_goal = hd.goal;
  clean.health_updated_at = new Date().toISOString();
  await upsertProfile(clean);
}
```

- **Target table:** `profiles` (via `upsertProfile` at `index.html:7474`, which does `sbClient.from('profiles').update(...)` or `.insert(...)`).
- **Client:** browser `sbClient` (Supabase JS, anon key). That means `profiles` RLS policies have to allow `UPDATE` by the authenticated user on these columns — we cannot see the RLS policies from this repo.
- **Schema mismatch — biggest unknown for Block 1.** The audit's `profiles` column list (`docs/bleu-system-state.md:165`) contains: `id, city, neighborhood, ci_current, ci_velocity, wellness_goals, medications, conditions, last_active, streak_days, updated_at, bleu_score, cellular_health_score, affiliate_transactions, identity_protocol, cart_items, citizenship_status, citizen_tier, citizen_since, active_protocol, protocol_started_at, stripe_customer_id, last_protocol, last_purchase_date`. Of the 11 columns `syncHealthToSupabase` writes, **only `medications` is in that documented list**. The other 10 (`weight_lbs`, `resting_hr`, `hrv_ms`, `sleep_hrs`, `steps_daily`, `energy_score`, `anxiety_score`, `mood_score`, `primary_goal`, `health_updated_at`) are not documented and may not exist. If they don't exist, PostgREST returns `400 PGRST204` on `UPDATE`, `upsertProfile`'s `try/catch` swallows it, and the user sees a success toast for nothing. **Verification required:** run `select column_name from information_schema.columns where table_name='profiles'` in the Supabase SQL editor before any further Passport work.
- **No other writer.** `syncHealthToSupabase` is the only function that sets any of these 10 columns in the entire codebase. Grep for each column name confirms zero other touches.

### 2. Read path detail

**`/api/personalize` — `server.js:1566–1581`**

```js
if (pn === '/api/personalize' && req.method === 'POST') {
  // ...
  const prof = await querySupabase(
    'profiles',
    `?id=eq.${p.user_id}&select=city,wellness_goals,medications,conditions`,
    1
  );
  json(res, 200, {
    city:        prof[0].city        || 'New Orleans',
    conditions:  prof[0].conditions  || prof[0].wellness_goals || ['sleep'],
    goals:       prof[0].wellness_goals || ['rest better'],
    medications: prof[0].medications || []
  });
}
```

The endpoint selects only `city, wellness_goals, medications, conditions` and returns a 4-field envelope. **It does not return any of the health metrics `syncHealthToSupabase` wrote.** So even if the write succeeded, the server never reads them back.

**`loadPassport()` — `index.html:6885`**

```js
function loadPassport(){
  if(!currentUser) return;
  fetch(ALVAI.replace('/chat','/personalize'), {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({user_id: currentUser.id})
  })
  .then(r => r.json())
  .then(d => {
    window._passport = d;
    if (typeof _loadYT === 'function') _loadYT(d.conditions?.[0] || 'sleep');
    if (typeof _loadSP === 'function') _loadSP(d.conditions?.[0] || 'sleep');
  })
  .catch(() => {});
}
```

Called from the auth bootstrap at `index.html:6883–6884` on session restore and on auth state change. Response is stashed in `window._passport`. Downstream consumers of `_passport`:

- `index.html:3098, 3107` — seeds YouTube/Spotify recommendations with `_passport.conditions[0]`.
- `index.html:4721` — uses `_passport.city` for directory display.
- `index.html:9800` — injects `passport_context` into chat body as a string for Alvai.

**None of the Passport UI elements (`pp-li-val`, `bhi-num`, `bhi-dim-bars`, `pp-health-display`, the 5 `stat-box .num` on dashboard) bind to `_passport`.** The read exists; the render doesn't.

**`renderHealthData()` — `index.html:7289`** reads localStorage `bleu_health` only. No Supabase fallback. So a logged-in user on a fresh browser sees "No health data yet" even if their Supabase record is full.

### 3. BHI score detail

**`#bhi-num` element — `index.html:2150`** starts with literal `0`.

**Init IIFE — `index.html:2169–2202`:**

```js
var dims = [
  {l:'Sleep',     c:'#2DD4A8', score:62},
  {l:'Community', c:'#a78bfa', score:44},
  {l:'Finance',   c:'#C9A84C', score:38},
  {l:'Therapy',   c:'#f97316', score:55},
  {l:'Nutrition', c:'#1d9e75', score:50},
  {l:'ECS',       c:'#2D8A9E', score:30},
  {l:'Recovery',  c:'#ef4444', score:47},
];
var bhi = Math.round(dims.reduce((s,d)=>s+d.score,0) / dims.length * 10);
// ... animate numEl to bhi ...
```

- Fully **static**. Always resolves to `Math.round(326/7*10) = 466`, always tier "Developing". Same value for every user, every session, forever.
- No code path mutates the `dims` array or the computed `bhi` after this IIFE runs.
- The "Calculate My BHI with Alvai →" button at line 2166 sends a chat prompt; it does not compute or persist a real score.
- **Real gap.** A live BHI needs: (a) computing per-dimension scores from actual user data, (b) averaging them, (c) storing the result (`profiles.bhi_score`?) so it survives refresh.

### 4. Life-dimension tiles detail

**Passport panel — `index.html:5151–5161`** renders 9 tiles (Sleep, Mind, Movement, Nutrition, Social, Finance, Spirit, Recovery, ECS). Each is literal HTML with `<div class="pp-li-val">--</div>`.

Grep for `pp-li-val` across the entire repo returns: the 9 HTML lines, the CSS rule at `index.html:4965`, and one JS touch at `index.html:9185` (`renderJourneyMetrics()`). That journey renderer rewrites the whole grid when a journey is active — but its own template also hardcodes `&mdash;` in `.pp-li-val`. So whether a journey is selected or not, dimensions show `—`.

**Dashboard stat boxes — `index.html:2207–2211`** render 5 tiles (BLEU Score, Sleep, Movement, Nutrition, Mind). All literal `<div class="num">--</div>`. No `id` on any of them, and no code sets them. (The `id="stat-score"` ring updated by `showProfile`/`updateBleScore` lives in the profile screen, not in this dashboard row.)

**Real gap.** There is no `computeDimensionScores()` function anywhere. Every dimension display in Passport and Dashboard is static text. The data exists (Supabase `profiles` rows, localStorage focuses, conversations_count, streak_days, bleu_score, cart items) — nothing derives dimension scores from it.

---

## Smallest set of changes to make Passport feel "real"

Ordered by leverage, smallest unit of work first. Read-only investigation complete; none of this is implemented yet.

1. **Verify the `profiles` schema actually has the 10 health columns `syncHealthToSupabase` writes.** One SQL query in the Supabase dashboard. If missing, add a migration. Without this step, every downstream change is invisible.
2. **Extend `/api/personalize`** (`server.js:1572`) to select the 10 health columns and return them in the response envelope. ~5-line change to the `select=` querystring and the `json(res,…)` body.
3. **Add a server→localStorage hydration step** at the top of `initPassport` (or a new `hydrateHealthFromServer()` called from the auth bootstrap): if `currentUser` and `_passport` has health fields, merge them into `localStorage['bleu_health']` before `renderHealthData()` runs. ~15 lines. This closes the round trip so Passport shows saved data on a new device.
4. **Write `computeDimensionScores()`** that returns `{sleep, mind, movement, nutrition, social, finance, spirit, recovery, ecs}` 0–100 integers derived from: `sleep_hrs` → sleep; `anxiety_score`+`mood_score`+`conversations_count` → mind; `steps_daily` → movement; `primary_goal`+`wellness_goals` → nutrition; `conversations_count`+referrals → social; `citizen_tier` → finance; `bleu_focuses` set membership → spirit; cart items + streak → recovery; cart cannabis items → ecs. ~40 lines, all pure function of data we already have. Render the integers into `.pp-li-val` on each of the 9 tiles.
5. **Rebuild the dashboard BHI IIFE** (`index.html:2169–2201`) to call `computeDimensionScores()`, recompute BHI as mean × 10, and persist it back to `profiles.bhi_score` (new column) on change. Then the "single number" stops lying. ~20 lines plus the migration.
6. **Populate the 5 Dashboard stat boxes** at lines 2207–2211 from the same `computeDimensionScores()` output. Give each box an `id` and set `.num` text in the same render. ~10 lines.

Total: one SQL verification, one migration if needed, one new pure function, and ~90 lines of wiring. That's the full scope of making Passport health data round-trip and stop showing `—` on every dimension.

The Block 1 work is not "build Passport." It's "plug the three disconnected wires that are already there."
