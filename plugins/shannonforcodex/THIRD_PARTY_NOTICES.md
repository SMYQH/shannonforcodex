# Third-Party Notices

Shannon for Codex is distributed under the GNU Affero General Public License, version 3.0, as declared in `.codex-plugin/plugin.json`.

## Mantis

The Capella prompt material under `skills/*/references/` is adapted from the Mantis project:

- Project: https://github.com/google/mantis
- Upstream commit: `876a0c8c6b92c92f34e0041b7dbbc0e4cccddc52`
- License: Apache License 2.0

The prompt material has been substantially adapted for Shannon and Codex. The Apache License 2.0 applies to the Mantis-derived material and is available at https://www.apache.org/licenses/LICENSE-2.0.

## Runtime dependencies

The MCP server includes these locked open-source dependencies:

- `@modelcontextprotocol/sdk` — MIT
- `zod` — MIT
- `@playwright/cli`, `playwright`, and `playwright-core` — Apache License 2.0

See `mcp-server/package-lock.json` for the exact resolved versions and integrity records. Each dependency remains subject to its own license and notice requirements.
