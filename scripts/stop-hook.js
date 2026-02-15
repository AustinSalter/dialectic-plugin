#!/usr/bin/env node
// Dialectic Reasoning Stop Hook (cross-platform entry point)
//
// On macOS/Linux: delegates to stop-hook.sh (bash/jq)
// On Windows: handles logic directly in Node.js
//
// Exit 0 = allow stop
// Exit 2 = block stop (stderr is fed back to Claude as continuation prompt)

const fs = require("fs");
const path = require("path");

// On macOS/Linux, delegate to the bash hook
if (process.platform !== "win32") {
  const { execFileSync } = require("child_process");
  const bashHook = path.join(__dirname, "stop-hook.sh");
  try {
    execFileSync("bash", [bashHook], { stdio: "inherit" });
    process.exit(0);
  } catch (e) {
    process.exit(e.status || 1);
  }
}

// Windows: handle directly in Node.js

const STATE_DIR = ".claude/dialectic";
const STATE_FILE = path.join(STATE_DIR, "state.json");

// Check if dialectic loop is active
if (!fs.existsSync(STATE_FILE)) {
  process.exit(0);
}

// Read state
let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
} catch (e) {
  process.exit(0);
}

const loop = state.loop || "reasoning";
const decision = (state.decision || "").toLowerCase();
const iteration = state.iteration || 0;
const minIterations = state.min_iterations || 2;
const maxIterations = state.max_iterations || 5;
const confidence = state.thesis && state.thesis.confidence != null ? state.thesis.confidence : 0;
const thesis = ((state.thesis && state.thesis.current) || "").substring(0, 100);

function writeState(obj) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(obj, null, 2));
}

function log(msg) {
  process.stdout.write(msg + "\n");
}

function blockStop(reason) {
  process.stderr.write(reason + "\n");
  process.exit(2);
}

// ============================================================
// REASONING LOOP
// ============================================================
if (loop === "reasoning") {

  // Check for completion — enforce iteration floor
  if (decision === "conclude") {
    if (iteration < minIterations) {
      log("");
      log("================================================");
      log("  CONCLUDE overridden — below iteration floor");
      log(`  Iteration ${iteration} < min_iterations ${minIterations}`);
      log("  Forcing CONTINUE for deeper analysis...");
      log("================================================");
      state.decision = "continue";
      writeState(state);
      // Fall through to continue block
    } else {
      // TRANSITION TO DISTILLATION LOOP
      log("");
      log("================================================");
      log("  Reasoning loop complete!");
      log(`  Confidence: ${confidence} | Iterations: ${iteration}`);
      log("  Transitioning to distillation loop...");
      log("================================================");
      state.loop = "distillation";
      state.distillation_iteration = 1;
      state.distillation_max = 3;
      state.decision = null;
      state.distillation_phase = "spine_extraction";
      writeState(state);

      blockStop(
        `Reasoning loop complete. Begin distillation loop. Read skills/dialectic/DISTILLATION.md for instructions. Extract the reasoning spine from the scratchpad, then draft the conviction memo. Read state from .claude/dialectic/state.json.`
      );
    }
  }

  // Check iteration limit — force transition to distillation
  if (iteration >= maxIterations) {
    log("");
    log("================================================");
    log(`  Max iterations reached (${iteration}/${maxIterations})`);
    log("  Forcing transition to distillation loop...");
    log("================================================");
    state.loop = "distillation";
    state.distillation_iteration = 1;
    state.distillation_max = 3;
    state.decision = null;
    state.distillation_phase = "spine_extraction";
    writeState(state);

    blockStop(
      `Reasoning loop hit max iterations. Begin distillation loop. Read skills/dialectic/DISTILLATION.md for instructions. ${confidence < 0.5 ? "Confidence is low — also reference skills/dialectic/ESCAPE-HATCH.md for honest uncertainty acknowledgment in the memo." : ""} Read state from .claude/dialectic/state.json.`
    );
  }

  // Continue reasoning loop — increment iteration and re-feed
  const newIteration = iteration + 1;
  state.iteration = newIteration;
  writeState(state);

  log("");
  log("================================================");
  log(`  Dialectic iteration ${newIteration} / ${maxIterations} (floor: ${minIterations})`);
  log(`  Current confidence: ${confidence}`);
  log(`  Thesis: ${thesis}...`);
  log(`  Decision: ${decision} -> continuing`);
  log("================================================");

  blockStop(
    `Continue the dialectic reasoning cycle. Read state from .claude/dialectic/state.json and proceed with iteration ${newIteration}.`
  );

// ============================================================
// DISTILLATION LOOP
// ============================================================
} else if (loop === "distillation") {

  const distIter = state.distillation_iteration || 1;
  const distMax = state.distillation_max || 3;

  if (decision === "conclude") {
    // Distillation complete — clean up and exit
    log("");
    log("================================================");
    log("  Distillation complete! Memo finalized.");
    log(`  Reasoning iterations: ${iteration}`);
    log(`  Distillation iterations: ${distIter}`);
    log(`  Final confidence: ${confidence}`);
    log("================================================");
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
    process.exit(0);
  }

  if (distIter >= distMax) {
    // Force conclude distillation
    log("");
    log("================================================");
    log(`  Distillation max iterations reached (${distIter}/${distMax})`);
    log("  Finalize the memo as-is.");
    log("================================================");
    state.decision = "conclude";
    writeState(state);

    blockStop(
      `Distillation loop hit max iterations. Write the final memo to .claude/dialectic/memo-final.md as-is and emit [ANALYSIS_COMPLETE]. Read state from .claude/dialectic/state.json.`
    );
  }

  // Continue distillation — increment and re-feed
  state.distillation_iteration = distIter + 1;
  state.decision = null;
  writeState(state);

  log("");
  log("================================================");
  log(`  Distillation iteration ${distIter + 1} / ${distMax}`);
  log(`  Phase: ${state.distillation_phase || "drafting"}`);
  log("================================================");

  blockStop(
    `Continue the distillation loop. Run fidelity check and clarity check against the current draft. Revise if either fails. Read state from .claude/dialectic/state.json and follow skills/dialectic/DISTILLATION.md.`
  );
}
