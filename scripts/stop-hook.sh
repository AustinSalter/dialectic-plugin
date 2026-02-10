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

# Check for completion — but enforce iteration floor
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
    echo ""
    echo "================================================"
    echo "  Dialectic reasoning complete!"
    echo "  Final confidence: $CONFIDENCE"
    echo "  Iterations: $ITERATION"
    echo "================================================"
    rm -rf "$STATE_DIR"
    exit 0
  fi
fi

# Check iteration limit
if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
  echo ""
  echo "================================================"
  echo "  Max iterations reached ($ITERATION/$MAX_ITERATIONS)"
  echo "  Running escape hatch for final synthesis..."
  echo "================================================"
  # Update decision to conclude so next pass does synthesis
  jq '.decision = "conclude"' "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"

  echo "Continue the dialectic reasoning cycle. Max iterations reached - run ESCAPE-HATCH and SYNTHESIS passes. Read state from .claude/dialectic/state.json." >&2

  exit 2  # Block stop, one more pass for synthesis
fi

# Continue loop - increment iteration and re-feed
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
