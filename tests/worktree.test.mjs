// Regression (2026-10-27): a session started in the main checkout, entered a
// worktree, and ran /dialectic:dialectic there. State was written in the
// worktree; the hook anchored to CLAUDE_PROJECT_DIR (the main checkout, where
// the session started — it does not follow Claude into a worktree), found no
// state, and exited 0. The hook input's `cwd` does follow Claude.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { makeSandbox, writeState, writeScratchpad, runHook, readState, BOTH } from "./helpers.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

// main/            (.git dir)          ← CLAUDE_PROJECT_DIR when launched here
// main/.claude/worktrees/option-c/     (.git file) ← where Claude works after entering
function makeWorktreeLayout(stateIn) {
  const main = mkdtempSync(join(tmpdir(), "dialectic-main-"));
  mkdirSync(join(main, ".git"));
  const wt = join(main, ".claude", "worktrees", "option-c");
  mkdirSync(join(wt, "src"), { recursive: true });
  writeFileSync(join(wt, ".git"), `gitdir: ${join(main, ".git", "worktrees", "option-c")}\n`);
  const home = stateIn === "worktree" ? wt : main;
  const stateDir = join(home, ".claude", "dialectic");
  mkdirSync(stateDir, { recursive: true });
  const sb = { dir: home, stateDir, statePath: join(stateDir, "state.json") };
  writeState(sb, { iteration: 1, decision: null });
  writeScratchpad(sb, { probeBlocks: 1 });
  return { main, wt, sb };
}

for (const impl of BOTH) {
  test(`[${impl}] follows hook input cwd into a worktree when CLAUDE_PROJECT_DIR is the main checkout`, () => {
    const { main, wt, sb } = makeWorktreeLayout("worktree");
    const r = runHook(sb, impl, { cwd: main, projectDir: main, input: { cwd: wt, hook_event_name: "Stop" } });
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stdout, /Dialectic iteration 2/);
    assert.match(readState(sb).last_hook_ts ?? "", /^\d{4}/);
  });

  test(`[${impl}] finds worktree state from the process cwd when input has no cwd`, () => {
    const { main, wt, sb } = makeWorktreeLayout("worktree");
    const r = runHook(sb, impl, { cwd: wt, projectDir: main });
    assert.equal(r.status, 2, r.stderr);
  });

  test(`[${impl}] walks up from a subdirectory Claude cd'd into`, () => {
    const { main, wt, sb } = makeWorktreeLayout("worktree");
    const r = runHook(sb, impl, { cwd: main, projectDir: main, input: { cwd: join(wt, "src") } });
    assert.equal(r.status, 2, r.stderr);
  });

  test(`[${impl}] a worktree is its own boundary — never adopts the main checkout's loop by walking up`, () => {
    const { wt, sb } = makeWorktreeLayout("main");
    // Session launched inside the worktree: CLAUDE_PROJECT_DIR is the worktree too.
    const r = runHook(sb, impl, { cwd: wt, projectDir: wt, input: { cwd: wt } });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readState(sb).last_hook_ts, undefined, "main checkout's state must be untouched");
  });

  test(`[${impl}] cwd outside any project falls back to CLAUDE_PROJECT_DIR`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 1, decision: null });
    writeScratchpad(sb, { probeBlocks: 1 });
    const elsewhere = mkdtempSync(join(tmpdir(), "dialectic-elsewhere-"));
    const r = runHook(sb, impl, { cwd: elsewhere, projectDir: sb.dir, input: { cwd: elsewhere } });
    assert.equal(r.status, 2, r.stderr);
  });

  test(`[${impl}] no state anywhere → exit 0 even with hook input`, () => {
    const elsewhere = mkdtempSync(join(tmpdir(), "dialectic-elsewhere-"));
    const r = runHook({ dir: elsewhere }, impl, { cwd: elsewhere, projectDir: elsewhere, input: { cwd: elsewhere } });
    assert.equal(r.status, 0, r.stderr);
  });
}

test("serialize-trace writes holdout input in the worktree, not CLAUDE_PROJECT_DIR", () => {
  const { main, wt, sb } = makeWorktreeLayout("worktree");
  writeFileSync(sb.statePath, JSON.stringify({ iteration: 4, max_iterations: 5, thesis: { current: "t", confidence: { R: 0.7, E: 0.8, C: 0.5 } } }));
  writeFileSync(join(sb.stateDir, "scratchpad.md"), "[EVIDENCE] something\n");
  writeFileSync(join(sb.stateDir, "thesis-history.md"), "## Iteration 1\n**Thesis**: t\n**Confidence**: R=0.70 E=0.80 C=0.50\n**Decision**: CONCLUDE\n");
  const r = spawnSync("node", [join(REPO, "scripts", "serialize-trace.js")], {
    cwd: join(wt, "src"),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: main },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(sb.stateDir, "holdout_input", "conviction_thesis.md")));
  assert.ok(!existsSync(join(main, ".claude", "dialectic")), "nothing written to the main checkout");
});

// Production path on macOS/Linux: hooks.json runs stop-hook.js, which resolves
// the root and delegates to stop-hook.sh via DIALECTIC_ROOT.
test("[js→sh delegation] the production entry point follows Claude into a worktree", () => {
  const { main, wt, sb } = makeWorktreeLayout("worktree");
  const env = { ...process.env, CLAUDE_PROJECT_DIR: main };
  delete env.DIALECTIC_HOOK_IMPL;
  delete env.DIALECTIC_ROOT;
  const r = spawnSync("node", [join(REPO, "scripts", "stop-hook.js")], {
    cwd: main, encoding: "utf8", env, input: JSON.stringify({ cwd: wt }),
  });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stdout, /Dialectic iteration 2/);
  assert.equal(readState(sb).iteration, 2);
});
