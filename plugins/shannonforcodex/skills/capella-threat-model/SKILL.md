---
name: capella-threat-model
description: "Derive threat model from the Capella knowledge base. Use after capella-architecture."
---

# capella-threat-model

## Codex persistence contract
This contract supersedes host-only output and filesystem instructions in the original reference. The plugin has no `report_finding`, `record_*` tools, Capella harness, or automatic status/history updates.

- Inputs: `.shannon/deliverables/capella_architecture.json`. Treat reference paths such as `findings/`, the KB, and plan.json as data in these snapshots. Read source evidence from the assessment repository. Do not read unrelated runtime or session data.
- Output: A documents object containing THREAT_MODEL.md plus an intent verdict field with exactly one of Intent: PRODUCTION or Intent: SAMPLE_OR_TEST_ONLY.
- Replace each original collector call or harness return with an update to the phase snapshot in memory, then call `save_deliverable` with `type: CAPELLA_THREAT_MODEL` and `content` containing the full JSON object. It writes `.shannon/deliverables/capella_threat_model.json`. Save after each finding and at phase completion; preserve earlier findings, original field names, and history. Save `{"documents": {}}` when the phase finds nothing.
- Apply the reference's evidence gates and transition rules yourself before saving: research requires a CWE and source evidence; dedupe retains stable IDs and links; review must not mark VALID with UNKNOWN/FAIL checklist entries or PROVISIONALLY_VALID with FAIL; confirmation needs reached-sink evidence and must not promote unresolved checklist entries. Append each decision to history. The storage tool validates phase shape, required architecture/threat-model artifacts, finding history, and research evidence; it does not enforce deeper Capella transition semantics.

Use this skill after capella-architecture to produce the threat model from the KB (actors, threats, attack paths per component). The workflow below is authoritative; `references/original-prompt.hbs` is archival context only.

## Workflow
1. Read `.shannon/deliverables/capella_architecture.json` and derive actors, trust boundaries, high-risk assets, and attack paths per component.
2. Persist the result through the Codex persistence contract above.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).

