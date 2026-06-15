import { defineCommand } from "citty";

import { DEFAULT_NETWORK } from "../../constant";
import { getState } from "../../state";
import { showBalances } from "./balance-view";

export const accountCommand = defineCommand({
  meta: { name: "account", description: "Manage wallets and view balances" },
  args: {
    network: {
      type: "enum",
      options: ["mainnet", "testnet"],
      default: DEFAULT_NETWORK,
      alias: "n",
      description: "Network to query (mainnet or testnet)",
    },
  },
  run: async ({ args }) => {
    if (args._.length) return;

    await showBalances({ label: getState("account"), network: args.network });
  },
  subCommands: {
    balance: () => import("./balance").then((m) => m.balanceCommand),
    default: () => import("./default").then((m) => m.defaultCommand),
    export: () => import("./export").then((m) => m.exportCommand),
    import: () => import("./import").then((m) => m.importCommand),
    list: () => import("./list").then((m) => m.listCommand),
    new: () => import("./new").then((m) => m.newCommand),
    remove: () => import("./remove").then((m) => m.removeCommand),
  },
});
