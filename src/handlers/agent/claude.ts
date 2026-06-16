import type { Handler } from "../../types";
import type { Result } from "../../utils/result";
import { fail, ok } from "../../utils/result";

const TPAY_MCP_TOOLS = "mcp__tpay__pay,mcp__tpay__get_balance";
const MCP_CONFIG_FLAG = "--mcp-config";
const ALLOWED_TOOLS_FLAG = "--allowedTools";

export type RunClaudeParams = {
  label: string;
  args: string[];
};
export type RunClaudeData = void;
export type RunClaudeError = "claude_not_found";
export type RunClaudeResult = Promise<Result<RunClaudeData, RunClaudeError>>;

export const runClaude: Handler<RunClaudeParams, RunClaudeResult> = async ({
  label,
  args,
}) => {
  const accountArgs = label ? ["--account", label] : [];

  const mcpConfig = JSON.stringify({
    mcpServers: {
      tpay: { command: "tpay", args: [...accountArgs, "mcp"] },
    },
  });

  try {
    // Merge --allowedTools with tpay tools if already present, otherwise append
    let outArgs: string[];
    const allowedToolsIdx = args.indexOf(ALLOWED_TOOLS_FLAG);
    if (allowedToolsIdx !== -1 && allowedToolsIdx + 1 < args.length) {
      const existing = args[allowedToolsIdx + 1];
      const merged = [
        ...new Set([
          ...(existing?.split(",") ?? []),
          ...TPAY_MCP_TOOLS.split(","),
        ]),
      ].join(",");
      outArgs = [
        ...args.slice(0, allowedToolsIdx + 1),
        merged,
        ...args.slice(allowedToolsIdx + 2),
      ];
    } else {
      outArgs = [...args, ALLOWED_TOOLS_FLAG, TPAY_MCP_TOOLS];
    }

    // claude accepts --mcp-config as inline JSON
    outArgs.push(MCP_CONFIG_FLAG, mcpConfig);

    const proc = Bun.spawn(["claude", ...outArgs], {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    await proc.exited;

    return ok();
  } catch (err) {
    if (
      err instanceof Error &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    )
      return fail("claude_not_found");

    return fail("unknown_error");
  }
};
