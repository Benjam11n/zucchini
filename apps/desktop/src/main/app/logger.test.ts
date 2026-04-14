import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { createDesktopLogger } from "@/main/app/logger";

describe("createDesktopLogger()", () => {
  it("writes structured JSON log lines to the logs directory", () => {
    const logsDirectoryPath = mkdtempSync(
      path.join(tmpdir(), "zucchini-logs-")
    );
    const writeStdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const writeStderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const logger = createDesktopLogger({
      appLike: {
        getPath: () => logsDirectoryPath,
      },
      clock: () => new Date("2026-03-31T12:00:00.000Z"),
    });

    logger.error("Failed to warm app runtime.", new Error("boom"));

    const records = readFileSync(
      path.join(logsDirectoryPath, "main.log"),
      "utf-8"
    )
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

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

    writeStdout.mockRestore();
    writeStderr.mockRestore();
  });

  it("logs non-error details without losing their structure", () => {
    const logsDirectoryPath = mkdtempSync(
      path.join(tmpdir(), "zucchini-logs-")
    );
    const writeStdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const writeStderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const logger = createDesktopLogger({
      appLike: {
        getPath: () => logsDirectoryPath,
      },
      clock: () => new Date("2026-03-31T12:00:00.000Z"),
    });

    logger.warn("Permission request denied.", {
      permission: "notifications",
      url: "https://example.com",
    });

    const records = readFileSync(
      path.join(logsDirectoryPath, "main.log"),
      "utf-8"
    )
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

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

    writeStdout.mockRestore();
    writeStderr.mockRestore();
  });
});
