---
name: task-formation-auth
description: "Deduplicate auth observations into one task per flow and failure mode. Use before auth exploitation planning."
---

# task-formation-auth

Use this skill to reconcile auth observations into tasks (one flow + one failure mode each). Read the `auth_exploitation_queue.json` queue first. Call `submit_task_groups` once with `vuln_class: auth` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `auth_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

