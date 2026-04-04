import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildHotspots,
  buildReport,
  collectSourceFiles,
  computeFileSimilarity,
  determineExitCode,
  extractCloneCandidates,
  groupCloneCandidates,
  normalizeBlockText,
  parseArgs,
  parseSourceText,
  runCli,
} from "../../../scripts/check-duplication";

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "zucchini-duplication-"));
}

function writeFile(
  tempDir: string,
  relativePath: string,
  contents: string
): string {
  const filePath = path.join(tempDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
  return filePath;
}

describe("check-duplication args", () => {
  it("uses the expected defaults", () => {
    expect(parseArgs([], "/repo")).toMatchObject({
      cwd: "/repo",
      failOn: "duplicate-percent",
      fileSimilarityThreshold: 0.3,
      json: false,
      jsonOut: null,
      maxFindings: 30,
      minLines: 8,
      minTokens: 40,
      root: "src",
      threshold: 3,
    });
  });

  it("accepts repeated include and exclude flags", () => {
    const parsed = parseArgs(
      ["--include", "src/custom/**/*.ts", "--exclude", "src/ignore/**"],
      "/repo"
    );

    expect(parsed.include).toContain("src/custom/**/*.ts");
    expect(parsed.exclude).toContain("src/ignore/**");
  });

  it("rejects invalid numeric values", () => {
    expect(() => parseArgs(["--threshold", "abc"], "/repo")).toThrow(
      "Invalid numeric value for --threshold: abc"
    );
  });

  it("rejects unknown flags", () => {
    expect(() => parseArgs(["--wat"], "/repo")).toThrow(
      "Unknown argument: --wat"
    );
  });
});

describe("check-duplication normalization", () => {
  it("strips comments, replaces literals, and normalizes identifiers", () => {
    const normalized = normalizeBlockText(`
      // comment
      const total = firstValue + 42;
      const label = "hello";
      return total + label.length;
    `);

    expect(normalized.lines).toStrictEqual([
      "const <id1> = <id2> + <num> ;",
      "const <id3> = <str> ;",
      "return <id1> + <id3> . <id4> ;",
    ]);
    expect(normalized.tokenCount).toBeGreaterThan(0);
  });

  it("keeps enough structure to distinguish unrelated blocks", () => {
    const left = normalizeBlockText("if (ready) { return save(item); }");
    const right = normalizeBlockText("while (ready) { save(item); }");

    expect(left.signature).not.toBe(right.signature);
  });
});

describe("check-duplication grouping", () => {
  it("groups identical logic with renamed identifiers", () => {
    const sourceA = parseSourceText(
      "src/a.ts",
      `
      export function alpha(items: number[]) {
        let total = 0;
        for (const item of items) {
          if (item > 0) {
            total += item;
          }
        }
        return total;
      }
    `
    );
    const sourceB = parseSourceText(
      "src/b.ts",
      `
      export function beta(values: number[]) {
        let count = 0;
        for (const value of values) {
          if (value > 0) {
            count += value;
          }
        }
        return count;
      }
    `
    );

    const candidates = [
      ...extractCloneCandidates(sourceA, { minLines: 4, minTokens: 10 }),
      ...extractCloneCandidates(sourceB, { minLines: 4, minTokens: 10 }),
    ];
    const groups = groupCloneCandidates(candidates);
    const functionGroup = groups.find(
      (group) =>
        group.occurrenceCount === 2 &&
        group.occurrences.some(
          (occurrence) => occurrence.symbolName === "alpha"
        ) &&
        group.occurrences.some((occurrence) => occurrence.symbolName === "beta")
    );

    expect(functionGroup).toMatchObject({
      duplicateLines: candidates[0]?.normalizedLineCount,
      occurrenceCount: 2,
    });
  });

  it("ignores blocks below the configured threshold", () => {
    const parsed = parseSourceText(
      "src/short.ts",
      `export function tiny() { return 1; }`
    );

    expect(
      extractCloneCandidates(parsed, { minLines: 8, minTokens: 40 })
    ).toStrictEqual([]);
  });
});

describe("check-duplication accounting", () => {
  it("counts only repeated occurrences beyond the first", () => {
    const cloneGroups = [
      {
        duplicateLines: 10,
        filesInvolved: ["src/a.ts", "src/b.ts", "src/c.ts"],
        id: "clone-1",
        normalizedLineCount: 5,
        occurrenceCount: 3,
        occurrences: [
          { endLine: 5, filePath: "src/a.ts", startLine: 1, symbolName: "a" },
          { endLine: 5, filePath: "src/b.ts", startLine: 1, symbolName: "b" },
          { endLine: 5, filePath: "src/c.ts", startLine: 1, symbolName: "c" },
        ],
        sampleLabel: "saveDraft",
      },
    ];

    expect(buildHotspots(cloneGroups)).toStrictEqual([
      {
        cloneGroupCount: 1,
        duplicateLines: 10,
        path: "src",
      },
    ]);
  });

  it("does not double-count overlapping duplicate ranges in the summary", () => {
    const parsedFile = parseSourceText(
      "src/dup.ts",
      `
      export function one() {
        const a = 1;
        const b = 2;
        const c = a + b;
        return c;
      }
    `
    );

    const cloneCandidates = [
      {
        absolutePath: parsedFile.absolutePath,
        endLine: 6,
        filePath: parsedFile.relativePath,
        normalizedLineCount: 4,
        signature: "sig-a",
        sourceExcerpt: "one",
        startLine: 2,
        symbolName: "one",
        tokenCount: 20,
      },
      {
        absolutePath: parsedFile.absolutePath,
        endLine: 5,
        filePath: parsedFile.relativePath,
        normalizedLineCount: 3,
        signature: "sig-a",
        sourceExcerpt: "one",
        startLine: 2,
        symbolName: "one-again",
        tokenCount: 20,
      },
      {
        absolutePath: parsedFile.absolutePath,
        endLine: 6,
        filePath: parsedFile.relativePath,
        normalizedLineCount: 4,
        signature: "sig-b",
        sourceExcerpt: "two",
        startLine: 2,
        symbolName: "two",
        tokenCount: 20,
      },
      {
        absolutePath: parsedFile.absolutePath,
        endLine: 6,
        filePath: parsedFile.relativePath,
        normalizedLineCount: 4,
        signature: "sig-b",
        sourceExcerpt: "two",
        startLine: 2,
        symbolName: "two-again",
        tokenCount: 20,
      },
    ];

    const { report } = buildReport(
      [parsedFile],
      cloneCandidates,
      parseArgs(["--threshold", "50"], process.cwd())
    );

    expect(report.summary.duplicatedNormalizedLines).toBeLessThanOrEqual(
      report.summary.totalNormalizedLines
    );
  });
});

describe("check-duplication file similarity", () => {
  it("reports similar files and skips tiny files", () => {
    const left = parseSourceText(
      "src/left.ts",
      Array.from(
        { length: 35 },
        (_, index) => `const item${index} = ${index};`
      ).join("\n")
    );
    const right = parseSourceText(
      "src/right.ts",
      Array.from(
        { length: 35 },
        (_, index) => `const value${index} = ${index + 100};`
      ).join("\n")
    );
    const tiny = parseSourceText("src/tiny.ts", "const only = 1;");

    const pairs = computeFileSimilarity([left, right, tiny], {
      fileSimilarityThreshold: 0.35,
    });

    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.similarityScore).toBeGreaterThanOrEqual(0.35);
  });
});

describe("check-duplication exit codes", () => {
  it("returns 0 when the threshold is not exceeded", () => {
    expect(
      determineExitCode({
        blockCloneGroups: [],
        fileSimilarityPairs: [],
        generatedAt: new Date().toISOString(),
        hotspots: [],
        options: {
          exclude: [],
          failOn: "duplicate-percent",
          fileSimilarityThreshold: 0.35,
          include: [],
          maxFindings: 20,
          minLines: 8,
          minTokens: 40,
          threshold: 5,
        },
        root: "src",
        summary: {
          analyzedFileCount: 0,
          duplicatePercent: 1,
          duplicatedNormalizedLines: 1,
          thresholdExceeded: false,
          totalNormalizedLines: 100,
        },
      })
    ).toBe(0);
  });

  it("returns 1 when the threshold is exceeded", () => {
    expect(
      determineExitCode({
        blockCloneGroups: [],
        fileSimilarityPairs: [],
        generatedAt: new Date().toISOString(),
        hotspots: [],
        options: {
          exclude: [],
          failOn: "duplicate-percent",
          fileSimilarityThreshold: 0.35,
          include: [],
          maxFindings: 20,
          minLines: 8,
          minTokens: 40,
          threshold: 5,
        },
        root: "src",
        summary: {
          analyzedFileCount: 0,
          duplicatePercent: 10,
          duplicatedNormalizedLines: 10,
          thresholdExceeded: true,
          totalNormalizedLines: 100,
        },
      })
    ).toBe(1);
  });

  it("returns 2 on invalid CLI input", () => {
    expect(runCli(["--threshold", "nope"], process.cwd())).toBe(2);
  });
});

describe("check-duplication integration", () => {
  it("finds a block clone group, a similarity pair, and computes duplicate percent", () => {
    const tempDir = createTempDir();
    writeFile(
      tempDir,
      "src/date-a.ts",
      `
      export function formatSessionDate(input: string) {
        const date = new Date(input);
        const formatter = new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
          weekday: "short",
        });
        return formatter.format(date);
      }
      `
    );
    writeFile(
      tempDir,
      "src/date-b.ts",
      `
      export function formatReviewDate(value: string) {
        const parsed = new Date(value);
        const formatDate = new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
          weekday: "short",
        });
        return formatDate.format(parsed);
      }
      `
    );
    writeFile(
      tempDir,
      "src/form-a.ts",
      `
      export async function saveA(state: Record<string, number>) {
        const payload = { ...state };
        await api.save(payload);
        return payload;
      }
      `.repeat(8)
    );
    writeFile(
      tempDir,
      "src/form-b.ts",
      `
      export async function saveB(draft: Record<string, number>) {
        const payload = { ...draft };
        await api.persist(payload);
        return payload;
      }
      `.repeat(8)
    );
    writeFile(tempDir, "src/other.ts", `export const unrelated = 1;`);

    const options = parseArgs(["--threshold", "99"], tempDir);
    const files = collectSourceFiles(options);
    const parsedFiles = files.map((filePath) =>
      parseSourceText(
        path.relative(tempDir, filePath),
        fs.readFileSync(filePath, "utf8")
      )
    );
    const cloneCandidates = parsedFiles.flatMap((parsedFile) =>
      extractCloneCandidates(parsedFile, options)
    );
    const { report } = buildReport(parsedFiles, cloneCandidates, options);

    expect(report.blockCloneGroups.length).toBeGreaterThanOrEqual(1);
    expect(report.fileSimilarityPairs.length).toBeGreaterThanOrEqual(1);
    expect(report.summary.duplicatePercent).toBeGreaterThan(0);
  });
});
