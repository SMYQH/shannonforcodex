---
name: capella-architecture
description: "Build the Capella knowledge base: security-relevant architecture, data flows, zones, and component entities. Use to start agentic SAST."
---

# capella-architecture

## Codex persistence contract
This contract supersedes host-only output and filesystem instructions in the original reference. The plugin has no `report_finding`, `record_*` tools, Capella harness, or automatic status/history updates.

- Inputs: the assigned source files and assessment scope. Treat reference paths such as `findings/`, the KB, and plan.json as data in these snapshots. Read source evidence from the assessment repository. Do not read unrelated runtime or session data.
- Output: A documents object mapping architecture.md, entities/<component>.md, vulnerabilities/<CWE-or-class>.md, index.md, and dependencies.json to their contents.
- Replace each original collector call or harness return with an update to the phase snapshot in memory, then call `save_deliverable` with `type: CAPELLA_ARCHITECTURE` and `content` containing the full JSON object. It writes `.shannon/deliverables/capella_architecture.json`. Save after each finding and at phase completion; preserve earlier findings, original field names, and history. Save `{"documents": {}}` when the phase finds nothing.
- Apply the reference's evidence gates and transition rules yourself before saving: research requires a CWE and source evidence; dedupe retains stable IDs and links; review must not mark VALID with UNKNOWN/FAIL checklist entries or PROVISIONALLY_VALID with FAIL; confirmation needs reached-sink evidence and must not promote unresolved checklist entries. Append each decision to history. The storage tool validates phase shape (documents/investigations/findings/classifications keys, architecture KB layout, research CWE plus code_paths) and rejects mismatches; it does not enforce deeper Capella semantics.

Use this skill to start Capella agentic SAST by synthesizing the knowledge base. The workflow below is authoritative; `references/original-prompt.hbs` is archival context only.

## Workflow
1. Analyze directory structure and key sources; identify components, interfaces, trust boundaries across app, IaC, hardware/RTL, or ML pipelines as applicable.
2. Collect `architecture.md` (flows, zones, design, availability) and `entities/<component>.md` (links to vuln classes, constraints) as entries in the architecture snapshot's `documents` map. Also include `vulnerabilities/<CWE-or-class>.md` entries for relevant bug classes, an `index.md` catalog with one-line summaries linking every file above, and a `dependencies.json` import-edge map (`{}` when no parseable imports exist), matching the archival reference's KB layout.
3. Work from the current directory; build fresh each run (no prior KB).

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable; its `findings/` directory and harness writes are data in this plugin's snapshot).
- Operating principles and tools partials from the original repo when available (archival).

