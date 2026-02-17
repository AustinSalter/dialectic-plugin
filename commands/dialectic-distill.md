---
description: Distill completed reasoning into conviction memo
argument-hint: [--output=<dir>] [--keep=<list>] [--min-passes=N] [--max-passes=N]
---

# Dialectic Distillation

You are executing the distillation phase of a dialectic reasoning session. Follow this protocol exactly.

## Step 1: Validate Reasoning Artifacts

Read `.claude/dialectic/state.json`. Check:
- File must exist — if not, no reasoning session has been run. Tell the user to run `/dialectic:dialectic` first.
- `loop` must be `"awaiting_distillation"` — if it's `"reasoning"`, the reasoning loop is still active. Tell the user to complete or cancel it first.
- If `loop` is already `"distillation"`, a distillation is in progress. Resume it.

Required artifacts (all must exist in `.claude/dialectic/`):
- `scratchpad.md` — full reasoning with markers
- `state.json` — final thesis, confidence, evidence
- `thesis-history.md` — iteration trajectory

If any are missing, report which and stop.

## Step 2: Parse Arguments and Initialize

Parse `$ARGUMENTS` for optional flags:
- `--output=<dir>` — Directory for preserved artifacts (overrides state.json value, default: `.dialectic-output/`)
- `--keep=<list>` — Comma-separated artifact names to preserve (overrides state.json value, default: `memo,spine,history`)
- `--min-passes=N` — Minimum distillation passes (default: 2)
- `--max-passes=N` — Maximum distillation passes (default: 4)

Valid `--keep` values: `memo` (memo-final.md), `spine` (spine.yaml), `history` (thesis-history.md), `prompt` (prompt.md), `scratchpad` (scratchpad.md), `draft` (memo-draft.md), `state` (state.json), `all` (everything), `none` (skip preservation).

Update state.json:
- Set `loop: "distillation"`
- Set `distillation_iteration: 1`
- Set `distillation_max: <parsed or default 4>`
- Set `distillation_min: <parsed or default 2>`
- Set `distillation_phase: "spine_extraction"`
- Set `decision: null`
- Update `output_dir` and `keep_artifacts` if flags were provided

## Step 3: Run Distillation

Follow the full distillation protocol in `skills/dialectic/DISTILLATION.md`.

On pass 1: Extract spine, draft memo, run probes, write decision to state.json, stop.
On pass 2+: Revise based on previous probe findings, re-run probes in adversarial mode, write decision, stop.

The memo target format is defined in `skills/dialectic/SYNTHESIS.md`.

## CRITICAL: One Pass Per Response

Each distillation pass is a separate response. After completing one pass, write your decision to `state.json` and **stop responding**. The stop hook enforces the minimum pass requirement and re-feeds you for the next pass.
