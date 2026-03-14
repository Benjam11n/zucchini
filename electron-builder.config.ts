import type { Configuration } from "electron-builder";

function isPublishRequested(argv: string[]): boolean {
  const publishFlagIndex = argv.findIndex(
    (arg) => arg === "--publish" || arg === "-p"
  );
  if (publishFlagIndex === -1) {
    return false;
  }

  const publishMode = argv[publishFlagIndex + 1];
  return publishMode !== undefined && publishMode !== "never";
}

function getGitHubPublishConfig(
  argv: string[]
): Exclude<Configuration["publish"], null> | undefined {
  const owner = process.env.GH_RELEASE_OWNER;
  const repo = process.env.GH_RELEASE_REPO;
  const token = process.env.GH_TOKEN;

  if (isPublishRequested(argv)) {
    const missing = [
      owner ? null : "GH_RELEASE_OWNER",
      repo ? null : "GH_RELEASE_REPO",
      token ? null : "GH_TOKEN",
    ].filter((value): value is string => value !== null);

    if (missing.length > 0) {
      throw new Error(
        `GitHub release publishing requires ${missing.join(", ")} to be set.`
      );
    }
  }

  if (owner && repo) {
    return [
      {
        owner,
        provider: "github",
        releaseType: "draft",
        repo,
      },
    ];
  }

  return undefined;
}

const config: Configuration = {
  appId: "com.zucchini.habittracker",
  asarUnpack: [
    "node_modules/better-sqlite3/build/Release/*.node",
    "node_modules/better-sqlite3/bin/*/*.node",
  ],
  directories: {
    output: "release",
  },
  files: [
    "build/icon.png",
    "dist/**",
    "dist-electron/**",
    "drizzle/**",
    "package.json",
    "!dist-electron/**/*.map",
    "!node_modules/better-sqlite3/build/Release/obj/**",
    "!node_modules/better-sqlite3/deps/**",
    "!node_modules/better-sqlite3/src/**",
  ],
  icon: "build/icon.png",
  linux: {
    icon: "build/icon.png",
    target: ["AppImage"],
  },
  mac: {
    icon: "build/icon.icns",
    target: ["dmg", "zip"],
  },
  productName: "Zucchini",
  publish: getGitHubPublishConfig(process.argv),
  win: {
    icon: "build/icon.ico",
    target: ["nsis"],
  },
};

export default config;
