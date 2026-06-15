import { defineCommand } from "citty";

import { setDefault } from "../../handlers/accounts/set-default";

export const defaultCommand = defineCommand({
  meta: { name: "default", description: "Set default account" },
  args: {
    label: {
      type: "positional",
      description: "Account label",
      required: true,
    },
  },
  run: async ({ args }) => {
    const setDefaultResult = await setDefault({ label: args.label });

    if (!setDefaultResult.success) {
      switch (setDefaultResult.error) {
        case "wallet_not_found":
          return console.error(
            `Wallet with label "${args.label}" was not found`
          );
        default:
          return console.error(`Unknown error occured`);
      }
    }

    return console.log(
      `Account with label "${args.label}" has been set as default!`
    );
  },
});
