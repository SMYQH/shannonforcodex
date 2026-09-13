---
name: report-executive
description: "Synthesize verified findings into structured report data via add_finding. Use as the final pipeline step to produce the executive report."
---

# report-executive

## Codex reporting contract
These instructions supersede the original reference's host aggregation and schema assumptions. Read per-class evidence files directly before calling `set_report_meta`. A changed target or assessment_date requires separate assessment storage; the server rejects changes to an existing report's identity. Same-assessment summary/scope edits retain findings.

Use the original field names: `vulnerable_location`, `http_location` (`method`, `url`, optional `parameter`), `exploitation_steps` (array of `{title, items}`, title optional), and `proof_of_impact`. Each ordered step item is `{kind: "prose", text: "..."}` or `{kind: "code", block: {language: "bash" | "http" | "json", content: "..."}}`. `proof_of_impact` and optional `notes` accept the same item arrays or plain text. Optional `additional_sections` is an array of `{heading, items}`. The tool preserves and renders these fields. Unknown fields are rejected. In analysis-only mode omit execution evidence fields, and describe impact as assessed. False positives and unprocessed queue entries are not confirmed findings; describe coverage gaps in the summary.

Use this skill as the final reporting step. You do NOT write Markdown; a downstream renderer does. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Workflow
1. Orient: read every participating class's `*_exploitation_evidence.md` under `.shannon/deliverables/` plus pre-recon and recon. Use the assessment's class order, with miscellaneous last. For an analysis-only run, use the class analysis deliverables instead. Preserve finding IDs (`INJ-01`, `AUTH-03`) exactly. The comprehensive report is the output, not an input aggregation file.
2. Filter: keep real findings, rewrite category-only titles from location+overview, drop restatements (first write-up wins; later angles of the same defect are dropped).
3. Record metadata ONCE via the `set_report_meta` MCP tool with `target`, `assessment_date`, `scope`, and `executive_summary`.
4. Record each finding ONCE via `add_finding`; duplicates are rejected. If none survive, call no `add_finding` and state no vulns found (plus not-assessed classes when present).
5. Never put credentials in any submitted field. Report rendering is automatic: the MCP server writes `comprehensive_security_assessment_report.md` after metadata and findings are recorded.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

