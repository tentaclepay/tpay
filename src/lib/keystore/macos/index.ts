// macOS Keychain + Touch ID, driven through a separate signed Swift helper.
//
// Why a helper subprocess instead of calling SecItem in-process: a Keychain
// item's ACL binds to the *creating app's* code identity (cdhash). The main
// `tpay` binary is rebuilt on every release, so its cdhash churns and macOS
// falls back to the login-keychain password prompt. A native addon wouldn't
// help — it loads into the `tpay` process, so the requester is still `tpay`.
// The helper is a tiny, rarely-changing executable with its own stable cdhash,
// so the OS keeps trusting it across tpay releases. See helper.swift.
//
// The compiled helper is embedded at build time and extracted to a private
// cache on first use; in dev (no embedded helper) it is compiled on demand
// from the embedded Swift source. Either way it is signature-verified before
// it is ever executed.

import { chmod, lstat, mkdir, readFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { file, spawn } from "bun";

import { CONFIG_DIR } from "../../../constant";
// Always present in the repo; used for the dev/runtime compile fallback.
import HELPER_SOURCE from "./helper.swift" with { type: "text" };
import { CODESIGN, SWIFTC } from "./swift";

const CACHE_DIR = join(CONFIG_DIR, "helper");
// The cached executable is named "tpay" on purpose: the helper is a bare
// binary (no bundle/Info.plist), so LocalAuthentication shows its filename as
// the app name in the Touch ID prompt. Naming it "tpay" makes the prompt read
// `tpay is trying to …` instead of `tpay-helper`. The filename does not affect
// Keychain trust (that's bound to the cdhash), so existing secrets still work.
const HELPER_BIN = join(CACHE_DIR, "tpay");

let readyHelper: Promise<string> | null = null;

// ── Public API ──────────────────────────────────────────────────────────────
// Each call throws on failure; callers in platform.ts / verification.ts map
// those to their boolean / nullable contracts.

const hexEncode = (value: string) => Buffer.from(value, "utf8").toString("hex");
const hexDecode = (hex: string) => Buffer.from(hex, "hex").toString("utf8");

export const keychainStore = (
  account: string,
  value: string
): Promise<string> =>
  run(["store", account], new TextEncoder().encode(`${hexEncode(value)}\n`));

export const keychainRead = (account: string): Promise<string> =>
  run(["read", account]).then(hexDecode);

export const keychainDelete = (account: string): Promise<string> =>
  run(["delete", account]);

export const keychainExists = (account: string): Promise<boolean> =>
  run(["exists", account]).then((out) => out === "yes");

export const keychainAuthenticate = (reason: string): Promise<string> =>
  run(["authenticate", reason]);

export const keychainCanPrompt = (): Promise<boolean> =>
  run(["check-biometrics"]).then((out) => out === "yes");

// ── Helper execution ─────────────────────────────────────────────────────────

async function run(args: string[], stdin?: Uint8Array): Promise<string> {
  const binary = await ensureHelper();
  const proc = spawn([binary, ...args], {
    stdin: stdin ?? "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });

  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (code !== 0) {
    const line = err.split("\n").find((l) => l.startsWith("ERROR:"));
    throw new Error(
      line ? line.slice("ERROR:".length) : err.trim() || `helper exited ${code}`
    );
  }
  return out.trim();
}

// ── Helper installation ──────────────────────────────────────────────────────

function ensureHelper(): Promise<string> {
  readyHelper ??= installHelper();
  return readyHelper;
}

async function installHelper(): Promise<string> {
  await prepareCacheDir();

  const embedded = await embeddedHelperBytes();
  if (embedded.length > 0) {
    if (!(await cacheMatches(embedded))) {
      await writeAtomic(HELPER_BIN, embedded);
    }
  } else if (!(await cacheIsValid())) {
    await compileFromSource();
  }

  await validateHelperFile(HELPER_BIN);
  await verifyCodesign(HELPER_BIN);
  return HELPER_BIN;
}

/** Embedded prebuilt helper bytes, or empty when none was embedded (dev). */
async function embeddedHelperBytes(): Promise<Uint8Array> {
  try {
    const mod = await import("./embedded-helper");
    return await file(mod.default).bytes();
  } catch {
    return new Uint8Array(0);
  }
}

/** True when the cached helper byte-matches this build's embedded helper. */
async function cacheMatches(embedded: Uint8Array): Promise<boolean> {
  try {
    await validateHelperFile(HELPER_BIN);
    const onDisk = await readFile(HELPER_BIN);
    if (
      onDisk.length !== embedded.length ||
      !Buffer.from(onDisk).equals(embedded)
    ) {
      return false;
    }
    await verifyCodesign(HELPER_BIN);
    return true;
  } catch {
    return false;
  }
}

/** True when a previously source-compiled helper is present and trusted. */
async function cacheIsValid(): Promise<boolean> {
  try {
    await validateHelperFile(HELPER_BIN);
    await verifyCodesign(HELPER_BIN);
    return true;
  } catch {
    return false;
  }
}

async function compileFromSource(): Promise<void> {
  const source = join(CACHE_DIR, `.helper.${process.pid}.swift`);
  const tmpBin = join(CACHE_DIR, `.tpay-helper.${process.pid}.tmp`);

  try {
    await Bun.write(source, HELPER_SOURCE);

    const compile = spawn([SWIFTC, "-O", "-o", tmpBin, source], {
      stdout: "ignore",
      stderr: "pipe",
    });
    if ((await compile.exited) !== 0) {
      const err = await new Response(compile.stderr).text();
      throw new Error(
        `swiftc failed: ${err.trim()}. Install Xcode Command Line Tools: xcode-select --install`
      );
    }

    await chmod(tmpBin, 0o700);
    await codesign(tmpBin);
    await rename(tmpBin, HELPER_BIN);
  } finally {
    await rm(source, { force: true });
    await rm(tmpBin, { force: true });
  }
}

// ── Filesystem + signature safety ────────────────────────────────────────────

async function prepareCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true, mode: 0o700 });
  await chmod(CACHE_DIR, 0o700);

  const meta = await lstat(CACHE_DIR);
  if (meta.isSymbolicLink() || !meta.isDirectory()) {
    throw new Error(
      `refusing to use unsafe Keychain helper cache dir: ${CACHE_DIR}`
    );
  }
  if (meta.uid !== currentEuid() || (meta.mode & 0o077) !== 0) {
    throw new Error(
      `Keychain helper cache dir has unsafe ownership/permissions: ${CACHE_DIR}`
    );
  }
}

async function validateHelperFile(path: string): Promise<void> {
  const meta = await lstat(path);
  if (meta.isSymbolicLink() || !meta.isFile()) {
    throw new Error(`refusing to use unsafe Keychain helper binary: ${path}`);
  }
  if (meta.nlink !== 1) {
    throw new Error(
      `refusing to use hard-linked Keychain helper binary: ${path}`
    );
  }
  if (meta.uid !== currentEuid() || (meta.mode & 0o077) !== 0) {
    throw new Error(
      `Keychain helper binary has unsafe ownership/permissions: ${path}`
    );
  }
}

async function writeAtomic(
  destination: string,
  contents: Uint8Array
): Promise<void> {
  const tmp = join(CACHE_DIR, `.tpay-helper.${process.pid}.tmp`);
  try {
    await Bun.write(tmp, contents);
    await chmod(tmp, 0o700);
    await rename(tmp, destination);
  } catch (err) {
    await rm(tmp, { force: true });
    throw err;
  }
}

async function codesign(path: string): Promise<void> {
  const proc = spawn([CODESIGN, "-s", "-", "-f", path], {
    stdout: "ignore",
    stderr: "pipe",
  });
  if ((await proc.exited) !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`codesign failed: ${err.trim()}`);
  }
}

async function verifyCodesign(path: string): Promise<void> {
  const proc = spawn([CODESIGN, "--verify", "--strict", path], {
    stdout: "ignore",
    stderr: "ignore",
  });
  if ((await proc.exited) !== 0) {
    await rm(path, { force: true });
    throw new Error(
      "Keychain helper failed signature verification and was removed; retry to reinstall."
    );
  }
}

function currentEuid(): number {
  return typeof process.geteuid === "function" ? process.geteuid() : -1;
}
