---
name: vuln-auth
description: "White-box authentication analysis (login, session, MFA, password reset, OAuth). Use when auditing identity and credential flows."
---

# vuln-auth

## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

Use this skill for authentication analysis. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- Recon/pre-recon deliverables, auth code paths, login instructions.

## Workflow
1. Map login, logout, session issuance/validation, MFA/TOTP, reset, lockout, OAuth/OIDC flows directly with host code search and reading. Do not call `task` sub-agents; that tool name is not available in this plugin.
2. Check for weak creds handling, session fixation, token leakage, missing rate limits, MFA bypass paths.
3. Verdict vulnerable only for externally reachable flaws; document safe vectors separately.
4. Save the synthesized Markdown with `save_deliverable` using `type: AUTH_ANALYSIS`, then submit one `vulnerabilities` array via `submit_exploitation_queue`.

## Outputs
- `auth_analysis_deliverable.md` plus `auth_exploitation_queue.json`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

