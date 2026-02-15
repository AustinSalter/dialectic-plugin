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

# Artifact name → filename mapping
declare -A ARTIFACT_MAP=(
  [memo]="memo-final.md"
  [spine]="spine.yaml"
  [history]="thesis-history.md"
  [prompt]="prompt.md"
  [scratchpad]="scratchpad.md"
  [draft]="memo-draft.md"
  [state]="state.json"
)

preserve_artifacts() {
  local state_dir="$1"
  local output_dir="$2"
  local artifact_names="$3"  # comma-separated
  local session_id="$4"

  # Handle "none"
  if echo "$artifact_names" | grep -qw "none"; then
    return 1
  fi

  # Handle "all"
  if echo "$artifact_names" | grep -qw "all"; then
    artifact_names="memo,spine,history,prompt,scratchpad,draft,state"
  fi

  local session_dir="$output_dir/$session_id"
  mkdir -p "$session_dir"

  local copied=""
  IFS=',' read -ra NAMES <<< "$artifact_names"
  for name in "${NAMES[@]}"; do
    name=$(echo "$name" | xargs)  # trim whitespace
    local filename="${ARTIFACT_MAP[$name]}"
    if [ -z "$filename" ]; then
      continue
    fi
    local src="$state_dir/$filename"
    if [ -f "$src" ]; then
      cp "$src" "$session_dir/$filename"
      if [ -n "$copied" ]; then
        copied="$copied, \"$filename\""
      else
        copied="\"$filename\""
      fi
    fi
  done

  # Write manifest
  cat > "$session_dir/manifest.json" << MANIFEST_EOF
{
  "session_id": "$session_id",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "artifacts": [$copied],
  "reasoning_iterations": $ITERATION,
  "final_confidence": $CONFIDENCE
}
MANIFEST_EOF

  echo "$session_dir"
}

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

  # Check for elevation — reframe thesis entirely
  if [ "$DECISION" = "elevate" ] || [ "$DECISION" = "ELEVATE" ]; then
    NEW_ITERATION=$((ITERATION + 1))
    jq ".iteration = $NEW_ITERATION | .phase = \"expansion\" | .decision = null" "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"

    echo ""
    echo "================================================"
    echo "  ELEVATE — thesis needs fundamental reframe"
    echo "  Iteration $NEW_ITERATION / $MAX_ITERATIONS"
    echo "================================================"

    echo "The critique determined the thesis needs elevation — a fundamental reframe. Read the elevated thesis from the critique output in scratchpad.md (look for the if_elevate block). Adopt the elevated thesis as your new working thesis, update state.json, and begin a fresh expansion pass from the new frame." >&2
    exit 2
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
    # Distillation complete — preserve artifacts, clean up, and exit
    echo ""
    echo "================================================"
    echo "  Distillation complete! Memo finalized."
    echo "  Reasoning iterations: $ITERATION"
    echo "  Distillation iterations: $DIST_ITER"
    echo "  Final confidence: $CONFIDENCE"

    # Preserve artifacts before cleanup
    OUTPUT_DIR=$(jq -r '.output_dir // ".dialectic-output/"' "$STATE_FILE" 2>/dev/null)
    KEEP_ARTIFACTS=$(jq -r '(.keep_artifacts // ["memo","spine","history"]) | join(",")' "$STATE_FILE" 2>/dev/null)
    SESSION_ID=$(jq -r '.session_id // "dialectic-unknown"' "$STATE_FILE" 2>/dev/null)
    SAVED_TO=$(preserve_artifacts "$STATE_DIR" "$OUTPUT_DIR" "$KEEP_ARTIFACTS" "$SESSION_ID")
    if [ -n "$SAVED_TO" ]; then
      echo "  Artifacts saved to: $SAVED_TO"
    fi

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

  echo "Continue the distillation loop. Run all five distillation probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads) and the Compression Gate against the current draft. Revise if any probe fails or the gate is incomplete. Read state from .claude/dialectic/state.json and follow skills/dialectic/DISTILLATION.md." >&2
  exit 2
fi
