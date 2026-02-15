---
description: Multi-pass dialectic reasoning with expansion, compression, and critique cycles
argument-hint: <thesis or question> [--min-iterations=N] [--max-iterations=N] [--output=<dir>] [--keep=<list>]
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
- `--output=<dir>` — Directory for preserved artifacts (default: `.dialectic-output/`)
- `--keep=<list>` — Comma-separated artifact names to preserve on completion (default: `memo,spine,history`)

Valid `--keep` values: `memo` (memo-final.md), `spine` (spine.yaml), `history` (thesis-history.md), `prompt` (prompt.md), `scratchpad` (scratchpad.md), `draft` (memo-draft.md), `state` (state.json), `all` (everything), `none` (skip preservation).

Artifacts are saved to `.dialectic-output/` by default. Add this to `.gitignore` if you don't want analysis results in version control.

Extract the thesis/question text (everything that isn't a flag). Examples:
- `/dialectic:dialectic "Where should VCs deploy capital in AI?"` → min=2, max=5
- `/dialectic:dialectic --min-iterations=4 "Where should VCs deploy capital in AI?"` → min=4, max=5
- `/dialectic:dialectic --min-iterations=3 --max-iterations=7 "Where should VCs deploy capital in AI?"` → min=3, max=7
- `/dialectic:dialectic --keep=all --output=test-out/ "Where should VCs deploy capital in AI?"` → preserves all artifacts to `test-out/`

### Initial State (create if not exists)

Create the directory `.claude/dialectic/` and write `state.json`:
```json
{
  "session_id": "dialectic-{timestamp}",
  "prompt": "<extracted thesis text>",
  "iteration": 1,
  "loop": "reasoning",
  "min_iterations": <parsed or default 2>,
  "max_iterations": <parsed or default 5>,
  "phase": "expansion",
  "thesis": {
    "current": "<extracted thesis text>",
    "confidence": 0.5,
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

**Always write thesis history before checking termination.** The distillation loop depends on a complete thesis-history.md.

After each iteration, append to `.claude/dialectic/thesis-history.md`:
```
## Iteration {N}

**Thesis**: {current thesis}
**Confidence**: {X.XX}
**Key Evidence**: {brief summary}
**Decision**: {CONTINUE/CONCLUDE/ELEVATE}
**Next Priority**: {question to explore}

---
```

## Step 6: Check Termination

**Iteration floor**: If `iteration < min_iterations`, treat any CONCLUDE decision as CONTINUE instead. Override the decision in state.json and note: "CONCLUDE overridden — below iteration floor."

If decision is "conclude" AND iteration >= min_iterations, OR iteration >= max_iterations:
- Do NOT run synthesis inline
- The stop hook will transition to the distillation loop automatically
- Just end your current response normally

If decision is "continue" (or overridden from conclude):
- The stop hook will automatically re-feed the prompt
- Just end your current response normally

## Step 7: Distillation Loop (automatic — triggered by stop hook)

When the stop hook transitions to the distillation loop, follow the instructions in `skills/dialectic/DISTILLATION.md`.

The distillation loop:
1. Extracts a reasoning spine from the scratchpad (first iteration only)
2. Drafts a conviction memo targeting the format in `skills/dialectic/SYNTHESIS.md`
3. Runs fidelity check (spine coverage) and clarity check (spec compliance)
4. Revises until both checks pass or max distillation iterations reached
5. Outputs `[ANALYSIS_COMPLETE]` when done

## Output Format

Show your work clearly. The user should see:
- Full expansion reasoning with markers
- Compression synthesis and confidence update
- Critique questioning and decision

This visibility IS the value. Do not summarize or hide your reasoning.

## Market Structure Patterns

Reference `skills/dialectic/PATTERNS.md` for common strategic patterns to consider.
