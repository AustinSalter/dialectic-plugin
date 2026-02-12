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

// Check for completion — but enforce iteration floor
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
    // Fall through to the continue block below
  } else {
    log("");
    log("================================================");
    log("  Dialectic reasoning complete!");
    log(`  Final confidence: ${confidence}`);
    log(`  Iterations: ${iteration}`);
    log("================================================");
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
    process.exit(0);
  }
}

// Check iteration limit
if (iteration >= maxIterations) {
  log("");
  log("================================================");
  log(`  Max iterations reached (${iteration}/${maxIterations})`);
  log("  Running escape hatch for final synthesis...");
  log("================================================");
  state.decision = "conclude";
  writeState(state);

  blockStop(
    `Continue the dialectic reasoning cycle. Max iterations reached - run ESCAPE-HATCH and SYNTHESIS passes. Read state from .claude/dialectic/state.json.`
  );
}

// Continue loop - increment iteration and re-feed
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
