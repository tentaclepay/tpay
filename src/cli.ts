import { defineCommand, renderUsage, runMain } from "citty";

import {
  createAccountConfig,
  isAccountConfigExists,
  isAccountExist,
  loadAccountConfig,
  validateAccountConfig,
} from "./accounts";
import { APP_NAME } from "./constant";
import * as ui from "./lib/ui";
import { setState } from "./state";

const passThroughCommands = {
  curl: () => import("./commands/curl").then((m) => m.curlCommand),
};

const main = defineCommand({
  meta: {
    name: APP_NAME,
    version: process.env.TPAY_VERSION ?? "0.1.0",
    description: "Tentacle Pay Wallet — let your agents pay for APIs on Sui.",
  },
  args: {
    account: {
      type: "string",
      alias: "a",
      description:
        "Wallet to use for this command (defaults to the active wallet)",
    },
  },
  setup: async ({ args }) => {
    const accountConfigExists = await isAccountConfigExists();
    if (!accountConfigExists) await createAccountConfig();

    const accountConfig = await loadAccountConfig();

    const isValidAccountConfig = validateAccountConfig(accountConfig);

    const [command, subCommand] = args._;

    const hasBeenInitialized = command === "setup" && isValidAccountConfig;
    if (hasBeenInitialized)
      ui.fatal(
        "tpay is already set up.",
        "Add another wallet with `tpay account new <label>`."
      );

    const initializing =
      (command === "setup" && !isValidAccountConfig) ||
      (command === "account" && subCommand === "new");
    if (initializing) return;

    if (!isValidAccountConfig)
      ui.fatal(
        "No wallet found.",
        "Run `tpay setup` to create your first wallet."
      );

    if (args.account) {
      const existingAccount = isAccountExist(accountConfig, args.account);
      if (!existingAccount)
        ui.fatal(
          `Wallet "${args.account}" was not found.`,
          "Run `tpay account list` to see your wallets."
        );

      return setState("account", args.account);
    }

    return setState("account", accountConfig.default);
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

      usage = usage.replace(cyanRe, (_, text) => ui.brand(text));
      console.log(`${usage}\n`);
    } catch (error) {
      console.error(error);
    }
  },
});
