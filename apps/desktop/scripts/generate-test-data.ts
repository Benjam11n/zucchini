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
      options.preset = args[index + 1] as TestDataPreset;
      index += 1;
      continue;
    }

    if (argument === "--output") {
      options.outputPath = args[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--seed") {
      options.seed = Number(args[index + 1]);
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
