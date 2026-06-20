import type { Account } from "../types";
import { getKeystore } from "./keystore/platform";
import { promptVerification } from "./verification";

export type SecretKeyError = "verification_failed" | "wallet_not_found";

/**
 * Resolve a wallet's secret key behind an OS verification prompt (Touch ID on
 * macOS). Shared by the x402 signer callbacks so the verify-then-read flow lives
 * in one place. Throws a `SecretKeyError` code on failure; callers record it on
 * their own error channel before re-throwing.
 */
export const getVerifiedSecretKey = async (
  account: Account,
  reason: string
): Promise<string> => {
  const verified = await promptVerification(account.keystore, reason);
  if (!verified) throw "verification_failed" satisfies SecretKeyError;

  const secretKey = await getKeystore(account.label);
  if (!secretKey) throw "wallet_not_found" satisfies SecretKeyError;

  return secretKey;
};
