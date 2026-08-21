import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { makeSandbox } from "./helpers.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = readFileSync(join(REPO, "tests", "fixtures", "scratchpad-da776260.md"), "utf8");

function serialize(scratchpad, confidence = { R: 0.7, E: 0.8, C: 0.5 }) {
  const sb = makeSandbox();
  writeFileSync(join(sb.stateDir, "state.json"), JSON.stringify({
    iteration: 4, max_iterations: 5,
    thesis: { current: "t", confidence },
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
  // Forensic ground truth, hand-counted against tests/fixtures/scratchpad-da776260.md
  // (grep -n for lines containing "EVIDENCE", "BRIDGE", "^[TENSION"):
  //   EVIDENCE: 11 markers anchored at column 0 (lines 46,49,53,57,60,113,124,132,136,173,218)
  //     + 2 markers indented two spaces as sub-bullets under a paragraph (lines 106,107)
  //     = 13 total.
  //   BRIDGE: 1 stitch anchored at column 0 (line 227) + 1 stitch embedded at the tail of a
  //     continuation line inside an EVIDENCE body (line 176: "...internal coherence. [BRIDGE: ...]")
  //     = 2 total.
  //   TENSION: 3 markers, all anchored at column 0 (lines 71, 152 "-> resolved", 204) = 3 total.
  // These match the brief's stated 13/2/3, so the assertions below are unchanged.
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

test("confidence at termination reports Lowest, not Composite (HOLDOUT.md lowest-of rule)", () => {
  const { thesis } = serialize(
    "[EVIDENCE] Some evidence.\n\nprobes:\n  x: y\n",
    { R: 0.9, E: 0.4, C: 0.8 }
  );
  assert.match(thesis, /Lowest: 0\.40/);
  assert.ok(!thesis.includes("Composite"), "Composite must not appear in output");
});

test("unicode arrow (→) in state-annotated marker extracts, same as ASCII ->", () => {
  const { summary } = serialize("[TENSION → resolved] A conflicted with B.\n\nprobes:\n  x: y\n");
  assert.match(summary, /A conflicted with B/);
  assert.match(summary, /state: resolved/);
});
