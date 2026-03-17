# Forge — Build Spec Synthesis

You are synthesizing the output of a dialectic loop into an **engineering artifact** — a build spec that a developer (or Claude Code) can execute against. You are NOT producing a conviction memo, persuasive document, or strategic recommendation. You are producing a blueprint.

## Relationship to Distill

Distill asks: "What do we believe and why?" → produces rhetoric (conviction memo)
Forge asks: "What do we build and how?" → produces architecture (build spec)

Same loop output. Different extraction. Different audience.

## Inputs

Read the following before generating the spec:

1. **Loop output** — `.claude/dialectic/scratchpad.md` (full reasoning with markers)
2. **State file** — `.claude/dialectic/state.json` for confidence scores and iteration count
3. **Thesis history** — `.claude/dialectic/thesis-history.md` for iteration trajectory
4. **Holdout report** (if exists) — `.claude/dialectic/holdout_report.md` for validated/challenged findings

## How to Read the Trace for Forge

The semantic markers from the loop mean different things in a build context than in a rhetoric context. Apply these translations:

### `[EVIDENCE]` → Constraints & Requirements
Evidence markers describe the problem space. In a build spec, problem-space observations become design constraints. Extract each evidence marker and ask: "What does this force the architecture to accommodate?"

Example:
- Loop evidence: `[EVIDENCE] Event sourcing adds ~40ms latency per write but enables full audit trail`
- Forge constraint: "Write path must tolerate ≤50ms added latency. Audit trail is a hard requirement."

### `[COUNTER]` → Risks & Alternative Approaches
Counter-arguments are NOT things to dismiss (that's distill's job). They are things to **document as known tradeoffs with mitigations**. Every counter that survived the loop has real force — the loop engaged it and still converged, but the underlying risk doesn't disappear just because the thesis won.

Example:
- Loop counter: `[COUNTER] Event sourcing projections add operational complexity and eventual consistency bugs`
- Forge risk: "Projection rebuilds are an operational burden. Mitigation: idempotent projectors + automated rebuild tooling. Monitor: projection lag > 500ms triggers alert."

### `[TENSION]` → Decision Points
Tensions that the loop resolved represent architectural forks where the builder has **degrees of freedom**. The loop picked a direction, but the alternative isn't wrong — it's context-dependent. Document both sides and when to revisit.

Example:
- Loop tension: `[TENSION] Monolith simplicity vs. service isolation for independent deployment`
- Forge decision point: "Default: modular monolith with domain boundaries. Switch to service extraction when: deployment frequency for a module exceeds 3x/week OR team ownership diverges. Seam location: the domain event interface."

### `[INSIGHT]` → Design Principles
Insights are the non-obvious things the dialectic discovered about the problem. These become the **governing principles** that should guide every implementation choice the builder makes — including choices the spec doesn't explicitly cover.

Example:
- Loop insight: `[INSIGHT] The bottleneck isn't data access speed, it's context assembly — the cost of gathering everything needed before reasoning can start`
- Forge principle: "Optimize for context assembly time, not query latency. Architectural choices that reduce the number of lookups before a decision can be made are preferred over choices that make individual lookups faster."

### `[THREAD]` → Extension Points & Phase 2
Threads are things the loop flagged as worth exploring but didn't resolve. In a build spec, these become **places the architecture must be flexible** because you know future requirements will emerge here. Don't build for them now, but don't foreclose them either.

Example:
- Loop thread: `[THREAD] Multi-tenant isolation model — not resolved but will matter at scale`
- Forge extension point: "Tenant isolation is Phase 2 scope. Phase 1 architecture must: (a) never hardcode single-tenant assumptions in the data model, (b) route all data access through a context layer that can later enforce tenant boundaries. Do not build tenant management yet."

## Holdout Integration

Before generating the spec, check for `.claude/dialectic/holdout_report.md`.

### If holdout exists AND verdict = VALIDATED
- Proceed with full spec generation
- Design principles and decision points have high confidence
- Add spec footer: "--- ✓ Reasoning validated by partitioned holdout"

### If holdout exists AND verdict = CHALLENGED
- Read holdout findings carefully. Apply these translations:
  - **Buried evidence (SUSPICIOUS)** → There is a constraint the loop underweighted. Forge MUST surface it as either a risk or a design constraint, even if the loop's synthesis didn't emphasize it.
  - **Unengaged counter-arguments** → These become HIGH-PRIORITY risks with explicit mitigations. The loop didn't engage them — forge must.
  - **Soft disconfirmation triggers** → The "when to revisit" conditions on decision points must be tightened. Use the holdout's specificity critique to write sharper triggers.
  - **Undercutting defeaters** → If the holdout found a broken inferential link, the design principle derived from that reasoning chain should be flagged as LOW-CONFIDENCE with an explicit validation step in the implementation order.
- Add spec footer: "--- ⚠ Challenged by holdout — [N] findings incorporated into risks and decision points"

### If holdout exists AND verdict = FRACTURED
- **Do not generate a full spec.** The reasoning foundation is unstable.
- Instead, produce a SHORT diagnostic:
  - What the holdout broke
  - The competing architectural directions
  - Which decision points are blocked until the dialectic re-runs
- Recommend: `/dialectic:dialectic "[holdout's counter-thesis]"` then re-attempt forge.

### If no holdout report exists
- Proceed with standard spec generation (backward compatible)
- No footer annotation

## Output Format

Generate the spec in exactly this structure. Every section is mandatory unless marked optional.

```markdown
# Forge Report: [title — derived from the loop's convergence point]

## Decision

[1-3 sentences. The core architectural choice and why. This is the
ONLY section that overlaps with distill — it's the thesis in one breath.
Derived from the loop's convergence point.]

## Design Principles

[3-5 principles derived from [INSIGHT] markers. These are the things the
dialectic discovered about the problem that weren't obvious from the
original thesis. Each principle should be:
  - Stated as a directive ("Prefer X over Y", "Optimize for Z")
  - Grounded in a specific insight from the trace
  - Actionable — a builder encountering an unlisted decision should be
    able to apply this principle to choose correctly]

1. **[Principle name]** — [directive]. [1 sentence grounding in trace insight].
2. **[Principle name]** — [directive]. [1 sentence grounding].
3. ...

## Architecture

### Components

[Each major component. Derived from the logical boundaries the loop's
reasoning established. For each:]

**[Component Name]**
- **Purpose:** [1 sentence — what it does]
- **Justification:** [which constraint or evidence marker requires this to exist]
- **Inputs:** [what it receives and from where]
- **Outputs:** [what it produces and for whom]
- **Key invariant:** [the one thing that must always be true about this component]

[Repeat for each component. Typically 3-7 components.]

### Data Flow

[ASCII diagram showing how data moves between components. Annotate
decision points where the flow branches.]

```
[component A] ──(data)──→ [component B] ──→ ...
                                │
                          (decision point)
                           ╱          ╲
                     [path A]      [path B]
```

### Control Flow

[Sequence of operations. What triggers what. Emphasize:
  - Entry points (what initiates the system)
  - Decision points (where behavior branches)
  - Terminal states (what constitutes completion or failure)
  - Error paths (what happens when components fail)]

## Decision Points

[Extracted from [TENSION] markers. These are architectural forks where
the builder has degrees of freedom. The loop picked a direction but
the alternative is valid in other contexts.]

### [Decision Point Name]

- **The fork:** [what must be chosen between]
- **Default:** [the loop's recommended direction]
- **Alternative:** [the other viable option]
- **Tradeoff:** [what you gain and lose with each]
- **Revisit when:** [specific, measurable condition that should trigger
  reconsideration — NOT vague like "when requirements change"]
- **Seam location:** [where in the architecture the switchover happens —
  which interface, module boundary, or config flag]

[Repeat for each decision point. Typically 2-5.]

## Risks & Mitigations

[Extracted from [COUNTER] markers. Each counter-argument the loop engaged
becomes a risk with a concrete mitigation strategy.]

### [Risk Name]

- **Risk:** [what could go wrong]
- **Evidence:** [which trace evidence supports this being real]
- **Severity:** HIGH | MEDIUM | LOW
- **Mitigation:** [specific technical strategy to reduce impact]
- **Monitor:** [observable signal that this risk is materializing —
  a metric, a log pattern, a user behavior change]

[Repeat for each risk. If holdout found unengaged counters, those go
here as HIGH severity with explicit "identified by holdout audit" tag.]

## File Structure

[Proposed directory and file layout. Derived from component boundaries.
Every component maps to a location. Shared types, configs, and utilities
have explicit homes.]

```
project/
├── src/
│   ├── [component-a]/
│   │   ├── ...
│   ├── [component-b]/
│   │   ├── ...
│   └── shared/
│       ├── types/
│       └── config/
├── scripts/
├── tests/
└── ...
```

## Implementation Order

[Phased build plan. Each phase has a clear validation gate.]

### Phase 1: [Name] — [what it validates]
[What to build first. This should be the minimum set of components
that validates the core architectural decision. Include:]
- Components to build (reference Architecture section)
- Expected outcome / how to know Phase 1 is working
- Estimated complexity: SMALL | MEDIUM | LARGE

### Phase 2: [Name] — [what it adds]
[Extensions derived from [THREAD] markers. Things the architecture
should accommodate but doesn't build yet in Phase 1.]
- Components to build or extend
- What triggers Phase 2 (from Decision Points "revisit when" conditions)

### Phase N: [Name] (optional)
[Further phases if the dialectic surfaced multiple layers of unresolved
threads. Each phase should have a trigger condition, not just "later."]

## Edge Cases

[Extracted from [COUNTER] and [TENSION] markers that represent boundary
conditions rather than architectural alternatives. Things that will
break the system if unhandled.]

- **[Edge case]:** [description]. **Handle by:** [strategy]. **Test with:** [specific test scenario].
- ...

## Open Questions

[Things the dialectic flagged but did not resolve, that the builder
will need to answer during implementation. Be explicit that these are
UNRESOLVED — don't fake certainty.]

- [Question]. [What the loop found so far]. [Suggested approach to resolving during build.]
- ...
```

## Quality Checks

Before outputting the forge report, verify:

1. **Every component has a justification** that traces to a specific evidence marker or constraint. If a component exists "because it seems right" without a trace-grounded reason, cut it or find the reason.

2. **Every decision point has a revisit trigger** that is specific and measurable. "When requirements change" is not a trigger. "When write volume exceeds 10k/sec" is.

3. **Every risk has a monitor signal.** A risk without a monitoring strategy is a risk you'll discover too late.

4. **Phase 1 is minimal.** The natural temptation is to put everything in Phase 1. Resist. Phase 1 validates the core decision — everything else is Phase 2+.

5. **[THREAD] markers map to extension points.** If a thread from the trace doesn't appear somewhere in the spec (as a Phase 2 item, an open question, or an extension point in the architecture), it was dropped. Go back and place it.

6. **The file structure matches the component list.** Every component has a home. No orphan directories. No component split across unrelated locations.

7. **Edge cases have test scenarios.** An edge case without a test strategy is documentation, not engineering.

## Tone

Write like a senior engineer's design doc, not like a consultant's deck.
Direct. Specific. No hedging language unless the uncertainty is genuine
(in which case, flag it in Open Questions). No "leverage" or "utilize" —
use "use." No "ensure alignment" — say what specifically needs to match what.

The reader of a forge report should be able to open their editor and
start building without asking clarifying questions about the architecture.
If they'd need to ask "but where does X go?" or "what happens when Y fails?"
the forge report is incomplete.
