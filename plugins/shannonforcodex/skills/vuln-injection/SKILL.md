---
name: vuln-injection
description: "White-box injection analysis (SQLi, command, LFI/RFI, SSTI, traversal, deserialization) via source-to-sink tracing. Use when auditing backend command construction."
---

# vuln-injection

## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

Use this skill for injection analysis. No live exploitation in this phase. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- `.shannon/deliverables/recon_deliverable.md` and `pre_recon_deliverable.md`.
- Injection sources list; every source starts as TAINTED until a sink-matching sanitizer is proven.

## Workflow
1. Track each injection source to completion using your host's task tracking; analyze each fully, never terminate early.
2. Trace each code path directly with host code search and reading: tainted flow, sanitizers in order, concatenations (flag concat AFTER sanitization as ineffective), sink construction. Do not call a `task` sub-agent; that tool name is not available in this plugin.
3. Label sinks and slots: SQL-val/like/num/enum/ident, CMD-argument/part-of-string, FILE-path/include, TEMPLATE-expression, DESERIALIZE-object, PATH-component.
4. Verdict vulnerable ONLY when tainted input reaches a slot with absent/mismatched defense AND `externally_exploitable=true` (public internet, no internal access).
5. Save the synthesized Markdown with `save_deliverable` using `type: INJECTION_ANALYSIS`, then submit one `vulnerabilities` array via `submit_exploitation_queue` with the required ID, vulnerability_type, externally_exploitable, confidence, and sink-specific fields.

## Outputs
- `injection_analysis_deliverable.md` plus `injection_exploitation_queue.json`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

