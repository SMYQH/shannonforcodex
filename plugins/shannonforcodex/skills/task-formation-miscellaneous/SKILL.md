---
name: task-formation-miscellaneous
description: "Deduplicate miscellaneous observations into executable tasks. Use before miscellaneous exploitation planning."
---

# task-formation-miscellaneous

Use this skill to reconcile miscellaneous observations into tasks. Read the `miscellaneous_exploitation_queue.json` queue first. Call `submit_task_groups` once with `vuln_class: miscellaneous` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `miscellaneous_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

