# Dialectic Plugin for Claude Code

Multi-pass reasoning for strategic questions. Iterates through expansion, compression, and critique until a thesis is robust — or proved wrong.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet)](https://claude.ai)

## Quick Start

### From the marketplace (recommended)

```
/plugin marketplace add AustinSalter/dialectic-plugin
/plugin install dialectic@AustinSalter-dialectic-plugin
```

Or browse available plugins: `/plugin` → **Discover** tab.

### From a local clone

```
git clone https://github.com/AustinSalter/dialectic-plugin.git
/plugin marketplace add ./dialectic-plugin
/plugin install dialectic@dialectic-plugin
```

## Features

- **Iterative dialectic reasoning** — Expansion, compression, and critique passes that argue against themselves before concluding
- **3D confidence tracking** — Robustness, evidence saturation, and domain determinacy replace single-scalar guesswork
- **Frame selection** — Calibrates altitude before searching. "Better docs" becomes "developer adoption → switching costs → infrastructure moat"
- **Two-loop architecture** — Reasoning explores (messy, exhaustive). Distillation compresses (every sentence earns its place). A stop hook enforces the boundary.
- **Conviction memo output** — Structured for action: headline insight, the bet, falsification triggers, first Monday move
- **Adversarial probes** — Five distillation probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads) gate the final memo before it ships

## Usage

### Reason

```
/dialectic <thesis or question>
```

Optional flags: `--min-iterations=N` (default 3), `--max-iterations=N` (default 5).

```
/dialectic Should Yahoo acquire Google for $3B in 2002?
/dialectic --min-iterations=4 "Where should VCs deploy capital in AI?"
```

### Distill

After reasoning concludes, compress into a conviction memo:

```
/dialectic-distill
```

Optional flags: `--output=<dir>`, `--keep=<list>`, `--min-passes=N`, `--max-passes=N`.

### Cancel

```
/cancel-dialectic
```

## How It Works

Single-pass AI treats strategy as text generation: query in, answer out. But strategic thinking is *siege work* — recursive, high-stakes, long-feedback-loop. The interesting questions aren't answered by faster generation. They're answered by structured self-opposition.

This plugin engineers the conditions for what the Greeks called *aporia*: productive confusion that precedes genuine insight. It forces the model to argue against itself before concluding, because a thesis that hasn't survived adversarial pressure isn't a thesis — it's a first draft.

```
 LOOP 1: REASONING
 ═══════════════════════════════════════════════════════════════

 ┌─────────────┐      ┌─────────────┐      ┌──────────────┐
 │  EXPANSION  │─────▶│ COMPRESSION │─────▶│   CRITIQUE   │
 │             │      │             │      │              │
 │  Frame the  │      │  Find the   │      │  Break it    │
 │  question.  │      │  joint.     │      │  or commit.  │
 │  Search.    │      │             │      │              │
 └─────────────┘      └─────────────┘      └──────┬───────┘
       ▲                                          │
       │               ┌──────────────────────────┼────────────┐
       │               │                          │            │
       │               ▼                          ▼            ▼
       └────── [CONTINUE]                   [ELEVATE]    [CONCLUDE]
               loop back                  reframe thesis       │
                                                               │
                                                        ── stop hook ──
                                                               │
 LOOP 2: DISTILLATION                                          │
 ═══════════════════════════════════════════════════════════════
                                                               │
 ┌─────────────┐      ┌─────────────┐      ┌──────────────┐   │
 │    SPINE    │─────▶│    DRAFT    │─────▶│    PROBES    │◀──┘
 │             │      │             │      │              │
 │  Extract    │      │  Write to   │      │  Trace       │
 │  load-      │      │  SYNTHESIS  │      │  Tension     │
 │  bearing    │      │  spec       │      │  Sufficiency │
 │  claims     │      │             │      │  Ink         │
 └─────────────┘      └─────────────┘      │  Threads     │
       ▲                                   └──────┬───────┘
       │                                          │
       │               ┌──────────────────────────┤
       │               │                          │
       │               ▼                          ▼
       └────── [CONTINUE]                   [CONCLUDE]
               revise draft               promote to final
```

Each phase operationalizes a move from the dialectical tradition — Socratic cross-examination, Hegelian sublation, Aristotelian stasis classification — without requiring the vocabulary.

**Expansion** selects a frame (what stasis level? what is this thesis trying to protect?) then searches within it. Not "think broadly" — "think at the right altitude."

**Compression** distills to three things: the thesis, the strongest opposition, and the *joint* — the point where both feel true. The joint carries across cycles. Everything else dies.

**Critique** tries to break the thesis. A preservation gate prevents abstraction drift — you can't elevate without first articulating what the thesis got right.

**Distillation** extracts the spine (load-bearing claims + causal chain), drafts against the SYNTHESIS.md spec, and runs five probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads). Minimum 2 passes; pass 2+ is adversarial.

The two loops are structurally independent. The reasoning loop explores — messy, exhaustive, 5,000+ words of scratchpad. The distillation loop compresses — every sentence must earn its place. A model that reasons and writes simultaneously produces research reports too long to read and too shallow to act on. The stop hook enforces the boundary: finish thinking, then start writing.

### Termination

Reasoning ends when critique CONCLUDEs and the iteration floor is met, confidence saturates (delta < 0.05 for two cycles), or max iterations hit. Distillation ends when all five probes pass and the compression gate is satisfied.

### 3D Confidence

Single-scalar confidence creates two problems. First, *bad infinity*: the model can always find another objection, so confidence oscillates without converging. A single number can't distinguish "my reasoning broke" from "I need more evidence" from "this domain is just hard." Second, *unreachable thresholds*: geopolitical questions will never hit 0.75 confidence and shouldn't have to.

Three dimensions solve both:

- **R (Robustness)** — does the thesis survive adversarial pressure? R can rise even as the thesis changes, because absorbing an objection makes the argument stronger.
- **E (Evidence saturation)** — how much relevant evidence has been integrated? Per-iteration cap of 0.15 prevents inflation. Evidence gate requires E ≥ 0.4 before reframing is allowed.
- **C (Domain determinacy)** — how knowable is this question *in principle*? Physics: 0.7-0.9. Geopolitics: 0.2-0.4. C is the ceiling — it tells the system when to stop pushing, not when to keep trying.

A thesis at R=0.65, E=0.70, C=0.38 is ready to conclude. A single scalar would average to ~0.58 and keep iterating, chasing convergence the domain prevents. The three dimensions make the *source* of uncertainty legible, so each drop leads to a different next move.

Confidence should be non-monotonic. A dip means a critique found a real problem; recovery means the thesis absorbed it. Monotonic ascent is rationalization.

## Inspirations

The architecture draws from thinkers who treated reasoning as adversarial and iterative — not a toolkit of named concepts but structural moves that recur across 2,400 years of serious thought about how minds change.

**Socrates** gave us *elenchus* — cross-examination that creates the conditions for discovering your frame is wrong. **Aristotle** contributed *stasis theory* — not all disagreements are equal; are we arguing about facts, definitions, values, or procedures? The expansion pass classifies the question's stasis level before searching. **Hegel's** *Aufhebung* — negation that preserves what it negates — is the critique pass's preservation gate: you can't elevate without first articulating what the thesis got right. **Walter Benjamin** drew the distinction between information (explains itself on arrival) and narrative (lodges in the reader and unfolds). The reasoning loop produces information; the distillation loop transforms it into narrative. This is why the plugin has two loops, not one.

The conviction memo format descends from **Cicero** — propositio, narratio, refutatio, peroratio — because Roman juries had short attention spans and the advocate who wasted their time lost. The same constraint applies to anyone reading your analysis. **Orwell's** compression axioms ("omit needless words") become formal probes: does every sentence advance the argument, provide evidence, or acknowledge risk?

[Read the full philosophical foundations →](PHILOSOPHICAL-FOUNDATIONS.md)

## Plugin Structure

```
dialectic-plugin/
├── .claude-plugin/         # Plugin metadata
├── commands/
│   ├── dialectic.md        # Reasoning loop command
│   ├── dialectic-distill.md # Distillation command
│   └── cancel-dialectic.md # Cancel command
├── skills/dialectic/
│   ├── SKILL.md            # Skill overview
│   ├── EXPANSION.md        # Frame selection + divergent search
│   ├── COMPRESSION.md      # Distill to thesis, opposition, joint
│   ├── CRITIQUE.md         # Adversarial probes + preservation gate
│   ├── SYNTHESIS.md        # Conviction memo format spec
│   ├── DISTILLATION.md     # Distillation loop protocol + probes
│   ├── ESCAPE-HATCH.md     # Low-confidence forced exit
│   ├── MARKERS.md          # Semantic marker definitions
│   └── PATTERNS.md         # Strategic patterns library
├── hooks/
│   └── hooks.json          # Stop hook config
├── scripts/
│   ├── stop-hook.sh        # Loop controller (macOS/Linux)
│   └── stop-hook.js        # Loop controller (cross-platform)
└── README.md
```

## License

MIT
