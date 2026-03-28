import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = process.cwd();
const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const packageJsonPath = path.join(desktopRoot, "package.json");
const changelogPath = path.join(workspaceRoot, "CHANGELOG.md");

const cliArgs = parseArgs(process.argv.slice(2));
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const releaseVersion = cliArgs.version ?? packageJson.version;
const releaseTag = cliArgs.tag ?? `v${releaseVersion}`;
const previousReleaseTag = cliArgs.previousTag ?? findPreviousTag(releaseTag);
const changelogDate = cliArgs.date ?? new Date().toISOString().slice(0, 10);
const outputPath = cliArgs.output
  ? path.resolve(desktopRoot, cliArgs.output)
  : null;

const commitRange = previousReleaseTag ? `${previousReleaseTag}..HEAD` : "HEAD";
const releaseCommits = getCommitSubjects(commitRange)
  .filter((subject) => !isReleaseCommit(subject, releaseVersion, releaseTag))
  .map((subject) => ({
    category: categorizeCommit(subject),
    summary: normalizeCommitSubject(subject),
  }));

if (releaseCommits.length === 0) {
  throw new Error(
    `No commits found for release notes in range ${commitRange}.`
  );
}

const renderedReleaseNotes = renderReleaseNotes({
  categorizedCommits: releaseCommits,
  currentReleaseDate: changelogDate,
  currentVersion: releaseVersion,
  priorTag: previousReleaseTag,
});

if (outputPath) {
  writeFileSync(outputPath, `${renderedReleaseNotes}\n`);
}

if (cliArgs.writeChangelog) {
  const nextChangelog = renderChangelog(renderedReleaseNotes, releaseVersion);
  writeFileSync(changelogPath, nextChangelog);
}

if (!outputPath) {
  process.stdout.write(`${renderedReleaseNotes}\n`);
}

function parseArgs(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--write-changelog") {
      parsed.writeChangelog = true;
      continue;
    }

    const value = rawArgs[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}.`);
    }

    switch (arg) {
      case "--date": {
        parsed.date = value;
        break;
      }
      case "--output": {
        parsed.output = value;
        break;
      }
      case "--previous-tag": {
        parsed.previousTag = value;
        break;
      }
      case "--tag": {
        parsed.tag = value;
        break;
      }
      case "--version": {
        parsed.version = value;
        break;
      }
      default: {
        throw new Error(`Unknown argument: ${arg}`);
      }
    }

    index += 1;
  }

  return parsed;
}

function runGit(gitArgs) {
  return execFileSync("git", gitArgs, {
    cwd: workspaceRoot,
    encoding: "utf8",
  }).trim();
}

function findPreviousTag(currentTag) {
  const tags = runGit([
    "for-each-ref",
    "--sort=-creatordate",
    "--format=%(refname:short)",
    "refs/tags",
  ])
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  return tags.find((value) => value !== currentTag) ?? null;
}

function getCommitSubjects(range) {
  const output = runGit(["log", "--pretty=format:%s", range]);
  return output
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isReleaseCommit(subject, candidateVersion, candidateTag) {
  const normalized = subject.toLowerCase();
  return (
    normalized === `chore: release ${candidateTag}`.toLowerCase() ||
    normalized === `chore: release ${candidateVersion}`.toLowerCase() ||
    normalized === `chore: bump version to ${candidateVersion}`.toLowerCase()
  );
}

function categorizeCommit(subject) {
  const normalized = subject.toLowerCase();

  if (/^feat(\(.+\))?:/.test(normalized) || normalized.startsWith("feat ")) {
    return "Features";
  }

  if (/^fix(\(.+\))?:/.test(normalized) || normalized.startsWith("fix ")) {
    return "Fixes";
  }

  if (
    /^refactor(\(.+\))?:/.test(normalized) ||
    normalized.startsWith("refactor ")
  ) {
    return "Refactors";
  }

  if (/^docs(\(.+\))?:/.test(normalized) || normalized.startsWith("docs ")) {
    return "Documentation";
  }

  if (/^chore(\(.+\))?:/.test(normalized) || normalized.startsWith("chore ")) {
    return "Maintenance";
  }

  return "Other";
}

function normalizeCommitSubject(subject) {
  const stripped = subject.replace(/^[a-z]+(\(.+\))?:\s*/i, "");

  if (!stripped) {
    return subject;
  }

  if (stripped[0] === stripped[0].toLowerCase()) {
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }

  return stripped;
}

function renderReleaseNotes({
  categorizedCommits,
  currentReleaseDate,
  currentVersion,
  priorTag,
}) {
  const sections = [
    "Features",
    "Fixes",
    "Refactors",
    "Documentation",
    "Maintenance",
    "Other",
  ]
    .map((category) => {
      const items = categorizedCommits.filter(
        (commit) => commit.category === category
      );

      if (items.length === 0) {
        return null;
      }

      return [
        `### ${category}`,
        ...items.map((commit) => `- ${commit.summary}`),
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  const changesSinceLine = priorTag
    ? `Changes since \`${priorTag}\`.`
    : "Initial tracked release notes.";

  return [
    `## ${currentVersion} - ${currentReleaseDate}`,
    "",
    changesSinceLine,
    "",
    sections,
  ].join("\n");
}

function renderChangelog(nextReleaseNotes, currentVersion) {
  const existing = safeReadChangelog();
  const intro =
    "All notable changes to this project will be documented in this file.";
  const header = `# Changelog\n\n${intro}\n`;

  if (!existing) {
    return `${header}\n${nextReleaseNotes}\n`;
  }

  const body = existing.startsWith(header)
    ? existing.slice(header.length).trimStart()
    : existing.trimStart();
  const bodyWithoutCurrentVersion = body
    .replace(
      new RegExp(`## ${escapeRegExp(currentVersion)} - .*?(?=\\n## |$)`, "s"),
      ""
    )
    .replace(new RegExp(`^${escapeRegExp(intro)}\\n+`), "")
    .trimStart();

  return `${header}\n${nextReleaseNotes}\n${
    bodyWithoutCurrentVersion ? `\n${bodyWithoutCurrentVersion}\n` : ""
  }`;
}

function safeReadChangelog() {
  try {
    return readFileSync(changelogPath, "utf8");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return "";
    }

    throw error;
  }
}

function escapeRegExp(value) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
