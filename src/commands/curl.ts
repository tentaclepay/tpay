import { defineCommand } from "citty";

import { payWithCurl } from "../handlers/pay/curl";
import { getState } from "../state";

export const curlCommand = defineCommand({
  meta: { name: "curl", description: "cURL" },
  run: async ({ rawArgs: args }) => {
    const label = getState("account");

    const payWithCurlResult = await payWithCurl({
      label,
      args,
    });
    if (!payWithCurlResult.success) {
      switch (payWithCurlResult.error) {
        case "wallet_not_found":
          return console.error(`Wallet with label "${label}" was not found`);
        case "faled_to_build_transaction":
          return console.error(
            payWithCurlResult.message ?? "Failed to build transaction"
          );
        case "x402_payment_attempted":
          return console.error("Payment signature header already provided");
        case "verification_failed":
          return console.error(
            "Verification failed! Unable to pay with this wallet"
          );
        default:
          return console.error("Unknown error occured");
      }
    }
  },
});
