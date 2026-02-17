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
const minIterations = state.min_iterations || 3;
const maxIterations = state.max_iterations || 5;
// 3D Confidence: R (defensibility), E (evidence saturation), C (domain determinacy)
const conf = (state.thesis && state.thesis.confidence) || {};
const R = typeof conf === "object" ? (conf.R != null ? conf.R : 0.5) : conf;
const E = typeof conf === "object" ? (conf.E != null ? conf.E : 0.5) : conf;
const C = typeof conf === "object" ? (conf.C != null ? conf.C : 0.5) : conf;
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

// Artifact name → filename mapping
const ARTIFACT_MAP = {
  memo: "memo-final.md",
  spine: "spine.yaml",
  history: "thesis-history.md",
  prompt: "prompt.md",
  scratchpad: "scratchpad.md",
  draft: "memo-draft.md",
  state: "state.json",
};

function preserveArtifacts(stateDir, outputDir, artifactNames, sessionId) {
  // Resolve "all" and "none"
  if (artifactNames.includes("none")) return null;
  if (artifactNames.includes("all")) {
    artifactNames = Object.keys(ARTIFACT_MAP);
  }

  const sessionDir = path.join(outputDir, sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });

  const copied = [];
  for (const name of artifactNames) {
    const filename = ARTIFACT_MAP[name];
    if (!filename) continue;
    const src = path.join(stateDir, filename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(sessionDir, filename));
      copied.push(filename);
    }
  }

  // Write manifest
  const manifest = {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    artifacts: copied,
    reasoning_iterations: iteration,
    final_confidence: { R, E, C },
  };
  fs.writeFileSync(
    path.join(sessionDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  return sessionDir;
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
      // REASONING COMPLETE — exit cleanly, user invokes distillation separately
      state.loop = "awaiting_distillation";
      writeState(state);
      log("");
      log("================================================");
      log("  Reasoning loop complete!");
      log(`  R: ${R} | E: ${E} | C: ${C} | Iterations: ${iteration}`);
      log("");
      log("  Run /dialectic:dialectic-distill to produce");
      log("  the conviction memo.");
      log("================================================");
      process.exit(0);
    }
  }

  // Check for elevation — reframe thesis entirely
  if (decision === "elevate") {
    // Evidence gate: ELEVATE requires E >= 0.4 (CRITIQUE.md rule)
    if (E < 0.4) {
      log("");
      log("================================================");
      log("  ELEVATE blocked — evidence gate failed");
      log(`  E=${E} < 0.4. Not enough evidence to know the right altitude.`);
      log("  Downgrading to CONTINUE with altitude_suspect flag.");
      log("================================================");
      state.decision = "continue";
      writeState(state);
      // Fall through to continue block
    } else {
      const newIteration = iteration + 1;
      state.iteration = newIteration;
      state.phase = "expansion";
      state.decision = null;
      writeState(state);

      log("");
      log("================================================");
      log("  ELEVATE — thesis needs fundamental reframe");
      log(`  Iteration ${newIteration} / ${maxIterations}`);
      log(`  Evidence gate passed: E=${E} >= 0.4`);
      log("================================================");

      blockStop(
        `The critique determined the thesis needs elevation — a fundamental reframe. Read the elevated thesis from the critique output in scratchpad.md (look for the if_elevate block). Adopt the elevated thesis as your new working thesis, update state.json, and begin a fresh expansion pass from the new frame.`
      );
    }
  }

  // Check iteration limit — reasoning complete, user invokes distillation separately
  if (iteration >= maxIterations) {
    state.loop = "awaiting_distillation";
    writeState(state);

    let escapeNote = "";
    if (E < 0.5) escapeNote += ` E=${E} (low evidence saturation).`;
    if (C < 0.5) escapeNote += ` C=${C} (low domain determinacy).`;

    log("");
    log("================================================");
    log(`  Max iterations reached (${iteration}/${maxIterations})`);
    log(`  R: ${R} | E: ${E} | C: ${C}`);
    if (escapeNote) log(`  Note:${escapeNote}`);
    log("");
    log("  Run /dialectic:dialectic-distill to produce");
    log("  the conviction memo.");
    log("================================================");
    process.exit(0);
  }

  // Continue reasoning loop — increment iteration and re-feed
  const newIteration = iteration + 1;
  state.iteration = newIteration;
  writeState(state);

  log("");
  log("================================================");
  log(`  Dialectic iteration ${newIteration} / ${maxIterations} (floor: ${minIterations})`);
  log(`  Confidence — R: ${R} | E: ${E} | C: ${C}`);
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
  const distMax = state.distillation_max || 4;
  const distMin = state.distillation_min || 2;

  if (decision === "conclude" && distIter < distMin) {
    // Enforce minimum distillation passes — first draft is never the final memo
    log("");
    log("================================================");
    log("  CONCLUDE overridden — below distillation floor");
    log(`  Distillation pass ${distIter} < min ${distMin}`);
    log("  First-pass probes are lenient. Run adversarial pass.");
    log("================================================");
    state.decision = null;
    state.distillation_iteration = distIter + 1;
    writeState(state);

    blockStop(
      `Distillation pass ${distIter} is below the minimum (${distMin}). The first draft is never the final memo — first-pass probes are lenient. Re-run all five probes in ADVERSARIAL mode: Sufficiency (could a *skeptical* reader act on this?), Conviction-Ink (find the weakest sentence), Tension (is the refutatio engaging the *strongest* counter?), Trace (is the altitude shift the *lead*?), Threads (remove one thread — does the argument collapse?). Revise the memo based on findings. Read state from .claude/dialectic/state.json and follow skills/dialectic/DISTILLATION.md.`
    );
  }

  if (decision === "conclude") {
    // Distillation complete — preserve artifacts, clean up, and exit
    log("");
    log("================================================");
    log("  Distillation complete! Memo finalized.");
    log(`  Reasoning iterations: ${iteration}`);
    log(`  Distillation iterations: ${distIter}`);
    log(`  Final — R: ${R} | E: ${E} | C: ${C}`);

    // Preserve artifacts before cleanup
    const outputDir = state.output_dir || ".dialectic-output/";
    const keepArtifacts = state.keep_artifacts || ["memo", "spine", "history"];
    const sessionId = state.session_id || "dialectic-" + Date.now();
    const savedTo = preserveArtifacts(STATE_DIR, outputDir, keepArtifacts, sessionId);
    if (savedTo) {
      log(`  Artifacts saved to: ${savedTo}`);
    }

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
    `Continue the distillation loop. Run all five distillation probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads) and the Compression Gate against the current draft. Revise if any probe fails or the gate is incomplete. Read state from .claude/dialectic/state.json and follow skills/dialectic/DISTILLATION.md.`
  );
}
