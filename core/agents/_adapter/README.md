# Agents SDK Adapter Scaffold

Status: DORMANT — SDK adapter scaffold only; not imported by server.js.

This directory is the scaffold-only adapter layer for the future BLEU agent migration. It defines the **shape** of agents, tools, handoffs, and runners without creating any live agents, invoking any model, or wiring production traffic.

## Architecture mapping

BLEU doctrine describes the lens as five machines in series: **Signal → Safety → Route → Outcome → Memory**. The adapter gives future agents a stable contract for those machines without deciding their clinical language or runtime implementation.

For this scaffold, the four adapter primitives are **Agent**, **Tool**, **Handoff**, and **Runner**. They correspond to the future SDK-facing surfaces that let specialized agents participate in the five-machine lens while still emitting or consuming BLEU-owned schema artifacts.

The OpenAI Agents SDK migration doctrine maps owned BLEU concepts onto rented framework primitives:

| BLEU-owned primitive | Future SDK shape | Adapter file |
| --- | --- | --- |
| ALVAI voice / signed instructions | Agent instructions | `agent_interface.js` |
| Multi-state routing | Handoffs | `handoff_interface.js` |
| Function tools | Tool contracts | `tool_interface.js` |
| Trust Packet logging / tracing | Runner result contract | `runner_interface.js` |

The scaffold also preserves the four schema primitives already in the foundation layer: Signal Object, Decision Object, Trust Packet, and Variant Taxonomy. Future agents use `schema_refs` to declare which schema contracts they emit or consume.

## What ships here

- `defineAgent(spec)` validates and freezes the base Agent shape.
- `defineTool(spec)` validates and freezes a Tool shape with JSON Schema input/output contracts.
- `defineHandoff(spec)` validates and freezes a Handoff edge shape.
- `createRunner(config)` returns a runner contract whose `run()` method throws `NotImplementedError('Runner not yet wired')`.
- `freezeRegistry()` returns frozen empty `{ agents, tools, handoffs }` Maps for future registration.

No registry singleton, route handler, model call, external SDK dependency, or production behavior change is included.

## Future Crisis Safety Agent example (pseudocode only)

```js
const {
  defineAgent,
  defineTool,
  defineHandoff,
  createRunner,
} = require('./core/agents/_adapter');

const crisisSafetyAgent = defineAgent({
  id: 'crisis-safety',
  name: 'Crisis Safety Agent',
  version: '0.1.0',
  description: 'Future clinical safety agent for crisis routing boundaries.',
  instructions: '', // Dr. Felicia signoff required before this is populated.
  tools: [], // Future PRs may attach signed safety tools.
  handoffs: ['clinical-review'],
  tier: 2,
  felicia_signoff_required: true,
  schema_refs: [
    'core/schemas/signal_object_v1.1.schema.json',
    'core/schemas/decision_object_v1.1.schema.json',
    'core/schemas/trust_packet_v1.1.schema.json',
  ],
});

const crisisHandoff = defineHandoff({
  from_agent_id: 'orchestrator',
  to_agent_id: 'crisis-safety',
  condition: null, // Future runner-owned predicate.
  reason: 'Crisis or self-harm signal requires safety route before any other response.',
  records_decision: true,
});

const runner = createRunner({ agents: [crisisSafetyAgent], handoffs: [crisisHandoff] });
// await runner.run(input) throws NotImplementedError until a future wiring PR lands.
```

This example is intentionally not exported as a real agent. Clinical agents require Dr. Felicia signoff before the `instructions` field is populated or any clinical behavior is activated.

## Runner status

`createRunner()` is a stub. Future PRs may replace it with a real implementation routing to the OpenAI Agents SDK or Anthropic agentic patterns, but this PR ships only the contract so production `/api/chat` remains untouched.
