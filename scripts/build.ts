#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
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
const targetArch = target.includes("arm64") ? "arm64" : "x64";

// `bun install` builds the node-mac-auth native addon for the host arch. For
// macOS builds, rebuild it for the *target* arch so a cross-compiled binary
// (e.g. the Intel build, produced on a free Apple Silicon CI runner now that
// GitHub retired the macos-13 Intel runner) embeds an addon it can load.
const addonDir = resolve("node_modules/node-mac-auth");
if (targetOs === "darwin" && existsSync(addonDir)) {
  console.log(`rebuilding node-mac-auth for ${targetArch}`);
  const gyp = Bun.spawnSync(
    [resolve("node_modules/.bin/node-gyp"), "rebuild", `--arch=${targetArch}`],
    { cwd: addonDir, stdout: "inherit", stderr: "inherit" }
  );
  if (gyp.exitCode !== 0) {
    console.error(`failed to rebuild node-mac-auth for ${targetArch}`);
    process.exit(gyp.exitCode ?? 1);
  }
}

await mkdir(dirname(outfile), { recursive: true });

const args = [
  "build",
  "--compile",
  `--target=${target}`,
  // Production optimizations (see Bun's "Building executables" docs):
  //   --bytecode   embeds JSC bytecode -> ~2x faster startup for a CLI.
  //                Version-tied, but a --compile binary ships its own Bun
  //                runtime so they always match; it's also arch-independent.
  //   --minify     smaller embedded bundle + tighter dead-code elimination.
  //   --sourcemap  zstd-compressed map so stack traces point at real source.
  "--bytecode",
  "--minify",
  "--sourcemap",
  "--define",
  'process.env.NODE_ENV="production"',
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
