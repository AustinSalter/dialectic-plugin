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
}
