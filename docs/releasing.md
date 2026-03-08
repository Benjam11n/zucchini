# Releasing Zucchini

Zucchini currently ships public GitHub Release artifacts for Windows and macOS.
Both installers are intentionally unsigned in this phase.

## Current release policy

- Windows is published as an unsigned NSIS installer.
- macOS is published as unsigned, unnotarized `dmg` and `zip` artifacts.
- Linux packaging remains available locally but is not part of CI release
  automation.
- Auto-update, crash reporting, code signing, and notarization are deferred.

## Prerequisites

- Push access to the repository
- A version tag in the format `v0.1.0`
- GitHub Actions enabled for the repository

## Release environment

`electron-builder` reads the GitHub publishing configuration from these
environment variables:

- `GH_RELEASE_OWNER`: repository owner
- `GH_RELEASE_REPO`: repository name
- `GH_TOKEN`: GitHub token with permission to create and update releases

In GitHub Actions, the workflow sets `GH_RELEASE_OWNER` and `GH_RELEASE_REPO`
from the current repository and uses `secrets.GITHUB_TOKEN` as `GH_TOKEN`.

## CI release flow

The release workflow lives at `.github/workflows/release.yml`.

When you push a tag that matches `v*`, GitHub Actions will:

1. Check out the repository.
2. Install Bun dependencies.
3. Run `bun run test`.
4. Run `bun run build`.
5. Build and publish unsigned Windows and macOS artifacts to a draft GitHub
   Release for that tag.

The workflow publishes these assets:

- Windows `.exe` installer
- macOS `.dmg`
- macOS `.zip`

The GitHub Release remains a draft so you can smoke-test the artifacts before
publishing it.

## Local release commands

Use these commands from the repository root.

### macOS shell

```bash
bun run build
GH_RELEASE_OWNER=OWNER GH_RELEASE_REPO=REPO GH_TOKEN=TOKEN bun run dist:release:mac
```

### PowerShell on Windows

```powershell
bun run build
$env:GH_RELEASE_OWNER="OWNER"
$env:GH_RELEASE_REPO="REPO"
$env:GH_TOKEN="TOKEN"
bun run dist:release:win
```

`bun run dist:release` is a convenience wrapper that picks the current platform
on macOS and Windows.

If you need both Windows and macOS release artifacts, build them on their native
platforms or rely on the GitHub Actions release workflow.

## Tagging a release

Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

After the workflow completes, review the draft release on GitHub, test the
artifacts, then publish the draft manually.

## Unsigned install caveats

### Windows

Because the installer is unsigned, Windows SmartScreen may warn users before
launching it. Users may need to choose `More info` and then `Run anyway`.

### macOS

Because the app is unsigned and unnotarized, macOS Gatekeeper may block it on
first launch. Users may need to:

1. Open the app from Finder with `Control`-click > `Open`, or
2. Go to `System Settings` > `Privacy & Security` and allow the blocked app.

This behavior is expected until Apple signing and notarization are added.
