import { runChild } from "./run-child.mjs";

const hasSpaceInCwd = /\s/.test(process.cwd());

if (hasSpaceInCwd) {
  console.warn(
    [
      "Skipping electron-builder install-app-deps because the project path contains spaces.",
      "Native dependency rebuilds under this path are known to fail.",
      "Run the command from a space-free checkout if native rebuilds are required.",
    ].join(" ")
  );

  process.exit(0);
}

if (process.platform === "win32") {
  runChild(process.env["ComSpec"] ?? "cmd.exe", [
    "/d",
    "/s",
    "/c",
    "pnpm exec electron-builder install-app-deps",
  ]);
} else {
  runChild("pnpm", ["exec", "electron-builder", "install-app-deps"]);
}
