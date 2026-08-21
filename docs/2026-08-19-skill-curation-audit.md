# Skill Curation Audit — Incumbent Verdicts + Scouting Shortlist

**Date:** 2026-08-19 · **Task:** 11 (spec 2.1) · **Status:** awaiting owner review — nothing here is implemented until approved
**Evidence base:** `docs/2026-08-19-dialectic-v1-forensics.md` (cited as F-xx) and the post-Phase-1 skill file text (line numbers current as of `ad43bc5`).

**The test applied throughout** (owner's words, symmetric for incumbents and candidates): *does the label convert to an operational probe that demonstrably shapes behavior, or is it erudition?* Incumbents get no tenure; candidates get no novelty bonus; great historical texts are as eligible as recent methods literature. Vibe and fit are real acceptance criteria — every admitted candidate below is drafted in house register so the fit can be judged on the page, not imagined.

---

## 1. Census

Every named thinker, tradition, or method cited in the corpus (MARKERS, EXPANSION, COMPRESSION, CRITIQUE, DISTILLATION, SYNTHESIS, HOLDOUT, FORGE, ESCAPE-HATCH, PATTERNS + PHILOSOPHICAL-FOUNDATIONS). "PF" = `PHILOSOPHICAL-FOUNDATIONS.md` (repo root).

| # | Name / tradition | Citations (file:line) | Operational surface |
|---|---|---|---|
| 1 | **Hegel** — Aufhebung/sublation, elevation, amputation, Bad Infinity | PF:11, PF:21–29, PF:101, PF:103; Bad Infinity (unattributed) SYNTHESIS.md:9–16; Elevation Test + amputation (unattributed) CRITIQUE.md:55–72; Tension probe DISTILLATION.md:60 | ELEVATE decision, Preservation Gate, amputation check, Tension probe, anti-hedge table |
| 2 | **Brandom** — *A Spirit of Trust* | PF:29, PF:93 | none — "for contemporary reading" |
| 3 | **Fisher** — sufficient statistic | PF:12, PF:35, PF:43, PF:99 | Sufficiency probe DISTILLATION.md:61 |
| 4 | **Aristotle** — enthymeme, *Rhetoric* | PF:12, PF:37, PF:43, PF:91 | Headline-as-enthymeme test SYNTHESIS.md:30 |
| 5 | **Polanyi** — tacit knowledge | PF:43, PF:113 | none — aside in Fisher section |
| 6 | **Pitman–Koopman–Darmois** — finite sufficient statistics | PF:39 | dignifies the Escape Hatch; the trigger itself is numeric (ESCAPE-HATCH.md:7–10) |
| 7 | **Kolmogorov** — complexity / shortest description | PF:13, PF:51, PF:57, PF:59, PF:105 | sentence-removal test (Compression Gate q3, DISTILLATION.md:71) |
| 8 | **Rissanen** — Minimum Description Length | PF:59, PF:115 | none — restates Kolmogorov |
| 9 | **Tufte** — data-ink ratio | PF:13, PF:53, PF:59, PF:117 | Conviction-Ink probe DISTILLATION.md:62, SYNTHESIS.md:126,137 |
| 10 | **Orwell** — compression axioms | PF:13, PF:55, PF:59, PF:111 | absorbed into Conviction-Ink guidance |
| 11 | **Eilenberg & Mac Lane** — category theory, functors | PF:14, PF:63–71, PF:95, PF:107 | Trace probe DISTILLATION.md:60 (bidirectional check) |
| 12 | **Miller** — 7±2, chunking | PF:15, PF:77, PF:83, PF:85, PF:109 | Threads probe (≤3 threads) DISTILLATION.md:63 |
| 13 | **Ericsson & Kintsch** — long-term working memory | PF:15, PF:79, PF:85, PF:97 | none — elaborates Miller |
| 14 | **Pollock** — rebutting vs undercutting defeaters | HOLDOUT.md:80–88, 182–187; downstream FORGE.md:74 | Defeater Classification pass; the forensics' own R/U/A taxonomy (forensics §3) |
| 15 | **Christensen** — disruption pattern | PATTERNS.md:72–99 | detection signals + critique implications, full operational block |
| 16 | **Classical dispositio** — propositio, narratio, refutatio (Cicero/Quintilian arrangement, unattributed) | SYNTHESIS.md:30, 36, 46, 91, 138; DISTILLATION.md:28, 47, 127, 205 | the memo's section architecture; refutatio carries the killed-claim rule (DISTILLATION.md:47) |
| 17 | **Adversarial steelman** — modern rationalist coinage, unattributed | HOLDOUT.md:60, 172 | Pass 2 counter-generation requirements |
| 18 | **Master–slave dialectic** | PF:29 (inside Hegel's source note) | none — flourish inside a citation |

**Methods present without a patron** (relevant to §3): the position/incentive markers `[PRIMARY]/[DOWNSTREAM]/[ALIGNED]/[OPPOSING]` (MARKERS.md:37–76) are historians' external source criticism, implemented unnamed and working — the census confirms the corpus can run a tradition without reciting it. WTM/WTA taxonomy (PATTERNS.md:9–68) is folk strategy vocabulary; no attribution needed or wanted.

---

## 2. Incumbent verdicts

**keep** = stays as a named citation powering an operational element. **demote** = the probe/rule survives; the name moves to the resource layer (spec 2.3 `RESOURCES.md`) with a one-line annotation of what the mechanism took from it. **cut** = removed entirely.

| Incumbent | Verdict | Reason (one line) |
|---|---|---|
| Hegel (sublation, ELEVATE, Bad Infinity) | **KEEP** | The only tradition with forensic proof of shaping behavior: two genuine evidence-gated ELEVATEs (forensics §4) — but note it is also the tradition whose one-sidedness the forensics indict (F-B2, F-B5: everything preserves, nothing dies); the corrective is the Phase-1 REJECT path plus §3's admissions, not cutting Hegel. Trim the master–slave flourish from the source note (PF:29) — decoration inside a citation. |
| Classical dispositio (refutatio et al.) | **KEEP** | Operational section architecture the killed-claim rule now hangs on (DISTILLATION.md:47); the Promotion Formatting table (DISTILLATION.md:198–211) already translates the jargon out at the reader boundary — the register works internally and disappears externally, exactly right. |
| Aristotle (enthymeme) | **KEEP** | Converts to a real test — "the conclusion with enough argument to reconstruct the rest" (SYNTHESIS.md:30) — and to the compression principle of trusting reader expertise; not replaceable by a blander word. |
| Fisher (sufficient statistic) | **KEEP** | "Sufficient for the decision, not the analysis" is the Sufficiency probe's actual content (DISTILLATION.md:61); the memo-as-statistic frame does daily work. |
| Tufte (data-ink → Conviction-Ink) | **KEEP** | The probe is named after it and runs in both distillation files; the adversarial pass-2 variant ("find the weakest sentence," SYNTHESIS.md:137) is inspectable, not vibes. |
| Pollock (defeater classification) | **KEEP** | The rebutting/undercutting distinction is load-bearing enough that the forensic audit itself adopted it to diagnose F-B1 (forensics §3); holdout never ran in a real session, but the vocabulary demonstrably aids analysis of these very runs. |
| Christensen (disruption) | **KEEP** | Full operational block — detection signals, exemplars, critique implications (PATTERNS.md:72–99); PATTERNS.md is a non-goal beyond citation hygiene, and its hygiene is already clean. |
| Adversarial steelman | **KEEP** (unattributed) | Operational (generate 1–2 *stronger* counters, HOLDOUT.md:68–71); attaching a name would be the erudition, not the omission. |
| Miller (≤3 threads) | **DEMOTE** | The Threads probe keeps its cap and stays; the 7±2-to-chess-grandmaster narration (PF:77–83) is a warrant the resource layer can hold in one line — no run's behavior turned on the name. |
| Kolmogorov | **DEMOTE** | The sentence-removal test survives verbatim in DISTILLATION.md:71; four names currently underwrite one cut-words test (Kolmogorov, Rissanen, Tufte, Orwell) — Tufte keeps the probe, Kolmogorov keeps a bibliography line. |
| Orwell | **DEMOTE** | "If it is possible to cut a word out, cut it out" is already absorbed into Conviction-Ink's failure modes (DISTILLATION.md:62); a great text earning a resource-layer line, not a second probe. |
| Eilenberg & Mac Lane | **DEMOTE** | The Trace probe's bidirectional check is fully stated without functors (DISTILLATION.md:60); "compress the nodes, not the edges" survives as the annotation — the category-theory apparatus is the corpus's clearest case of pedigree outrunning use. |
| Pitman–Koopman–Darmois | **DEMOTE** | True and elegant — some analyses provably don't compress — but the Escape Hatch triggers on iteration count and confidence (ESCAPE-HATCH.md:7–10), not on exponential families; one resource-layer line dignifies the hatch without pretending it computes. |
| Ericsson & Kintsch | **CUT** | Elaborates Miller's mechanism without adding a test; folds into Miller's resource line at zero loss. |
| Brandom | **CUT** | "For contemporary analytic-pragmatist reading" (PF:29) — a reading recommendation, not a constraint; pure erudition. |
| Polanyi | **CUT** | One aside inside the Fisher section (PF:43); nothing downstream consumes "tacit knowledge is partially incompressible." |
| Rissanen (MDL) | **CUT** | Says what Kolmogorov's line already says, one paragraph later (PF:59); duplicate patron for a kept test. |

**Score: 8 keep · 5 demote · 4 cut.** Structural note: every demotion and cut lands in PHILOSOPHICAL-FOUNDATIONS.md, and every keep in the operational files survives — which confirms the corpus's instinct was right at the surface (operational files cite lean) and heavy only in the foundations doc. The verdict on PF itself: it is already the resource layer, at 3× the right weight. Spec 2.3's `RESOURCES.md` is PF compressed to one annotated line per kept/demoted source (~45 lines replacing 117), and the demotions above are its table of contents.

---

## 3. Scouting per gap

Format per candidate: the **actual ≤3 lines of house-register prose** its probe/rule would become, then the verdict. Register calibrated to CRITIQUE.md's probe tables: operational, imperative, no throat-clearing. Drafts for gaps discharged by Tasks 12–13 are written to slot into those briefs, not duplicate them.

### Gap A — Rejection-as-success (F-B1, F-B2)

Phase 1 built the mechanics (REJECT decision, `if_reject`, killed claims, refutation memos). What prose still lacks: nothing makes a *kill attempt* a per-round obligation, so rebuttal can keep collapsing after round 1 (F-B1) while the new verb sits unused. The forensic constraint on any fix: cold re-reading never killed anything; all three real self-kills rode fresh external evidence (F-B4). A working probe must route *search*, not demand rhetoric.

**Popper — falsificationism (*Conjectures and Refutations*, 1963).** Draft, as a sixth row in CRITIQUE.md's meta-probe table plus one rule:

> | Survival | What observation would have killed this thesis this round — and did you go look for it? | Unfalsifiable drift |
>
> R rises only in a round where a kill was attempted and failed. No attempt, no credit.

**Verdict: ADMIT.** Converts cleanly, aims the probe at the one mechanism the forensics proved can kill (targeted evidence, F-B4), and its rule is the prose-layer fix for the monotone ratchet (F-D4) at no extra cost. This is also Task 13 Step 2's "audit-approved tradition behind REJECT": the one-paragraph grounding should be Popperian — a refuted thesis is a finished piece of reasoning, which CRITIQUE.md:140 already asserts and Popper warrants.

**Lakatos — progressive vs degenerating problem-shifts (*Proofs and Refutations*; *Methodology of Scientific Research Programmes*).** Draft, as the rewrite of the amputation check (Task 13 Step 1 rewrites it anyway):

> When a counter changes the thesis, classify the change: progressive (the new thesis forbids something the old one allowed — quote the forbidden thing) or degenerating (it only excuses the counter).
> Two degenerating changes in a row mean the thesis is dying: REJECT or ELEVATE, never CONCLUDE.

**Verdict: ADMIT** — as the rule inside the de-ritualized amputation check, name credited in RESOURCES.md rather than inline. This is the precise diagnostic for the corpus's dominant failure: undercut-and-absorb scored as success (forensics §3.1, fixture #1). It gives "absorption" a pass/fail test where the current check has a self-graded empty list (F-B3).

**Eristic / dissoi logoi — the sophistic tradition of destructive two-sided testing.** Draft, for honest comparison:

> Before deciding, write the strongest paragraph asserting the thesis is false — false, not narrower. If that paragraph cites live evidence, CONCLUDE is off the table this round.

**Verdict: DECLINE.** The forensics predict this drafts as theater: cold rhetorical opposition produced zero kills in five runs (F-B4); a mandatory contra-paragraph is exactly the "adversarial pass" ritual the north star says to cut. Popper's probe gets the same pressure onto a path that demonstrably works.

### Gap B — Frame plurality vs. anchoring (F-B5)

No run ever put its question's presupposition on trial. The preservation gate institutionalizes single-frame loyalty (F-B5 cites CRITIQUE.md's gate directly). Fix belongs at expansion, before a construction exists to defend.

**Chamberlin — "The Method of Multiple Working Hypotheses" (1890).** Draft, for EXPANSION.md Phase 1:

> Before searching, write three working hypotheses: two that answer the question and one that denies its premise ("there is no X here"; "keep the status quo").
> Every search serves all three until one dies by evidence, not by neglect. A frame that was never rivaled was never tested.

**Verdict: ADMIT.** Oldest candidate in the pool and the best fit: the null-frame requirement is exactly what run 2's flattering frame ("your two projects are one machine") and run 1's unheard null hypothesis needed (F-B5, fixture #12). Cheap to run — three lines of yaml in the frame block, no new pass.

**ACH — Heuer, *Analysis of Competing Hypotheses* (1999).** Draft of the one move worth taking, for COMPRESSION.md:

> Weigh evidence by what it rules out. A finding consistent with every live hypothesis moves no confidence, however strong it sounds.

**Verdict: ADMIT the diagnosticity rule; DECLINE the matrix.** The full hypothesis-evidence grid re-run per iteration is heavyweight ritual with high recital risk — precisely "too much SOTA." The single rule above is the anti-confirmation payload (it also blunts F-D4's redundant-evidence ratchet) and rides Chamberlin's hypotheses for free.

**Mill — *On Liberty* ch. 2 ("he who knows only his own side of the case knows little of that").** Draft, for honest comparison:

> Assign the refutatio's author the job of winning, not the job of being answered.

**Verdict: DECLINE.** The corpus already holds this test in sharper form: "would a smart opponent feel their best argument was represented?" (SYNTHESIS.md:50). Mill grounds it; Mill goes to RESOURCES.md as the annotation on that line, not into the file.

**Platt — "Strong Inference" (1964).** Draft, for honest comparison:

> Devise the observation that excludes one live hypothesis; fetch it next. A search that cannot exclude anything is confirmation shopping.

**Verdict: DECLINE** as a separate admission — Platt is Chamberlin composed with Popper, both already admitted; a third citation for the same move is the pulling-in-too-much failure. One RESOURCES.md line as the bridge text.

### Gap C — Research epistemics: absence claims, provenance, citation carriage (F-S7, F-S3)

Task 12 Steps 1–2 already mandate the mechanics regardless of audit outcome; the question here is which tradition, if any, patronizes the prose. Note from the census: MARKERS.md already runs external source criticism unnamed and well.

**Historians' source criticism — the argument-from-silence discipline (Langlois & Seignobos; the *ex silentio* test).** Draft, for EXPANSION.md's reading section (this is the Task 12 Step 1 prose):

> Never write "the source doesn't mention X" from a summary or a skim — a summarizer's silence is testimony about the summary, not the source.
> An absence claim requires a targeted fetch that searched for X and missed; until then it is a [QUESTION], not [EVIDENCE].
> Silence counts as evidence only when the source had reason to speak.

**Verdict: ADMIT** — unnamed in the file, credited in RESOURCES.md, matching how MARKERS.md already carries this tradition. Discharges F-S7 (fabricated absence, fixture #10); the third line is the historians' actual test and earns its place by giving the model a decidable criterion.

**Citation carriage** (F-S3) — evaluated for a patron and none is needed. Draft, for MARKERS.md's compression rules (Task 12 Step 2 consumes it):

> A claim inherits its source or loses standing: [EVIDENCE:web] without its URL compresses at strength ≤ 2, and compression copies the source forward with the claim.

**Verdict: rule ADMITTED, patron DECLINED.** This is plumbing; naming Lachmann or stemmatics over a URL-copying rule would be the purest erudition in the whole exercise.

**Peirce — "The Fixation of Belief" (1877).** Draft, for honest comparison:

> Name how each load-bearing belief is held: by evidence, by authority, or by preference for the tidy answer. Beliefs held by tenacity get re-derived or dropped.

**Verdict: DECLINE.** Diagnoses motive, not method — the R-gate and the Survival probe already force re-derivation, and the four named methods beg to be recited rather than executed. High recital risk, no new decidable test. Stays open for v2 only if the blind critic wants a motive taxonomy.

### Gap D — Confidence-to-language calibration (F-D3, F-D4)

Task 13 Step 3 will implement the mapping; the scouting question is what shape it takes and under whose warrant. Finding: the spec's two priors both lose to an older text.

**Sherman Kent — "Words of Estimative Probability" (1964).** Draft, for SYNTHESIS.md beside the Verdict Table (bands per Task 13 Step 3):

> Verdict vocabulary is bounded by the state file. Composite < 0.5 → "hold provisionally" language only; 0.5–0.7 → "medium conviction," no ADOPT without release conditions; > 0.7 → conviction verdicts permitted.
> If the felt conviction disagrees with the numbers, the memo says so — it may not outrank them.

**Verdict: ADMIT.** Kent's estimative-probability table — fixed bands, fixed words, deviation forbidden — is the exact genre of artifact F-D3 lacked ("no computed mapping from R/E/C to conviction language exists"). It is also period-perfect for the house's intelligence-memo register. One RESOURCES.md line credits it.

**Tetlock — *Superforecasting* / *Expert Political Judgment*.** Draft of the only rule it would yield here:

> Record each iteration's confidence as a forecast and score it against the outcome.

**Verdict: DECLINE.** Tetlock's machinery is track-record accountability, and no ground truth arrives inside a single run — there is nothing for a Brier score to bite. The granular-language half of his program is Kent's table, admitted above. (Becomes live again if the ant-farm/v2 eval harness ever scores runs against outcomes.)

**Keynes — *A Treatise on Probability* ch. 6, weight of evidence.** Draft, for honest comparison:

> E measures weight, not balance: how much relevant evidence you hold, not which way it points. New contrary evidence raises E while it lowers R.

**Verdict: DECLINE for v1 — and flag the real finding.** Scouting Keynes exposed that COMPRESSION.md:92 conflates weight with balance: `Contradicting evidence found → E = E − 0.15` *lowers* saturation upon learning more, which under Keynes is backwards. But the forensic record shows the current semantics working (run 1's honest E decline was the corpus's best saturation signal), and repairing E's meaning rewrites the termination rules — v2 territory, noted for the owner. Keynes to RESOURCES.md as E's grounding.

**Gap outcomes:** A — Popper + Lakatos admitted. B — Chamberlin + ACH-rule admitted. C — source-criticism rule admitted unnamed; carriage rule admitted patron-free. D — Kent admitted; the spec's two priors declined on the merits. No gap stays open.

**Score: 6 admitted (2 of them as rules with the name in RESOURCES only) · 7 declined.**

---

## 4. Budget table

Corpus today: 1,877 lines across the ten skill files + 117 in PHILOSOPHICAL-FOUNDATIONS.md = **1,994**. Every admission is paired with its funding cut/demotion. Deltas are targets for Tasks 12–13, ±20%.

| File | Now | Admissions (+) | Cuts / replacements (−) | Net | Funded by |
|---|---|---|---|---|---|
| MARKERS.md | 98 | citation-carriage rule (+2) | — | **+2** | PKD demotion (PF −3) |
| EXPANSION.md | 212 | Chamberlin null-frame (+3); absence-claim rule (+3, is Task 12 Step 1's budget) | — | **+6** | Brandom + Polanyi cuts (PF −4); Ericsson & Kintsch cut (PF −6) |
| COMPRESSION.md | 149 | ACH diagnosticity rule (+2) | — | **+2** | Eilenberg & Mac Lane demotion (PF −8) |
| CRITIQUE.md | 195 | Popper Survival probe + no-attempt-no-credit rule (+3); Lakatos classifier (+3) | replaces the current amputation-check yaml block (−8, rewritten per Task 13 Step 1) | **−2** | self-funding via the rewrite; Rissanen cut + Orwell demotion (PF −8) |
| DISTILLATION.md | 217 | — | — | **0** | — |
| SYNTHESIS.md | 159 | Kent verdict-vocabulary bound (+3, is Task 13 Step 3's budget) | — | **+3** | Miller demotion (PF −7) |
| HOLDOUT.md | 206 | — (citation hygiene only; Pollock stays) | — | **0** | — |
| FORGE.md | 278 | — (non-goal) | — | **0** | — |
| ESCAPE-HATCH.md | 99 | — | — | **0** | — |
| PATTERNS.md | 264 | — (non-goal; hygiene already clean) | — | **0** | — |
| PHILOSOPHICAL-FOUNDATIONS.md → RESOURCES.md | 117 | admitted-candidate credits: Popper, Lakatos, Chamberlin, Heuer, Langlois & Seignobos, Kent, + declined-but-grounding Mill, Platt, Keynes (~9 one-liners inside the total) | PF replaced by ~45-line annotated resource layer (spec 2.3): one line per kept source, one per demotion, cuts gone | **−72** | the demotions themselves |
| **Total** | **1,994** | **+25** | **−86** | **≈ −61** | corpus shrinks ~3% |

Accounting notes:
- The operational files grow by +11 lines total; the corpus shrinks because PF was carrying ~70 lines of narration whose operational content already lives in the probe tables.
- Two admissions cost nothing beyond edits already mandated: the absence-claim rule is Task 12 Step 1's required section, and Kent is Task 13 Step 3's required mapping — the audit supplies their text and their patron, not new scope.
- If the owner rejects any single admission, no other admission depends on it; each pairing above stands alone.

---

## Flags for the owner

1. **The Keynes finding (§3 Gap D):** `COMPRESSION.md:92` docks E when contradicting evidence is found — saturation *falls* upon learning more, conflating weight of evidence with balance of evidence. The current semantics worked in the forensic record (run 1), so this audit declines to touch it, but it should be a named v2 item.
2. **Two admissions run unnamed** (Lakatos's classifier, the source-criticism absence rule) with credit in RESOURCES.md only — mirroring how MARKERS.md already runs source criticism namelessly and well. If you prefer names inline, say so at review; the drafts don't change, only the byline.
3. **PF → RESOURCES.md** (spec 2.3) is where all five demotions and the ~9 candidate credits land; the budget's net-negative depends on that conversion happening in the Task 12–13 window. If RESOURCES.md is deferred, the corpus grows +11 instead of shrinking −61.
4. **The spec's calibration priors both declined** (Tetlock: nothing to score inside a run; Keynes: right idea, v2-sized repair) in favor of Sherman Kent, who was not on the starting list. This is the audit exercising the "priors, not verdicts" license — worth a deliberate look.
