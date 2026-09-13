---
name: task-formation-authz
description: "Deduplicate authz observations into one task per operation and role boundary. Use before authz exploitation planning."
---

# task-formation-authz

Use this skill to reconcile authz observations (one operation + one role boundary each). Read the `authz_exploitation_queue.json` queue first. Call `submit_task_groups` once with `vuln_class: authz` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `authz_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

