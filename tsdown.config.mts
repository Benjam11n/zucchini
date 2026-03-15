import { defineConfig } from "tsdown";

const shared = {
  deps: {
    alwaysBundle: [/^drizzle-orm(\/.*)?$/, "effect", "zod"],
    neverBundle: [
      "better-sqlite3",
      "electron",
      "electron-updater",
      "macos-notification-state",
      "windows-notification-state",
    ],
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
