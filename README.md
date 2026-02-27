# Dialectic Plugin for Claude Code

Multi-pass dialectic reasoning with automatic looping. Analyzes complex strategic questions through iterative expansion, compression, and critique cycles.

## Installation

### From the marketplace (recommended)

Add the marketplace and install the plugin from within Claude Code:

```
/plugin marketplace add AustinSalter/dialectic-plugin
/plugin install dialectic@AustinSalter-dialectic-plugin
```

Or browse available plugins interactively by running `/plugin` and navigating to the **Discover** tab.

### From a local clone

```bash
git clone https://github.com/AustinSalter/dialectic-plugin.git
```

Then add it as a local marketplace from within Claude Code:

```
/plugin marketplace add ./dialectic-plugin
/plugin install dialectic@dialectic-plugin
```

## Usage

### 1. Reason

```
/dialectic:dialectic <thesis or question>
```

Optional flags:

- `--min-iterations=N` — Minimum iterations before concluding (default: 2)
- `--max-iterations=N` — Maximum iterations before forced exit (default: 5)

Examples:

```
/dialectic:dialectic Should Yahoo acquire Google for $3B in 2002?
/dialectic:dialectic --min-iterations=3 --max-iterations=7 "Where should VCs deploy capital in AI?"
```

The reasoning loop will:

1. **EXPANSION** — Explore the question broadly, gathering evidence and counter-arguments
2. **COMPRESSION** — Synthesize findings, update confidence, identify next priority
3. **CRITIQUE** — Apply adversarial probes, decide whether to continue, conclude, or elevate
4. **Loop** — Automatically continue until the thesis is robust or max iterations reached

A stop hook manages the loop automatically — blocking exit (exit code 2) and re-feeding the prompt via stderr until the critique pass decides to conclude or the iteration limit is reached. When reasoning concludes, the state transitions to `awaiting_distillation`. A single Node.js entry point (`stop-hook.js`) delegates to the bash script on macOS/Linux and handles the logic directly on Windows.

### 2. Distill into conviction memo

```
/dialectic:dialectic-distill [--output=<dir>] [--keep=<list>] [--min-passes=N] [--max-passes=N]
```

Run after reasoning completes. Compresses the reasoning artifacts into an actionable conviction memo through iterative distillation:

1. **SPINE EXTRACTION** — Walk the scratchpad chronologically, identify surviving claims and evidence, build a structural skeleton (`spine.yaml`)
2. **MEMO DRAFT** — Write a conviction memo against the synthesis spec
3. **PROBES** — Run 5 fidelity checks: Trace, Tension, Sufficiency, Conviction-Ink, Threads
4. **Loop** — Continue refining (pass 2+ runs probes in adversarial mode) until all probes pass or max passes reached
5. **PROMOTE** — Final draft is promoted to `memo-final.md`

Optional flags:

- `--output=<dir>` — Directory for preserved artifacts (default: `.dialectic-output/`)
- `--keep=<list>` — Comma-separated artifact names to preserve (default: `memo,spine,history`)
- `--min-passes=N` — Minimum distillation passes (default: 2)
- `--max-passes=N` — Maximum distillation passes (default: 4)

### Cancel the loop

```
/dialectic:cancel-dialectic
```

Stops the reasoning loop, reports where analysis stopped, and cleans up state files.

## Architecture

```
Reasoning loop (/dialectic:dialectic)

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  EXPANSION  │────▶│ COMPRESSION │────▶│   CRITIQUE  │
│  (diverge)  │     │  (converge) │     │  (decide)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
              [CONTINUE]                 [CONCLUDE]                  [ELEVATE]
              loop back            awaiting_distillation           reframe thesis


Distillation loop (/dialectic:dialectic-distill)

┌──────────────┐     ┌────────────┐     ┌──────────┐
│    SPINE     │────▶│    MEMO    │────▶│  PROBES  │
│  EXTRACTION  │     │   DRAFT    │     │  (5 checks) │
└──────────────┘     └────────────┘     └─────┬────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                              ▼                               ▼
                        [CONTINUE]                      [CONCLUDE]
                     revise + re-probe              (pass ≥ 2) promote
                     (adversarial mode)             draft → memo-final
```

### Termination conditions

Analysis terminates when any of:

1. Critique decides the thesis is robust (CONCLUDE) and the iteration floor is met
2. Confidence delta < 0.05 for 2 consecutive cycles (saturation)
3. Composite confidence >= 0.75 with < 2 unresolved questions
4. Max iterations reached (triggers escape hatch if confidence is low)

## Key Features

### 3D Confidence Model

Single scalar confidence conflates reasoning quality, evidence quality, and conclusion certainty. This plugin uses three independent dimensions:

- **R (Reasoning)**: Is the logic sound? (0.0–1.0)
- **E (Evidence)**: Is evidence complete? (0.0–1.0)
- **C (Conclusion)**: How certain given R and E? (0.0–1.0)

Composite score: `(R + E + C) / 3`. Confidence is non-monotonic — it can go down between iterations as new counter-evidence surfaces.

### Semantic Markers

Structured reasoning output with extractable markers:

- `[INSIGHT]` — Non-obvious conclusions
- `[EVIDENCE]` — Specific data points
- `[COUNTER]` — Arguments against the thesis
- `[TENSION]` — Conflicting evidence
- `[THREAD]` — Areas worth exploring

### Market Structure Detection

Automatic detection of market dynamics:

- Winner-Take-All (WTA)
- Winner-Take-Most (WTM)
- Disruption (Christensen Pattern)
- Gradual Share Competition
- Commodity Dynamics

### Conviction Synthesis

Distillation extracts a `spine.yaml` (structural skeleton of surviving claims and evidence) from the reasoning scratchpad, then drafts a conviction memo validated by 5 probes:

| Probe | Checks |
|-------|--------|
| **Trace** | Every load-bearing claim in the memo? Every memo claim in the spine? |
| **Tension** | Does each counter-argument *strengthen* the thesis, not just get dismissed? |
| **Sufficiency** | Could the reader act on this without the scratchpad? |
| **Conviction-Ink** | Does every sentence advance the argument, provide evidence, or acknowledge risk? |
| **Threads** | ≤3 independent argument threads held simultaneously? |

Pass 2+ runs probes in adversarial mode. The final memo sections are:

- **Context** — Decision stakes and timing
- **Core Thesis** — The altitude shift the analysis discovered
- **The Counter-Argument** — Strongest objection and why we commit anyway
- **Position** — The structural bet and its mechanism
- **Recommended Actions** — What to do Monday, check at 30 days, gate conditions
- **What Would Change This View** — Observable disconfirmation triggers
- **Decision** — Verdict table (recommendation, conviction, window, constraint, trigger)

## Plugin Structure

```
dialectic-plugin/
├── .claude-plugin/
│   ├── plugin.json         # Plugin metadata
│   └── marketplace.json    # Marketplace catalog entry
├── commands/
│   ├── dialectic.md        # Reasoning command
│   ├── dialectic-distill.md # Distillation command
│   └── cancel-dialectic.md # Cancel command
├── skills/
│   └── dialectic/
│       ├── SKILL.md        # Skill overview
│       ├── EXPANSION.md    # Expansion pass instructions
│       ├── COMPRESSION.md  # Compression pass instructions
│       ├── CRITIQUE.md     # Critique pass instructions
│       ├── DISTILLATION.md # Distillation protocol
│       ├── SYNTHESIS.md    # Memo format specification
│       ├── ESCAPE-HATCH.md # Escape hatch for blocked analysis
│       ├── MARKERS.md      # Semantic marker definitions
│       └── PATTERNS.md     # Strategic patterns library
├── hooks/
│   └── hooks.json          # Stop hook configuration
├── scripts/
│   ├── stop-hook.js        # Loop controller entry point (delegates to bash on macOS/Linux)
│   └── stop-hook.sh        # Loop controller (bash/jq, used on macOS/Linux)
└── README.md
```

## License

MIT
