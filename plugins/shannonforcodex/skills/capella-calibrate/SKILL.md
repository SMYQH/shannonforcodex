---
name: capella-calibrate
description: "Calibrate confirmed Capella findings for severity and confidence. Use after confirm."
---

# capella-calibrate

## Codex persistence contract
This contract supersedes host-only output and filesystem instructions in the original reference. The plugin has no `report_finding`, `record_*` tools, Capella harness, or automatic status/history updates.

- Inputs: `.shannon/deliverables/capella_confirm.json`. Treat reference paths such as `findings/`, the KB, and plan.json as data in these snapshots. Read source evidence from the assessment repository. Do not read unrelated runtime or session data.
- Output: The complete findings array with calibrated severity/confidence and appended calibration history. Hand surviving VALID findings to the matching sast-enrichment skill; retain finding_id as _sastId. Static confirmation is not live exploitation proof.
- Replace each original collector call or harness return with an update to the phase snapshot in memory, then call `save_deliverable` with `type: CAPELLA_CALIBRATE` and `content` containing the full JSON object. It writes `.shannon/deliverables/capella_calibrate.json`. Save after each finding and at phase completion; preserve earlier findings, original field names, and history. Save `{"findings": []}` when the phase finds nothing.
- Apply the reference's evidence gates and transition rules yourself before saving: research requires a CWE and source evidence; dedupe retains stable IDs and links; review must not mark VALID with UNKNOWN/FAIL checklist entries or PROVISIONALLY_VALID with FAIL; confirmation needs reached-sink evidence and must not promote unresolved checklist entries. Append each decision to history. The storage tool validates phase shape, required architecture/threat-model artifacts, finding history, and research evidence; it does not enforce deeper Capella transition semantics.

Use this skill to calibrate severity/confidence consistently before export. Read `.shannon/deliverables/capella_confirm.json` first and persist through the Codex persistence contract above. `references/original-prompt.hbs` is archival context only.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).

