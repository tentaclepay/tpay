import { homedir } from "node:os";
import { join } from "node:path";

export const TPAY_NAME = "tpay";

export const TPAY_DIR = process.env.TPAY_HOME ?? join(homedir(), ".tpay");
export const CONFIG_PATH = join(TPAY_DIR, "config.yaml");
export const ACCOUNT_PATH = join(TPAY_DIR, "accounts.yaml");

export const DEFAULT_NETWORK = "mainnet" as const;
