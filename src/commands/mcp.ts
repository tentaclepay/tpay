import { defineCommand } from "citty";

import { serveMcp } from "../handlers/serve/mcp";
import { getState } from "../state";

export const mcpCommand = defineCommand({
  meta: {
    name: "mcp",
    description:
      "Run an MCP server (stdio) exposing the active wallet to agents — pay for x402 APIs and read balances",
  },
  run: async () => {
    const label = getState("account");

    await serveMcp({ label });
  },
});
