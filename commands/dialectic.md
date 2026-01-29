---
description: Multi-pass dialectic reasoning with expansion, compression, and critique cycles
argument-hint: <thesis or question>
---

# Dialectic Reasoning

You are executing a multi-pass dialectic reasoning cycle. Follow this protocol exactly.

## Step 1: Initialize or Resume

Check if `.claude/dialectic/state.json` exists:
- If NO: Initialize new session (see Initial State below)
- If YES: Read state and continue from current iteration

### Initial State (create if not exists)

Create the directory `.claude/dialectic/` and write `state.json`:
```json
{
  "session_id": "dialectic-{timestamp}",
  "prompt": "$ARGUMENTS",
  "iteration": 1,
  "max_iterations": 5,
  "phase": "expansion",
  "thesis": {
    "current": "$ARGUMENTS",
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

If decision is "conclude" or iteration >= max_iterations:
- Run SYNTHESIS pass (see `skills/dialectic/SYNTHESIS.md`)
- If max iterations forced exit, also reference `skills/dialectic/ESCAPE-HATCH.md`
- Output `[ANALYSIS_COMPLETE]` at the very end
- The stop hook will clean up state files

If decision is "continue":
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
