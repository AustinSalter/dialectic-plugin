import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeSandbox, writeState, writeScratchpad, writeArtifact, runHook, readState, BOTH } from "./helpers.mjs";

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
}
