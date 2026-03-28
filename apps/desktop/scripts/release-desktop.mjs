import { spawn } from "node:child_process";

const targetsByPlatform = {
  darwin: ["--mac", "dmg", "zip"],
  win32: ["--win", "nsis"],
};

const targetArgs = targetsByPlatform[process.platform];

if (!targetArgs) {
  console.error(
    "dist:release is only supported on macOS and Windows. Use dist:release:mac or dist:release:win directly on supported runners."
  );
  process.exit(1);
}

const command = process.platform === "win32" ? "bunx.cmd" : "bunx";
const child = spawn(
  command,
  [
    "electron-builder",
    "--config",
    "electron-builder.config.ts",
    ...targetArgs,
    "--publish",
    "always",
  ],
  {
    cwd: process.cwd(),
    stdio: "inherit",
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
