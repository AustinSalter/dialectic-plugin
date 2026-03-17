---
description: Synthesize dialectic reasoning into engineering build spec
argument-hint: [--min-passes=N] [--max-passes=N] [--output=<path>]
---

# Forge — Build Spec Synthesis

You are executing the forge phase of a dialectic reasoning session. Follow this protocol exactly.

## Step 1: Validate Reasoning Artifacts

Read `.claude/dialectic/state.json`. Check:
- File must exist — if not, no reasoning session has been run. Tell the user to run `/dialectic:dialectic` first.
- `loop` must be `"awaiting_distillation"` — if it's `"reasoning"`, the reasoning loop is still active. Tell the user to complete or cancel it first.
- If `loop` is already `"forge"`, a forge synthesis is in progress. Resume it.

Required artifacts (all must exist in `.claude/dialectic/`):
- `scratchpad.md` — full reasoning with markers
- `state.json` — final thesis, confidence, evidence
- `thesis-history.md` — iteration trajectory

If any are missing, report which and stop.

## Step 2: Parse Arguments and Initialize

Parse `$ARGUMENTS` for optional flags:
- `--min-passes=N` — Minimum forge passes (default: 2)
- `--max-passes=N` — Maximum forge passes (default: 4)
- `--output=<path>` — Custom output path for the forge report

## Step 3: Check for Holdout Report

If `.claude/dialectic/holdout_report.md` exists, read and extract verdict:

- **FRACTURED**: Do NOT generate a full spec. Produce a short diagnostic (what broke, competing directions, blocked decisions). Recommend re-loop with the holdout's counter-thesis. Set `decision: "conclude"` in state.json and stop.
- **CHALLENGED**: Load holdout findings for integration into the forge spec. Continue to Step 4.
- **VALIDATED**: Proceed normally with high-confidence annotations. Continue to Step 4.

If no holdout report exists, proceed normally (backward compatible).

## Step 4: Initialize Forge Loop

Update state.json:
- Set `loop: "forge"`
- Set `forge_iteration: 1`
- Set `forge_max: <parsed or default 4>`
- Set `forge_min: <parsed or default 2>`
- Set `forge_phase: "drafting"`
- Set `decision: null`

## Step 5: Generate Forge Spec

Read trace artifacts:
- `.claude/dialectic/scratchpad.md`
- `.claude/dialectic/thesis-history.md`
- `.claude/dialectic/state.json`

Follow the full forge protocol in `skills/dialectic/FORGE.md`:
1. Extract semantic markers from the trace
2. Translate markers per the marker translation table
3. If holdout CHALLENGED: incorporate findings per holdout integration rules
4. Generate the 9-section build spec following the output format
5. Run all 7 quality checks, note any failures

Write the draft to `.claude/dialectic/forge-draft.md`.

## Step 6: Write Decision

After running quality checks:
- If all 7 checks pass AND `forge_iteration >= forge_min`: set `decision: "conclude"` in state.json
- Otherwise: set `decision: "continue"` in state.json, noting which checks failed

## CRITICAL: One Pass Per Response

Each forge pass is a separate response. After completing one pass, write your decision to `state.json` and **stop responding**. The stop hook enforces the minimum pass requirement and re-feeds you for the next pass.
