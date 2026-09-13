"""Generate 37 SKILL.md files for shannonforcodex plugin."""
from pathlib import Path

PLUGIN = Path(__file__).resolve().parents[1] / "skills"

# Short UI metadata for Codex discovery. Kept in the generator so regeneration
# preserves agents/openai.yaml alongside SKILL.md.
AGENT_META = {
"pre-recon": ("Pre-Recon Baseline", "White-box codebase review and architecture baseline", "Start a white-box assessment with $pre-recon."),
"recon": ("Attack Surface Map", "Live attack-surface inventory from code plus browser", "Use $recon to map the network-reachable attack surface."),
"vuln-injection": ("Injection Analysis", "Source-to-sink injection review with queue output", "Use $vuln-injection to audit backend command construction."),
"vuln-xss": ("XSS Analysis", "Source-to-sink XSS review with sink-context payloads", "Use $vuln-xss to audit client-side output handling."),
"vuln-auth": ("Auth Analysis", "Login, session, MFA, and OAuth flow review", "Use $vuln-auth to audit identity and credential flows."),
"vuln-authz": ("AuthZ Analysis", "IDOR, RBAC, and privilege-escalation review", "Use $vuln-authz to audit access-control enforcement."),
"vuln-ssrf": ("SSRF Analysis", "Server-side request construction review", "Use $vuln-ssrf to audit URL fetch and webhook sinks."),
"exploit-injection": ("Injection Exploitation", "Prove injection impact with canary-only evidence", "Use $exploit-injection to prove queued injection findings."),
"exploit-xss": ("XSS Exploitation", "Prove XSS with benign browser payloads", "Use $exploit-xss to prove queued XSS findings."),
"exploit-auth": ("Auth Exploitation", "Prove auth impact with synthetic accounts", "Use $exploit-auth to prove queued auth findings."),
"exploit-authz": ("AuthZ Exploitation", "Prove IDOR and escalation with canary objects", "Use $exploit-authz to prove queued authz findings."),
"exploit-ssrf": ("SSRF Exploitation", "Prove SSRF with controlled canary callbacks", "Use $exploit-ssrf to prove queued SSRF findings."),
"exploit-miscellaneous": ("Misc Exploitation", "Prove findings outside the five main tracks", "Use $exploit-miscellaneous to prove queued misc findings."),
"task-formation-injection": ("Injection Task Groups", "Deduplicate injection queue into proof tasks", "Use $task-formation-injection before injection exploitation."),
"task-formation-xss": ("XSS Task Groups", "Deduplicate XSS queue into proof tasks", "Use $task-formation-xss before XSS exploitation."),
"task-formation-auth": ("Auth Task Groups", "Deduplicate auth queue into proof tasks", "Use $task-formation-auth before auth exploitation."),
"task-formation-authz": ("AuthZ Task Groups", "Deduplicate authz queue into proof tasks", "Use $task-formation-authz before authz exploitation."),
"task-formation-ssrf": ("SSRF Task Groups", "Deduplicate SSRF queue into proof tasks", "Use $task-formation-ssrf before SSRF exploitation."),
"task-formation-miscellaneous": ("Misc Task Groups", "Deduplicate misc queue into proof tasks", "Use $task-formation-miscellaneous before misc exploitation."),
"sast-enrichment-injection": ("SAST Injection Enrich", "Normalize SAST injection findings to queue", "Use $sast-enrichment-injection to enrich static injection results."),
"sast-enrichment-xss": ("SAST XSS Enrich", "Normalize SAST XSS findings to queue", "Use $sast-enrichment-xss to enrich static XSS results."),
"sast-enrichment-auth": ("SAST Auth Enrich", "Normalize SAST auth findings to queue", "Use $sast-enrichment-auth to enrich static auth results."),
"sast-enrichment-authz": ("SAST AuthZ Enrich", "Normalize SAST authz findings to queue", "Use $sast-enrichment-authz to enrich static authz results."),
"sast-enrichment-ssrf": ("SAST SSRF Enrich", "Normalize SAST SSRF findings to queue", "Use $sast-enrichment-ssrf to enrich static SSRF results."),
"sast-enrichment-miscellaneous": ("SAST Misc Enrich", "Normalize misc SAST findings to queue", "Use $sast-enrichment-miscellaneous to enrich static results."),
"validate-authentication": ("Auth Preflight", "Browser login check with TOTP and session save", "Use $validate-authentication before authenticated testing."),
"report-executive": ("Executive Report", "Record verified findings via report tools", "Use $report-executive to produce the executive report."),
"capella-architecture": ("Capella Architecture", "Security architecture knowledge base", "Use $capella-architecture to start agentic SAST."),
"capella-threat-model": ("Capella Threat Model", "Actors, boundaries, and attack paths", "Use $capella-threat-model after architecture."),
"capella-plan": ("Capella Plan", "Prioritized research investigations", "Use $capella-plan after threat modeling."),
"capella-research": ("Capella Research", "Confined evidence gathering per plan", "Use $capella-research to gather vuln evidence."),
"capella-dedupe": ("Capella Dedupe", "Merge duplicate research findings", "Use $capella-dedupe after research."),
"capella-review": ("Capella Review", "Validity and severity review", "Use $capella-review after dedupe."),
"capella-critic": ("Capella Critic", "Adversarial false-positive filter", "Use $capella-critic after review."),
"capella-confirm": ("Capella Confirm", "Static confirmation with code evidence", "Use $capella-confirm after critic."),
"capella-calibrate": ("Capella Calibrate", "Severity and confidence calibration", "Use $capella-calibrate after confirm."),
"capella-triage": ("Capella Triage", "Rapid file-level flaw classification", "Use $capella-triage to prioritize files."),
}

SKILLS = {
"pre-recon": {
"description": "Security-focused codebase review that builds the architectural baseline and critical-file list for a white-box pentest. Use when starting a new assessment with full source access.",
"body": """Use this skill when starting a white-box assessment with full source-code access and no prior deliverables. The workflow below is authoritative; `references/original-prompt.txt` is archival context only and its host tool names are not executable here.

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
""",
},
"recon": {
"description": "Map the network-reachable attack surface by correlating live app behavior with source code. Use after pre-recon to inventory endpoints, inputs, and trust boundaries.",
"body": """Use this skill after pre-recon to build the attack-surface map. You are NOT hunting vulnerabilities yet. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- `.shannon/deliverables/pre_recon_deliverable.md` (required starting intel).
- Target URL, repo read-only checkout, login instructions when auth is in scope.

## Workflow
1. Read the pre-recon deliverable first; derive targets from it.
2. Verify scope: only components reachable via the deployed app's network interface are in scope. Exclude CLI-only tools, build scripts, and dev servers.
3. Correlate live behavior with code: endpoints, params, auth flows, tech stack, defenses (WAF, rate limits). For browser work, call the `playwright_cli` MCP tool directly with exactly one `-s=<session>` argument (for example `{"args": ["-s=recon", "open", "https://target/"]}`). There is no `playwright-cli` skill to load in this plugin.
4. Synthesize the attack-surface map as Markdown and save it with `save_deliverable` using `type: RECON`. This plugin does not expose the original Shannon recon collector tools.

## Outputs
- `recon_deliverable.md`: components, data flows, endpoints, input vectors, security boundaries.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"vuln-injection": {
"description": "White-box injection analysis (SQLi, command, LFI/RFI, SSTI, traversal, deserialization) via source-to-sink tracing. Use when auditing backend command construction.",
"body": """Use this skill for injection analysis. No live exploitation in this phase. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

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
""",
},
"vuln-xss": {
"description": "White-box XSS analysis (reflected, stored, DOM) via source-to-sink tracing of sinks and encoders. Use when auditing client-side output handling.",
"body": """Use this skill for XSS analysis. No live exploitation in this phase. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

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
""",
},
"vuln-auth": {
"description": "White-box authentication analysis (login, session, MFA, password reset, OAuth). Use when auditing identity and credential flows.",
"body": """Use this skill for authentication analysis. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

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
""",
},
"vuln-authz": {
"description": "White-box authorization analysis (IDOR, RBAC, privilege escalation). Use when auditing access-control enforcement.",
"body": """Use this skill for authorization analysis. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

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
""",
},
"vuln-ssrf": {
"description": "White-box SSRF analysis (URL fetch, webhooks, file inclusion via URL). Use when auditing server-side request construction.",
"body": """Use this skill for SSRF analysis. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

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
""",
},
"exploit-injection": {
"description": "Prove injection impact with payloads, data extraction, or command execution against the live target. Use with an injection exploitation queue.",
"body": """Use this skill to weaponize the injection queue. Every item must end as exploited or proven false-positive. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- `injection_exploitation_queue.json` (mandatory todo list) plus `injection_task_groups.json` when task formation ran, and pre-recon, recon, and analysis deliverables for intel (exact queries, DB/OS types, WAF notes).
- Target URL ONLY. Production systems are out of scope; this engagement is authorized test-environment only.

## Safety guardrails
- Use only synthetic test accounts and minimal canary values. Extract at most one canary row or field per table to prove access; never dump full tables or the first five sensitive rows.
- Never extract credentials, session tokens, or PII beyond the canary. Never access cloud instance-metadata endpoints, never open reverse shells, never run broad port scans, and never pivot beyond the in-scope target.
- Respect rate limits: one request at a time for intrusive probes, stop on lockout or instability, and document the constraint as blocked rather than forcing through it.

## Workflow
1. Track each queue item with your host's task tracking; finish one vulnerability fully before moving on. Do not call `todo_write`; that tool name is not available in this plugin.
2. Follow confirm -> enumerate -> exfiltrate (SQLi) or confirm -> probe -> impact (command injection). Adapt to observed DB/OS, not assumptions. When `injection_task_groups.json` exists, work grouped labels together with one shared proof.
3. Run probes with your host's request execution and the `playwright_cli` MCP tool (exactly one `-s=<session>` argument) for browser paths. Do not call `task` or `bash` tool names; those are not MCP tools in this plugin.
4. Document payload, command, output, and discrepancy vs analysis intel for every attempt.

## Outputs
- `injection_exploitation_evidence.md` with proof or documented non-exploitability per item.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"exploit-xss": {
"description": "Prove XSS impact in a real browser (reflected, stored, DOM). Use with an XSS exploitation queue.",
"body": """Use this skill to prove XSS with real browser execution. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- `xss_exploitation_queue.json` plus `xss_task_groups.json` when task formation ran, and prior deliverables. Target URL only.

## Safety guardrails
- Use benign proof payloads only (for example `console.log('xss-canary')` or a canary alert token). Never exfiltrate cookies, tokens, or user data beyond proving script execution.
- Stay in the authorized test environment with synthetic accounts. Respect rate limits and stop on instability.

## Workflow
1. Work one queue item at a time to a final verdict using your host's task tracking. Do not call `todo_write`; that tool name is not available in this plugin. When `xss_task_groups.json` exists, work grouped labels together with one shared browser proof.
2. Call the `playwright_cli` MCP tool directly as the primary harness with exactly one `-s=<session>` argument: navigate, inject, confirm script execution, screenshot. There is no `playwright-cli` skill to load in this plugin.
3. Distinguish reflected/stored/DOM; capture payload, URL, DOM evidence, and screenshots.
4. Never exfiltrate beyond proof; stay in the authorized test environment.

## Outputs
- `xss_exploitation_evidence.md`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"exploit-auth": {
"description": "Prove authentication impact (credential abuse, session hijack, MFA bypass, account takeover). Use with an auth exploitation queue.",
"body": """Use this skill to prove auth flaws with tangible impact. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- `auth_exploitation_queue.json` plus `auth_task_groups.json` when task formation ran, and recon/analysis intel. Target URL only.

## Safety guardrails
- Use only synthetic test accounts provisioned for this assessment. Never test credential stuffing with real or breached credentials, never lock out real users, and never extract session tokens beyond proving access.
- Respect rate limits and lockout signals: stop on account lockout or instability and record the constraint as blocked.

## Workflow
1. Work the queue exhaustively, one item to verdict, using your host's task tracking. When `auth_task_groups.json` exists, work grouped labels together with one shared proof.
2. Drive multi-step login, reset, and cookie-injection flows in a real browser by calling the `playwright_cli` MCP tool directly with exactly one `-s=<session>` argument; use the `generate_totp` MCP tool for MFA steps.
3. Prove impact (authenticated access, takeover) with payloads, requests, and screenshots; log failed attempts fully.
4. Never include real credentials in findings; refer to the `generate_totp` MCP tool without exposing the secret.

## Outputs
- `auth_exploitation_evidence.md`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"exploit-authz": {
"description": "Prove authorization impact (IDOR, horizontal/vertical escalation). Use with an authz exploitation queue.",
"body": """Use this skill to prove access-control bypasses. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- `authz_exploitation_queue.json` plus `authz_task_groups.json` when task formation ran, and role architecture and recon intel. Target URL only.

## Safety guardrails
- Use only synthetic test accounts for each role (anonymous, low-priv, high-priv). Access only canary objects you own; never access real user data beyond proving the bypass with one canary object per boundary.
- Respect rate limits and stop on instability; document constraints as blocked.

## Workflow
1. Test each queue item across roles (anonymous, low-priv, high-priv) to a verdict, using your host's task tracking. When `authz_task_groups.json` exists, work grouped labels together with one shared proof.
2. Call the `playwright_cli` MCP tool directly (exactly one `-s=<session>` argument) for browser flows plus direct API replay; compare object access, status codes, and data leakage per role.
3. Capture request/response proof for every success; document failed bypasses.

## Outputs
- `authz_exploitation_evidence.md`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"exploit-ssrf": {
"description": "Prove SSRF impact (internal fetch, metadata access, OOB). Use with an SSRF exploitation queue.",
"body": """Use this skill to prove SSRF against the live target. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- `ssrf_exploitation_queue.json` plus `ssrf_task_groups.json` when task formation ran, and prior intel. Target URL only; use controlled OOB endpoints (Interactsh, own DNS/HTTP, Burp Collaborator).

## Safety guardrails
- Prove server-side fetch with a controlled canary URL you own (DNS/HTTP callback or echo service). Never request cloud instance-metadata endpoints (for example 169.254.169.254 or metadata.google.internal), never extract credentials or tokens, never pivot into internal networks, and never run broad port scans.
- One probe at a time; stop on instability and record the constraint as blocked.

## Workflow
1. Work one item at a time using your host's task tracking: confirm fetch against your controlled canary, test allowlist/redirect handling, then demonstrate impact as an OOB callback or canary fetch only. When `ssrf_task_groups.json` exists, work grouped labels together with one shared proof.
2. Run probes with your host's request execution; call the `playwright_cli` MCP tool directly (exactly one `-s=<session>` argument) only for JS-heavy flows. Do not call a `task` agent; that tool name is not available in this plugin.
3. Never pivot into internal networks beyond the canary proof; document all attempts.

## Outputs
- `ssrf_exploitation_evidence.md`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"exploit-miscellaneous": {
"description": "Prove miscellaneous-class findings that fall outside the five main tracks. Use with a miscellaneous exploitation queue.",
"body": """Use this skill for findings outside injection/xss/auth/authz/ssrf. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Inputs
- Miscellaneous queue plus `miscellaneous_task_groups.json` when task formation ran, and prior deliverables. Target URL only.

## Safety guardrails
- Use only synthetic test accounts and canary data. Prove impact with minimal evidence (one canary record, benign browser proof, or controlled callback). Never extract credentials, tokens, or PII; never access cloud metadata; never open reverse shells; never run broad port scans or pivot beyond the target.
- Respect rate limits; stop on instability and record the constraint as blocked.

## Workflow
1. Work each item to exploited or false-positive using your host's task tracking. Do not call `todo_write`; that tool name is not available in this plugin. When task groups exist, work grouped labels together with one shared proof.
2. Choose the right harness per finding: call the `playwright_cli` MCP tool directly (exactly one `-s=<session>` argument) for browser paths, or your host's request execution for API paths. Do not call `task` or `bash` tool names; those are not MCP tools in this plugin.
3. Capture proof and failed attempts.

## Outputs
- `miscellaneous_exploitation_evidence.md`.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"task-formation-injection": {
"description": "Deduplicate injection observations into one task per attacker-controlled input, operation, and context. Use before exploitation planning.",
"body": """Use this skill to reconcile injection observations into tasks. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Boundary
One task = one attacker-controlled input reaching one dangerous operation in one injection context. Split on independently controlled inputs, different contexts, or materially different defenses.

## Workflow
1. Read the `injection_exploitation_queue.json` queue plus source, combined_sources, path, sink_call as one data flow; use slot_type and sanitization_observed to split contexts.
2. Shared sink/CWE/file/line/payload/impact/fix is supporting evidence only. Group only when one proof settles every observation with one verdict.
3. Call `submit_task_groups` once with `vuln_class: injection` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `injection_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped and are worked individually.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
- Shared procedure: original repo `prompts/shared/exploitation/_task-formation-procedure.txt` (archival).
""",
},
"task-formation-xss": {
"description": "Deduplicate XSS observations into one task per source, sink, and encoding context. Use before XSS exploitation planning.",
"body": """Use this skill to reconcile XSS observations. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Boundary
One task = one source reaching one sink in one output-encoding context. Split on different sinks, contexts, or defenses.

## Workflow
1. Read the `xss_exploitation_queue.json` queue; compare source, sink, encoding chain, and context; group only when one browser proof settles all.
2. Call `submit_task_groups` once with `vuln_class: xss` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `xss_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"task-formation-auth": {
"description": "Deduplicate auth observations into one task per flow and failure mode. Use before auth exploitation planning.",
"body": """Use this skill to reconcile auth observations into tasks (one flow + one failure mode each). Read the `auth_exploitation_queue.json` queue first. Call `submit_task_groups` once with `vuln_class: auth` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `auth_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"task-formation-authz": {
"description": "Deduplicate authz observations into one task per operation and role boundary. Use before authz exploitation planning.",
"body": """Use this skill to reconcile authz observations (one operation + one role boundary each). Read the `authz_exploitation_queue.json` queue first. Call `submit_task_groups` once with `vuln_class: authz` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `authz_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"task-formation-ssrf": {
"description": "Deduplicate SSRF observations into one task per URL input and fetch sink. Use before SSRF exploitation planning.",
"body": """Use this skill to reconcile SSRF observations (one URL input + one fetch sink each). Read the `ssrf_exploitation_queue.json` queue first. Call `submit_task_groups` once with `vuln_class: ssrf` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `ssrf_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"task-formation-miscellaneous": {
"description": "Deduplicate miscellaneous observations into executable tasks. Use before miscellaneous exploitation planning.",
"body": """Use this skill to reconcile miscellaneous observations into tasks. Read the `miscellaneous_exploitation_queue.json` queue first. Call `submit_task_groups` once with `vuln_class: miscellaneous` and a `groups` array. Each group must contain at least two `queue_labels` and nonblank `reasoning`. The matching exploit skill consumes `miscellaneous_task_groups.json` by working grouped labels together; singleton observations stay in the queue ungrouped. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"sast-enrichment-injection": {
"description": "Transform raw SAST injection findings into normalized vulnerability objects with sink-tailored payloads. Use when enriching static results.",
"body": """Use this skill to enrich SAST injection findings. The rules below are authoritative; reference files are archival context only.

## Rules
- Tailor `witness_payload` to the actual sink code (e.g. LIKE-context needs `%' OR '%'='`, not generic `' OR 1=1--`).
- Set `slot_type` from the real SQL/command/file context; list path sanitizers in `sanitization_observed` with why they fail in `mismatch_reason`.
- `externally_exploitable=true` only for user-controlled HTTP input (params, headers, body, cookies).
- Copy `_sastId` exactly; never invent or renumber it.
- Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: injection` and the required queue fields.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
- Shared procedure: original repo `prompts/shared/exploitation/_sast-enrichment-procedure.txt` (archival).
""",
},
"sast-enrichment-xss": {
"description": "Transform raw SAST XSS findings into normalized vulnerability objects. Use when enriching static XSS results.",
"body": """Use this skill to enrich SAST XSS findings into vulnerability objects with sink-context payloads. Copy `_sastId` exactly; set externally_exploitable only for user-controlled input. Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: xss`. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"sast-enrichment-auth": {
"description": "Transform raw SAST auth findings into normalized vulnerability objects. Use when enriching static auth results.",
"body": """Use this skill to enrich SAST auth findings into vulnerability objects. Copy `_sastId` exactly; set externally_exploitable only for user-controlled input. Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: auth`. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"sast-enrichment-authz": {
"description": "Transform raw SAST authz findings into normalized vulnerability objects. Use when enriching static authz results.",
"body": """Use this skill to enrich SAST authz findings into vulnerability objects. Copy `_sastId` exactly; set externally_exploitable only for user-controlled input. Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: authz`. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"sast-enrichment-ssrf": {
"description": "Transform raw SAST SSRF findings into normalized vulnerability objects. Use when enriching static SSRF results.",
"body": """Use this skill to enrich SAST SSRF findings into vulnerability objects. Copy `_sastId` exactly; set externally_exploitable only for user-controlled input. Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: ssrf`. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"sast-enrichment-miscellaneous": {
"description": "Transform raw SAST miscellaneous findings into normalized vulnerability objects. Use when enriching static results outside the five main classes.",
"body": """Use this skill to enrich miscellaneous SAST findings into vulnerability objects. Copy `_sastId` exactly; set externally_exploitable only for user-controlled input. Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: miscellaneous`. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"validate-authentication": {
"description": "Validate supplied credentials by driving a real browser login and saving the session. Use as a preflight check before authenticated testing.",
"body": """Use this skill as the auth preflight check. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Workflow
1. Call the `playwright_cli` MCP tool directly with exactly one `-s=<session>` argument (for example `{"args": ["-s=auth", "open", "https://target/login"]}`). There is no `playwright-cli` skill to load in this plugin.
2. Execute the configured login flow exactly once per field (username, password, captcha, and TOTP via the `generate_totp` MCP tool). Any rejection = `login_success:false`, stop, no retry.
3. On success ONLY, run the `playwright_cli` MCP tool with args `["-s=<session>", "state-save", "<AUTH_STATE_FILE>"]` so later phases reuse the session.
4. Report where login broke on failure.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"report-executive": {
"description": "Synthesize verified findings into structured report data via add_finding. Use as the final pipeline step to produce the executive report.",
"body": """Use this skill as the final reporting step. You do NOT write Markdown; a downstream renderer does. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Workflow
1. Orient: read every participating class's `*_exploitation_evidence.md` under `.shannon/deliverables/` plus pre-recon and recon. Use the assessment's class order, with miscellaneous last. For an analysis-only run, use the class analysis deliverables instead. Preserve finding IDs (`INJ-01`, `AUTH-03`) exactly. The comprehensive report is the output, not an input aggregation file.
2. Filter: keep real findings, rewrite category-only titles from location+overview, drop restatements (first write-up wins; later angles of the same defect are dropped).
3. Record metadata ONCE via the `set_report_meta` MCP tool with `target`, `assessment_date`, `scope`, and `executive_summary`.
4. Record each finding ONCE via `add_finding`; duplicates are rejected. If none survive, call no `add_finding` and state no vulns found (plus not-assessed classes when present).
5. Never put credentials in any submitted field. Report rendering is automatic: the MCP server writes `comprehensive_security_assessment_report.md` after metadata and findings are recorded.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
""",
},
"capella-architecture": {
"description": "Build the Capella knowledge base: security-relevant architecture, data flows, zones, and component entities. Use to start agentic SAST.",
"body": """Use this skill to start Capella agentic SAST by synthesizing the knowledge base. The workflow below is authoritative; `references/original-prompt.hbs` is archival context only.

## Workflow
1. Analyze directory structure and key sources; identify components, interfaces, trust boundaries across app, IaC, hardware/RTL, or ML pipelines as applicable.
2. Collect `architecture.md` (flows, zones, design, availability) and `entities/<component>.md` (links to vuln classes, constraints) as entries in the architecture snapshot's `documents` map. Also include `vulnerabilities/<CWE-or-class>.md` entries for relevant bug classes, an `index.md` catalog with one-line summaries linking every file above, and a `dependencies.json` import-edge map (`{}` when no parseable imports exist), matching the archival reference's KB layout.
3. Work from the current directory; build fresh each run (no prior KB).

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable; its `findings/` directory and harness writes are data in this plugin's snapshot).
- Operating principles and tools partials from the original repo when available (archival).
""",
},
"capella-threat-model": {
"description": "Derive threat model from the Capella knowledge base. Use after capella-architecture.",
"body": """Use this skill after capella-architecture to produce the threat model from the KB (actors, threats, attack paths per component). The workflow below is authoritative; `references/original-prompt.hbs` is archival context only.

## Workflow
1. Read `.shannon/deliverables/capella_architecture.json` and derive actors, trust boundaries, high-risk assets, and attack paths per component.
2. Persist the result through the Codex persistence contract above.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
"capella-plan": {
"description": "Plan Capella research tasks from architecture and threat model. Use after threat modeling.",
"body": """Use this skill to plan the research swarm: prioritize components and vuln classes, assign research tasks. The workflow below is authoritative; `references/original-prompt.hbs` is archival context only.

## Workflow
1. Read `.shannon/deliverables/capella_architecture.json` and `.shannon/deliverables/capella_threat_model.json`; enumerate investigations with stable task IDs, target files, and research objectives.
2. Persist the result through the Codex persistence contract above.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
"capella-research": {
"description": "Execute Capella research tasks with confined read-only repository tools. Use to gather vuln evidence per plan.",
"body": """Use this skill to execute research tasks using confined read/find/search tools. Respect path confinement and operation budgets; exclude `.git`, `.shannon`, and `.pi` from source-code searches. Read only the explicit Capella input snapshots under `.shannon/deliverables/` and save the phase output through the persistence contract above. `references/original-prompt.hbs` is archival context only; its `report_finding` tool name is not available in this plugin.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
"capella-dedupe": {
"description": "Deduplicate Capella research findings into unique vulnerabilities. Use after research.",
"body": """Use this skill to dedupe research findings: merge same-defect observations, keep distinct contexts separate. Read `.shannon/deliverables/capella_research.json` first and persist through the Codex persistence contract above. `references/original-prompt.hbs` is archival context only; its `record_duplicates` tool name is not available in this plugin.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
"capella-review": {
"description": "Review deduped Capella findings for validity and severity. Use after dedupe.",
"body": """Use this skill to review each deduped finding for validity, reachability, and severity reasoning. Read `.shannon/deliverables/capella_dedupe.json` first and persist through the Codex persistence contract above. `references/original-prompt.hbs` is archival context only; its `record_review_verdict` tool name is not available in this plugin.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
"capella-critic": {
"description": "Critique reviewed Capella findings to catch false positives. Use after review.",
"body": """Use this skill to adversarially critique reviewed findings; reject or downgrade unproven claims. Read `.shannon/deliverables/capella_review.json` first and persist through the Codex persistence contract above. `references/original-prompt.hbs` is archival context only; its `record_viability` tool name is not available in this plugin.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
"capella-confirm": {
"description": "Confirm surviving Capella findings with static evidence. Use after critic.",
"body": """Use this skill to statically confirm surviving findings with code evidence (no live exploitation). Read `.shannon/deliverables/capella_critic.json` first and persist through the Codex persistence contract above. `references/original-prompt.hbs` is archival context only; its `record_static_confirmation` tool name is not available in this plugin.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
"capella-calibrate": {
"description": "Calibrate confirmed Capella findings for severity and confidence. Use after confirm.",
"body": """Use this skill to calibrate severity/confidence consistently before export. Read `.shannon/deliverables/capella_confirm.json` first and persist through the Codex persistence contract above. `references/original-prompt.hbs` is archival context only.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
"capella-triage": {
"description": "Rapidly classify assigned source files for possible flaws before Capella research. Use to prioritize files for deeper review.",
"body": """Use this skill for the source procedure's rapid triage sweep. Classify each assigned file with `potentially_flawed` and `reason`, keyed by file path. This is a research input, not a confirmed finding or exploitation verdict. `references/original-prompt.hbs` is archival context only.

## References
- Archival source procedure: `references/original-prompt.hbs` (non-executable).
""",
},
}

CAPELLA_PHASES = {
    "architecture": ([], "A documents object mapping architecture.md, entities/<component>.md, vulnerabilities/<CWE-or-class>.md, index.md, and dependencies.json to their contents."),
    "threat-model": (["architecture"], "A documents object containing THREAT_MODEL.md plus an intent verdict field with exactly one of Intent: PRODUCTION or Intent: SAMPLE_OR_TEST_ONLY."),
    "plan": (["architecture", "threat-model"], "An investigations array carrying stable titles, target_files, kb_references, and research questions."),
    "research": (["architecture", "threat-model", "plan"], "A findings array with stable finding_id values, all report_finding fields, status PROVISIONALLY_VALID, and history."),
    "dedupe": (["research"], "The complete findings array with duplicate links and deduplication history."),
    "review": (["dedupe"], "The complete findings array with status, reasoning, repro_hints, triage_checklist, and appended review history."),
    "critic": (["review"], "The complete findings array with viability assessments and appended critic history."),
    "confirm": (["critic"], "The complete findings array with repro_status, repro_hints, permitted status promotions, and appended confirmation history."),
    "calibrate": (["confirm"], "The complete findings array with calibrated severity/confidence and appended calibration history. Hand surviving VALID findings to the matching sast-enrichment skill; retain finding_id as _sastId. Static confirmation is not live exploitation proof."),
    "triage": ([], "A classifications object keyed by each assigned file path, with potentially_flawed and reason. Supply it to planning/research when used."),
}

CAPELLA_EMPTY_SENTINELS = {
    "architecture": 'Save `{"documents": {}}` when the phase finds nothing.',
    "threat-model": 'Save `{"documents": {}}` when the phase finds nothing.',
    "plan": 'Save `{"investigations": []}` when the phase finds nothing.',
    "research": 'Save `{"findings": []}` when the phase finds nothing.',
    "dedupe": 'Save `{"findings": []}` when the phase finds nothing.',
    "review": 'Save `{"findings": []}` when the phase finds nothing.',
    "critic": 'Save `{"findings": []}` when the phase finds nothing.',
    "confirm": 'Save `{"findings": []}` when the phase finds nothing.',
    "calibrate": 'Save `{"findings": []}` when the phase finds nothing.',
    "triage": 'Save `{"classifications": {}}` when the phase finds nothing.',
}


def persistence_contract(name):
    if name.startswith("exploit-"):
        vuln_class = name.removeprefix("exploit-")
        return f"""## Codex persistence contract
This contract supersedes the original reference's host-only output instructions. This plugin uses `save_deliverable`; `add_exploit` and the original host renderer are unavailable.

- Compose the complete evidence Markdown and call `save_deliverable` with `type: {vuln_class.upper()}_EXPLOITATION_EVIDENCE` and `content`. The tool writes `.shannon/deliverables/{vuln_class}_exploitation_evidence.md` verbatim. Writing Markdown through this tool is required in this plugin.
- After each final verdict, save the cumulative document, retaining earlier entries. Each queue ID must have one disposition: exploited, blocked by an external constraint, or false positive with its disproof. Include unprocessed IDs explicitly until resolved. Save a no-findings document for an empty queue.
- Preserve queue IDs. For each real finding include title, status, severity (only when supported), vulnerable location, overview, auth context without secrets, prerequisites, ordered reproduction steps with commands and observed outputs, proof of impact, and remediation. Separate false positives and unprocessed entries from reportable evidence.
- The reporting skill reads these per-class files directly. Do not wait for a host to concatenate or render them, or use the reference's `workspace/*_false_positives.md` path.

"""
    if name.startswith("capella-"):
        phase = name.removeprefix("capella-")
        inputs, output = CAPELLA_PHASES[phase]
        input_paths = ", ".join(f"`.shannon/deliverables/capella_{item.replace('-', '_')}.json`" for item in inputs)
        return f"""## Codex persistence contract
This contract supersedes host-only output and filesystem instructions in the original reference. The plugin has no `report_finding`, `record_*` tools, Capella harness, or automatic status/history updates.

- Inputs: {input_paths or 'the assigned source files and assessment scope'}. Treat reference paths such as `findings/`, the KB, and plan.json as data in these snapshots. Read source evidence from the assessment repository. Do not read unrelated runtime or session data.
- Output: {output}
- Replace each original collector call or harness return with an update to the phase snapshot in memory, then call `save_deliverable` with `type: CAPELLA_{phase.upper().replace('-', '_')}` and `content` containing the full JSON object. It writes `.shannon/deliverables/capella_{phase.replace('-', '_')}.json`. Save after each finding and at phase completion; preserve earlier findings, original field names, and history. {CAPELLA_EMPTY_SENTINELS[phase]}
- Apply the reference's evidence gates and transition rules yourself before saving: research requires a CWE and source evidence; dedupe retains stable IDs and links; review must not mark VALID with UNKNOWN/FAIL checklist entries or PROVISIONALLY_VALID with FAIL; confirmation needs reached-sink evidence and must not promote unresolved checklist entries. Append each decision to history. The storage tool validates phase shape (documents/investigations/findings/classifications keys, architecture KB layout, research CWE plus code_paths) and rejects mismatches; it does not enforce deeper Capella semantics.

"""
    if name.startswith(("vuln-", "sast-enrichment-")):
        return """## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

"""
    if name == "report-executive":
        return """## Codex reporting contract
These instructions supersede the original reference's host aggregation and schema assumptions. Read per-class evidence files directly before calling `set_report_meta`. A changed target or assessment_date requires separate assessment storage; the server rejects changes to an existing report's identity. Same-assessment summary/scope edits retain findings.

Use the original field names: `vulnerable_location`, `http_location` (`method`, `url`, optional `parameter`), `exploitation_steps` (array of `{title, items}`, title optional), and `proof_of_impact`. Each ordered step item is `{kind: "prose", text: "..."}` or `{kind: "code", block: {language: "bash" | "http" | "json", content: "..."}}`. `proof_of_impact` and optional `notes` accept the same item arrays or plain text. Optional `additional_sections` is an array of `{heading, items}`. The tool preserves and renders these fields. Unknown fields are rejected. In analysis-only mode omit execution evidence fields, and describe impact as assessed. False positives and unprocessed queue entries are not confirmed findings; describe coverage gaps in the summary.

"""
    return ""


count = 0
for name, spec in SKILLS.items():
    p = PLUGIN / name / "SKILL.md"
    p.parent.mkdir(parents=True, exist_ok=True)
    desc = spec['description'].replace('"', "'")
    content = f'---\nname: {name}\ndescription: "{desc}"\n---\n\n# {name}\n\n{persistence_contract(name)}{spec["body"]}\n'
    p.write_text(content, encoding="utf-8")
    display_name, short_description, default_prompt = AGENT_META[name]
    agents_dir = PLUGIN / name / "agents"
    agents_dir.mkdir(parents=True, exist_ok=True)
    (agents_dir / "openai.yaml").write_text(
        "interface:\n"
        f'  display_name: "{display_name}"\n'
        f'  short_description: "{short_description}"\n'
        f'  default_prompt: "{default_prompt}"\n',
        encoding="utf-8",
    )
    count += 1
print(f"wrote {count}")
