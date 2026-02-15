# Compression Pass

Convergent synthesis phase. Goal: distill expansion to decision-relevant state.

## Instructions

1. **Scan for markers** — Process all `[INSIGHT]`, `[EVIDENCE]`, `[COUNTER]`, etc.
2. **Validate insights** — Does evidence support each insight? Do counters weaken it?
3. **Assign confidence** — 0.0-1.0 based on evidence balance
4. **Resolve or carry tensions** — Can conflicting evidence be reconciled?
5. **Flag unexplored threads** — What still needs investigation?

## Evidence Strength Rating

Rate each claim's evidence:
- **5**: Observed data with citation (financials, metrics)
- **4**: Reported by credible source
- **3**: Inferred from patterns
- **2**: Assumed based on general knowledge
- **1**: Speculation / no evidence

Claims rated 1-2 are evidence gaps.

## Output Format (YAML)

```yaml
insights:
  - claim: "..."
    evidence: ["..."]
    counters_addressed: ["..."]
    evidence_rating: [1-5]

tensions:
  - description: "..."
    resolved: true/false
    resolution: "..." # if resolved

threads:
  - topic: "..."
    why: "..."
    explored: true/false

confidence:
  R: 0.XX  # defensibility
  E: 0.XX  # evidence saturation
  C: 0.XX  # domain determinacy
  R_note: "..." # what would break the argument
  E_note: "..." # what evidence is missing or saturated
  C_note: "..." # what makes this domain uncertain

termination:
  should_continue: true/false
  reason: "reasoning_flaw|evidence_unsaturated|saturated|all_threads_explored"
```

## Confidence: Three Dimensions

Do not use a single scalar. Three dimensions, three different questions, no composite.

### R — Defensibility: Can this survive scrutiny?

R is a **gate**, not a score. A fallacy in the chain means the conclusion doesn't follow, regardless of evidence. High E cannot compensate for low R. Fix reasoning before gathering more evidence.

```
No fallacy found this cycle → R moves slowly toward prior
  R = R + (0.85 - R) * 0.15
Fallacy found → R drops fast
  R = R - 0.2 per identified fallacy, floor 0.3
```

### E — Evidence Saturation: Would more evidence help?

E drives the **CONTINUE/CONCLUDE decision**. Not "is the evidence good?" but "has the marginal value of another iteration approached zero?"

*Ask*:
- What is the strongest piece of evidence I haven't looked for?
- If I found it, how much would it change the thesis?
- Am I seeing the same patterns repeated (saturated) or new patterns each time (unsaturated)?

```
Redundant confirming evidence  → E = E + 0.02
Novel confirming evidence      → E = E + 0.08
Contradicting evidence found   → E = E - 0.15
Contradiction addressed        → E = E + 0.10
```

### C — Domain Determinacy: What are the limits of this claim?

C measures how much certainty the *domain* permits. C is **discovered, not optimized** — if C drifts upward across iterations without new evidence, that's motivated reasoning. More iterations don't reduce ontological uncertainty.

C does not drive iteration. C drives **how you hold the claim**:

| C Range | Memo Tone |
|---------|-----------|
| 0.7+ | "Act on this." |
| 0.5–0.7 | "Hold this provisionally. Here's the release condition." |
| < 0.5 | "Best frame available. Here's what would need to change." Reference `skills/dialectic/ESCAPE-HATCH.md`. |

## Decision Table

| Pattern | Response |
|---------|----------|
| R low | CONTINUE — fix reasoning first |
| R ok, E low | CONTINUE — gather data if marginal value is high |
| R ok, E saturated, any C | CONCLUDE — C determines tone, not whether to stop |
| R ok, E mixed, C contradicts E | ELEVATE — the frame is wrong |

## Termination Signals

R and E drive whether you continue. C drives how you write the conclusion.

**CONTINUE**: R < 0.6, or E < 0.6 with identifiable productive evidence remaining, or E delta > 0.05 between last two cycles.

**CONCLUDE**: R ≥ 0.7 AND E saturated (delta < 0.05 for 2 cycles or no productive threads). Do not wait for C to rise.

**ELEVATE**: R and E adequate but C contradicts the evidence pattern.
