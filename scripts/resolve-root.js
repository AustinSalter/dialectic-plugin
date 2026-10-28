// resolve-root.js — find the directory that holds .claude/dialectic/state.json.
//
// Two different "where" values exist, and they split apart in a worktree:
//   - CLAUDE_PROJECT_DIR is where the session STARTED. It stays there, even
//     after Claude enters a worktree.
//   - The hook input's `cwd` (and, for scripts Claude runs, process.cwd()) is
//     where Claude is working NOW: the worktree root after entering one, or a
//     subdirectory after a `cd`.
// (Both behaviors are documented at code.claude.com/docs/en/hooks.)
//
// So: walk up from where Claude is working, stopping at the repo boundary —
// a directory containing .git. A worktree's .git is a file, so a worktree is
// its own boundary and never picks up the main checkout's state by walking.
// Only if that finds nothing, fall back to CLAUDE_PROJECT_DIR, which covers a
// cwd that wandered outside the project entirely (the 2026-08-21 root cause).

const fs = require("fs");
const os = require("os");
const path = require("path");

const STATE_REL = path.join(".claude", "dialectic", "state.json");

function hasState(dir) {
  return fs.existsSync(path.join(dir, STATE_REL));
}

function walkUp(start) {
  if (!start || typeof start !== "string") return null;
  let dir = path.resolve(start);
  const home = path.resolve(os.homedir());
  while (true) {
    if (dir === home) return null; // never walk into $HOME itself
    if (hasState(dir)) return dir;
    if (fs.existsSync(path.join(dir, ".git"))) return null; // repo / worktree boundary
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function resolveStateRoot({ cwds = [], projectDir = process.env.CLAUDE_PROJECT_DIR } = {}) {
  for (const c of cwds) {
    const hit = walkUp(c);
    if (hit) return hit;
  }
  if (projectDir && hasState(projectDir)) return path.resolve(projectDir);
  return null;
}

// Hook input arrives as JSON on stdin. Absent when run by hand or by tests.
function readHookInput() {
  try {
    if (process.stdin.isTTY) return {};
    const raw = fs.readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

module.exports = { resolveStateRoot, readHookInput, STATE_REL };
