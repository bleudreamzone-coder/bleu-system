# magic_link_v1

**template_version:** `magic_link_v1`
**comm_type:** `email`
**trigger:** `POST /api/auth/magic-link`
**From:** `BLEU <hello@bleu.live>`
**Subject:** `Your BLEU sign-in link`

---

## Variables

| Token | Source | Notes |
|---|---|---|
| `{{link}}` | `${origin}/?verify=<token>` | single-use, 15-min expiry |

No PII in this template. No first name (the request endpoint must not confirm
whether an address is registered — see no-enumeration rule).

---

## Body (HTML)

```html
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.6;">
  <p>Here's your sign-in link for BLEU.</p>

  <p style="margin:28px 0;">
    <a href="{{link}}" style="background:#C9A84C;color:#1a1a1a;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block;">Sign in to BLEU</a>
  </p>

  <p style="font-size:13px;color:#666;">If the button doesn't work, paste this address into your browser:<br>
    <span style="word-break:break-all;">{{link}}</span>
  </p>

  <p>This link expires in 15 minutes. If you didn't request this, you can ignore this email.</p>

  <p style="margin-top:32px;">— BLEU</p>

  <hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0;">

  <p style="font-size:12px;color:#888;">
    BLEU protocols are reviewed by Dr. Felicia Stoler, DCN, credentialed protocol reviewer.
    This message supports your wellness journey and is not medical advice; it does not diagnose,
    treat, or replace care from your own clinician.
  </p>
</div>
```

---

## Plain-text fallback

```
Here's your sign-in link for BLEU.

Sign in: {{link}}

This link expires in 15 minutes. If you didn't request this, you can ignore this email.

— BLEU

---
BLEU protocols are reviewed by Dr. Felicia Stoler, DCN, credentialed protocol reviewer. This message supports your wellness journey and is not medical advice; it does not diagnose, treat, or replace care from your own clinician.
```

---

## Tone checklist (Rufus Standard / Alvai voice)

- [x] Brief, dignified — one purpose, one CTA
- [x] No marketing, no urgency framing beyond the factual 15-min expiry
- [x] No exclamation marks
- [x] Raw-URL fallback for non-rendering clients
- [x] "didn't request this" reassurance line
- [x] Stoler DCN footer (matches order_confirmation_v1)
