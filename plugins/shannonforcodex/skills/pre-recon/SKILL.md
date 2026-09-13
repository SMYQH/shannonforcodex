---
name: pre-recon
description: "Security-focused codebase review that builds the architectural baseline and critical-file list for a white-box pentest. Use when starting a new assessment with full source access."
---

# pre-recon

Use this skill when starting a white-box assessment with full source-code access and no prior deliverables. The workflow below is authoritative; `references/original-prompt.txt` is archival context only and its host tool names are not executable here.

## Inputs
- Repository root (read-only), plus writable `.shannon/deliverables/` and `.shannon/scratchpad/`.
- Scope: vulnerability classes under test (e.g. injection, xss, auth, authz, ssrf).

## Workflow
1. Run discovery using your host's code search and reading capabilities: architecture/tech-stack, network-reachable entry points (routes, APIs, webhooks, uploads, plus OpenAPI/GraphQL schemas), and security patterns (auth, session, RBAC, headers). Do not call `task`, `todo_write`, `bash`, or `read` tool names; those are not MCP tools in this plugin.
2. Base every claim SOLELY on source code with exact file paths. Read `.gitignore` and use `git ls-files` to distinguish tracked vs untracked files.
3. Analyze from an external-attacker perspective (no VPN/internal access).
4. Synthesize the full analysis as Markdown and save it with `save_deliverable` using `type: CODE_ANALYSIS`. This plugin does not expose the original Shannon `set_*` collector tools. Do not invent services.

## Outputs
- `pre_recon_deliverable.md` baseline feeding recon, vuln analysis, exploitation, and reporting.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable; do not follow its `task`/`todo_write`/`bash`/`read`/`set_*` tool calls).
- Shared scope and engagement rules: copy from the original repo `apps/worker/prompts/shared/` when available.
- Never log credentials; focus on trust boundaries, privilege paths, and data-flow risks.

