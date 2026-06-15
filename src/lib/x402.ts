import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

import type { ClientSuiSigner } from "@tentaclepay/sui-x402";

import type { Account } from "../types";

export const createSuiSigner = (
  account: Account,
  getSecretKey: (account: Account) => Promise<string>
): ClientSuiSigner => ({
  address: account.address as `0x${string}`,
  signTransaction: async (bytes) => {
    const secretKey = await getSecretKey(account);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);

    const { signature } = await keypair.signTransaction(fromBase64(bytes));

    return signature;
  },
});
