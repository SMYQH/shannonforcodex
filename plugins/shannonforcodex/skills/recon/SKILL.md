---
name: recon
description: "Map the network-reachable attack surface by correlating live app behavior with source code. Use after pre-recon to inventory endpoints, inputs, and trust boundaries."
---

# recon

Use this skill after pre-recon to build the attack-surface map. You are NOT hunting vulnerabilities yet. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- `.shannon/deliverables/pre_recon_deliverable.md` (required starting intel).
- Target URL, repo read-only checkout, login instructions when auth is in scope.

## Workflow
1. Read the pre-recon deliverable first; derive targets from it.
2. Verify scope: only components reachable via the deployed app's network interface are in scope. Exclude CLI-only tools, build scripts, and dev servers.
3. Correlate live behavior with code: endpoints, params, auth flows, tech stack, defenses (WAF, rate limits). For browser work, set `SHANNON_ALLOWED_ORIGINS` before launching Codex and call the `playwright_cli` MCP tool directly with exactly one `-s=<session>` argument (for example `{"args": ["-s=recon", "open", "https://target/"]}`). There is no `playwright-cli` skill to load in this plugin.
4. Synthesize the attack-surface map as Markdown and save it with `save_deliverable` using `type: RECON`. This plugin does not expose the original Shannon recon collector tools.

## Outputs
- `recon_deliverable.md`: components, data flows, endpoints, input vectors, security boundaries.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

