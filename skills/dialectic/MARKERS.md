# Semantic Markers

Use these markers to structure reasoning output. Markers enable extraction and tracking across passes.

## Marker Definitions

| Marker | Purpose | When to Use |
|--------|---------|-------------|
| `[INSIGHT]` | Non-obvious conclusion | Findings that require synthesis, not just observation |
| `[EVIDENCE]` | Specific data point | Concrete facts, metrics, or quotes supporting a claim |
| `[RISK]` | Potential downside | Failure modes, threats, or negative scenarios |
| `[COUNTER]` | Argument against | Challenges to the emerging thesis or assumption |
| `[TENSION]` | Conflicting evidence | When data points contradict each other |
| `[THREAD]` | Worth exploring | Areas that need deeper investigation |
| `[QUESTION]` | Open question | Specific unknowns requiring resolution |

## Usage Examples

**Good marker usage:**
```
[INSIGHT] The 40% margin compression isn't cost-driven—it's pricing power erosion from commoditization.

[EVIDENCE] Q3 earnings call: "We're seeing increased pressure on ASPs across the product line."

[COUNTER] However, R&D spending is up 15% YoY, suggesting they're investing in differentiation.

[TENSION] High R&D spend contradicts the commoditization thesis—either the spend is ineffective or the market hasn't recognized the differentiation yet.
```

**Poor marker usage:**
```
[INSIGHT] Revenue is growing.  # Too obvious, not an insight
[EVIDENCE] The company is doing well.  # Not specific
[RISK] Things might go wrong.  # Too vague
```

## Position Markers

Use these when reading sources. They classify where a source sits, not whether it's right.

| Marker | Use |
|--------|-----|
| `[PRIMARY]` | Source is first to make this claim. Original data, original assertion, original framing. |
| `[DOWNSTREAM]` | Source restates a claim made elsewhere. Paraphrase, summary, secondary reporting. |
| `[CRITIQUE]` | Source argues against a claim you've already encountered. |
| `[SYNTHESIS]` | Source combines prior claims into a new framing not present in any one of them. |
| `[TANGENTIAL]` | Source touches the topic but is mainly about something else. |

Position is not credibility. A primary source can be wrong. A downstream source can be useful. The point is to know what you're counting.

**Five `[DOWNSTREAM]` sources are one source.** Don't double-count consensus.

## Stitch Markers

Use these when sources connect across the read.

| Marker | Use |
|--------|-----|
| `[BRIDGE: A→B]` | A finding that depends on combining source A and source B — present in neither alone. |
| `[RESOLVES: A↔B]` | Source resolves a tension between two prior sources. |
| `[CONTRADICTS: A]` | Source directly contradicts a claim from source A. |
| `[QUALIFIES: A]` | Source narrows or constrains a claim from source A without contradicting it. |

Stitches are where the non-obvious findings live. If your output has no stitch markers, you read sources in parallel but didn't read them together.

## Source Position Markers

Use these when you notice who benefits from a claim.

| Marker | Use |
|--------|-----|
| `[ALIGNED]` | Author's incentive points toward the claim being believed. Not disqualifying — load-bearing parts get harder reading. |
| `[OPPOSING]` | Author's incentive points against the claim. A claim that survives an opposing-incentive source is stronger. |
| `[NEUTRAL]` | No identifiable incentive in either direction. Rare. Use sparingly. |

Mark the incentive, not the verdict. Aligned ≠ wrong. Opposing ≠ right.

## Marker Quality Targets

In expansion passes, aim for:
- Multiple `[COUNTER]` markers — challenge the obvious answer
- At least one `[TENSION]` — find conflicting evidence
- Position markers on every primary or downstream source
- At least one stitch marker — non-obvious findings live in the joins
- Specific `[EVIDENCE]` with sources when available

If you have ten sources and zero stitch markers, you're reading in parallel, not together. Re-read.

## Compression Rules

When compressing marked content:
1. Each `[INSIGHT]` needs supporting `[EVIDENCE]` to be validated
2. `[COUNTER]` markers may weaken insights — adjust confidence accordingly
3. Unresolved `[TENSION]` markers carry forward to next cycle
4. Unexplored `[THREAD]` markers flag areas for continued investigation
5. **Group sources by position before counting evidence.** N downstream sources of one primary claim is one piece of evidence, not N.
6. **Stitch markers outrank single-source findings.** A `[BRIDGE: A→B]` that holds is more compelling than three sources independently saying the same thing.
7. **Aligned-incentive primary sources need a non-aligned corroborator** before their load-bearing claims become validated insights.
