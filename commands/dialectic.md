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
  "decision": null
}
```

Also write the original prompt to `.claude/dialectic/prompt.md` for reference.

## Step 2: EXPANSION Pass (Thesis)

**For detailed expansion instructions, see `skills/dialectic/EXPANSION.md`**

Explore broadly. Use semantic markers (see `skills/dialectic/MARKERS.md`):
- `[INSIGHT]` - Non-obvious conclusion
- `[EVIDENCE]` - Specific data point
- `[COUNTER]` - Argument against thesis
- `[TENSION]` - Conflicting evidence
- `[THREAD]` - Worth exploring further

Append expansion output to `.claude/dialectic/scratchpad.md`.

## Step 3: COMPRESSION Pass (Antithesis)

**For detailed compression instructions, see `skills/dialectic/COMPRESSION.md`**

Synthesize expansion findings:
1. Update thesis if evidence warrants
2. Update confidence (can go UP or DOWN - non-monotonic!)
3. Identify next priority question
4. Update state.json with new values

Add confidence to `thesis.confidence_history` before updating current confidence.

## Step 4: CRITIQUE Pass (Sublation)

**For detailed critique protocol, see `skills/dialectic/CRITIQUE.md`**

Apply these questioning techniques:
1. **Inversion**: What if the opposite were true?
2. **Second-Order**: What are downstream effects?
3. **Falsification**: What evidence would disprove this?
4. **Base Rates**: What do historical priors suggest?

Then decide:
- **CONTINUE**: Evidence gaps addressable, iterate again
- **CONCLUDE**: Thesis robust, ready for synthesis
- **ELEVATE**: Need to reframe the thesis entirely

Write decision to state.json `decision` field (lowercase: "continue", "conclude", or "elevate").

## Step 5: Check Termination

**Iteration floor**: If `iteration < min_iterations`, treat any CONCLUDE decision as CONTINUE instead. The thesis hasn't been stress-tested enough yet. Override the decision in state.json and note: "CONCLUDE overridden — below iteration floor (iteration N < min_iterations M)."

If decision is "conclude" AND iteration >= min_iterations, OR iteration >= max_iterations:
- Run SYNTHESIS pass (see `skills/dialectic/SYNTHESIS.md`)
- If max iterations forced exit, also reference `skills/dialectic/ESCAPE-HATCH.md`
- Output `[ANALYSIS_COMPLETE]` at the very end
- The stop hook will clean up state files

If decision is "continue" (or overridden from conclude):
- The stop hook will automatically re-feed the prompt
- Just end your current response normally

## Step 6: Update Thesis History

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

## Output Format

Show your work clearly. The user should see:
- Full expansion reasoning with markers
- Compression synthesis and confidence update
- Critique questioning and decision

This visibility IS the value. Do not summarize or hide your reasoning.

## Market Structure Patterns

Reference `skills/dialectic/PATTERNS.md` for common strategic patterns to consider.
