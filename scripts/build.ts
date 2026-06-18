#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

import type { HelperArch } from "../src/lib/keystore/macos/swift";
import {
  CODESIGN,
  HELPER_EMBED_PATH,
  HELPER_SOURCE_PATH,
  helperPrebuiltPath,
  SWIFT_TRIPLE,
  SWIFTC,
} from "../src/lib/keystore/macos/swift";

/**
 * Compiles tpay into a standalone Bun executable.
 *
 * Used both locally (`bun run build`) and by the release workflow. For macOS
 * targets this first compiles and ad-hoc-signs the Swift Keychain helper
 * (src/lib/keystore/macos/helper.swift) and writes it next to the embed module
 * so `bun build --compile` bakes it into the binary. The helper does all
 * Keychain I/O through its own stable code identity so the OS doesn't prompt
 * for the login-keychain password every time the churning `tpay` binary is
 * rebuilt. Non-macOS targets get an empty sentinel (the helper is unused there;
 * Bun.secrets handles Linux/Windows) so the embed import still resolves.
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
const version = values.version ?? process.env.TPAY_VERSION ?? "0.1.1";

// process.platform-style value ("darwin" | "linux" | "win32"), used to gate the
// macOS Keychain helper at build time inside the keystore/verification modules.
const targetOs = target.includes("darwin")
  ? "darwin"
  : target.includes("windows")
    ? "win32"
    : "linux";
const targetArch: HelperArch = target.includes("arm64") ? "arm64" : "x64";

const HELPER_SWIFT = resolve(HELPER_SOURCE_PATH);
const HELPER_PREBUILT = resolve(helperPrebuiltPath(targetArch));
const HELPER_BIN = resolve(HELPER_EMBED_PATH);

await buildKeychainHelper();

await mkdir(dirname(outfile), { recursive: true });

const args = [
  "build",
  "--compile",
  `--target=${target}`,
  // Production optimizations (see Bun's "Building executables" docs):
  //   --bytecode   embeds JSC bytecode -> ~2x faster startup for a CLI.
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
  "--outfile",
  outfile,
  "src/cli.ts",
];

console.log(`building ${target} -> ${outfile} (v${version})`);

const proc = Bun.spawnSync(["bun", ...args], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

process.exit(proc.exitCode ?? 1);

/**
 * Produce src/lib/keystore/macos/tpay-helper for the target so the embed module
 * can `import ... with { type: "file" }` it into the compiled binary.
 *
 * Releases embed the COMMITTED, pre-signed helper-<arch> verbatim so its code
 * identity stays stable across releases (see scripts/build-helper.ts). swiftc
 * is only a dev fallback when no prebuilt is checked in.
 */
async function buildKeychainHelper(): Promise<void> {
  if (targetOs !== "darwin") {
    // Empty sentinel: the macOS helper is never executed on Linux/Windows, but
    // the static embed import must still resolve at build time.
    await Bun.write(HELPER_BIN, new Uint8Array(0));
    return;
  }

  const prebuilt = Bun.file(HELPER_PREBUILT);
  if (await prebuilt.exists()) {
    console.log(`embedding prebuilt helper-${targetArch}`);
    await Bun.write(HELPER_BIN, prebuilt);
    Bun.spawnSync(["chmod", "0700", HELPER_BIN]);
    return;
  }

  // Dev fallback only. swiftc output is non-reproducible, so a per-release
  // recompile would churn the helper's cdhash and re-introduce the password
  // prompt. Run `bun run build:helper` and commit helper-<arch> instead.
  console.warn(
    `no prebuilt helper-${targetArch}; compiling from source (dev only — run \`bun run build:helper\` and commit it)`
  );

  const compile = Bun.spawnSync(
    [
      SWIFTC,
      "-O",
      "-target",
      SWIFT_TRIPLE[targetArch],
      "-o",
      HELPER_BIN,
      HELPER_SWIFT,
    ],
    { stdout: "inherit", stderr: "inherit" }
  );
  if (compile.exitCode !== 0) {
    console.error(
      "failed to compile macOS Keychain helper — is swiftc available? (xcode-select --install)"
    );
    process.exit(compile.exitCode ?? 1);
  }

  const sign = Bun.spawnSync([CODESIGN, "-s", "-", "-f", HELPER_BIN], {
    stdout: "inherit",
    stderr: "inherit",
  });
  if (sign.exitCode !== 0) {
    console.error("failed to codesign macOS Keychain helper");
    process.exit(sign.exitCode ?? 1);
  }
}
