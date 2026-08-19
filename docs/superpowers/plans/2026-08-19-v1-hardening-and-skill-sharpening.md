# v1 Hardening + Skill Sharpening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mechanical failure modes proven by the v1 forensics (rejection path, warrant gate, preservation, orphan handling, serializer dialect, contract hygiene, packaging), then sharpen the core skill files via a symmetric curation/scouting editorial pass.

**Architecture:** The stop-hook two-loop architecture stays. Changes land in both hook implementations (`scripts/stop-hook.sh` is what actually runs on macOS via `stop-hook.js` delegation; the JS body is the Windows path), in `serialize-trace.js`, and in the command/skill prose. A new zero-dependency test harness (`node --test`) exercises hooks as child processes against temp state dirs.

**Tech Stack:** bash + jq (hook), Node ≥ 18 built-in `node:test` (tests), Python 3 stdlib (export script). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-19-v1-hardening-and-skill-sharpening-design.md` — read it first; every task cites the spec section and forensic failure ID it discharges. Forensic evidence: `docs/2026-08-19-dialectic-v1-forensics.md`.

## Global Constraints

- Both hook implementations change in lockstep — every behavior change lands in `stop-hook.sh` AND `stop-hook.js` in the same task (spec 1.2 "parity required").
- No new runtime dependencies: hooks stay bash+jq / node-stdlib; tests use `node:test`; export script uses Python stdlib only.
- Iteration-floor default is **3** everywhere (spec 1.6).
- Session-id canonical format: `dialectic-YYYYMMDDTHHMMSS` (spec 1.6).
- One re-loop max on reject (`reject_passes` < 1 allows re-loop; spec 1.1).
- Phase 2 north star (spec, verbatim intent): labels and guidance exist to aid reasoning, not obscure it; additions are paired with cuts; no recency bias in either direction.
- Prose files must never reference hook behavior that isn't implemented yet — Phase 1 fully lands before Phase 2 begins.
- Repo root: all paths below are relative to the dialectic-plugin repo root.

---

## File Structure

| Path | Role |
|---|---|
| `tests/helpers.mjs` (create) | Temp-dir sandbox, state-file builder, hook runner (both impls) |
| `tests/stop-hook.test.mjs` (create) | All hook branch tests |
| `tests/serialize-trace.test.mjs` (create) | Serializer golden + unit tests |
| `tests/fixtures/scratchpad-da776260.md` (create) | Real orphaned scratchpad from run da776260 — golden file |
| `scripts/stop-hook.sh` (modify) | Warrant gate, reject branch, checkpoint, stale-archive, last_hook_ts, promotion check |
| `scripts/stop-hook.js` (modify) | Same, plus `DIALECTIC_HOOK_IMPL=node` test override |
| `scripts/serialize-trace.js` (modify) | Dialect-aware marker extraction + stitch inventory |
| `scripts/export-session.py` (create) | JSONL → markdown session extractor |
| `commands/dialectic.md` (modify) | Reject decision, ownership contract, anti-emulation clause, session-id stamping, floor default fix |
| `commands/dialectic-distill.md` (modify) | keep_artifacts default, probe-results-in-scratchpad requirement |
| `commands/forge.md` (modify) | Fallback read path when state dir is gone |
| `skills/dialectic/CRITIQUE.md` (modify) | REJECT decision + `if_reject` schema (Phase 1); de-ritualization (Phase 2) |
| `skills/dialectic/DISTILLATION.md` (modify) | `killed` spine status, refutation-memo variant (Phase 1); Phase 2 edits |
| `skills/dialectic/{MARKERS,EXPANSION,COMPRESSION,SYNTHESIS}.md` (modify, Phase 2) | Curation/scouting edit passes |
| `skills/dialectic/RESOURCES.md` (create, Phase 2) | Annotated resource layer |
| `docs/2026-08-19-skill-curation-audit.md` (create, Phase 2) | Keep/cut/demote verdicts + scouting shortlist — user-review gate |

Run all tests with: `node --test tests/`

---

### Task 1: Test harness + golden fixture + baseline regression tests

**Discharges:** infrastructure for everything; fixture for spec 1.5.

**Files:**
- Create: `tests/helpers.mjs`, `tests/stop-hook.test.mjs`, `tests/fixtures/scratchpad-da776260.md`
- Modify: `scripts/stop-hook.js:14` (test override)

**Interfaces:**
- Produces: `makeSandbox()` → `{dir, statePath, stateDir}`; `writeState(sandbox, overrides)`; `writeScratchpad(sandbox, text)`; `runHook(sandbox, impl)` → `{status, stdout, stderr}` where `impl` ∈ `"sh" | "js"`; `readState(sandbox)` → parsed JSON; `BOTH` = `["sh","js"]` for parameterized tests. All later test tasks rely on these exact names.

- [ ] **Step 1: Capture the golden fixture before anything can disturb it**

```bash
cp ~/.claude/dialectic/scratchpad.md tests/fixtures/scratchpad-da776260.md 2>/dev/null \
  || cp .dialectic-output/abandoned-*/scratchpad.md tests/fixtures/scratchpad-da776260.md
wc -l tests/fixtures/scratchpad-da776260.md
```
Expected: ~262 lines. If BOTH sources are missing, stop and report — the golden test (Task 7) depends on this file. This is the user's own reasoning trace entering their own repo; note that in the commit message so it's a conscious inclusion.

- [ ] **Step 2: Add the JS test override**

In `scripts/stop-hook.js`, change line 14 from:
```js
if (process.platform !== "win32") {
```
to:
```js
if (process.platform !== "win32" && process.env.DIALECTIC_HOOK_IMPL !== "node") {
```
This lets tests exercise the JS logic body on macOS. (The comment above it already explains the delegation; no new comment needed.)

- [ ] **Step 3: Write `tests/helpers.mjs`**

```js
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

export function runHook(sandbox, impl) {
  const cmd = impl === "sh"
    ? { file: "bash", args: [join(REPO, "scripts", "stop-hook.sh")] }
    : { file: "node", args: [join(REPO, "scripts", "stop-hook.js")] };
  return spawnSync(cmd.file, cmd.args, {
    cwd: sandbox.dir,
    encoding: "utf8",
    env: { ...process.env, DIALECTIC_HOOK_IMPL: impl === "js" ? "node" : "" },
  });
}

export function readState(sandbox) {
  return JSON.parse(readFileSync(sandbox.statePath, "utf8"));
}
```

- [ ] **Step 4: Write baseline regression tests (current behavior, pre-change)**

`tests/stop-hook.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { makeSandbox, writeState, writeScratchpad, runHook, readState, BOTH } from "./helpers.mjs";

for (const impl of BOTH) {
  test(`[${impl}] no state file → exit 0`, () => {
    const sb = makeSandbox();
    // no state.json written
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
  });

  test(`[${impl}] conclude below floor → overridden to continue, iteration incremented`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 2, decision: "conclude" });
    writeScratchpad(sb, { probeBlocks: 2 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /overridden — below iteration floor/);
    assert.equal(readState(sb).iteration, 3);
  });

  test(`[${impl}] conclude at floor → awaiting_distillation, exit 0`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 3, decision: "conclude" });
    writeScratchpad(sb, { probeBlocks: 3 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
    assert.equal(readState(sb).loop, "awaiting_distillation");
  });

  test(`[${impl}] elevate with E below gate → downgraded to continue`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 2, decision: "elevate",
      thesis: { current: "t", confidence: { R: 0.5, E: 0.3, C: 0.5 }, confidence_history: [] } });
    writeScratchpad(sb, { probeBlocks: 2 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /ELEVATE blocked — evidence gate failed/);
  });
}
```

- [ ] **Step 5: Run tests — expect the scratchpad-less baseline to pass**

Run: `node --test tests/`
Expected: all 8 pass (4 tests × 2 impls). The `writeScratchpad` calls are inert until Task 2 adds the gate — they're pre-seeded so these tests keep passing afterward.

- [ ] **Step 6: Commit**

```bash
git add tests/ scripts/stop-hook.js
git commit -m "test: hook test harness + da776260 golden fixture (fixture is author's own trace, included deliberately)"
```

---

### Task 2: Warrant-existence gate (spec 1.2, F-S2)

**Files:**
- Modify: `scripts/stop-hook.sh` (insert after state-read block, before `# REASONING LOOP`), `scripts/stop-hook.js` (insert after confidence extraction ~line 66, before ARTIFACT_MAP), `commands/dialectic.md`, `commands/dialectic-distill.md`
- Test: `tests/stop-hook.test.mjs`

**Interfaces:**
- Produces: gate messages containing the literal phrase `Warrant gate:` (tests and later tasks grep for it). Reasoning gate counts `probes:` blocks; distillation gate counts `probe_results:` blocks; reject additionally requires `if_reject`.

- [ ] **Step 1: Write failing tests**

Append to `tests/stop-hook.test.mjs` (inside the `for (const impl of BOTH)` loop):
```js
  test(`[${impl}] warrant gate: decision without probe blocks → blocked`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 3, decision: "conclude" });
    writeScratchpad(sb, { probeBlocks: 2 }); // one short
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Warrant gate:/);
    assert.equal(readState(sb).loop, "reasoning"); // no transition happened
  });

  test(`[${impl}] warrant gate: distillation conclude without probe_results → blocked`, () => {
    const sb = makeSandbox();
    writeState(sb, { loop: "distillation", decision: "conclude",
      distillation_iteration: 2, distillation_min: 2, distillation_max: 4 });
    writeScratchpad(sb, { probeBlocks: 3 }); // reasoning probes, but no probe_results:
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Warrant gate:/);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: the 4 new tests FAIL (gate doesn't exist); baseline still passes.

- [ ] **Step 3: Implement in `stop-hook.sh`**

Insert after the confidence block (after line 59), before `artifact_filename()`:
```bash
SCRATCHPAD="$STATE_DIR/scratchpad.md"

# Warrant gate: a decision is only honored if its reasoning was externalized.
if [ -n "$DECISION" ] && [ "$DECISION" != "null" ]; then
  if [ "$LOOP" = "reasoning" ]; then
    PROBE_COUNT=$(grep -c '^[[:space:]]*probes:' "$SCRATCHPAD" 2>/dev/null || echo 0)
    if [ "$PROBE_COUNT" -lt "$ITERATION" ]; then
      echo "Warrant gate: found $PROBE_COUNT 'probes:' block(s) in scratchpad.md but iteration is $ITERATION. Append the full critique output for this iteration (probes:, preservation:, decision block) to .claude/dialectic/scratchpad.md, then stop again. The decision stands; only its warrant is missing." >&2
      exit 2
    fi
  fi
  if [ "$LOOP" = "distillation" ] && { [ "$DECISION" = "conclude" ] || [ "$DECISION" = "CONCLUDE" ]; }; then
    PR_COUNT=$(grep -c '^[[:space:]]*probe_results:' "$SCRATCHPAD" 2>/dev/null || echo 0)
    if [ "$PR_COUNT" -lt "$DIST_ITER" ]; then
      echo "Warrant gate: found $PR_COUNT 'probe_results:' block(s) in scratchpad.md but distillation pass is $DIST_ITER. Append this pass's probe_results: yaml (all five probes with per-probe verdicts and quoted evidence) to .claude/dialectic/scratchpad.md, then stop again." >&2
      exit 2
    fi
  fi
fi
```

- [ ] **Step 4: Implement the same in `stop-hook.js`**

Insert after the `writeState`/`log`/`blockStop` function definitions (~line 79), before `ARTIFACT_MAP`:
```js
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
  }
  if (loop === "distillation" && decision === "conclude") {
    const n = countBlocks(/^[ \t]*probe_results:/gm);
    const distIter = state.distillation_iteration || 1;
    if (n < distIter) {
      blockStop(`Warrant gate: found ${n} 'probe_results:' block(s) in scratchpad.md but distillation pass is ${distIter}. Append this pass's probe_results: yaml (all five probes with per-probe verdicts and quoted evidence) to .claude/dialectic/scratchpad.md, then stop again.`);
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all PASS, including baseline (whose scratchpads were pre-seeded in Task 1).

- [ ] **Step 6: Update prose**

In `commands/dialectic.md` Step 4 (CRITIQUE Pass), append:
```markdown
Append the complete critique output — the probes yaml, preservation gate, and decision block — to `.claude/dialectic/scratchpad.md` before stopping. The stop hook will not honor a decision whose warrant is not in the scratchpad.
```
In `commands/dialectic-distill.md` Step 4, append:
```markdown
Each pass, append a `probe_results:` yaml block to `.claude/dialectic/scratchpad.md` — all five probes, per-probe verdict, and the quoted memo text each verdict rests on. The stop hook will not conclude distillation without one block per pass.
```

- [ ] **Step 7: Commit**

```bash
git add scripts/ commands/ tests/
git commit -m "feat: warrant-existence gate — decisions require externalized probe output (F-S2)"
```

---

### Task 3: Rejection path (spec 1.1, F-B1/F-B2)

**Files:**
- Modify: `scripts/stop-hook.sh` (new branch in reasoning loop, after the conclude block, before elevate), `scripts/stop-hook.js` (same position), `skills/dialectic/CRITIQUE.md`, `skills/dialectic/DISTILLATION.md`, `commands/dialectic.md`
- Test: `tests/stop-hook.test.mjs`

**Interfaces:**
- Consumes: warrant gate from Task 2 (`Warrant gate:` block when `if_reject` missing).
- Produces: state fields `reject_passes` (int, default 0), `counter_thesis` (string|null), `thesis.status` (`"refuted"` on terminal reject). Decision value `"reject"`. Task 5's checkpoint runs on the terminal-reject path too.

- [ ] **Step 1: Write failing tests**

```js
  test(`[${impl}] reject with counter_thesis → re-loop: iteration 0, thesis swapped, reject_passes 1`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 2, decision: "reject", counter_thesis: "the opposite is true" });
    writeScratchpad(sb, { probeBlocks: 2, extra: "if_reject:\n  refuting_basis: E2 contradicts C1\n" });
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /REJECT/);
    const s = readState(sb);
    assert.equal(s.iteration, 0);
    assert.equal(s.reject_passes, 1);
    assert.equal(s.thesis.current, "the opposite is true");
    assert.equal(s.phase, "expansion");
    assert.equal(s.decision, null);
  });

  test(`[${impl}] reject without counter_thesis → refuted, awaiting_distillation, exit 0`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 2, decision: "reject" });
    writeScratchpad(sb, { probeBlocks: 2, extra: "if_reject:\n  refuting_basis: E2 contradicts C1\n" });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
    const s = readState(sb);
    assert.equal(s.loop, "awaiting_distillation");
    assert.equal(s.thesis.status, "refuted");
  });

  test(`[${impl}] second reject with counter_thesis → no second re-loop, terminal refuted`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 2, decision: "reject", counter_thesis: "yet another", reject_passes: 1 });
    writeScratchpad(sb, { probeBlocks: 2, extra: "if_reject:\n  refuting_basis: still broken\n" });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
    assert.equal(readState(sb).thesis.status, "refuted");
  });

  test(`[${impl}] reject without if_reject block in scratchpad → warrant-gated`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 2, decision: "reject" });
    writeScratchpad(sb, { probeBlocks: 2 }); // no if_reject
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Warrant gate:/);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: 8 new FAIL (unknown decision `reject` currently falls through to the continue branch).

- [ ] **Step 3: Extend the warrant gate for reject (both impls)**

`stop-hook.sh` — inside the Task 2 gate, after the reasoning `probes:` check:
```bash
    if { [ "$DECISION" = "reject" ] || [ "$DECISION" = "REJECT" ]; } && ! grep -q '^[[:space:]]*if_reject' "$SCRATCHPAD" 2>/dev/null; then
      echo "Warrant gate: decision is reject but scratchpad.md has no if_reject block. Append if_reject with refuting_basis (which claims/evidence the refutation rests on) and optional counter_thesis, then stop again." >&2
      exit 2
    fi
```
`stop-hook.js` — inside the `loop === "reasoning"` gate:
```js
    if (decision === "reject" && countBlocks(/^[ \t]*if_reject/gm) === 0) {
      blockStop("Warrant gate: decision is reject but scratchpad.md has no if_reject block. Append if_reject with refuting_basis (which claims/evidence the refutation rests on) and optional counter_thesis, then stop again.");
    }
```

- [ ] **Step 4: Implement the reject branch in `stop-hook.sh`**

Insert after the conclude block closes (after current line 228), before the elevate block:
```bash
  # Check for rejection — the thesis is refuted. Legal from iteration 1:
  # floors prevent premature conclusion; premature death is the point.
  if [ "$DECISION" = "reject" ] || [ "$DECISION" = "REJECT" ]; then
    if wait_for_explorations; then
      echo "Background exploration(s) completed while rejecting. Re-run the convergence check (skills/dialectic/CRITIQUE.md) with the new results in .claude/dialectic/explorations/ before finalizing the REJECT decision." >&2
      exit 2
    fi

    REJECT_PASSES=$(jq -r '.reject_passes // 0' "$STATE_FILE" 2>/dev/null)
    COUNTER_THESIS=$(jq -r '.counter_thesis // ""' "$STATE_FILE" 2>/dev/null)

    if [ -n "$COUNTER_THESIS" ] && [ "$COUNTER_THESIS" != "null" ] && [ "$REJECT_PASSES" -lt 1 ]; then
      jq '.reject_passes = ((.reject_passes // 0) + 1) | .thesis.current = .counter_thesis | .counter_thesis = null | .iteration = 0 | .decision = null | .phase = "expansion"' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"

      echo ""
      echo "================================================"
      echo "  REJECT — thesis refuted, counter-thesis offered"
      echo "  Re-entering reasoning with the counter-thesis (re-loop 1/1)"
      echo "================================================"

      echo "The critique rejected the thesis and proposed a counter-thesis. Read the if_reject block in scratchpad.md for the refuting basis. The counter-thesis is now thesis.current in state.json. Begin a fresh expansion pass from it. Claims killed by the refutation must be recorded as killed, not silently dropped." >&2
      exit 2
    else
      jq '.loop = "awaiting_distillation" | .thesis.status = "refuted" | .decision = null' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"

      echo ""
      echo "================================================"
      echo "  Thesis REFUTED (iteration $ITERATION)"
      echo "  R: $R | E: $E | C: $C"
      echo ""
      echo "  Run /dialectic:dialectic-distill to produce"
      echo "  the refutation memo — knowing why it's wrong"
      echo "  is a conviction too."
      echo "================================================"
      exit 0
    fi
  fi
```

- [ ] **Step 5: Implement the same branch in `stop-hook.js`**

Insert after the conclude block closes (after current line 221), before the elevate block:
```js
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
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all PASS.

- [ ] **Step 7: Update CRITIQUE.md**

In the Decision table, add a row after ELEVATE:
```markdown
| REJECT | Thesis refuted: a probe or counter breaks the core claim and no elevation rescues it | Refuting basis (which claims/evidence it rests on) + counter-thesis if one is visible |
```
In the Output Format yaml, change the decision line to `decision: [CONTINUE | CONCLUDE | ELEVATE | REJECT]` and add after `if_elevate`:
```yaml
if_reject:
  refuting_basis: [the specific claims/evidence the refutation rests on]
  counter_thesis: [the thesis the evidence actually supports — omit if none is visible]
```
After the Output Format section, add:
```markdown
**REJECT is a success, not a failure.** A refuted thesis with a stated refuting basis is a finished piece of reasoning. If a counter-thesis is visible, write it to `counter_thesis` in state.json — the loop will re-enter once from it. If none is visible, the run ends as a refutation: distillation will produce a memo of why the thesis is wrong and what would resurrect it.
```
Also update the "CRITICAL: Stop After Writing Decision" line to include `reject` in the parenthetical list of decision values.

- [ ] **Step 8: Update DISTILLATION.md and commands/dialectic.md**

DISTILLATION.md — in the Spine Extraction survival table, add:
```markdown
| any marker | — | Killed by a REJECT's refuting_basis: record status `killed`, keep it in the spine |
```
After the Spine Validation section, add:
```markdown
### Killed claims stay visible

A claim with status `killed` must appear in the memo's refutatio with what killed it. Claims that die must stay visibly dead — a spine that silently drops its dead is lying about the fight.

### Refutation memos

If `thesis.status` is `"refuted"`, the memo's verdict is the refutation: state what the thesis claimed, the refuting basis (quoted from the spine), and what evidence would resurrect it. Same probes, same compression gate — a refutation memo is still a conviction memo.
```
commands/dialectic.md — in Step 4, change the decision list to `("continue", "conclude", "elevate", or "reject")`, and in Step 6's decision list add:
```markdown
- **REJECT**: Stop. The hook re-loops once on a counter-thesis, or ends the run as a refutation.
```

- [ ] **Step 9: Commit**

```bash
git add scripts/ skills/ commands/ tests/
git commit -m "feat: first-class REJECT decision — thesis can die, claims stay visibly dead (F-B1, F-B2)"
```

---

### Task 4: Preservation defaults + forge fallback (spec 1.3, F-M3/F-S5)

**Files:**
- Modify: `scripts/stop-hook.sh:381`, `scripts/stop-hook.js:375`, `commands/dialectic.md` (initial state), `commands/dialectic-distill.md` (default `--keep`), `commands/forge.md`
- Test: `tests/stop-hook.test.mjs`

**Interfaces:**
- Produces: default keep set `memo,spine,history,scratchpad,state,prompt` in both hooks and both command docs.

- [ ] **Step 1: Write failing test**

```js
  test(`[${impl}] distill conclude with no keep_artifacts in state → scratchpad preserved by default`, () => {
    const sb = makeSandbox();
    const st = { loop: "distillation", decision: "conclude",
      distillation_iteration: 2, distillation_min: 2, distillation_max: 4 };
    writeState(sb, st);
    // remove keep_artifacts to exercise the default
    const s = readState(sb); delete s.keep_artifacts;
    writeFileSync(sb.statePath, JSON.stringify(s, null, 2));
    writeScratchpad(sb, { probeBlocks: 3, extra: "probe_results:\n  trace: PASS\nprobe_results:\n  trace: PASS\n" });
    writeArtifact(sb, "memo-draft.md", "# Memo\nThe bet: X > Y.\nFalsification: Z.\n");
    writeArtifact(sb, "thesis-history.md", "## Iteration 1\n");
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
    const out = join(sb.dir, ".dialectic-output", "dialectic-20260819T120000");
    assert.ok(existsSync(join(out, "scratchpad.md")), "scratchpad.md preserved");
    assert.ok(existsSync(join(out, "state.json")), "state.json preserved");
    assert.ok(!existsSync(sb.stateDir), "state dir cleaned up");
  });
```
(Add `writeFileSync` and `writeArtifact` to the test file's imports.)

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `node --test tests/`
Expected: FAIL — default keep set is `memo,spine,history`; scratchpad.md absent from output.

- [ ] **Step 3: Change the defaults**

`stop-hook.sh:381`:
```bash
KEEP_ARTIFACTS=$(jq -r '(.keep_artifacts // ["memo","spine","history","scratchpad","state","prompt"]) | join(",")' "$STATE_FILE" 2>/dev/null)
```
`stop-hook.js:375`:
```js
const keepArtifacts = state.keep_artifacts || ["memo", "spine", "history", "scratchpad", "state", "prompt"];
```
`commands/dialectic.md` initial-state JSON: `"keep_artifacts": ["memo", "spine", "history", "scratchpad", "state", "prompt"]`.
`commands/dialectic-distill.md`: both mentions of the `--keep` default become `memo,spine,history,scratchpad,state,prompt`.

- [ ] **Step 4: Run tests to verify pass; commit**

Run: `node --test tests/` → PASS.
```bash
git add scripts/ commands/ tests/
git commit -m "feat: preserve scratchpad/state/prompt by default — distill cleanup no longer destroys forge's input (F-M3, F-S5)"
```

- [ ] **Step 5: Add the forge fallback prose**

In `commands/forge.md`, in its artifact-validation step (it requires `.claude/dialectic/scratchpad.md`), add:
```markdown
If `.claude/dialectic/` does not exist (distillation already concluded and cleaned up), fall back to the newest session under `.dialectic-output/`: `ls -td .dialectic-output/*/ | head -1`. Read `scratchpad.md`, `state.json`, and `thesis-history.md` from there, and write `forge-draft.md` and `forge_report.md` into that same session directory instead of `.claude/dialectic/`. Say which directory you are using.
```
Commit: `git add commands/forge.md && git commit -m "feat: forge falls back to preserved .dialectic-output session when state dir is gone"`

---

### Task 5: Orphan handling — checkpoint + stale-archive (spec 1.4, F-M2)

**Files:**
- Modify: `scripts/stop-hook.sh` (new `checkpoint_artifacts` function; calls in the three `awaiting_distillation` transitions and terminal reject; stale-guard rewrite at lines 23-27), `scripts/stop-hook.js` (same: function + calls + stale-guard at lines 38-46)
- Test: `tests/stop-hook.test.mjs`

**Interfaces:**
- Consumes: terminal-reject path from Task 3.
- Produces: `checkpoint_artifacts` / `checkpointArtifacts()` — copies scratchpad.md, thesis-history.md, prompt.md, state.json to `<output_dir>/<session_id>/checkpoint/`; normalizes malformed session ids to `dialectic-$(date +%Y%m%dT%H%M%S)` (Task 6 relies on this normalization existing here).

- [ ] **Step 1: Write failing tests**

```js
  test(`[${impl}] reasoning conclude → checkpoint written before exit`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 3, decision: "conclude" });
    writeScratchpad(sb, { probeBlocks: 3 });
    writeArtifact(sb, "thesis-history.md", "## Iteration 1\n");
    writeArtifact(sb, "prompt.md", "q");
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
    const cp = join(sb.dir, ".dialectic-output", "dialectic-20260819T120000", "checkpoint");
    for (const f of ["scratchpad.md", "thesis-history.md", "prompt.md", "state.json"])
      assert.ok(existsSync(join(cp, f)), `${f} checkpointed`);
  });

  test(`[${impl}] malformed session_id → normalized at checkpoint`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 3, decision: "conclude", session_id: "dialectic-2026-07-06" });
    writeScratchpad(sb, { probeBlocks: 3 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
    assert.match(readState(sb).session_id, /^dialectic-\d{8}T\d{6}$/);
  });

  test(`[${impl}] stale state → archived to .dialectic-output/abandoned-*, state dir removed`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 2 });
    writeScratchpad(sb, { probeBlocks: 2 });
    // age the state file 3 hours
    const old = new Date(Date.now() - 3 * 3600 * 1000);
    utimesSync(sb.statePath, old, old);
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
    assert.ok(!existsSync(sb.stateDir), "state dir removed");
    const outDir = join(sb.dir, ".dialectic-output");
    const abandoned = readdirSync(outDir).filter((d) => d.startsWith("abandoned-"));
    assert.equal(abandoned.length, 1);
    assert.ok(existsSync(join(outDir, abandoned[0], "scratchpad.md")));
  });
```
(Add `utimesSync`, `readdirSync` to imports.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: 6 new FAIL (no checkpoint dir; stale path currently exits 0 leaving state in place).

- [ ] **Step 3: Implement in `stop-hook.sh`**

Replace the stale guard (lines 23-27) with:
```bash
STALE_THRESHOLD_MIN=120
if [ "$(find "$STATE_FILE" -mmin +${STALE_THRESHOLD_MIN} 2>/dev/null)" ]; then
  OUTPUT_DIR=$(jq -r '.output_dir // ".dialectic-output/"' "$STATE_FILE" 2>/dev/null)
  ARCHIVE_DIR="${OUTPUT_DIR%/}/abandoned-$(date +%Y%m%dT%H%M%S)"
  mkdir -p "$ARCHIVE_DIR"
  cp -R "$STATE_DIR/." "$ARCHIVE_DIR/"
  rm -rf "$STATE_DIR"
  echo "Dialectic state was stale (>${STALE_THRESHOLD_MIN} min). Archived the abandoned session to $ARCHIVE_DIR and cleared the state dir. Start fresh with /dialectic:dialectic." >&2
  exit 0
fi
```
Add after `preserve_artifacts()`:
```bash
checkpoint_artifacts() {
  local output_dir session_id checkpoint_dir
  output_dir=$(jq -r '.output_dir // ".dialectic-output/"' "$STATE_FILE" 2>/dev/null)
  session_id=$(jq -r '.session_id // ""' "$STATE_FILE" 2>/dev/null)
  case "$session_id" in
    dialectic-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]T[0-9][0-9][0-9][0-9][0-9][0-9]) ;;
    *)
      session_id="dialectic-$(date +%Y%m%dT%H%M%S)"
      jq --arg sid "$session_id" '.session_id = $sid' "$STATE_FILE" > "$STATE_FILE.tmp"
      mv "$STATE_FILE.tmp" "$STATE_FILE"
      ;;
  esac
  checkpoint_dir="${output_dir%/}/$session_id/checkpoint"
  mkdir -p "$checkpoint_dir"
  for f in scratchpad.md thesis-history.md prompt.md state.json; do
    [ -f "$STATE_DIR/$f" ] && cp "$STATE_DIR/$f" "$checkpoint_dir/$f"
  done
  echo "  Checkpoint: $checkpoint_dir"
}
```
Insert `checkpoint_artifacts` immediately after each `jq '.loop = "awaiting_distillation" ...'` write in: the reasoning-conclude branch, the max-iterations branch, the holdout-verdict-terminal branch, the forge-conclude branch, and Task 3's terminal-reject branch (call it after the jq/mv, before the banner).

- [ ] **Step 4: Implement the same in `stop-hook.js`**

Replace the stale guard body (lines 40-46) with:
```js
if (stateAge > STALE_THRESHOLD_MS) {
  const outputDir = (state0OutputDir() || ".dialectic-output/").replace(/\/$/, "");
  const archiveDir = path.join(outputDir, "abandoned-" + tsStamp());
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.cpSync(STATE_DIR, archiveDir, { recursive: true });
  fs.rmSync(STATE_DIR, { recursive: true, force: true });
  process.stderr.write(
    `Dialectic state was stale. Archived the abandoned session to ${archiveDir} and cleared the state dir. Start fresh with /dialectic:dialectic.\n`
  );
  process.exit(0);
}
```
with helpers above it (before the stale guard, after STATE_FILE existence check):
```js
function tsStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function state0OutputDir() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).output_dir; } catch { return null; }
}
```
Add after `preserveArtifacts`:
```js
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
```
Call `checkpointArtifacts()` immediately after each `state.loop = "awaiting_distillation"; writeState(state);` pair (reasoning-conclude, max-iterations, holdout-terminal, forge-conclude, terminal-reject).

- [ ] **Step 5: Run tests; fix ordering issues; commit**

Run: `node --test tests/`
Expected: all PASS. Watch one trap: in the sh stale-archive, `state.json` must be copied *before* any jq write empties it — the `cp -R` runs before anything else touches state, which is correct as written.
```bash
git add scripts/ tests/
git commit -m "feat: checkpoint artifacts on awaiting_distillation; stale state auto-archives instead of nagging (F-M2)"
```

---

### Task 6: Contract hygiene — last_hook_ts, ownership, anti-emulation, floor default (spec 1.6, F-M4/F-M6/F-M1)

**Files:**
- Modify: `scripts/stop-hook.sh` (after state read), `scripts/stop-hook.js` (after state read), `commands/dialectic.md`
- Test: `tests/stop-hook.test.mjs`

**Interfaces:**
- Produces: `last_hook_ts` (ISO-8601 UTC string) written on every hook firing that reads live state.

- [ ] **Step 1: Write failing test**

```js
  test(`[${impl}] hook stamps last_hook_ts on every firing`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 1, decision: null });
    writeScratchpad(sb, { probeBlocks: 1 });
    runHook(sb, impl);
    assert.match(readState(sb).last_hook_ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
```

- [ ] **Step 2: Run to verify failure, then implement**

`stop-hook.sh` — insert right after the state-variable reads (after line 45's FORGE_MIN):
```bash
# Liveness beacon: models check this to detect a hook that never fired.
jq --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '.last_hook_ts = $ts' "$STATE_FILE" > "$STATE_FILE.tmp"
mv "$STATE_FILE.tmp" "$STATE_FILE"
```
`stop-hook.js` — after the state parse succeeds (after line 54):
```js
// Liveness beacon: models check this to detect a hook that never fired.
state.last_hook_ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
writeState(state);
```
Note: the stale guard runs before this stamp in both impls, so the beacon can't refresh an orphan into looking alive.

- [ ] **Step 3: Run tests to verify pass**

Run: `node --test tests/` → PASS. (The Task 1 baseline tests re-read state after the run; they don't assert absence of extra fields, so no churn.)

- [ ] **Step 4: Add the ownership contract + anti-emulation + stamping prose to `commands/dialectic.md`**

Fix the floor default: line 19's `(default: 2)` becomes `(default: 3)`.

In Step 1 (Initialize), replace the `"session_id": "dialectic-{timestamp}"` line's guidance with:
```markdown
Set `session_id` by running `date +%Y%m%dT%H%M%S` via Bash and prefixing `dialectic-` — never invent or estimate the timestamp.
```
Add a new section after Step 6:
```markdown
## State Ownership

Two writers share `state.json`. The hook owns: `iteration`, `loop`, `phase` on transitions, `decision` nulling, `distillation_iteration`, `forge_iteration`, `reject_passes`, `last_hook_ts`. You own everything else. Before writing, re-read the file — the hook may have changed it since you last saw it. Update single fields with jq or python; never rewrite the file from memory and never string-edit it.

## If the Hook Doesn't Fire

After you write a decision and stop, the next thing you see must be a hook banner (and `last_hook_ts` in state.json will be fresh). If you are re-invoked with no banner, or `last_hook_ts` is missing or stale after your stop: do not emulate the loop. Do not increment `iteration`, change `loop`, or run the next pass. Tell the user the stop hook did not fire and stop. A self-administered loop defeats the reason the loop exists.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/ commands/ tests/
git commit -m "feat: last_hook_ts liveness beacon, state ownership contract, anti-emulation clause, floor default fix (F-M4, F-M6, F-M1)"
```

---

### Task 7: Serializer dialect (spec 1.5, F-S1)

**Files:**
- Modify: `scripts/serialize-trace.js:17-48` (extraction), trace_summary builder (~line 265)
- Test: `tests/serialize-trace.test.mjs`

**Interfaces:**
- Produces: `extractMarkers(text)` keeps its return shape `{TYPE: [string]}` (strings now full multi-line bodies, suffix/position tags stripped into the text's tail as ` (tags: web; position: PRIMARY)`); new `extractStitches(text)` → `[{type, endpoints, text}]`. `trace_summary.md` gains a `### Stitch markers` section.

- [ ] **Step 1: Write the golden test (failing)**

`tests/serialize-trace.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { makeSandbox } from "./helpers.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = readFileSync(join(REPO, "tests", "fixtures", "scratchpad-da776260.md"), "utf8");

function serialize(scratchpad) {
  const sb = makeSandbox();
  writeFileSync(join(sb.stateDir, "state.json"), JSON.stringify({
    iteration: 4, max_iterations: 5,
    thesis: { current: "t", confidence: { R: 0.7, E: 0.8, C: 0.5 } },
  }));
  writeFileSync(join(sb.stateDir, "scratchpad.md"), scratchpad);
  writeFileSync(join(sb.stateDir, "thesis-history.md"), "## Iteration 1\n**Thesis**: t\n**Confidence**: R=0.70 E=0.80 C=0.50\n**Decision**: CONCLUDE\n");
  const r = spawnSync("node", [join(REPO, "scripts", "serialize-trace.js")], { cwd: sb.dir, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const read = (f) => readFileSync(join(sb.stateDir, "holdout_input", f), "utf8");
  return { thesis: read("conviction_thesis.md"), summary: read("trace_summary.md") };
}

test("golden: da776260 scratchpad — dialect markers all extracted", () => {
  const { summary } = serialize(FIXTURE);
  // Forensic ground truth: 13 EVIDENCE (written [EVIDENCE:web][PRIMARY]), 2 BRIDGE stitches,
  // 3 TENSION incl. one [TENSION -> resolved]. Verify by hand-reading the fixture at
  // implementation time; if your manual count differs, fix THESE numbers with a comment
  // quoting the lines you counted — never relax the assertions to "at least".
  // TENSION and THREAD both render with a "T" prefix, so count within each
  // marker's own section, not across the whole summary.
  const section = (name) => (summary.split(`### [${name}] markers`)[1] || "").split("###")[0];
  const count = (text, re) => (text.match(re) || []).length;
  assert.equal(count(section("EVIDENCE"), /^- E\d+:/gm), 13, "EVIDENCE inventory");
  assert.equal(count(summary, /^- BRIDGE:/gm), 2, "BRIDGE stitches");
  assert.equal(count(section("TENSION"), /^- T\d+:/gm), 3, "TENSION inventory");
  assert.ok(!summary.includes("[No EVIDENCE markers found]"));
});

test("multi-line marker bodies survive to the blank line", () => {
  const { summary } = serialize(
    "[INSIGHT] First line of the insight\ncontinues on the second line with the warrant.\n\nUnrelated prose.\n\nprobes:\n  x: y\n"
  );
  assert.match(summary, /continues on the second line with the warrant/);
  assert.ok(!summary.includes("Unrelated prose"));
});

test("suffix and position tags are captured, not dropped", () => {
  const { summary } = serialize("[EVIDENCE:web][PRIMARY] Q3 revenue fell 40%.\n\nprobes:\n  x: y\n");
  assert.match(summary, /Q3 revenue fell 40%/);
  assert.match(summary, /tags: web/);
  assert.match(summary, /position: PRIMARY/);
});

test("state-annotated markers extract", () => {
  const { summary } = serialize("[TENSION -> resolved] A conflicted with B until C.\n\nprobes:\n  x: y\n");
  assert.match(summary, /A conflicted with B until C/);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/serialize-trace.test.mjs`
Expected: golden test FAIL with EVIDENCE inventory 0 (current regexes miss `[EVIDENCE:web]`).

- [ ] **Step 3: Rewrite extraction in `serialize-trace.js`**

Replace `MARKER_PATTERNS` (lines 17-26) and `extractMarkers` (lines 36-48) with:
```js
const MARKER_TYPES = ["EVIDENCE", "COUNTER", "TENSION", "INSIGHT", "THREAD", "RISK", "QUESTION"];
const POSITION_TAGS = ["PRIMARY", "DOWNSTREAM", "CRITIQUE", "SYNTHESIS", "TANGENTIAL", "ALIGNED", "OPPOSING", "NEUTRAL"];
const STITCH_TYPES = ["BRIDGE", "RESOLVES", "CONTRADICTS", "QUALIFIES"];

// Marker head: [TYPE], [TYPE:tag], [TYPE -> state] — optionally followed by
// position tags like [PRIMARY]. Body runs to the next blank line or next marker line.
const MARKER_HEAD = new RegExp(
  "^\\[(" + MARKER_TYPES.join("|") + ")(?::([a-z-]+))?(?:\\s*->\\s*([a-z-]+))?\\]\\s*(.*)$"
);
const STITCH_HEAD = new RegExp("^\\[(" + STITCH_TYPES.join("|") + "):\\s*([^\\]]+)\\]\\s*(.*)$");

function stripPositionTags(text) {
  const tags = [];
  let rest = text;
  const tagRe = new RegExp("^\\[(" + POSITION_TAGS.join("|") + ")\\]\\s*");
  let m;
  while ((m = rest.match(tagRe))) {
    tags.push(m[1]);
    rest = rest.slice(m[0].length);
  }
  return { tags, rest };
}

function isHeadLine(line) {
  return MARKER_HEAD.test(line) || STITCH_HEAD.test(line);
}

function extractMarkers(text) {
  const markers = {};
  for (const t of MARKER_TYPES) markers[t] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(MARKER_HEAD);
    if (!m) continue;
    const [, type, suffix, stateTag, firstRest] = m;
    const { tags, rest } = stripPositionTags(firstRest);
    const body = [rest];
    while (i + 1 < lines.length && lines[i + 1].trim() !== "" && !isHeadLine(lines[i + 1])) {
      body.push(lines[++i].trim());
    }
    const annotations = [];
    if (suffix) annotations.push("tags: " + suffix);
    if (stateTag) annotations.push("state: " + stateTag);
    if (tags.length) annotations.push("position: " + tags.join(","));
    let entry = body.join(" ").trim();
    if (annotations.length) entry += " (" + annotations.join("; ") + ")";
    if (entry) markers[type].push(entry);
  }
  return markers;
}

function extractStitches(text) {
  const stitches = [];
  for (const line of text.split("\n")) {
    const m = line.match(STITCH_HEAD);
    if (m) stitches.push({ type: m[1], endpoints: m[2].trim(), text: m[3].trim() });
  }
  return stitches;
}
```

- [ ] **Step 4: Add the stitch inventory to trace_summary**

Where `traceSummary` is assembled, after the `### [QUESTION] markers` section, insert:
```js
### Stitch markers (joins across sources — weigh above single-source findings)
${stitches.length ? stitches.map((s) => `- ${s.type}: ${s.endpoints} — ${s.text}`).join("\n") : "[No stitch markers found]"}
```
with `const stitches = extractStitches(scratchpad);` added next to the existing `extractMarkers` call.

- [ ] **Step 5: Run the full suite, verify golden numbers by hand**

Run: `node --test tests/`
Expected: PASS. Open `tests/fixtures/scratchpad-da776260.md`, hand-count `[EVIDENCE`, `[BRIDGE`, `[TENSION` heads, confirm 13/2/3. If the hand count differs, fix the assertion numbers with a comment quoting the counted lines.

- [ ] **Step 6: Commit**

```bash
git add scripts/serialize-trace.js tests/
git commit -m "fix: serializer parses the marker dialect MARKERS.md teaches — suffix tags, position tags, state annotations, stitches, multi-line bodies (F-S1)"
```

---

### Task 8: Export script (spec 1.7, F-M5)

**Files:**
- Create: `scripts/export-session.py`
- Test: `tests/export-session.test.mjs` (create)

**Interfaces:**
- Produces: `python3 scripts/export-session.py <session.jsonl> [output.md]` — writes markdown, prints the output path. Defaults output to `<jsonl-basename>.md` in the cwd.

- [ ] **Step 1: Write failing test**

`tests/export-session.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { makeSandbox } from "./helpers.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

test("export-session extracts user and assistant turns, skips noise", () => {
  const sb = makeSandbox();
  const jsonl = [
    { type: "user", timestamp: "2026-07-07T02:15:00Z", message: { role: "user", content: "run the analysis" } },
    { type: "assistant", timestamp: "2026-07-07T02:15:30Z", message: { role: "assistant", model: "claude-opus-4-8", content: [{ type: "text", text: "[INSIGHT] Something non-obvious." }, { type: "tool_use", name: "Write", input: { file_path: "x" } }] } },
    { type: "ai-title", title: "noise" },
    { type: "user", timestamp: "2026-07-07T02:16:00Z", message: { role: "user", content: [{ type: "tool_result", content: "ok" }] } },
  ].map((e) => JSON.stringify(e)).join("\n");
  const src = join(sb.dir, "session.jsonl");
  writeFileSync(src, jsonl);
  const out = join(sb.dir, "out.md");
  const r = spawnSync("python3", [join(REPO, "scripts", "export-session.py"), src, out], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const md = readFileSync(out, "utf8");
  assert.match(md, /run the analysis/);
  assert.match(md, /\[INSIGHT\] Something non-obvious\./);
  assert.match(md, /`Write`/);          // tool use summarized
  assert.ok(!md.includes("noise"));      // non-message entries skipped
  assert.match(md, /claude-opus-4-8/);   // model recorded once in header
});
```

- [ ] **Step 2: Run to verify failure** — `node --test tests/export-session.test.mjs` → FAIL (script missing).

- [ ] **Step 3: Write `scripts/export-session.py`**

```python
#!/usr/bin/env python3
"""Export a Claude Code session JSONL to readable markdown.

Usage: export-session.py <session.jsonl> [output.md]

Keeps: user text turns, assistant text (verbatim), one-line tool-use
summaries. Skips: attachments, titles, tool_results, harness bookkeeping.
"""
import json
import sys
from pathlib import Path


def text_of(content):
    if isinstance(content, str):
        return content, []
    texts, tools = [], []
    if isinstance(content, list):
        for block in content:
            if not isinstance(block, dict):
                continue
            if block.get("type") == "text":
                texts.append(block.get("text", ""))
            elif block.get("type") == "tool_use":
                tools.append(block.get("name", "?"))
            elif block.get("type") == "tool_result":
                return None, []  # tool-result carrier turn, not a human turn
    return "\n".join(t for t in texts if t.strip()), tools


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: export-session.py <session.jsonl> [output.md]")
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(src.stem + ".md")

    lines, models = [], set()
    with src.open() as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                entry = json.loads(raw)
            except json.JSONDecodeError:
                continue
            kind = entry.get("type")
            if kind not in ("user", "assistant"):
                continue
            msg = entry.get("message") or {}
            if msg.get("model"):
                models.add(msg["model"])
            text, tools = text_of(msg.get("content"))
            if text is None:
                continue
            ts = (entry.get("timestamp") or "")[:19]
            if kind == "user" and text.strip():
                lines.append(f"## User — {ts}\n\n{text.strip()}\n")
            elif kind == "assistant" and (text.strip() or tools):
                body = text.strip()
                if tools:
                    body += ("\n\n" if body else "") + "> tools: " + ", ".join(f"`{t}`" for t in tools)
                lines.append(f"## Assistant — {ts}\n\n{body}\n")

    header = f"# Session export: {src.name}\n\nModels: {', '.join(sorted(models)) or 'unknown'}\n"
    out.write_text(header + "\n" + "\n".join(lines))
    print(out)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to verify pass** — `node --test tests/` → PASS.

- [ ] **Step 5: Align the export skill reference**

Search for the export skill definition: `grep -rn "export-session" ~/.claude/skills . --include="*.md" 2>/dev/null` (exclude docs/). If an export skill/command file references `${CLAUDE_PLUGIN_ROOT}/scripts/export-session.py`, it now resolves. If the reference names a different path, update it to `${CLAUDE_PLUGIN_ROOT}/scripts/export-session.py`. If no skill file exists anywhere, note that in the commit message — the script is still the plugin's to ship.

- [ ] **Step 6: Commit**

```bash
git add scripts/export-session.py tests/export-session.test.mjs
git commit -m "feat: ship export-session.py — /export's referenced script now exists (F-M5)"
```

---

### Task 9: Memo promotion check (spec 1.7, F-O2)

**Files:**
- Modify: `scripts/stop-hook.sh` (distill-conclude branch, before the promote `cp`), `scripts/stop-hook.js` (same)
- Test: `tests/stop-hook.test.mjs`

**Interfaces:**
- Consumes: `thesis.status === "refuted"` from Task 3 (refutation memos are checked for refutation language instead).

- [ ] **Step 1: Write failing tests**

```js
  test(`[${impl}] distill conclude with betless memo → promotion blocked`, () => {
    const sb = makeSandbox();
    writeState(sb, { loop: "distillation", decision: "conclude",
      distillation_iteration: 2, distillation_min: 2, distillation_max: 4 });
    writeScratchpad(sb, { probeBlocks: 3, extra: "probe_results:\n  t: PASS\nprobe_results:\n  t: PASS\n" });
    writeArtifact(sb, "memo-draft.md", "# Memo\nAll is well. No commitments here.\n");
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Memo promotion blocked/);
  });

  test(`[${impl}] refuted thesis + memo naming the refutation → promotes`, () => {
    const sb = makeSandbox();
    writeState(sb, { loop: "distillation", decision: "conclude",
      distillation_iteration: 2, distillation_min: 2, distillation_max: 4,
      thesis: { current: "t", status: "refuted", confidence: { R: 0.6, E: 0.6, C: 0.6 }, confidence_history: [] } });
    writeScratchpad(sb, { probeBlocks: 3, extra: "probe_results:\n  t: PASS\nprobe_results:\n  t: PASS\n" });
    writeArtifact(sb, "memo-draft.md", "# Memo\nThe thesis is refuted because E2 breaks C1. It would be resurrected by X.\n");
    const r = runHook(sb, impl);
    assert.equal(r.status, 0);
  });
```
(The Task 4 preservation test's memo already contains "bet" and "Falsification", so it keeps passing.)

- [ ] **Step 2: Run to verify failure, then implement**

`stop-hook.sh` — in the distillation-conclude branch, immediately before the "Distillation complete!" banner (so a blocked memo never prints a completion banner first):
```bash
    # Promotion check: the memo must carry its commitments (SYNTHESIS.md spec).
    if [ -f "$STATE_DIR/memo-draft.md" ]; then
      THESIS_STATUS=$(jq -r '.thesis.status // ""' "$STATE_FILE" 2>/dev/null)
      MISSING=""
      if [ "$THESIS_STATUS" = "refuted" ]; then
        grep -qiE 'refut' "$STATE_DIR/memo-draft.md" || MISSING=" refutation-basis"
      else
        grep -qiE '(^|[^a-z])bet([^a-z]|$)' "$STATE_DIR/memo-draft.md" || MISSING=" the-bet"
        grep -qiE 'falsif|disconfirm' "$STATE_DIR/memo-draft.md" || MISSING="$MISSING disconfirmation"
      fi
      if [ -n "$MISSING" ]; then
        echo "Memo promotion blocked — memo-draft.md is missing:$MISSING. The memo spec is skills/dialectic/SYNTHESIS.md: state the bet and its falsification triggers (or, for a refuted thesis, the refuting basis). Revise memo-draft.md, keep decision as conclude, and stop again." >&2
        exit 2
      fi
    fi
```
`stop-hook.js` — same position (before the "Distillation complete!" log lines, ahead of the `draftPath` promote block):
```js
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
```

- [ ] **Step 3: Run full suite; commit**

Run: `node --test tests/` → PASS.
```bash
git add scripts/ tests/
git commit -m "feat: memo promotion check — a memo without its bet does not ship (F-O2)"
```

---

### Task 10: Phase 1 close-out — full suite + manual smoke run

- [ ] **Step 1: Full suite** — `node --test tests/` → everything PASS.
- [ ] **Step 2: Manual smoke run (human checkpoint).** In a scratch directory with the plugin installed from this branch, run `/dialectic:dialectic --max-iterations=3 "toy question: should this repo use tabs or spaces?"` and watch for: warrant-gate banner if a decision lands without probes, iteration banners, checkpoint line on conclude. This is a verification step, not a test — report what you saw to the user before starting Phase 2.
- [ ] **Step 3: Commit anything the smoke run shook out**, then announce Phase 1 complete.

---

### Task 11: Curation audit + scouting shortlist (spec 2.1) — USER GATE

**Files:**
- Create: `docs/2026-08-19-skill-curation-audit.md`

This task produces a document, not code. Its acceptance test is the user's review.

- [ ] **Step 1: Census.** Grep every core file (`MARKERS, EXPANSION, COMPRESSION, CRITIQUE, DISTILLATION, SYNTHESIS, HOLDOUT, FORGE, ESCAPE-HATCH.md` + `PHILOSOPHICAL-FOUNDATIONS.md`) for named thinkers/traditions/methods. Build the complete incumbent list with file:line of each citation.

- [ ] **Step 2: Audit each incumbent.** Verdict per tradition: **keep** (converts to an operational probe that demonstrably shaped behavior — cite the forensic evidence or run behavior), **demote-to-bibliography** (true but not operational), or **cut** (decoration). One-line reason each. Apply the north star: does this label aid reasoning or perform erudition?

- [ ] **Step 3: Scout per gap.** For each forensic gap, evaluate 2-4 candidates spanning eras (the spec's starting points: Popper / eristic tradition for rejection-as-success; Chamberlin / ACH / Mill for frame plurality; source criticism / Peirce for research epistemics; Tetlock / Keynes for calibration). Per candidate: what exact probe or rule it would become, in ≤3 lines of house-register prose (draft the actual lines in the audit doc), and an admit/decline verdict. Declining all candidates for a gap is a legitimate outcome — say what fills the gap instead (or that it stays open for v2).

- [ ] **Step 4: Budget table.** Net line-count delta per skill file: every admission paired with a cut or demotion. The corpus must not grow net-large.

- [ ] **Step 5: STOP — user reviews the audit doc.** Commit it (`git add docs/2026-08-19-skill-curation-audit.md && git commit -m "docs: skill curation audit — incumbent verdicts + scouting shortlist"`), tell the user it's ready, and **do not proceed to Tasks 12-14 until the user approves the verdicts.** The user asked for exactly this review; the edit passes implement whatever survives it.

---

### Task 12: Evidence-layer edit pass — MARKERS, EXPANSION, COMPRESSION (spec 2.2)

**Files:**
- Modify: `skills/dialectic/MARKERS.md`, `skills/dialectic/EXPANSION.md`, `skills/dialectic/COMPRESSION.md`

Content per the approved audit, plus these forensic-mandated edits regardless of audit outcomes:

- [ ] **Step 1: Research epistemics in EXPANSION.md.** Add a short section (house register, ≤20 lines): absence claims ("no source mentions X") are unverified until a targeted fetch confirms them — mark them `[QUESTION]` until verified (F-S7); citations ride inside markers — an `[EVIDENCE]` without its source is a rumor (F-S3); summarizer output is testimony about a source, not the source.
- [ ] **Step 2: Provenance consumption in COMPRESSION.md.** The position markers MARKERS.md teaches get consumed: compression rules already group by position — add the rule that evidence atoms carry their source forward into state.json `evidence` entries (quote + source), so distillation inherits citations.
- [ ] **Step 3: Apply audit verdicts** (cuts, demotions, admitted probes) to these three files.
- [ ] **Step 4: Self-check against the north star.** Re-read each edited file start to finish: does every label earn its place? Is the register intact (operational, no throat-clearing)?
- [ ] **Step 5: Commit** — `git commit -m "feat: evidence-layer skill sharpening — research epistemics, provenance carriage, audit verdicts (F-S7, F-S3)"`

---

### Task 13: Decision-layer edit pass — CRITIQUE, DISTILLATION, SYNTHESIS (spec 2.2)

**Files:**
- Modify: `skills/dialectic/CRITIQUE.md`, `skills/dialectic/DISTILLATION.md`, `skills/dialectic/SYNTHESIS.md`

- [ ] **Step 1: De-ritualize the self-graded rubrics in CRITIQUE.md.** Amputation check: each entry must quote the counter and quote the thesis text that changed in response (or state "nothing changed" — which forces `should_it_have`). Saturation: an E-saturation claim must name the last two searches run and what they returned; "remaining threads are confirmation-shaped" is a prediction, not evidence (F-B3, F-B6).
- [ ] **Step 2: Rejection grounding.** Add the audit-approved tradition behind REJECT (Task 3 added the mechanics; this adds the one-paragraph grounding in house style — why refutation is a success outcome, e.g. the Popperian framing if the audit admits it).
- [ ] **Step 3: Confidence-to-language mapping in SYNTHESIS.md.** A short table: composite < 0.5 → "hold provisionally" language only; 0.5-0.7 → "medium conviction", no ADOPT verdicts without release conditions; > 0.7 → conviction verdicts permitted. The memo's verdict vocabulary must match the band; if the numbers and the felt conviction disagree, say so explicitly in the memo (F-D3, F-D4).
- [ ] **Step 4: Adversarial distillation pass gets teeth in DISTILLATION.md.** The pass-2 instruction requires each probe's `probe_results:` entry to quote the memo sentence it examined (the warrant gate from Task 2 checks the block exists; this specifies what a non-vacuous block contains).
- [ ] **Step 5: Apply remaining audit verdicts; north-star re-read; commit** — `git commit -m "feat: decision-layer skill sharpening — de-ritualized rubrics, confidence-language mapping, rejection grounding (F-B3, F-B6, F-D3)"`

---

### Task 14: RESOURCES.md (spec 2.3)

**Files:**
- Create: `skills/dialectic/RESOURCES.md`

- [ ] **Step 1: Write it.** One entry per tradition that survived the audit or was admitted: the text, one line on *what the mechanism took from it* (not what the text says — what the plugin uses). Demoted incumbents land here with their demotion noted honestly ("informs the spirit of X; no longer cited in the probe"). No entry without a mechanism pointer.
- [ ] **Step 2: Cross-link.** Each core file that cites a tradition gets a single trailing line: `Sources: RESOURCES.md`. Remove any duplicated bibliography from individual files.
- [ ] **Step 3: Commit** — `git commit -m "feat: RESOURCES.md — annotated source layer, one line per mechanism"`

---

### Task 15: Phase 2 validation + wrap

- [ ] **Step 1: Prose review.** Dispatch the `dialectic:prose-reviewer` agent over every file touched in Tasks 12-14. Apply fixes it surfaces that survive your own judgment; note rejected suggestions.
- [ ] **Step 2: Planted-flaw dry runs (prose-addressable fixtures from the forensics report §5).** Construct two small planted traces in a scratch dir: fixture #5 (buried thread aimed at a load-bearing claim) and #10 (fabricated absence claim). Run a fresh `claude -p` critique pass against each with the sharpened skill files loaded. Record whether the new prose surfaces the plant. These are recorded observations, not gates — one run proves nothing statistically, but a whiff on both is a signal to revisit Task 12/13 wording before shipping.
- [ ] **Step 3: Full test suite one last time** — `node --test tests/` → PASS.
- [ ] **Step 4: Final commit + report.** Summarize to the user: what shipped per phase, audit verdicts applied, dry-run observations, and what was deliberately left for v2 (per the spec's "deliberately not addressed" list).
