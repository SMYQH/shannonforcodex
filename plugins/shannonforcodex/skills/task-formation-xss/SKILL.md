---
name: task-formation-xss
description: "Deduplicate XSS observations into one task per source, sink, and encoding context. Use before XSS exploitation planning."
---

# task-formation-xss

Use this skill to reconcile XSS observations. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Boundary
One task = one source reaching one sink in one output-encoding context. Split on different sinks, contexts, or defenses.

## Workflow
1. Read the `xss_exploitation_queue.json` queue; compare source, sink, encoding chain, and context; group only when one browser proof settles all.
2. Call `submit_task_groups` once with `vuln_class: xss` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `xss_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

