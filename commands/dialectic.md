---
description: Multi-pass dialectic reasoning with expansion, compression, and critique cycles
argument-hint: <thesis or question> [--min-iterations=N] [--max-iterations=N] [--holdout] [--pace=manual]
---

# Dialectic Reasoning

You are executing a multi-pass dialectic reasoning cycle. Follow this protocol exactly.

Do not create or enter a worktree for a dialectic run; it writes no code.

## Step 1: Initialize or Resume

Test whether `.claude/dialectic/state.json` exists on disk:
- If NO: Initialize new session (see Initial State below)
- If YES: Read state and continue from current iteration. If `resume_note` is present, read it and start from it — it carries the iteration number, thesis, confidence, and the open question the last iteration left.

### Argument Parsing

Parse `$ARGUMENTS` for optional flags before the thesis text:
- `--min-iterations=N` — Minimum iterations before CONCLUDE is allowed (default: 3)
- `--max-iterations=N` — Maximum iterations before forced exit (default: 5)
- `--holdout` — Enable holdout validation after reasoning concludes
- `--pace=manual` — Pause between iterations instead of re-feeding (default: auto). Sets `"pace": "manual"` in the initial state.

Extract the thesis/question text (everything that isn't a flag). Examples:
- `/dialectic:dialectic "Where should VCs deploy capital in AI?"` → min=3, max=5, holdout=false
- `/dialectic:dialectic --holdout "Where should VCs deploy capital in AI?"` → min=3, max=5, holdout=true
- `/dialectic:dialectic --min-iterations=3 --max-iterations=7 --holdout "thesis"` → min=3, max=7, holdout=true
- `/dialectic:dialectic --pace=manual "thesis"` → min=3, max=5, holdout=false, pace=manual

With `pace: manual`, on CONTINUE the hook advances the iteration, writes `resume_note` to state.json, and exits instead of re-feeding. The user runs `/dialectic:dialectic` to start the next iteration. ELEVATE, REJECT re-loops, and terminal transitions behave as in auto pace.

### Initial State (create if not exists)

Create `.claude/dialectic/state.json` with a single Write tool call — not a heredoc, not a script. Write creates the directory.
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
  "pace": "<\"manual\" if --pace=manual, else \"auto\">",
  "holdout": false,
  "holdout_state": {
    "pass": 1,
    "max_passes": 2,
    "verdict": null,
    "report_path": null
  },
  "output_dir": "<parsed or default .dialectic-output/>",
  "keep_artifacts": ["memo", "spine", "history", "scratchpad", "state", "prompt"]
}
```

Set `session_id` by running `date +%Y%m%dT%H%M%S` via Bash before the Write and prefixing `dialectic-` — never invent or estimate the timestamp.

Set `holdout: true` in state.json if `--holdout` flag is present.

Also write the original prompt to `.claude/dialectic/prompt.md` for reference.

## Output Format

Show your work. The user should see:
- Full expansion reasoning with markers
- Compression synthesis and confidence update
- Critique questioning and decision

Output the full reasoning trace. Do not summarize or collapse intermediate steps.

Each pass step below begins with one Read tool call on its own protocol file. Never read them with a concatenating shell command, and never read them all up front.

## Step 2: EXPANSION Pass (Thesis)

Write this pass in your response first, as prose, then append the same text to `.claude/dialectic/scratchpad.md`. Expansion is discursive: follow threads, show the reasoning.

Read `skills/dialectic/EXPANSION.md` now, immediately before running the pass.

Run the expansion protocol in `skills/dialectic/EXPANSION.md`, including its frame-selection step.

Append the complete expansion output — tagged evidence, frame labels, and reasoning — to `.claude/dialectic/scratchpad.md`.

## Step 2.5: FORMATION Pass (iteration 1 only)

Write this pass in your response first, as prose, then append the same text to `.claude/dialectic/scratchpad.md`.

On the first iteration only, after the expansion output is in the scratchpad, read `skills/dialectic/FORMATION.md`, then run its formation protocol: promote the frame's rival hypotheses to candidate cases, score them for winnability, commit to one, and write the `case` object to state.json. The selected case's claim becomes `thesis.current`.

Append the full formation block — candidates, scores, selection reasoning — to `.claude/dialectic/scratchpad.md`.

On iterations 2+, skip this step. Formation re-entry happens only through ELEVATE — the hook's elevation prompt routes back through FORMATION.md.

## Step 3: COMPRESSION Pass (Antithesis)

Write this pass in your response first, as prose, then append the same text to `.claude/dialectic/scratchpad.md`. Compression is terse and decisive: claims, confidence, no re-argument.

Read `skills/dialectic/COMPRESSION.md` now, immediately before running the pass.

Run the compression protocol in `skills/dialectic/COMPRESSION.md`. Update confidence as three dimensions (R, E, C), not a single scalar.

Before writing new confidence values to state.json, append the current `thesis.confidence` object to `thesis.confidence_history`.

## Step 4: CRITIQUE Pass (Sublation)

Write this pass in your response first, as prose, then append the same text to `.claude/dialectic/scratchpad.md`. Critique is terse and decisive: probe, verdict, decision.

Read `skills/dialectic/CRITIQUE.md` now, immediately before running the pass.

Run the critique protocol in `skills/dialectic/CRITIQUE.md` without abbreviation.

Write decision to state.json `decision` field (lowercase: "continue", "conclude", "elevate", or "reject").

Append the complete critique output — the probes yaml, preservation gate, and decision block — to `.claude/dialectic/scratchpad.md` before stopping. The stop hook will not honor a decision whose warrant is not in the scratchpad.

## Step 5: Update Thesis History

**Always write thesis history before checking termination.** Complete thesis history is required before concluding.

After each iteration, append to `.claude/dialectic/thesis-history.md`:
```
## Iteration {N}

**Thesis**: {current thesis}
**Confidence**: R={X.XX} E={X.XX} C={X.XX}
**Key Evidence**: {brief summary}
**Decision**: {CONTINUE/CONCLUDE/ELEVATE/REJECT}
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
- **REJECT**: Stop. The hook re-loops once on a counter-thesis, or ends the run as a refutation.

**Do not write transition headers or begin any next phase.**

## State Ownership

Two writers share `state.json`. The hook owns: `iteration`, `loop`, `phase` on transitions, `decision` nulling, `distillation_iteration`, `forge_iteration`, `reject_passes`, `last_hook_ts`, `resume_note`. You own everything else, including the `case` object formation writes — the hook never touches it. Before writing, re-read the file — the hook may have changed it since you last saw it. Update single fields with jq or python; never rewrite the file from memory and never string-edit it.

## If the Hook Doesn't Fire

After you write a decision and stop, the next thing you see must be a hook banner (and `last_hook_ts` in state.json will be fresh). If you are re-invoked with no banner, or `last_hook_ts` is missing or stale after your stop: do not emulate the loop. Do not increment `iteration`, change `loop`, or run the next pass. Tell the user the stop hook did not fire and stop. A self-administered loop defeats the reason the loop exists.

A manual-pace resume is not a missing hook: the user invoked `/dialectic:dialectic`, `resume_note` is present, and `last_hook_ts` records the hook's pause. Start the next iteration from the note.

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
