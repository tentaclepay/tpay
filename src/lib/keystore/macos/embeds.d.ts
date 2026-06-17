// Ambient types for Bun's non-JS import attributes used by the keystore helper:
//   import src  from "./helper.swift" with { type: "text" }  -> source string
//   import path from "./tpay-helper"  with { type: "file" }  -> embedded path
// tsc has no loader for these, so declare them as default-string modules.

declare module "*.swift" {
  const source: string;
  export default source;
}

declare module "*/tpay-helper" {
  const path: string;
  export default path;
}
