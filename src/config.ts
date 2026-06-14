import fs from "node:fs/promises";

import { CONFIG_DIR } from "./constant";

export const isConfigDirExists = async () => fs.exists(CONFIG_DIR);
export const createConfigDir = async () =>
  fs.mkdir(CONFIG_DIR, { recursive: true });
