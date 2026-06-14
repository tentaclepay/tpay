import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

import type { ClientSuiSigner } from "@tentaclepay/sui-x402";

import type { Account } from "../types";

export const createSuiSigner = (account: Account) => {
  const clientSuiSigner: ClientSuiSigner = {
    address: account.address as `0x${string}`,
    signTransaction: async (bytes) => {
      const { signature } = await keypair.signTransaction(fromBase64(bytes));

      return signature;
    },
  };

  return clientSuiSigner;
};
