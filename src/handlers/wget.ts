import { $ } from "bun";

interface WgetHandlersInput {
  args: string[];
}

export const wgetHandler = async ({ args }: WgetHandlersInput) => {
  const { stderr, stdout } = await $.nothrow()`wget ${args}`;

  if (stderr) return stderr;

  return stdout;
};
