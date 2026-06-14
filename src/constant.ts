import { homedir } from "node:os";
import { join } from "node:path";
import { SUI_DECIMALS } from "@mysten/sui/utils";

export const APP_NAME = "tpay";

export const CONFIG_DIR = process.env.TPAY_HOME ?? join(homedir(), ".tpay");
export const ACCOUNT_CONFIG_FILE_PATH = join(CONFIG_DIR, "accounts.yaml");

export const DEFAULT_NETWORK = "mainnet" as const;

export const SUI_COIN_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";

export const USDC_MAINNET_COIN_TYPE =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC" as const;
export const USDSUI_MAINNET_COIN_TYPE =
  "0x44f838219cf67b058f3b37907b655f226153c18e33dfcd0da559a844fea9b1c1::usdsui::USDSUI" as const;
export const SUI_USDE_MAINNET_COIN_TYPE =
  "0x41d587e5336f1c86cad50d38a7136db99333bb9bda91cea4ba69115defeb1402::sui_usde::SUI_USDE" as const;
export const USDY_MAINNET_COIN_TYPE =
  "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY" as const;
export const FDUSD_MAINNET_COIN_TYPE =
  "0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD" as const;
export const AUSD_MAINNET_COIN_TYPE =
  "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD" as const;
export const USDB_MAINNET_COIN_TYPE =
  "0xe14726c336e81b32328e92afc37345d159f5b550b09fa92bd43640cfdd0a0cfd::usdb::USDB" as const;

export const USDC_TESTNET_COIN_TYPE =
  "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC" as const;

export const USDC_DECIMALS = 6 as const;
export const USDSUI_DECIMALS = 6 as const;
export const SUI_USDE_DECIMALS = 6 as const;
export const USDY_DECIMALS = 6 as const;
export const FDUSD_DECIMALS = 6 as const;
export const AUSD_DECIMALS = 6 as const;
export const USDB_DECIMALS = 6 as const;

export const MAINNET_COIN_TYPES_DECIMALS = {
  [SUI_COIN_TYPE]: SUI_DECIMALS,
  [USDC_MAINNET_COIN_TYPE]: USDC_DECIMALS,
} as const;

export const TESTNET_COIN_TYPES_DECIMALS = {
  [SUI_COIN_TYPE]: SUI_DECIMALS,
  [USDC_TESTNET_COIN_TYPE]: USDC_DECIMALS,
} as const;
