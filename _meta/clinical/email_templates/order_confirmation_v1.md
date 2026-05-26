# order_confirmation_v1

**template_version:** `order_confirmation_v1`
**comm_type:** `email`
**trigger:** Stripe `checkout.session.completed`, after idempotency + protocol activation
**From:** `BLEU <hello@bleu.live>`
**Subject:** `Your BLEU protocol is on the way`

---

## Variables

| Token | Source | Notes |
|---|---|---|
| `{{first_name}}` | profile / Stripe `customer_details.name` (first token) | optional; omit the greeting line if absent |
| `{{protocol_name}}` | `PROTOCOL_MAP[priceId].name` | e.g. "Foundations" |
| `{{order_summary}}` | line items / plan items | plain prose, no table |

Keep PII out of the rendered body beyond first name. No address, no email, no phone.

---

## Body (HTML)

```html
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.6;">
  <p>{{#if first_name}}{{first_name}},{{/if}}</p>

  <p>Your protocol is confirmed and on its way. You chose {{protocol_name}}, and it's a considered place to begin.</p>

  <p>{{order_summary}}</p>

  <p>You don't need to do anything right now. Settle in. On Day 3 you'll hear from us with a short check-in, because the early days are where a protocol either takes root or quietly slips. We'll be there for that.</p>

  <p>If anything feels off before then, reply to this message and a person will read it.</p>

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
{{first_name}},

Your protocol is confirmed and on its way. You chose {{protocol_name}}, and it's a considered place to begin.

{{order_summary}}

You don't need to do anything right now. Settle in. On Day 3 you'll hear from us with a short check-in, because the early days are where a protocol either takes root or quietly slips. We'll be there for that.

If anything feels off before then, reply to this message and a person will read it.

— BLEU

---
BLEU protocols are reviewed by Dr. Felicia Stoler, DCN, credentialed protocol reviewer. This message supports your wellness journey and is not medical advice; it does not diagnose, treat, or replace care from your own clinician.
```

---

## Tone checklist (Rufus Standard / Alvai voice)

- [x] Dignified, restrained — no hype, no exclamation marks
- [x] Flowing prose, no bullet points in the customer-facing copy
- [x] No medical claims; no diagnosis language
- [x] Stoler credential named in footer
- [x] Ends pointing to the Day-3 follow-up (a real next touch, not a CTA)
- [x] Human reply path offered
