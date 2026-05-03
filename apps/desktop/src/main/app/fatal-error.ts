/**
 * Fatal error reporting and graceful shutdown.
 *
 * Handles uncaught exceptions and unhandled rejections in the main process.
 * Shows a native error dialog, cleans up runtime resources, and exits the
 * process. Uses Electron's `showErrorBox` for macOS/Windows compatibility.
 */
import type {
  FatalErrorAppPort,
  FatalErrorDialogPort,
  LoggerPort,
} from "@/main/app/ports";

const FATAL_ERROR_TITLE = "Zucchini needs to close";
const FATAL_ERROR_MESSAGE =
  "Zucchini hit an unexpected desktop error and will close. Please reopen the app.";

type FatalErrorContext = "uncaughtException" | "unhandledRejection";

interface CreateFatalErrorReporterOptions {
  app: FatalErrorAppPort;
  cleanup: () => void;
  dialog: FatalErrorDialogPort;
  log: Pick<LoggerPort, "error">;
}

export function normalizeFatalError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
}

export function createFatalErrorReporter({
  app,
  cleanup,
  dialog,
  log,
}: CreateFatalErrorReporterOptions) {
  let hasHandledFatalError = false;

  return (context: FatalErrorContext, error: unknown): void => {
    const normalizedError = normalizeFatalError(error);

    log.error(
      `Fatal ${context} in the Electron main process.`,
      normalizedError
    );

    if (hasHandledFatalError) {
      return;
    }

    hasHandledFatalError = true;

    if (app.isReady()) {
      dialog.showErrorBox(FATAL_ERROR_TITLE, FATAL_ERROR_MESSAGE);
    }

    cleanup();
    app.exit(1);
  };
}
