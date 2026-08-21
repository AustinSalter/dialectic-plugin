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
if (process.platform !== "win32" && process.env.DIALECTIC_HOOK_IMPL !== "node") {
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

function tsStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function state0OutputDir() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).output_dir; } catch { return null; }
}

// Staleness guard: if state.json hasn't been modified in 2 hours,
// the session is orphaned (e.g. terminal closed mid-session).
// Allow the stop so the hook doesn't block every future conversation.
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
const stateAge = Date.now() - fs.statSync(STATE_FILE).mtimeMs;
if (stateAge > STALE_THRESHOLD_MS) {
  const outputDir = (state0OutputDir() || ".dialectic-output/").replace(/\/$/, "");
  const archiveDir = path.join(outputDir, "abandoned-" + tsStamp());
  fs.mkdirSync(archiveDir, { recursive: true });
  try {
    fs.cpSync(STATE_DIR, archiveDir, { recursive: true });
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
    process.stderr.write(
      `Dialectic state was stale. Archived the abandoned session to ${archiveDir} and cleared the state dir. Start fresh with /dialectic:dialectic.\n`
    );
  } catch (e) {
    process.stderr.write(
      "Dialectic state is stale but archiving failed — leaving .claude/dialectic in place. Archive it manually.\n"
    );
  }
  process.exit(0);
}

// Read state
let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
} catch (e) {
  process.exit(0);
}

// Liveness beacon: models check this to detect a hook that never fired.
state.last_hook_ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
writeState(state);

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

const SCRATCHPAD = path.join(STATE_DIR, "scratchpad.md");

function countBlocks(re) {
  try {
    return (fs.readFileSync(SCRATCHPAD, "utf8").match(re) || []).length;
  } catch { return 0; }
}

// Warrant gate: a decision is only honored if its reasoning was externalized.
if (decision) {
  if (loop === "reasoning") {
    const n = countBlocks(/^[ \t]*probes:/gm);
    if (n < iteration) {
      blockStop(`Warrant gate: found ${n} 'probes:' block(s) in scratchpad.md but iteration is ${iteration}. Append the full critique output for this iteration (probes:, preservation:, decision block) to .claude/dialectic/scratchpad.md, then stop again. The decision stands; only its warrant is missing.`);
    }
    if (decision === "reject" && countBlocks(/^[ \t]*if_reject/gm) === 0) {
      blockStop("Warrant gate: decision is reject but scratchpad.md has no if_reject block. Append if_reject with refuting_basis (which claims/evidence the refutation rests on) and optional counter_thesis, then stop again.");
    }
  }
  if (loop === "distillation" && decision === "conclude") {
    const n = countBlocks(/^[ \t]*probe_results:/gm);
    const distIter = state.distillation_iteration || 1;
    if (n < distIter) {
      blockStop(`Warrant gate: found ${n} 'probe_results:' block(s) in scratchpad.md but distillation pass is ${distIter}. Append this pass's probe_results: yaml (all five probes with per-probe verdicts and quoted evidence) to .claude/dialectic/scratchpad.md, then stop again.`);
    }
  }
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
  holdout_report: "holdout_report.md",
  forge_report: "forge_report.md",
  forge_draft: "forge-draft.md",
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

function checkpointArtifacts() {
  const outputDir = (state.output_dir || ".dialectic-output/").replace(/\/$/, "");
  let sessionId = state.session_id || "";
  if (!/^dialectic-\d{8}T\d{6}$/.test(sessionId)) {
    sessionId = "dialectic-" + tsStamp();
    state.session_id = sessionId;
    writeState(state);
  }
  const checkpointDir = path.join(outputDir, sessionId, "checkpoint");
  fs.mkdirSync(checkpointDir, { recursive: true });
  for (const f of ["scratchpad.md", "thesis-history.md", "prompt.md", "state.json"]) {
    const src = path.join(STATE_DIR, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(checkpointDir, f));
  }
  log(`  Checkpoint: ${checkpointDir}`);
}

// Wait barrier: before terminal decisions (CONCLUDE/ELEVATE/max-iterations),
// wait for active background explorations to complete (up to 120s).
// Returns true if new results arrived during the wait.
function waitForExplorations(state) {
  const active = (state.explorations && state.explorations.active) || [];
  if (active.length === 0) return false;

  const explorationsDir = path.join(STATE_DIR, "explorations");
  if (!fs.existsSync(explorationsDir)) return false;

  const initialCount = fs.readdirSync(explorationsDir).filter(f => f.endsWith(".md")).length;
  if (initialCount >= active.length) return false; // all results already present

  const pending = active.length - initialCount;
  log(`  Waiting for ${pending} background exploration(s) (timeout: 120s)...`);

  const { execSync } = require("child_process");
  const timeoutMs = 120000;
  const pollMs = 5000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    execSync("sleep 5");
    const count = fs.readdirSync(explorationsDir).filter(f => f.endsWith(".md")).length;
    if (count >= active.length) {
      log(`  Explorations completed (${count} result(s))`);
      return true;
    }
  }

  const finalCount = fs.readdirSync(explorationsDir).filter(f => f.endsWith(".md")).length;
  log(`  Exploration timeout — ${finalCount}/${active.length} completed`);
  return finalCount > initialCount; // true if any new results arrived
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
      // Wait barrier: wait for active explorations before finalizing
      if (waitForExplorations(state)) {
        blockStop(
          `Background exploration(s) completed while concluding. Re-run the convergence check (skills/dialectic/CRITIQUE.md) with the new results in .claude/dialectic/explorations/ before finalizing the CONCLUDE decision. Update convergence in state.json.`
        );
      }

      if (state.holdout === true) {
        // REASONING COMPLETE with holdout — transition to holdout phase
        state.loop = "holdout";
        writeState(state);
        log("");
        log("================================================");
        log("  Reasoning loop complete! Running holdout validation...");
        log(`  R: ${R} | E: ${E} | C: ${C} | Iterations: ${iteration}`);
        log("================================================");

        blockStop(
          `Reasoning concluded with --holdout enabled. Run the holdout protocol from commands/dialectic.md: serialize the trace, spawn the holdout subagent, extract the verdict, and update state.json.`
        );
      } else {
        // REASONING COMPLETE — exit cleanly, user invokes distillation separately
        state.loop = "awaiting_distillation";
        writeState(state);
        checkpointArtifacts();
        log("");
        log("================================================");
        log("  Reasoning loop complete!");
        log(`  R: ${R} | E: ${E} | C: ${C} | Iterations: ${iteration}`);
        log("");
        log("  Run /dialectic:dialectic-distill to produce");
        log("  the conviction memo.");
        log("  Run /dialectic:forge to produce build spec.");
        log("================================================");
        process.exit(0);
      }
    }
  }

  // Check for rejection — the thesis is refuted. Legal from iteration 1:
  // floors prevent premature conclusion; premature death is the point.
  if (decision === "reject") {
    if (waitForExplorations(state)) {
      blockStop(
        `Background exploration(s) completed while rejecting. Re-run the convergence check (skills/dialectic/CRITIQUE.md) with the new results in .claude/dialectic/explorations/ before finalizing the REJECT decision.`
      );
    }

    const rejectPasses = state.reject_passes || 0;
    const counterThesis = state.counter_thesis || null;

    if (counterThesis && rejectPasses < 1) {
      state.reject_passes = rejectPasses + 1;
      state.thesis.current = counterThesis;
      state.counter_thesis = null;
      state.iteration = 0;
      state.decision = null;
      state.phase = "expansion";
      writeState(state);

      log("");
      log("================================================");
      log("  REJECT — thesis refuted, counter-thesis offered");
      log("  Re-entering reasoning with the counter-thesis (re-loop 1/1)");
      log("================================================");

      blockStop(
        `The critique rejected the thesis and proposed a counter-thesis. Read the if_reject block in scratchpad.md for the refuting basis. The counter-thesis is now thesis.current in state.json. Begin a fresh expansion pass from it. Claims killed by the refutation must be recorded as killed, not silently dropped.`
      );
    } else {
      state.loop = "awaiting_distillation";
      state.thesis.status = "refuted";
      state.decision = null;
      writeState(state);
      checkpointArtifacts();

      log("");
      log("================================================");
      log(`  Thesis REFUTED (iteration ${iteration})`);
      log(`  R: ${R} | E: ${E} | C: ${C}`);
      log("");
      log("  Run /dialectic:dialectic-distill to produce");
      log("  the refutation memo — knowing why it's wrong");
      log("  is a conviction too.");
      log("================================================");
      process.exit(0);
    }
  }

  // Check for elevation — reframe thesis entirely
  if (decision === "elevate") {
    const elevateTrigger = (state.elevate_trigger || "original").toLowerCase();
    // Evidence gate: only the "original" trigger requires E >= 0.4
    // Eager triggers (lakatosian, adversarial, chamberlin) have their own logic
    if (elevateTrigger === "original" && E < 0.4) {
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
      // Wait barrier: wait for active explorations before elevating
      if (waitForExplorations(state)) {
        blockStop(
          `Background exploration(s) completed while elevating. Re-run the convergence check (skills/dialectic/CRITIQUE.md) with the new results in .claude/dialectic/explorations/ before finalizing the ELEVATE decision. The exploration results may inform the elevated thesis.`
        );
      }

      const newIteration = iteration + 1;
      state.iteration = newIteration;
      state.phase = "expansion";
      state.decision = null;
      writeState(state);

      log("");
      log("================================================");
      log("  ELEVATE — thesis needs fundamental reframe");
      log(`  Iteration ${newIteration} / ${maxIterations}`);
      if (elevateTrigger === "original") {
        log(`  Evidence gate passed: E=${E} >= 0.4`);
      } else {
        log(`  Eager trigger: ${elevateTrigger} (evidence gate bypassed)`);
      }
      log("================================================");

      blockStop(
        `The critique determined the thesis needs elevation — a fundamental reframe. Read the elevated thesis from the critique output in scratchpad.md (look for the if_elevate block). Adopt the elevated thesis as your new working thesis, update state.json, and begin a fresh expansion pass from the new frame.`
      );
    }
  }

  // Check iteration limit — reasoning complete, user invokes distillation separately
  if (iteration >= maxIterations) {
    // Wait barrier: wait for active explorations before forced conclusion
    if (waitForExplorations(state)) {
      blockStop(
        `Background exploration(s) completed at max iterations. Re-run the convergence check (skills/dialectic/CRITIQUE.md) with the new results in .claude/dialectic/explorations/ before concluding. Update convergence in state.json.`
      );
    }

    let escapeNote = "";
    if (E < 0.5) escapeNote += ` E=${E} (low evidence saturation).`;
    if (C < 0.5) escapeNote += ` C=${C} (low domain determinacy).`;

    if (state.holdout === true) {
      // Max iterations with holdout — transition to holdout phase
      state.loop = "holdout";
      writeState(state);
      log("");
      log("================================================");
      log(`  Max iterations reached (${iteration}/${maxIterations})`);
      log(`  R: ${R} | E: ${E} | C: ${C}`);
      if (escapeNote) log(`  Note:${escapeNote}`);
      log("  Running holdout validation...");
      log("================================================");

      blockStop(
        `Max iterations reached with --holdout enabled. Run the holdout protocol from commands/dialectic.md: serialize the trace, spawn the holdout subagent, extract the verdict, and update state.json.`
      );
    } else {
      state.loop = "awaiting_distillation";
      writeState(state);
      checkpointArtifacts();
      log("");
      log("================================================");
      log(`  Max iterations reached (${iteration}/${maxIterations})`);
      log(`  R: ${R} | E: ${E} | C: ${C}`);
      if (escapeNote) log(`  Note:${escapeNote}`);
      log("");
      log("  Run /dialectic:dialectic-distill to produce");
      log("  the conviction memo.");
      log("  Run /dialectic:forge to produce build spec.");
      log("================================================");
      process.exit(0);
    }
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
    // No-memo gate: distillation cannot conclude without a draft or final memo.
    const draftExists = fs.existsSync(path.join(STATE_DIR, "memo-draft.md"));
    const finalExists = fs.existsSync(path.join(STATE_DIR, "memo-final.md"));
    if (!draftExists && !finalExists) {
      blockStop("Distillation cannot conclude — no memo-draft.md exists. Write the memo draft per skills/dialectic/DISTILLATION.md, keep decision as conclude, and stop again.");
    }

    // Promotion check: the memo must carry its commitments (SYNTHESIS.md spec).
    const draftCheck = path.join(STATE_DIR, "memo-draft.md");
    if (fs.existsSync(draftCheck)) {
      const memo = fs.readFileSync(draftCheck, "utf8");
      const missing = [];
      if ((state.thesis && state.thesis.status) === "refuted") {
        if (!/refut/i.test(memo)) missing.push("refutation-basis");
      } else {
        if (!/(^|[^a-z])bet([^a-z]|$)/i.test(memo)) missing.push("the-bet");
        if (!/falsif|disconfirm/i.test(memo)) missing.push("disconfirmation");
      }
      if (missing.length) {
        blockStop(`Memo promotion blocked — memo-draft.md is missing: ${missing.join(", ")}. The memo spec is skills/dialectic/SYNTHESIS.md: state the bet and its falsification triggers (or, for a refuted thesis, the refuting basis). Revise memo-draft.md, keep decision as conclude, and stop again.`);
      }
    }

    // Distillation complete — preserve artifacts, clean up, and exit
    log("");
    log("================================================");
    log("  Distillation complete! Memo finalized.");
    log(`  Reasoning iterations: ${iteration}`);
    log(`  Distillation iterations: ${distIter}`);
    log(`  Final — R: ${R} | E: ${E} | C: ${C}`);

    // Promote memo-draft to memo-final (hook owns this transition)
    const draftPath = path.join(STATE_DIR, "memo-draft.md");
    const finalPath = path.join(STATE_DIR, "memo-final.md");
    if (fs.existsSync(draftPath) && !fs.existsSync(finalPath)) {
      fs.copyFileSync(draftPath, finalPath);
    }

    // Preserve artifacts before cleanup
    const outputDir = state.output_dir || ".dialectic-output/";
    const keepArtifacts = state.keep_artifacts || ["memo", "spine", "history", "scratchpad", "state", "prompt"];
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
      `Distillation loop hit max iterations. Set decision to "conclude" in state.json and emit [ANALYSIS_COMPLETE]. The stop hook will promote memo-draft to memo-final. Read state from .claude/dialectic/state.json.`
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

// ============================================================
// HOLDOUT LOOP
// ============================================================
} else if (loop === "holdout") {

  const holdoutState = state.holdout_state || {};
  const holdoutVerdict = holdoutState.verdict || null;
  const holdoutPass = holdoutState.pass || 1;
  const holdoutMaxPasses = holdoutState.max_passes || 2;

  if (holdoutVerdict) {
    // Verdict has been set — process it
    if (holdoutVerdict === "FRACTURED" && holdoutPass < holdoutMaxPasses) {
      // FRACTURED but more passes allowed — re-loop
      state.holdout_state.pass = holdoutPass + 1;
      state.holdout_state.verdict = null;
      state.loop = "reasoning";
      state.iteration = 0;
      state.decision = null;
      state.phase = "expansion";
      writeState(state);

      log("");
      log("================================================");
      log(`  Holdout FRACTURED the thesis (pass ${holdoutPass}/${holdoutMaxPasses})`);
      log("  Re-entering reasoning loop with counter-thesis...");
      log("================================================");

      blockStop(
        `Holdout fractured the thesis. Extract the counter-thesis from .claude/dialectic/holdout_report.md (look for the Recommendation section with RE-LOOP thesis). Run a fresh reasoning cycle with the counter-thesis: read the holdout report, adopt the counter-thesis, update state.json with the new thesis, and begin expansion. The holdout will re-run automatically when reasoning concludes.`
      );
    } else {
      // VALIDATED, CHALLENGED, or FRACTURED at max passes — transition to awaiting_distillation
      state.loop = "awaiting_distillation";
      writeState(state);
      checkpointArtifacts();

      log("");
      log("================================================");
      log("  Reasoning loop complete!");
      log(`  R: ${R} | E: ${E} | C: ${C} | Iterations: ${iteration}`);
      log(`  Holdout verdict: ${holdoutVerdict}`);
      log("");
      log("  Run /dialectic:dialectic-distill to produce");
      log("  the conviction memo.");
      log("  Run /dialectic:forge to produce build spec.");
      log("================================================");
      process.exit(0);
    }
  } else {
    // Verdict not yet set — holdout subagent may still be running or results need processing
    blockStop(
      `Process the holdout results. Read .claude/dialectic/holdout_report.md, extract the verdict (VALIDATED/CHALLENGED/FRACTURED), and update state.json: set holdout_state.verdict to the verdict and holdout_state.report_path to ".claude/dialectic/holdout_report.md". If CHALLENGED, merge the adjusted confidence scores from the report into thesis.confidence.`
    );
  }

// ============================================================
// FORGE LOOP
// ============================================================
} else if (loop === "forge") {

  const forgeIter = state.forge_iteration || 1;
  const forgeMax = state.forge_max || 4;
  const forgeMin = state.forge_min || 2;

  if (decision === "conclude" && forgeIter < forgeMin) {
    // Enforce minimum forge passes
    log("");
    log("================================================");
    log("  CONCLUDE overridden — below forge floor");
    log(`  Forge pass ${forgeIter} < min ${forgeMin}`);
    log("  Quality checks need adversarial re-evaluation.");
    log("================================================");
    state.decision = null;
    state.forge_iteration = forgeIter + 1;
    writeState(state);

    blockStop(
      `Forge pass ${forgeIter} is below the minimum (${forgeMin}). Revise the forge spec based on quality check failures. Re-read .claude/dialectic/forge-draft.md and the quality check results. Fix the failing checks, update the draft, re-run all 7 checks. Follow skills/dialectic/FORGE.md.`
    );
  }

  if (decision === "conclude") {
    // Forge complete — promote draft to report
    log("");
    log("================================================");
    log("  Forge complete! Build spec finalized.");
    log(`  Reasoning iterations: ${iteration}`);
    log(`  Forge iterations: ${forgeIter}`);
    log(`  Final — R: ${R} | E: ${E} | C: ${C}`);

    // Promote forge-draft to forge_report (hook owns this transition)
    const draftPath = path.join(STATE_DIR, "forge-draft.md");
    const reportPath = path.join(STATE_DIR, "forge_report.md");
    if (fs.existsSync(draftPath) && !fs.existsSync(reportPath)) {
      fs.copyFileSync(draftPath, reportPath);
    }

    // Mark forge as complete but do NOT clean up — user may still run distill
    state.loop = "awaiting_distillation";
    if (!state.synthesis) state.synthesis = {};
    state.synthesis.forge_run = true;
    state.synthesis.forge_path = ".claude/dialectic/forge_report.md";
    writeState(state);
    checkpointArtifacts();

    log(`  Forge report: .claude/dialectic/forge_report.md`);
    log("");
    log("  Run /dialectic:dialectic-distill to also produce");
    log("  a conviction memo, or /dialectic:cancel-dialectic");
    log("  to preserve artifacts and clean up.");
    log("================================================");
    process.exit(0);
  }

  if (forgeIter >= forgeMax) {
    // Force conclude forge
    log("");
    log("================================================");
    log(`  Forge max iterations reached (${forgeIter}/${forgeMax})`);
    log("  Finalize the spec as-is.");
    log("================================================");
    state.decision = "conclude";
    writeState(state);

    blockStop(
      `Forge loop hit max iterations. Set decision to "conclude" in state.json. The stop hook will promote forge-draft.md to forge_report.md. Read state from .claude/dialectic/state.json.`
    );
  }

  // Continue forge — increment and re-feed
  state.forge_iteration = forgeIter + 1;
  state.decision = null;
  writeState(state);

  log("");
  log("================================================");
  log(`  Forge iteration ${forgeIter + 1} / ${forgeMax}`);
  log(`  Phase: ${state.forge_phase || "drafting"}`);
  log("================================================");

  blockStop(
    `Revise the forge spec based on quality check failures. Re-read .claude/dialectic/forge-draft.md and the quality check results. Fix the failing checks, update the draft, re-run all 7 checks. Follow skills/dialectic/FORGE.md.`
  );
}
