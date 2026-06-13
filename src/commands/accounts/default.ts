import { defineCommand } from "citty";

import { defaultHandler } from "../../handlers/accounts/default";

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
    const defaultResult = await defaultHandler({ label: args.label });

    if (!defaultResult.success) {
      switch (defaultResult.error) {
        case "wallet_not_exists":
          return console.error(
            `Wallet with label "${args.label}" are not exists`
          );
        default:
          return console.error(`Unknown error occured`);
      }
    }

    return console.log(
      `Account with label "${args.label}" was set as default!`
    );
  },
});
