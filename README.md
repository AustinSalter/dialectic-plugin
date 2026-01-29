# Dialectic Plugin for Claude Code

Multi-pass dialectic reasoning with automatic looping. Analyzes complex strategic questions through iterative expansion, compression, and critique cycles.

## Installation

```bash
# Clone the repository
git clone https://github.com/austinsalter/dialectic-plugin.git

# Use with Claude Code
claude --plugin-dir ./dialectic-plugin
```

## Usage

### Start Dialectic Reasoning

```
/dialectic <thesis or question>
```

Example:
```
/dialectic Should Yahoo acquire Google for $3B in 2002?
```

The dialectic loop will:
1. **EXPANSION**: Explore the question broadly, gathering evidence and counter-arguments
2. **COMPRESSION**: Synthesize findings, update confidence, identify next priority
3. **CRITIQUE**: Apply adversarial probes, decide whether to continue, conclude, or elevate
4. **Loop**: Automatically continue until the thesis is robust or max iterations reached
5. **SYNTHESIS**: Produce a conviction memo with actionable recommendations

### Cancel the Loop

```
/cancel-dialectic
```

Stops the reasoning loop and cleans up state files.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  EXPANSION  │────▶│ COMPRESSION │────▶│   CRITIQUE  │
│  (diverge)  │     │  (converge) │     │  (decide)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
              [CONTINUE]                 [CONCLUDE]                  [ELEVATE]
              loop back                  to synthesis              reframe thesis
```

## Key Features

### 3D Confidence Model

Single scalar confidence conflates reasoning quality, evidence quality, and conclusion certainty. This plugin uses three independent dimensions:

- **R (Reasoning)**: Is the logic sound? (0.0-1.0)
- **E (Evidence)**: Is evidence complete? (0.0-1.0)
- **C (Conclusion)**: How certain given R and E? (0.0-1.0)

### Semantic Markers

Structured reasoning output with extractable markers:
- `[INSIGHT]` - Non-obvious conclusions
- `[EVIDENCE]` - Specific data points
- `[COUNTER]` - Arguments against the thesis
- `[TENSION]` - Conflicting evidence
- `[THREAD]` - Areas worth exploring

### Market Structure Detection

Automatic detection of market dynamics:
- Winner-Take-All (WTA)
- Winner-Take-Most (WTM)
- Disruption (Christensen Pattern)
- Gradual Share Competition
- Commodity Dynamics

### Conviction Synthesis

Final output is a "conviction memo" with:
- Headline insight
- The Leap (single incisive shift)
- Brief Refutatio (strongest counter, why we commit anyway)
- The Bet (what we're betting on and why)
- Implementation Protocol (concrete actions)
- Disconfirmation Triggers (what would flip the recommendation)

## Plugin Structure

```
dialectic-plugin/
├── .claude-plugin/
│   ├── plugin.json         # Plugin metadata
│   └── marketplace.json    # Marketplace catalog entry
├── commands/
│   ├── dialectic.md        # Main command
│   └── cancel-dialectic.md # Cancel command
├── skills/
│   └── dialectic/
│       ├── SKILL.md        # Skill overview
│       ├── EXPANSION.md    # Expansion pass instructions
│       ├── COMPRESSION.md  # Compression pass instructions
│       ├── CRITIQUE.md     # Critique pass instructions
│       ├── SYNTHESIS.md    # Synthesis pass instructions
│       ├── ESCAPE-HATCH.md # Escape hatch for blocked analysis
│       ├── MARKERS.md      # Semantic marker definitions
│       └── PATTERNS.md     # Strategic patterns library
├── hooks/
│   └── hooks.json          # Hook configuration
├── scripts/
│   └── stop-hook.sh        # Loop controller script
└── README.md
```

## License

MIT
