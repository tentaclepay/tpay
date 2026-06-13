import fs from "node:fs/promises";

import { TPAY_DIR } from "../constant";

export const initTpay = async () => {
  const isTpayDirExists = await fs.exists(TPAY_DIR);
  if (!isTpayDirExists) await fs.mkdir(TPAY_DIR, { recursive: true });
};
