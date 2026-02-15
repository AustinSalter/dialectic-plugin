---
description: Cancel active dialectic reasoning loop
---

# Cancel Dialectic Reasoning

Clean up and exit the dialectic reasoning loop.

## Steps

1. Check if `.claude/dialectic/` directory exists
2. If it exists:
   - Read `.claude/dialectic/state.json` to report current iteration and confidence
   - Preserve artifacts to the configured output directory (`output_dir` from state, default `.dialectic-output/`) using the configured `keep_artifacts` list (default: `memo,spine,history`). Copy each artifact file that exists, create a `manifest.json` with session metadata, and place everything in `{output_dir}/{session_id}/`
   - Report where artifacts were saved (if any files existed to preserve)
   - Remove the entire `.claude/dialectic/` directory
   - Confirm cancellation to user with summary of where analysis stopped
3. If it doesn't exist:
   - Inform user that no active dialectic loop was found

## Example Output

```
Dialectic loop cancelled.

Session: dialectic-1706384400
Stopped at: Iteration 3/5
Last confidence: 0.72
Last thesis: "NVIDIA's datacenter dominance..."

Artifacts saved to: .dialectic-output/dialectic-1706384400/
  - memo-final.md
  - thesis-history.md

State files cleaned up. You can start a new /dialectic session.
```

This allows normal session exit without the stop hook re-feeding.
