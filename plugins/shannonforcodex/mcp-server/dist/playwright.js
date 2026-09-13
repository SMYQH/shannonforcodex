import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute, resolve } from "node:path";
function playwrightEntrypoint() {
    const configured = process.env.SHANNON_PLAYWRIGHT_CLI_PATH;
    if (configured !== undefined) {
        if (!isAbsolute(configured) || !existsSync(configured)) {
            throw new Error("SHANNON_PLAYWRIGHT_CLI_PATH must be an existing absolute path to a trusted playwright-cli JavaScript entrypoint");
        }
        return configured;
    }
    try {
        const manifest = createRequire(import.meta.url).resolve("@playwright/cli/package.json");
        const pkg = JSON.parse(readFileSync(manifest, "utf-8"));
        const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.["playwright-cli"];
        if (typeof bin === "string") {
            const entrypoint = resolve(manifest, "..", bin);
            if (existsSync(entrypoint))
                return entrypoint;
        }
    }
    catch {
        // The actionable error below explains the required trusted installation.
    }
    throw new Error("Cannot locate the trusted plugin-local @playwright/cli. Run npm ci in the plugin mcp-server directory, or set SHANNON_PLAYWRIGHT_CLI_PATH to a trusted absolute entrypoint.");
}
const MAX_CAPTURED_OUTPUT = 64 * 1024;
const MAX_RETURNED_OUTPUT = 8000;
const SAFE_ENV_KEYS = [
    "PATH", "Path", "PATHEXT", "SystemRoot", "WINDIR", "ComSpec", "TEMP", "TMP",
    "USERPROFILE", "HOME", "HOMEDRIVE", "HOMEPATH", "LOCALAPPDATA", "APPDATA",
    "XDG_CACHE_HOME", "PLAYWRIGHT_BROWSERS_PATH", "CI", "LANG", "LC_ALL", "TERM",
];
function safeChildEnvironment() {
    const env = {};
    for (const key of SAFE_ENV_KEYS) {
        if (process.env[key] !== undefined)
            env[key] = process.env[key];
    }
    // Interactive update checks can crash Node during shutdown on Windows.
    env.NO_UPDATE_NOTIFIER = "1";
    return env;
}
export function runPlaywright(args, timeoutSeconds, workspace) {
    // npm shims cannot be spawned without a shell on Windows. Run the trusted
    // package's declared JavaScript bin with Node so arguments remain literal.
    const entrypoint = playwrightEntrypoint();
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(process.execPath, [entrypoint, ...args], {
            cwd: workspace,
            // Assessment/session credentials must not be exposed to the browser CLI.
            env: safeChildEnvironment(),
            windowsHide: true,
        });
        let stdout = "";
        let stderr = "";
        let outputLength = 0;
        let outputTruncated = false;
        const append = (target, chunk) => {
            const text = String(chunk);
            outputLength += text.length;
            const current = target === "stdout" ? stdout : stderr;
            const remaining = Math.max(0, MAX_CAPTURED_OUTPUT - current.length);
            const bounded = current + text.slice(0, remaining);
            if (target === "stdout")
                stdout = bounded;
            else
                stderr = bounded;
            if (outputLength > MAX_CAPTURED_OUTPUT * 2)
                outputTruncated = true;
        };
        const timer = setTimeout(() => {
            child.kill();
            rejectPromise(new Error(`playwright-cli failed: ETIMEDOUT after ${timeoutSeconds}s`));
        }, timeoutSeconds * 1000);
        child.stdout?.on("data", (chunk) => append("stdout", chunk));
        child.stderr?.on("data", (chunk) => append("stderr", chunk));
        child.on("error", (error) => {
            clearTimeout(timer);
            rejectPromise(new Error(`playwright-cli failed: ${error.message}`));
        });
        child.on("close", (status) => {
            clearTimeout(timer);
            const output = `${stdout}${stderr}`;
            const truncated = output.length > MAX_RETURNED_OUTPUT || outputTruncated
                ? `${output.slice(0, MAX_RETURNED_OUTPUT)}\n…[output truncated; raw output was not persisted]`
                : output;
            if (status !== 0) {
                rejectPromise(new Error(`playwright-cli exited ${status}: ${truncated || "(no output)"}`));
                return;
            }
            resolvePromise(truncated || "(no output)");
        });
    });
}
