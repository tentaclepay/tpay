import { defineCommand } from "citty";

import { payWithCurl } from "../handlers/pay/curl";
import * as ui from "../lib/ui";
import { getState } from "../state";

export const curlCommand = defineCommand({
  meta: {
    name: "curl",
    description:
      "Run curl, settling any x402 payment automatically (forwards all curl flags)",
  },
  run: async ({ rawArgs: args }) => {
    const label = getState("account");

    const payWithCurlResult = await payWithCurl({
      label,
      args,
    });
    if (!payWithCurlResult.success) {
      switch (payWithCurlResult.error) {
        case "wallet_not_found":
          return ui.error(
            `Wallet "${label}" was not found.`,
            "Run `tpay account list` to see your wallets."
          );
        case "failed_to_build_transaction":
          return ui.error(
            "Couldn't build the payment.",
            payWithCurlResult.message ??
              "The wallet may not have enough balance for this request."
          );
        case "x402_payment_attempted":
          return ui.error(
            "This request already includes a payment header.",
            "Remove your PAYMENT-SIGNATURE / X-PAYMENT header — tpay adds it for you."
          );
        case "verification_failed":
          return ui.error(
            "Identity verification failed.",
            "Couldn't authorize the payment — authentication was cancelled."
          );
        default:
          return ui.error(
            "The request failed.",
            "Something went wrong while paying — please try again."
          );
      }
    }
  },
});
