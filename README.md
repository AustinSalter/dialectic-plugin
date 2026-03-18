# Dialectic Plugin for Claude Code

Multi-pass reasoning for strategic questions. Iterates through expansion, compression, and critique until a thesis is robust — then synthesizes into conviction memos or engineering build specs.

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
- **Multi-loop architecture** — Reasoning explores, distillation compresses, forge extracts. Optional holdout validation between reasoning and synthesis. A stop hook enforces every boundary.
- **Conviction memo output** — Structured for action: headline insight, the bet, falsification triggers, first Monday move
- **Adversarial probes** — Five distillation probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads) gate the final memo before it ships
- **Holdout validation** — Partitioned adversarial audit via isolated subagent. Catches buried evidence, confidence inflation, and question drift the internal critique missed
- **Forge synthesis** — Translates dialectic output into engineering build specs. Evidence becomes constraints, counters become risks, tensions become decision points with seam locations

## Usage

### Reason

```
/dialectic <thesis or question>
```

Optional flags: `--min-iterations=N` (default 3), `--max-iterations=N` (default 5), `--holdout` (enable holdout validation).

```
/dialectic Should Yahoo acquire Google for $3B in 2002?
/dialectic --min-iterations=4 "Where should VCs deploy capital in AI?"
/dialectic --holdout "Should we use event sourcing for the audit service?"
```

### Distill

After reasoning concludes, compress into a conviction memo:

```
/dialectic-distill
```

Optional flags: `--output=<dir>`, `--keep=<list>`, `--min-passes=N`, `--max-passes=N`.

If holdout ran, distill incorporates findings automatically (challenged → inject counters, validated → append confirmation footer).

### Forge

After reasoning concludes, synthesize into an engineering build spec:

```
/forge
```

Optional flags: `--min-passes=N`, `--max-passes=N`, `--output=<path>`.

Translates semantic markers into architectural components: `[EVIDENCE]` → constraints, `[COUNTER]` → risks with mitigations, `[TENSION]` → decision points with seam locations, `[INSIGHT]` → design principles, `[THREAD]` → Phase 2 extension points.

### Cancel

```
/cancel-dialectic
```

## How It Works

Single-pass AI treats strategy as text generation: query in, answer out. But strategic thinking is *siege work* — recursive, high-stakes, long-feedback-loop. The interesting questions aren't answered by faster generation. They're answered by structured self-opposition.

This plugin engineers the conditions for what the Greeks called *aporia*: productive confusion that precedes genuine insight. It forces the model to argue against itself before concluding, because a thesis that hasn't survived adversarial pressure isn't a thesis — it's a first draft.

```
 REASONING LOOP
 ══════════════════════════════════════════════════════════════

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
 HOLDOUT (optional, if --holdout)                              │
 ══════════════════════════════════════════════════════════════ │
                                                               │
                                          ┌────────────────────┘
                                          ▼
                                   ┌──────────────┐
                                   │   HOLDOUT    │
                                   │  subagent    │
                                   │              │
                                   │  Structural  │
                                   │  audit →     │
                                   │  Steelman →  │
                                   │  Inversion   │
                                   └──────┬───────┘
                                          │
                            ┌─────────────┼─────────────┐
                            │             │             │
                            ▼             ▼             ▼
                       VALIDATED     CHALLENGED     FRACTURED
                       (proceed)     (proceed w/    (re-loop with
                                      findings)     counter-thesis)

 SYNTHESIS (user chooses one or both)
 ══════════════════════════════════════════════════════════════

 /dialectic-distill                    /forge
 ┌─────────────┐                       ┌──────────────┐
 │    SPINE    │─────▶ DRAFT ──▶       │    DRAFT     │
 │  extract    │      PROBES           │  translate   │──▶ QUALITY
 │  claims     │  (5 adversarial       │  markers →   │    CHECKS
 └─────────────┘   gates)              │  build spec  │   (7 gates)
       ▲               │               └──────────────┘       │
       └── [CONTINUE]──┘                    ▲                 │
            revise                          └── [CONTINUE] ───┘
                                                 revise
```

Each phase operationalizes a move from the dialectical tradition — Socratic cross-examination, Hegelian sublation, Aristotelian stasis classification — without requiring the vocabulary.

**Expansion** selects a frame (what stasis level? what is this thesis trying to protect?) then searches within it. Not "think broadly" — "think at the right altitude."

**Compression** distills to three things: the thesis, the strongest opposition, and the *joint* — the point where both feel true. The joint carries across cycles. Everything else dies.

**Critique** tries to break the thesis. A preservation gate prevents abstraction drift — you can't elevate without first articulating what the thesis got right.

**Holdout** (optional, via `--holdout`) spawns an isolated subagent that has never seen the reasoning narrative. It sees only the evidence inventory and confidence trajectory — enough to audit, not enough to be anchored. Three attack passes: structural audit (buried evidence, confidence inflation, question drift, circular support), adversarial steelman (unengaged counters, disconfirmation quality, Pollock defeater classification), and the inversion (can you construct a coherent counter-narrative from the same evidence?). Verdict: VALIDATED, CHALLENGED, or FRACTURED. A FRACTURED verdict automatically re-enters the reasoning loop with the holdout's counter-thesis.

**Distillation** extracts the spine (load-bearing claims + causal chain), drafts against the SYNTHESIS.md spec, and runs five probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads). Minimum 2 passes; pass 2+ is adversarial. If holdout ran, findings are injected automatically.

**Forge** translates the same trace into an engineering build spec. Where distill closes every tension (conviction requires resolution), forge preserves tensions as architectural seams with explicit degrees of freedom. The marker translation table maps evidence to constraints, counters to risks with mitigations and monitoring signals, tensions to decision points with seam locations and revisit triggers, insights to design principles, and threads to Phase 2 extension points. Multi-pass loop with 7 quality gates.

The phases are structurally independent. Reasoning explores — messy, exhaustive, 5,000+ words of scratchpad. Holdout validates — isolated, adversarial, decorrelated from the narrative that produced the thesis. Distillation compresses — every sentence must earn its place. Forge extracts — every component justified by trace evidence. A model that reasons and writes simultaneously produces research reports too long to read and too shallow to act on. The stop hook enforces every boundary: finish thinking, then validate, then start writing (or building).

### Termination

Reasoning ends when critique CONCLUDEs and the iteration floor is met, confidence saturates (delta < 0.05 for two cycles), or max iterations hit. If `--holdout` is enabled, holdout runs automatically before transitioning to the synthesis-ready state. Distillation ends when all five probes pass and the compression gate is satisfied. Forge ends when all seven quality checks pass.

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

**Socrates** gave us *elenchus* — cross-examination that creates the conditions for discovering your frame is wrong. **Aristotle** contributed *stasis theory* — not all disagreements are equal; are we arguing about facts, definitions, values, or procedures? The expansion pass classifies the question's stasis level before searching. **Hegel's** *Aufhebung* — negation that preserves what it negates — is the critique pass's preservation gate: you can't elevate without first articulating what the thesis got right. **Walter Benjamin** drew the distinction between information (explains itself on arrival) and narrative (lodges in the reader and unfolds). The reasoning loop produces information; distillation transforms it into narrative; forge transforms it into architecture. **Pollock's** defeater typology (undercutting vs. rebutting) structures the holdout's adversarial steelman — undercutting defeaters that break inferential links are more dangerous than rebutting defeaters that provide counter-evidence.

The conviction memo format descends from **Cicero** — propositio, narratio, refutatio, peroratio — because Roman juries had short attention spans and the advocate who wasted their time lost. The same constraint applies to anyone reading your analysis. **Orwell's** compression axioms ("omit needless words") become formal probes: does every sentence advance the argument, provide evidence, or acknowledge risk?

[Read the full philosophical foundations →](PHILOSOPHICAL-FOUNDATIONS.md)

## Plugin Structure

```
dialectic-plugin/
├── .claude-plugin/         # Plugin metadata
├── commands/
│   ├── dialectic.md        # Reasoning loop command (--holdout flag)
│   ├── dialectic-distill.md # Distillation command (holdout-aware)
│   ├── forge.md            # Forge build spec command
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
│   ├── PATTERNS.md         # Strategic patterns library
│   ├── HOLDOUT.md          # Holdout adversarial audit instructions
│   └── FORGE.md            # Forge build spec synthesis instructions
├── hooks/
│   └── hooks.json          # Stop hook config
├── scripts/
│   ├── stop-hook.sh        # Loop controller (macOS/Linux)
│   ├── stop-hook.js        # Loop controller (cross-platform)
│   └── serialize-trace.js  # Trace serialization for holdout
└── README.md
```

## License

MIT
