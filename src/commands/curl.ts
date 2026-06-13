import { defineCommand } from "citty";

import { curlHandler } from "../handlers/curl";
import { getState } from "../state";

export const curlCommand = defineCommand({
  meta: { name: "curl", description: "cURL" },
  run: async ({ rawArgs }) => {
    const account = getState("account");
    if (!account)
      return console.error(`No account found, please run "tpay setup"`);

    return curlHandler({ label: account, args: rawArgs });
  },
});
