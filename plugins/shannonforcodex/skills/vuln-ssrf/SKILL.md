---
name: vuln-ssrf
description: "White-box SSRF analysis (URL fetch, webhooks, file inclusion via URL). Use when auditing server-side request construction."
---

# vuln-ssrf

## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

Use this skill for SSRF analysis. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- Recon/pre-recon deliverables; URL-taking inputs and fetch sinks.

## Workflow
1. Enumerate URL-controlled inputs and sinks (`fetch`, HTTP clients, XML parsers, PDF renderers, webhooks) directly with host code search and reading. Do not call `task` sub-agents; that tool name is not available in this plugin.
2. Evaluate allowlists, DNS rebinding guards, metadata-IP blocks (169.254.x), redirect handling.
3. Verdict vulnerable only for externally reachable fetches bypassing controls.
4. Save the synthesized Markdown with `save_deliverable` using `type: SSRF_ANALYSIS`, then submit one `vulnerabilities` array via `submit_exploitation_queue`.

## Outputs
- `ssrf_analysis_deliverable.md` plus `ssrf_exploitation_queue.json`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

