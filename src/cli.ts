import chalk from "chalk";
import { defineCommand, renderUsage, runMain } from "citty";

import {
  isAccountConfigExists,
  isAccountExist,
  loadAccountConfig,
} from "./accounts";
import { DEFAULT_NETWORK } from "./constant";
import { setState } from "./state";
import { initTpay } from "./utils/init";

const passThroughCommands = {
  curl: () => import("./commands/curl").then((m) => m.curlCommand),
  wget: () => import("./commands/wget").then((m) => m.wgetCommand),
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

    if (!(await isAccountConfigExists())) return;

    const accountConfig = await loadAccountConfig();

    if (args.account) {
      const existingAccount = isAccountExist(accountConfig, args.account);
      if (!existingAccount)
        return console.error(
          `Account with label "${args.account}" didn't exist`
        );

      setState("account", args.account);
    } else {
      setState("account", accountConfig.default);
    }
  },
  subCommands: {
    setup: () => import("./commands/setup").then((m) => m.setupCommand),
    account: () => import("./commands/accounts").then((m) => m.accountCommand),
    ...passThroughCommands,
  },
});

const ESC = String.fromCharCode(27); // 0x1B, built at runtime — not a static literal
const cyanRe = new RegExp(`${ESC}\\[36m([\\s\\S]*?)${ESC}\\[39m`, "g");

runMain(main, {
  showUsage: async (cmd, parent) => {
    try {
      let usage = await renderUsage(cmd, parent);

      usage = usage.replace(cyanRe, (_, text) => chalk.hex("#ff63a5")(text));
      console.log(`${usage}\n`);
    } catch (error) {
      console.error(error);
    }
  },
});
