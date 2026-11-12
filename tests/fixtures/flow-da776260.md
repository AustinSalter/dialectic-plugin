# Dialectic Scratchpad

## Source-fidelity caveat (carried through all iterations)
All quotes below are as returned by the WebFetch summarizer model reading each page, NOT independently
verified against raw HTML. For a task whose point is verbatim anchoring, treat every quotation as
"reported, unverified." Raw-text verification is an open thread (see not_yet_investigated).

Sources fetched (iteration 1):
- PAPER  [PRIMARY]  transformer-circuits.pub/2026/workspace  (title as reported: "Verbalizable Representations Form a Global Workspace in Language Models")
- BLOG   [DOWNSTREAM of paper]  anthropic.com/research/global-workspace
- CODE   [PRIMARY, implementation]  github.com/anthropics/jacobian-lens (README)

---

## Iteration 1 — EXPANSION

### Frame
```yaml
frame:
  protecting: >
    An engineering/research bet — not wasting effort building a trainer on a metric that
    cannot bear the load, and not committing the category error of mistaking an
    interpretability INSTRUMENT for a control LEVER.
  altitude: RIGHT_LEVEL (with an exposed causal chain, below)
  domain: general (mechanistic interpretability / ML training) — market-structure PATTERNS.md does not map
  probes_to_run: [mechanism, contingency, model_dependency, implementation]
```

Causal chain implied by the affirmative thesis ("use workspace geometry as a training signal"):
```
Action: turn a workspace-geometry quantity into a reward/loss and optimize the model on it
Step 1: fit J-lens; measure LOADING of a thesis-concept over a long generation
Step 2: convert loading trajectory into a reward/loss
Step 3: optimize the model to keep loading high across the horizon
Step 4: model adheres to the thesis over the long horizon
```
Breaks in the chain (these are the load-bearing joints):
- 1→2: loading = cosine similarity = PRESENCE, not GOVERNANCE (does presence cause behavior?)
- 2→3: optimizing a fixed linear readout = textbook Goodhart (inflate readout without function)
- 3 itself: the lens J_l is fitted as an expectation; optimizing against it moves the model off the
  manifold the expectation was taken over → the instrument may not survive being used as a signal
- underlying: RL validity of the lens is UNADDRESSED in every source

### Evidence (markers)

[EVIDENCE:web][PRIMARY] LOADING is defined as "the cosine similarity between the residual stream and
  that concept's lens vector." → A scalar correlational readout. This is the crux: presence, not governance.

[EVIDENCE:web][PRIMARY] The J-lens is "a technique for inspecting the contents of the residual stream" /
  blog: "finds the internal activity pattern that makes Claude more likely to say that word ... in the
  future." Framed as INSTRUMENT everywhere.

[EVIDENCE:web][PRIMARY] BROADCAST: "far more components read from them and write to them than for
  ordinary patterns ... by a factor of about a hundred ... a broadcasting hub." → capacity for
  downstream influence exists.

[EVIDENCE:web][PRIMARY] IGNITION: "entry into the workspace is marked by 'ignition'—a late, all-or-none
  amplification of one interpretation." → attractor/latching dynamic.

[EVIDENCE:web][PRIMARY] J_l = E[∂h_final/∂h_l], expectation over prompts/positions in a
  "generic web-text corpus" / "pretraining-like corpus." → fixed linear map, pretraining-calibrated.

[COUNTER][PRIMARY] "counterfactual reflection training ... seeks to implant a set of ethical behavioral
  principles into the model's workspace." → The workspace HAS been used as a training TARGET. Existence
  proof against a hard "instrument-only" reading. (But: is its objective scalar loading, or something else?
  Unknown — see thread.)

[COUNTER] RL: NOT FOUND in paper, blog, or code. The specific question "does the lens stay valid under RL"
  is not answered by the text — it is a gap, and must be flagged, not reconstructed.

[TENSION] Workspace-as-training-target exists (counterfactual reflection) VS loading being merely cosine
  similarity (presence). Reconciles only if we learn what counterfactual reflection actually optimizes.

[INSIGHT] Workspace geometry is NOT one quantity. LOADING = presence (a readout). BROADCAST = the wiring
  CAPACITY for governance. IGNITION = the DYNAMICS of commitment. Long-horizon adherence needs governance
  + commitment, i.e. broadcast + ignition — NOT loading alone. Training on loading alone Goodharts presence.
  So the real question is not "signal vs instrument" but "WHICH geometric quantity, and does it survive
  optimization." → candidate ELEVATE.

[INSIGHT] Reflexivity / lens-validity-under-optimization is the binding constraint. Three distinct threats,
  none addressed by the sources:
    (1) distribution shift — RL moves activations off the web-text manifold the lens was fitted on;
    (2) function shift — RL changes weights, so true Jacobian ≠ fitted average Jacobian;
    (3) reflexivity — using the lens AS the reward changes the very map the lens approximates, making
        Goodhart structural, not incidental.

[THREAD] What does "counterfactual reflection training" actually optimize? If it is not scalar loading,
  the existence proof is weaker than it looks.
[THREAD] Verify loading / ignition / broadcast quotes against raw HTML (fidelity).
[THREAD] Does the paper anywhere claim loading is CAUSALLY SUFFICIENT for behavior (not just correlated)?
  The rhyme-swap result ("swap it for another word in the J-space, the whole line changes") is the closest
  causal evidence — but it is an intervention on the WORKSPACE VECTOR, not on scalar loading.

not_yet_investigated:
  - Objective/loss of counterfactual reflection training
  - Raw-HTML verification of the four load-bearing quotes
  - Any causal-sufficiency claim for loading magnitude
  - Whether §9.3 ("quality saturates") or fitting details bound lens validity off-distribution

---

## Iteration 2 — EXPANSION (targeted: resolve the tension + RL validity)

### CORRECTION to iteration 1
Iter-1 stated "no source mentions RL." FALSE. The paper discusses POST-TRAINING (which includes RLHF/RL):
  [EVIDENCE:web] "post-training causes the J-space to acquire the Assistant's 'point of view'"
  [EVIDENCE:web] "a model trained to appease biases in reward models used for training"
The iter-1 broad-fetch summarizer omitted this; a targeted fetch surfaced it. The fidelity caveat cuts
BOTH ways — the summarizer can invent AND omit. Logged as a challenging-evidence correction.

### The tension RESOLVES

[EVIDENCE:web][PRIMARY] Counterfactual reflection training optimizes VERBALIZATION, not loading:
  "to shape what a model thinks ... it might suffice to shape what it is disposed to say in potential
  future continuations ... training it to articulate those principles if it were interrupted and asked
  to reflect." Workspace shaped as a CONSEQUENCE; entry verified POST-HOC:
  "after training, the J-space in these contexts is populated with concepts related to the reflections
  ... and ablating these implanted representations from the workspace largely reverts the behavioral
  improvement."
  → RESOLUTION: the paper's own worked example of a durable-adherence signal did NOT reward loading. It
    rewarded counterfactual verbalization and used the lens to VERIFY. Kills the naive affirmative
    ("reward loading") and proves a NON-naive affirmative exists.

[EVIDENCE:web][PRIMARY] Causal sufficiency of the DIRECTION (not the scalar): patching lens coordinates
  flips output "8"->"6"; "intervening on [J-lens vectors] is sufficient to redirect the model's
  conclusion"; ablation reverts implanted behavior.
  → The J-lens VECTOR governs; LOADING is the scalar readout of how much of that vector is present.
    Sharp presence/governance restatement: direction is causal, cosine scalar is a gauge. Goodhart risk
    is specific — raise cosine similarity via components downstream does NOT read (orthogonal to the
    broadcast fan-out) and you inflate the gauge without engaging governance.

[EVIDENCE:web][PRIMARY] Limitations (soft): lens is "an imperfect tool, which we believe only
  approximately and incompletely captures the model's underlying workspace structure"; vocab restricted
  to "concepts that correspond to single tokens" -> multi-token thesis concepts out of native scope.

[EVIDENCE:web] Lens survives ORDINARY post-training as a readout (applied to post-trained models, reveals
  the Assistant point-of-view shift). Partially answers the RL question for the INSTRUMENT use only.

[INSIGHT] The signal-vs-instrument binary is FALSE. THREE roles, not two:
    SIGNAL     = counterfactual verbalization objective (what you optimize)
    SUBSTRATE  = workspace: broadcast (capacity) + ignition (commitment) + causal J-lens directions
    INSTRUMENT = the lens (identify target direction; verify implantation)
  Long-horizon adherence rides the substrate; you steer it with the verbalization signal; you audit with
  the instrument. "Reward loading" conflates all three and breaks on the substrate/instrument seam.

[INSIGHT] Lens-validity splits into TWO questions the sources answer differently:
    (a) lens applied to an independently-RL'd model   -> WORKS (evidence above);
    (b) lens output USED AS the RL reward (reflexive)  -> UNADDRESSED; "appease reward-model biases" is
        flagged as a real failure mode -> structural Goodhart caution.
  The user's "valid under RL" must be split along this seam; conflating them overstates the evidence.

[TENSION -> resolved] workspace-as-target vs loading-as-presence: resolved by separating optimized-proxy
  (verbalization) from substrate (workspace) from readout (lens).

threads still open:
[THREAD] Full Limitations section not retrieved (marked [discuss-limitations]) — bounds on linear-approx
  error and off-distribution validity live there.
[THREAD] Was the post-training-comparison lens FIT on the post-trained model or TRANSFERRED from base?
  Determines whether "survives RL" means "re-fittable after RL" vs "transfers across RL."
[THREAD] Raw-HTML quote verification still not done.

not_yet_investigated (updated):
  - Full Limitations section (linear-error / off-distribution bounds)
  - Fit-vs-transfer detail for the post-trained lens
  - Any explicit treatment of lens-as-reward / reflexive optimization
  - Raw-HTML verbatim verification

---

## Iteration 3 — EXPANSION (fresh frame: division of labor; stress-test scope + RL seam)

### Mechanism STRENGTHENED (the linchpin)
[EVIDENCE:web][PRIMARY] "the representations used for verbal report are the same ones that govern how the
  model silently reasons." → report-reps ARE governance-reps. This is the causal bridge SIGNAL→SUBSTRATE:
  training "what it's disposed to say" reaches "what governs reasoning" precisely because they are one set.
  Deepest support yet for the division-of-labor thesis's internal coherence. [BRIDGE: verbalization→governance]

### Scope CORRECTED — "long-horizon" is over-claimed
[COUNTER][PRIMARY] "evidence is strongest for intra-prompt governance rather than multi-turn or extended
  agentic settings." Examples: spider→8 legs (one hop), rhyme within one line, arithmetic (three values).
  Counterfactual reflection "tests generalization to *similar* prompts, not long-horizon persistence
  through many autoregressive steps."
  → The sources support LOCAL governance + generalization-across-similar-contexts. Genuine long-horizon
    (many-step, agentic, under drift/distractors) is NOT demonstrated. My elevated thesis's "long-horizon"
    qualifier is an EXTRAPOLATION. Demote it from asserted property to explicit conditional bet.

### RL / off-distribution seam — characterized as a GAP, not a reassurance
[COUNTER] Off-distribution: lens averaged over "a pretraining-like distribution"; "no caveat about
  validity when inputs move outside this distribution." Absence of caveat ≠ robustness. Agentic long
  horizons are precisely off-distribution — the least-characterized regime.
[COUNTER] Fit-vs-transfer: README silent. "Survives post-training" most plausibly = re-fit a lens on the
  post-trained model (fitting needs the model's own backward pass), NOT base-lens transfer through RL.
  Reflexive RL (lens-as-reward) would require the lens to track a MOVING model — continuous re-fit,
  compounding cost and the reflexive-Goodhart coupling.
[COUNTER] Lens-as-reward: paper "includes no explicit caveat against using the lens as an optimization
  target ... presented as successful, without warnings about ... failure modes." → The Goodhart/reflexivity
  caution is MINE (structural inference), attributable to analysis, not to the text. Keep that attribution.

[INSIGHT] The thesis now cleaves into two parts with different certainty:
  ARCHITECTURE (signal/substrate/instrument; report=governance) — well-supported, higher C.
  LONG-HORIZON EXTENSION — unsupported extrapolation, low C, and co-located with the least-characterized
  lens-validity regime. The user's question centers on the low-C part.

[TENSION] Two silences point opposite ways: paper is silent on lens-as-reward RISK (author optimism)
  AND silent on long-horizon/off-distribution SUPPORT (evidence absence). A reader could take either as
  license. Neither silence is evidence; both are gaps to be named, not filled.

not_yet_investigated (updated):
  - INDEPENDENT/follow-up evidence on long-horizon persistence of workspace/J-space reps (beyond these 3 sources)
  - Independent literature on interpretability-readout-as-RL-reward Goodhart (to test the reflexivity claim)
  - Raw-HTML verbatim verification (still outstanding)

---

## Iteration 4 — EXPANSION (external evidence: test the two extrapolation legs)

### Reflexivity leg — CONFIRMED and CONDITIONED
[EVIDENCE:web][PRIMARY] "when a monitor becomes a training target, it may cease to be reliable (Goodhart's
  Law)." + obfuscation mechanism: models "change their activations such that the probe no longer fires."
  → Exact confirmation of the iter-1 structural prediction (optimize a readout → model moves off the
    manifold the readout was calibrated on). My caution is no longer only mine.
[COUNTER][PRIMARY] Probe-based Fine-tuning (arXiv 2510.21531): "the training method determines probe
  viability, with probe-based DPO preserving detectability substantially better than classifier-based DPO
  ... optimizing against internal representations can strengthen rather than destroy the monitoring signal
  when the training objective aligns with probe detection."
  → Reflexive use is NOT uniformly doomed. Viability is CONDITIONAL on objective alignment.
[BRIDGE: probe-DPO → division-of-labor] The condition maps onto the thesis exactly:
    reward LOADING  = classifier-like, gameable  → obfuscation/Goodhart  (avoid)
    train VERBALIZATION = DPO-like, aligned with the governing rep (report=governance) → preserves feature (do)
  This is the mechanistic REASON the thesis's recommendation holds. Raises R and E materially.

### Long-horizon leg — CONTRAINDICATED for the naive (inject/reward) path
[COUNTER][PRIMARY] Steering "effects fade after ~300-500 tokens"; multi-turn "wash out by turn 5-6";
  reasoning features "peak early ... rapidly decay." Remedies = re-injection / decaying steering.
  → Geometric PRESENCE does not persist over a long horizon on its own. This condemns injecting/rewarding
    the geometry as a long-horizon lever, and by contrast supports TRAINING the behavior so WEIGHTS carry
    durability. IMPORTANT NUANCE: this literature is inference-time steering, NOT weight training — so it
    bounds the INSTRUMENT-as-lever path, not decisively the TRAINING-signal path. Trained long-horizon
    persistence of workspace reps remains UNTESTED anywhere in evidence. Long-horizon stays a BET.
[COUNTER] Off-distribution fragility corroborated: probe accuracy "largely collapses under leave-one-out
  training" → supports the paper's uncharacterized off-distribution risk being a real hazard for agentic
  (off-distribution) horizons.

[INSIGHT] The user's two watch-items resolve cleanly:
  - "loading = presence vs governance": loading is presence; governance is the DIRECTION + broadcast
    fan-out; rewarding the presence-scalar invites off-manifold obfuscation. CONFIRMED both structurally
    and empirically.
  - "lens valid under RL": split the seam — (a) lens as READOUT on an RL'd model = valid (re-fit);
    (b) lens as REWARD under RL = conditionally valid (DPO-aligned objective preserves it; classifier /
    scalar-max objective destroys it); (c) OFF-DISTRIBUTION long-horizon = uncharacterized/fragile.

### SATURATION
The three primary sources are silent on the two load-bearing legs; the external literature answers the
reflexivity leg (confirmed + conditioned) and bounds the long-horizon leg (naive path contraindicated;
trained path untested). The remaining open question — TRAINED long-horizon persistence of workspace reps
specifically — is publicly unstudied; further search is low-yield. E saturated on grounds of "no
productive near-term threads," not delta.

not_yet_investigated (residual, publicly unstudied):
  - Whether a TRAINED (not injected) workspace disposition persists/governs over long agentic horizons
  - Whether a lens used as reward stays calibrated when the model moves (continuous re-fit cost)
  - Raw-HTML verbatim verification of the paper's four load-bearing quotes (fidelity caveat persists)
