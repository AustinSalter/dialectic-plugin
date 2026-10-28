import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

export const BOTH = ["sh", "js"];

export function makeSandbox() {
  const dir = mkdtempSync(join(tmpdir(), "dialectic-test-"));
  const stateDir = join(dir, ".claude", "dialectic");
  mkdirSync(stateDir, { recursive: true });
  return { dir, stateDir, statePath: join(stateDir, "state.json") };
}

export function writeState(sandbox, overrides = {}) {
  const base = {
    session_id: "dialectic-20260819T120000",
    prompt: "test question",
    iteration: 3,
    loop: "reasoning",
    min_iterations: 3,
    max_iterations: 5,
    phase: "critique",
    thesis: { current: "test thesis", confidence: { R: 0.6, E: 0.6, C: 0.6 }, confidence_history: [] },
    evidence: { supporting: [], challenging: [] },
    decision: null,
    holdout: false,
    holdout_state: { pass: 1, max_passes: 2, verdict: null, report_path: null },
    output_dir: ".dialectic-output/",
    keep_artifacts: ["memo", "spine", "history", "scratchpad", "state", "prompt"],
  };
  writeFileSync(sandbox.statePath, JSON.stringify({ ...base, ...overrides }, null, 2));
}

// Scratchpad with N probes: blocks so the warrant gate (Task 2) passes for iteration N.
export function writeScratchpad(sandbox, { probeBlocks = 3, extra = "" } = {}) {
  let text = "";
  for (let i = 1; i <= probeBlocks; i++) {
    text += `## Iteration ${i} critique\n\nprobes:\n  contingency: STRUCTURAL — test\n\n`;
  }
  writeFileSync(join(sandbox.stateDir, "scratchpad.md"), text + extra);
}

export function writeArtifact(sandbox, name, content) {
  writeFileSync(join(sandbox.stateDir, name), content);
}

// opts.cwd: the hook process's cwd. opts.projectDir: CLAUDE_PROJECT_DIR (null to unset).
// opts.input: hook input JSON (object) written to stdin, as the harness does.
export function runHook(sandbox, impl, { cwd = sandbox.dir, projectDir = sandbox.dir, input } = {}) {
  const cmd = impl === "sh"
    ? { file: "bash", args: [join(REPO, "scripts", "stop-hook.sh")] }
    : { file: "node", args: [join(REPO, "scripts", "stop-hook.js")] };
  const env = { ...process.env, CLAUDE_PROJECT_DIR: projectDir, DIALECTIC_HOOK_IMPL: impl === "js" ? "node" : "" };
  delete env.DIALECTIC_ROOT;
  if (projectDir === null) delete env.CLAUDE_PROJECT_DIR;
  return spawnSync(cmd.file, cmd.args, {
    cwd,
    encoding: "utf8",
    input: input === undefined ? undefined : JSON.stringify(input),
    env,
  });
}

export function readState(sandbox) {
  return JSON.parse(readFileSync(sandbox.statePath, "utf8"));
}
