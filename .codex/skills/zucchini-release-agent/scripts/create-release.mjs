#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const scriptDir = import.meta.dirname;
const skillRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(skillRoot, "../../..");
const desktopRoot = path.join(repoRoot, "apps/desktop");
const desktopPackageJsonPath = path.join(desktopRoot, "package.json");

const cliArgs = parseArgs(process.argv.slice(2));

const tempDir = mkdtempSync(path.join(os.tmpdir(), "zucchini-release-"));
const notesPath = path.join(tempDir, "release-notes.md");

try {
  ensureRepoPreconditions();

  const originalVersion = readDesktopVersion();
  const nextVersion = resolveVersion(
    originalVersion,
    cliArgs.channel,
    cliArgs.version
  );
  const tag = `v${nextVersion}`;
  const title = `Zucchini ${nextVersion}`;

  ensureTagDoesNotExist(tag);

  log(`Preparing ${cliArgs.channel} release ${nextVersion}.`);

  if (cliArgs.dryRun) {
    runChangelogScript(nextVersion, tag, notesPath);
    log("Dry run complete.");
    log(`Current version: ${originalVersion}`);
    log(`Next version: ${nextVersion}`);
    log(`Tag: ${tag}`);
    console.log("");
    console.log(readFileSync(notesPath, "utf-8").trim());
    process.exit(0);
  }

  writeDesktopVersion(nextVersion);
  runChangelogScript(nextVersion, tag);
  runFormatScript();
  runCheckScript();

  runGit(["add", "apps/desktop/package.json", "CHANGELOG.md"]);
  runGit(["commit", "-m", `chore: release ${nextVersion}`]);

  const releaseCommitSha = runGit(["rev-parse", "HEAD"]);

  runGit(["tag", tag]);
  runGit(["push", "origin", "main"]);
  runGit(["push", "origin", tag]);

  const runId = waitForReleaseWorkflowRun(releaseCommitSha, tag);
  watchWorkflowRun(runId);

  runChangelogScript(nextVersion, tag, notesPath);
  publishGitHubRelease({
    channel: cliArgs.channel,
    notesFilePath: notesPath,
    tag,
    title,
  });

  const releaseUrl = viewReleaseUrl(tag);
  log(`Release published: ${releaseUrl}`);
} finally {
  rmSync(tempDir, {
    force: true,
    recursive: true,
  });
}

function parseArgs(rawArgs) {
  const parsed = {
    dryRun: false,
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    const value = rawArgs[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}.`);
    }

    switch (arg) {
      case "--channel": {
        if (value !== "prerelease" && value !== "main") {
          throw new Error("`--channel` must be `prerelease` or `main`.");
        }
        parsed.channel = value;
        break;
      }
      case "--version": {
        assertSemver(value, "Invalid `--version` value.");
        parsed.version = value;
        break;
      }
      default: {
        throw new Error(`Unknown argument: ${arg}`);
      }
    }

    index += 1;
  }

  if (!parsed.channel) {
    throw new Error("Missing required `--channel <prerelease|main>` argument.");
  }

  return parsed;
}

function ensureRepoPreconditions() {
  ensureCommandExists("git");
  ensureCommandExists("gh");

  const status = runGit(["status", "--short"]);
  if (status) {
    throw new Error(
      "Git working tree must be clean before creating a release."
    );
  }

  const branch = runGit(["branch", "--show-current"]);
  if (branch !== "main") {
    throw new Error(`Release must run from \`main\`, found \`${branch}\`.`);
  }

  runGit(["fetch", "origin", "main", "--tags"]);

  const headSha = runGit(["rev-parse", "HEAD"]);
  const remoteMainSha = runGit(["rev-parse", "origin/main"]);

  if (headSha !== remoteMainSha) {
    throw new Error("Local `HEAD` must match `origin/main` before releasing.");
  }

  runGh(["auth", "status"]);
}

function ensureCommandExists(command) {
  try {
    execFileSync("which", [command], {
      encoding: "utf-8",
      stdio: "ignore",
    });
  } catch {
    throw new Error(`Required command not found: ${command}`);
  }
}

function readDesktopVersion() {
  const packageJson = JSON.parse(readFileSync(desktopPackageJsonPath, "utf-8"));
  const { version } = packageJson;

  if (typeof version !== "string") {
    throw new TypeError(
      "`apps/desktop/package.json` is missing a string `version`."
    );
  }

  return version;
}

function writeDesktopVersion(version) {
  const packageJson = JSON.parse(readFileSync(desktopPackageJsonPath, "utf-8"));
  packageJson.version = version;
  writeFileSync(
    desktopPackageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`
  );
}

function resolveVersion(currentVersion, channel, explicitVersion) {
  if (explicitVersion) {
    return explicitVersion;
  }

  const parsed = parseVersion(currentVersion);

  if (channel === "prerelease") {
    if (parsed.prerelease) {
      if (parsed.prerelease.label !== "beta") {
        throw new Error(
          `Unsupported prerelease label \`${parsed.prerelease.label}\`. Pass \`--version\` explicitly.`
        );
      }

      return `${parsed.major}.${parsed.minor}.${parsed.patch}-beta.${parsed.prerelease.number + 1}`;
    }

    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-beta.1`;
  }

  if (parsed.prerelease) {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  }

  if (tagExists(`v${currentVersion}`)) {
    throw new Error(
      `Stable tag v${currentVersion} already exists. Pass \`--version\` explicitly for a new main release.`
    );
  }

  return currentVersion;
}

function parseVersion(value) {
  const match =
    /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<label>[0-9A-Za-z-]+)\.(?<number>\d+))?$/.exec(
      value
    );

  if (!match?.groups) {
    throw new Error(`Invalid semver value: ${value}`);
  }

  return {
    major: Number(match.groups.major),
    minor: Number(match.groups.minor),
    patch: Number(match.groups.patch),
    prerelease: match.groups.label
      ? {
          label: match.groups.label,
          number: Number(match.groups.number),
        }
      : null,
  };
}

function assertSemver(value, message) {
  try {
    parseVersion(value);
  } catch {
    throw new Error(message);
  }
}

function runChangelogScript(version, tag, outputPath = null) {
  const commandArgs = [
    "--dir",
    "apps/desktop",
    "exec",
    "node",
    "scripts/generate-changelog.mjs",
    "--version",
    version,
    "--tag",
    tag,
  ];

  if (outputPath) {
    commandArgs.push("--output", outputPath);
  } else {
    commandArgs.push("--write-changelog");
  }

  execFileSync("pnpm", commandArgs, {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function runFormatScript() {
  execFileSync("pnpm", ["run", "format"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function runCheckScript() {
  execFileSync("pnpm", ["run", "check"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function ensureTagDoesNotExist(tag) {
  if (tagExists(tag)) {
    throw new Error(`Tag already exists: ${tag}`);
  }
}

function tagExists(tag) {
  const localResult = execGit([
    "rev-parse",
    "--verify",
    "--quiet",
    `refs/tags/${tag}`,
  ]);
  if (localResult.success) {
    return true;
  }

  const remoteResult = execGit(["ls-remote", "--tags", "origin", tag]);
  return remoteResult.stdout.trim().length > 0;
}

function waitForReleaseWorkflowRun(headSha, tag) {
  log(`Waiting for GitHub Actions run for ${tag} to appear.`);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const output = runGh([
      "run",
      "list",
      "--workflow",
      "release.yml",
      "--event",
      "push",
      "--json",
      "databaseId,headBranch,headSha,workflowName,status,conclusion,url",
      "--limit",
      "20",
    ]);
    const runs = JSON.parse(output);
    const matchingRun = runs.find(
      (run) => run.headSha === headSha && run.headBranch === tag
    );

    if (matchingRun) {
      log(`Found workflow run ${matchingRun.databaseId}.`);
      return String(matchingRun.databaseId);
    }

    sleep(5000);
  }

  throw new Error(`Timed out waiting for the release workflow run for ${tag}.`);
}

function watchWorkflowRun(runId) {
  log(`Watching workflow run ${runId}.`);

  const result = execGh(["run", "watch", runId, "--compact", "--exit-status"], {
    stdio: "inherit",
  });

  if (result.success) {
    return;
  }

  const runState = readWorkflowRunState(runId);
  if (runState.status === "completed" && runState.conclusion === "success") {
    log(
      `Workflow run ${runId} completed successfully despite a non-zero \`gh run watch\` exit code.`
    );
    return;
  }

  execGh(["run", "view", runId, "--log-failed"], {
    stdio: "inherit",
  });
  throw new Error(
    `Release workflow run ${runId} failed with status \`${runState.status}\` and conclusion \`${runState.conclusion}\`.`
  );
}

function readWorkflowRunState(runId) {
  const output = runGh(["run", "view", runId, "--json", "status,conclusion"]);

  const run = JSON.parse(output);
  return {
    conclusion: run.conclusion ?? "",
    status: run.status ?? "",
  };
}

function publishGitHubRelease({ channel, notesFilePath, tag, title }) {
  const commandArgs = [
    "release",
    "edit",
    tag,
    "--draft=false",
    "--title",
    title,
    "--notes-file",
    notesFilePath,
  ];

  if (channel === "prerelease") {
    commandArgs.push("--prerelease");
  } else {
    commandArgs.push("--latest");
  }

  runGh(commandArgs);
}

function viewReleaseUrl(tag) {
  return runGh(["release", "view", tag, "--json", "url", "--jq", ".url"]);
}

function runGit(gitArgs) {
  return execFileSync("git", gitArgs, {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
}

function execGit(gitArgs) {
  return execCommand("git", gitArgs);
}

function runGh(ghArgs) {
  return execFileSync("gh", ghArgs, {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
}

function execGh(ghArgs, options = {}) {
  return execCommand("gh", ghArgs, options);
}

function execCommand(command, commandArgs, options = {}) {
  try {
    const stdout = execFileSync(command, commandArgs, {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: options.stdio ?? "pipe",
    });

    return {
      stdout: stdout.trim(),
      success: true,
    };
  } catch (error) {
    return {
      stderr: typeof error.stderr === "string" ? error.stderr : "",
      stdout: typeof error.stdout === "string" ? error.stdout : "",
      success: false,
    };
  }
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function log(message) {
  console.log(`[release-agent] ${message}`);
}
