import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const DEFAULT_INCLUDE = ["src/**/*.ts", "src/**/*.tsx"];
const DEFAULT_EXCLUDE = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "src/test/**",
  "drizzle/**",
  "dist-electron/**",
  "node_modules/**",
];
const DEFAULT_THRESHOLD = 5;
const DEFAULT_MIN_LINES = 8;
const DEFAULT_MIN_TOKENS = 40;
const DEFAULT_MAX_FINDINGS = 20;
const DEFAULT_FILE_SIMILARITY_THRESHOLD = 0.35;
const DEFAULT_SHINGLE_SIZE = 5;
const VALID_FAIL_ON = "duplicate-percent";

const CANDIDATE_START_TOKENS = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.VariableStatement,
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.SwitchStatement,
]);

const STRING_TOKEN_KINDS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
  ts.SyntaxKind.JsxTextAllWhiteSpaces,
]);

const NUMERIC_TOKEN_KINDS = new Set([
  ts.SyntaxKind.NumericLiteral,
  ts.SyntaxKind.BigIntLiteral,
]);

export interface CliOptions {
  cwd: string;
  exclude: string[];
  failOn: "duplicate-percent";
  fileSimilarityThreshold: number;
  include: string[];
  json: boolean;
  jsonOut: string | null;
  maxFindings: number;
  minLines: number;
  minTokens: number;
  root: string;
  threshold: number;
}

export interface ParsedFile {
  absolutePath: string;
  normalizedLines: string[];
  relativePath: string;
  shingleSet: Set<string>;
  significantLineNumbers: Set<number>;
  sourceFile: ts.SourceFile;
  sourceText: string;
}

export interface NormalizedBlock {
  lineCount: number;
  lines: string[];
  signature: string;
  tokenCount: number;
}

export interface CloneCandidate {
  absolutePath: string;
  endLine: number;
  filePath: string;
  normalizedLineCount: number;
  signature: string;
  sourceExcerpt: string;
  startLine: number;
  symbolName: string | null;
  tokenCount: number;
}

export interface CloneOccurrence {
  filePath: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
}

export interface BlockCloneGroup {
  duplicateLines: number;
  filesInvolved: string[];
  id: string;
  normalizedLineCount: number;
  occurrenceCount: number;
  occurrences: CloneOccurrence[];
  sampleLabel: string;
}

export interface FileSimilarityPair {
  leftFilePath: string;
  rightFilePath: string;
  sharedShingleCount: number;
  similarityScore: number;
}

export interface HotspotEntry {
  cloneGroupCount: number;
  duplicateLines: number;
  path: string;
}

export interface DuplicationReport {
  blockCloneGroups: BlockCloneGroup[];
  fileSimilarityPairs: FileSimilarityPair[];
  generatedAt: string;
  hotspots: HotspotEntry[];
  options: {
    exclude: string[];
    failOn: "duplicate-percent";
    fileSimilarityThreshold: number;
    include: string[];
    maxFindings: number;
    minLines: number;
    minTokens: number;
    threshold: number;
  };
  root: string;
  summary: {
    analyzedFileCount: number;
    duplicatePercent: number;
    duplicatedNormalizedLines: number;
    thresholdExceeded: boolean;
    totalNormalizedLines: number;
  };
}

interface ReportBuildResult {
  report: DuplicationReport;
  threshold: number;
}

interface FileSimilarityComputationOptions {
  fileSimilarityThreshold: number;
}

function isKeywordToken(kind: ts.SyntaxKind): boolean {
  return (
    kind >= ts.SyntaxKind.FirstKeyword && kind <= ts.SyntaxKind.LastKeyword
  );
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(glob: string): RegExp {
  let pattern = "^";

  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const nextChar = glob[index + 1];
    if (!char) {
      continue;
    }

    if (char === "*") {
      if (nextChar === "*") {
        const afterDouble = glob[index + 2];
        if (afterDouble === "/") {
          pattern += "(?:.*/)?";
          index += 2;
        } else {
          pattern += ".*";
          index += 1;
        }
      } else {
        pattern += "[^/]*";
      }
      continue;
    }

    if (char === "?") {
      pattern += "[^/]";
      continue;
    }

    if (char === "/") {
      pattern += "/";
      continue;
    }

    pattern += escapeRegExp(char);
  }

  pattern += "$";
  return new RegExp(pattern);
}

function compileGlobs(globs: string[]): RegExp[] {
  return globs.map(globToRegExp);
}

function matchesAny(filePath: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(filePath));
}

function validateNumberFlag(
  name: string,
  rawValue: string | undefined
): number {
  if (!rawValue) {
    throw new Error(`Missing value for ${name}.`);
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`Invalid numeric value for ${name}: ${rawValue}`);
  }

  return parsed;
}

export function parseArgs(
  argv: readonly string[],
  cwd = process.cwd()
): CliOptions {
  const options: CliOptions = {
    cwd,
    exclude: [...DEFAULT_EXCLUDE],
    failOn: VALID_FAIL_ON,
    fileSimilarityThreshold: DEFAULT_FILE_SIMILARITY_THRESHOLD,
    include: [...DEFAULT_INCLUDE],
    json: false,
    jsonOut: null,
    maxFindings: DEFAULT_MAX_FINDINGS,
    minLines: DEFAULT_MIN_LINES,
    minTokens: DEFAULT_MIN_TOKENS,
    root: "src",
    threshold: DEFAULT_THRESHOLD,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const nextValue = argv[index + 1];

    switch (argument) {
      case "--root": {
        if (!nextValue) {
          throw new Error("Missing value for --root.");
        }
        options.root = nextValue;
        index += 1;
        break;
      }
      case "--include": {
        if (!nextValue) {
          throw new Error("Missing value for --include.");
        }
        options.include.push(nextValue);
        index += 1;
        break;
      }
      case "--exclude": {
        if (!nextValue) {
          throw new Error("Missing value for --exclude.");
        }
        options.exclude.push(nextValue);
        index += 1;
        break;
      }
      case "--json": {
        options.json = true;
        break;
      }
      case "--json-out": {
        if (!nextValue) {
          throw new Error("Missing value for --json-out.");
        }
        options.jsonOut = nextValue;
        index += 1;
        break;
      }
      case "--threshold": {
        options.threshold = validateNumberFlag("--threshold", nextValue);
        index += 1;
        break;
      }
      case "--min-lines": {
        options.minLines = validateNumberFlag("--min-lines", nextValue);
        index += 1;
        break;
      }
      case "--min-tokens": {
        options.minTokens = validateNumberFlag("--min-tokens", nextValue);
        index += 1;
        break;
      }
      case "--max-findings": {
        options.maxFindings = validateNumberFlag("--max-findings", nextValue);
        index += 1;
        break;
      }
      case "--file-similarity-threshold": {
        options.fileSimilarityThreshold = validateNumberFlag(
          "--file-similarity-threshold",
          nextValue
        );
        index += 1;
        break;
      }
      case "--fail-on": {
        if (!nextValue) {
          throw new Error("Missing value for --fail-on.");
        }
        if (nextValue !== VALID_FAIL_ON) {
          throw new Error(`Unsupported --fail-on value: ${nextValue}`);
        }
        options.failOn = nextValue;
        index += 1;
        break;
      }
      default: {
        throw new Error(`Unknown argument: ${argument}`);
      }
    }
  }
  return options;
}

type EffectiveCliOptions = CliOptions;

function walkFiles(rootPath: string): string[] {
  const entries = fs.readdirSync(rootPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(rootPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

export function collectSourceFiles(options: EffectiveCliOptions): string[] {
  const rootPath = path.resolve(options.cwd, options.root);
  if (!fs.existsSync(rootPath)) {
    throw new Error(`Root path does not exist: ${options.root}`);
  }

  const includePatterns = compileGlobs(options.include);
  const excludePatterns = compileGlobs(options.exclude);

  return walkFiles(rootPath)
    .map((absolutePath) => {
      const relativePath = toPosixPath(
        path.relative(options.cwd, absolutePath)
      );
      return { absolutePath, relativePath };
    })
    .filter(({ relativePath }) => {
      if (!matchesAny(relativePath, includePatterns)) {
        return false;
      }
      return !matchesAny(relativePath, excludePatterns);
    })
    .map(({ absolutePath }) => absolutePath)
    .toSorted((left, right) => left.localeCompare(right));
}

function buildNormalizedLines(
  sourceFile: ts.SourceFile,
  normalizedLexemes: { kind: ts.SyntaxKind; line: number; value: string }[]
): { normalizedLines: string[]; significantLineNumbers: Set<number> } {
  const lineBuckets = new Map<number, string[]>();
  const significantLineNumbers = new Set<number>();

  for (const token of normalizedLexemes) {
    if (!token.value.trim()) {
      continue;
    }

    significantLineNumbers.add(token.line);
    const currentLine = lineBuckets.get(token.line) ?? [];
    currentLine.push(token.value);
    lineBuckets.set(token.line, currentLine);
  }

  const normalizedLines: string[] = [];
  const maxLine =
    sourceFile.getLineAndCharacterOfPosition(sourceFile.end).line + 1;

  for (let lineNumber = 1; lineNumber <= maxLine; lineNumber += 1) {
    const joined = (lineBuckets.get(lineNumber) ?? [])
      .join(" ")
      .replaceAll(/\s+/g, " ")
      .trim();
    if (joined) {
      normalizedLines.push(joined);
    }
  }

  return { normalizedLines, significantLineNumbers };
}

function getScriptKind(filePath: string): ts.ScriptKind {
  return filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function normalizeTokenValue(
  token: ts.SyntaxKind,
  tokenText: string,
  identifierMap: Map<string, string>
): string {
  if (STRING_TOKEN_KINDS.has(token)) {
    return "<str>";
  }

  if (NUMERIC_TOKEN_KINDS.has(token)) {
    return "<num>";
  }

  if (token === ts.SyntaxKind.Identifier) {
    const existing = identifierMap.get(tokenText);
    if (existing) {
      return existing;
    }

    const nextIdentifier = `<id${identifierMap.size + 1}>`;
    identifierMap.set(tokenText, nextIdentifier);
    return nextIdentifier;
  }

  if (isKeywordToken(token)) {
    return ts.tokenToString(token) ?? tokenText;
  }

  return ts.tokenToString(token) ?? tokenText;
}

function buildShingleSet(
  lines: string[],
  size = DEFAULT_SHINGLE_SIZE
): Set<string> {
  const shingles = new Set<string>();

  if (lines.length < size) {
    return shingles;
  }

  for (let index = 0; index <= lines.length - size; index += 1) {
    shingles.add(lines.slice(index, index + size).join("\u0001"));
  }

  return shingles;
}

export function normalizeBlockText(
  sourceText: string,
  filePath = "block.tsx"
): NormalizedBlock {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx")
      ? ts.LanguageVariant.JSX
      : ts.LanguageVariant.Standard,
    sourceText
  );
  const identifierMap = new Map<string, string>();
  const lineBuckets = new Map<number, string[]>();
  let tokenCount = 0;

  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) {
      break;
    }

    const tokenText = scanner.getTokenText();
    const value = normalizeTokenValue(token, tokenText, identifierMap);
    const line = sourceText.slice(0, scanner.getTokenPos()).split("\n").length;
    const bucket = lineBuckets.get(line) ?? [];
    bucket.push(value);
    lineBuckets.set(line, bucket);
    tokenCount += 1;
  }

  const lines = [...lineBuckets.entries()]
    .toSorted(([leftLine], [rightLine]) => leftLine - rightLine)
    .map(([, values]) => values.join(" ").replaceAll(/\s+/g, " ").trim())
    .filter(Boolean);

  return {
    lineCount: lines.length,
    lines,
    signature: lines.join("\n"),
    tokenCount,
  };
}

export function parseSourceText(
  filePath: string,
  sourceText: string
): ParsedFile {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath)
  );
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx")
      ? ts.LanguageVariant.JSX
      : ts.LanguageVariant.Standard,
    sourceText
  );
  const identifierMap = new Map<string, string>();
  const normalizedLexemes: {
    kind: ts.SyntaxKind;
    line: number;
    value: string;
  }[] = [];

  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) {
      break;
    }

    const tokenPos = scanner.getTokenPos();
    const line = sourceFile.getLineAndCharacterOfPosition(tokenPos).line + 1;
    normalizedLexemes.push({
      kind: token,
      line,
      value: normalizeTokenValue(token, scanner.getTokenText(), identifierMap),
    });
  }

  const { normalizedLines, significantLineNumbers } = buildNormalizedLines(
    sourceFile,
    normalizedLexemes
  );

  return {
    absolutePath: path.resolve(filePath),
    normalizedLines,
    relativePath: toPosixPath(filePath),
    shingleSet: buildShingleSet(normalizedLines),
    significantLineNumbers,
    sourceFile,
    sourceText,
  };
}

export function readAndParseFile(
  filePath: string,
  cwd = process.cwd()
): ParsedFile {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const parsed = parseSourceText(filePath, sourceText);

  return {
    ...parsed,
    relativePath: toPosixPath(path.relative(cwd, filePath)),
  };
}

function getNodeStartLine(sourceFile: ts.SourceFile, node: ts.Node): number {
  return (
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
  );
}

function getNodeEndLine(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
}

function getVariableFunctionName(node: ts.VariableStatement): string | null {
  for (const declaration of node.declarationList.declarations) {
    const { initializer } = declaration;
    if (
      initializer &&
      (ts.isArrowFunction(initializer) ||
        ts.isFunctionExpression(initializer)) &&
      ts.isIdentifier(declaration.name)
    ) {
      return declaration.name.text;
    }
  }

  return null;
}

function getNodeSymbolName(node: ts.Node): string | null {
  if (
    (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
    node.name
  ) {
    return node.name.text;
  }

  if (ts.isMethodDeclaration(node)) {
    const { name } = node;
    if (
      ts.isIdentifier(name) ||
      ts.isPrivateIdentifier(name) ||
      ts.isStringLiteral(name) ||
      ts.isNumericLiteral(name)
    ) {
      return name.text;
    }
  }

  if (ts.isVariableStatement(node)) {
    return getVariableFunctionName(node);
  }

  return null;
}

function isFunctionLikeVariableStatement(node: ts.VariableStatement): boolean {
  return node.declarationList.declarations.some((declaration) => {
    const { initializer } = declaration;
    return Boolean(
      initializer &&
      (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
    );
  });
}

function shouldConsiderNode(node: ts.Node): boolean {
  if (!CANDIDATE_START_TOKENS.has(node.kind)) {
    return false;
  }

  if (ts.isVariableStatement(node)) {
    return isFunctionLikeVariableStatement(node);
  }

  return true;
}

function createSourceExcerpt(sourceText: string): string {
  return (
    sourceText
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean)
      ?.slice(0, 80) ?? "anonymous block"
  );
}

function truncateLabel(value: string, maxLength = 88): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function extractCloneCandidates(
  parsedFile: ParsedFile,
  options: Pick<EffectiveCliOptions, "minLines" | "minTokens">
): CloneCandidate[] {
  const candidates: CloneCandidate[] = [];

  function visit(node: ts.Node) {
    if (shouldConsiderNode(node)) {
      const sourceText = parsedFile.sourceText.slice(
        node.getStart(parsedFile.sourceFile),
        node.getEnd()
      );
      const normalized = normalizeBlockText(
        sourceText,
        parsedFile.relativePath
      );

      if (
        normalized.lineCount >= options.minLines &&
        normalized.tokenCount >= options.minTokens
      ) {
        const symbolName = getNodeSymbolName(node);
        candidates.push({
          absolutePath: parsedFile.absolutePath,
          endLine: getNodeEndLine(parsedFile.sourceFile, node),
          filePath: parsedFile.relativePath,
          normalizedLineCount: normalized.lineCount,
          signature: normalized.signature,
          sourceExcerpt: createSourceExcerpt(sourceText),
          startLine: getNodeStartLine(parsedFile.sourceFile, node),
          symbolName,
          tokenCount: normalized.tokenCount,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(parsedFile.sourceFile);
  return candidates;
}

function createCloneGroupId(signature: string): string {
  return `clone-${ts.sys.createHash?.(signature) ?? Buffer.from(signature).toString("base64").slice(0, 16)}`;
}

function sortCandidates(candidates: CloneCandidate[]): CloneCandidate[] {
  return [...candidates].toSorted((left, right) => {
    const pathComparison = left.filePath.localeCompare(right.filePath);
    if (pathComparison !== 0) {
      return pathComparison;
    }

    return left.startLine - right.startLine;
  });
}

export function groupCloneCandidates(
  candidates: CloneCandidate[]
): BlockCloneGroup[] {
  const grouped = new Map<string, CloneCandidate[]>();

  for (const candidate of candidates) {
    const current = grouped.get(candidate.signature) ?? [];
    current.push(candidate);
    grouped.set(candidate.signature, current);
  }

  return [...grouped.entries()]
    .filter(([, groupedCandidates]) => groupedCandidates.length > 1)
    .map(([signature, groupedCandidates]) => {
      const occurrences = sortCandidates(groupedCandidates);
      const filesInvolved = [
        ...new Set(occurrences.map((occurrence) => occurrence.filePath)),
      ];
      const [representative] = occurrences;
      if (!representative) {
        throw new Error(
          "Expected at least one representative clone occurrence."
        );
      }
      return {
        duplicateLines:
          representative.normalizedLineCount * (occurrences.length - 1),
        filesInvolved,
        id: createCloneGroupId(signature),
        normalizedLineCount: representative.normalizedLineCount,
        occurrenceCount: occurrences.length,
        occurrences: occurrences.map((occurrence) => ({
          endLine: occurrence.endLine,
          filePath: occurrence.filePath,
          startLine: occurrence.startLine,
          symbolName: occurrence.symbolName,
        })),
        sampleLabel: truncateLabel(
          representative.symbolName ?? representative.sourceExcerpt
        ),
      };
    })
    .toSorted((left, right) => {
      if (right.duplicateLines !== left.duplicateLines) {
        return right.duplicateLines - left.duplicateLines;
      }
      return left.sampleLabel.localeCompare(right.sampleLabel);
    });
}

export function computeFileSimilarity(
  parsedFiles: ParsedFile[],
  options: FileSimilarityComputationOptions
): FileSimilarityPair[] {
  const pairs: FileSimilarityPair[] = [];

  for (let leftIndex = 0; leftIndex < parsedFiles.length; leftIndex += 1) {
    const leftFile = parsedFiles[leftIndex];
    if (!leftFile) {
      continue;
    }
    if (leftFile.normalizedLines.length < 30) {
      continue;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < parsedFiles.length;
      rightIndex += 1
    ) {
      const rightFile = parsedFiles[rightIndex];
      if (!rightFile) {
        continue;
      }
      if (rightFile.normalizedLines.length < 30) {
        continue;
      }

      const intersection = [...leftFile.shingleSet].filter((shingle) =>
        rightFile.shingleSet.has(shingle)
      ).length;
      if (intersection === 0) {
        continue;
      }

      const union =
        leftFile.shingleSet.size + rightFile.shingleSet.size - intersection;
      const similarityScore = union === 0 ? 0 : intersection / union;

      if (similarityScore < options.fileSimilarityThreshold) {
        continue;
      }

      pairs.push({
        leftFilePath: leftFile.relativePath,
        rightFilePath: rightFile.relativePath,
        sharedShingleCount: intersection,
        similarityScore,
      });
    }
  }

  return pairs.toSorted((left, right) => {
    if (right.similarityScore !== left.similarityScore) {
      return right.similarityScore - left.similarityScore;
    }
    if (right.sharedShingleCount !== left.sharedShingleCount) {
      return right.sharedShingleCount - left.sharedShingleCount;
    }

    const leftCombinedLength =
      left.leftFilePath.length + left.rightFilePath.length;
    const rightCombinedLength =
      right.leftFilePath.length + right.rightFilePath.length;
    return rightCombinedLength - leftCombinedLength;
  });
}

function unionDuplicateLinesByFile(
  blockCloneGroups: BlockCloneGroup[],
  parsedFiles: ParsedFile[]
): number {
  const fileMap = new Map(
    parsedFiles.map((parsedFile) => [parsedFile.relativePath, parsedFile])
  );
  const duplicatedLinesByFile = new Map<string, Set<number>>();

  for (const group of blockCloneGroups) {
    const duplicateOccurrences = group.occurrences.slice(1);

    for (const occurrence of duplicateOccurrences) {
      const parsedFile = fileMap.get(occurrence.filePath);
      if (!parsedFile) {
        continue;
      }

      const lineSet =
        duplicatedLinesByFile.get(occurrence.filePath) ?? new Set<number>();
      for (
        let lineNumber = occurrence.startLine;
        lineNumber <= occurrence.endLine;
        lineNumber += 1
      ) {
        if (parsedFile.significantLineNumbers.has(lineNumber)) {
          lineSet.add(lineNumber);
        }
      }
      duplicatedLinesByFile.set(occurrence.filePath, lineSet);
    }
  }

  return [...duplicatedLinesByFile.values()].reduce(
    (total, lineSet) => total + lineSet.size,
    0
  );
}

function countTotalNormalizedLines(parsedFiles: ParsedFile[]): number {
  return parsedFiles.reduce(
    (total, parsedFile) => total + parsedFile.significantLineNumbers.size,
    0
  );
}

export function buildHotspots(
  blockCloneGroups: BlockCloneGroup[]
): HotspotEntry[] {
  const hotspotMap = new Map<
    string,
    { duplicateLines: number; groupIds: Set<string> }
  >();

  for (const group of blockCloneGroups) {
    const duplicateOccurrences = group.occurrences.slice(1);

    for (const occurrence of duplicateOccurrences) {
      const hotspotPath = path.posix.dirname(occurrence.filePath);
      const current = hotspotMap.get(hotspotPath) ?? {
        duplicateLines: 0,
        groupIds: new Set<string>(),
      };
      current.duplicateLines += group.normalizedLineCount;
      current.groupIds.add(group.id);
      hotspotMap.set(hotspotPath, current);
    }
  }

  return [...hotspotMap.entries()]
    .map(([hotspotPath, value]) => ({
      cloneGroupCount: value.groupIds.size,
      duplicateLines: value.duplicateLines,
      path: hotspotPath,
    }))
    .toSorted((left, right) => {
      if (right.duplicateLines !== left.duplicateLines) {
        return right.duplicateLines - left.duplicateLines;
      }
      return left.path.localeCompare(right.path);
    });
}

export function buildReport(
  parsedFiles: ParsedFile[],
  cloneCandidates: CloneCandidate[],
  options: EffectiveCliOptions
): ReportBuildResult {
  const blockCloneGroups = groupCloneCandidates(cloneCandidates);
  const duplicatedNormalizedLines = unionDuplicateLinesByFile(
    blockCloneGroups,
    parsedFiles
  );
  const totalNormalizedLines = countTotalNormalizedLines(parsedFiles);
  const duplicatePercent =
    totalNormalizedLines === 0
      ? 0
      : (duplicatedNormalizedLines / totalNormalizedLines) * 100;
  const thresholdExceeded = duplicatePercent > options.threshold;

  return {
    report: {
      blockCloneGroups,
      fileSimilarityPairs: computeFileSimilarity(parsedFiles, {
        fileSimilarityThreshold: options.fileSimilarityThreshold,
      }),
      generatedAt: new Date().toISOString(),
      hotspots: buildHotspots(blockCloneGroups),
      options: {
        exclude: [...options.exclude],
        failOn: options.failOn,
        fileSimilarityThreshold: options.fileSimilarityThreshold,
        include: [...options.include],
        maxFindings: options.maxFindings,
        minLines: options.minLines,
        minTokens: options.minTokens,
        threshold: options.threshold,
      },
      root: options.root,
      summary: {
        analyzedFileCount: parsedFiles.length,
        duplicatePercent,
        duplicatedNormalizedLines,
        thresholdExceeded,
        totalNormalizedLines,
      },
    },
    threshold: options.threshold,
  };
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatOccurrence(occurrence: CloneOccurrence): string {
  const symbolSuffix = occurrence.symbolName
    ? ` (${occurrence.symbolName})`
    : "";
  return `${occurrence.filePath}:${occurrence.startLine}-${occurrence.endLine}${symbolSuffix}`;
}

export function printHumanReport(
  report: DuplicationReport,
  options: Pick<EffectiveCliOptions, "maxFindings">
): string {
  const lines: string[] = [];
  const { summary } = report;
  const passFail = summary.thresholdExceeded ? "FAIL" : "PASS";

  lines.push("Desktop duplication audit");
  lines.push(
    `Files analyzed: ${summary.analyzedFileCount} | Total normalized lines: ${summary.totalNormalizedLines} | Duplicated normalized lines: ${summary.duplicatedNormalizedLines} | Duplicate percentage: ${formatPercentage(summary.duplicatePercent)} | Threshold: ${formatPercentage(report.options.threshold)} | Result: ${passFail}`
  );
  lines.push("");
  lines.push("Top block clone groups");

  const topBlockGroups = report.blockCloneGroups.slice(0, options.maxFindings);
  if (topBlockGroups.length === 0) {
    lines.push("  None");
  } else {
    for (const [index, group] of topBlockGroups.entries()) {
      lines.push(
        `  ${index + 1}. ${group.sampleLabel} | duplicate lines: ${group.duplicateLines} | occurrences: ${group.occurrenceCount} | files: ${group.filesInvolved.length}`
      );
      for (const occurrence of group.occurrences) {
        lines.push(`     - ${formatOccurrence(occurrence)}`);
      }
    }
  }

  lines.push("");
  lines.push("Top file similarity pairs");

  const topPairs = report.fileSimilarityPairs.slice(0, options.maxFindings);
  if (topPairs.length === 0) {
    lines.push("  None");
  } else {
    for (const [index, pair] of topPairs.entries()) {
      lines.push(
        `  ${index + 1}. score=${pair.similarityScore.toFixed(3)} shared=${pair.sharedShingleCount} | ${pair.leftFilePath} <> ${pair.rightFilePath}`
      );
    }
  }

  lines.push("");
  lines.push("Hotspot rollup");

  const topHotspots = report.hotspots.slice(0, options.maxFindings);
  if (topHotspots.length === 0) {
    lines.push("  None");
  } else {
    for (const [index, hotspot] of topHotspots.entries()) {
      lines.push(
        `  ${index + 1}. ${hotspot.path} | duplicate lines: ${hotspot.duplicateLines} | clone groups: ${hotspot.cloneGroupCount}`
      );
    }
  }

  lines.push("");
  lines.push(
    summary.thresholdExceeded
      ? `Enforcement: duplicate-percent ${formatPercentage(summary.duplicatePercent)} exceeded threshold ${formatPercentage(report.options.threshold)}.`
      : `Enforcement: duplicate-percent ${formatPercentage(summary.duplicatePercent)} is within threshold ${formatPercentage(report.options.threshold)}.`
  );

  return lines.join("\n");
}

export function determineExitCode(report: DuplicationReport): number {
  return report.summary.thresholdExceeded ? 1 : 0;
}

export function runAudit(options: EffectiveCliOptions): DuplicationReport {
  const files = collectSourceFiles(options);
  const parsedFiles = files.map((filePath) =>
    readAndParseFile(filePath, options.cwd)
  );
  const cloneCandidates = parsedFiles.flatMap((parsedFile) =>
    extractCloneCandidates(parsedFile, options)
  );
  return buildReport(parsedFiles, cloneCandidates, options).report;
}

export function runCli(argv: readonly string[], cwd = process.cwd()): number {
  try {
    const options = parseArgs(argv, cwd);
    const report = runAudit(options);
    const serializedReport = JSON.stringify(report, null, 2);

    if (options.jsonOut) {
      const outputPath = path.resolve(cwd, options.jsonOut);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, serializedReport);
    }

    if (options.json) {
      console.log(serializedReport);
    } else {
      console.log(printHumanReport(report, options));
    }

    return determineExitCode(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Duplication audit failed: ${message}`);
    return 2;
  }
}

if (import.meta.main) {
  process.exitCode = runCli(process.argv.slice(2));
}
