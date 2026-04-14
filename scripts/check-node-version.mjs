const supportedMajor = 22;
const [major] = process.versions.node.split(".").map(Number);

if (major !== supportedMajor) {
  console.error(
    [
      `Zucchini requires Node ${supportedMajor}.x.`,
      `Current Node: ${process.versions.node}.`,
      "Use Node 22 to match CI and avoid local Vitest/jsdom runtime failures.",
    ].join(" ")
  );
  process.exit(1);
}
