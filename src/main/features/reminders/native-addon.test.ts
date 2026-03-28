import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { hasNativeAddonBinary } from "./native-addon";

function createPackageRoot(): string {
  const packageRoot = mkdtempSync(
    path.join(os.tmpdir(), "zucchini-native-addon-")
  );
  writeFileSync(path.join(packageRoot, "package.json"), "{}");
  return packageRoot;
}

describe("hasNativeAddonBinary()", () => {
  it("returns true when the release build binary exists", () => {
    const packageRoot = createPackageRoot();

    try {
      mkdirSync(path.join(packageRoot, "build", "Release"), {
        recursive: true,
      });
      writeFileSync(
        path.join(packageRoot, "build", "Release", "notificationstate.node"),
        ""
      );

      expect(
        hasNativeAddonBinary({
          bindingName: "notificationstate",
          packageName: "macos-notification-state",
          resolvePackageJson: () => path.join(packageRoot, "package.json"),
        })
      ).toBe(true);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("returns true when the ABI-specific binding exists", () => {
    const packageRoot = createPackageRoot();
    const runtimeAbi = "143";
    const platform = "darwin";
    const arch = "arm64";

    try {
      mkdirSync(
        path.join(
          packageRoot,
          "lib",
          "binding",
          `node-v${runtimeAbi}-${platform}-${arch}`
        ),
        { recursive: true }
      );
      writeFileSync(
        path.join(
          packageRoot,
          "lib",
          "binding",
          `node-v${runtimeAbi}-${platform}-${arch}`,
          "notificationstate.node"
        ),
        ""
      );

      expect(
        hasNativeAddonBinary({
          arch,
          bindingName: "notificationstate",
          packageName: "macos-notification-state",
          platform,
          resolvePackageJson: () => path.join(packageRoot, "package.json"),
          runtimeAbi,
        })
      ).toBe(true);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("returns false when no known binding path exists", () => {
    const packageRoot = createPackageRoot();

    try {
      expect(
        hasNativeAddonBinary({
          bindingName: "notificationstate",
          packageName: "macos-notification-state",
          resolvePackageJson: () => path.join(packageRoot, "package.json"),
        })
      ).toBe(false);
    } finally {
      rmSync(packageRoot, { force: true, recursive: true });
    }
  });

  it("returns false when the package cannot be resolved", () => {
    expect(
      hasNativeAddonBinary({
        bindingName: "notificationstate",
        packageName: "macos-notification-state",
        resolvePackageJson: () => {
          throw new Error("missing package");
        },
      })
    ).toBe(false);
  });
});
