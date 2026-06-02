# BLEU Core Schemas

This directory contains shadow-mode JSON Schemas for BLEU's mechanical migration from doctrine into validated data contracts.

## Signal Object v1.1

`signal_object_v1.1.schema.json` defines the output of Prism / `decompose()`.

The Signal Object is classification data only. It separates the Citizen's message into intent, Six Band signals, probabilistic variant blend, risk flags, missing information, commerce posture, evidence need, and confidence. It must not contain Citizen-facing guidance.

Validation coverage lives in `tests/schemas/signal_object_v1_1.test.js` with fixtures under `tests/fixtures/signal_object/`.

## Doctrine alignment

The schema encodes the BLEU Bible Signal Object fields and Six Bands:

- Life Stage (`L1`-`L5`)
- Clinical Complexity (`C0`-`C4`)
- Readiness (`R0`-`R5`)
- Trust (`T0`-`T4`)
- Dose Tolerance (`D1`-`D5`)
- Financial Capacity / signal (`F1`-`F4` plus unknown states)

Safety-forward override constraints are included for acute/unstable signals and late-aging vulnerability floor behavior.
