import { generateTestData } from "@/test/fixtures/test-data";
import type {
  GenerateTestDataOptions,
  TestDataPreset,
} from "@/test/fixtures/test-data";

function parseArgs(args: readonly string[]): GenerateTestDataOptions {
  const options: GenerateTestDataOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--preset") {
      const preset = args[index + 1];
      if (!preset) {
        throw new Error("Missing value for --preset.");
      }

      options.preset = preset as TestDataPreset;
      index += 1;
      continue;
    }

    if (argument === "--output") {
      const outputPath = args[index + 1];
      if (!outputPath) {
        throw new Error("Missing value for --output.");
      }

      options.outputPath = outputPath;
      index += 1;
      continue;
    }

    if (argument === "--seed") {
      const seed = args[index + 1];
      if (!seed) {
        throw new Error("Missing value for --seed.");
      }

      options.seed = Number(seed);
      index += 1;
      continue;
    }

    if (argument === "--overwrite") {
      options.overwrite = true;
    }
  }

  return options;
}

const stats = generateTestData(parseArgs(process.argv.slice(2)));

console.log(
  [
    `Generated ${stats.preset} fixture database`,
    `path: ${stats.databasePath}`,
    `habits: ${stats.habitCount}`,
    `status rows: ${stats.habitPeriodStatusCount}`,
    `daily summaries: ${stats.dailySummaryCount}`,
    `focus sessions: ${stats.focusSessionCount}`,
  ].join("\n")
);
