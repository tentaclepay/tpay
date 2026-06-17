// Shared constants for compiling/signing the macOS Keychain helper. Single
// source of truth for the runtime driver (index.ts dev fallback) and the build
// scripts (scripts/build.ts, scripts/build-helper.ts). Pure string consts — no
// side effects — so it's safe to bundle into the app; unused exports are
// dead-code-eliminated from release builds.

export const SWIFTC = "/usr/bin/swiftc";
export const CODESIGN = "/usr/bin/codesign";

export type HelperArch = "arm64" | "x64";

/** swiftc target triple per Apple arch (swiftc cross-compiles via -target). */
export const SWIFT_TRIPLE: Record<HelperArch, string> = {
  arm64: "arm64-apple-macosx11.0",
  x64: "x86_64-apple-macosx11.0",
};

// Repo-relative paths used by the build scripts.
export const HELPER_SOURCE_PATH = "src/lib/keystore/macos/helper.swift";
export const HELPER_EMBED_PATH = "src/lib/keystore/macos/tpay-helper";
export const helperPrebuiltPath = (arch: HelperArch): string =>
  `src/lib/keystore/macos/helper-${arch}`;
