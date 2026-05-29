# Resend DNS Diagnostic — bleu.live — 2026-05-29 (Day 81)

**Auditor:** Claude Code (CC) · **Trigger:** Day-81 magic-link probe to `bleudreamlegacy@gmail.com` did NOT arrive. Root-cause needed before any further Resend traffic.
**Method:** DNS-over-HTTPS lookups via `https://dns.google/resolve` (this Codespace has no `dig` / `nslookup` installed — DoH is the equivalent); cross-referenced against Resend's GoDaddy guide (`resend.com/docs/knowledge-base/godaddy`).

---

## TL;DR

**🔴 None of Resend's required DNS records are published for `bleu.live`.** That is the root cause of "email never arrived." The domain registrar is **GoDaddy** (nameservers `ns13.domaincontrol.com` / `ns14.domaincontrol.com`), the apex `A` record points to Render (`216.24.57.1`), and a default GoDaddy DMARC exists — but the three records Resend needs (SPF on `send.bleu.live`, MX on `send.bleu.live`, DKIM CNAME at `resend._domainkey.bleu.live`) **do not exist at all**.

Fix is 100% in Captain's hands: log in to Resend → copy the three values it shows → log in to GoDaddy → paste them per the table at the bottom of this doc. ~10 minutes of typing; 5–60 minutes for DNS propagation.

---

## Section 1 — Live DNS state (verbatim from Google's resolver)

### Apex (`bleu.live`)

| Type | Result | Verdict |
|---|---|---|
| **A** | `216.24.57.1` (TTL 600) | ✅ Render edge IP. Site reachable. |
| **NS** | `ns13.domaincontrol.com.`, `ns14.domaincontrol.com.` | ✅ GoDaddy DNS. (Manage records in **GoDaddy** dashboard, not Cloudflare.) |
| **MX** | *(no records — Status 0, no Answer section)* | ⚠️ No apex MX. Not strictly required for Resend; Resend writes to a `send.` subdomain instead. |
| **TXT** | *(no records — Status 0, no Answer section)* | ⚠️ No apex SPF or any apex TXT at all. Not the blocker by itself, but worth noting. |

### Resend-relevant subdomains

| Lookup | Result | Verdict |
|---|---|---|
| **MX `send.bleu.live`** | NXDOMAIN (Status 3) — record does not exist | ❌ **MISSING** — Resend needs this for bounce/feedback handling |
| **TXT `send.bleu.live`** (SPF) | NXDOMAIN (Status 3) — record does not exist | ❌ **MISSING** — without this, SPF check fails, recipient mail servers (Gmail) reject or spam-bin |
| **CNAME `resend._domainkey.bleu.live`** (DKIM) | NXDOMAIN (Status 3) — record does not exist | ❌ **MISSING** — without DKIM the message signature can't be verified; Gmail will reject or quarantine |
| **TXT `_dmarc.bleu.live`** | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` | ⚠️ Exists but is **GoDaddy's auto-applied DMARC** (relaxed alignment, quarantine policy, reports back to GoDaddy's own RUA). It's fine to leave for now — once SPF + DKIM are in place, Resend mail will pass alignment. |

### Implications

1. **Gmail's reject path is unambiguous:** with `p=quarantine` in DMARC AND no SPF or DKIM passing, any mail from `@bleu.live` will be quarantined or rejected outright. That's why Captain saw nothing in the inbox — likely not even in spam, because quarantine ≠ spam.
2. **No "partial verification" possible** — Resend requires both the SPF (TXT) and the DKIM (CNAME) to flip the domain from "Not Started" / "Pending" to "Verified" in their dashboard.
3. **Cloudflare is not involved.** The advisor's earlier note about "Cloudflare DNS-only / grey cloud" doesn't apply — bleu.live is on GoDaddy DNS directly. No proxy / no orange cloud / no DNS-only toggle. **Captain edits the records in GoDaddy.**

---

## Section 2 — What Resend requires (per their own GoDaddy guide)

Resend's GoDaddy KB (`resend.com/docs/knowledge-base/godaddy`) specifies three records (plus an optional fourth for inbound). For the *outbound-only* case (which is what BLEU needs — order confirmations, magic links, day-7 outcome reminders), three are required:

| # | Type | Name (paste in GoDaddy "Host" field) | Value (Captain copies from Resend dashboard) | Priority | TTL |
|---|---|---|---|---|---|
| 1 | **MX** | `send` | (from Resend dashboard — typically `feedback-smtp.<region>.amazonses.com`) | `10` ¹ | `600` |
| 2 | **TXT** (SPF) | `send` | (from Resend dashboard — typically `v=spf1 include:amazonses.com ~all`) | n/a | `600` |
| 3 | **TXT** (DKIM) | `resend._domainkey` | (from Resend dashboard — UNIQUE per Resend account; cannot be guessed) | n/a | `600` |

¹ GoDaddy note from Resend's KB: "Do not use the same priority for multiple records. If Priority 10 is already in use on another record, try a higher value 20 or 30." For `send.bleu.live` there are no existing MX records, so 10 is fine.

**GoDaddy-specific quirks to know:**
- For the **Host / Name** field, paste **only the subdomain part** (`send`, not `send.bleu.live`). GoDaddy will display the full FQDN after save.
- The **DKIM record type is what Resend's docs label as "TXT DKIM"** — Resend's UI may also call this a "CNAME" depending on the variant. Whatever the dashboard says, that's what to use. If the value Resend shows starts with `v=DKIM1;` it's a TXT; if it's a hostname pointing to `*.dkim.amazonses.com` it's a CNAME.
- **TTL `600`** = 10 minutes propagation. Default 1-hour is also fine; lower TTL just means faster re-try if you mistype.

**Important — the documentation I could fetch did NOT include the exact verbatim values** that go in the "Value / Points to" column. Those values are **unique to the Resend account / region** and must be **copied directly from the Resend dashboard.** Anyone (including me) telling you to paste exact values from a generic doc is guessing. The dashboard shows the literal strings to paste, per-record, with a "Copy" button next to each.

---

## Section 3 — Step-by-step fix (Captain phone)

### Step 1 — Get the values from Resend (5 min)

1. Open **https://resend.com/domains** in a browser (phone or laptop).
2. Click on the **`bleu.live`** entry. (If it's not there: click "Add Domain", type `bleu.live`, region `us-east-1` is the default and matches the Render-adjacent inference.)
3. The page shows a table titled "DNS Records" with 3 rows: one MX, one TXT (SPF), one TXT-or-CNAME (DKIM). Each row has its Type, Name, Value, Priority (where applicable), and TTL — and a **Copy** button per row.
4. Keep this page open. You'll alt-tab back to it for each paste.

### Step 2 — Paste into GoDaddy (5 min)

1. Open **https://dcc.godaddy.com/control/dnsmanagement?domainName=bleu.live** in another tab.
2. (If GoDaddy asks you to log in: same account where you bought the domain.)
3. You'll see a list of existing DNS records and an "ADD" button.
4. For each of the 3 Resend rows, click **ADD**, then:

   | If Resend row shows | In GoDaddy "Add Record" form |
   |---|---|
   | Type = `MX`, Name = `send` (or `send.bleu.live`) | Type = **MX**, Name = `send`, Value = (paste from Resend), Priority = `10`, TTL = `1 Hour` |
   | Type = `TXT`, Name = `send`, Value starts with `v=spf1` | Type = **TXT**, Name = `send`, Value = (paste — include the surrounding `v=spf1 include:... ~all`), TTL = `1 Hour` |
   | Type = `TXT` (or `CNAME`), Name = `resend._domainkey` | If Resend shows TXT → Type = **TXT**, Name = `resend._domainkey`, Value = (paste; will be very long, starts with `p=` or `v=DKIM1;`), TTL = `1 Hour`. If Resend shows CNAME → Type = **CNAME**, Name = `resend._domainkey`, Points to = (paste, e.g. `xyz.dkim.amazonses.com`), TTL = `1 Hour`. |

5. Save after each one. GoDaddy publishes immediately.

### Step 3 — Wait for propagation (5–60 min, usually <15)

DNS propagation isn't instant. The TTL on existing records (none here — they don't exist yet) means Google/Gmail's resolver will cache the absence for the negative-cache duration of the SOA (currently `600` seconds = 10 min). Plan to wait **at least 15 minutes** before re-testing.

### Step 4 — Confirm DNS propagated (Captain can run from phone or anywhere)

These run from a browser — they hit Google's DoH resolver:

- https://dns.google/query?name=send.bleu.live&type=MX → should now show an **Answer** with a `data` field (not "Authority" only)
- https://dns.google/query?name=send.bleu.live&type=TXT → should show the SPF TXT record
- https://dns.google/query?name=resend._domainkey.bleu.live&type=TXT (or `CNAME` depending on Resend) → should show the DKIM value

Or from a terminal that has `dig` (CC's Codespace does not, but yours might):
```
dig +short MX send.bleu.live
dig +short TXT send.bleu.live
dig +short TXT resend._domainkey.bleu.live    # or CNAME
```

### Step 5 — Tell Resend to re-check (1 min)

1. Back in the Resend dashboard, on the `bleu.live` domain page, click the **"Verify DNS Records"** button (or whatever the current UI calls it — usually a button at the top of the records table).
2. The status next to each record will flip from `Pending` / `Not Started` to `Verified` (green) within 10–60 seconds once DNS is right.
3. **The domain status flips to `Verified`** at the top of the page once all 3 are green.

### Step 6 — Re-trigger the magic-link probe (1 min, from CC's terminal or anywhere)

```
curl -sS -X POST https://bleu-system.onrender.com/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"bleudreamlegacy@gmail.com"}'
```

Expected: `{"ok":true}` (200) — same as before, since the endpoint is no-enum by design.

**The real verification is your inbox.** Check `bleudreamlegacy@gmail.com` within 30 seconds. If the email arrives → **DNS is healthy, Resend is wired, magic-link auth is end-to-end operational, Citizen #1 is unblocked.** If not → look in the Resend dashboard → Logs → find the message at this timestamp → it'll show the exact rejection reason from Gmail.

---

## Section 4 — What I could NOT verify from this sandbox

| Item | Why | Captain action |
|---|---|---|
| Whether the `bleu.live` domain exists at all in the Resend account | No `RESEND_API_KEY` locally | Open Resend → Domains. If not there → "Add Domain" → `bleu.live`. |
| The verbatim values Resend wants for the 3 records (especially DKIM, which is per-account) | Same — and Resend's public docs don't publish exact values | Copy from the Resend dashboard per Section 3 Step 1 |
| Which Resend region the account is in (affects the MX value) | Same | Doesn't matter for the fix — Resend's dashboard shows the right value for your region |
| Whether any other Captain-side domain config blocks email (e.g., GoDaddy email forwarding consuming the MX) | No access to GoDaddy from here | Inspect the GoDaddy DNS panel before adding — if a `send` subdomain MX already exists, replace rather than add |

---

## Section 5 — Companion work

This audit is the prerequisite for **`_meta/audits/2026-05-29-dns-sms-verification.md`** Recommendation #3 (verify Resend domain). Once this fix lands and the magic-link email arrives, that audit's open item closes.

The other Day-81 blocker — **`REORDER_CRON_SECRET` not set in Render** — is independent and tracked in its own checklist: `_meta/audits/2026-05-29-cron-secret-render-fix.md` (same-day filing).

Excision plan (`_meta/audits/2026-05-29-cannaiq-excision-plan.md`) and the per-mode smoke test (`tests/integration/per-mode-chat.smoke.js`, PR 0) do not depend on this fix — they can ship in parallel.

---

*Diagnostic by Claude Code, Day 81. Read-only. All DNS lookups via Google DoH; all values verbatim from the actual resolver responses.*
