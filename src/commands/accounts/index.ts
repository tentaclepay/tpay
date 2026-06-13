import { defineCommand } from "citty";

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
    balance: () => import("./balance").then((m) => m.balanceCommand),
    current: () => import("./current").then((m) => m.currentCommand),
    new: () => import("./new").then((m) => m.newCommand),
    list: () => import("./list").then((m) => m.listCommand),
    import: () => import("./import").then((m) => m.importCommand),
    export: () => import("./export").then((m) => m.exportCommand),
    remove: () => import("./remove").then((m) => m.removeCommand),
    default: () => import("./default").then((m) => m.defaultCommand),
  },
});
