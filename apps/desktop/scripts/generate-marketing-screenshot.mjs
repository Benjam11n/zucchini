import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";

import { desktopDir, resolveElectronPath } from "./electron-launcher.mjs";

const repoRoot = path.resolve(desktopDir, "../..");
const outputPath = path.join(
  repoRoot,
  "apps/web/public/product/zucchini-app-preview.webp"
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.`);
  }
}

async function runElectronForScreenshot({
  databasePath,
  pngPath,
  userDataPath,
}) {
  const childEnv = {
    ...process.env,
    ZUCCHINI_SCREENSHOT_DB_PATH: databasePath,
    ZUCCHINI_SCREENSHOT_MODE: "1",
    ZUCCHINI_SCREENSHOT_OUTPUT_PATH: pngPath,
    ZUCCHINI_SCREENSHOT_USER_DATA_PATH: userDataPath,
  };
  delete childEnv.ELECTRON_RUN_AS_NODE;

  const child = spawn(resolveElectronPath(), ["dist-electron/main.js"], {
    cwd: desktopDir,
    env: childEnv,
    stdio: "inherit",
  });

  const [code, signal] = await once(child, "exit");
  if (signal) {
    throw new Error(`Electron screenshot process exited with ${signal}.`);
  }

  if (code !== 0) {
    throw new Error(`Electron screenshot process exited with ${code}.`);
  }
}

async function main() {
  const workspacePath = fs.mkdtempSync(
    path.join(os.tmpdir(), "zucchini-marketing-screenshot-")
  );
  const databasePath = path.join(workspacePath, "zucchini.db");
  const pngPath = path.join(workspacePath, "zucchini-app-preview.png");
  const userDataPath = path.join(workspacePath, "user-data");

  try {
    run("pnpm", ["run", "build:desktop"]);
    await runElectronForScreenshot({
      databasePath,
      pngPath,
      userDataPath,
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    await sharp(pngPath)
      .resize({ width: 1440, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(outputPath);

    console.log(`Wrote ${outputPath}`);
  } finally {
    fs.rmSync(workspacePath, { force: true, recursive: true });
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
