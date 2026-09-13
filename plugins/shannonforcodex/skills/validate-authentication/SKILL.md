---
name: validate-authentication
description: "Validate supplied credentials by driving a real browser login and saving the session. Use as a preflight check before authenticated testing."
---

# validate-authentication

Use this skill as the auth preflight check. The workflow below is authoritative; `references/original-prompt.txt` is archival context only.

## Workflow
1. Set `SHANNON_ALLOWED_ORIGINS` before launching Codex, then call the `playwright_cli` MCP tool directly with exactly one `-s=<session>` argument (for example `{"args": ["-s=auth", "open", "https://target/login"]}`). There is no `playwright-cli` skill to load in this plugin.
2. Execute the configured login flow exactly once per field (username, password, captcha, and TOTP via the `generate_totp` MCP tool). Any rejection = `login_success:false`, stop, no retry.
3. On success ONLY, run the `playwright_cli` MCP tool with args `["-s=<session>", "state-save", "<AUTH_STATE_FILE>"]` so later phases reuse the session.
4. Report where login broke on failure.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

