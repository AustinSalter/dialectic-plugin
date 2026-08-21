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
- **A thesis can die** — REJECT is a first-class outcome: one re-loop on a counter-thesis if the evidence supports a rival, or a refutation memo. Killed claims stay visibly dead in the spine
- **Warrant gate** — The stop hook refuses any decision whose probe reasoning isn't externalized to the scratchpad. Verdicts without visible warrants don't advance the loop
- **3D confidence tracking** — Robustness, evidence saturation, and domain determinacy replace single-scalar guesswork. Verdict language is bound by the lowest dimension — never an average
- **Frame selection** — Calibrates altitude before searching. "Better docs" becomes "developer adoption → switching costs → infrastructure moat"
- **Two-loop architecture** — Reasoning explores (messy, exhaustive). Distillation compresses (every sentence earns its place). A stop hook enforces the boundary.
- **Conviction memo output** — Structured for action: headline insight, the bet, falsification triggers, first Monday move
- **Adversarial probes** — Five distillation probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads) gate the final memo before it ships
- **Holdout validation** — Partitioned adversarial audit via isolated subagent. Catches buried evidence, confidence inflation, and question drift the internal critique missed
- **Forge synthesis** — Translates dialectic output into engineering build specs. Evidence becomes constraints, counters become risks, tensions become decision points with seam locations
- **Hardened loop mechanics** — Artifacts checkpoint at every terminal transition, abandoned sessions auto-archive instead of rotting, a liveness beacon (`last_hook_ts`) makes hook failures provable from state alone, and a 50-test suite exercises both hook implementations

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
       │               ┌───────────────┬──────────┼────────────┐
       │               │               │          │            │
       │               ▼               ▼          ▼            ▼
       └────── [CONTINUE]        [REJECT]   [ELEVATE]    [CONCLUDE]
               loop back      thesis dies: reframe thesis      │
                              counter-thesis                   │
                              re-loop, or                      │
                              refutation memo                  │
                                                    ┌──────────┴──────────┐
                                                    │     HOLDOUT         │
                                                    │  (if --holdout)     │
                                                    │  partitioned audit  │
                                                    └──────────┬──────────┘
                                                               │
                                                        ── stop hook ──
                                                               │
                                              ┌────────────────┴────────────────┐
                                              │                                 │
 LOOP 2: DISTILLATION                         │          LOOP 3: FORGE          │
 ═════════════════════════════════════════     │     ════════════════════════    │
                                              │                                 │
 ┌─────────────┐      ┌─────────────┐        │     ┌─────────────┐             │
 │    SPINE    │─────▶│    DRAFT    │─────┐   │     │    DRAFT    │─────┐       │
 │             │      │             │     │   │     │             │     │       │
 │  Extract    │      │  Write to   │     │   │     │  Translate  │     │       │
 │  load-      │      │  SYNTHESIS  │     │   │     │  markers →  │     │       │
 │  bearing    │      │  spec       │     │   │     │  build spec │     │       │
 │  claims     │      │             │     │   │     │             │     │       │
 └─────────────┘      └─────────────┘     │   │     └─────────────┘     │       │
       ▲                                  ▼   │           ▲             ▼       │
       │                           ┌──────────┴─┐        │      ┌──────────┐   │
       │                           │   PROBES   │◀───────┘      │ QUALITY  │   │
       │                           │            │               │ CHECKS   │   │
       │                           │  Trace     │               │ (7 gates)│   │
       │                           │  Tension   │               └─────┬────┘   │
       │                           │  Sufficiency                     │        │
       │                           │  Ink       │               ┌─────┴────┐   │
       │                           │  Threads   │               │          │   │
       │                           └──────┬─────┘               ▼          ▼   │
       │                                  │              [CONTINUE]  [CONCLUDE]│
       │               ┌──────────────────┤               revise     promote   │
       │               │                  │                          to report  │
       │               ▼                  ▼                                     │
       └────── [CONTINUE]           [CONCLUDE]                                 │
               revise draft       promote to final                             │
```

Each phase operationalizes a move from the dialectical tradition — Socratic cross-examination, Hegelian sublation, Aristotelian stasis classification — without requiring the vocabulary.

**Expansion** selects a frame (what stasis level? what is this thesis trying to protect?) then searches within it. Not "think broadly" — "think at the right altitude."

**Compression** distills to three things: the thesis, the strongest opposition, and the *joint* — the point where both feel true. The joint carries across cycles. Everything else dies.

**Critique** tries to break the thesis — and now keeps score. The Survival probe records whether a kill was attempted and whether the thesis came through it; R rises only on survived attempts, never on unopposed rounds. A preservation gate prevents abstraction drift — you can't elevate without first articulating what the thesis got right. And when the evidence breaks the core claim, REJECT ends it honestly: one re-loop on a counter-thesis if the round's evidence supports a rival, otherwise a refutation memo. Knowing why a thesis is wrong is a conviction too.

**Distillation** extracts the spine (load-bearing claims + causal chain), drafts against the SYNTHESIS.md spec, and runs five probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads). Minimum 2 passes; pass 2+ is adversarial.

**Holdout** (optional, via `--holdout`) spawns an isolated subagent that has never seen the reasoning narrative. It sees only the evidence inventory and confidence trajectory — enough to audit, not enough to be anchored. Three attack passes: structural audit (buried evidence, confidence inflation, question drift, circular support), adversarial steelman (unengaged counters, disconfirmation quality, Pollock defeater classification), and the inversion (can you construct a coherent counter-narrative from the same evidence?). Verdict: VALIDATED, CHALLENGED, or FRACTURED.

**Forge** translates the same trace into an engineering build spec. Where distill closes every tension (conviction requires resolution), forge preserves tensions as architectural seams with explicit degrees of freedom. The marker translation table maps evidence to constraints, counters to risks with mitigations and monitoring signals, tensions to decision points with seam locations and revisit triggers, insights to design principles, and threads to Phase 2 extension points.

The loops are structurally independent. The reasoning loop explores — messy, exhaustive, 5,000+ words of scratchpad. The distillation loop compresses — every sentence must earn its place. The forge loop extracts — every component justified by trace evidence. A model that reasons and writes simultaneously produces research reports too long to read and too shallow to act on. The stop hook enforces the boundary: finish thinking, then start writing (or building).

### Termination

Reasoning ends when critique CONCLUDEs and the iteration floor is met, when it REJECTs with no viable counter-thesis (the run ends as a refutation), when confidence saturates (delta < 0.05 for two cycles), or at max iterations. The stop hook enforces all of it — including the warrant gate: a decision with no externalized probe reasoning is bounced back, not honored. If `--holdout` is enabled, holdout runs automatically before transitioning to the synthesis-ready state. Distillation ends when all five probes pass and the compression gate is satisfied. Forge ends when all seven quality checks pass.

### 3D Confidence

Single-scalar confidence creates two problems. First, *bad infinity*: the model can always find another objection, so confidence oscillates without converging. A single number can't distinguish "my reasoning broke" from "I need more evidence" from "this domain is just hard." Second, *unreachable thresholds*: geopolitical questions will never hit 0.75 confidence and shouldn't have to.

Three dimensions solve both:

- **R (Robustness)** — does the thesis survive adversarial pressure? R rises only in rounds where a kill was attempted and the thesis survived it. No attempt, no credit — absorption alone is not evidence of strength.
- **E (Evidence saturation)** — how much relevant evidence has been integrated? Per-iteration cap of 0.15 prevents inflation. Evidence gate requires E ≥ 0.4 before reframing is allowed.
- **C (Domain determinacy)** — how knowable is this question *in principle*? Physics: 0.7-0.9. Geopolitics: 0.2-0.4. C is the ceiling — it tells the system when to stop pushing, not when to keep trying.

A thesis at R=0.65, E=0.70, C=0.38 is ready to conclude. A single scalar would average to ~0.58 and keep iterating, chasing convergence the domain prevents. The three dimensions make the *source* of uncertainty legible, so each drop leads to a different next move.

The numbers stay out of the memo, but they bound its verbs: verdict language keys off the **lowest** of R, E, C — a chain is as strong as its weakest dimension, and averaging lets a falling minimum hide behind a rising mean. Below 0.5, the memo may only hold and monitor; commitment verbs (ADOPT, ACQUIRE, ENTER) are earned at 0.7.

Confidence should be non-monotonic. A dip means a critique found a real problem; recovery means the thesis absorbed it. Monotonic ascent is rationalization.

## Inspirations

The architecture draws from thinkers who treated reasoning as adversarial and iterative — not a toolkit of named concepts but structural moves that recur across 2,400 years of serious thought about how minds change.

**Socrates** gave us *elenchus* — cross-examination that creates the conditions for discovering your frame is wrong. **Aristotle** contributed *stasis theory* — not all disagreements are equal; are we arguing about facts, definitions, values, or procedures? The expansion pass classifies the question's stasis level before searching. **Hegel's** *Aufhebung* — negation that preserves what it negates — is the critique pass's preservation gate: you can't elevate without first articulating what the thesis got right. **Walter Benjamin** drew the distinction between information (explains itself on arrival) and narrative (lodges in the reader and unfolds). The reasoning loop produces information; the distillation loop transforms it into narrative. This is why the plugin has two loops, not one.

The conviction memo format descends from **Cicero** — propositio, narratio, refutatio, peroratio — because Roman juries had short attention spans and the advocate who wasted their time lost. The same constraint applies to anyone reading your analysis. **Popper** grounds the newest outcome: a refutation is a success, not a failure, so the loop scores kills attempted and survived rather than objections politely absorbed. Other mechanisms run unnamed in the operational files — rival working hypotheses in expansion, evidence weighed by what it rules out in compression, estimative verdict vocabulary in synthesis — with credit where it belongs:

[What each mechanism took from its sources →](skills/dialectic/RESOURCES.md) · [Full philosophical foundations →](PHILOSOPHICAL-FOUNDATIONS.md)

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
│   ├── FORGE.md            # Forge build spec synthesis instructions
│   └── RESOURCES.md        # Source layer — one line per mechanism
├── hooks/
│   └── hooks.json          # Stop hook config
├── scripts/
│   ├── stop-hook.sh        # Loop controller (macOS/Linux)
│   ├── stop-hook.js        # Loop controller (cross-platform)
│   ├── serialize-trace.js  # Trace serialization for holdout
│   └── export-session.py   # Session JSONL → markdown export
├── tests/                  # node --test suite (both hook impls, serializer golden tests)
└── README.md
```

## License

MIT
