---
name: dialectic
description: Multi-pass strategic reasoning with expansion, compression, and critique cycles. Analyzes complex strategic questions through iterative exploration and structured synthesis. Use when facing ambiguous problems requiring deep analysis, thesis validation, or confidence-calibrated recommendations.
---

# N-Pass Strategic Reasoning

Iterative reasoning architecture that separates divergent exploration from convergent synthesis.

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  EXPANSION  │────▶│ COMPRESSION │────▶│   CRITIQUE  │
│  (diverge)  │     │  (converge) │     │  (decide)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
      ▲                                        │
      │              ┌─────────────────────────┼─────────────────────────┐
      │              │                         │                         │
      │              ▼                         ▼                         ▼
      └────── [CONTINUE]                 [CONCLUDE]                 [ELEVATE]
              loop back                        │                  re-enter formation
                                               │
                     [REJECT] re-loop once on a counter-thesis, or end as refutation
                                               │
                                        ┌──────┴──────┐
                                        │  HOLDOUT    │ (if --holdout)
                                        │  (validate) │
                                        └──────┬──────┘
                                               │
                                        ── stop hook ──
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                                    ▼                     ▼
                             ┌─────────────┐       ┌─────────────┐
                             │ DISTILLATION │       │    FORGE    │
                             │ (compress)   │       │  (build)    │
                             └──────┬───────┘       └──────┬──────┘
                                    │                      │
                             iterates until         iterates until
                             memo finalized         spec finalized
```

## Commands

| Command | Purpose |
|---------|---------|
| `/dialectic:dialectic` | Run the reasoning loop (expansion → compression → critique). Use `--holdout` for post-loop validation. |
| `/dialectic:dialectic-distill` | Distill reasoning artifacts into conviction memo (holdout-aware) |
| `/dialectic:forge` | Synthesize reasoning into engineering build spec (holdout-aware) |
| `/dialectic:cancel-dialectic` | Cancel active session and preserve artifacts |

## Pass Selection

| Pass | When to Use | Output |
|------|-------------|--------|
| **Expansion** | Starting analysis or exploring new threads | Marked reasoning with `[INSIGHT]`, `[EVIDENCE]`, etc. |
| **Compression** | After expansion, to synthesize findings | Structured state (insights, tensions, threads, confidence) |
| **Critique** | After compression, to decide next action | Decision (CONTINUE/CONCLUDE/ELEVATE/REJECT) with reasoning |
| **Synthesis** | After the loop concludes, via `/dialectic:dialectic-distill` | Final thesis with confidence and key evidence |
| **Escape Hatch** | Max iterations reached with low confidence | Honest assessment of blockers and limitations |

## Working Memory Format

Passes receive working memory as context. Standard format:

```
## Working Memory (After Cycle N)

### Validated Insights
1. [claim]

### Unresolved Tensions
- [description of conflicting evidence]

### Threads to Explore
- [topic]: [why it matters]

### Confidence: R=0.XX E=0.XX C=0.XX (lowest: 0.XX)
```

## Pass Instructions

**Expansion**: See [EXPANSION.md](EXPANSION.md)
**Compression**: See [COMPRESSION.md](COMPRESSION.md)
**Critique**: See [CRITIQUE.md](CRITIQUE.md) — includes 6 questioning techniques, problem-type routing, 3D confidence
**Synthesis**: See [SYNTHESIS.md](SYNTHESIS.md)
**Escape Hatch**: See [ESCAPE-HATCH.md](ESCAPE-HATCH.md)

## Post-Loop Synthesis

**Holdout**: See [HOLDOUT.md](HOLDOUT.md) — partitioned adversarial audit (3 attack passes, verdict: VALIDATED/CHALLENGED/FRACTURED)
**Forge**: See [FORGE.md](FORGE.md) — build spec synthesis with marker translation (evidence→constraints, counters→risks, tensions→decision points)

### Workflow Examples

```
Fast conviction:      /dialectic "thesis" → /dialectic-distill
Fast build:           /dialectic "thesis" → /forge
Validated conviction: /dialectic --holdout "thesis" → /dialectic-distill
Validated build:      /dialectic --holdout "thesis" → /forge
Full package:         /dialectic --holdout "thesis" → /forge + /dialectic-distill
```

## Semantic Markers

All passes use consistent semantic markers. See [MARKERS.md](MARKERS.md) for definitions and usage.

## 3D Confidence Model

Single scalar confidence conflates reasoning quality, evidence quality, and conclusion certainty. Use three independent dimensions:

- **R (Defensibility)**: Can the thesis survive scrutiny? (0.0-1.0)
- **E (Evidence saturation)**: Would more evidence change the picture? (0.0-1.0)
- **C (Domain determinacy)**: How far can any claim in this domain be settled? (0.0-1.0)

Verdict language keys off the lowest of R, E, C — a chain is as strong as its weakest dimension; never average the three.

See [COMPRESSION.md](COMPRESSION.md) and [CRITIQUE.md](CRITIQUE.md) for details.

## Termination Conditions

The stop hook owns every transition. The reasoning loop terminates when any of:
1. **Conclusion**: Critique decides the thesis is robust (CONCLUDE) and `iteration ≥ min_iterations`. Below the floor, the hook overrides CONCLUDE to CONTINUE.
2. **Refutation**: Critique decides the thesis is refuted (REJECT). The hook re-loops once on a counter-thesis if one was offered; otherwise the run ends as a refutation.
3. **Max cycles**: `iteration ≥ max_iterations`. The hook flags low E or low C (< 0.5) at exit. If the lowest of R, E, C is < 0.5, the [escape hatch](ESCAPE-HATCH.md) applies.

No scalar threshold ends the loop. Verdict strength at termination reads off the lowest of R, E, C — see the bands in [SYNTHESIS.md](SYNTHESIS.md).

## Quick Start

For a new strategic question:

1. Run **Expansion** pass with the question and empty working memory
2. Run **Compression** pass on the expansion output
3. Run **Critique** pass to decide: CONTINUE, CONCLUDE, ELEVATE, or REJECT
4. If CONTINUE: the hook advances the iteration and loops back to step 1 (with `--pace=manual`, it pauses; run `/dialectic:dialectic` to resume)
5. If CONCLUDE: the hook exits the loop. Run `/dialectic:dialectic-distill` for the conviction memo or `/dialectic:forge` for the build spec — synthesis does not run inside the loop
6. If ELEVATE: the hook re-enters formation with the elevated thesis and loops back to step 1
7. If REJECT: the hook re-loops once on a counter-thesis, or ends the run; run `/dialectic:dialectic-distill` for the refutation memo
