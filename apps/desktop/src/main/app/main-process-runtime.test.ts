import { resolveScreenshotDatabasePath } from "@/main/app/main-process-runtime";

describe("resolveScreenshotDatabasePath()", () => {
  it("ignores screenshot database path outside screenshot mode", () => {
    expect(
      resolveScreenshotDatabasePath({
        screenshotConfig: {
          databasePath: "/tmp/screenshot.db",
          outputPath: null,
          userDataPath: null,
        },
        screenshotMode: false,
      })
    ).toBeNull();
  });

  it("uses screenshot database path in screenshot mode", () => {
    expect(
      resolveScreenshotDatabasePath({
        screenshotConfig: {
          databasePath: "/tmp/screenshot.db",
          outputPath: null,
          userDataPath: null,
        },
        screenshotMode: true,
      })
    ).toBe("/tmp/screenshot.db");
  });
});
