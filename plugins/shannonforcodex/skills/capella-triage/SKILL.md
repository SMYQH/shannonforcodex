---
name: capella-triage
description: "Rapidly classify assigned source files for possible flaws before Capella research. Use to prioritize files for deeper review."
---

# capella-triage

## Codex persistence contract
This contract supersedes host-only output and filesystem instructions in the original reference. The plugin has no `report_finding`, `record_*` tools, Capella harness, or automatic status/history updates.

- Inputs: the assigned source files and assessment scope. Treat reference paths such as `findings/`, the KB, and plan.json as data in these snapshots. Read source evidence from the assessment repository. Do not read unrelated runtime or session data.
- Output: A classifications object keyed by each assigned file path, with potentially_flawed and reason. Supply it to planning/research when used.
- Replace each original collector call or harness return with an update to the phase snapshot in memory, then call `save_deliverable` with `type: CAPELLA_TRIAGE` and `content` containing the full JSON object. It writes `.shannon/deliverables/capella_triage.json`. Save after each finding and at phase completion; preserve earlier findings, original field names, and history. Save `{"classifications": {}}` when the phase finds nothing.
- Apply the reference's evidence gates and transition rules yourself before saving: research requires a CWE and source evidence; dedupe retains stable IDs and links; review must not mark VALID with UNKNOWN/FAIL checklist entries or PROVISIONALLY_VALID with FAIL; confirmation needs reached-sink evidence and must not promote unresolved checklist entries. Append each decision to history. The storage tool validates phase shape (documents/investigations/findings/classifications keys, architecture KB layout, research CWE plus code_paths) and rejects mismatches; it does not enforce deeper Capella semantics.

Use this skill for the source procedure's rapid triage sweep. Classify each assigned file with `potentially_flawed` and `reason`, keyed by file path. This is a research input, not a confirmed finding or exploitation verdict. `references/original-prompt.hbs` is archival context only.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).

