---
name: dialectic-expansion
description: Frame selection and divergent exploration for thesis evaluation. Use at the start of dialectic analysis to establish the right altitude and gather relevant evidence. Always run before critique pass. Outputs framed findings with semantic markers.
---

# Expansion Pass

Two jobs: (1) Select the right frame, (2) Gather evidence within it.

## Phase 1: Frame Selection (Do First)

Before searching, answer these:

**What is this thesis trying to protect?**
Not what it claims—what concern motivates it.
- "Pass on this investment" → capital preservation
- "Adopt probable cause" → student privacy rights
- "Enter this market" → growth / competitive position

**What altitude should we operate at?**

| Level | Symptom | Example |
|-------|---------|---------|
| TOO GRANULAR | Accurate details, no pattern | "Their API docs are better" |
| RIGHT LEVEL | Mechanism + transferability | ​"Developer adoption creates compounding switching costs" |
| TOO ABSTRACT | Pattern named, no mechanism | "They have network effects" |
| TOO ABSTRACT | Action prescribed, no causal path | "We should vertically integrate to control costs" (integrate what? through what mechanism? why does ownership reduce costs here?) |

**Altitude test for action-prescribing theses**: If the thesis prescribes an action ("build X", "invest in Y", "ban Z"), list the causal steps between the action and the claimed outcome. Write them out:

```
Action: [what the thesis prescribes]
Step 1: [first thing that happens]
Step 2: [what that causes]
Step 3: [how that produces the claimed outcome]
```

If you cannot list 3+ concrete steps, the thesis is **TOO ABSTRACT** even if it sounds specific. "Vertically integrate" sounds like a strategy but skips the causal chain: acquire supplier → ??? → lower costs. The missing middle is the altitude problem. Mark `altitude: TOO_ABSTRACT` and identify where the causal chain breaks.

**Which domain applies?**

| Signals | Domain | Patterns |
|---------|--------|----------|
| network effects, platform, liquidity, marketplace | Marketplace | patterns/marketplace.md |
| API, developer, switching costs, infrastructure | Infrastructure | patterns/infrastructure.md |
| rating, correlation, model, hedge, diversification | Financial | patterns/financial.md |
| standard, precedent, implementation, enforcement | Policy | patterns/policy.md |
| disruption, incumbent, cost curve, physics | Disruption | patterns/disruption.md |

**Output frame before proceeding:**

```yaml
frame:
  protecting: [what concern motivates thesis]
  altitude: [TOO_GRANULAR | RIGHT_LEVEL | TOO_ABSTRACT]
  altitude_adjustment: [if not RIGHT_LEVEL, what level should it be?]
  domain: [domain name or "general"]
  probes_to_run: [from domain pattern file]
```

## Phase 2: Guided Search

Gather evidence *within the selected frame*.

**Search targets (prioritize based on domain):**

1. **Supporting evidence** — What confirms the frame?
2. **Challenging evidence** — What contradicts it?
3. **Second-order effects** — "If X, then Y, then Z"
4. **Anomalies** — Smart people on other side, unexplained data

**Mark findings with:**

| Marker | Use |
|--------|-----|
| `[EVIDENCE]` | Concrete data, verifiable facts |
| `[COUNTER]` | Challenges the obvious answer |
| `[TENSION]` | Conflicting evidence, unresolved |
| `[THREAD]` | Worth deeper investigation |
| `[INSIGHT]` | Pattern, connection, reframe |

**Reading sources**

Read in flow, not in extraction mode.

As you read, be alert to four things. Emit markers when you notice them. Don't hunt for them.

**Position.** Where does this source sit?
- `[PRIMARY]` — original assertion, original data, first to say it
- `[DOWNSTREAM]` — paraphrasing or restating someone else's claim
- `[CRITIQUE]` — arguing against a claim you've seen
- `[SYNTHESIS]` — combining prior claims into new framing

Five downstream sources are one source. One primary against four downstream is not "outnumbered." Position changes the math.

**Load-bearing parts.** What does the argument actually rest on? Often the buried qualifier, the conceded footnote, the aside that constrains the headline claim. Query-relevant ≠ load-bearing. Notice the part the author would lose sleep over if it were wrong.

**Incentive.** Who benefits if this is believed? Be specific: "vendor selling X," "researcher whose prior work depends on Y." Aligned incentive doesn't make a source wrong — it makes it a source whose load-bearing parts deserve harder reading.

**Stitch points.** When this source connects to one you've already read — bridges a gap, resolves a tension, sharpens a contradiction — name it as it happens: `[BRIDGE: A→B]`. The non-obvious findings live in the joins, not in any single source. If your output is converging on the obvious, you're missing the stitches.

**Reading heuristics:**
- Read in the order fetched. Earlier sources frame later ones.
- Don't restart your reasoning per source. Carry it.
- A source that doesn't shift anything is worth one line.
- A source that shifts the frame is worth a paragraph.
- If every source agrees, ask what they all share that might be wrong. Consensus is a position too.
- Budget 3-5 fetches per expansion pass
- Mark search-sourced evidence with `[EVIDENCE:web]` vs training-data evidence with `[EVIDENCE:prior]`
- Note what you searched for but couldn't find
- If no fetch is possible, state this so the user knows evidence is from training data only

**What this is not**: Not a per-source extraction schema. Not a checklist run on each fetch. Not a parser. A way of reading.

## Do NOT

- Conclude or recommend (critique does that)
- Search outside the frame (reframe first if wrong)
- Ignore counter-evidence (actively seek it)
- Skip frame selection (it's the whole point)

## Output Format

```yaml
frame:
  protecting: [concern]
  altitude: [level]
  domain: [domain]
  probes_to_run: [list]

evidence:
  supporting:
    - "[EVIDENCE] finding 1"
    - "[EVIDENCE] finding 2"
  challenging:
    - "[COUNTER] finding 1"
    - "[COUNTER] finding 2"

tensions:
  - "[TENSION] description of conflict"

threads:
  - "[THREAD] area needing investigation"

insights:
  - "[INSIGHT] pattern or connection"

not_yet_investigated:
  - [what we couldn't look at]
  - [data that would help]
```

## Example

**Thesis:** "Stripe has better documentation and easier integration."

**Frame selection:**
```yaml
frame:
  protecting: Investment in payments company
  altitude: TOO_GRANULAR (features, not structure)
  altitude_adjustment: Should be "developer adoption → switching costs → infrastructure moat"
  domain: Infrastructure
  probes_to_run: [decision_maker, switching_cost, platform_vs_product, copyability]
```

**Guided search:**
```
[EVIDENCE] Stripe processes $1T+ annually, 90%+ of YC companies use it.

[COUNTER] PayPal, Adyen, and Braintree all have APIs. Features are copyable.

[INSIGHT] PayPal founders (Thiel, Musk) invested in Stripe. They see something beyond "better PayPal."

[TENSION] If it's just better docs, why can't incumbents copy? But if it's infrastructure lock-in, why did PayPal founders invest against their own company?

[THREAD] Need to investigate: What are actual switching costs once integrated? Merchant of record, compliance, billing logic?

[EVIDENCE] Stripe Connect, Atlas, Radar suggest platform expansion, not just payments.
```

**Output:**
```yaml
frame:
  protecting: Investment in payments company
  altitude: TOO_GRANULAR → RIGHT_LEVEL needed
  domain: Infrastructure
  probes_to_run: [decision_maker, switching_cost, platform_vs_product, copyability]

evidence:
  supporting:
    - "[EVIDENCE] $1T+ processed, 90%+ YC adoption"
    - "[EVIDENCE] Platform expansion (Connect, Atlas, Radar)"
  challenging:
    - "[COUNTER] Features are copyable by incumbents"

tensions:
  - "[TENSION] PayPal founders investing against own company—suggests different thesis than 'better product'"

threads:
  - "[THREAD] Actual switching costs post-integration"
  - "[THREAD] Merchant of record lock-in mechanism"

insights:
  - "[INSIGHT] Anomalous investor behavior reveals frame mismatch"

not_yet_investigated:
  - Churn rates for integrated customers
  - Cost to migrate away from Stripe
```

Ready for critique pass.
