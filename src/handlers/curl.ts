import { $ } from "bun";

interface CurlHandlersInput {
  label: string;
  args: string[];
}

export const curlHandler = async ({ args }: CurlHandlersInput) => {
  // // Default to silent (no progress meter), unless the user opts in to
  // // progress/verbose output themselves.
  const verbosityFlags = [
    "-s",
    "--silent",
    "-v",
    "--verbose",
    "-#",
    "--progress-bar",
  ];
  const hasVerbosity = args.some((arg) => verbosityFlags.includes(arg));
  const { stderr, stdout } = hasVerbosity
    ? await $.nothrow()`curl ${args}`
    : await $.nothrow()`curl -sS ${args}`;
  if (stderr) return stderr;
  return stdout;
};
