---
description: Multi-pass dialectic reasoning with expansion, compression, and critique cycles
argument-hint: <thesis or question> [--min-iterations=N] [--max-iterations=N]
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

Extract the thesis/question text (everything that isn't a flag). Examples:
- `/dialectic:dialectic "Where should VCs deploy capital in AI?"` → min=2, max=5
- `/dialectic:dialectic --min-iterations=4 "Where should VCs deploy capital in AI?"` → min=4, max=5
- `/dialectic:dialectic --min-iterations=3 --max-iterations=7 "Where should VCs deploy capital in AI?"` → min=3, max=7

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
  "output_dir": "<parsed or default .dialectic-output/>",
  "keep_artifacts": ["memo", "spine", "history"]
}
```

Also write the original prompt to `.claude/dialectic/prompt.md` for reference.

## Step 2: EXPANSION Pass (Thesis)

Run the full expansion protocol in `skills/dialectic/EXPANSION.md`. Do not skip frame selection.

Append all expansion output to `.claude/dialectic/scratchpad.md`.

## Step 3: COMPRESSION Pass (Antithesis)

Run the full compression protocol in `skills/dialectic/COMPRESSION.md`. Use the 3D confidence model — do not default to scalar.

Add previous confidence to `thesis.confidence_history` before updating state.json.

## Step 4: CRITIQUE Pass (Sublation)

Run the full critique protocol in `skills/dialectic/CRITIQUE.md`. Do not substitute a lighter version.

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
