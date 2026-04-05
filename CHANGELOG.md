# Changelog

All notable changes to this project will be documented in this file.

## 0.1.2-alpha.3 - 2026-04-05

Changes since `v0.1.2-alpha.2`.

### Features

- Improve responsive layout for habit rows and app shell using flex-wrap and basis utilities
- Conditionally disable app relaunch after database import
- Add preset-based habit name generation with stress test support to test fixtures
- Improve UI spacing and formatting

### Refactors

- Update habit and focus quota UI with progress bars and refined styling
- Update main window dimensions and add icons to app shell tabs with constrained content width
- Extract FocusTimerPhaseBadge interface for improved type readability
- Remove unused sanitizeTimerPart utility function from focus-timer-view-model

### Documentation

- Update changelog with recent fixes and maintenance tasks
- Remove workspace commands section from README

### Maintenance

- Add 7-day cooldown to dependabot configuration

### Other

- Update desktop test data fixtures

## 0.1.2-alpha.2 - 2026-04-04

Changes since `v0.1.2-alpha.1`.

### Fixes

- Update release agent to handle false-positive workflow failures and update changelog formatting

### Maintenance

- Bump version to 0.1.2-alpha.1 and remove date-fns dependency

## 0.1.2-alpha.1 - 2026-04-04

Changes since `v0.1.1-beta.17`.

### Features

- Implement wind-down feature with custom actions, scheduling, and persistence
- Add pixel-blast background effect to landing page and update global styles and branding assets
- Improve test coverage and quality across critical areas
- Add TodayCelebrationOverlay component and reduce celebration duration

### Refactors

- Migrate FocusQuotaGoalsCard to @tanstack/react-form and add unit tests
- Enforce one file one component rule for feature and app TSX files
- Refactor renderer list items and normalize radius
- Define and use constants for focus cycle limits in focus timer card
- Move total set duration display and adjust layout spacing in focus timer components
- Replace category progress bars with activity ring and summary stat cards in HistoryDayPanel
- Redesign focus quota card layout
- Simplify save status logic, improve wind-down editing focus, and remove unused props
- Introduce SettingsCardHeader component and standardize settings card layouts
- Unexport internal validation and domain helper functions and remove unused focus quota types
- Migrate focus quota goals from focus page to longer habit checklist and add component tests
- Update toast styling and notification handling
- Remove unused packaging scripts and redundant npm commands

### Documentation

- Update changelog with recent fixes, features, and refactors

### Maintenance

- Ignore UI components and lower duplication threshold in check-duplication script
- Standardise Card usage
- Add oxfmt to knip ignoreDependencies
- Update format:check scripts to use ultracite and add root command
- Remove postinstall native rebuild script and update workflow to rebuild dependencies explicitly

### Other

- Reduce gap between habit items in history column
- Reduce desktop duplication in updater, dates, and focus UI
- Add desktop duplication audit script
- Refine desktop habit and focus settings UI
- Add habit service logic tests, expand IPC validation coverage, and remove obsolete test files
- Add focus quota goals to desktop
- Add weekly and monthly target counts
- Update background color to solid black and remove radial gradient overlays

## 0.1.1-beta.17 - 2026-03-31

Changes since `v0.1.1-beta.16`.

### Fixes

- Pin web lucide-react below Bun age gate

## 0.1.1-beta.16 - 2026-03-31

Changes since `v0.1.1-beta.15`.

### Features

- Persist dismissed update toast
- Implement structured JSON logging and secure session permission handlers for desktop app

### Fixes

- Update dependabot ignore pattern to correctly target @effect scoped packages

### Refactors

- Remove unused scripts
- Add comprehensive JSDoc documentation across main and renderer modules

### Documentation

- Add comprehensive JSDoc comments to core domain, infrastructure, and application modules
- Remove outdated release documentation and references

### Maintenance

- Implement dependency review, pin Bun version, and add supply-chain protection to bunfig
- Fix format error in changelog

### Other

- Hide redundant card descriptions using VisuallyHidden in focus components

## 0.1.1-beta.15 - 2026-03-30

Changes since `v0.1.1-beta.14`.

### Features

- Implement streak milestone and record celebration system for completed daily habits
- Update date display to use dynamic current date instead of hardcoded string
- Add zucchini release agent skill
- Add focus minutes to today state and display in streak card
- Add archive button to habit row editor component

### Refactors

- Make getReachedStreakMilestone private to encapsulate streak logic
- Update mascot asset resolution to use BASE_URL and improve filename extraction logic
- Improve desktop notification availability logic and add developer guidance comments
- Encapsulate main process state into a context object and optimize runtime initialization
- Consolidate weekly review stats into the hero card and remove the dedicated stats component
- Remove redundant labels and adjust spacing in category settings card
- Simplify weekly review dialog and remove redundant category settings description

### Maintenance

- Clean up folders and move files to the right places

### Other

- Add focusMinutes property to TodayState mock objects across test suites

## 0.1.1-beta.14 - 2026-03-29

Changes since `v0.1.1-beta.13`.

### Features

- Add icon library, implement popover component, and optimize tray menu updates

### Refactors

- Update category preview ring order to use a defined constant for rendering slots
- Remove unused Popover component implementation
- Replace popover-based color and icon pickers with inline controls in CategorySettingsCard
- Update weekly review stats and hero card layouts with improved styling and typography

## 0.1.1-beta.13 - 2026-03-29

Changes since `v0.1.1-beta.12`.

### Fixes

- Invoke `bunx` through `cmd.exe` during Windows postinstall so native dependency setup works in CI

## 0.1.1-beta.12 - 2026-03-29

Changes since `v0.1.1-beta.11`.

### Features

- Migrate settings from key-value pairs to a single typed row in the database
- Replace local storage-based focus timer state with a persistent database repository
- Improve unsaved changes ui
- Redesign habit category settings with interactive color-picker rings
- Redesign landing page UI with updated activity rings and interactive history carousel

### Fixes

- Clean up unused text in weekly view

### Refactors

- Remove unused storage utilities, internalize helper functions, and simplify habit category references
- Extract test fixtures and implement widget view mode detection
- Introduce focus test utilities and standardize time calculations across test suites
- Standardize UI components by updating border radii, typography, and adding global design guidelines
- Implement habit category customization and update UI components to use dynamic presentation logic
- Simplify weekly review spotlight dialog by removing trend analysis and updating copy

### Documentation

- Establish three-bucket persistence policy and categorize renderer storage as non-authoritative cache
- Modularize AGENTS.md by splitting app-specific guidelines into desktop and web subdirectories

### Maintenance

- Remove GitHub Pages deployment workflow
- Update default pomodoro timer settings
- Update tasks.json with new repo structure

### Other

- Allow custom category icons
- Upgrade TypeScript configs and strictness
- Add focus minutes to history views
- Add footer component styles to application stylesheet
- Restructure into desktop and web apps

## 0.1.1-beta.11 - 2026-03-28

Changes since `v0.1.1-beta.10`.

### Fixes

- Stabilize bun ci install and preload tests

## 0.1.1-beta.10 - 2026-03-28

Changes since `v0.1.1-beta.9`.

### Features

- Implement native addon existence check to gracefully handle missing notification state dependencies
- Implement in-app prerelease update detection and notifications
- Zoom into mascot images by 20%

### Fixes

- Remove window for widget and disable resizing
- Fix deferred test helper portability
- Remove lint suppressions

### Refactors

- Update activity ring radius calculation to use index-based spacing instead of container scaling
- Expand AGENTS.md with detailed architecture, tech stack, and development practices.

### Maintenance

- Update dependencies and documentation for oxlint release
- Reenable some lint rules
- Reduce unknown type usage

### Other

- Add configurable global focus timer shortcuts
- Increase opacity of background activity ring tracks for better visibility
- Change pr checks to push checks instead
- Enable jsx-no-new-function-as-prop with local suppressions
- Enable prefer-await-to-then with local suppressions
- Enable max-statements with a high threshold
- Enable class-methods-use-this
- Remove non-null, forEach, and void lint exemptions

## 0.1.1-beta.9 - 2026-03-22

Changes since `v0.1.1-beta.8`.

### Features

- Add support for skipping breaks and displaying paused time in focus sessions

### Fixes

- Adjust relative paths for window preload and app index files and update bun dependencies.

### Refactors

- Extract habit management feedback and list components for improved modularity and maintainability.
- Refactor app architecture for clearer boundaries

### Documentation

- Add detailed architecture guide and link it from the README.

### Maintenance

- Migrate type checking to tsgo, update build scripts, and clean up documentation and gitignore entries.
- Add VS Code settings for format on save and Oxc formatter for JS/TS/JSON files.
- Update dev dependencies and remove unused Babel plugins
