import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeSandbox, writeState, writeScratchpad, runHook, readState, BOTH } from "./helpers.mjs";

const HISTORY = `## Iteration 1

**Thesis**: t
**Confidence**: R=0.60 E=0.60 C=0.60
**Key Evidence**: some
**Decision**: CONTINUE
**Next Priority**: Does the switching-cost claim survive the enterprise segment?

---
`;

for (const impl of BOTH) {
  test(`[${impl}] continue re-feed carries thesis, confidence and the last Next Priority`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 1, decision: "continue", thesis: { current: "Switching costs protect the incumbent", confidence: { R: 0.6, E: 0.4, C: 0.5 }, confidence_history: [] } });
    writeScratchpad(sb, { probeBlocks: 1 });
    writeFileSync(join(sb.stateDir, "thesis-history.md"), HISTORY);
    const r = runHook(sb, impl);
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /iteration 2 of 5/);
    assert.match(r.stderr, /Switching costs protect the incumbent/);
    assert.match(r.stderr, /R=0\.6 E=0\.4 C=0\.5/);
    assert.match(r.stderr, /Open question from iteration 1: Does the switching-cost claim survive the enterprise segment\?/);
    assert.match(r.stderr, /EXPANSION\.md/);
  });

  test(`[${impl}] continue re-feed without a history file still orients`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 1, decision: "continue" });
    writeScratchpad(sb, { probeBlocks: 1 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /iteration 2 of 5/);
    assert.doesNotMatch(r.stderr, /Open question/);
  });

  test(`[${impl}] pace=manual: continue advances the iteration but allows the stop`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 1, decision: "continue", pace: "manual" });
    writeScratchpad(sb, { probeBlocks: 1 });
    writeFileSync(join(sb.stateDir, "thesis-history.md"), HISTORY);
    const r = runHook(sb, impl);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Paused \(pace: manual\)\. Run \/dialectic:dialectic to start iteration 2/);
    const s = readState(sb);
    assert.equal(s.iteration, 2);
    assert.match(s.resume_note, /Open question from iteration 1/);
    assert.match(s.last_hook_ts ?? "", /^\d{4}/);
  });

  test(`[${impl}] pace=manual: conclude below floor is still overridden, then pauses`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 1, decision: "conclude", pace: "manual" });
    writeScratchpad(sb, { probeBlocks: 1 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /CONCLUDE overridden/);
    assert.match(r.stdout, /Paused \(pace: manual\)/);
    assert.equal(readState(sb).iteration, 2);
  });

  test(`[${impl}] pace=manual: conclude at floor still exits the loop normally`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 3, decision: "conclude", pace: "manual" });
    writeScratchpad(sb, { probeBlocks: 3 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readState(sb).loop, "awaiting_distillation");
  });

  test(`[${impl}] pace absent behaves as auto`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 1, decision: "continue" });
    writeScratchpad(sb, { probeBlocks: 1 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.equal(readState(sb).resume_note, undefined);
  });
}
