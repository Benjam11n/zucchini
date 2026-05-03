import { resolveElectronPath } from "./electron-launcher.mjs";
import { runChild } from "./run-child.mjs";

const childEnv = { ...process.env };
delete childEnv.ELECTRON_RUN_AS_NODE;

runChild(resolveElectronPath(), ["dist-electron/main.js"], {
  env: childEnv,
});
