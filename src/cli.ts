import chalk from "chalk";
import { defineCommand, renderUsage, runMain } from "citty";

import {
  createAccountConfig,
  isAccountConfigExists,
  isAccountExist,
  loadAccountConfig,
  validateAccountConfig,
} from "./accounts";
import { APP_NAME, DEFAULT_NETWORK } from "./constant";
import { setState } from "./state";

const passThroughCommands = {
  curl: () => import("./commands/curl").then((m) => m.curlCommand),
  wget: () => import("./commands/wget").then((m) => m.wgetCommand),
};

const main = defineCommand({
  meta: {
    name: APP_NAME,
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
    setState("network", args.network);

    const accountConfigExists = await isAccountConfigExists();
    if (!accountConfigExists) await createAccountConfig();

    const accountConfig = await loadAccountConfig();

    const isValidAccountConfig = validateAccountConfig(accountConfig);

    const [command, subCommand] = args._;

    const hasBeenInitialized = command === "setup" && isValidAccountConfig;
    if (hasBeenInitialized)
      throw console.error("Tentacle Pay Wallet has been initialized");

    const initializing =
      (command === "setup" && !isValidAccountConfig) ||
      (command === "account" && subCommand === "new");
    if (initializing) return;

    if (!isValidAccountConfig)
      throw console.error("No wallet found. Run `tpay setup` first");

    if (args.account) {
      const existingAccount = isAccountExist(accountConfig, args.account);
      if (!existingAccount)
        return console.error(`Wallet with label "${args.account}" not found`);

      return setState("account", args.account);
    }

    return setState("account", accountConfig.default);
  },
  subCommands: {
    setup: () => import("./commands/setup").then((m) => m.setupCommand),
    account: () => import("./commands/accounts").then((m) => m.accountCommand),
    // ...passThroughCommands,
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
