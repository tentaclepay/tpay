import { defineCommand } from "citty";

import { balanceCommand } from "./balance";
import { currentCommand } from "./current";
import { defaultCommand } from "./default";
import { exportCommand } from "./export";
import { importCommand } from "./import";
import { listCommand } from "./list";
import { newCommand } from "./new";
import { removeCommand } from "./remove";

export const accountCommand = defineCommand({
  meta: { name: "account", description: "Account" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: false,
    },
  },
  subCommands: {
    balance: balanceCommand,
    current: currentCommand,
    new: newCommand,
    list: listCommand,
    import: importCommand,
    export: exportCommand,
    remove: removeCommand,
    default: defaultCommand,
  },
});
