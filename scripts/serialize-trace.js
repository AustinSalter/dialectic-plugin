#!/usr/bin/env node
// serialize-trace.js — Serialize dialectic trace for holdout audit
//
// Reads loop artifacts, produces three holdout input files in
// .claude/dialectic/holdout_input/
//
// Inputs: state.json, scratchpad.md, thesis-history.md, prompt.md
// Outputs: conviction_thesis.md, trace_summary.md, holdout_brief.md

const fs = require("fs");
const path = require("path");

const STATE_DIR = ".claude/dialectic";
const STATE_FILE = path.join(STATE_DIR, "state.json");
const HOLDOUT_DIR = path.join(STATE_DIR, "holdout_input");

// Marker patterns
const MARKER_PATTERNS = {
  EVIDENCE: /\[EVIDENCE\]\s*(.+)/g,
  COUNTER: /\[COUNTER\]\s*(.+)/g,
  TENSION: /\[TENSION\]\s*(.+)/g,
  INSIGHT: /\[INSIGHT\]\s*(.+)/g,
  THREAD: /\[THREAD\]\s*(.+)/g,
  RISK: /\[RISK\]\s*(.+)/g,
  QUESTION: /\[QUESTION\]\s*(.+)/g,
};

function readFileOr(filepath, fallback) {
  try {
    return fs.readFileSync(filepath, "utf8");
  } catch {
    return fallback;
  }
}

function extractMarkers(text) {
  const markers = {};
  for (const [type, pattern] of Object.entries(MARKER_PATTERNS)) {
    markers[type] = [];
    let match;
    // Reset regex for each use
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(text)) !== null) {
      markers[type].push(match[1].trim());
    }
  }
  return markers;
}

function parseIterations(historyText) {
  // Split thesis-history.md by ## Iteration {N} headers
  const iterations = [];
  const sections = historyText.split(/^## Iteration \d+/m);
  const headers = historyText.match(/^## Iteration \d+/gm) || [];

  for (let i = 0; i < headers.length; i++) {
    const num = parseInt(headers[i].match(/\d+/)[0], 10);
    const body = sections[i + 1] || "";

    // Extract confidence from **Confidence**: R=X.XX E=X.XX C=X.XX
    const confMatch = body.match(
      /\*\*Confidence\*\*:\s*R=([\d.]+)\s*E=([\d.]+)\s*C=([\d.]+)/
    );
    const R = confMatch ? parseFloat(confMatch[1]) : null;
    const E = confMatch ? parseFloat(confMatch[2]) : null;
    const C = confMatch ? parseFloat(confMatch[3]) : null;

    // Extract thesis
    const thesisMatch = body.match(/\*\*Thesis\*\*:\s*(.+)/);
    const thesis = thesisMatch ? thesisMatch[1].trim() : "";

    // Extract decision
    const decisionMatch = body.match(/\*\*Decision\*\*:\s*(.+)/);
    const decision = decisionMatch ? decisionMatch[1].trim() : "";

    iterations.push({ num, R, E, C, thesis, decision, body });
  }

  return iterations;
}

function findBuriedMarkers(scratchpadMarkers, finalIterationText) {
  // Markers present in scratchpad but absent from the final iteration
  const buried = [];
  const finalLower = (finalIterationText || "").toLowerCase();

  for (const [type, items] of Object.entries(scratchpadMarkers)) {
    for (const item of items) {
      // Check if key phrases from this marker appear in the final iteration
      const keywords = item
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .slice(0, 3);
      const found = keywords.some((kw) => finalLower.includes(kw));
      if (!found && item.length > 10) {
        buried.push({ type, content: item });
      }
    }
  }

  return buried;
}

// ============================================================
// Main
// ============================================================

// Validate state exists
if (!fs.existsSync(STATE_FILE)) {
  console.error("No state file found at " + STATE_FILE);
  process.exit(1);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
} catch (e) {
  console.error("Failed to parse state.json: " + e.message);
  process.exit(1);
}

// Read artifacts
const scratchpad = readFileOr(path.join(STATE_DIR, "scratchpad.md"), "");
const history = readFileOr(path.join(STATE_DIR, "thesis-history.md"), "");
const prompt = readFileOr(path.join(STATE_DIR, "prompt.md"), "");

if (!scratchpad && !history) {
  console.error("No scratchpad.md or thesis-history.md found — nothing to serialize.");
  process.exit(1);
}

// Extract data
const scratchpadMarkers = extractMarkers(scratchpad);
const iterations = parseIterations(history);
const conf = (state.thesis && state.thesis.confidence) || {};
const R = typeof conf === "object" ? (conf.R != null ? conf.R : 0.5) : conf;
const E = typeof conf === "object" ? (conf.E != null ? conf.E : 0.5) : conf;
const C = typeof conf === "object" ? (conf.C != null ? conf.C : 0.5) : conf;
const composite = ((R + E + C) / 3).toFixed(2);

// Determine final iteration text for buried-marker detection
const finalIterBody = iterations.length > 0
  ? iterations[iterations.length - 1].body
  : scratchpad.slice(-2000);

const buried = findBuriedMarkers(scratchpadMarkers, finalIterBody);

// Determine termination reason
let terminationReason = "unknown";
if (state.iteration >= (state.max_iterations || 5)) {
  terminationReason = "max iterations reached";
} else if (
  iterations.length >= 2 &&
  iterations[iterations.length - 1].decision &&
  iterations[iterations.length - 1].decision.toLowerCase().includes("conclude")
) {
  terminationReason = "critique CONCLUDE";
}

// ============================================================
// File 1: conviction_thesis.md
// ============================================================

const currentThesis = (state.thesis && state.thesis.current) || prompt || "[no thesis extracted]";

// Extract supporting arguments from EVIDENCE markers
const supporting = scratchpadMarkers.EVIDENCE.length > 0
  ? scratchpadMarkers.EVIDENCE.map((e, i) => `${i + 1}. ${e}`).join("\n")
  : "[No evidence markers found in trace]";

// Extract stated counters
const counters = scratchpadMarkers.COUNTER.length > 0
  ? scratchpadMarkers.COUNTER.map((c, i) => `${i + 1}. ${c}`).join("\n")
  : "[No counter markers found in trace]";

// Extract insights as potential disconfirmation triggers
const risks = scratchpadMarkers.RISK || [];
const questions = scratchpadMarkers.QUESTION || [];
const triggers = [...risks, ...questions];
const triggerText = triggers.length > 0
  ? triggers.map((t, i) => `${i + 1}. ${t}`).join("\n")
  : "[No explicit disconfirmation triggers found]";

const convictionThesis = `# Conviction Thesis

## Core Claim
${currentThesis}

## Supporting Arguments
${supporting}

## Stated Counter-Arguments
${counters}

## Stated Disconfirmation Triggers
${triggerText}

## Confidence at Termination
- Reasoning (R): ${R}
- Evidence (E): ${E}
- Conclusion (C): ${C}
- Composite: ${composite}
- Termination reason: ${terminationReason}
`;

// ============================================================
// File 2: trace_summary.md
// ============================================================

// Build confidence trajectory table
let trajectoryTable = "| Iteration | R    | E    | C    | Composite | Delta |\n";
trajectoryTable +=    "|-----------|------|------|------|-----------|-------|\n";

let prevComposite = null;
for (const iter of iterations) {
  if (iter.R != null) {
    const comp = ((iter.R + iter.E + iter.C) / 3).toFixed(2);
    const delta = prevComposite != null
      ? (parseFloat(comp) - prevComposite >= 0 ? "+" : "") +
        (parseFloat(comp) - prevComposite).toFixed(2)
      : "\u2014";
    trajectoryTable += `| ${iter.num}         | ${iter.R.toFixed(2)} | ${iter.E.toFixed(2)} | ${iter.C.toFixed(2)} | ${comp}     | ${delta} |\n`;
    prevComposite = parseFloat(comp);
  }
}

if (iterations.length === 0) {
  trajectoryTable += "| (no iteration data) | | | | | |\n";
}

// Build marker inventories with IDs and status flags
function buildMarkerList(type, markers) {
  if (markers.length === 0) return `[No ${type} markers found]\n`;
  const prefix = type[0]; // E, C, T, I, etc.
  return markers.map((m, i) => `- ${prefix}${i + 1}: ${m}`).join("\n") + "\n";
}

// For COUNTER and TENSION markers, try to determine status
function buildStatusMarkerList(type, markers, scratchpad) {
  if (markers.length === 0) return `[No ${type} markers found]\n`;
  const prefix = type[0];
  const scratchLower = scratchpad.toLowerCase();
  return markers.map((m, i) => {
    // Heuristic: if keywords from the marker appear later in scratchpad,
    // treat as addressed/resolved
    const keywords = m.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3);
    const found = keywords.filter(kw => {
      const idx = scratchLower.indexOf(kw);
      const markerIdx = scratchLower.indexOf(m.toLowerCase().slice(0, 30));
      return idx > markerIdx + 50; // appears significantly after the marker
    });
    const status = found.length >= 2
      ? (type === "COUNTER" ? "ADDRESSED" : "RESOLVED")
      : (type === "COUNTER" ? "UNADDRESSED" : "UNRESOLVED");
    return `- ${prefix}${i + 1}: ${m} \u2014 STATUS: ${status}`;
  }).join("\n") + "\n";
}

// Build buried markers section
const buriedSection = buried.length > 0
  ? buried.map(b => `- [${b.type}] ${b.content}`).join("\n")
  : "[None detected]";

const traceSummary = `# Dialectic Trace Summary

## Original Thesis
${prompt || "[not recorded]"}

## Confidence Trajectory
${trajectoryTable}
## Evidence Inventory

### [EVIDENCE] markers
${buildMarkerList("EVIDENCE", scratchpadMarkers.EVIDENCE)}
### [COUNTER] markers
${buildStatusMarkerList("COUNTER", scratchpadMarkers.COUNTER, scratchpad)}
### [TENSION] markers
${buildStatusMarkerList("TENSION", scratchpadMarkers.TENSION, scratchpad)}
### [INSIGHT] markers
${buildMarkerList("INSIGHT", scratchpadMarkers.INSIGHT)}
### [THREAD] markers
${buildMarkerList("THREAD", scratchpadMarkers.THREAD || [])}
### [RISK] markers
${buildMarkerList("RISK", scratchpadMarkers.RISK || [])}
### [QUESTION] markers
${buildMarkerList("QUESTION", scratchpadMarkers.QUESTION || [])}
## Markers Appearing in Expansion but Absent from Final Synthesis
${buriedSection}
`;

// ============================================================
// File 3: holdout_brief.md — copy from HOLDOUT.md
// ============================================================

const holdoutMdPath = path.join(
  __dirname,
  "..",
  "skills",
  "dialectic",
  "HOLDOUT.md"
);

if (!fs.existsSync(holdoutMdPath)) {
  console.error("HOLDOUT.md not found at " + holdoutMdPath);
  process.exit(1);
}

const holdoutBrief = fs.readFileSync(holdoutMdPath, "utf8");

// ============================================================
// Write outputs
// ============================================================

fs.mkdirSync(HOLDOUT_DIR, { recursive: true });

fs.writeFileSync(path.join(HOLDOUT_DIR, "conviction_thesis.md"), convictionThesis);
fs.writeFileSync(path.join(HOLDOUT_DIR, "trace_summary.md"), traceSummary);
fs.writeFileSync(path.join(HOLDOUT_DIR, "holdout_brief.md"), holdoutBrief);

console.log("Serialization complete. Holdout input written to " + HOLDOUT_DIR);
console.log("  - conviction_thesis.md");
console.log("  - trace_summary.md");
console.log("  - holdout_brief.md");
process.exit(0);
