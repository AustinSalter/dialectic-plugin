---
name: dialectic-adversarial
description: Red team search, lightweight inversion, and competing programme detection between expansion and compression. Targets load-bearing claims with disconfirming evidence (Popperian severity), attempts determinate negation (Hegelian inversion) using only evidence already gathered, and flags evidence implying a different hard core (Lakatos).
---

# Adversarial Pass

Three jobs: (1) Red team search, (2) Lightweight inversion, (3) Competing programme detection. Runs AFTER expansion, BEFORE compression.

## Input Required

Needs completed expansion with:
- Frame (protecting, altitude, domain)
- Evidence (supporting, challenging)
- Tensions identified
- Threads flagged
- Any `[AMBIGUOUS]` items / `[INTERPRET:human]` inputs resolved

If no expansion exists, run expansion first.

## Job 1: Red Team Search (Popperian Severe Testing)

### Step 1: Identify Load-Bearing Claims

Identify 2-3 claims the thesis *cannot survive without*. These are not peripheral details — they are the structural pillars. If any one of them falls, the thesis falls.

```yaml
load_bearing_claims:
  - claim: "[the specific claim]"
    why_load_bearing: "[what thesis loses if this is false]"
  - claim: "[the specific claim]"
    why_load_bearing: "[what thesis loses if this is false]"
```

### Step 2: Construct Adversarial Searches

For each load-bearing claim, construct a search designed to *break* it.

**Query rules — NOT "evidence for X":**
- Search for "why X is wrong"
- Search for "problems with X"
- Search for "X fails because"
- Search for critics, failed cases, structural objections

Use `WebSearch` and `WebFetch`. Budget 2-3 `WebSearch` calls total — prioritize claims that are empirical (testable against data or cases) over claims that are definitional or normative.

Mark findings with `[RED_TEAM]` markers:

```
[RED_TEAM] query: "why [claim] fails"
           finding: [what was found]
           severity: [SURVIVED | CHALLENGED | BROKEN]
```

### Step 3: Severity Ratings

After all red team searches, assign a severity rating to each load-bearing claim:

| Rating | Meaning |
|--------|---------|
| SURVIVED | No credible counter-evidence found; claim holds under adversarial search |
| CHALLENGED | Counter-evidence weakens the claim but does not directly falsify it |
| BROKEN | Counter-evidence directly falsifies the claim; thesis must be revised |

## Job 2: Lightweight Inversion (Hegelian Determinate Negation)

Using **only** evidence already gathered in the expansion pass, plus any `[INTERPRET:human]` inputs — **no new searches**.

Construct a 2-3 sentence narrative in which the thesis is wrong.

**Constraint: determinate, not abstract.** The inversion must arise from the thesis's own internal tensions — not from a hypothetical external objection. "The opposite could also be true" is not an inversion. A genuine inversion names the specific mechanism by which the thesis defeats itself.

**Process:**
1. Review all `[TENSION]` and `[COUNTER]` markers from the expansion
2. Ask: do these assemble into a coherent counter-narrative?
3. If yes: write the narrative (2-3 sentences, using only gathered evidence)
4. If no: note what prevents assembly — record whether the block is evidential (missing data) or structural (tensions point in incompatible directions)

**Viable inversion** = competing programme candidate → flag for Job 3.

**Failed inversion** = the thesis's tensions do not assemble into a coherent counter-narrative. Note this as a non-result, not as confirmation.

## Job 3: Competing Programme Detection (Lakatos)

Scan the expansion evidence for signals that a *different* hard core is present — not just a challenge to the current thesis's details, but evidence that implies a fundamentally different explanatory framework.

**Distinction:**

| Type | What it challenges | Marker |
|------|--------------------|--------|
| Counter-argument | Protective belt — a specific claim or prediction | `[COUNTER]` |
| Competing programme | Hard core — the fundamental commitments of the thesis | `[COUNTER:programme]` |

**Detection test:** Does this evidence challenge *a claim the thesis makes*, or does it challenge *the type of explanation the thesis offers*? If the latter, it is a competing programme signal.

**If detected:** Flag for background exploration. The main loop continues without interruption — do not pause, do not switch to exploring the competing programme.

## Output Format

```yaml
adversarial:
  red_team:
    load_bearing_claims:
      - claim: "[claim 1]"
        why_load_bearing: "[why]"
      - claim: "[claim 2]"
        why_load_bearing: "[why]"
    searches_run:
      - query: "[adversarial query used]"
        target_claim: "[which load-bearing claim this targets]"
        findings: "[what was found]"
        severity: "[SURVIVED | CHALLENGED | BROKEN]"
      - query: "[adversarial query used]"
        target_claim: "[which load-bearing claim this targets]"
        findings: "[what was found]"
        severity: "[SURVIVED | CHALLENGED | BROKEN]"
    overall_result: "[summary of red team outcome]"

  lightweight_inversion:
    attempted: true
    viable: true/false
    narrative: "[2-3 sentence counter-narrative using only gathered evidence, or null if not viable]"
    blocked_by: "[what prevented inversion assembly, or null if viable]"

  competing_programme:
    detected: true/false
    thesis: "[brief description of the competing programme, or null]"
    source: "inversion | counter_programme | both"
    subagent_spawned: false

  severity_summary:
    claims_tested: [N]
    survived: [N]
    challenged: [N]
    broken: [N]
```

## State

Append to `.claude/dialectic/scratchpad.md` with header `## Adversarial Pass`.

Update `state.json`:
- Write adversarial results under `adversarial` key
- Do NOT set `phase` — the stop hook owns phase transitions

## Do NOT

- Search for confirming evidence (red team searches for disconfirmation only)
- Import hypothetical counter-evidence in the inversion (use only gathered evidence)
- Conclude or recommend (compression does that)
- Skip red team search because the thesis seems strong
- Stop the main loop to explore a competing programme (flag it, then continue)

---

## CRITICAL: Stop After Writing Output

After writing your adversarial output and updating `state.json` with the adversarial results, **stop responding immediately**. Do not begin compression. Do not write transition headers. Do not set `phase`. The stop hook owns all phase transitions — it reads `state.json` and re-feeds the correct prompt.
