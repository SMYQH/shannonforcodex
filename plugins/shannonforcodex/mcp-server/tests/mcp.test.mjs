import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const config = JSON.parse(readFileSync(join(pluginRoot, ".mcp.json"), "utf8")).mcpServers["shannon-mcp"];

async function connect(t, { explicitWorkspace = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "shannon-mcp-"));
  const workspace = join(root, "assessment with spaces");
  const cwd = explicitWorkspace ? join(root, "launcher directory") : workspace;
  mkdirSync(workspace, { recursive: true });
  mkdirSync(cwd, { recursive: true });
  const cliDir = join(root, "trusted cli with spaces");
  const pkgDir = join(cliDir, "node_modules/@playwright/cli");
  mkdirSync(pkgDir, { recursive: true });
  writeFileSync(join(pkgDir, "package.json"), JSON.stringify({ name: "@playwright/cli", bin: { "playwright-cli": "entry.cjs" } }));
  writeFileSync(join(pkgDir, "entry.cjs"), `
const args = process.argv.slice(2);
console.log(JSON.stringify({ args, cwd: process.cwd(), leakedSecret: process.env.SHANNON_TEST_SECRET ?? null }));
if (args.includes('--fail')) process.exit(7);
if (args.includes('--wait')) setTimeout(() => {}, 30000);
`);
  const env = {
    ...getDefaultEnvironment(),
    PATH: `${cliDir}${delimiter}${process.env.PATH ?? ""}`,
    SHANNON_ALLOWED_ORIGINS: "https://assessment-a.invalid",
    SHANNON_PLAYWRIGHT_CLI_PATH: join(pkgDir, "entry.cjs"),
    SHANNON_TEST_SECRET: "must-not-reach-browser",
    ...(explicitWorkspace ? { SHANNON_WORKSPACE: workspace } : {}),
  };
  // Expand the same plugin-root placeholder that the host expands, then start
  // from an unrelated assessment cwd. Never chdir into the plugin installation.
  assert.equal(config.command, "node");
  const args = config.args.map((arg) => arg.replaceAll("${PLUGIN_ROOT}", pluginRoot));
  const client = new Client({ name: "shannon-regression", version: "1.0.0" });
  const transport = new StdioClientTransport({ command: process.execPath, args, cwd, env, stderr: "pipe" });
  t.after(async () => {
    await client.close();
    const absolute = resolve(root);
    assert.ok(absolute.startsWith(resolve(tmpdir()) + sep) && absolute.includes("shannon-mcp-"));
    rmSync(absolute, { recursive: true, force: true });
  });
  await client.connect(transport);
  return { client, workspace, dir: join(workspace, ".shannon/deliverables") };
}

async function call(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result.content));
  return result;
}

async function rejects(client, name, args, pattern) {
  const result = await client.callTool({ name, arguments: args });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result.content), pattern);
}

const meta = { target: "https://assessment-a.invalid", assessment_date: "2026-09-06", scope: "Synthetic fixture", executive_summary: "Fixture summary" };
const finding = { finding_id: "INJ-01", title: "Synthetic finding", severity: "high", overview: "Synthetic evidence" };
const queueItem = (ID) => ({ ID, vulnerability_type: "injection", externally_exploitable: true, confidence: "high", sink: "fixture.ts:1" });

test("configured entrypoint starts outside the plugin and writes to the session workspace", async (t) => {
  const { client, workspace, dir } = await connect(t);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 7);
  writeFileSync(join(workspace, "source.md"), "Workspace content");
  const result = await call(client, "save_deliverable", { type: "CODE_ANALYSIS", file_path: "source.md" });
  assert.equal(result.structuredContent.filepath, join(dir, "pre_recon_deliverable.md"));
  assert.equal(readFileSync(result.structuredContent.filepath, "utf8"), "Workspace content");
});

test("explicit workspace controls deliverables and the shell-free browser launcher", async (t) => {
  const { client, workspace, dir } = await connect(t, { explicitWorkspace: true });
  const result = await call(client, "save_deliverable", { type: "RECON", content: "Fixture recon" });
  assert.equal(result.structuredContent.filepath, join(dir, "recon_deliverable.md"));
  const args = ["-s=fixture", "eval", '() => "spaces & | ^ %PATH% $(literal) `tick` \\"quoted\\""'];
  const browser = await call(client, "playwright_cli", { args });
  assert.deepEqual(JSON.parse(browser.content[0].text), { args, cwd: workspace, leakedSecret: null });
  await rejects(client, "playwright_cli", { args: ["-s=fixture", "goto", "https://outside.invalid"] }, /outside SHANNON_ALLOWED_ORIGINS/);
  await rejects(client, "playwright_cli", { args: ["--help"] }, /Exactly one/);
  await rejects(client, "playwright_cli", { args: ["-s=one", "-s=two"] }, /Exactly one/);
  await rejects(client, "playwright_cli", { args: ["-s=fixture", "--fail"] }, /exited 7/);
  assert.equal(existsSync(join(dir, "playwright_cli_output.txt")), false);
  await rejects(client, "playwright_cli", { args: ["-s=fixture", "--wait"], timeout_seconds: 1 }, /ETIMEDOUT/);
});

test("TOTP follows the RFC 6238 SHA-1 vector", async (t) => {
  const { client } = await connect(t);
  const result = await call(client, "generate_totp", {
    secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
    timestamp: 59,
  });
  assert.equal(result.structuredContent.code, "287082");
  await rejects(client, "generate_totp", { secret: "A", timestamp: 59 }, /empty|secret/);
});

test("report procedure fields survive MCP validation, persistence, rendering, and reload", async (t) => {
  const { client, dir } = await connect(t);
  await rejects(client, "add_finding", finding, /set_report_meta/);
  await call(client, "set_report_meta", meta);
  await rejects(client, "set_report_meta", { ...meta, target: "   " }, /must not be empty/);
  await rejects(client, "set_report_meta", { ...meta, assessment_date: "2026-02-30" }, /calendar date/);
  await call(client, "set_report_meta", { ...meta, executive_summary: "Summary\n# injected heading" });
  const prose = { kind: "prose", text: "Observed synthetic response" };
  const code = { kind: "code", block: { language: "http", content: "GET /fixture\nX-Literal: ```" } };
  const complete = {
    ...finding, category: "Injection", confidence: "high", owasp_category: "Synthetic category",
    vulnerable_location: "routes/fixture.ts:17", http_location: { method: "GET", url: "https://assessment-a.invalid/fixture", parameter: "id" },
    auth_state: "Unauthenticated", prerequisites: "None", status: "exploited",
    exploitation_steps: [{ title: "Read fixture", items: [prose, code] }, { title: null, items: [prose] }],
    proof_of_impact: [prose, code], impact: "Fixture impact", remediation: "Fixture remediation",
    notes: [prose], additional_sections: [{ heading: "Fixture appendix", items: [code] }],
  };
  await call(client, "add_finding", complete);
  const reportPath = join(dir, "report.json");
  assert.deepEqual(JSON.parse(readFileSync(reportPath, "utf8")).findings, [complete]);
  const markdown = readFileSync(join(dir, "comprehensive_security_assessment_report.md"), "utf8");
  for (const text of [complete.vulnerable_location, "Step 1: Read fixture", prose.text, code.block.content, "Proof of impact", "Fixture appendix", "````http"]) assert.ok(markdown.includes(text), text);
  assert.ok(markdown.includes("\\# injected heading"));
  const before = readFileSync(reportPath, "utf8");
  await rejects(client, "add_finding", { ...finding, finding_id: "UNKNOWN", proof_of_impct: "Typo" }, /Unrecognized key/);
  await rejects(client, "add_finding", { ...complete, finding_id: "NESTED", exploitation_steps: [{ title: "Bad", items: [{ ...prose, typo: true }] }] }, /Unrecognized key/);
  await rejects(client, "add_finding", complete, /Duplicate finding_id/);
  assert.equal(readFileSync(reportPath, "utf8"), before);
  await call(client, "add_finding", { ...finding, finding_id: "LEGACY", location: "legacy location", reproduction: "legacy reproduction", proof_of_impact: "Plain text proof" });
  const reloaded = readFileSync(join(dir, "comprehensive_security_assessment_report.md"), "utf8");
  assert.ok(reloaded.includes(complete.vulnerable_location) && reloaded.includes("legacy reproduction") && reloaded.includes("Plain text proof"));
});

test("analysis and SAST queues merge without loss and reject conflicting IDs atomically", async (t) => {
  const { client, dir } = await connect(t);
  const submit = (vulnerabilities) => call(client, "submit_exploitation_queue", { vuln_class: "injection", vulnerabilities });
  const analysis = queueItem("INJ-VULN-01");
  const sast = { ...queueItem("INJ-SAST-01"), _sastId: "original-static-id" };
  await submit([analysis]);
  assert.equal((await submit([sast])).structuredContent.count, 2);
  await submit([]);
  await submit([analysis]);
  const path = join(dir, "injection_exploitation_queue.json");
  const before = readFileSync(path, "utf8");
  assert.deepEqual(JSON.parse(before).vulnerabilities, [analysis, sast]);
  await rejects(client, "submit_exploitation_queue", { vuln_class: "injection", vulnerabilities: [queueItem("NEW"), { ...analysis, confidence: "low" }] }, /Conflicting queue ID/);
  await rejects(client, "submit_exploitation_queue", { vuln_class: "injection", vulnerabilities: [analysis, analysis] }, /Duplicate queue ID/);
  assert.equal(readFileSync(path, "utf8"), before);
  await call(client, "submit_exploitation_queue", { vuln_class: "xss", vulnerabilities: [queueItem("XSS-SAST-01")] });
  await call(client, "submit_exploitation_queue", { vuln_class: "xss", vulnerabilities: [queueItem("XSS-VULN-01")] });
  assert.equal(JSON.parse(readFileSync(join(dir, "xss_exploitation_queue.json"), "utf8")).vulnerabilities.length, 2);
});

test("report identity changes are rejected and separate assessments can reuse finding IDs", async (t) => {
  const { client, dir } = await connect(t);
  await call(client, "set_report_meta", meta);
  await call(client, "add_finding", finding);
  await call(client, "set_report_meta", { ...meta, executive_summary: "Updated same assessment" });
  const before = readFileSync(join(dir, "report.json"), "utf8");
  assert.equal(JSON.parse(before).findings.length, 1);
  await rejects(client, "set_report_meta", { ...meta, target: "https://assessment-b.invalid", executive_summary: "No findings" }, /Assessment boundary/);
  await rejects(client, "set_report_meta", { ...meta, assessment_date: "2026-09-07" }, /Assessment boundary/);
  assert.equal(readFileSync(join(dir, "report.json"), "utf8"), before);
  const other = await connect(t, { explicitWorkspace: true });
  await call(other.client, "set_report_meta", { ...meta, target: "https://assessment-b.invalid", executive_summary: "No findings" });
  assert.deepEqual(JSON.parse(readFileSync(join(other.dir, "report.json"), "utf8")).findings, []);
  await call(other.client, "add_finding", finding);
});

test("all exploitation and Capella phase outputs persist through the supported tool", async (t) => {
  const { client, dir } = await connect(t);
  const { tools } = await client.listTools();
  const types = tools.find((tool) => tool.name === "save_deliverable").inputSchema.properties.type.enum;
  const phases = types.filter((type) => type.startsWith("CAPELLA_") || type.endsWith("_EXPLOITATION_EVIDENCE"));
  assert.equal(phases.length, 16);
  const capellaFixture = (type) => {
    if (type === "CAPELLA_ARCHITECTURE" || type === "CAPELLA_THREAT_MODEL") {
      if (type === "CAPELLA_ARCHITECTURE") {
        return JSON.stringify({ documents: { "architecture.md": "# Fixture", "entities/fixture.md": "# Fixture", "vulnerabilities/CWE-79.md": "# Fixture", "index.md": "# Fixture", "dependencies.json": "{}" } });
      }
      return JSON.stringify({ documents: { "THREAT_MODEL.md": "# Fixture\n\nIntent: SAMPLE_OR_TEST_ONLY" } });
    }
    if (type === "CAPELLA_PLAN") {
      return JSON.stringify({ investigations: [{ title: "Fixture", target_files: ["fixture.ts"], kb_references: [], question: "Fixture?" }] });
    }
    if (type === "CAPELLA_TRIAGE") {
      return JSON.stringify({ classifications: { "fixture.ts": { potentially_flawed: false, reason: "fixture" } } });
    }
    if (type === "CAPELLA_RESEARCH") {
      return JSON.stringify({ findings: [{ finding_id: "SYNTHETIC", title: "Synthetic finding", severity: "low", overview: "Synthetic evidence", cwe: "CWE-79", code_paths: ["fixture.ts:1"], status: "PROVISIONALLY_VALID", history: [{ phase: type }] }] });
    }
    return JSON.stringify({ findings: [{ finding_id: "SYNTHETIC", history: [{ phase: type }] }] });
  };
  for (const type of phases) {
    const content = type.startsWith("CAPELLA_") ? capellaFixture(type) : "# Synthetic evidence\n\nID: SYNTHETIC\nStatus: false positive\nDisproof: fixture only";
    const result = await call(client, "save_deliverable", { type, content });
    const extension = type.startsWith("CAPELLA_") ? "json" : "md";
    assert.equal(result.structuredContent.filepath, join(dir, `${type.toLowerCase()}.${extension}`));
    assert.equal(readFileSync(result.structuredContent.filepath, "utf8"), content);
  }
  const research = join(dir, "capella_research.json");
  const before = readFileSync(research, "utf8");
  await rejects(client, "save_deliverable", { type: "CAPELLA_RESEARCH", content: "{" }, /JSON|phase validation/);
  await rejects(client, "save_deliverable", { type: "CAPELLA_ARCHITECTURE", content: JSON.stringify({ findings: [] }) }, /phase validation/);
  await rejects(client, "save_deliverable", { type: "CAPELLA_RESEARCH", content: JSON.stringify({ findings: [{ finding_id: "SYNTHETIC" }] }) }, /cwe|code_paths|phase validation/);
  await call(client, "save_deliverable", { type: "CAPELLA_ARCHITECTURE", content: JSON.stringify({ documents: {} }) });
  await call(client, "save_deliverable", { type: "CAPELLA_THREAT_MODEL", content: JSON.stringify({ documents: {} }) });
  assert.equal(readFileSync(research, "utf8"), before);
});

test("workspace containment, empty-path handling, and task-group reconciliation hold", async (t) => {
  const { client, dir } = await connect(t);
  await rejects(client, "save_deliverable", { type: "RECON" }, /Provide content or file_path/);
  const empty = await call(client, "save_deliverable", { type: "RECON", content: "" });
  assert.equal(readFileSync(empty.structuredContent.filepath, "utf8"), "");
  await rejects(client, "save_deliverable", { type: "RECON", file_path: "" }, /non-empty/);
  await rejects(client, "save_deliverable", { type: "RECON", file_path: "../outside.md" }, /workspace/);
  await rejects(client, "save_deliverable", { type: "RECON", file_path: "C:/Windows/win.ini" }, /workspace|relative/);
  await rejects(client, "submit_task_groups", { vuln_class: "xss", groups: [{ queue_labels: ["XSS-01", "XSS-02"], reasoning: "fixture" }] }, /without an existing/);
  await call(client, "submit_exploitation_queue", { vuln_class: "injection", vulnerabilities: [queueItem("INJ-VULN-01"), queueItem("INJ-VULN-02")] });
  await rejects(client, "submit_task_groups", { vuln_class: "injection", groups: [{ queue_labels: ["INJ-VULN-01", "MISSING"], reasoning: "fixture" }] }, /not found/);
  await rejects(client, "submit_task_groups", { vuln_class: "injection", groups: [{ queue_labels: ["INJ-VULN-01", "INJ-VULN-02"], reasoning: "a" }, { queue_labels: ["INJ-VULN-02", "INJ-VULN-01"], reasoning: "b" }] }, /multiple groups/);
  const grouped = await call(client, "submit_task_groups", { vuln_class: "injection", groups: [{ queue_labels: ["INJ-VULN-01", "INJ-VULN-02"], reasoning: "shared sink fixture" }] });
  assert.equal(grouped.structuredContent.count, 1);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "injection_task_groups.json"), "utf8")).groups.length, 1);
});
