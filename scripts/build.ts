#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

/**
 * Compiles tpay into a standalone Bun executable.
 *
 * Used both locally (`bun run build`) and by the release workflow. The release
 * builds each macOS architecture on its own native runner so node-gyp produces
 * the correct-arch `node-mac-auth` addon, which the macOS binary then embeds.
 * Linux targets cross-compile from a single runner with the macOS-only addon
 * excluded (see `--external` below and the gated require in verification.ts).
 */

const HOST_ARCH = process.arch === "x64" ? "x64" : "arm64";
const HOST_OS =
  process.platform === "darwin"
    ? "darwin"
    : process.platform === "win32"
      ? "windows"
      : "linux";

const { values } = parseArgs({
  options: {
    target: { type: "string" },
    outfile: { type: "string" },
    version: { type: "string" },
  },
});

const target = values.target ?? `bun-${HOST_OS}-${HOST_ARCH}`;
const outfile = values.outfile ?? "dist/tpay";
const version = values.version ?? process.env.TPAY_VERSION ?? "0.1.0";

// process.platform-style value ("darwin" | "linux"), used to gate the
// node-mac-auth require at build time inside src/lib/verification.ts.
const targetOs = target.includes("darwin")
  ? "darwin"
  : target.includes("windows")
    ? "win32"
    : "linux";

await mkdir(dirname(outfile), { recursive: true });

const args = [
  "build",
  "--compile",
  `--target=${target}`,
  "--define",
  `process.env.TPAY_TARGET_OS="${targetOs}"`,
  "--define",
  `process.env.TPAY_VERSION="${version}"`,
];

// node-mac-auth only exists on macOS. Excluding it from non-darwin builds keeps
// Bun from trying to resolve the addon (it isn't installed off macOS).
if (targetOs !== "darwin") {
  args.push("--external", "node-mac-auth");
}

args.push("--outfile", outfile, "src/cli.ts");

console.log(`building ${target} -> ${outfile} (v${version})`);

const proc = Bun.spawnSync(["bun", ...args], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

process.exit(proc.exitCode ?? 1);
