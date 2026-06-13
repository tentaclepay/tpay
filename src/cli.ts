import { defineCommand, runMain } from "citty";

import { getAccount, loadAccountConfig } from "./accounts";
import { accountCommand } from "./commands/accounts";
import { curlCommand } from "./commands/curl";
import { setupCommand } from "./commands/setup";
import { wgetCommand } from "./commands/wget";
import { DEFAULT_NETWORK } from "./constant";
import { setState } from "./state";
import { initTpay } from "./utils/init";

const passThroughCommands = {
  curl: curlCommand,
  wget: wgetCommand,
};

const main = defineCommand({
  meta: {
    name: "tpay",
    version: "0.1.0",
    description: "Tentacle Pay Wallet",
  },
  args: {
    network: {
      type: "enum",
      options: ["mainnet", "testnet"],
      default: DEFAULT_NETWORK,
      alias: "n",
      description: "Set network",
    },
    account: {
      type: "string",
      alias: "a",
      description: "Select account to use for",
    },
  },
  setup: async ({ args }) => {
    initTpay();

    setState("network", args.network);

    const accountConfig = await loadAccountConfig();

    if (args.account) {
      const existingAccount = getAccount(accountConfig, args.account);
      if (!existingAccount)
        return console.error(
          `Account with label "${args.account}" didn't exist`
        );

      setState("account", existingAccount.label);
    } else {
      setState("account", accountConfig.default);
    }
  },
  subCommands: {
    setup: setupCommand,
    account: accountCommand,
    ...passThroughCommands,
  },
});

runMain(main);
