import { defineConfig } from "tsdown";

const shared = {
  deps: {
    alwaysBundle: [/^drizzle-orm(\/.*)?$/, "effect", "zod"],
    neverBundle: ["better-sqlite3", "electron", "electron-updater"],
  },
  format: "cjs" as const,
  outDir: "dist-electron",
  outExtensions: () => ({ js: ".js" }),
  sourcemap: true,
};

export default defineConfig([
  {
    ...shared,
    clean: true,
    entry: ["src/main/main.ts"],
  },
  {
    ...shared,
    entry: ["src/preload/preload.ts"],
  },
]);
