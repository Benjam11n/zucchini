const supportedMajor = 24;
const [major] = process.versions.node.split(".").map(Number);

if (major !== supportedMajor) {
  console.error(
    [
      `Zucchini requires Node ${supportedMajor}.x.`,
      `Current Node: ${process.versions.node}.`,
      "Use Node 24 to match CI and deployment environments.",
    ].join(" ")
  );
  process.exit(1);
}
