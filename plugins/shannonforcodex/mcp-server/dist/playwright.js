import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { delimiter, join, resolve } from "node:path";
function playwrightEntrypoint(workspace) {
    const manifests = [];
    for (const base of [join(workspace, "package.json"), import.meta.url]) {
        try {
            manifests.push(createRequire(base).resolve("@playwright/cli/package.json"));
        }
        catch {
            // The CLI can also be installed globally through npm.
        }
    }
    for (const entry of (process.env.PATH ?? "").split(delimiter).filter(Boolean)) {
        const dir = entry.replace(/^"|"$/g, "");
        manifests.push(join(dir, "node_modules/@playwright/cli/package.json"), resolve(dir, "../@playwright/cli/package.json"), resolve(dir, "../lib/node_modules/@playwright/cli/package.json"));
    }
    for (const manifest of manifests) {
        if (!existsSync(manifest))
            continue;
        const pkg = JSON.parse(readFileSync(manifest, "utf-8"));
        const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.["playwright-cli"];
        if (typeof bin !== "string")
            continue;
        const entrypoint = resolve(manifest, "..", bin);
        if (existsSync(entrypoint))
            return entrypoint;
    }
    throw new Error("Cannot locate @playwright/cli. Install it in the assessment workspace or globally with npm install -g @playwright/cli.");
}
export function runPlaywright(args, timeoutSeconds, workspace) {
    // npm's .cmd/.ps1 shims cannot be spawned without a shell on Windows.
    // Run the package's declared JavaScript bin with Node, preserving literal arguments.
    const entrypoint = playwrightEntrypoint(workspace);
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(process.execPath, [entrypoint, ...args], {
            cwd: workspace,
            // Interactive update checks can crash Node during shutdown on Windows.
            env: { ...process.env, NO_UPDATE_NOTIFIER: "1" },
            windowsHide: true,
        });
        let stdout = "";
        let stderr = "";
        const timer = setTimeout(() => {
            child.kill();
            rejectPromise(new Error(`playwright-cli failed: ETIMEDOUT after ${timeoutSeconds}s`));
        }, timeoutSeconds * 1000);
        child.stdout?.on("data", (chunk) => { stdout += String(chunk); });
        child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
        child.on("error", (error) => {
            clearTimeout(timer);
            rejectPromise(new Error(`playwright-cli failed: ${error.message}`));
        });
        child.on("close", (status) => {
            clearTimeout(timer);
            const output = `${stdout}${stderr}`;
            const truncated = output.length > 8000
                ? `${output.slice(0, 8000)}\n…[truncated ${output.length - 8000} chars; full output saved to .shannon/deliverables/playwright_cli_output.txt]`
                : output;
            if (status !== 0) {
                try {
                    mkdirSync(join(workspace, ".shannon/deliverables"), { recursive: true });
                    writeFileSync(join(workspace, ".shannon/deliverables/playwright_cli_output.txt"), output, "utf-8");
                }
                catch {
                    // Best-effort artifact; the error below carries the failure.
                }
                rejectPromise(new Error(`playwright-cli exited ${status}: ${truncated || "(no output)"}`));
                return;
            }
            if (output.length > 8000) {
                try {
                    mkdirSync(join(workspace, ".shannon/deliverables"), { recursive: true });
                    writeFileSync(join(workspace, ".shannon/deliverables/playwright_cli_output.txt"), output, "utf-8");
                }
                catch {
                    // Best-effort artifact; truncated output is still returned.
                }
            }
            resolvePromise(truncated || "(no output)");
        });
    });
}
