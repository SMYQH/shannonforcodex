import { createHmac, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runPlaywright } from "./playwright.js";

// The host's session cwd remains the assessment workspace, independent of the
// plugin installation. Manual launches can select a workspace explicitly.
const assessmentWorkspace = resolve(process.env.SHANNON_WORKSPACE || process.cwd());

const requiredText = (label: string) =>
  z.string().refine((value) => value.trim().length > 0, `${label} must not be empty`);

const assessmentDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "assessment_date must use YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }, "assessment_date must be a valid calendar date");

function allowedBrowserOrigins(): Set<string> {
  const raw = process.env.SHANNON_ALLOWED_ORIGINS ?? "";
  const origins = new Set<string>();
  for (const value of raw.split(",").map((item) => item.trim()).filter(Boolean)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Invalid SHANNON_ALLOWED_ORIGINS entry: ${value}`);
    }
    if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
      throw new Error(`SHANNON_ALLOWED_ORIGINS must contain HTTP(S) origins only: ${value}`);
    }
    origins.add(url.origin);
  }
  if (origins.size === 0) {
    throw new Error("Set SHANNON_ALLOWED_ORIGINS before using playwright_cli, for example https://target.example");
  }
  return origins;
}

function validateBrowserTargets(args: string[]): void {
  const origins = allowedBrowserOrigins();
  const urls = args.flatMap((arg) => arg.match(/https?:\/\/[^\s"'`<>]+/gi) ?? []);
  for (const value of urls) {
    let url: URL;
    try {
      url = new URL(value.replace(/[),.;]+$/, ""));
    } catch {
      throw new Error(`Invalid browser URL: ${value}`);
    }
    if (!origins.has(url.origin)) {
      throw new Error(`Browser target ${url.origin} is outside SHANNON_ALLOWED_ORIGINS`);
    }
  }
}

const server = new McpServer(
  { name: "shannon-mcp", version: "1.0.0" },
  {
    instructions:
      "Shannon pentest tooling. Save deliverables with save_deliverable, generate MFA codes with generate_totp, submit vulnerability queues with submit_exploitation_queue, submit task groups with submit_task_groups, write report metadata with set_report_meta before add_finding calls, and drive the browser via playwright_cli. Browser use requires SHANNON_ALLOWED_ORIGINS. Keep secrets out of findings.",
  },
);

const deliverableTypes = [
  "CODE_ANALYSIS",
  "RECON",
  "INJECTION_ANALYSIS",
  "XSS_ANALYSIS",
  "AUTH_ANALYSIS",
  "AUTHZ_ANALYSIS",
  "SSRF_ANALYSIS",
  "INJECTION_EXPLOITATION_EVIDENCE",
  "XSS_EXPLOITATION_EVIDENCE",
  "AUTH_EXPLOITATION_EVIDENCE",
  "AUTHZ_EXPLOITATION_EVIDENCE",
  "SSRF_EXPLOITATION_EVIDENCE",
  "MISCELLANEOUS_EXPLOITATION_EVIDENCE",
  "CAPELLA_ARCHITECTURE",
  "CAPELLA_THREAT_MODEL",
  "CAPELLA_PLAN",
  "CAPELLA_RESEARCH",
  "CAPELLA_DEDUPE",
  "CAPELLA_REVIEW",
  "CAPELLA_CRITIC",
  "CAPELLA_CONFIRM",
  "CAPELLA_CALIBRATE",
  "CAPELLA_TRIAGE",
] as const;

const deliverableTypeSchema = z.enum(deliverableTypes);

const deliverableFilenames: Record<(typeof deliverableTypes)[number], string> = {
  CODE_ANALYSIS: "pre_recon_deliverable.md",
  RECON: "recon_deliverable.md",
  INJECTION_ANALYSIS: "injection_analysis_deliverable.md",
  XSS_ANALYSIS: "xss_analysis_deliverable.md",
  AUTH_ANALYSIS: "auth_analysis_deliverable.md",
  AUTHZ_ANALYSIS: "authz_analysis_deliverable.md",
  SSRF_ANALYSIS: "ssrf_analysis_deliverable.md",
  INJECTION_EXPLOITATION_EVIDENCE: "injection_exploitation_evidence.md",
  XSS_EXPLOITATION_EVIDENCE: "xss_exploitation_evidence.md",
  AUTH_EXPLOITATION_EVIDENCE: "auth_exploitation_evidence.md",
  AUTHZ_EXPLOITATION_EVIDENCE: "authz_exploitation_evidence.md",
  SSRF_EXPLOITATION_EVIDENCE: "ssrf_exploitation_evidence.md",
  MISCELLANEOUS_EXPLOITATION_EVIDENCE: "miscellaneous_exploitation_evidence.md",
  CAPELLA_ARCHITECTURE: "capella_architecture.json",
  CAPELLA_THREAT_MODEL: "capella_threat_model.json",
  CAPELLA_PLAN: "capella_plan.json",
  CAPELLA_RESEARCH: "capella_research.json",
  CAPELLA_DEDUPE: "capella_dedupe.json",
  CAPELLA_REVIEW: "capella_review.json",
  CAPELLA_CRITIC: "capella_critic.json",
  CAPELLA_CONFIRM: "capella_confirm.json",
  CAPELLA_CALIBRATE: "capella_calibrate.json",
  CAPELLA_TRIAGE: "capella_triage.json",
};

const queueVulnClassSchema = z.enum(["injection", "xss", "auth", "authz", "ssrf", "miscellaneous"]);

const queueEntrySchema = z
  .object({
    ID: z.string().min(1).describe("Stable queue ID, for example INJ-VULN-01"),
    vulnerability_type: z.string().min(1),
    externally_exploitable: z.boolean(),
    confidence: z.enum(["high", "medium", "low"]),
  })
  .passthrough();

const taskGroupSchema = z.object({
  queue_labels: z.array(z.string().min(1)).min(2),
  reasoning: z.string().min(1),
});

const capellaDocumentsSchema = z.object({ documents: z.record(z.string(), z.string()) }).passthrough();
const capellaHistorySchema = z.array(z.unknown()).min(1);
const capellaFindingSchema = z.object({
  finding_id: requiredText("finding_id"),
  history: capellaHistorySchema,
}).passthrough();
const capellaResearchFindingSchema = capellaFindingSchema.extend({
  title: requiredText("title"),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  overview: requiredText("overview"),
  cwe: requiredText("cwe"),
  code_paths: z.array(requiredText("code_paths entry")).min(1),
  status: z.literal("PROVISIONALLY_VALID"),
});
const capellaInvestigationsSchema = z.object({
  investigations: z.array(z.object({
    title: z.string().min(1),
    target_files: z.array(z.string().min(1)).min(1),
    kb_references: z.array(z.string()).default([]),
    question: z.string().min(1),
  }).passthrough()),
}).passthrough();
const capellaFindingsSchema = z.object({ findings: z.array(capellaFindingSchema) }).passthrough();
const capellaResearchSchema = z.object({ findings: z.array(capellaResearchFindingSchema) }).passthrough();
const capellaClassificationsSchema = z.object({
  classifications: z.record(z.object({ potentially_flawed: z.boolean(), reason: z.string().min(1) }).passthrough()),
}).passthrough();

const capellaSnapshotSchemas: Record<string, z.ZodTypeAny> = {
  CAPELLA_ARCHITECTURE: capellaDocumentsSchema,
  CAPELLA_THREAT_MODEL: capellaDocumentsSchema,
  CAPELLA_PLAN: capellaInvestigationsSchema,
  CAPELLA_RESEARCH: capellaResearchSchema,
  CAPELLA_DEDUPE: capellaFindingsSchema,
  CAPELLA_REVIEW: capellaFindingsSchema,
  CAPELLA_CRITIC: capellaFindingsSchema,
  CAPELLA_CONFIRM: capellaFindingsSchema,
  CAPELLA_CALIBRATE: capellaFindingsSchema,
  CAPELLA_TRIAGE: capellaClassificationsSchema,
};

function validateCapellaSnapshot(type: string, snapshot: unknown): void {
  const schema = capellaSnapshotSchemas[type];
  if (!schema) return;
  const parsed = schema.safeParse(snapshot);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Capella ${type} snapshot failed phase validation: ${issues}`);
  }
  if (type === "CAPELLA_ARCHITECTURE" && typeof snapshot === "object" && snapshot !== null) {
    const docs = (snapshot as { documents?: Record<string, string> }).documents ?? {};
    const keys = Object.keys(docs);
    if (keys.length === 0) return;
    const hasArchitecture = keys.some((k) => k === "architecture.md" || k.endsWith("/architecture.md"));
    const hasIndex = keys.some((k) => k === "index.md" || k.endsWith("/index.md"));
    const hasEntity = keys.some((k) => k.startsWith("entities/") || k.includes("/entities/"));
    const hasVulnerability = keys.some((k) => k.startsWith("vulnerabilities/") || k.includes("/vulnerabilities/"));
    const hasDependencies = keys.some((k) => k === "dependencies.json" || k.endsWith("/dependencies.json"));
    if (!hasArchitecture || !hasIndex || !hasEntity || !hasVulnerability || !hasDependencies) {
      throw new Error("Capella CAPELLA_ARCHITECTURE snapshot must include architecture.md, entities/<component>.md, vulnerabilities/<CWE-or-class>.md, index.md, and dependencies.json in documents");
    }
  }
  if (type === "CAPELLA_THREAT_MODEL" && typeof snapshot === "object" && snapshot !== null) {
    const docs = (snapshot as { documents?: Record<string, string> }).documents ?? {};
    const keys = Object.keys(docs);
    if (keys.length === 0) return;
    const hasThreatModel = keys.some((k) => k === "THREAT_MODEL.md" || k.endsWith("/THREAT_MODEL.md"));
    const hasIntent = Object.values(docs).some((value) => /^Intent:\s*(PRODUCTION|SAMPLE_OR_TEST_ONLY)\s*$/m.test(value));
    if (!hasThreatModel || !hasIntent) {
      throw new Error("Capella CAPELLA_THREAT_MODEL snapshot must include THREAT_MODEL.md and Intent: PRODUCTION or Intent: SAMPLE_OR_TEST_ONLY");
    }
  }
  if (type === "CAPELLA_RESEARCH" && typeof snapshot === "object" && snapshot !== null) {
    const findings = (snapshot as { findings?: Array<{ cwe?: string; code_paths?: unknown }> }).findings ?? [];
    if (findings.some((f) => !f.cwe || !Array.isArray(f.code_paths) || f.code_paths.length === 0)) {
      throw new Error("Capella CAPELLA_RESEARCH findings require cwe and non-empty code_paths evidence");
    }
  }
}

type ReportMeta = {
  target: string;
  assessment_date: string;
  scope: string;
  executive_summary: string;
};

const reportMetaSchema = z.object({
  target: requiredText("target"),
  assessment_date: assessmentDateSchema,
  scope: requiredText("scope"),
  executive_summary: requiredText("executive_summary"),
}).strict();

const evidenceItemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("prose"), text: z.string() }).strict(),
  z.object({
    kind: z.literal("code"),
    block: z.object({ language: z.string(), content: z.string() }).strict(),
  }).strict(),
]);
const narrativeSchema = z.union([z.string(), z.array(evidenceItemSchema)]);

const reportFindingSchema = z.object({
  finding_id: requiredText("finding_id").describe("Stable report ID, e.g. INJ-01"),
  title: requiredText("title"),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  overview: requiredText("overview"),
  category: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  owasp_category: z.string().optional(),
  vulnerable_location: z.string().optional(),
  http_location: z.object({
    method: z.string(),
    url: z.string(),
    parameter: z.string().nullable().optional(),
  }).strict().nullable().optional(),
  auth_state: z.string().optional(),
  prerequisites: z.string().optional(),
  exploitation_steps: z.array(z.object({
    title: z.string().nullable().optional(),
    items: z.array(evidenceItemSchema),
  }).strict()).optional(),
  proof_of_impact: narrativeSchema.optional(),
  status: z.enum(["exploited", "blocked", "out_of_scope", "blocked_by_constraints", "false_positive"]).nullable().optional(),
  notes: narrativeSchema.nullable().optional(),
  additional_sections: z.array(z.object({
    heading: requiredText("heading"),
    items: z.array(evidenceItemSchema),
  }).strict()).nullable().optional(),
  // Retain the initial plugin's fields for existing callers and saved reports.
  location: z.string().optional(),
  reproduction: z.string().optional(),
  impact: z.string().optional(),
  remediation: z.string().optional(),
}).strict();

type ReportFinding = z.infer<typeof reportFindingSchema>;

type ReportData = {
  report_meta?: ReportMeta;
  findings: ReportFinding[];
};

function deliverablesDir(): string {
  return join(assessmentWorkspace, ".shannon/deliverables");
}

// Resolve a caller-supplied path strictly inside the assessment workspace.
// Rejects absolute paths, `..` escapes, and symlink traversal outside root.
function resolveWorkspacePath(input: string): string {
  if (isAbsolute(input)) throw new Error("file_path must be relative to the assessment workspace");
  const candidate = resolve(assessmentWorkspace, input);
  const root = `${assessmentWorkspace}${sep}`;
  if (candidate !== assessmentWorkspace && !candidate.startsWith(root)) {
    throw new Error("file_path escapes the assessment workspace");
  }
  let realCandidate = candidate;
  try {
    realCandidate = realpathSync(candidate);
  } catch {
    // Missing files resolve lexically; existing parents are checked below.
  }
  let realRoot = assessmentWorkspace;
  try {
    realRoot = realpathSync(assessmentWorkspace);
  } catch {
    // Fall back to the lexical workspace root when it cannot be resolved.
  }
  const realPrefix = `${realRoot}${sep}`;
  if (realCandidate !== realRoot && !realCandidate.startsWith(realPrefix)) {
    throw new Error("file_path resolves outside the assessment workspace");
  }
  if (relative(assessmentWorkspace, candidate).split(sep).includes("..")) {
    throw new Error("file_path escapes the assessment workspace");
  }
  return candidate;
}

function escapeMarkdownField(value: string): string {
  return value.replace(/\r\n|\r|\n/g, " ").replace(/[\\`*_{}[\]()#+!|<>]/g, (ch) => `\\${ch}`);
}

function readReport(reportPath: string): ReportData {
  if (!existsSync(reportPath)) return { findings: [] };
  const parsed = JSON.parse(readFileSync(reportPath, "utf-8")) as Partial<ReportData>;
  if (!Array.isArray(parsed.findings)) {
    throw new Error("report.json is malformed: findings must be an array");
  }
  if (parsed.report_meta !== undefined) {
    const meta = reportMetaSchema.safeParse(parsed.report_meta);
    if (!meta.success) throw new Error("report.json is malformed: report_meta is invalid");
  }
  const findings = z.array(reportFindingSchema).safeParse(parsed.findings);
  if (!findings.success) throw new Error("report.json is malformed: findings are invalid");
  return parsed as ReportData;
}

function renderNarrative(value: z.infer<typeof narrativeSchema>): string[] {
  if (typeof value === "string") return [escapeMarkdownText(value), ""];
  return value.flatMap((item) => {
    if (item.kind === "prose") return [escapeMarkdownText(item.text), ""];
    const { language, content } = item.block;
    const longestFence = Math.max(2, ...(content.match(/`+/g) ?? []).map((run) => run.length));
    const fence = "`".repeat(longestFence + 1);
    return [`${fence}${language.replace(/[\r\n`]/g, "")}`, content, fence, ""];
  });
}

function escapeMarkdownText(value: string): string {
  return value.split(/\r\n|\r|\n/).map(escapeMarkdownField).join("\n");
}

function renderReport(report: ReportData): string {
  const lines = ["# Comprehensive Security Assessment Report", ""];
  const meta = report.report_meta;
  if (meta) {
    lines.push(
      "## Assessment",
      "",
      `- Target: ${escapeMarkdownField(meta.target)}`,
      `- Assessment date: ${escapeMarkdownField(meta.assessment_date)}`,
      `- Scope: ${escapeMarkdownField(meta.scope)}`,
      "",
      escapeMarkdownText(meta.executive_summary),
      "",
    );
  }

  lines.push("## Findings", "");
  if (report.findings.length === 0) {
    lines.push("No findings have been recorded.", "");
  } else {
    for (const finding of report.findings) {
      lines.push(
        `### ${escapeMarkdownField(finding.finding_id)}: ${escapeMarkdownField(finding.title)}`,
        "",
        `**Severity:** ${escapeMarkdownField(finding.severity)}`,
        "",
        escapeMarkdownText(finding.overview),
        "",
      );
      for (const [label, value] of [
        ["Location", finding.location],
        ["Vulnerable location", finding.vulnerable_location],
        ["Category", finding.category],
        ["Confidence", finding.confidence],
        ["OWASP category", finding.owasp_category],
        ["Authentication state", finding.auth_state],
        ["Prerequisites", finding.prerequisites],
        ["Status", finding.status],
        ["Reproduction", finding.reproduction],
        ["Impact", finding.impact],
        ["Remediation", finding.remediation],
      ] as const) {
        if (value) lines.push(`**${label}:** ${escapeMarkdownField(value)}`, "");
      }
      if (finding.http_location) {
        const { method, url, parameter } = finding.http_location;
        lines.push(`**HTTP location:** ${escapeMarkdownField(method)} ${escapeMarkdownField(url)}${parameter ? ` (parameter: ${escapeMarkdownField(parameter)})` : ""}`, "");
      }
      for (const [index, step] of (finding.exploitation_steps ?? []).entries()) {
        lines.push(`#### Step ${index + 1}${step.title ? `: ${escapeMarkdownField(step.title)}` : ""}`, "", ...renderNarrative(step.items));
      }
      if (finding.proof_of_impact) lines.push("**Proof of impact:**", "", ...renderNarrative(finding.proof_of_impact));
      if (finding.notes) lines.push("**Notes:**", "", ...renderNarrative(finding.notes));
      for (const section of finding.additional_sections ?? []) {
        lines.push(`#### ${escapeMarkdownField(section.heading)}`, "", ...renderNarrative(section.items));
      }
    }
  }
  return lines.join("\n");
}

function writeFileAtomic(filepath: string, text: string): void {
  const tmp = `${filepath}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(tmp, text, "utf-8");
  renameSync(tmp, filepath);
}

function writeReport(report: ReportData): { jsonPath: string; markdownPath: string } {
  const dir = deliverablesDir();
  mkdirSync(dir, { recursive: true });
  const jsonPath = join(dir, "report.json");
  const markdownPath = join(dir, "comprehensive_security_assessment_report.md");
  writeFileAtomic(jsonPath, JSON.stringify(report, null, 2));
  writeFileAtomic(markdownPath, renderReport(report));
  return { jsonPath, markdownPath };
}

function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = encoded.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
  if (!clean) throw new Error("TOTP secret is empty after cleaning");
  if (!/^[A-Z2-7]+$/.test(clean)) throw new Error("TOTP secret contains invalid base32 characters");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid base32 character: ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) out.push((value >>> (bits - 8)) & 255);
    bits %= 8;
  }
  const decoded = Buffer.from(out);
  if (decoded.length === 0) throw new Error("TOTP secret decodes to an empty key");
  return decoded;
}

server.registerTool(
  "save_deliverable",
  {
    title: "Save deliverable",
    description:
      "Save the complete phase deliverable under its canonical filename. Supports analysis, exploitation evidence Markdown, and Capella JSON snapshots. Replaces the previous snapshot of this phase.",
    inputSchema: {
      type: deliverableTypeSchema.describe("Deliverable type, e.g. INJECTION_ANALYSIS"),
      content: z.string().optional().describe("Inline content to save"),
      file_path: z.string().optional().describe("Path of a file whose contents to save"),
    },
    outputSchema: {
      filepath: z.string(),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  },
  async ({ type, content, file_path }) => {
    if (content === undefined && file_path === undefined) throw new Error("Provide content or file_path");
    if (content !== undefined && file_path !== undefined) throw new Error("Provide only one of content or file_path");
    if (file_path !== undefined && file_path.trim() === "") throw new Error("file_path must be a non-empty workspace-relative path");
    const text = content ?? readFileSync(resolveWorkspacePath(file_path as string), "utf-8");
    if (type.startsWith("CAPELLA_")) {
      let snapshot: unknown;
      try {
        snapshot = JSON.parse(text);
      } catch {
        throw new Error("Capella snapshot must be valid JSON");
      }
      validateCapellaSnapshot(type, snapshot);
    }
    const dir = deliverablesDir();
    mkdirSync(dir, { recursive: true });
    const filepath = join(dir, deliverableFilenames[type]);
    writeFileAtomic(filepath, text);
    return { structuredContent: { filepath }, content: [{ type: "text", text: filepath }] };
  },
);

server.registerTool(
  "generate_totp",
  {
    title: "Generate TOTP",
    description: "Emit the current 6-digit TOTP code for a base32 secret. Use during login flows with MFA.",
    inputSchema: {
      secret: z.string().describe("Base32-encoded TOTP secret"),
      timestamp: z.number().finite().nonnegative().optional().describe("Unix seconds override for testing"),
    },
    outputSchema: {
      code: z.string(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async ({ secret, timestamp }) => {
    const key = base32Decode(secret);
    const counter = Math.floor((timestamp ?? Date.now() / 1000) / 30);
    const msg = Buffer.alloc(8);
    msg.writeBigUInt64BE(BigInt(counter));
    const hmac = createHmac("sha1", key).update(msg).digest();
    const offset = hmac[hmac.length - 1]! & 0x0f;
    const code =
      ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
    return { structuredContent: { code }, content: [{ type: "text", text: code }] };
  },
);

server.registerTool(
  "set_report_meta",
  {
    title: "Set report metadata",
    description: "Write report metadata before add_finding. Rejects target or assessment_date changes in existing storage; select a fresh assessment workspace for a new assessment.",
    inputSchema: {
      target: requiredText("target"),
      assessment_date: assessmentDateSchema.describe("YYYY-MM-DD"),
      scope: requiredText("scope"),
      executive_summary: requiredText("executive_summary"),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  },
  async ({ target, assessment_date, scope, executive_summary }) => {
    const path = join(deliverablesDir(), "report.json");
    const current = readReport(path);
    if (current.report_meta && (
      current.report_meta.target !== target || current.report_meta.assessment_date !== assessment_date
    )) {
      throw new Error("Assessment boundary: target or assessment_date differs from the saved report. Start the server with SHANNON_WORKSPACE pointing to a separate assessment workspace.");
    }
    current.report_meta = { target, assessment_date, scope, executive_summary };
    const output = writeReport(current);
    return {
      structuredContent: { filepath: output.jsonPath, report_path: output.markdownPath },
      content: [{ type: "text", text: `Report metadata saved to ${output.jsonPath}` }],
    };
  },
);

server.registerTool(
  "submit_exploitation_queue",
  {
    title: "Submit exploitation queue",
    description:
      "Merge findings into a vuln-class queue by stable ID. Distinct analysis and SAST IDs are retained; identical retries are accepted and conflicting IDs are rejected. An empty submission preserves the queue.",
    inputSchema: {
      vuln_class: queueVulnClassSchema,
      vulnerabilities: z.array(queueEntrySchema).describe("Normalized vulnerability objects"),
    },
    outputSchema: {
      count: z.number(),
      filepath: z.string(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  },
  async ({ vuln_class, vulnerabilities }) => {
    const ids = new Set<string>();
    for (const vulnerability of vulnerabilities) {
      if (ids.has(vulnerability.ID)) throw new Error(`Duplicate queue ID: ${vulnerability.ID}`);
      ids.add(vulnerability.ID);
    }
    const dir = deliverablesDir();
    mkdirSync(dir, { recursive: true });
    const filepath = join(dir, `${vuln_class}_exploitation_queue.json`);
    const existing = existsSync(filepath)
      ? z.object({ vulnerabilities: z.array(queueEntrySchema) }).parse(JSON.parse(readFileSync(filepath, "utf-8"))).vulnerabilities
      : [];
    const merged = new Map(existing.map((vulnerability) => [vulnerability.ID, vulnerability]));
    for (const vulnerability of vulnerabilities) {
      const previous = merged.get(vulnerability.ID);
      if (previous && !isDeepStrictEqual(previous, vulnerability)) {
        throw new Error(`Conflicting queue ID: ${vulnerability.ID}. Use distinct producer IDs, such as INJ-VULN-01 and INJ-SAST-01.`);
      }
      merged.set(vulnerability.ID, vulnerability);
    }
    const combined = [...merged.values()];
    writeFileAtomic(filepath, JSON.stringify({ vulnerabilities: combined }, null, 2));
    return {
      structuredContent: { count: combined.length, filepath },
      content: [{ type: "text", text: `Saved ${combined.length} vulnerabilities to ${filepath}` }],
    };
  },
);

server.registerTool(
  "add_finding",
  {
    title: "Add report finding",
    description:
      "Record a single report finding as structured data. Call once per finding after set_report_meta. Rejects duplicate finding IDs.",
    inputSchema: reportFindingSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  },
  async (finding) => {
    const path = join(deliverablesDir(), "report.json");
    const current = readReport(path);
    if (!current.report_meta) throw new Error("Call set_report_meta before add_finding");
    if (current.findings.some((f) => f.finding_id === finding.finding_id)) {
      throw new Error(`Duplicate finding_id: ${finding.finding_id}`);
    }
    current.findings.push({ ...finding });
    const output = writeReport(current);
    return {
      structuredContent: { filepath: output.jsonPath, report_path: output.markdownPath },
      content: [{ type: "text", text: `Recorded ${finding.finding_id}` }],
    };
  },
);

server.registerTool(
  "submit_task_groups",
  {
    title: "Submit task groups",
    description:
      "Record the deduplication groups produced by a task-formation skill. Each label may appear in only one group and must exist in the matching exploitation queue.",
    inputSchema: {
      vuln_class: queueVulnClassSchema,
      groups: z.array(taskGroupSchema),
    },
    outputSchema: {
      count: z.number(),
      filepath: z.string(),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  },
  async ({ vuln_class, groups }) => {
    const labels = new Set<string>();
    for (const group of groups) {
      for (const label of group.queue_labels) {
        if (labels.has(label)) throw new Error(`Queue label appears in multiple groups: ${label}`);
        labels.add(label);
      }
    }
    const dir = deliverablesDir();
    mkdirSync(dir, { recursive: true });
    const queuePath = join(dir, `${vuln_class}_exploitation_queue.json`);
    if (existsSync(queuePath)) {
      const queue = z.object({ vulnerabilities: z.array(queueEntrySchema) }).parse(JSON.parse(readFileSync(queuePath, "utf-8"))).vulnerabilities;
      const known = new Set(queue.map((v) => v.ID));
      for (const label of labels) {
        if (!known.has(label)) throw new Error(`Queue label not found in ${vuln_class} queue: ${label}`);
      }
    } else if (labels.size > 0) {
      throw new Error(`Cannot submit non-empty task groups without an existing ${vuln_class} exploitation queue`);
    }
    const filepath = join(dir, `${vuln_class}_task_groups.json`);
    writeFileAtomic(filepath, JSON.stringify({ groups }, null, 2));
    return {
      structuredContent: { count: groups.length, filepath },
      content: [{ type: "text", text: `Saved ${groups.length} task groups to ${filepath}` }],
    };
  },
);

server.registerTool(
  "playwright_cli",
  {
    title: "Run playwright-cli",
    description:
      "Drive a real browser via the trusted plugin-local playwright-cli binary for recon, exploitation proof, and login validation. SHANNON_ALLOWED_ORIGINS is required; always pass an isolated session (-s=<session>).",
    inputSchema: {
      args: z
        .array(z.string())
        .superRefine((args, context) => {
          const sessions = args.filter((arg) => /^-s=.+$/.test(arg));
          if (sessions.length !== 1) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Exactly one non-empty -s=<session> argument is required",
            });
          }
        })
        .describe("Arguments after `playwright-cli`, including exactly one isolated session argument"),
      timeout_seconds: z.number().min(1).max(600).default(120),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  async ({ args, timeout_seconds }) => {
    validateBrowserTargets(args);
    const output = await runPlaywright(args, timeout_seconds, assessmentWorkspace);
    return { content: [{ type: "text", text: output }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
