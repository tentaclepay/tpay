import { defineCommand } from "citty";

import { runClaude } from "../handlers/agent/claude";
import * as ui from "../lib/ui";
import { getState } from "../state";

export const claudeCommand = defineCommand({
  meta: {
    name: "claude",
    description:
      "Run claude with the active tpay wallet as an MCP server (forwards all claude flags)",
  },
  run: async ({ rawArgs: args }) => {
    const label = getState("account");

    const result = await runClaude({ label, args });
    if (!result.success) {
      switch (result.error) {
        case "claude_not_found":
          return ui.error(
            "claude not found.",
            "Make sure the Claude CLI is installed and available in your PATH."
          );
        default:
          return ui.error(
            "Failed to run claude.",
            "Something went wrong while starting the session."
          );
      }
    }
  },
});
