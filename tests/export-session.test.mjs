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
