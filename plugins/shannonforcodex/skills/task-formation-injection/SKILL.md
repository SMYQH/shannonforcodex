---
name: task-formation-injection
description: "Deduplicate injection observations into one task per attacker-controlled input, operation, and context. Use before exploitation planning."
---

# task-formation-injection

Use this skill to reconcile injection observations into tasks. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Boundary
One task = one attacker-controlled input reaching one dangerous operation in one injection context. Split on independently controlled inputs, different contexts, or materially different defenses.

## Workflow
1. Read the `injection_exploitation_queue.json` queue plus source, combined_sources, path, sink_call as one data flow; use slot_type and sanitization_observed to split contexts.
2. Shared sink/CWE/file/line/payload/impact/fix is supporting evidence only. Group only when one proof settles every observation with one verdict.
3. Call `submit_task_groups` once with `vuln_class: injection` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `injection_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped and are worked individually.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
- Shared procedure: original repo `prompts/shared/exploitation/_task-formation-procedure.txt` (archival).

