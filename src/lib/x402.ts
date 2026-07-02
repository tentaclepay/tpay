import type { ClientEvmSigner } from "@x402/evm";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

import type { ClientSuiSigner } from "@tentaclepay/sui-x402";
import { createCrossChainEvmSigner } from "@tentaclepay/sdk/x402/evm";

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

export const createEvmSigner = async (
  account: Account,
  getSecretKey: (account: Account) => Promise<string>
): Promise<ClientEvmSigner> => {
  const verifierUrl = "http://testnet-verifier.tentaclepay.com";

  const suiClient = new SuiGrpcClient({
    network: "testnet",
    baseUrl: "https://fullnode.testnet.sui.io:443",
  });

  const addressResponse = await fetch(`${verifierUrl}/address?network=evm`);
  if (!addressResponse.ok) throw new Error("Failed to fetch signer address");

  const { address } = (await addressResponse.json()) as {
    address: `0x${string}`;
  };

  return {
    address,
    signTypedData: async (typedData) => {
      const secretKey = await getSecretKey(account);
      const keypair = Ed25519Keypair.fromSecretKey(secretKey);

      const crossChainEvmSigner = await createCrossChainEvmSigner(keypair, {
        verifierUrl,
        suiClient,
      });

      return crossChainEvmSigner.signTypedData(typedData);
    },
  };
};
