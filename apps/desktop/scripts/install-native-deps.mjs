import { spawn } from "node:child_process";

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

const child =
  process.platform === "win32"
    ? spawn(
        process.env["ComSpec"] ?? "cmd.exe",
        ["/d", "/s", "/c", "pnpm exec electron-builder install-app-deps"],
        {
          cwd: process.cwd(),
          stdio: "inherit",
        }
      )
    : spawn("pnpm", ["exec", "electron-builder", "install-app-deps"], {
        cwd: process.cwd(),
        stdio: "inherit",
      });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
