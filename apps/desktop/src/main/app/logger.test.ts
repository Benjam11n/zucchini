import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { createDesktopLogger } from "@/main/app/logger";

function createLoggerHarness() {
  const logsDirectoryPath = mkdtempSync(path.join(tmpdir(), "zucchini-logs-"));
  const writeStdout = vi
    .spyOn(process.stdout, "write")
    .mockImplementation(() => true);
  const writeStderr = vi
    .spyOn(process.stderr, "write")
    .mockImplementation(() => true);
  const logger = createDesktopLogger({
    app: {
      getPath: () => logsDirectoryPath,
    },
    clock: () => new Date("2026-03-31T12:00:00.000Z"),
  });

  return {
    logger,
    logsDirectoryPath,
    restore() {
      writeStdout.mockRestore();
      writeStderr.mockRestore();
    },
    writeStderr,
    writeStdout,
  };
}

function readLogRecords(logsDirectoryPath: string) {
  return readFileSync(path.join(logsDirectoryPath, "main.log"), "utf-8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

describe("createDesktopLogger()", () => {
  it("writes structured JSON log lines to the logs directory", () => {
    const { logger, logsDirectoryPath, restore, writeStderr, writeStdout } =
      createLoggerHarness();

    logger.error("Failed to warm app runtime.", new Error("boom"));

    const records = readLogRecords(logsDirectoryPath);

    expect(records).toStrictEqual([
      {
        details: [
          {
            message: "boom",
            name: "Error",
            stack: expect.any(String),
          },
        ],
        level: "error",
        message: "Failed to warm app runtime.",
        timestamp: "2026-03-31T12:00:00.000Z",
      },
    ]);

    expect(writeStdout).not.toHaveBeenCalled();
    expect(writeStderr).toHaveBeenCalledTimes(1);

    restore();
  });

  it("logs non-error details without losing their structure", () => {
    const { logger, logsDirectoryPath, restore, writeStderr, writeStdout } =
      createLoggerHarness();

    logger.warn("Permission request denied.", {
      permission: "notifications",
      url: "https://example.com",
    });

    const records = readLogRecords(logsDirectoryPath);

    expect(records[0]).toMatchObject({
      details: [
        {
          permission: "notifications",
          url: "https://example.com",
        },
      ],
      level: "warn",
      message: "Permission request denied.",
    });

    expect(writeStdout).toHaveBeenCalledTimes(1);
    expect(writeStderr).not.toHaveBeenCalled();

    restore();
  });
});
