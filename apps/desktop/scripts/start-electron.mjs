import { spawn } from "node:child_process";

import { exitWithChild, resolveElectronPath } from "./electron-launcher.mjs";

const childEnv = { ...process.env };
delete childEnv.ELECTRON_RUN_AS_NODE;

const child = spawn(resolveElectronPath(), ["dist-electron/main.js"], {
  env: childEnv,
  stdio: "inherit",
});

child.on("exit", exitWithChild);
