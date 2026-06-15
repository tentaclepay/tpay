import chalk from "chalk";

/**
 * Shared output helpers so every command speaks the same language: green for
 * success, red for errors, and an aligned key/value layout for wallet details.
 */

/** The Tentacle Pay brand color (pink). */
export const brand = chalk.hex("#ff63a5");

const symbols = {
  success: chalk.green("✔"),
  error: chalk.red("✖"),
  info: chalk.cyan("ℹ"),
  warn: chalk.yellow("⚠"),
};

/** Print a blank line. */
export const newline = (): void => console.log();

/** Report a successful action, e.g. `✔ Wallet created`. */
export const success = (message: string): void => {
  console.log(`${symbols.success} ${message}`);
};

/** Print a neutral, informational line. */
export const info = (message: string): void => {
  console.log(`${symbols.info} ${message}`);
};

/** Print a warning to stderr (e.g. before revealing a secret key). */
export const warn = (message: string): void => {
  console.warn(`${symbols.warn} ${chalk.yellow(message)}`);
};

/**
 * Report a recoverable error to stderr and mark the process as failed so the
 * shell (and any agent) sees a non-zero exit code. The optional `hint` is shown
 * dimmed on the next line to tell the user how to fix it.
 */
export const error = (message: string, hint?: string): void => {
  process.exitCode = 1;
  console.error(`${symbols.error} ${chalk.red(message)}`);
  if (hint) console.error(`  ${chalk.dim(hint)}`);
};

/**
 * Report an error and exit immediately. Use this from lifecycle hooks (e.g.
 * `setup`) where returning would let the command keep running.
 */
export const fatal = (message: string, hint?: string): never => {
  error(message, hint);
  process.exit(1);
};

/**
 * Print an aligned list of label/value pairs:
 * ```
 *   Label    alice
 *   Address  0x1234…
 * ```
 */
export const details = (entries: Array<[string, string | number]>): void => {
  const width = Math.max(...entries.map(([label]) => label.length));
  for (const [label, value] of entries) {
    console.log(`  ${chalk.bold(label.padEnd(width))}  ${value}`);
  }
};
