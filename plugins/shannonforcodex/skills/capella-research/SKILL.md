---
name: capella-research
description: "Execute Capella research tasks with confined read-only repository tools. Use to gather vuln evidence per plan."
---

# capella-research

## Codex persistence contract
This contract supersedes host-only output and filesystem instructions in the original reference. The plugin has no `report_finding`, `record_*` tools, Capella harness, or automatic status/history updates.

- Inputs: `.shannon/deliverables/capella_architecture.json`, `.shannon/deliverables/capella_threat_model.json`, `.shannon/deliverables/capella_plan.json`. Treat reference paths such as `findings/`, the KB, and plan.json as data in these snapshots. Read source evidence from the assessment repository. Do not read unrelated runtime or session data.
- Output: A findings array with stable finding_id values, all report_finding fields, status PROVISIONALLY_VALID, and history.
- Replace each original collector call or harness return with an update to the phase snapshot in memory, then call `save_deliverable` with `type: CAPELLA_RESEARCH` and `content` containing the full JSON object. It writes `.shannon/deliverables/capella_research.json`. Save after each finding and at phase completion; preserve earlier findings, original field names, and history. Save `{"findings": []}` when the phase finds nothing.
- Apply the reference's evidence gates and transition rules yourself before saving: research requires a CWE and source evidence; dedupe retains stable IDs and links; review must not mark VALID with UNKNOWN/FAIL checklist entries or PROVISIONALLY_VALID with FAIL; confirmation needs reached-sink evidence and must not promote unresolved checklist entries. Append each decision to history. The storage tool validates phase shape (documents/investigations/findings/classifications keys, architecture KB layout, research CWE plus code_paths) and rejects mismatches; it does not enforce deeper Capella semantics.

Use this skill to execute research tasks using confined read/find/search tools. Respect path confinement and operation budgets; exclude `.git`, `.shannon`, and `.pi` from source-code searches. Read only the explicit Capella input snapshots under `.shannon/deliverables/` and save the phase output through the persistence contract above. `references/original-prompt.hbs` is archival context only; its `report_finding` tool name is not available in this plugin.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).

