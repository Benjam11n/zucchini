import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

interface NativeAddonBinaryOptions {
  arch?: string;
  bindingName: string;
  fileExists?: (filePath: string) => boolean;
  packageName: string;
  platform?: NodeJS.Platform;
  resolvePackageJson?: (specifier: string) => string;
  runtimeAbi?: string;
}

export function hasNativeAddonBinary({
  arch = process.arch,
  bindingName,
  fileExists = existsSync,
  packageName,
  platform = process.platform,
  resolvePackageJson = (specifier: string) => require.resolve(specifier),
  runtimeAbi = process.versions.modules,
}: NativeAddonBinaryOptions): boolean {
  try {
    const packageJsonPath = resolvePackageJson(`${packageName}/package.json`);
    const packageRoot = path.dirname(packageJsonPath);
    const candidatePaths = [
      path.join(packageRoot, "build", "Release", `${bindingName}.node`),
      path.join(packageRoot, "build", `${bindingName}.node`),
      path.join(
        packageRoot,
        "lib",
        "binding",
        `node-v${runtimeAbi}-${platform}-${arch}`,
        `${bindingName}.node`
      ),
    ];

    return candidatePaths.some((candidatePath) => fileExists(candidatePath));
  } catch {
    return false;
  }
}
