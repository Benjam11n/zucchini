import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

interface ElectronApp {
  getAppPath: () => string;
  getPath: (name: "userData") => string;
}

export function getElectronApp(): ElectronApp | null {
  try {
    const electron = require("electron") as {
      app?: ElectronApp;
    };

    return electron.app ?? null;
  } catch {
    return null;
  }
}
