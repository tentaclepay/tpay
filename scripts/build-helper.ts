#!/usr/bin/env bun
import { resolve } from "node:path";

import type { HelperArch } from "../src/lib/keystore/macos/swift";
import {
  CODESIGN,
  HELPER_SOURCE_PATH,
  helperPrebuiltPath,
  SWIFT_TRIPLE,
  SWIFTC,
} from "../src/lib/keystore/macos/swift";

/**
 * Compiles + signs the macOS Keychain helper for both Apple archs and writes
 * the binaries to src/lib/keystore/macos/helper-{arm64,x64}.
 *
 * These artifacts are COMMITTED and embedded verbatim by scripts/build.ts on
 * every release. That is deliberate: `swiftc` output is not reproducible (the
 * cdhash changes on every compile), and a Keychain item's ACL binds to the
 * creating app's cdhash. If we recompiled the helper per release its identity
 * would churn and macOS would prompt for the login-keychain password after each
 * upgrade — exactly the bug we're removing. Building once and shipping the same
 * bytes keeps the helper's identity stable across releases, so it silently
 * reads the items it created. Only re-run this (and commit the result) when
 * helper.swift actually changes.
 *
 *   bun run build:helper
 *
 * Signing: ad-hoc by default. Set TPAY_SIGN_IDENTITY to a "Developer ID
 * Application: …" identity to sign (and later notarize) with a stable cert —
 * then identity, not cdhash, anchors trust and even helper.swift changes won't
 * re-prompt.
 */

const SOURCE = resolve(HELPER_SOURCE_PATH);
const IDENTITY = process.env.TPAY_SIGN_IDENTITY ?? "-";
const ARCHES = Object.keys(SWIFT_TRIPLE) as HelperArch[];

if (process.platform !== "darwin") {
  console.error("build:helper must run on macOS (needs swiftc + codesign).");
  process.exit(1);
}

for (const arch of ARCHES) {
  const triple = SWIFT_TRIPLE[arch];
  const out = resolve(helperPrebuiltPath(arch));
  console.log(`compiling helper-${arch} (${triple})`);

  const compile = Bun.spawnSync(
    [SWIFTC, "-O", "-target", triple, "-o", out, SOURCE],
    { stdout: "inherit", stderr: "inherit" }
  );
  if (compile.exitCode !== 0) {
    console.error(`swiftc failed for ${arch} — is Xcode CLT installed?`);
    process.exit(compile.exitCode ?? 1);
  }

  const sign = Bun.spawnSync([CODESIGN, "-s", IDENTITY, "-f", out], {
    stdout: "inherit",
    stderr: "inherit",
  });
  if (sign.exitCode !== 0) {
    console.error(`codesign failed for ${arch}`);
    process.exit(sign.exitCode ?? 1);
  }

  const verify = Bun.spawnSync([CODESIGN, "--verify", "--strict", out], {
    stdout: "inherit",
    stderr: "inherit",
  });
  if (verify.exitCode !== 0) {
    console.error(`codesign --verify failed for ${arch}`);
    process.exit(verify.exitCode ?? 1);
  }
}

console.log(
  `\nsigned with identity: ${IDENTITY === "-" ? "ad-hoc" : IDENTITY}\n` +
    "commit the regenerated helper-arm64 / helper-x64 binaries."
);
