// Statically embeds the prebuilt, code-signed Swift helper into the compiled
// binary. `scripts/build.ts` writes ./tpay-helper before `bun build --compile`:
//   - darwin targets: the swiftc-compiled, ad-hoc-signed helper binary
//   - other targets:  an empty sentinel (the macOS driver is never used there)
//
// This module is reached only via a catchable dynamic import from index.ts, so
// a missing ./tpay-helper during `bun run` dev degrades to a runtime swiftc
// compile instead of crashing module load. At build time the file always
// exists (build.ts guarantees it), so the import resolves and gets embedded.
import helperPath from "./tpay-helper" with { type: "file" };

export default helperPath;
