---
description: Multi-pass dialectic reasoning with expansion, compression, and critique cycles
argument-hint: <thesis or question> [--min-iterations=N] [--max-iterations=N] [--holdout]
---

# Dialectic Reasoning

You are executing a multi-pass dialectic reasoning cycle. Follow this protocol exactly.

## Step 1: Initialize or Resume

Test whether `.claude/dialectic/state.json` exists on disk:
- If NO: Initialize new session (see Initial State below)
- If YES: Read state and continue from current iteration

### Argument Parsing

Parse `$ARGUMENTS` for optional flags before the thesis text:
- `--min-iterations=N` — Minimum iterations before CONCLUDE is allowed (default: 2)
- `--max-iterations=N` — Maximum iterations before forced exit (default: 5)
- `--holdout` — Enable holdout validation after reasoning concludes

Extract the thesis/question text (everything that isn't a flag). Examples:
- `/dialectic:dialectic "Where should VCs deploy capital in AI?"` → min=3, max=5, holdout=false
- `/dialectic:dialectic --holdout "Where should VCs deploy capital in AI?"` → min=3, max=5, holdout=true
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

Also write the original prompt to `.claude/dialectic/prompt.md` for reference.

## Step 2: EXPANSION Pass (Thesis)

Run the expansion protocol in `skills/dialectic/EXPANSION.md`, including its frame-selection step.

Append the complete expansion output — tagged evidence, frame labels, and reasoning — to `.claude/dialectic/scratchpad.md`.

## Step 3: COMPRESSION Pass (Antithesis)

Run the compression protocol in `skills/dialectic/COMPRESSION.md`. Update confidence as three dimensions (R, E, C), not a single scalar.

Before writing new confidence values to state.json, append the current `thesis.confidence` object to `thesis.confidence_history`.

## Step 4: CRITIQUE Pass (Sublation)

Run the critique protocol in `skills/dialectic/CRITIQUE.md` without abbreviation.

Write decision to state.json `decision` field (lowercase: "continue", "conclude", or "elevate").

## Step 5: Update Thesis History

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

## Step 6: Check Termination

**Iteration floor**: If `iteration < min_iterations`, treat any CONCLUDE decision as CONTINUE instead. Override the decision in state.json and note: "CONCLUDE overridden — below iteration floor."

After writing thesis history and updating state.json, **stop responding** — the stop hook owns all transitions.

This applies to every decision:
- **CONCLUDE**: Stop. The reasoning phase is complete.
- **CONTINUE**: Stop. The hook increments the iteration and re-feeds.
- **ELEVATE**: Stop. The hook re-feeds with the elevation prompt.

**Do not write transition headers or begin any next phase.**

## Output Format

Show your work. The user should see:
- Full expansion reasoning with markers
- Compression synthesis and confidence update
- Critique questioning and decision

Output the full reasoning trace. Do not summarize or collapse intermediate steps.

## Market Structure Patterns

Read `skills/dialectic/PATTERNS.md` and apply any matching strategic patterns during expansion.

## Holdout Protocol (when loop transitions to "holdout")

When the stop hook transitions the loop to `holdout`:

1. Run serialization: `node "${CLAUDE_PLUGIN_ROOT}/scripts/serialize-trace.js"`
2. Confirm `.claude/dialectic/holdout_input/` contains conviction_thesis.md, trace_summary.md, and holdout_brief.md. If any file is missing, re-run the serialization script and check its error output before proceeding.
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
   - If CHALLENGED: overwrite `thesis.confidence` with the adjusted R, E, C scores from the holdout report
8. Stop. The stop hook transitions to `awaiting_distillation` or re-loops.
