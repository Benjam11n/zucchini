/**
 * Fatal error reporting and graceful shutdown.
 *
 * Handles uncaught exceptions and unhandled rejections in the main process.
 * Shows a native error dialog, cleans up runtime resources, and exits the
 * process. Uses Electron's `showErrorBox` for macOS/Windows compatibility.
 */
const FATAL_ERROR_TITLE = "Zucchini needs to close";
const FATAL_ERROR_MESSAGE =
  "Zucchini hit an unexpected desktop error and will close. Please reopen the app.";

type FatalErrorContext = "uncaughtException" | "unhandledRejection";

interface FatalErrorAppLike {
  exit(code?: number): void;
  isReady(): boolean;
}

interface FatalErrorDialogLike {
  showErrorBox(title: string, content: string): void;
}

interface LoggerLike {
  error: (...args: unknown[]) => void;
}

interface CreateFatalErrorReporterOptions {
  appLike: FatalErrorAppLike;
  cleanup: () => void;
  dialogLike: FatalErrorDialogLike;
  log: LoggerLike;
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
  appLike,
  cleanup,
  dialogLike,
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

    if (appLike.isReady()) {
      dialogLike.showErrorBox(FATAL_ERROR_TITLE, FATAL_ERROR_MESSAGE);
    }

    cleanup();
    appLike.exit(1);
  };
}
