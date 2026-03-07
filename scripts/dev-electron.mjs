import { spawn } from "node:child_process";
import { once } from "node:events";
import { watch } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

import waitOn from "wait-on";

import { resolveElectronPath } from "./electron-launcher.mjs";

const devServerUrl = "http://127.0.0.1:5173";
const requiredFiles = ["dist-electron/main.js", "dist-electron/preload.js"];
const watchedFiles = new Set(["main.js", "preload.js"]);
const childEnv = { ...process.env, VITE_DEV_SERVER_URL: devServerUrl };

delete childEnv.ELECTRON_RUN_AS_NODE;

await waitOn({
  resources: [
    `tcp:5173`,
    ...requiredFiles.map((filePath) => `file:${filePath}`),
  ],
});

let currentApp = null;
let restartTimer = null;
let shuttingDown = false;
const expectedExits = new WeakSet();

function startApp() {
  if (shuttingDown || currentApp) {
    return;
  }

  const app = spawn(resolveElectronPath(), ["dist-electron/main.js"], {
    cwd: process.cwd(),
    env: childEnv,
    stdio: "inherit",
  });

  currentApp = app;

  app.once("exit", () => {
    if (currentApp === app) {
      currentApp = null;
    }

    if (!shuttingDown && !expectedExits.has(app)) {
      scheduleRestart();
    }
  });
}

async function stopApp() {
  const app = currentApp;
  if (!app) {
    return;
  }

  currentApp = null;
  expectedExits.add(app);
  const abortController = new AbortController();
  const exitPromise = once(app, "exit").finally(() => {
    abortController.abort();
  });

  app.kill("SIGTERM");

  try {
    await delay(1500, undefined, {
      ref: false,
      signal: abortController.signal,
    });
    app.kill("SIGKILL");
  } catch {
    // Exit arrived before the timeout elapsed.
  }

  await exitPromise;
}

function scheduleRestart() {
  if (shuttingDown) {
    return;
  }

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(async () => {
    restartTimer = null;
    await stopApp();

    if (!shuttingDown) {
      startApp();
    }
  }, 150);
}

const watcher = watch(
  "dist-electron",
  { persistent: true },
  (_eventType, fileName) => {
    if (typeof fileName !== "string" || !watchedFiles.has(fileName)) {
      return;
    }

    scheduleRestart();
  }
);

async function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  watcher.close();
  await stopApp();
  process.exit(exitCode);
}

startApp();

process.once("SIGINT", () => {
  void shutdown(130);
});

process.once("SIGTERM", () => {
  void shutdown(143);
});
