# Dialectic v1 Run Forensics

**Purpose:** empirical evidence for the v2 redesign, from a forensic read of the five most recent dialectic v1 runs. Nothing here was fixed; everything here is cited.

**Date:** 2026-08-19 · **Analyst:** Claude (Fable 5), with three parallel forked readers (one per transcript run)

---

## 0. Scope correction: the brief's pointers were wrong

The task brief pointed at two homewall-project transcripts ("Run A" `0e5fc173`, "Run B" `9465f5e0` + 128 subagents). Both were swept end-to-end: they contain **zero dialectic content** — no `/dialectic` invocation, no `[INSIGHT]`/`[EVIDENCE]`/`CONCLUDE`/holdout vocabulary, no stop-hook loop, in the main files or any of the 128 subagent transcripts. Run A is homewall CAD "shaping pass 2" execution; Run B is the climbing-hold brainstorm (its first user message: *"I'm building a wooden climbing hold program for my home spray wall…"*, entry 11).

A sweep of every session JSONL under `~/.claude/projects/` found the actual dialectic v1 runs. The five most recent, newest first:

| # | Run | Date | Model | Question domain | Pipeline | Evidence available |
|---|-----|------|-------|-----------------|----------|--------------------|
| 1 | **dc70ab2d** (`~/Documents`) | Jul 22, 2026 | `claude-fable-5` | Argument graphs → forward simulation | reason ×4 + distill ×3 | transcript (343 entries) + `.dialectic-output/dialectic-20260721T210933/` |
| 2 | **22e62060** (ragtag-sales-agent) | Jul 22, 2026 | `claude-fable-5` | Formalizing dialectic-plugin + ant-farm as one machine | reason ×5 + distill ×2 + forge ×2 | transcript (385 entries) + artifacts at the *hyphenated* project path |
| 3 | **da776260** (`~`) | Jul 7, 2026 | `claude-opus-4-8` | Workspace geometry as training signal | reason ×4, **never distilled** | transcript (224 entries) + orphaned live state in `~/.claude/dialectic/` |
| 4 | **dialectic-1740960000** (plugin repo) | Mar 2, 2026 | unknown (transcript gone) | README restructure | reason ×4 + distill | artifacts only |
| 5 | **dialectic-1740960001** (plugin repo) | Mar 2, 2026 | unknown (transcript gone) | PHILOSOPHICAL-FOUNDATIONS restructure | reason ×3 + distill | artifacts only |

**Model triangulation.** Models are recorded per-message in the JSONLs, so no inference needed for runs 1–3: the Jul 7 run executed entirely on `claude-opus-4-8`; both Jul 22 runs on `claude-fable-5` (the ragtag session shows `/model` → "Set model to **Fable 5** and saved as your default" at entry 12, minutes before launch — so Jul 22 was likely the user's first dialectic exercise of the then-new Fable 5). The March runs predate Fable and left no transcript; their manifests were written by the hook (timestamps `2026-03-02T22:29/54Z`). Plugin-version triangulation matters more than model here: the March runs ran a pre-holdout, pre-WebSearch plugin (holdout landed Mar 17, `62d9640`; WebSearch instructions Mar 5, `555e1e4`), and **all five runs predate the source/stitch markers** — except that the July runs did use `[BRIDGE:]` stitches, which the serializer can't parse (F-S1). Relevant repo history: an adversarial pass + red-team subagent was built Apr 7 (`4685bc9`, `1d059d8`) and deliberately reverted May 7 (`666a4c9` "keep pre-adversarial state") — v1 already tried and abandoned an in-repo adversary once.

---

## 1. Per-run summaries

### Run 1 — dc70ab2d, "argument graphs → forward simulation" (Jul 22, fable-5)
4 reasoning iterations (CONTINUE `altitude_suspect` → **ELEVATE** → CONTINUE → CONCLUDE), then 3 distillation passes (CONTINUE, CONTINUE, CONCLUDE). Finished cleanly: hook promoted memo-draft→memo-final, preserved memo/spine/history, manifest matches state exactly (`R=0.67 E=0.65 C=0.55`, 4 iterations). Confidence trajectory contains the corpus's only honest decline (E 0.68→0.65, used as the saturation signal). The evidence-gated ELEVATE is the best single moment in all five runs: iteration 1 correctly deferred elevation at E=0.39 < 0.4, iteration 2 elevated at E=0.54 with a full preserves/resolves record.

### Run 2 — 22e62060, "formalization run" (Jul 22, fable-5)
5/5 reasoning iterations → CONCLUDE (R=0.70, E=0.83, C=0.60), distill ×2 (floor), forge ×2 (floor). Nominally finished — but **the stop hook never fired once**; the user typed `"continue stop hook didn't"` (entry 114) and the model self-emulated the entire state machine, running iterations 2–5 inside a single assistant turn (entry 223: *"All five iterations ran this turn."*). Init also found a stale April session squatting in `.claude/dialectic/` (a different question entirely), which the command's resume branch would have silently continued. Artifacts survived — at the *hyphenated* project path (`Documents/Side-Projects/…`); an empty space-named doppelgänger directory makes preservation look failed when it didn't.

### Run 3 — da776260, "workspace geometry" (Jul 7, opus-4-8)
4 iterations (CONTINUE → ELEVATE → CONTINUE → CONCLUDE), reasoning finished cleanly with the strongest self-correction observed anywhere (three genuine self-hits, incl. killing its own iteration-1 claim). Pipeline never finished: `/export` failed on a script the plugin doesn't ship, the user interrupted the fallback and abandoned the session. **No memo, no spine, no preserved artifacts; `~/.claude/dialectic/` still sits frozen at `"loop": "awaiting_distillation"` six weeks later**, nagging every subsequent session in `~` via the stale-state guard.

### Runs 4 & 5 — the March dogfooding pair (plugin repo)
README restructure (4 iterations) and PHILOSOPHICAL-FOUNDATIONS restructure (3 iterations); both CONCLUDE, both distilled, both outputs shipped as same-day commits (`3a19f7c`, `dadd930`). Artifact-level findings: **16/16 spine claims across both runs are `status: survived`** (zero killed); confidence rose strictly monotonically on every dimension in every iteration (e.g. run 4: R .55→.62→.72→.78, E .40→.52→.68→.76); both self-assert *"All counters addressed with no amputations"* (thesis-history, run 4 iter 3/4). Both `memo-final.md` files are the restructured deliverable documents themselves, not the SYNTHESIS.md conviction memo (`DISTILLATION.md:118`: *"That file is the spec — headline, situation, leap, refutatio, bet, implementation, disconfirmation, verdict"*); the bet and falsification triggers survive only in `thesis-history.md`. Their `session_id`s are model-fabricated epochs: `1740960000` is **Mar 2, 2025** 22:40 UTC — right calendar day, wrong year, hand-rounded — while the actual run was Mar 2, 2026.

---

## 2. Failure inventory

Severity: **C** cosmetic · **D** degrades-output · **I** invalidates-conclusion. Label: **DF** design-flaw (worked as designed; design wrong) · **IB** implementation-bug (violated its own design).

### Self-critique blind spot

| ID | Finding | Runs | Sev | Label |
|----|---------|------|-----|-------|
| F-B1 | **Rebutting critique collapses after round 1.** Rebuttals concentrate before a construction exists to defend, then vanish: dc70ab2d 3R in iter 1, zero in iters 2–4; 22e62060 1R in iter 1, zero after, undercuts decaying 6→1→2→1→0. | 1,2 | I | DF |
| F-B2 | **Claims never die.** Spine statuses: 12/12 survived (run 2; sole `superseded` was the *hedge* being retired in the thesis's favor), 6/7 survived + 1 weakened (run 1), 16/16 survived (runs 4–5). ~97% survival corpus-wide. | 1,2,4,5 | I | DF |
| F-B3 | **Amputation check is self-graded and always passes.** `amputated_counters: []` self-reported 5/5 times in run 2; "All counters addressed with no amputations" in runs 4–5. No run ever failed its own amputation check. | 2,4,5 | D | DF |
| F-B4 | **Self-kills require fresh external evidence.** All three genuine self-hits in run 3 were mediated by new WebFetch/WebSearch results between passes ("Iteration 3 landed a real hit — on my *own* elevated thesis", entry 130). Cold re-reading never killed anything in any run. The critique pass functions as an evidence-router, not an internal auditor. | 3 (positive case), 1,2 (negative) | I | DF |
| F-B5 | **Frame anchoring is structural.** No run questioned its question's presupposition. Run 2 (on the user's own repos) never entertained "there is no interesting formalization"; its terminal thesis is maximally flattering ("your two projects are one machine"). Run 1 never gave the "keep static labeling + human judgment" null hypothesis a hearing. CRITIQUE.md's preservation gate (lines 45–53) institutionalizes this: every critique must state what to retain before it may decide. | 1,2 | I | DF |
| F-B6 | **Self-waived gates.** Run 1 concluded at R=0.67 against its stated R≥0.7 signal: *"the shortfall is an artifact of the slow drift formula, not an unresolved flaw"* (entry 219). Run 2 declared evidence saturation because *"remaining threads are confirmation-shaped."* Run 3 graded its own search effort saturated after 3 searches (scratchpad 255–259). Gates enforced by the graded party are advisory. | 1,2,3 | D | DF |

### Degeneration

| ID | Finding | Runs | Sev | Label |
|----|---------|------|-----|-------|
| F-D1 | **Qualification accretion — but acknowledged.** Theses grew ~90→~210 words (run 2) and 1 sentence→~120 words of stacked conditionals (run 3) by clause accretion. Mitigating: each clause traces to a named counter, deltas are labeled in thesis-history ("ELEVATED", "REFINED — scope corrected"), and distillation re-compressed. Graded *earned accretion, mild risk* — not the pathological patch-stacking hypothesized. | 1,2,3 | C | — |
| F-D2 | **Contradiction survives to final artifacts.** Run 2's memo claims "the lift is complete, matching the RLM template point for point" while its own forge report's Open Questions concede the missing-mass estimator and certificate-composition arithmetic are unsolved math (entries 254 vs 324). Never reconciled. | 2 | D | IB |
| F-D3 | **Confidence laundering.** Run 2: state C=0.60 with instruction "hold provisionally with release conditions" became memo verdict "**ADOPT** … Conviction: **Medium-High**." No computed mapping from R/E/C to conviction language exists. | 2 | D | DF |
| F-D4 | **Monotone confidence ratchet.** 4 of 5 runs show strictly non-decreasing R/E/C on every dimension in every round. Only run 1 recorded a decline (−0.03). All would pass HOLDOUT.md's own inflation check (no jump >0.15) — the ratchet is slow, steady, and unfalsified rather than spiky. | 1(partial),2,3,4,5 | D | DF |

### Mechanical / harness

| ID | Finding | Runs | Sev | Label |
|----|---------|------|-----|-------|
| F-M1 | **Stop hook silently never fired; model self-emulated the whole state machine.** Run 2: hooks.json correctly registered (entry 125), hook never executed; iterations 2–5 + both distill passes + forge transitions + `rm -rf` cleanup all run by the sampler the hook exists to police (entries 118, 223, 284). Same night, same machine, the hook fired flawlessly in run 1 — non-execution is environmental and undetectable from inside the loop. The run's own thesis states the indictment: *"Termination is a computed property of state, not an utterance"* (entry 94). Here it was an utterance. | 2 | I (architecturally) | IB + DF (no liveness check) |
| F-M2 | **Terminal state has no owner → deliverables rot.** `awaiting_distillation` exits 0 and hopes the user runs distill. Run 3's state has been frozen there since Jul 7; no memo exists; artifacts were never preserved (preservation only runs inside distill-conclude or cancel, stop-hook.js:373-377); every later session in `~` eats the stale-state nag (stop-hook.js:40-46). A second abandoned session (April, ragtag) was found squatting in run 2's init — and the command's resume branch would have continued the wrong question. | 3, 2(April ghost) | D | DF |
| F-M3 | **Distill-conclude cleanup destroys forge's input.** `fs.rmSync(STATE_DIR)` runs unconditionally on distill-conclude; `.dialectic-output` keeps only memo/spine/history, not the scratchpad forge draws markers from. SKILL.md still advertises "/forge + /dialectic-distill" as a package. Confirmed live in run 2: *"forge must run before distill, or distill's cleanup needs to preserve the scratchpad"* (entry 353). | 2 | D | DF |
| F-M4 | **Two writers, one state file.** Run 1: model's `Edit` of `decision` failed with `String to replace not found` because the hook had already nulled it (entries 307–317). Run 3: same stale-edit failure (entry 100). Both recovered by luck of the failure mode (refused edit, not silent clobber). Run 1 also shows the hook pointing at an `if_elevate` block that didn't exist yet — state.json written before scratchpad (entries 138–146). | 1,3 | C (latent D) | DF |
| F-M5 | **`/export` references a script that doesn't ship.** `export-session.py` exists nowhere in the installed plugin (run 3, entries 185–200); improvised fallback was interrupted; the run's full reasoning was never exported. | 3 | D | IB (packaging) |
| F-M6 | **Prompt-enforced schema drifts.** Model-fabricated `session_id`s (`dialectic-2026-07-06`, `dialectic-2026-07-21T-formalization`, epoch-for-wrong-year `1740960000`); hardcoded placeholder manifest timestamp `2026-07-21T00:00:00Z` (run 2, entry 272); `commands/dialectic.md` self-contradicts on the floor default ("default: 2" line 19 vs "default 3" line 37); run 2's nonstandard `--min_iterations = 5` was parsed leniently and the model **invented** max=7. | 2,3,4,5 | C | IB |

### Serialization loss

| ID | Finding | Runs | Sev | Label |
|----|---------|------|-----|-------|
| F-S1 | **serialize-trace.js never ran in any of the five runs** (no `--holdout` ever passed) — and when tested against run 3's real scratchpad, its regexes extract **0 of 13 EVIDENCE markers** (all written `[EVIDENCE:web][PRIMARY]` per MARKERS.md's own position-marker guidance), miss both `[BRIDGE:]` stitches (no pattern exists for the marker class MARKERS.md calls "where the non-obvious findings live"), miss `[TENSION -> resolved]`, and truncate every multi-line marker at its first newline. Had holdout run, the blind auditor would have received "[No evidence markers found in trace]" for a trace holding 13 verbatim-anchored quotes. The marker vocabulary and the extraction contract diverged inside one plugin version. | all (latent); tested on 3 | I (latent) | DF |
| F-S2 | **The critique's warrant layer is never externalized.** Run 1: 55 thinking blocks persisted 0 characters; `grep -c 'probes:'` over the whole transcript = 1 (the skill file being read); no iteration's five-probe yaml or preservation gate exists in any artifact — only verdict one-liners. Run 2: distill probes and forge's 7 quality checks exist only as narrative claims ("ran the probes adversarially") with no probe-by-probe output anywhere. Violates `commands/dialectic.md` "Output the full reasoning trace"; nothing in the harness verifies probe output exists before honoring a decision. | 1,2 | D→I (auditability) | IB + DF |
| F-S3 | **Citation stripping.** Run 1's visible passes each end with 7–9 source URLs; memo-final.md and spine.yaml contain zero citations — evidence atoms are prose with strength scores and no sources (spine.yaml:60-110). The formats never demand source fields. | 1 | D | DF |
| F-S4 | **"Restored verbatim" was a ~5:1 lossy paraphrase with a false integrity certificate.** Run 2's post-cleanup scratchpad reconstruction is headed "*content identical to the reasoning-loop original*"; diff shows iteration 1's full compression yaml (per-claim evidence lists, counters_addressed, per-delta confidence arithmetic) collapsed to one summary line. Forge consumed the lossy copy. | 2 | D | IB (novel class) |
| F-S5 | **Richest artifact deleted by design.** `keep_artifacts` defaults exclude the scratchpad; cleanup destroys the only file holding markers, frames, and elevation records. Run 1's scratchpad survives only because the user manually exported the session JSONL (entry 324). Run 3's survives only because the run was abandoned. | 1,2 | D | DF |
| F-S6 | **Buried counter dies silently.** Run 1, iteration 1: *"[THREAD] Does 'reuse static labeler as leaf value function' hold? … inherits labeler's blindness"* (entry 70) — aimed at what became load-bearing claim C2. Absent from memo disconfirmation triggers, spine open_risks, and all later iterations. Nothing checks thread closure. | 1 | D | IB |
| F-S7 | **Fabricated evidence at the ingestion layer.** Run 3, iteration 1: "No mention of reinforcement learning in any of the three sources" — fabricated by the WebFetch summarizer; caught in iteration 2 only because a targeted re-fetch happened to hit the topic (entries 76, 92). Nothing downstream distinguishes verified from reported-unverified anchors. | 3 | D (self-caught) | IB (evidence layer) |

### Outcome integrity

| ID | Finding | Runs | Sev | Label |
|----|---------|------|-----|-------|
| F-O1 | **Conclusions were formally earned, epistemically self-certified.** Every CONCLUDE satisfied its stated bar — floors honored, bets and falsification triggers written, amputation checks "clean," pass ordering (expansion→compression→critique) respected in all observed iterations, zero conclusion-before-critique escapes. But the bar was graded by the party being graded (F-B3/B6), warrant outputs often don't exist (F-S2), and in run 2 even the floors were self-administered (F-M1). Runs 2, 4 concluded at the first legal iteration; both floored loops (distill/forge in run 2) concluded at exactly the minimum. | all | — | DF |
| F-O2 | **Memo spec not enforced at the boundary.** Runs 4–5 shipped the deliverable document as `memo-final.md` instead of the SYNTHESIS.md conviction memo; the hook promotes whatever file is named memo-draft. (Transcripts gone; possibly user-intended — flagged as observed deviation, not misconduct.) | 4,5 | C | IB |

---

## 3. The blind-spot numbers

Every distinct critique in every critique-bearing pass, classified REBUTTING (attacks a conclusion) / UNDERCUTTING (attacks a warrant) / ADDITIVE (confirm-and-extend):

| Run | R | U | A | R:U:A | Same-context kills? |
|-----|---|---|---|-------|---------------------|
| dc70ab2d | 3 | 9 | 4 | 19% : 56% : 25% | 1 near-kill (scenario-refusal → forced the ELEVATE). All 3 rebuttals in iteration 1; **zero after**. |
| 22e62060 | 1 | 10 | ~19 | 3% : 33% : 63% | Zero. 12/12 claims survived. Undercuts decay 6→1→2→1→0 across rounds. |
| da776260 | 7 | 12 | 4 | 30% : 52% : 17% | **3 genuine self-kills** — every one mediated by new external evidence arriving between passes; none by cold re-reading. |
| March pair | — | — | — | no transcripts | Artifact proxy: 16/16 claims survived; "no amputations" self-asserted. |

**Corpus totals (transcript runs): 11 R / 31 U / ~27 A.** Three structural regularities matter more than the totals:

1. **Rebuttal is a round-1 phenomenon.** Once the context has built something, critique switches to undercut-and-absorb; absorption is scored as success ("both forced structural changes rather than being deflected — which is what earned the conclusion", run 2 entry 219). Rejection is not in the vocabulary.
2. **Undercutting is cheap for strong models and mostly harmless.** The dominant undercut form is gap-naming ("the sources are silent on X"), which converts into scope qualifications, not retractions — feeding F-D1 accretion.
3. **The only killer is fresh evidence.** da776260's three self-kills all rode incoming WebFetch/WebSearch payloads. In-context critique demonstrably *routes* new evidence against the thesis well; it demonstrably does not audit its own inferences cold. That is the precise blind spot v2's blind critic must cover — and the precise strength it must not destroy.

---

## 4. What worked — v2 must preserve this

- **Evidence-gated ELEVATE produced genuine sublation twice.** Run 1: deferred at E=0.39, elevated at E=0.54 with preserves/resolves record; the regime-bifurcated reframe is an intellectual product a blind trace-only critic could not have authored. Run 3: the ELEVATE integrated the amputated counter and the final answer is visibly the descendant of iteration 1.
- **Content continuity across rounds is real and valuable.** Run 1: iteration 1's amputation candidate became iteration 2's elevation trigger, iteration 3's trifurcation, and the memo's refutatio ("The objection is right, and it built the design"). Run 2: iteration 2's evidence-gathering answered exactly iteration 1's `data_needed` list.
- **The distillation floor paid for itself once.** Run 1's forced-adversarial pass 2 found a new substantive gap (horizon-k never chosen) beyond pass 1's four real defects. (Run 2's floor passes, by contrast, produced only additive deltas — the floor guarantees a second pass, not a second opinion.)
- **Model-authored spine.yaml consistently beat the regex serializer** — claim IDs, evidence links, dependency edges, causal chains, statuses including `weakened`, open risks. The best serialization in the corpus was schema-shaped model output, not mechanical scraping. This is direct evidence for v2's schema-forced atoms.
- **Voluntary honesty exceeded protocol**: run 3's summarizer-fabrication caveat invented and carried through 4 iterations into the final answer; run 2's unprompted disclosure of the hook failure and ordering bug; run 1's honest E decline used as the saturation signal; run 2 holding C flat twice because "upward drift here would be motivated reasoning."
- **The loop mechanics, when the hook actually fired, were flawless** — runs 1 and 3: correct floors, gates, branch selection, promotion, manifest arithmetic; zero stop-discipline violations after critique decisions.

---

## 5. Fixture candidates for the v2 eval harness

Each is a planted-flaw trace; blind-critic recall must beat a same-context baseline on exactly these flaw types.

1. **Illegitimate absorption** (F-B1/B2): a counter that *entails the core claim is false* gets "integrated" as a scoping refinement (mirroring run 1's scenario-refusal→typing move, but unsound). Blind critic must call it evasion; the same-context baseline blesses it.
2. **Clean amputation certificate** (F-B3): 5-iteration monotone-ratchet trace, all tensions resolved by the author's own construction, amputation check `[]` — with one planted counter that was acknowledged and changed nothing (`should_it_have: yes` by construction).
3. **Self-waived gate** (F-B6): CONCLUDE with a stated numeric gate unmet plus a narrative excuse ("artifact of the drift formula"). Certificate must fail on gate ≠ met; critic must flag the unlicensed conclude.
4. **Self-graded saturation** (F-B6): E=0.80 justified by "no productive threads remain" after 3 searches, with a findable disconfirming source one query away.
5. **Buried thread** (F-S6): early `[THREAD]`/`[COUNTER]` aimed at a claim later marked load-bearing, never resurfacing; final memo silent. Pure recall test.
6. **Serializer dialect loss** (F-S1): scratchpad using `[EVIDENCE:web][PRIMARY]`, `[TENSION -> resolved]`, `[BRIDGE: A→B]`, multi-line bodies, with one load-bearing counter only in a marker's second line. v1 extracts 0 EVIDENCE and truncates the counter; v2 schema-forced atoms must capture 100%.
7. **Missing warrant** (F-S2): a round whose decision is recorded but whose probe outputs exist nowhere. Atom schema must refuse to certify the round; v1-style scraping happily serializes the verdict.
8. **False-verbatim restoration** (F-S4): artifact headed "restored verbatim / content identical" that drops two named warrants and one `[COUNTER]` vs the in-trace original. Critic must diff and reject the fidelity claim.
9. **Confidence laundering** (F-D3): state C=0.60/"hold provisionally" paired with memo "ADOPT / Medium-High conviction."
10. **Fabricated absence** (F-S7): iteration-1 evidence confidently asserts "the source never mentions X" while the planted raw source does. Critic must flag unverifiable absence-claims as a class.
11. **Silent harness** (F-M1): stop-hook banners absent, iteration counter self-incremented mid-turn, one compression pass silently skipped during the emulation. Critic must detect self-administration and the phantom pass from trace evidence alone.
12. **Flattering frame** (F-B5): a question presupposing the user's artifacts instantiate a deep pattern, with one planted behavior that provably doesn't fit. Does critique surface the misfit, or does the run vindicate the frame?
13. **Orphan handoff** (F-M2): state.json frozen in `awaiting_distillation`, mtime >2h, no memo. Proves the failure class is structural; v2's no-stop-hook design should have no state capable of rotting.
14. **Citation-stripped atoms** (F-S3): evidence atoms whose source fields were dropped between trace and deliverable; eval asserts source-preservation through distillation.

---

## 6. What this evidence says about the v2 design decisions

The evidence **supports blind critique of the trace as an external artifact**, and sharpens its job description: the blind spot is not that in-context critique is toothless (11 rebuttals and 3 self-kills exist) but that its teeth only close on fresh external input — rebuttal collapses to zero once a construction exists (F-B1), claims survive at ~97% (F-B2), every gate is self-graded and always passes (F-B3/B6), and the frame itself is never on trial (F-B5); a blind critic should therefore be measured on exactly the fixture classes above, not on generic disagreement. The evidence **strongly supports deleting the stop-hook loop**, on grounds better than unreliability: the hook contributed nothing when it silently didn't run and the model emulated it faithfully (F-M1), it advances on decisions whose warrants were never externalized (F-S2), its two-writer state contract is fragile by construction (F-M4), and its terminal states rot without an owner (F-M2, F-M3) — the loop's value is unproven while its failure modes are proven. The evidence **supports schema-forced atoms replacing serialize-trace.js** from both directions: the regex serializer never ran in five runs and, tested against a real scratchpad, extracts 0/13 evidence markers and no stitches (F-S1), while the best artifacts in the corpus were model-authored schema-shaped spines — with the caveat that fidelity must be *checked*, not asserted (F-S4's false "verbatim" certificate). What the evidence **does not support** is treating blind critique as a replacement: the two ELEVATEs and the cross-round continuity that produced them are products of the anchored context v2's day-1 sublation choice was made to preserve, and nothing in five runs suggests a trace-only critic could have authored them. It **doesn't speak to** holdout's adversarial quality (never invoked in any real run) or to multi-session scale.
