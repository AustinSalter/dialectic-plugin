---
description: Multi-pass dialectic reasoning with expansion, compression, and critique cycles
argument-hint: <thesis or question> [--min-iterations=N] [--max-iterations=N] [--holdout]
---

# Dialectic Reasoning

You are executing a multi-pass dialectic reasoning cycle. Follow this protocol exactly.

## Step 1: Initialize or Resume

Check if `.claude/dialectic/state.json` exists:
- If NO: Initialize new session (see Initial State below)
- If YES: Read state and continue from current iteration

### Argument Parsing

Parse `$ARGUMENTS` for optional flags before the thesis text:
- `--min-iterations=N` — Minimum iterations before CONCLUDE is allowed (default: 2)
- `--max-iterations=N` — Maximum iterations before forced exit (default: 5)
- `--holdout` — Enable holdout validation after reasoning concludes
- `--interactive=<mode>` — Enable human intervention pauses (default: off). Modes:
  - `interpret` — Pause after expansion for human interpretation of `[AMBIGUOUS]` evidence
  - `weight` — Pause after adversarial for human re-weighting of evidence
  - `steering` — Pause at convergence for human programme selection
  - `full` — All three pauses enabled

Extract the thesis/question text (everything that isn't a flag). Examples:
- `/dialectic:dialectic "Where should VCs deploy capital in AI?"` → min=2, max=5, holdout=false
- `/dialectic:dialectic --holdout "Where should VCs deploy capital in AI?"` → min=2, max=5, holdout=true
- `/dialectic:dialectic --min-iterations=3 --max-iterations=7 --holdout "thesis"` → min=3, max=7, holdout=true

### Initial State (create if not exists)

Create the directory `.claude/dialectic/` and write `state.json`:
```json
{
  "session_id": "dialectic-{timestamp}",
  "prompt": "<extracted thesis text>",
  "iteration": 1,
  "loop": "reasoning",
  "min_iterations": <parsed or default 3>,
  "max_iterations": <parsed or default 5>,
  "phase": "expansion",
  "thesis": {
    "current": "<extracted thesis text>",
    "confidence": {
      "R": 0.5,
      "E": 0.3,
      "C": 0.5
    },
    "confidence_history": []
  },
  "evidence": {
    "supporting": [],
    "challenging": []
  },
  "programme_status": {
    "current": "PROGRESSIVE",
    "consecutive_degenerating": 0,
    "history": []
  },
  "adversarial": {
    "red_team_results": [],
    "inversion_viable": false,
    "severity_ratings": {}
  },
  "explorations": {
    "active": [],
    "completed": [],
    "results_dir": ".claude/dialectic/explorations/"
  },
  "interactive": {
    "mode": null,
    "interpret_inputs": [],
    "weight_adjustments": [],
    "choose_decisions": []
  },
  "decision": null,
  "holdout": false,
  "holdout_state": {
    "pass": 1,
    "max_passes": 2,
    "verdict": null,
    "report_path": null
  },
  "output_dir": "<parsed or default .dialectic-output/>",
  "keep_artifacts": ["memo", "spine", "history"]
}
```

Set `holdout: true` in state.json if `--holdout` flag is present.

Set `interactive.mode` from the parsed `--interactive` flag.

Also write the original prompt to `.claude/dialectic/prompt.md` for reference.

## Step 2: EXPANSION Pass (Thesis)

Run the full expansion protocol in `skills/dialectic/EXPANSION.md`. Do not skip frame selection.

Append all expansion output to `.claude/dialectic/scratchpad.md`.

### INTERPRET Pause (when --interactive=interpret or --interactive=full)

If interactive mode includes interpret AND the expansion surfaced `[AMBIGUOUS]` items:

1. Display the INTERPRET pause prompt:
   ```
   ──────────────────────────────────────
   INTERPRET PAUSE — Iteration N

   These items came up but I'm not sure what to make of them:

   1. [AMBIGUOUS] [item description]
   2. [AMBIGUOUS] [item description]

   Your read?
   ──────────────────────────────────────
   ```
2. Wait for human input
3. Tag each human interpretation with `[INTERPRET:human]` and append to scratchpad.md
4. Record in `interactive.interpret_inputs` in state.json
5. Continue to adversarial pass

## Step 3: ADVERSARIAL Pass (Red Team)

Run the full adversarial protocol in `skills/dialectic/ADVERSARIAL.md`.

Append all adversarial output to `.claude/dialectic/scratchpad.md` under a `## Adversarial Pass` header.

Update `state.json`:
- Write red team search results to `adversarial.red_team_results`
- Write inversion result to `adversarial.inversion_viable`
- Write severity ratings to `adversarial.severity_ratings`
- If a competing programme was detected, note it in `adversarial` (background exploration handled in Phase 2)

### WEIGHT Pause (when --interactive=weight or --interactive=full)

If interactive mode includes weight:

1. Display the WEIGHT pause prompt with full evidence corpus and severity ratings:
   ```
   ──────────────────────────────────────
   WEIGHT PAUSE — Iteration N

   Supporting (with severity):
     1. [EVIDENCE:web] ... — SURVIVED
     2. [EVIDENCE:prior] ... — UNTESTED

   Challenging:
     3. [RED_TEAM] ... — CHALLENGED claim #2
     4. [COUNTER] ...

   Any evidence over/underweighted?
   Anything chaining together that looks separate?
   ──────────────────────────────────────
   ```
2. Wait for human input
3. Tag each weight adjustment with `[WEIGHT:human]` and append to scratchpad.md
4. Record in `interactive.weight_adjustments` in state.json
5. Continue to compression pass

### Background Exploration (when competing programme detected)

If the adversarial pass set `competing_programme.detected: true` in state.json:

1. Create `.claude/dialectic/explorations/` directory if it doesn't exist
2. Record the competing thesis in `explorations.active` in state.json
3. Spawn a thesis-explorer subagent in the **background** via Bash:
   ```
   claude --print -p "You are a thesis-explorer. Read .claude/dialectic/scratchpad.md for the evidence corpus. The original thesis is: '[current thesis]'. Explore this competing thesis: '[competing thesis]'. Follow the protocol in agents/thesis-explorer.md. Write your findings to .claude/dialectic/explorations/[thesis-slug].md" &
   ```
4. **Continue immediately** — do not wait for the subagent to finish
5. The main loop proceeds to compression without interruption
6. When the subagent finishes, its results appear in `explorations/` and the critique's convergence check will pick them up

Similarly, if the critique's alternate frame probe detects a viable frame: spawn another thesis-explorer for the alternate frame.

## Step 4: COMPRESSION Pass (Antithesis)

Run the full compression protocol in `skills/dialectic/COMPRESSION.md`. Use the 3D confidence model — do not default to scalar.

Add previous confidence to `thesis.confidence_history` before updating state.json.

## Step 5: CRITIQUE Pass (Sublation)

Run the full critique protocol in `skills/dialectic/CRITIQUE.md`. Do not substitute a lighter version.

Write decision to state.json `decision` field (lowercase: "continue", "conclude", or "elevate").

Also write `programme_status` to state.json.

### CHOOSE Pause (when --interactive=steering or --interactive=full)

If interactive mode includes steering AND the critique's convergence check returned `recommendation: "human_choice_required"`:

1. Display the CHOOSE pause prompt:
   ```
   ──────────────────────────────────────
   CHOOSE PAUSE — Iteration N

   Current: [thesis summary]
   Status: DEGENERATING (N consecutive)

   Exploration found:
     Thesis α: [summary]
     Progressive indicators: [what it predicts the current thesis can't]

   (a) Switch to thesis α
   (b) Keep going — I see something you don't
   ──────────────────────────────────────
   ```
2. Wait for human input
3. Tag with `[CHOOSE:human]` and record in `interactive.choose_decisions` in state.json
4. If switch: issue ELEVATE with the chosen thesis
5. If keep going: override and CONTINUE with `[CHOOSE:human] override — human says keep going` noted

## Step 6: Update Thesis History

**Always write thesis history before checking termination.** Complete thesis history is required before concluding.

After each iteration, append to `.claude/dialectic/thesis-history.md`:
```
## Iteration {N}

**Thesis**: {current thesis}
**Confidence**: R={X.XX} E={X.XX} C={X.XX}
**Key Evidence**: {brief summary}
**Decision**: {CONTINUE/CONCLUDE/ELEVATE}
**Next Priority**: {question to explore}

---
```

## Step 7: Check Termination

**Iteration floor**: If `iteration < min_iterations`, treat any CONCLUDE decision as CONTINUE instead. Override the decision in state.json and note: "CONCLUDE overridden — below iteration floor."

After writing the thesis history entry and updating state.json, **stop responding**. Do not write anything else. The stop hook handles all transitions.

This applies to ALL decisions:
- **CONCLUDE**: Stop. The reasoning phase is complete.
- **CONTINUE**: Stop. The hook increments the iteration and re-feeds.
- **ELEVATE**: Stop. The hook re-feeds with the elevation prompt.

**Do not write transition headers, do not begin any next phase.** The stop hook owns transitions.

## Output Format

Show your work clearly. The user should see:
- Full expansion reasoning with markers
- Compression synthesis and confidence update
- Critique questioning and decision

This visibility IS the value. Do not summarize or hide your reasoning.

## Market Structure Patterns

Reference `skills/dialectic/PATTERNS.md` for common strategic patterns to consider.

## Holdout Protocol (when loop transitions to "holdout")

When the stop hook transitions the loop to "holdout", execute this protocol:

1. Run serialization: `node "${CLAUDE_PLUGIN_ROOT}/scripts/serialize-trace.js"`
2. Verify `.claude/dialectic/holdout_input/` contains all three files (conviction_thesis.md, trace_summary.md, holdout_brief.md)
3. Update state: `holdout_state.phase: "holdout_spawned"` in state.json
4. Spawn isolated subagent via Bash:
   ```
   claude --print -p "Read all files in .claude/dialectic/holdout_input/ and execute the instructions in holdout_brief.md. Write your report to .claude/dialectic/holdout_report.md"
   ```
5. Read `.claude/dialectic/holdout_report.md`
6. Extract verdict (VALIDATED/CHALLENGED/FRACTURED)
7. Update state.json:
   - `holdout_state.verdict: "<verdict>"`
   - `holdout_state.report_path: ".claude/dialectic/holdout_report.md"`
   - If CHALLENGED: merge adjusted confidence scores from the holdout report into `thesis.confidence`
8. Stop responding. The stop hook handles the transition to `awaiting_distillation` or re-loop.
