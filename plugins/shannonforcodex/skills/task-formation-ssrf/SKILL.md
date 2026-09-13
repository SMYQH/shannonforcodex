---
name: task-formation-ssrf
description: "Deduplicate SSRF observations into one task per URL input and fetch sink. Use before SSRF exploitation planning."
---

# task-formation-ssrf

Use this skill to reconcile SSRF observations (one URL input + one fetch sink each). Read the `ssrf_exploitation_queue.json` queue first. Call `submit_task_groups` once with `vuln_class: ssrf` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `ssrf_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

