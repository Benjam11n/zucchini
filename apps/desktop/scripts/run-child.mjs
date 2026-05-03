import { spawn } from "node:child_process";

export function runChild(command, args, options) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    ...options,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}
