# v1 Hardening + Skill Sharpening — Design Spec

**Date:** 2026-08-19 · **Status:** approved in-chat (this doc is the record)
**Evidence base:** `docs/2026-08-19-dialectic-v1-forensics.md` — every change below carries the failure ID it discharges.

## Goals

1. Fix the mechanical failure modes the v1 forensics proved, keeping the stop-hook architecture (this is v1 hardening; v2 remains a separate effort).
2. Add a first-class rejection path so critique can kill a thesis or claim — the deepest fix for the ~97% claim-survival / zero-rebuttal-after-round-1 findings.
3. Sharpen the core skill files: audit the traditions already cited, scout new ones, and add operational probes where the forensics found priming gaps — without dulling the voice.

## Non-goals

- No v2 architecture: the stop-hook loop stays; no blind-critique pass; no schema-forced-atom replacement of the serializer (it gets *fixed*, not replaced).
- No holdout redesign (never exercised in a real run; insufficient evidence to redesign against).
- No changes to FORGE.md's check content or PATTERNS.md beyond citation hygiene.

## North star (from Austin, verbatim intent)

**The labels and guidance exist to aid reasoning, not obscure it.** Review big-picture: markers, probes, and cited traditions are scaffolding for clearer thinking. Any element that primes ritual performance instead of reasoning gets cut — regardless of pedigree. Not all SOTA is productive; great historical texts are as eligible as recent methods literature. Vibe and fit are real acceptance criteria: pulling in too much, or the wrong feel, shifts reasoning legibility, clarity, and freshness.

---

## Phase 1 — Mechanical hardening

### 1.1 Rejection path (F-B1, F-B2)

- New decision value `reject`, legal from iteration 1. Floors prevent premature *conclusion*; premature *death* is the point of a kill verb. The warrant gate (1.2) is what keeps it from becoming a lazy exit.
- CRITIQUE.md output schema gains `if_reject`: `refuting_basis` (which claims/evidence the refutation rests on — required) and optional `counter_thesis`.
- Hook semantics (mirrors holdout-FRACTURED machinery): if `counter_thesis` present and `reject_passes` < 1 → re-enter reasoning with the counter-thesis (one re-loop max, `reject_passes` incremented, `iteration` reset to 0, `phase` to expansion). Otherwise → `awaiting_distillation` with `thesis.status: "refuted"`.
- DISTILLATION.md gains a negative-verdict memo variant: a refutation memo is still a conviction memo — "X is wrong because Z; what would resurrect it."
- Spine schema gains claim status `killed`; distillation rules require killed claims to appear in the memo's refutatio with what killed them. Claims that die stay visibly dead.

### 1.2 Warrant-existence gate (F-S2)

- Reasoning loop: before honoring any critique decision, the hook verifies the scratchpad contains ≥ `iteration` occurrences of `probes:` blocks. If not → block: "emit your probe yaml to the scratchpad first."
- Distillation loop: same check for per-pass probe-results blocks.
- Implementation in both stop-hook.sh and stop-hook.js (parity required).

### 1.3 Preservation defaults (F-M3, F-S5)

- `keep_artifacts` default: add `scratchpad`, `state`, `prompt`.
- Distill-conclude copies artifacts **before** `rmSync`.
- Forge falls back to reading the newest `.dialectic-output/<session>/` when `.claude/dialectic/` is gone — dissolves the forge-after-distill ordering bug instead of re-ordering around it.

### 1.4 Orphan rot (F-M2)

- On transition to `awaiting_distillation`, hook checkpoints scratchpad/thesis-history/prompt/state into the session's output dir immediately.
- Stale-state guard acts instead of nagging: archive the state dir to `.dialectic-output/abandoned-<ts>/`, remove it, print where it went. Archives everything; deletes nothing unpreserved.

### 1.5 Serializer dialect (F-S1)

- `serialize-trace.js` regexes learn the vocabulary MARKERS.md teaches: suffix tags (`[EVIDENCE:web]`), trailing position markers (`[PRIMARY]` etc.), state annotations (`[TENSION -> resolved]`), all four stitch markers (`[BRIDGE: A→B]`, `[RESOLVES: A↔B]`, `[CONTRADICTS: A]`, `[QUALIFIES: A]`) with endpoints captured, and multi-line bodies (capture to blank line or next marker).
- Stitch markers appear in `trace_summary.md` output as their own inventory section.
- **Golden-file test:** the real orphaned scratchpad from run da776260 (archived per 1.4 from `~/.claude/dialectic/`). Current code scores 0/13 EVIDENCE on it; fixed code must score 13/13 plus both bridges.

### 1.6 Contract hygiene (F-M4, F-M6, F-M1)

- Ownership table for state.json fields, documented in commands/dialectic.md and as a comment block in both hooks: hook owns `iteration`, `loop`, `phase`-on-transition, decision-nulling, `*_iteration` counters, `last_hook_ts`; model owns the rest.
- Prose: re-read state before writing; update single fields via jq/python; never string-Edit state.json.
- Session IDs stamped mechanically: `date +%Y%m%dT%H%M%S` via Bash at init, format `dialectic-YYYYMMDDTHHMMSS`. Hook normalizes malformed IDs.
- Hook writes `last_hook_ts` on every firing. Anti-emulation clause in commands/dialectic.md: if no hook banner follows a decision, report that the hook didn't fire and **stop** — never self-administer the loop.
- Fix floor-default contradiction in commands/dialectic.md (settle on 3).

### 1.7 Packaging (F-M5, F-O2)

- Ship `scripts/export-session.py`: JSONL → markdown session extractor the export skill already references.
- Promotion check: before promoting memo-draft → memo-final, hook greps for SYNTHESIS-required section headings; blocks naming the missing section.

### Phase 1 testing

- Node unit tests per hook branch: reject × counter-thesis × re-loop count, warrant gate, preservation ordering, stale-archive, promotion check. Parity run against stop-hook.sh.
- Serializer golden test (1.5).
- One end-to-end smoke run of `/dialectic` on a toy question to watch the new banners fire.

---

## Phase 2 — Skill-file sharpening (curation + scouting)

One whole-corpus editorial pass over the core files (MARKERS.md, EXPANSION.md, COMPRESSION.md, CRITIQUE.md, DISTILLATION.md, SYNTHESIS.md; HOLDOUT/FORGE citation hygiene only). Not per-file patches — voice is a whole-document property.

### 2.1 Symmetric evaluation

- **Audit incumbents:** every currently cited tradition gets an explicit keep / cut / demote-to-bibliography verdict with a one-line reason. The test: does it still convert to an operational probe that changed behavior in the forensic record, or is it decoration?
- **Scout additions:** candidate pool spans all of intellectual history — no recency bias in either direction. Candidates are admitted only if they discharge a named forensic failure. Known gaps needing patrons:
  - Rejection-as-success (grounds 1.1; the vocabulary currently has no kill verb) — candidates: Popper's falsificationism; the sophistic/eristic tradition of destructive testing.
  - Frame plurality vs. anchoring (F-B5) — candidates: Chamberlin's multiple working hypotheses; ACH; Mill's "he who knows only his own side."
  - Research epistemics: absence claims, provenance, citation carriage (F-S7, F-S3) — candidates: historians' source criticism (external/internal criticism); Peirce on the fixation of belief.
  - Confidence-to-language calibration (F-D3, F-D4) — candidates: Tetlock; Keynes on weight of evidence.
  - These candidate lists are starting points, not verdicts — scouting is part of the work.
- **Budget discipline:** additions are paired with cuts. The corpus should not grow net-large; if a new tradition earns a probe, something that stopped earning its place funds it.

### 2.2 De-ritualization pass (north star applied)

- Rewrite self-graded rubrics (amputation check, saturation call, "adversarial" pass instructions) to require quoted evidence and produce inspectable output — the prose side of the 1.2 gate.
- Research-epistemics section in EXPANSION.md: absence claims require targeted verification; citations ride into markers; provenance tags get consumed by COMPRESSION.md rules (they currently exist in MARKERS.md but nothing downstream uses them).
- Confidence language: a short mapping from R/E/C bands to permitted verdict vocabulary (fixes confidence laundering at the prose layer).
- Cut any marker, probe, or instruction that the forensic record shows produced ritual rather than reasoning.

### 2.3 Resource layer

- Single `skills/dialectic/RESOURCES.md` (default; switch to per-file end-notes only if the pass shows the single file reads worse): the great texts behind each mechanism, annotated in one line each with *what the mechanism took from it*. Bibliography is where demoted incumbents land.

### Phase 2 validation

- `dialectic:prose-reviewer` agent pass over every touched file (register + model-interpretive precision).
- Planted-flaw dry runs using forensics fixtures #5 (buried thread), #6 (serializer dialect — doubles as 1.5 test), #10 (fabricated absence): the sharpened prose must move behavior on at least the prose-addressable fixtures.

---

## Sequencing

Phase 1 before Phase 2 — prose must never teach a verb the hook doesn't parse yet (that's how F-S1 happened). Within Phase 1: 1.1 + 1.2 together (the gate makes the kill verb safe), then the rest in any order.

## Traceability

| Change | Discharges |
|---|---|
| 1.1 rejection path | F-B1, F-B2 |
| 1.2 warrant gate | F-S2 |
| 1.3 preservation defaults | F-M3, F-S5 |
| 1.4 orphan handling | F-M2 |
| 1.5 serializer dialect | F-S1 |
| 1.6 contract hygiene | F-M4, F-M6, F-M1 |
| 1.7 packaging | F-M5, F-O2 |
| 2.1 curation/scouting | F-B5 + north star |
| 2.2 de-ritualization | F-B3, F-B6, F-S7, F-S3, F-D3, F-D4 |
| 2.3 resource layer | user request (inspo/resources) |

Deliberately not addressed (v2 territory): F-B4 (external-evidence dependency of self-kills), F-O1's self-certification in full, blind critique, atom schemas.
