# CONFIDENTIAL — FLEUR DE BLEUDREAM LLC TRADE SECRET

**Coca-Cola Recipe v1 — The Proprietary Mechanism**
**Do not distribute. Inherits from [[source_document_v1]].**
**Last reviewed:** 2026-05-26

---

## The formula

> **BLEU = Trust-Governed Lowest-Regret Routing**

Tight form:

> **BLEU finds the safest next best step. Then remembers what happened.**

Two clauses. The first is governance under uncertainty. The second is the compounding loop. Competitors can copy a chatbot. They cannot easily copy *governed routing that learns from real outcomes under clinical constraint* — that is the moat.

---

## The seven gates

Every meaningful route passes these gates in order. A failure at any gate halts or reroutes — it never gets overridden by a later gate.

1. **Crisis gate** — is this a 988 moment? If yes, everything else stops.
2. **Safety gate** — interactions, contraindications, red flags (FDA/RxNorm, CYP450).
3. **Evidence gate** — what tier supports any claim? (established → narrative)
4. **Claim-boundary gate** — education / wellness-support / refer-to-clinician.
5. **Clinical-review gate** — has the reviewer (Felicia DCN) signed the relevant pattern?
6. **Commerce gate** — only now, and only if green, may a product appear (3+ options: budget/mid/premium).
7. **Outcome gate** — schedule the follow-up (day 3 / 7 / 30) so the route becomes learnable.

---

## Lowest-Regret Action Score (LRAS)

Routing chooses the action that minimizes expected regret, not the one that maximizes engagement or revenue. Components:

- **Safety cost** — expected harm if this route is wrong (weighted highest; dominates).
- **Reversibility** — how easily the user can undo this step (favor reversible steps).
- **Evidence weight** — strength of support for the route's claim.
- **Benefit estimate** — expected upside if the route is right.
- **Trust cost** — damage to the relationship if this feels like a sell, not a help.
- **Follow-up value** — how much this route teaches us for next time.

`LRAS = benefit·evidence − (safety_cost + trust_cost) · (1 − reversibility)` *(conceptual; the code is the source of truth — see [[lens_architecture_doctrine_v1]].)*

---

## The secret ingredient

**Restraint.**

Everyone else adds. More features, more answers, more urgency, more engagement. BLEU's edge is subtraction: the refusal to answer beyond evidence, the refusal to sell during crisis, the willingness to route a user *away* to a human. Restraint is what makes the warmth trustworthy and the moat durable. It cannot be A/B-tested into a competitor's product because it costs them short-term metrics to adopt.
