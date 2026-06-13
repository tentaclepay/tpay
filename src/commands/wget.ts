import { defineCommand } from "citty";

import { wgetHandler } from "../handlers/wget";
import { getState } from "../state";

export const wgetCommand = defineCommand({
  meta: { name: "wget", description: "Wget" },
  run: async ({ rawArgs }) => {
    const network = getState("network");

    return wgetHandler({ args: rawArgs });
  },
});
