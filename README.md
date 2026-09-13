# Shannon for Codex

Shannon is packaged here as a Codex plugin for authorized white-box security assessments. Use it only against test environments that you are explicitly authorized to assess; production systems are out of scope.

## Install from GitHub

The marketplace file is nested under `.agents/plugins/`, so pass the sparse path when registering this repository:

```bash
codex plugin marketplace add https://github.com/SMYQH/shannonforcodex.git --sparse .agents/plugins
codex plugin add shannonforcodex --marketplace shannonforcodex
```

Codex installs plugins in a versioned cache. The exact path is:

```text
~/.codex/plugins/cache/<marketplace>/<plugin>/<version>/
```

For this repository, install the MCP runtime dependencies in the active cache copy before first use:

```bash
cd ~/.codex/plugins/cache/SMYQH-shannonforcodex/shannonforcodex/<version>/mcp-server
npm ci
npm run build
```

Replace `<version>` with the directory that Codex installed. For local development, run the same commands from `plugins/shannonforcodex/mcp-server` in the checkout. Start a new Codex thread after reinstalling or rebuilding the plugin.

Before launching Codex, configure the exact target origins that browser automation may access. Use a comma-separated list for multiple targets:

```powershell
$env:SHANNON_ALLOWED_ORIGINS = "https://target.example"
```

The browser runner uses the plugin-local pinned `@playwright/cli` dependency. `SHANNON_PLAYWRIGHT_CLI_PATH` is available only when a separately managed, trusted JavaScript entrypoint is required; it must be an absolute path.

## Repository layout

```text
./plugins/shannonforcodex/
├── .codex-plugin/plugin.json   # Plugin manifest
├── .mcp.json                   # Bundled MCP server wiring
├── hooks/hooks.json            # Session-start scope reminder
├── mcp-server/                 # Stdio MCP server and locked dependencies
├── skills/<37 skills>/         # Generated skill definitions
└── scripts/gen_skills.py       # Regenerates the 37 skills

.agents/plugins/marketplace.json # Repository marketplace entry
```

## Skills

The plugin contains 37 skills covering pre-recon, recon, five vulnerability classes, six bounded exploitation tracks, task formation, SAST enrichment, authentication validation, executive reporting, and ten Capella phases. Generated skills call the MCP tools exposed by this plugin directly; bundled original prompts are archival references only.

## MCP tools

| Tool | Purpose |
|---|---|
| `save_deliverable` | Save analysis, exploitation-evidence Markdown, or Capella phase JSON under its canonical filename. |
| `generate_totp` | Generate a current six-digit RFC 6238 code in memory. Never place the secret in a finding or deliverable. |
| `set_report_meta` | Set report identity and metadata before adding findings; target and assessment date cannot change within one workspace. |
| `submit_exploitation_queue` | Merge analysis and SAST results by stable ID; conflicting IDs are rejected atomically. |
| `submit_task_groups` | Save deduplication groups and require every non-empty group to reference an existing queue. |
| `add_finding` | Validate, persist, and render one structured report finding. |
| `playwright_cli` | Run the trusted browser CLI with one isolated session, a configured origin allowlist, bounded output, and a filtered environment. |

## Build and test

```bash
cd plugins/shannonforcodex/mcp-server
npm ci
npm run build
npm test
```

After changing skill definitions, regenerate them and review the generated files:

```bash
python plugins/shannonforcodex/scripts/gen_skills.py
```

All runtime deliverables are written below the assessment workspace’s `.shannon/deliverables/` directory. Keep credentials, TOTP secrets, browser session state, and sensitive deliverables out of source control.

Capella skills persist complete phase snapshots through `save_deliverable`, including explicit empty sentinels. The MCP server validates JSON shape, required architecture/threat-model artifacts, finding history, and research evidence; phase transition and evidence-gate decisions remain the responsibility of the corresponding skill.
