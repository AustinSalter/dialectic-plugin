---
name: dialectic-critique
description: Test thesis adequacy against gathered evidence and selected frame. Use after expansion pass to determine if thesis actually protects what it claims. Runs meta-probes, checks preservation gate, outputs Continue/Conclude/Elevate/Reject decision.
---

# Critique Pass

Test whether thesis *actually protects* what it claims to protect.

## Input Required

Needs completed expansion with:
- Frame (protecting, altitude, domain)
- Evidence (supporting, challenging)
- Tensions identified

If no expansion exists, run expansion first.

## Meta-Probes

Run all six against the framed thesis:

| Probe | Question | Failure Mode |
|-------|----------|--------------|
| Contingency | Does this depend on something that could change? | Temporary vs structural |
| Mechanism | Is the causal path specified? | Assertion without causation |
| Anomaly | Is counter-evidence addressed? | Ignored disconfirmation |
| Model Dependency | Do model assumptions still hold? | Outdated model |
| Implementation | Does this assume rational response? | Perverse/irrational response |
| Survival | What observation would have killed this thesis this round — and did you go look for it? | Unfalsifiable drift |

R rises only in a round where a kill was attempted and failed. No attempt, no credit.

**For domain-specific probes:** See patterns/{domain}.md

## Fact-Check with Web Search

Use `WebSearch` to verify or challenge key claims from the expansion pass. Budget 2-3 searches per critique.

**Search for:**
- Disconfirming evidence for the strongest supporting claims
- Recent developments that affect contingency/mechanism probes
- Expert opinions that contradict the current thesis framing
- Data that resolves identified `[TENSION]` markers

For any web-sourced finding that changes a probe outcome, append `[WEB]` to the probe's rationale in the output yaml and state what changed. If a probe result would differ with updated evidence, state the original result and the revised result in the probe's rationale.

**Saturation is a claim about searches, not a feeling.** Before this critique reports evidence as saturated, name the last two searches run and what each returned. "The remaining threads are confirmation-shaped" is a prediction; two named searches that came back with nothing new are evidence. If you cannot name them, the evidence is unsaturated — go run them.

## Preservation Gate (Required)

Cannot decide without answering:

1. **What does thesis correctly identify?** (sound content)
2. **What does thesis correctly frame?** (valuable framing)
3. **What must any elevation retain?** (non-negotiables)

*If you can't complete this, you haven't understood the thesis. Return to expansion.*

## Elevation Test (Run Before Decision)

Before deciding, check for **amputation** — the failure mode where counter-arguments are acknowledged but don't change anything.

One entry per `[COUNTER]` from expansion. Quote the counter. Quote the thesis text that changed in response — the words as they now stand, not a description of them. If nothing changed, write `nothing changed` and answer `should_it_have`.

When a counter did change the thesis, classify the change: **progressive** — the new thesis forbids something the old one allowed (quote the forbidden thing) — or **degenerating** — it only excuses the counter. Two degenerating changes in a row mean the thesis is dying: REJECT or ELEVATE, never CONCLUDE.

```yaml
amputation_check:
  - counter: "[quoted from the scratchpad]"
    thesis_change: "[quoted new thesis text]"   # or: nothing changed
    shift: [progressive | degenerating]         # omit if nothing changed
    now_forbids: "[what the new thesis rules out]"   # progressive only
    should_it_have: "[yes/no and why]"          # required if nothing changed
```

If `should_it_have: yes` for any counter → the thesis needs ELEVATE, not CONCLUDE. The thesis is absorbing hits without adapting — it's at the wrong altitude.

## Evidence Gate for ELEVATE

ELEVATE requires **E ≥ 0.4**. If the altitude appears wrong but E < 0.4, the critique doesn't have enough evidence to know what the right altitude *is*. Elevating on thin evidence produces a guess, not a grounded reframe.

- E < 0.4 AND altitude suspect → **CONTINUE** with `altitude_suspect: true` and `data_needed` explaining what evidence would clarify the right altitude
- E ≥ 0.4 AND altitude wrong → **ELEVATE** with full preservation gate

## Decision

| Decision | When | Required Output |
|----------|------|-----------------|
| CONTINUE | Evidence gaps exist, addressable with data | What specific data resolves it? |
| CONCLUDE | Thesis robust at right altitude, no amputated counters | The bet + falsification trigger |
| ELEVATE | Wrong altitude OR amputated counters (requires E ≥ 0.4) | Elevated thesis + what it preserves + what it resolves |
| REJECT | Thesis refuted: a probe or counter breaks the core claim and no elevation rescues it | Refuting basis (which claims/evidence it rests on) + counter-thesis if one is visible |

**CONCLUDE only when you can state:**
- The bet: "X > Y because mechanism Z"
- Falsification: What specific conditions would flip this?
- Amputation check: No material counters were acknowledged without changing the thesis
- Survival: A kill was attempted this round and the thesis came through it

**ELEVATE requires:**
- E ≥ 0.4 (evidence gate)
- The elevated thesis (what it was reaching for)
- What it preserves from original
- What tension it resolves
- Which amputated counter(s) the elevation integrates

## Output Format

```yaml
probes:
  contingency: [STRUCTURAL | CONTINGENT] — [why]
  mechanism: [SPECIFIED | MISSING] — [why]
  anomaly: [ADDRESSED | IGNORED] — [what]
  model_dependency: [VALID | CHANGED | N/A] — [why]
  implementation: [REALISTIC | ASSUMES_RATIONAL] — [why]
  survival: [ATTEMPTED_SURVIVED | ATTEMPTED_KILLED | NO_ATTEMPT] — [the observation that would have killed it, where you looked, what came back]

preservation:
  correctly_identifies: [specific sound content]
  correctly_frames: [valuable framing to keep]
  must_retain: [non-negotiable elements]

decision: [CONTINUE | CONCLUDE | ELEVATE | REJECT]

# Include ONE of the following based on decision:

if_continue:
  data_needed: [specific gaps]
  resolution_conditions: [what would decide]

if_conclude:
  the_bet: "[X] > [Y] because [mechanism Z]"
  falsification: [specific conditions that would flip]

if_elevate:
  original_thesis: [as stated]
  elevated_thesis: [what it's really trying to say]
  preserves: [from original]
  resolves: [what tension]

if_reject:
  refuting_basis: [the specific claims/evidence the refutation rests on]
  counter_thesis: [the thesis the evidence actually supports — omit if none is visible]
```

**REJECT is a success, not a failure.** A refuted thesis with a stated refuting basis is a finished piece of reasoning. If a counter-thesis is visible, write it to `counter_thesis` in state.json — the loop will re-enter once from it. If none is visible, the run ends as a refutation: distillation will produce a memo of why the thesis is wrong and what would resurrect it.

A thesis earns standing by surviving attempts to kill it — Popper's point, and the reason the Survival probe asks where you looked. A thesis nobody tried to refute has nothing to report but its own elaboration; one that was tried and broke has told you something true about the world. The failure mode is not killing a thesis. It is a round where nothing could have.

## Example: Stripe (After Expansion)

**Input from expansion:**
```yaml
frame:
  protecting: Investment in payments company
  altitude: TOO_GRANULAR → needs elevation to infrastructure
  domain: Infrastructure
evidence:
  supporting: [YC adoption, platform expansion]
  challenging: [features copyable]
tensions:
  - PayPal founders investing against own company
```

**Critique:**

```yaml
probes:
  contingency: CONTINGENT — "better docs" can be copied
  mechanism: MISSING — no causal path from features to durable advantage
  anomaly: IDENTIFIED — PayPal founders' investment unexplained by "better product" thesis
  model_dependency: N/A — no model cited
  implementation: N/A — not a policy thesis
  survival: ATTEMPTED_KILLED — searched for a rival that matched Stripe's docs and still lost; Braintree matched them and lost anyway, which kills "docs are the moat"

preservation:
  correctly_identifies: Developer experience matters for adoption
  correctly_frames: Payments as infrastructure, not product
  must_retain: Developer-centric insight

decision: ELEVATE

if_elevate:
  original_thesis: "Stripe has better documentation and easier integration"
  elevated_thesis: "Developer experience is the wedge into financial infrastructure. Companies choose payment APIs early, before procurement. Once integrated, Stripe becomes merchant of record, compliance layer, billing system. Switching costs compound. The moat isn't docs—it's infrastructure lock-in."
  preserves: Developer experience as key lever
  resolves: Why PayPal founders would invest against their own company (they see infrastructure play, not product competition)
```

## Quick Reference: Domain Patterns

| Domain | Key Probes | File |
|--------|------------|------|
| Marketplace | Liquidity, geographic scope, trust portability | patterns/marketplace.md |
| Infrastructure | Decision-maker, switching costs, copyability | patterns/infrastructure.md |
| Financial | Model regime, correlation, counterparty, incentives | patterns/financial.md |
| Policy | Implementation gap, precedent validity, institutional response | patterns/policy.md |
| Disruption | Incumbent response, cost curve, metric shift, physics vs politics | patterns/disruption.md |

---

## CRITICAL: Stop After Writing Decision

After writing your critique output, updating `state.json` with the decision field (`continue`, `conclude`, `elevate`, or `reject`), and appending to `thesis-history.md`, **stop responding immediately**. Do not write anything else. Do not begin any next phase. Do not write transition headers. Do not set `loop` to any other value. Your response ends here — the stop hook reads `state.json` and handles what comes next.
