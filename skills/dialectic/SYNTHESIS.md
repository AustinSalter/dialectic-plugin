> **Role in two-loop architecture**: This file defines the **target format specification** for the conviction memo. It is referenced by the distillation loop's clarity check (see `DISTILLATION.md`). The distillation loop iteratively produces a memo that meets this spec. This file is NOT executed as a single-pass instruction.

# Synthesis Pass: Conviction Memo

Final output production. Goal: **incisive recommendation with conviction and actionability**.

**No word count target.** Cut every unnecessary word. If a sentence doesn't change what the reader *does*, it doesn't belong. The reader is always important — they don't have time and they don't owe you attention. Sections that restate other sections are redundancy, not emphasis. Complexity earns space; repetition doesn't.

## The Problem: Bad Infinity

Most synthesis falls into "Bad Infinity" — endless "on the one hand, on the other hand."

| Bad Infinity (Avoid) | Conviction Memo (Target) |
|----------------------|--------------------------|
| "It depends on context" | "Because X, the only path is Y" |
| Hedge-betting | Position-taking with brief refutatio |
| "Moderate confidence reflects tension" | "High conviction until trigger Z" |
| Preserve both sides | Commit, with explicit off-ramps |

## Core Principle

**Probability is for calculation. Conviction is for execution.** During analysis: use 3D Confidence (R,E,C) honestly. During synthesis: convert uncertainty into a singular directive with named exit conditions. The reader doesn't need your confidence interval. They need to know what to do, why, and when to stop.

---

## Required Sections

### 1. Headline Insight

The *propositio*: the claim compressed to a sentence. This is an enthymeme — the conclusion with enough of the argument that the reader can reconstruct the rest. If the reader needs more than one sentence to understand the recommendation, the analysis hasn't converged.

Test: *is this falsifiable?* "Distribution controls value" is. "This is a complex situation" is not.

### 2. Situation

The *narratio*: only what the reader needs to evaluate the claim. What decision, what stakes, why now. Not background — decision context.

Test: *if you removed a sentence, would the reader evaluate the Headline differently?* If no, the sentence is decoration.

### 3. The Leap

The altitude shift the analysis discovered. This is where the memo earns its existence — the insight the reader couldn't have reached without the reasoning loop. The Leap must *surprise*. If the reader could have predicted it from the Headline and Situation alone, it's a restatement, not a leap.

Test: *does this change the reader's frame, or confirm it?* A memo that confirms priors is a waste of everyone's time.

### 4. Brief Refutatio

The strongest objection, stated with charity, and why you commit anyway. One objection. The purpose isn't to catalog counter-arguments — it's to demonstrate that the strongest one was absorbed, not amputated. This is the Elevation Test from CRITIQUE.md in its final form: the counter-argument that *strengthened* the thesis.

Test: *would a smart opponent feel their best argument was represented?*

### 5. The Bet

`We bet [X] > [Y] because [Mechanism].`

The bet names the mechanism. Not "we think X is better" — *why* X is better, structurally. The mechanism is what makes the bet falsifiable and what makes it a bet rather than an opinion.

### 6. First Move

What to do Monday. What to check at 30 days. What would change the plan. Three lines, not three sections. The CEO delegates everything after the first move — they need to know *where to point*, not the full route.

### 7. Disconfirmation Triggers

Observable, specific conditions that would flip the recommendation. This is what separates a conviction memo from an opinion piece. If you can't name what would make you change your mind, you haven't made a real recommendation — you've made a wish.

### 8. Verdict Table

The thing the reader actually reads. Everything above is support for this table.

| Recommendation | Conviction | Decision Window | Key Constraint | Revisit Trigger |
|----------------|------------|-----------------|----------------|-----------------|
| [ACTION VERB]  | High/Med/Low | [Timeframe]   | [Binding limit]| [Observable]    |

---

## Example: Yahoo-Google (2002)

```markdown
## Headline Insight

Distribution controls value; you cannot claim content is your moat while outsourcing the traffic source.

## Situation

Yahoo faces a $3B acquisition decision for Google in early 2002. Yahoo is the #1 portal with $700M revenue but uses Google for search (white-labeled). Google has $240M revenue growing 100%+ YoY. Yahoo's thesis: "search is commodity, content is moat."

## The Leap

Yahoo's own behavior disproves their thesis. You don't single-source a "commodity" to one vendor because they're "clearly better." The white-label decision already revealed search was consolidating around quality, not commoditizing. Yahoo's procurement team was smarter than their strategy deck.

## Brief Refutatio

The reasonable counter: $3B is 12.5x revenue for an unproven company, and integration could destroy Google's engineering culture. We commit anyway because the cost of Google-as-competitor is existential (they become the internet's front door), while the cost of failed integration is a write-off—painful but survivable.

## The Bet

We bet platform control > content quality because network effects compound while content advantages erode. Search quality improvements compound (better results → more users → more data → better results). Content can be replicated; the traffic source cannot.

## First Move

**Monday**: Schedule board meeting to authorize acquisition negotiations at $3B with $1B earnout structure.
**30-day check**: Term sheet delivered to Google; Page/Brin retention packages drafted.
**Gate**: If Google counters above $5B → full board discussion on ceiling.

## Disconfirmation Triggers

- Google's search market share declines 2+ consecutive quarters
- Yahoo internal search achieves <10% quality gap in blind user tests
- Search advertising CPMs commoditize across providers

## Verdict

| Recommendation | Conviction | Decision Window | Key Constraint | Revisit Trigger |
|----------------|------------|-----------------|----------------|-----------------|
| ACQUIRE | High | 90 days | $5B ceiling | Google counter > $5B |

[ANALYSIS_COMPLETE]
```

---

## Distillation Loop (Minimum 2 Passes)

Distillation is a loop, not a single pass. The first draft is never the final memo.

**Pass 1**: Spine extraction → draft memo → run distillation probes (Trace, Tension, Sufficiency, Conviction-Ink, Threads) → compression gate.

**Pass 2+**: Revise based on probe findings → re-run probes → compression gate.

**Minimum**: 2 full passes before the memo can be promoted to final. This is mandatory even if all probes pass on the first draft. First-pass probes are lenient because the model is still in the glow of having just written the draft.

**Second-pass probe behavior**: On pass 2+, probes should be *adversarial*, not confirmatory:

| Probe | Pass 1 Question | Pass 2+ Question |
|-------|----------------|-------------------|
| Sufficiency | Could a reader act on this? | Could a *skeptical* reader act on the First Move section without further guidance? Name one action that's too vague. |
| Conviction-Ink | Does every sentence advance the argument? | Find the weakest sentence. Can it be cut or sharpened? |
| Tension | Are counter-arguments handled? | Is the refutatio engaging the *strongest* counter, or a convenient one? |
| Trace | Do memo claims trace to spine? | Is the spine's central move (usually altitude shift) the *lead* of the memo, or buried? |
| Threads | Are argument threads held simultaneously? | Remove one thread — does the argument collapse? If not, that thread is decoration. |

**Exit condition**: Pass 2+ probes produce zero substantive revisions (only cosmetic changes). If any probe on pass 2 generates a revision that changes the argument, run pass 3.

**Maximum**: 4 distillation passes. If not converged by pass 4, promote with a note on what remains unresolved.

## Redundancy Check

Before finalizing, test every section against every other section. If two sections make the same point, one of them is redundant. The Bet should not restate the Leap. The Disconfirmation Triggers should not restate the Decision Gate. The Situation should not contain evidence that belongs in the Leap. Each section has one job. If it's doing another section's job, cut the duplicate.

## Completion Token

End synthesis with exactly:

```
[ANALYSIS_COMPLETE]
```

No text after this token.

