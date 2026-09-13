# Repository Guidelines

## Project Structure & Module Organization

This repository packages Shannon as a Codex plugin. The plugin lives under `plugins/shannonforcodex/`:

- `.codex-plugin/plugin.json` and `.mcp.json` define the plugin and MCP wiring.
- `skills/` contains 37 skill directories, each with a `SKILL.md`; `scripts/gen_skills.py` regenerates them.
- `mcp-server/src/index.ts` implements the stdio MCP server; `dist/` is its TypeScript build output.
- `hooks/hooks.json` contains the session-start scope reminder.
- `.agents/plugins/marketplace.json` registers the local marketplace entry.

There is no separate application test or asset tree. Keep generated deliverables and local runtime data out of source changes.

## Build, Test, and Development Commands

Run commands from the repository root unless noted:

```bash
cd plugins/shannonforcodex/mcp-server
npm ci                 # Install the locked dependency set
npm run build          # Compile strict TypeScript into mcp-server/dist
npm start              # Run the built stdio MCP server
```

After changing skill definitions, run `python plugins/shannonforcodex/scripts/gen_skills.py` and review the generated `SKILL.md` files. The MCP server validates with `npm run build` plus `npm test` (7 tools, queue merging, report rendering, Capella snapshots, workspace containment).

## Coding Style & Naming Conventions

Use two spaces in TypeScript and JSON, strict TypeScript with ES modules, and `camelCase` for variables/functions. Use `snake_case` for Python names, kebab-case for skill directories, and uppercase `SKILL.md` filenames. Preserve YAML front matter and tool/schema names exactly. No formatter or linter is configured, so keep changes focused and consistent with nearby code.

## Testing Guidelines

Run `npm run build` and `npm test` for MCP changes; the suite covers entrypoint isolation, queue merging, report rendering, Capella snapshots, and workspace containment. For generator changes, regenerate skills and confirm the expected skill count and front matter remain intact.

## Security & Configuration

Use Shannon only against authorized test environments; production systems are out of scope. Never commit or log credentials, TOTP secrets, session state, or sensitive deliverables. Keep TOTP handling in memory and use the existing MCP tool. Do not bypass or remove the scope guard without an explicit security review.

## Commit & Pull Request Guidelines

This checkout has no commit history, so no established message convention can be confirmed. Use a short, imperative subject (for example, `Add SSRF skill guidance`). PRs should explain behavior and scope, list validation commands and results, identify regenerated files, and link an issue when one exists. Include screenshots only when documenting a user-visible change.
