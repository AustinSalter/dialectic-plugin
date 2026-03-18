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
MIN_ITERATIONS=$(jq -r '.min_iterations // 3' "$STATE_FILE" 2>/dev/null)
MAX_ITERATIONS=$(jq -r '.max_iterations // 5' "$STATE_FILE" 2>/dev/null)
THESIS=$(jq -r '.thesis.current // ""' "$STATE_FILE" 2>/dev/null | head -c 100)
LOOP=$(jq -r '.loop // "reasoning"' "$STATE_FILE" 2>/dev/null)
DIST_ITER=$(jq -r '.distillation_iteration // 1' "$STATE_FILE" 2>/dev/null)
DIST_MAX=$(jq -r '.distillation_max // 4' "$STATE_FILE" 2>/dev/null)
DIST_MIN=$(jq -r '.distillation_min // 2' "$STATE_FILE" 2>/dev/null)
HOLDOUT=$(jq -r '.holdout // false' "$STATE_FILE" 2>/dev/null)
HOLDOUT_VERDICT=$(jq -r '.holdout_state.verdict // ""' "$STATE_FILE" 2>/dev/null)
HOLDOUT_PASS=$(jq -r '.holdout_state.pass // 1' "$STATE_FILE" 2>/dev/null)
HOLDOUT_MAX_PASSES=$(jq -r '.holdout_state.max_passes // 2' "$STATE_FILE" 2>/dev/null)
FORGE_ITER=$(jq -r '.forge_iteration // 1' "$STATE_FILE" 2>/dev/null)
FORGE_MAX=$(jq -r '.forge_max // 4' "$STATE_FILE" 2>/dev/null)
FORGE_MIN=$(jq -r '.forge_min // 2' "$STATE_FILE" 2>/dev/null)

# 3D Confidence: R (defensibility), E (evidence saturation), C (domain determinacy)
CONF_TYPE=$(jq -r '.thesis.confidence | type' "$STATE_FILE" 2>/dev/null)
if [ "$CONF_TYPE" = "object" ]; then
  R=$(jq -r '.thesis.confidence.R // 0.5' "$STATE_FILE" 2>/dev/null)
  E=$(jq -r '.thesis.confidence.E // 0.5' "$STATE_FILE" 2>/dev/null)
  C=$(jq -r '.thesis.confidence.C // 0.5' "$STATE_FILE" 2>/dev/null)
else
  # Legacy scalar fallback
  LEGACY=$(jq -r '.thesis.confidence // 0.5' "$STATE_FILE" 2>/dev/null)
  R="$LEGACY"
  E="$LEGACY"
  C="$LEGACY"
fi

# Artifact name → filename mapping (function for bash 3.2 compatibility)
artifact_filename() {
  case "$1" in
    memo)            echo "memo-final.md" ;;
    spine)           echo "spine.yaml" ;;
    history)         echo "thesis-history.md" ;;
    prompt)          echo "prompt.md" ;;
    scratchpad)      echo "scratchpad.md" ;;
    draft)           echo "memo-draft.md" ;;
    state)           echo "state.json" ;;
    holdout_report)  echo "holdout_report.md" ;;
    forge_report)    echo "forge_report.md" ;;
    forge_draft)     echo "forge-draft.md" ;;
    *)               echo "" ;;
  esac
}

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
    artifact_names="memo,spine,history,prompt,scratchpad,draft,state,holdout_report,forge_report,forge_draft"
  fi

  local session_dir="$output_dir/$session_id"
  mkdir -p "$session_dir"

  local copied=""
  IFS=',' read -ra NAMES <<< "$artifact_names"
  for name in "${NAMES[@]}"; do
    name=$(echo "$name" | xargs)  # trim whitespace
    local filename
    filename=$(artifact_filename "$name")
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
  "final_confidence": {"R": $R, "E": $E, "C": $C}
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
    elif [ "$HOLDOUT" = "true" ]; then
      # REASONING COMPLETE with holdout — transition to holdout phase
      jq '.loop = "holdout"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"
      echo ""
      echo "================================================"
      echo "  Reasoning loop complete! Running holdout validation..."
      echo "  R: $R | E: $E | C: $C | Iterations: $ITERATION"
      echo "================================================"

      echo "Reasoning concluded with --holdout enabled. Run the holdout protocol from commands/dialectic.md: serialize the trace, spawn the holdout subagent, extract the verdict, and update state.json." >&2
      exit 2
    else
      # REASONING COMPLETE — exit cleanly, user invokes distillation separately
      jq '.loop = "awaiting_distillation"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"
      echo ""
      echo "================================================"
      echo "  Reasoning loop complete!"
      echo "  R: $R | E: $E | C: $C | Iterations: $ITERATION"
      echo ""
      echo "  Run /dialectic:dialectic-distill to produce"
      echo "  the conviction memo."
      echo "  Run /dialectic:forge to produce build spec."
      echo "================================================"
      exit 0
    fi
  fi

  # Check for elevation — reframe thesis entirely
  if [ "$DECISION" = "elevate" ] || [ "$DECISION" = "ELEVATE" ]; then
    # Evidence gate: ELEVATE requires E >= 0.4 (CRITIQUE.md rule)
    E_TOO_LOW=$(echo "$E < 0.4" | bc -l 2>/dev/null)
    if [ "$E_TOO_LOW" = "1" ]; then
      echo ""
      echo "================================================"
      echo "  ELEVATE blocked — evidence gate failed"
      echo "  E=$E < 0.4. Not enough evidence to know the right altitude."
      echo "  Downgrading to CONTINUE with altitude_suspect flag."
      echo "================================================"
      jq '.decision = "continue"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"
      # Fall through to continue block
    else
      NEW_ITERATION=$((ITERATION + 1))
      jq ".iteration = $NEW_ITERATION | .phase = \"expansion\" | .decision = null" "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"

      echo ""
      echo "================================================"
      echo "  ELEVATE — thesis needs fundamental reframe"
      echo "  Iteration $NEW_ITERATION / $MAX_ITERATIONS"
      echo "  Evidence gate passed: E=$E >= 0.4"
      echo "================================================"

      echo "The critique determined the thesis needs elevation — a fundamental reframe. Read the elevated thesis from the critique output in scratchpad.md (look for the if_elevate block). Adopt the elevated thesis as your new working thesis, update state.json, and begin a fresh expansion pass from the new frame." >&2
      exit 2
    fi
  fi

  # Check iteration limit — reasoning complete, user invokes distillation separately
  if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    ESCAPE_NOTE=""
    if [ "$(echo "$E < 0.5" | bc -l 2>/dev/null)" = "1" ]; then
      ESCAPE_NOTE=" E=$E (low evidence saturation)."
    fi
    if [ "$(echo "$C < 0.5" | bc -l 2>/dev/null)" = "1" ]; then
      ESCAPE_NOTE="$ESCAPE_NOTE C=$C (low domain determinacy)."
    fi

    if [ "$HOLDOUT" = "true" ]; then
      # Max iterations with holdout — transition to holdout phase
      jq '.loop = "holdout"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"
      echo ""
      echo "================================================"
      echo "  Max iterations reached ($ITERATION/$MAX_ITERATIONS)"
      echo "  R: $R | E: $E | C: $C"
      if [ -n "$ESCAPE_NOTE" ]; then
        echo "  Note:$ESCAPE_NOTE"
      fi
      echo "  Running holdout validation..."
      echo "================================================"

      echo "Max iterations reached with --holdout enabled. Run the holdout protocol from commands/dialectic.md: serialize the trace, spawn the holdout subagent, extract the verdict, and update state.json." >&2
      exit 2
    else
      jq '.loop = "awaiting_distillation"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"
      echo ""
      echo "================================================"
      echo "  Max iterations reached ($ITERATION/$MAX_ITERATIONS)"
      echo "  R: $R | E: $E | C: $C"
      if [ -n "$ESCAPE_NOTE" ]; then
        echo "  Note:$ESCAPE_NOTE"
      fi
      echo ""
      echo "  Run /dialectic:dialectic-distill to produce"
      echo "  the conviction memo."
      echo "  Run /dialectic:forge to produce build spec."
      echo "================================================"
      exit 0
    fi
  fi

  # Continue reasoning loop — increment iteration and re-feed
  NEW_ITERATION=$((ITERATION + 1))
  jq ".iteration = $NEW_ITERATION" "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"

  echo ""
  echo "================================================"
  echo "  Dialectic iteration $NEW_ITERATION / $MAX_ITERATIONS (floor: $MIN_ITERATIONS)"
  echo "  Confidence — R: $R | E: $E | C: $C"
  echo "  Thesis: ${THESIS}..."
  echo "  Decision: $DECISION -> continuing"
  echo "================================================"
  echo "Continue the dialectic reasoning cycle. Read state from .claude/dialectic/state.json and proceed with iteration $NEW_ITERATION." >&2

  exit 2  # Block stop, continue loop

# ============================================================
# DISTILLATION LOOP
# ============================================================
elif [ "$LOOP" = "distillation" ]; then

  # Enforce minimum distillation passes
  if [ "$DECISION" = "conclude" ] || [ "$DECISION" = "CONCLUDE" ]; then
    if [ "$DIST_ITER" -lt "$DIST_MIN" ]; then
      echo ""
      echo "================================================"
      echo "  CONCLUDE overridden — below distillation floor"
      echo "  Distillation pass $DIST_ITER < min $DIST_MIN"
      echo "  First-pass probes are lenient. Run adversarial pass."
      echo "================================================"
      NEW_DIST_ITER=$((DIST_ITER + 1))
      jq ".decision = null | .distillation_iteration = $NEW_DIST_ITER" "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"

      echo "Distillation pass $DIST_ITER is below the minimum ($DIST_MIN). The first draft is never the final memo — first-pass probes are lenient. Re-run all five probes in ADVERSARIAL mode: Sufficiency (could a *skeptical* reader act on this?), Conviction-Ink (find the weakest sentence), Tension (is the refutatio engaging the *strongest* counter?), Trace (is the altitude shift the *lead*?), Threads (remove one thread — does the argument collapse?). Revise the memo based on findings. Read state from .claude/dialectic/state.json and follow skills/dialectic/DISTILLATION.md." >&2
      exit 2
    fi

    # Distillation complete — preserve artifacts, clean up, and exit
    echo ""
    echo "================================================"
    echo "  Distillation complete! Memo finalized."
    echo "  Reasoning iterations: $ITERATION"
    echo "  Distillation iterations: $DIST_ITER"
    echo "  Final — R: $R | E: $E | C: $C"

    # Promote memo-draft to memo-final (hook owns this transition)
    if [ -f "$STATE_DIR/memo-draft.md" ] && [ ! -f "$STATE_DIR/memo-final.md" ]; then
      cp "$STATE_DIR/memo-draft.md" "$STATE_DIR/memo-final.md"
    fi

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

    echo "Distillation loop hit max iterations. Set decision to \"conclude\" in state.json and emit [ANALYSIS_COMPLETE]. The stop hook will promote memo-draft to memo-final. Read state from .claude/dialectic/state.json." >&2
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

# ============================================================
# HOLDOUT LOOP
# ============================================================
elif [ "$LOOP" = "holdout" ]; then

  if [ -n "$HOLDOUT_VERDICT" ] && [ "$HOLDOUT_VERDICT" != "null" ]; then
    # Verdict has been set — process it
    if [ "$HOLDOUT_VERDICT" = "FRACTURED" ] && [ "$HOLDOUT_PASS" -lt "$HOLDOUT_MAX_PASSES" ]; then
      # FRACTURED but more passes allowed — re-loop
      NEW_HOLDOUT_PASS=$((HOLDOUT_PASS + 1))
      jq ".holdout_state.pass = $NEW_HOLDOUT_PASS | .holdout_state.verdict = null | .loop = \"reasoning\" | .iteration = 0 | .decision = null | .phase = \"expansion\"" "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"

      echo ""
      echo "================================================"
      echo "  Holdout FRACTURED the thesis (pass $HOLDOUT_PASS/$HOLDOUT_MAX_PASSES)"
      echo "  Re-entering reasoning loop with counter-thesis..."
      echo "================================================"

      echo "Holdout fractured the thesis. Extract the counter-thesis from .claude/dialectic/holdout_report.md (look for the Recommendation section with RE-LOOP thesis). Run a fresh reasoning cycle with the counter-thesis: read the holdout report, adopt the counter-thesis, update state.json with the new thesis, and begin expansion. The holdout will re-run automatically when reasoning concludes." >&2
      exit 2
    else
      # VALIDATED, CHALLENGED, or FRACTURED at max passes — transition to awaiting_distillation
      jq '.loop = "awaiting_distillation"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"

      echo ""
      echo "================================================"
      echo "  Reasoning loop complete!"
      echo "  R: $R | E: $E | C: $C | Iterations: $ITERATION"
      echo "  Holdout verdict: $HOLDOUT_VERDICT"
      echo ""
      echo "  Run /dialectic:dialectic-distill to produce"
      echo "  the conviction memo."
      echo "  Run /dialectic:forge to produce build spec."
      echo "================================================"
      exit 0
    fi
  else
    # Verdict not yet set — holdout subagent may still be running
    echo "Process the holdout results. Read .claude/dialectic/holdout_report.md, extract the verdict (VALIDATED/CHALLENGED/FRACTURED), and update state.json: set holdout_state.verdict to the verdict and holdout_state.report_path to \".claude/dialectic/holdout_report.md\". If CHALLENGED, merge the adjusted confidence scores from the report into thesis.confidence." >&2
    exit 2
  fi

# ============================================================
# FORGE LOOP
# ============================================================
elif [ "$LOOP" = "forge" ]; then

  if [ "$DECISION" = "conclude" ] || [ "$DECISION" = "CONCLUDE" ]; then
    if [ "$FORGE_ITER" -lt "$FORGE_MIN" ]; then
      # Enforce minimum forge passes
      echo ""
      echo "================================================"
      echo "  CONCLUDE overridden — below forge floor"
      echo "  Forge pass $FORGE_ITER < min $FORGE_MIN"
      echo "  Quality checks need adversarial re-evaluation."
      echo "================================================"
      NEW_FORGE_ITER=$((FORGE_ITER + 1))
      jq ".decision = null | .forge_iteration = $NEW_FORGE_ITER" "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"

      echo "Forge pass $FORGE_ITER is below the minimum ($FORGE_MIN). Revise the forge spec based on quality check failures. Re-read .claude/dialectic/forge-draft.md and the quality check results. Fix the failing checks, update the draft, re-run all 7 checks. Follow skills/dialectic/FORGE.md." >&2
      exit 2
    fi

    # Forge complete — promote draft to report
    echo ""
    echo "================================================"
    echo "  Forge complete! Build spec finalized."
    echo "  Reasoning iterations: $ITERATION"
    echo "  Forge iterations: $FORGE_ITER"
    echo "  Final — R: $R | E: $E | C: $C"

    # Promote forge-draft to forge_report (hook owns this transition)
    if [ -f "$STATE_DIR/forge-draft.md" ] && [ ! -f "$STATE_DIR/forge_report.md" ]; then
      cp "$STATE_DIR/forge-draft.md" "$STATE_DIR/forge_report.md"
    fi

    # Mark forge as complete but do NOT clean up — user may still run distill
    jq '.loop = "awaiting_distillation" | .synthesis.forge_run = true | .synthesis.forge_path = ".claude/dialectic/forge_report.md"' "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"

    echo "  Forge report: .claude/dialectic/forge_report.md"
    echo ""
    echo "  Run /dialectic:dialectic-distill to also produce"
    echo "  a conviction memo, or /dialectic:cancel-dialectic"
    echo "  to preserve artifacts and clean up."
    echo "================================================"
    exit 0
  fi

  if [ "$FORGE_ITER" -ge "$FORGE_MAX" ]; then
    # Force conclude forge
    echo ""
    echo "================================================"
    echo "  Forge max iterations reached ($FORGE_ITER/$FORGE_MAX)"
    echo "  Finalize the spec as-is."
    echo "================================================"
    jq '.decision = "conclude"' "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"

    echo "Forge loop hit max iterations. Set decision to \"conclude\" in state.json. The stop hook will promote forge-draft.md to forge_report.md. Read state from .claude/dialectic/state.json." >&2
    exit 2
  fi

  # Continue forge — increment and re-feed
  NEW_FORGE_ITER=$((FORGE_ITER + 1))
  FORGE_PHASE=$(jq -r '.forge_phase // "drafting"' "$STATE_FILE" 2>/dev/null)
  jq ".forge_iteration = $NEW_FORGE_ITER | .decision = null" "$STATE_FILE" > "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"

  echo ""
  echo "================================================"
  echo "  Forge iteration $NEW_FORGE_ITER / $FORGE_MAX"
  echo "  Phase: $FORGE_PHASE"
  echo "================================================"

  echo "Revise the forge spec based on quality check failures. Re-read .claude/dialectic/forge-draft.md and the quality check results. Fix the failing checks, update the draft, re-run all 7 checks. Follow skills/dialectic/FORGE.md." >&2
  exit 2
fi
