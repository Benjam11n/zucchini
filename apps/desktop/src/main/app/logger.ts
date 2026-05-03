import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import type { DesktopLoggerAppPort, LoggerPort } from "@/main/app/ports";

interface CreateDesktopLoggerOptions {
  app: DesktopLoggerAppPort;
  clock?: () => Date;
}

interface LogRecord {
  details: unknown[];
  level: "error" | "info" | "warn";
  message: string;
  timestamp: string;
}

const LOG_FILE_NAME = "main.log";

function normalizeLogValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
    };
  }

  return value;
}

function safeSerializeValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(normalizeLogValue(value));
  } catch {
    return String(value);
  }
}

function createLogRecord(
  level: LogRecord["level"],
  args: unknown[],
  now: Date
): LogRecord {
  const [message, ...details] = args;

  return {
    details: details.map((detail) => normalizeLogValue(detail)),
    level,
    message:
      typeof message === "string" ? message : safeSerializeValue(message),
    timestamp: now.toISOString(),
  };
}

function writeLogRecord(
  app: DesktopLoggerAppPort,
  clock: NonNullable<CreateDesktopLoggerOptions["clock"]>,
  level: LogRecord["level"],
  args: unknown[]
): void {
  const record = createLogRecord(level, args, clock());
  const serialized = `${JSON.stringify(record)}\n`;
  const stream = level === "error" ? process.stderr : process.stdout;

  try {
    const logDirectoryPath = app.getPath("logs");
    mkdirSync(logDirectoryPath, {
      recursive: true,
    });
    appendFileSync(
      path.join(logDirectoryPath, LOG_FILE_NAME),
      serialized,
      "utf-8"
    );
  } catch (logWriteError) {
    stream.write(
      `${serialized.trimEnd()} ${safeSerializeValue(logWriteError)}\n`
    );
    return;
  }

  stream.write(serialized);
}

export function createDesktopLogger({
  app,
  clock = () => new Date(),
}: CreateDesktopLoggerOptions): LoggerPort {
  return {
    error: (...args) => writeLogRecord(app, clock, "error", args),
    info: (...args) => writeLogRecord(app, clock, "info", args),
    warn: (...args) => writeLogRecord(app, clock, "warn", args),
  };
}
