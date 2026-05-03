import {
  createFatalErrorReporter,
  normalizeFatalError,
} from "@/main/app/fatal-error";

describe("normalizeFatalError()", () => {
  it("returns the original error when one is provided", () => {
    const error = new Error("boom");

    expect(normalizeFatalError(error)).toBe(error);
  });

  it("wraps string reasons in an Error", () => {
    expect(normalizeFatalError("boom").message).toBe("boom");
  });

  it("normalizes non-error values", () => {
    expect(normalizeFatalError({ reason: "boom" }).message).toBe(
      JSON.stringify({
        reason: "boom",
      })
    );
  });
});

describe("createFatalErrorReporter()", () => {
  function createHarness({ isReady = true }: { isReady?: boolean } = {}) {
    const app = {
      exit: vi.fn(),
      isReady: vi.fn(() => isReady),
    };
    const cleanup = vi.fn();
    const dialog = {
      showErrorBox: vi.fn(),
    };
    const log = {
      error: vi.fn(),
    };

    return {
      app,
      cleanup,
      dialog,
      log,
      reportFatalError: createFatalErrorReporter({
        app,
        cleanup,
        dialog,
        log,
      }),
    };
  }

  it("logs, shows an error dialog, cleans up, and exits for fatal errors", () => {
    const harness = createHarness();
    const error = new Error("boom");

    harness.reportFatalError("uncaughtException", error);

    expect(harness.log.error).toHaveBeenCalledWith(
      "Fatal uncaughtException in the Electron main process.",
      error
    );
    expect(harness.dialog.showErrorBox).toHaveBeenCalledWith(
      "Zucchini needs to close",
      "Zucchini hit an unexpected desktop error and will close. Please reopen the app."
    );
    expect(harness.cleanup).toHaveBeenCalledWith();
    expect(harness.app.exit).toHaveBeenCalledWith(1);
  });

  it("skips the dialog when Electron is not ready yet", () => {
    const harness = createHarness({
      isReady: false,
    });

    harness.reportFatalError("unhandledRejection", "boom");

    expect(harness.dialog.showErrorBox).not.toHaveBeenCalled();
    expect(harness.cleanup).toHaveBeenCalledWith();
    expect(harness.app.exit).toHaveBeenCalledWith(1);
  });

  it("only performs cleanup and exit once for repeated fatal errors", () => {
    const harness = createHarness();

    harness.reportFatalError("uncaughtException", new Error("first"));
    harness.reportFatalError("unhandledRejection", new Error("second"));

    expect(harness.cleanup.mock.calls).toStrictEqual([[]]);
    expect(harness.app.exit.mock.calls).toStrictEqual([[1]]);
    expect(harness.log.error).toHaveBeenCalledTimes(2);
  });
});
