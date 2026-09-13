---
name: vuln-authz
description: "White-box authorization analysis (IDOR, RBAC, privilege escalation). Use when auditing access-control enforcement."
---

# vuln-authz

## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

Use this skill for authorization analysis. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- Recon deliverables, role architecture, authz candidates.

## Workflow
1. Map roles, permissions, object references, and enforcement points (middleware, guards, policies) directly with host code search and reading. Do not call `task` sub-agents; that tool name is not available in this plugin.
2. Trace each privileged operation to its check; flag missing/inconsistent checks, predictable IDs, client-side-only enforcement.
3. Verdict vulnerable only for externally reachable bypasses.
4. Save the synthesized Markdown with `save_deliverable` using `type: AUTHZ_ANALYSIS`, then submit one `vulnerabilities` array via `submit_exploitation_queue`.

## Outputs
- `authz_analysis_deliverable.md` plus `authz_exploitation_queue.json`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

