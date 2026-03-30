import fs from "node:fs";
import path from "node:path";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { getElectronApp } from "./electron-app";
import type { SqliteDatabaseClient } from "./sqlite-client";

function resolveMigrationsFolder(): string {
  const candidates = [path.join(process.cwd(), "drizzle")];

  const electronApp = getElectronApp();
  if (electronApp) {
    candidates.push(path.join(electronApp.getAppPath(), "drizzle"));
  }

  candidates.push(path.join(__dirname, "../drizzle"));

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "meta", "_journal.json"))) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to find Drizzle migrations folder. Checked: ${candidates.join(", ")}`
  );
}

export function runMigrations(client: SqliteDatabaseClient): void {
  client.run("initializeSchema", () => {
    const migrationsFolder = resolveMigrationsFolder();
    migrate(client.getDrizzle(), {
      migrationsFolder,
    });
  });
}
