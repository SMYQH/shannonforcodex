# Shannon for Codex

这是 Shannon 自主白盒 AI 渗透测试工具的 Codex 插件版本，遵循 `plugin-creator` 的导入规范构建。

## Install

```bash
codex plugin marketplace add https://github.com/SMYQH/shannonforcodex
codex plugin add shannonforcodex@SMYQH-shannonforcodex
```

进入插件目录构建:

```bash
cd ~/.codex/plugins/shannonforcodex/mcp-server
npm ci
npm run build
```

最后重启 Codex 即可。

## Files

```
./plugins/shannonforcodex/
├── .codex-plugin/plugin.json   # Manifest; hooks are discovered from hooks/hooks.json
├── .mcp.json                   # Bundled MCP server -> ./mcp-server/dist/index.js
├── hooks/hooks.json            # SessionStart scope reminder
├── mcp-server/                 # stdio MCP server
├── skills/<37 skills>/         # Skill definitions and original prompt references
└── scripts/gen_skills.py       # Regenerates the 37 Shannon skills

.agents/plugins/marketplace.json # Repository marketplace entry
```

## SKILLS (37 个)

- `pre-recon`（预侦察）, `recon`（侦察）
- `vuln-injection`（注入漏洞）, `vuln-xss`（XSS 漏洞）, `vuln-auth`（认证漏洞）, `vuln-authz`（授权漏洞）, `vuln-ssrf`（SSRF 漏洞）
- `exploit-injection`（注入利用）, `exploit-xss`（XSS 利用）, `exploit-auth`（认证利用）, `exploit-authz`（授权利用）, `exploit-ssrf`（SSRF 利用）, `exploit-miscellaneous`（其他利用）
- `task-formation-*` (6 个), `sast-enrichment-*` (6 个)
- `validate-authentication`（验证认证）, `report-executive`（生成高管报告）
- `capella-*` (10 个：架构、威胁建模、计划、研究、去重、审查、评估、确认、校准、分类)

## MCP 工具

| 工具 | 替代对象 | 备注 |
|---|---|---|
| `save_deliverable` | `save-deliverable` CLI | 保存分析、六类利用证据 Markdown 和十个 Capella 阶段 JSON 快照 |
| `generate_totp` | `generate-totp` CLI | RFC 6238，仅限内存操作 |
| `set_report_meta` | `set-report-meta` CLI | 必须在 `add_finding` 之前调用；拒绝更改已有报告的目标或评估日期 |
| `submit_exploitation_queue` | pi `submit_exploitation_queue` 工具 | 按稳定 ID 合并分析与 SAST 结果；冲突 ID 会被拒绝，空提交保留已有结果 |
| `submit_task_groups` | pi `submit_result` 工具 | 任务编组阶段调用一次；拒绝重复标签 |
| `add_finding` | pi `add_finding` 工具 | 保留并渲染位置、结构化复现步骤和影响证据；拒绝重复 ID 和未知字段 |
| `playwright_cli` | `@playwright/cli` 的 JavaScript 入口 | 通过 Node 运行，支持 Windows；隔离的 `-s=<session>`，默认 120 秒 / 最大 600 秒 |

## 构建 MCP 服务器

```bash
cd plugins/shannonforcodex/mcp-server
npm ci
npm run build
npm test
```

## 工作区与输出契约

MCP 命令会解析已安装插件中的 `${PLUGIN_ROOT}/mcp-server/dist/index.js` 文件，并将宿主会话（host session）的工作目录作为评估工作区。若需从其他目录手动启动，请在运行 Node 之前将 `SHANNON_WORKSPACE` 环境变量设置为评估目录的绝对路径。交付物、相对路径形式的 `file_path` 输入以及浏览器命令均使用该工作区。请针对每个目标或日期使用全新的评估目录；若尝试在现有存储中更改报告标识，系统将予以拒绝。本仓库会忽略运行期间生成的 `.shannon/` 目录；评估仓库也应将 `.shannon/` 目录设为忽略项。

请在评估工作区内或全局安装 `@playwright/cli`（命令：`npm install -g @playwright/cli`）。服务器会解析该包声明的 JavaScript 二进制文件，并直接通过 Node 运行（不经过 shell），从而在 Windows 和 Unix 系统上均能完整保留参数。

生成的技能（skills）所采用的 Codex 持久化契约，其优先级高于捆绑原始提示词（prompts）中仅针对宿主环境的指令。漏洞利用类技能通过 `save_deliverable` 保存累积性的 `*_exploitation_evidence.md` 文档，其中包含误报（false-positive）的处理结果及未处理的 ID 等信息。`report-executive` 工具直接读取这些文件，并由 MCP 服务器生成最终报告。

Capella 技能通过同一工具保存 `capella_<phase>.json` 快照。它们应用原始的证据准入条件（evidence gates）并显式更新状态与历史记录；存储层仅负责校验 JSON 语法。原有的 `report_finding`、`record_*` 和 `add_exploit` 工具不再对外公开。每个生成的 Capella 技能都会明确标识其输入快照及输出格式。

`npm test` 命令利用临时目录中的模拟数据来测试 MCP 协议，涵盖了从其他工作区启动、字面量浏览器参数、持久化、队列合并以及评估边界等场景。
