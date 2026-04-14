import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export interface LoggerLike {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

interface CreateDesktopLoggerOptions {
  appLike: {
    getPath(name: "logs"): string;
  };
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
  appLike: CreateDesktopLoggerOptions["appLike"],
  clock: NonNullable<CreateDesktopLoggerOptions["clock"]>,
  level: LogRecord["level"],
  args: unknown[]
): void {
  const record = createLogRecord(level, args, clock());
  const serialized = `${JSON.stringify(record)}\n`;
  const stream = level === "error" ? process.stderr : process.stdout;

  try {
    const logDirectoryPath = appLike.getPath("logs");
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
  appLike,
  clock = () => new Date(),
}: CreateDesktopLoggerOptions): LoggerLike {
  return {
    error: (...args) => writeLogRecord(appLike, clock, "error", args),
    info: (...args) => writeLogRecord(appLike, clock, "info", args),
    warn: (...args) => writeLogRecord(appLike, clock, "warn", args),
  };
}
