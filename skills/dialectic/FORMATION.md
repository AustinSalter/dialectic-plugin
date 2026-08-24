---
name: dialectic-formation
description: Case construction between survey and loop. Promotes the first expansion's rival hypotheses to competing cases, scores them for winnability, commits to one with declared ground. Runs once after the first expansion pass; re-entered on ELEVATE.
---

# Formation Pass

The survey produces briefs. The loop produces clash. Formation is the move between them: choosing the case.

When evidence-gathering is commoditized, both sides hold the same briefs, and the round is decided at construction — what to claim, on which ground, conceding what. The plugin's own market thesis applies to its own pipeline: when production is abundant, the scarce thing is selection. A thesis that was never selected from rivals was never formed — it was inherited.

Without formation, the prompt's thesis enters the loop as the incumbent and is only ever repaired: elevated, amended, softened. Reactive surgery is not construction. The mean-fallacy memo, the buried contrarian lead, and the undefined contested term are all formation failures — none of them are evidence failures, and no amount of surveying fixes them.

## Input Required

First expansion pass complete: a frame with rival hypotheses and marked evidence. Formation without briefs is speculation with a rubric. Run expansion first.

## Phase 1: Cut the Cases

Draft 3–4 candidate theses from the evidence. Start from the frame's rival hypotheses — promoted from search-steering to full cases — plus any case the evidence surfaced that the frame did not anticipate. One candidate must be the refutation-shaped case: the premise-denial stated as a thesis, not a hedge.

State each candidate as claim, grounds, warrant. The warrant is the inference the loop will spend its iterations attacking; a candidate that cannot state its warrant is not a case yet.

```yaml
candidates:
  - id: A
    claim: "<one sentence, falsifiable>"
    grounds: [E-refs from the expansion]
    warrant: "<the inference connecting grounds to claim>"
    stasis: fact | definition | value | policy
```

**Stasis check — fight where you can win.** Name which question each case answers:

| Stasis | Question | Attack it invites |
|--------|----------|-------------------|
| fact | Is it so? | Counter-evidence |
| definition | What kind of thing is it? | Category press — "that isn't X, it's Y" |
| value | Is it better? | Rival decision rule |
| policy | What should be done? | Implementation, side effects |

A case built at one stasis loses to an attack from another it never saw. A question about "the new alpha" is a definition-stasis question wearing a fact costume; run it at the fact stasis with "alpha" undefined and the definition press arrives in the final round, unanswered.

So: **every contested term in the claim gets an operational definition at formation**, before the loop spends a single iteration. The definition is ground — "alpha: excess return to capital allocation with an identifiable losing counterparty" decides in advance what the case must defend and what it may decline.

## Phase 2: Score for Winnability

Winnability, not truthiness. Truth is the loop's job; formation scores structure. Five dimensions:

| Dimension | Question | Losing pattern |
|-----------|----------|----------------|
| Content | What does this case forbid? More prohibitions, more content | Compatible with every outcome — nothing at stake |
| Ground | What does it decline to defend? | Defends everything, defends nothing |
| Counterparty | Who loses if it is right, and would they recognize themselves? | Everyone reads it and feels confirmed |
| Evidence control | Do the briefs uniquely support this case, or its rivals equally? Reuse compression's diagnosticity | Running a case your own briefs support only weakly |
| Adjudicability | Can the loop's iteration budget actually test it — do discriminating searches exist? | A case whose crux is unfetchable inside the run |

Prefer the boldest case that survives the table, not the safest. A safe case is an unfalsifiable case wearing armor, and the loop will spend five iterations failing to kill something that was never alive.

## Phase 3: Commit and Declare Ground

Write the selected case to state.json under `case`, and append the full formation block — candidates, scores, selection reasoning — to the scratchpad:

```yaml
case:
  thesis: "<selected claim>"
  stasis: <from Phase 1>
  definitions:
    <term>: "<operational definition>"
  hard_core:
    - "<claim defended to the death — if it falls, the decision is REJECT, never a patch>"
  protective_belt:
    - "<auxiliary claim that may be sacrificed under fire without killing the case>"
  excludes:
    - "<what the case does NOT claim — an attack here is off-ground: record it, decline it>"
  center_of_gravity: "<the single mechanism every serious attack must pass through>"
  decision_rule: "<what winning means — how the verdict should be weighed>"
  rejected_candidates:
    - {id: B, claim: "<...>", why: "<one line>"}
```

Determination is negation: the case's content is its exclusions, and a case that excludes nothing says nothing. The hard core and belt tell CRITIQUE what an amputation is — sacrificing belt under fire is adaptation; sacrificing core is death, and patching a dead core is the degeneration Lakatos named. The excludes list tells CRITIQUE which counters are off-ground: recorded in the scratchpad, not absorbed into the thesis. The asymmetry that shapes all of it: the case must win every load-bearing plank, while the negative needs only one. Minimize the hard core.

## Re-entry on ELEVATE

ELEVATE re-enters formation instead of freeform-rewriting the incumbent. Re-score the field with the accumulated evidence — including rejected candidates, which new evidence may have revived. If the elevation the critique reached is a case no candidate anticipated, it enters as a new candidate and is scored against the field like any other. The Preservation Gate still binds: whichever case wins carries what the old case proved.

## Do NOT

- Form before surveying — cases cut from priors are prompts with better posture
- Select the median case — a synthesis of candidates is the mean fallacy at birth
- Seat the incumbent without scoring — the prompt's thesis is candidate A, not the default winner
- Score truthiness — a true case badly grounded loses to a narrower case that holds its ground

## Example: The Kushner Run (20260821T155203)

What formation would have changed, using the actual first-expansion briefs:

**Candidates**: (A) alpha migrates to permanent-capital structures [the prompt's frame, promoted]; (B) hard tech revives the venture wrapper; (C) software alpha persists at new layers [refutation-shaped]; (D) discovered mid-survey: the migration is real but already priced — alpha survives only where crowds cannot execute.

**Stasis check** fires immediately: "what is the new investment alpha?" is definition-stasis — and no candidate defines alpha. Forcing "alpha: excess return with an identifiable losing counterparty" at formation surfaces in round one what the live run met as an unanswered press after the memo shipped: operating improvement is enterprise income, not alpha, and the only surviving alpha in the evidence is constraint arbitrage against the fund clock.

**Scoring**: A fails Counterparty (everyone it mentions feels confirmed — the mean fallacy scored at birth). B fails Evidence control (the funding-boom briefs support forced-deployment equally well). C holds Content but loses Evidence control to D. D wins on Content (forbids the trophy trade), Counterparty (names the 9x platform buyers as exit liquidity), and Adjudicability (its cruxes — tail multiples, secondaries discounts — are fetchable prices).

The live run reached D's substance by iteration 3 and still led the memo with A's framing, because A was the incumbent and nothing ever made it stand for election.

Sources: RESOURCES.md

## Integration

Formation runs between the first EXPANSION and the first COMPRESSION (`commands/dialectic.md` Step 2.5, iteration 1 only), and on every ELEVATE — the stop hook's elevation prompt re-feeds through this file, with the critique's elevated thesis entering as a candidate, not the winner. CRITIQUE's Case Ground section reads `case.hard_core`, `case.protective_belt`, `case.excludes`, and `case.definitions` to classify counters. The model owns `case`; the hook never writes it. Runs with no `case` object (pre-formation sessions) degrade gracefully: the elevate re-feed falls back to direct adoption, and CRITIQUE skips Case Ground.
