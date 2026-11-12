import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { makeSandbox, writeState, writeFlow, writeArtifact, runHook, readState, BOTH } from "./helpers.mjs";

// scratchpad.md was renamed flow.md. A run started before a plugin update
// (a paused --pace=manual run, say) must keep working after it.
for (const impl of BOTH) {
  test(`[${impl}] legacy scratchpad.md satisfies the warrant gate`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 3, decision: "conclude" });
    writeFlow(sb, { probeBlocks: 3, file: "scratchpad.md" });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readState(sb).loop, "awaiting_distillation");
  });

  test(`[${impl}] probe blocks split across scratchpad.md and flow.md count together`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 3, decision: "conclude" });
    writeFlow(sb, { probeBlocks: 2, file: "scratchpad.md" });
    writeFlow(sb, { probeBlocks: 1 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readState(sb).loop, "awaiting_distillation");
  });

  test(`[${impl}] split flow still one block short → warrant-gated`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 3, decision: "conclude" });
    writeFlow(sb, { probeBlocks: 1, file: "scratchpad.md" });
    writeFlow(sb, { probeBlocks: 1 });
    const r = runHook(sb, impl);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Warrant gate:.*flow\.md/);
  });

  test(`[${impl}] if_reject in legacy scratchpad.md is honored`, () => {
    const sb = makeSandbox();
    writeState(sb, { iteration: 2, decision: "reject" });
    writeFlow(sb, { probeBlocks: 2, file: "scratchpad.md", extra: "if_reject:\n  refuting_basis: E2 contradicts C1\n" });
    const r = runHook(sb, impl);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readState(sb).loop, "awaiting_distillation");
  });

  test(`[${impl}] pre-rename keep_artifacts ("scratchpad") preserves flow.md and scratchpad.md, each listed once`, () => {
    const sb = makeSandbox();
    writeState(sb, { loop: "distillation", decision: "conclude",
      distillation_iteration: 2, distillation_min: 2, distillation_max: 4,
      keep_artifacts: ["memo", "scratchpad", "flow", "state"] });
    writeFlow(sb, { probeBlocks: 3, file: "scratchpad.md" });
    writeFlow(sb, { probeBlocks: 0, extra: "probe_results:\n  trace: PASS\nprobe_results:\n  trace: PASS\n" });
    writeArtifact(sb, "memo-draft.md", "# Memo\nThe bet: X > Y.\nFalsification: Z.\n");
    writeArtifact(sb, "thesis-history.md", "## Iteration 1\n");
    const r = runHook(sb, impl);
    assert.equal(r.status, 0, r.stderr);
    const out = join(sb.dir, ".dialectic-output", "dialectic-20260819T120000");
    assert.ok(existsSync(join(out, "flow.md")), "flow.md preserved");
    assert.ok(existsSync(join(out, "scratchpad.md")), "legacy scratchpad.md preserved");
    const { artifacts } = JSON.parse(readFileSync(join(out, "manifest.json"), "utf8"));
    assert.equal(artifacts.filter((f) => f === "flow.md").length, 1, "flow.md listed once");
    assert.equal(artifacts.filter((f) => f === "scratchpad.md").length, 1, "scratchpad.md listed once");
  });
}
