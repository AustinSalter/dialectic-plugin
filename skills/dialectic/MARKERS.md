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
| `[RED_TEAM]` | Adversarial finding | Counter-evidence from targeted disconfirming search (with severity: SURVIVED/CHALLENGED/BROKEN) |
| `[AMBIGUOUS]` | Ambiguous evidence | Evidence the loop found but cannot interpret without domain context |
| `[COUNTER:programme]` | Competing programme | Counter-evidence implying a fundamentally different hard core, not just a challenge to the protective belt |

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

## Marker Quality Targets

In expansion passes, aim for:
- Multiple `[COUNTER]` markers (challenge the obvious answer)
- At least one `[TENSION]` (find conflicting evidence)
- `[THREAD]` markers for unexplored areas
- Specific `[EVIDENCE]` with sources when available

## Compression Rules

When compressing marked content:
1. Each `[INSIGHT]` needs supporting `[EVIDENCE]` to be validated
2. `[COUNTER]` markers may weaken insights—adjust confidence accordingly
3. Unresolved `[TENSION]` markers carry forward to next cycle
4. Unexplored `[THREAD]` markers flag areas for continued investigation
5. `[RED_TEAM]` markers carry severity ratings — `SURVIVED` claims get higher confidence, `CHALLENGED` claims need integration, `BROKEN` claims require thesis repair
6. `[AMBIGUOUS]` markers carry forward until resolved by human interpretation (`[INTERPRET:human]`) or by subsequent evidence
7. `[COUNTER:programme]` markers signal competing programmes — these are not resolved by patching the protective belt
