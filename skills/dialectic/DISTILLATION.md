---
name: dialectic-distillation
description: Compress completed reasoning into actionable conviction memo without structural loss. Extracts reasoning spine from scratchpad, drafts against SYNTHESIS.md spec, runs fidelity and clarity checks, revises until both pass.
---

# Distillation Pass

Compress reasoning into a memo where every sentence earns its place.

## Input Required

Needs completed reasoning loop with:
- Scratchpad (`.claude/dialectic/scratchpad.md`) — full reasoning with markers
- State (`.claude/dialectic/state.json`) — final thesis, confidence, evidence
- Thesis history (`.claude/dialectic/thesis-history.md`) — iteration trajectory

If no scratchpad exists, reasoning loop hasn't run. Stop.

## Spine Extraction (first distillation iteration only)

Walk the scratchpad chronologically. Determine what survived:

| Marker | Survived if... | Dies if... |
|--------|---------------|------------|
| `[INSIGHT]` | No later `[COUNTER]` killed it, no Critique superseded it | Refuted by evidence, superseded by elevation |
| `[EVIDENCE]` | Strength ≥ 3, still relevant to final thesis | Stale, contradicted, or irrelevant to final frame |
| `[TENSION]` | Resolved with mechanism, or carried as open risk | Left hanging with no resolution attempt |
| `[COUNTER]` | Addressed in Critique or Refutatio | Ignored entirely |

Harvest the Critique passes' preservation gates — "what must any elevation retain?" Those answers *are* the load-bearing claims.

Mark each surviving claim: **would removing it collapse the argument?** If yes, it's load-bearing.

Write spine to `.claude/dialectic/spine.yaml` (see Output Format below).

### Spine Validation

- Every load-bearing claim has evidence with strength ≥ 3
- Causal chain connects thesis to claims without gaps
- No survived claim depends on a superseded claim

*If validation fails, the reasoning loop left gaps. Note them as open risks.*

## Distillation Probes

Run all five against each draft:

| Probe | Question | Failure Mode |
|-------|----------|--------------|
| Trace | Every load-bearing claim in the memo? Every memo claim in the spine? | Dropped structure or unsupported assertion |
| Tension | Does each counter-argument *strengthen* the thesis, not just get dismissed? | Amputation instead of elevation |
| Sufficiency | Could the reader act on this without the scratchpad? | Missing decision-relevant information |
| Conviction-Ink | Does every sentence advance the argument, provide evidence, or acknowledge risk? | Hedging, throat-clearing, decoration |
| Threads | ≤3 independent argument threads held simultaneously? | Cognitive overload — compression failed |

## Compression Gate (Required)

Cannot conclude without answering:

1. **What was lost?** Name specific claims, evidence, or tensions from the spine that don't appear in the memo. For each: is the loss acceptable (not decision-relevant) or structural (breaks the argument)?
2. **What was elevated?** Where does the memo show a counter-argument *making the thesis stronger* rather than just being noted as a risk?
3. **What is the shortest version?** Could any sentence be removed without breaking the argument? If yes, remove it.

*If you can't answer #1, you haven't compared against the spine. Return to trace probe.*

## Decision

| Decision | When | Required Output |
|----------|------|-----------------|
| CONCLUDE | All 5 probes pass + compression gate complete | Final memo + `[ANALYSIS_COMPLETE]` |
| CONTINUE | Any probe fails or gate incomplete | Which probe failed + specific fix |

**CONCLUDE only when you can state:**
- Every load-bearing claim is present
- Every counter-argument elevates rather than amputates
- No sentence can be removed without structural loss

Write decision to state.json `decision` field, then **stop responding**. The stop hook reads the decision and either allows exit (if passes ≥ minimum and decision is CONCLUDE) or re-feeds you for the next pass.

## Output Format

### Spine (`spine.yaml`)

```yaml
spine:
  thesis: "<final thesis>"
  evolution: "<one sentence: how it changed>"

  claims:
    - id: C1
      claim: "<specific claim>"
      status: survived  # survived | superseded | weakened
      evidence: [E1, E3]
      depends_on: []
      load_bearing: true

  evidence:
    - id: E1
      statement: "<data point>"
      strength: 4  # 1-5 scale

  causal_chain:
    - from: C1
      to: C2
      mechanism: "<because X, therefore Y>"

  resolved_tensions:
    - tension: "<X vs Y>"
      resolution: "<reconciled by Z>"

  open_risks:
    - risk: "<what if>"
      severity: high  # high | medium | low
```

### Memo

Target format defined in `SYNTHESIS.md`. That file is the spec — headline, situation, leap, refutatio, bet, implementation, disconfirmation, verdict.

Cut every unnecessary word. Compress until removing one more word breaks structure. That's your length.

Write draft to `.claude/dialectic/memo-draft.md`. Write final to `.claude/dialectic/memo-final.md`.

## CRITICAL: One Pass Per Response

Each distillation pass is a separate response. After completing one pass (spine + draft + probes on pass 1, or revisions + probes on pass 2+), write your decision to `state.json` and **stop responding**. Do not begin the next pass. Do not promote to final without stopping first. The stop hook enforces the minimum pass requirement — it will re-feed you for the next pass.

If this is pass 1: extract spine, draft memo, run probes, write decision, stop.
If this is pass 2+: revise based on previous probe findings, re-run probes in adversarial mode, write decision, stop.

## Example: VC Capital Allocation (After 4 Reasoning Iterations)

**Spine extraction (abbreviated):**
```yaml
spine:
  thesis: "Deploy $100-500M funds at Seed/Series A into AI companies becoming systems of record in underdigitized, regulated industries"
  evolution: "Started as 'application layer > foundation models' — refined to specific archetypes, portfolio construction, and correction-survival strategy"

  claims:
    - id: C1
      claim: "Foundation model valuations make venture returns impossible"
      status: survived
      evidence: [E1, E2]
      load_bearing: true
    - id: C2
      claim: "Open-source commoditizes model layer, shifts value to applications"
      status: survived
      evidence: [E3]
      load_bearing: true
    - id: C3
      claim: "Four archetype patterns predict moat durability"
      status: survived
      evidence: [E4, E5]
      load_bearing: true
    - id: C4
      claim: "Agentic middleware is strong opportunity"
      status: weakened
      evidence: [E6]
      load_bearing: false  # overcrowding evidence weakened it

  causal_chain:
    - from: C1
      to: C2
      mechanism: "If models can't return venture capital and open-source matches proprietary quality, value must flow to whoever owns the data and workflow"
    - from: C2
      to: C3
      mechanism: "If value flows to applications, durability depends on moat type — SoR, data flywheel, regulatory wedge, physical-digital bridge compound; wrappers don't"

  open_risks:
    - risk: "AGI concentrates value at model layer"
      severity: high
    - risk: "AI adoption stalls — 95% pilot ROI failure"
      severity: high
```

**Tension probe applied to draft:**
- Draft says "AGI is a low-probability wild card" → **FAIL** — this amputates rather than elevates
- Revised: "The portfolio accounts for the AGI scenario through frontier bets (5%) and disconfirmation triggers — if foundation models achieve transformative capability, the triggers fire and the strategy pivots. The framework doesn't ignore AGI; it prices it." → **PASS** — counter-argument strengthens the thesis by showing the framework's resilience

**Compression gate:**
1. Lost: Specific sector TAM numbers, individual company valuations, historical platform shift details → Acceptable loss (supporting detail, not decision-relevant)
2. Elevated: "AI bubble risk" → becomes "correction-survival *validates* the seed/moat strategy" — the risk makes the thesis stronger
3. Shortest version: Removed "this is similar to cybersecurity post-GDPR" — analogy adds color but not structure

---

## CRITICAL: Stop After Each Distillation Pass

After completing one pass (spine + draft + probes on pass 1, or revisions + probes on pass 2+), write your decision to `state.json` and **stop responding immediately**. Do not begin the next pass. Do not promote a draft to final without stopping first. Do not set `loop: "complete"` yourself. Do not remove evidence from state. The stop hook owns all transitions — it reads `state.json`, enforces the minimum pass requirement, and re-feeds you for the next pass or finalizes the session.
