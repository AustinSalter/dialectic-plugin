---
name: dialectic-critique
description: Test thesis adequacy against gathered evidence and selected frame. Use after expansion pass to determine if thesis actually protects what it claims. Runs meta-probes, checks preservation gate, outputs Continue/Conclude/Elevate decision.
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

Run all five against the framed thesis:

| Probe | Question | Failure Mode |
|-------|----------|--------------|
| Contingency | Does this depend on something that could change? | Temporary vs structural |
| Mechanism | Is the causal path specified? | Assertion without causation |
| Anomaly | Is counter-evidence addressed? | Ignored disconfirmation |
| Model Dependency | Do model assumptions still hold? | Outdated model |
| Implementation | Does this assume rational response? | Perverse/irrational response |

**For domain-specific probes:** See patterns/{domain}.md

## Programme Assessment (Lakatos)

Each iteration, evaluate whether the current research programme is progressive or degenerating:

| Status | Definition | Signal |
|--------|------------|--------|
| **PROGRESSIVE** | This iteration predicted novel evidence that was confirmed, OR the thesis expanded to cover new domains without ad hoc modification. Red team found no severe challenges. | Programme is healthy — CONTINUE is appropriate |
| **DEGENERATING** | This iteration only patched the protective belt to accommodate anomalies, without predicting anything new. Or red team BROKE a claim and fix was ad hoc. | Programme is stalling — consider alternatives |
| **STAGNANT** | No meaningful change from previous iteration — same evidence, same thesis, no new predictions. Evidence base needs enrichment. | Programme has exhausted its productive potential |

Read `programme_status.consecutive_degenerating` from state.json. If not present, initialize to 0.
- If PROGRESSIVE: reset `consecutive_degenerating` to 0
- If DEGENERATING or STAGNANT: increment `consecutive_degenerating`

```yaml
programme_status:
  assessment: PROGRESSIVE | DEGENERATING | STAGNANT
  evidence_for_assessment: "..." # what specifically makes this progressive/degenerating
  consecutive_degenerating: 0 # counter — read from state, increment if degenerating/stagnant
```

## Alternate Frame Probe (Chamberlin)

**Activates only when `consecutive_degenerating >= 1`.** Early iterations should work the current thesis hard before exploring alternatives. This is Lakatos's insight: rational persistence through anomalies, not premature abandonment.

When active, articulate at least one competing frame that could explain the same evidence differently.

**Process:**
1. Review ALL evidence from expansion (supporting + challenging + adversarial)
2. Ask: is there a different frame that explains this evidence AS WELL OR BETTER?
3. Sketch the competing frame in 2-3 sentences
4. Evaluate: does it account for evidence the current frame struggles with?

```yaml
alternate_frame:
  active: true/false # false if consecutive_degenerating < 1
  frame: "..." # 2-3 sentence competing frame (only if active)
  viable: true/false
  explains_evidence: ["which evidence it accounts for"]
  misses: ["what it can't explain"]
  explorer_spawned: false # Phase 2 sets this when spawning background subagent
```

**If not active**: output `alternate_frame.active: false` and skip.

**If viable**: this is a candidate for background exploration (Phase 2). In Phase 1, note it for the human. It does NOT trigger FORK — the main loop continues on the current thesis.

## Convergence Check (when explorations available)

When background thesis-explorer subagents have completed and their results are in `.claude/dialectic/explorations/`, AND the current programme is DEGENERATING or STAGNANT, perform a convergence check.

**Process:**
1. Read all files in `.claude/dialectic/explorations/`
2. Compare each exploration's Lakatosian assessment against the current thesis
3. Assess: is any exploration progressive where the current programme is degenerating?

```yaml
convergence:
  explorations_available: true/false
  explorations:
    - thesis: "..."
      progressive: true/false
      novel_predictions: ["..."]
  recommendation: "switch" | "continue" | "human_choice_required"
```

**Recommendation logic:**
- `switch`: An exploration is clearly progressive AND current programme has `consecutive_degenerating >= 2`
- `continue`: No exploration is more progressive than the current programme
- `human_choice_required`: An exploration is progressive AND current programme is degenerating, but the choice is ambiguous — in interactive mode, this triggers the CHOOSE pause

If `recommendation: "switch"` and NOT in interactive mode: the critique should issue ELEVATE with the exploration's thesis as the elevated thesis.

If `recommendation: "human_choice_required"` and in interactive mode (`--interactive=steering` or `--interactive=full`): the stop hook will pause for human input.

## Fact-Check with Web Search

Use `WebSearch` to verify or challenge key claims from the expansion pass. Budget 2-3 searches per critique.

**Search for:**
- Disconfirming evidence for the strongest supporting claims
- Recent developments that affect contingency/mechanism probes
- Expert opinions that contradict the current thesis framing
- Data that resolves identified `[TENSION]` markers

Mark any web-sourced findings that change probe outcomes. If a probe result would differ with updated evidence, note the delta.

## Preservation Gate (Required)

Cannot decide without answering:

1. **What does thesis correctly identify?** (sound content)
2. **What does thesis correctly frame?** (valuable framing)
3. **What must any elevation retain?** (non-negotiables)

*If you can't complete this, you haven't understood the thesis. Return to expansion.*

## Elevation Test (Run Before Decision)

Before choosing CONTINUE, CONCLUDE, or ELEVATE, check for **amputation** — the failure mode where counter-arguments are acknowledged but don't change anything.

**Test**: Review each `[COUNTER]` from expansion. For each one, ask: *Did this counter-argument change the thesis, or was it acknowledged and set aside?*

If a material counter was acknowledged without changing the thesis, name it explicitly:

```yaml
amputation_check:
  amputated_counters:
    - counter: "[the specific counter-argument]"
      response: "[how the thesis responded]"
      changed_thesis: false
      should_it_have: "[yes/no and why]"
```

If `should_it_have: yes` for any counter → the thesis needs ELEVATE, not CONCLUDE. The thesis is absorbing hits without adapting — it's at the wrong altitude.

## Evidence Gate for ELEVATE

The "Original" ELEVATE trigger (altitude wrong or amputated counters) requires **E ≥ 0.4**. If the altitude appears wrong but E < 0.4, the critique doesn't have enough evidence to know what the right altitude *is*. Elevating on thin evidence produces a guess, not a grounded reframe.

- E < 0.4 AND altitude suspect → **CONTINUE** with `altitude_suspect: true` and `data_needed` explaining what evidence would clarify the right altitude
- E ≥ 0.4 AND altitude wrong → **ELEVATE** with full preservation gate

**Note:** The Lakatosian, Adversarial, and Chamberlin eager ELEVATE triggers (see Decision section) do NOT require E ≥ 0.4 — they have their own triggering logic. The evidence gate applies only to the Original trigger.

## Decision

| Decision | When | Required Output |
|----------|------|-----------------|
| CONTINUE | Evidence gaps exist, addressable with data | What specific data resolves it? |
| CONCLUDE | Thesis robust at right altitude, no amputated counters, no BROKEN claims | The bet + falsification trigger |
| ELEVATE | Any eager trigger fires (see below) | Elevated thesis + what it preserves + what it resolves |

### Eager ELEVATE Triggers

ELEVATE fires when ANY of these conditions is met:

1. **Original**: E >= 0.4 AND altitude wrong or amputated counters detected (unchanged)
2. **Lakatosian**: `consecutive_degenerating >= 2` — programme has been degenerating for 2+ iterations
3. **Adversarial**: red team search BROKEN a load-bearing claim AND no non-ad-hoc repair exists within the current frame
4. **Chamberlin** (late): Viable alternate frame AND `consecutive_degenerating >= 1`

ELEVATE no longer waits for exhaustive failure. It fires the moment sustained degeneration is detected.

**CONCLUDE only when you can state:**
- The bet: "X > Y because mechanism Z"
- Falsification: What specific conditions would flip this?
- Amputation check: No material counters were acknowledged without changing the thesis

**ELEVATE requires:**
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

preservation:
  correctly_identifies: [specific sound content]
  correctly_frames: [valuable framing to keep]
  must_retain: [non-negotiable elements]

decision: [CONTINUE | CONCLUDE | ELEVATE]

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

programme_status:
  assessment: PROGRESSIVE | DEGENERATING | STAGNANT
  evidence_for_assessment: "..."
  consecutive_degenerating: 0

alternate_frame:
  active: true/false
  frame: "..."
  viable: true/false
  explains_evidence: ["..."]
  misses: ["..."]
  explorer_spawned: false
```

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

After writing your critique output, updating `state.json` with the decision field (`continue`, `conclude`, or `elevate`), programme_status, alternate_frame, and convergence (if a convergence check was performed), and appending to `thesis-history.md`, **stop responding immediately**. Do not write anything else. Do not begin any next phase. Do not write transition headers. Do not set `loop` to any other value. Your response ends here — the stop hook reads `state.json` and handles what comes next.
