import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

import type { ClientSuiSigner } from "@tentaclepay/sui-x402";

export const createSuiSigner = (keypair: Ed25519Keypair) => {
  const clientSuiSigner: ClientSuiSigner = {
    address: keypair.toSuiAddress() as `0x${string}`,
    signTransaction: async (bytes) => {
      const { signature } = await keypair.signTransaction(fromBase64(bytes));

      return signature;
    },
  };

  return clientSuiSigner;
};
