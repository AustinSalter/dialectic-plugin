#!/bin/bash
# Dialectic Reasoning Stop Hook (bash/jq version, requires bash + jq)
# Blocks exit and re-feeds prompt until CONCLUDE or max iterations
#
# Exit 0 = allow stop
# Exit 2 = block stop (stderr is fed back to Claude as continuation prompt)
#
# The primary hook is stop-hook.js (cross-platform, no jq dependency).
# This script is kept as a bash-native alternative.

STATE_DIR=".claude/dialectic"
STATE_FILE="$STATE_DIR/state.json"
PROMPT_FILE="$STATE_DIR/prompt.md"

# Check if dialectic loop is active
if [ ! -f "$STATE_FILE" ]; then
  exit 0  # No active loop, allow exit
fi

# Read state
DECISION=$(jq -r '.decision // ""' "$STATE_FILE" 2>/dev/null)
ITERATION=$(jq -r '.iteration // 0' "$STATE_FILE" 2>/dev/null)
MIN_ITERATIONS=$(jq -r '.min_iterations // 2' "$STATE_FILE" 2>/dev/null)
MAX_ITERATIONS=$(jq -r '.max_iterations // 5' "$STATE_FILE" 2>/dev/null)
CONFIDENCE=$(jq -r '.thesis.confidence // 0' "$STATE_FILE" 2>/dev/null)
THESIS=$(jq -r '.thesis.current // ""' "$STATE_FILE" 2>/dev/null | head -c 100)
LOOP=$(jq -r '.loop // "reasoning"' "$STATE_FILE" 2>/dev/null)
DIST_ITER=$(jq -r '.distillation_iteration // 1' "$STATE_FILE" 2>/dev/null)
DIST_MAX=$(jq -r '.distillation_max // 3' "$STATE_FILE" 2>/dev/null)

# ============================================================
# REASONING LOOP
# ============================================================
if [ "$LOOP" = "reasoning" ]; then

  # Check for completion — enforce iteration floor
  if [ "$DECISION" = "conclude" ] || [ "$DECISION" = "CONCLUDE" ]; then
    if [ "$ITERATION" -lt "$MIN_ITERATIONS" ]; then
      # Below iteration floor — override CONCLUDE to CONTINUE
      echo ""
      echo "================================================"
      echo "  CONCLUDE overridden — below iteration floor"
      echo "  Iteration $ITERATION < min_iterations $MIN_ITERATIONS"
      echo "  Forcing CONTINUE for deeper analysis..."
      echo "================================================"
      jq '.decision = "continue"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"
      # Fall through to the continue block below
    else
      # TRANSITION TO DISTILLATION LOOP
      echo ""
      echo "================================================"
      echo "  Reasoning loop complete!"
      echo "  Confidence: $CONFIDENCE | Iterations: $ITERATION"
      echo "  Transitioning to distillation loop..."
      echo "================================================"
      jq '.loop = "distillation" | .distillation_iteration = 1 | .distillation_max = 3 | .decision = null | .distillation_phase = "spine_extraction"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"

      echo "Reasoning loop complete. Begin distillation loop. Read skills/dialectic/DISTILLATION.md for instructions. Extract the reasoning spine from the scratchpad, then draft the conviction memo. Read state from .claude/dialectic/state.json." >&2
      exit 2
    fi
  fi

  # Check iteration limit — force transition to distillation
  if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    echo ""
    echo "================================================"
    echo "  Max iterations reached ($ITERATION/$MAX_ITERATIONS)"
    echo "  Forcing transition to distillation loop..."
    echo "================================================"
    jq '.loop = "distillation" | .distillation_iteration = 1 | .distillation_max = 3 | .decision = null | .distillation_phase = "spine_extraction"' "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"

    ESCAPE_NOTE=""
    if [ "$(echo "$CONFIDENCE < 0.5" | bc -l 2>/dev/null)" = "1" ]; then
      ESCAPE_NOTE=" Confidence is low — also reference skills/dialectic/ESCAPE-HATCH.md for honest uncertainty acknowledgment in the memo."
    fi

    echo "Reasoning loop hit max iterations. Begin distillation loop. Read skills/dialectic/DISTILLATION.md for instructions.${ESCAPE_NOTE} Read state from .claude/dialectic/state.json." >&2
    exit 2
  fi

  # Continue reasoning loop — increment iteration and re-feed
  NEW_ITERATION=$((ITERATION + 1))
  jq ".iteration = $NEW_ITERATION" "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"

  echo ""
  echo "================================================"
  echo "  Dialectic iteration $NEW_ITERATION / $MAX_ITERATIONS (floor: $MIN_ITERATIONS)"
  echo "  Current confidence: $CONFIDENCE"
  echo "  Thesis: ${THESIS}..."
  echo "  Decision: $DECISION -> continuing"
  echo "================================================"
  echo "Continue the dialectic reasoning cycle. Read state from .claude/dialectic/state.json and proceed with iteration $NEW_ITERATION." >&2

  exit 2  # Block stop, continue loop

# ============================================================
# DISTILLATION LOOP
# ============================================================
elif [ "$LOOP" = "distillation" ]; then

  if [ "$DECISION" = "conclude" ] || [ "$DECISION" = "CONCLUDE" ]; then
    # Distillation complete — clean up and exit
    echo ""
    echo "================================================"
    echo "  Distillation complete! Memo finalized."
    echo "  Reasoning iterations: $ITERATION"
    echo "  Distillation iterations: $DIST_ITER"
    echo "  Final confidence: $CONFIDENCE"
    echo "================================================"
    rm -rf "$STATE_DIR"
    exit 0
  fi

  if [ "$DIST_ITER" -ge "$DIST_MAX" ]; then
    # Force conclude distillation
    echo ""
    echo "================================================"
    echo "  Distillation max iterations reached ($DIST_ITER/$DIST_MAX)"
    echo "  Finalize the memo as-is."
    echo "================================================"
    jq '.decision = "conclude"' "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"

    echo "Distillation loop hit max iterations. Write the final memo to .claude/dialectic/memo-final.md as-is and emit [ANALYSIS_COMPLETE]. Read state from .claude/dialectic/state.json." >&2
    exit 2
  fi

  # Continue distillation — increment and re-feed
  NEW_DIST_ITER=$((DIST_ITER + 1))
  PHASE=$(jq -r '.distillation_phase // "drafting"' "$STATE_FILE" 2>/dev/null)
  jq ".distillation_iteration = $NEW_DIST_ITER | .decision = null" "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"

  echo ""
  echo "================================================"
  echo "  Distillation iteration $NEW_DIST_ITER / $DIST_MAX"
  echo "  Phase: $PHASE"
  echo "================================================"

  echo "Continue the distillation loop. Run fidelity check and clarity check against the current draft. Revise if either fails. Read state from .claude/dialectic/state.json and follow skills/dialectic/DISTILLATION.md." >&2
  exit 2
fi
