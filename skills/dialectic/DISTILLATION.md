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

**Mine, don't index.** The scratchpad is the ore body; the thesis string is one assay of it. `thesis.current` is a palimpsest — its clause order records the history of rewrites, not the ranking of claims. The elevation that reframed iteration 1 will still sit at the front of the sentence in iteration 5, whether or not it is still the point. Do not inherit its order.

Re-read the full scratchpad and rank every surviving claim by decision value:

- **Kills survived** — how many named kill attempts did this claim pass? Count the Survival probes that targeted it.
- **Confidence moved** — did finding it shift R or E? Check the confidence notes.
- **Price attached** — does it name an observable market price or measurable quantity?
- **Counterparty named** — does it say who is wrong and why?

The spine's `thesis:` leads with the highest-ranking claim. In an adversarial loop the sharpest claims are usually the latest — they survived the most kills — while the earliest elevation is usually scaffolding by the end. Scaffolding goes in `evolution:`, not the thesis.

Walk the scratchpad chronologically. Determine what survived:

| Marker | Survived if... | Dies if... |
|--------|---------------|------------|
| `[INSIGHT]` | No later `[COUNTER]` killed it, no Critique superseded it | Refuted by evidence, superseded by elevation |
| `[EVIDENCE]` | Strength ≥ 3, still relevant to final thesis | Stale, contradicted, or irrelevant to final frame |
| `[TENSION]` | Resolved with mechanism, or carried as open risk | Left hanging with no resolution attempt |
| `[COUNTER]` | Addressed in Critique or Refutatio | Ignored entirely |
| any marker | — | Killed by a REJECT's refuting_basis: record status `killed`, keep it in the spine |

Harvest the Critique passes' preservation gates — "what must any elevation retain?" Those answers *are* the load-bearing claims.

Mark each surviving claim: **would removing it collapse the argument?** If yes, it's load-bearing.

Write spine to `.claude/dialectic/spine.yaml` (see Output Format below).

### Spine Validation

- Every load-bearing claim has evidence with strength ≥ 3
- Every evidence atom carries the source compression gave it — a spine atom without its source is a rumor with a strength score
- Causal chain connects thesis to claims without gaps
- No survived claim depends on a superseded claim

*If validation fails, the reasoning loop left gaps. Note them as open risks.*

### Killed claims stay visible

A claim with status `killed` must appear in the memo's refutatio with what killed it. Claims that die must stay visibly dead — a spine that silently drops its dead is lying about the fight.

### Refutation memos

If `thesis.status` is `"refuted"`, the memo's verdict is the refutation: state what the thesis claimed, the refuting basis (quoted from the spine), and what evidence would resurrect it. Same probes, same compression gate — a refutation memo is still a conviction memo.

### Tailings (what the mine didn't take)

Spine extraction is itself a compression, and nothing above audits what it drops. After writing the spine, sweep the scratchpad once more for:

- `[THREAD]`s never explored and `not_yet_investigated` items never picked up
- `[INSIGHT]`s and `[BRIDGE]`s that appear in no claim
- Evidence atoms with strength ≥ 4 attached to no claim
- Tensions carried as unresolved that the memo never mentions

Write them to `tailings:` in spine.yaml. On pass 1, give each tailing a disposition: `promote` (it belonged in a claim — add it) or `discard` with a one-line reason. A tailing with no disposition blocks CONCLUDE. Check the tailings when drafting Disconfirmation Triggers — unexplored threads are where the disconfirmation usually lives.

## Distillation Probes

Run all six against each draft:

| Probe | Question | Failure Mode |
|-------|----------|--------------|
| Trace | Every load-bearing claim in the memo? Every memo claim in the spine? | Dropped structure or unsupported assertion |
| Tension | Does each counter-argument *strengthen* the thesis, not just get dismissed? | Amputation instead of elevation |
| Sufficiency | Could the reader act on this without the scratchpad? | Missing decision-relevant information |
| Conviction-Ink | Does every sentence advance the argument, provide evidence, or acknowledge risk? | Hedging, throat-clearing, decoration |
| Threads | ≤3 independent argument threads held simultaneously? | Cognitive overload — compression failed |
| Position | Does the memo name a mispricing and a counterparty who would recognize themselves as being called wrong? | Mean-fallacy convergence — "all options are one thing" ranks nothing and offends no one |

**Position probe detail:** A convergence-shaped lead ("X and Y are really the same phenomenon") is a mechanism, not a headline — demote it to the Leap's supporting logic unless the unification itself changes an allocation. The test is exclusion: the memo must tell the reader what NOT to do that reasonable people are currently doing, and name who is on the other side of the bet. If everyone the memo mentions could read it and feel confirmed, the probe fails.

Each pass appends a `probe_results:` block to the scratchpad — one entry per probe, each quoting the memo sentence that decided its verdict. For whole-memo probes (Trace, Threads), quote the sentence that came closest to failing. A probe that names no sentence examined nothing.

```yaml
probe_results:
  - probe: conviction_ink
    examined: "[the memo sentence, quoted verbatim]"
    verdict: [PASS | FAIL] — [what the sentence does or fails to do]
```

On pass 2+ the probes run adversarially (see SYNTHESIS.md's pass-2 column): quote the weakest sentence you can find, not the one that passes most easily.

## Compression Gate (Required)

Cannot conclude without answering:

1. **What was lost?** Name specific claims, evidence, or tensions from the spine that don't appear in the memo. For each: is the loss acceptable (not decision-relevant) or structural (breaks the argument)?
2. **What was elevated?** Where does the memo show a counter-argument *making the thesis stronger* rather than just being noted as a risk?
3. **What is the shortest version?** Could any sentence be removed without breaking the argument? If yes, remove it.
4. **What jargon did the run coin?** List every term in the memo that appears in the spine or scratchpad but not in the original prompt or in common usage. Compression rewards coined shorthand; deliverables must pay it back out. Each coinage is either introduced by its plain-language mechanism before first use, or replaced with the mechanism itself.

*If you can't answer #1, you haven't compared against the spine. Return to trace probe.*

## Decision

| Decision | When | Required Output |
|----------|------|-----------------|
| CONCLUDE | All 6 probes pass + compression gate complete | Decision in state.json + `[ANALYSIS_COMPLETE]` |
| CONTINUE | Any probe fails or gate incomplete | Which probe failed + specific fix |

**CONCLUDE only when you can state:**
- Every load-bearing claim is present
- Every counter-argument elevates rather than amputates
- No sentence can be removed without structural loss
- Every tailing has a disposition; every coined term is unpacked before use

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
      status: survived  # survived | superseded | weakened | killed
      evidence: [E1, E3]
      depends_on: []
      load_bearing: true

  evidence:
    - id: E1
      statement: "<data point>"
      strength: 4  # 1-5 scale
      source: "<URL, document, or 'prior'>"  # carried from compression

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

  tailings:
    - item: "<dropped thread, insight, or evidence>"
      source: "<scratchpad location — iteration N, marker type>"
      disposition: promote  # promote | discard
      reason: "<one line>"
```

### Memo

Target format defined in `SYNTHESIS.md`. That file is the spec — headline, situation, leap, refutatio, bet, implementation, disconfirmation, verdict.

Cut every unnecessary word. Compress until removing one more word breaks structure. That's your length.

Write draft to `.claude/dialectic/memo-draft.md`. The stop hook promotes the final draft to `memo-final.md` on conclude.

## CRITICAL: One Pass Per Response

Each distillation pass is a separate response. After completing one pass (spine + draft + probes on pass 1, or revisions + probes on pass 2+), write your decision to `state.json` and **stop responding**. Do not begin the next pass. Do not write to memo-final.md — the stop hook promotes the draft on conclude. The stop hook enforces the minimum pass requirement — it will re-feed you for the next pass.

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

## Promotion Formatting

When promoting `memo-draft.md` to final, rename section headers for a professional reader. The protocol names are useful during distillation (probes reference them) but read as framework jargon in a deliverable. Apply this mapping:

| Draft Header | Final Header |
|---|---|
| `## Headline Insight` | Remove header entirely — make the text **bold** as an opening statement |
| `## Situation` | `## Context` |
| `## The Leap` | `## Core Thesis` |
| `## Brief Refutatio` | `## The Counter-Argument` |
| `## The Bet` | `## Position` |
| `## First Move` | `## Recommended Actions` |
| `## Disconfirmation Triggers` | `## What Would Change This View` |
| `## Verdict` | `## Decision` |

If the memo has a title line (e.g., `# NuServ Series B: Investment Committee Memo`), keep it. The Headline Insight text becomes the opening bold statement immediately after the title, with no section header.

Do not change any content — only headers. The probes already validated the substance; this is a formatting pass only.

Sources: RESOURCES.md

## CRITICAL: Stop After Each Distillation Pass

After completing one pass (spine + draft + probes on pass 1, or revisions + probes on pass 2+), write your decision to `state.json` and **stop responding immediately**. Do not begin the next pass. Do not write to memo-final.md — the stop hook promotes the draft on conclude. Do not set `loop: "complete"` yourself. Do not remove evidence from state. The stop hook owns all transitions — it reads `state.json`, enforces the minimum pass requirement, and re-feeds you for the next pass or finalizes the session.
