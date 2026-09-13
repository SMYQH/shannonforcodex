---
name: capella-plan
description: "Plan Capella research tasks from architecture and threat model. Use after threat modeling."
---

# capella-plan

## Codex persistence contract
This contract supersedes host-only output and filesystem instructions in the original reference. The plugin has no `report_finding`, `record_*` tools, Capella harness, or automatic status/history updates.

- Inputs: `.shannon/deliverables/capella_architecture.json`, `.shannon/deliverables/capella_threat_model.json`. Treat reference paths such as `findings/`, the KB, and plan.json as data in these snapshots. Read source evidence from the assessment repository. Do not read unrelated runtime or session data.
- Output: An investigations array carrying stable titles, target_files, kb_references, and research questions.
- Replace each original collector call or harness return with an update to the phase snapshot in memory, then call `save_deliverable` with `type: CAPELLA_PLAN` and `content` containing the full JSON object. It writes `.shannon/deliverables/capella_plan.json`. Save after each finding and at phase completion; preserve earlier findings, original field names, and history. Save `{"investigations": []}` when the phase finds nothing.
- Apply the reference's evidence gates and transition rules yourself before saving: research requires a CWE and source evidence; dedupe retains stable IDs and links; review must not mark VALID with UNKNOWN/FAIL checklist entries or PROVISIONALLY_VALID with FAIL; confirmation needs reached-sink evidence and must not promote unresolved checklist entries. Append each decision to history. The storage tool validates phase shape, required architecture/threat-model artifacts, finding history, and research evidence; it does not enforce deeper Capella transition semantics.

Use this skill to plan the research swarm: prioritize components and vuln classes, assign research tasks. The workflow below is authoritative; `references/original-prompt.hbs` is archival context only.

## Workflow
1. Read `.shannon/deliverables/capella_architecture.json` and `.shannon/deliverables/capella_threat_model.json`; enumerate investigations with stable task IDs, target files, and research objectives.
2. Persist the result through the Codex persistence contract above.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).

