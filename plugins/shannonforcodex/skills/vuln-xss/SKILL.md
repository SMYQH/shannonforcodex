---
name: vuln-xss
description: "White-box XSS analysis (reflected, stored, DOM) via source-to-sink tracing of sinks and encoders. Use when auditing client-side output handling."
---

# vuln-xss

## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

Use this skill for XSS analysis. No live exploitation in this phase. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- Recon and pre-recon deliverables; browser available via the `playwright_cli` MCP tool for sink confirmation only (no payload firing beyond analysis needs).

## Workflow
1. Enumerate sources (params, storage, postMessage, URL fragments) and sinks (`innerHTML`, `document.write`, template interpolation, `eval`-like sinks).
2. Trace each path directly with host code search and reading; record encoder/escaper chain per path and its output context (HTML, attribute, JS, URL, CSS). Do not call a `task` sub-agent; that tool name is not available in this plugin.
3. Verdict vulnerable only for context-mismatched or missing encoding on a reachable path with `externally_exploitable=true`.
4. Save the synthesized Markdown with `save_deliverable` using `type: XSS_ANALYSIS`, then submit one `vulnerabilities` array via `submit_exploitation_queue` with witness payload tailored to the sink context.

## Outputs
- `xss_analysis_deliverable.md` plus `xss_exploitation_queue.json`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

