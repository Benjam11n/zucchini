# Architecture Guide

This document is a practical map of the Zucchini codebase for someone who is
new to Electron and new to this project.

It explains:

- what Electron is doing in this app,
- how the app starts,
- how the main, preload, shared, and renderer layers interact,
- where the business logic and persistence live,
- how major features such as reminders, history, focus, and updates fit
  together,
- and which files are worth reading first.

If you only read one architecture document in this repo, read this one.

## 1. Mental model: what an Electron app is

Electron is a desktop shell that lets you build a desktop app with web
technology.

In this project there are three important runtime environments:

1. The main process.
   This is the desktop app backend. It can create windows, talk to the OS, use
   native dialogs, schedule notifications, and access the filesystem.
2. The renderer process.
   This is the React frontend running inside a browser window.
3. The preload script.
   This is a small secure bridge between the renderer and the main process.

Zucchini uses those pieces like this:

```text
React UI (renderer)
  -> calls window.habits / window.updater
Preload bridge
  -> turns those calls into IPC messages
Main process IPC handlers
  -> validate input, call services, return typed results
Application services
  -> enforce business rules, talk to repository layer
SQLite repository
  -> read/write local data
```

That separation is the most important thing to understand in this codebase.

## 2. The four source roots

The app is intentionally split into four top-level source areas:

- `src/main`
  Electron main-process code. This is the desktop backend.
- `src/preload`
  The secure API bridge exposed to the renderer.
- `src/shared`
  Types, domain rules, utilities, and IPC contracts used by multiple layers.
- `src/renderer`
  The React app and UI-specific state.

As a rule:

- `src/renderer` should not know about Electron internals directly.
- `src/main` should not contain React UI code.
- `src/shared` should contain types and pure logic that are useful across
  layers.
- `src/preload` should stay narrow and boring. Its job is safe bridging, not
  business logic.

## 3. Startup flow from app launch to visible UI

This is the highest-level execution flow of the app.

### Step 1: Electron starts the main process

The app entry point is [`src/main/main.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/main.ts).

This file is now a composition root. Its job is to wire systems together, not
to hold all implementation details.

It is responsible for:

- acquiring the single-instance lock,
- waiting for `app.whenReady()`,
- creating the application runtime,
- creating and showing windows,
- registering IPC handlers,
- wiring updater events,
- wiring tray behavior,
- handling top-level fatal errors,
- and responding to app lifecycle events such as re-activation or power resume.

You can think of `main.ts` as the place where all major subsystems are plugged
together.

### Step 2: the main process builds the runtime

The runtime is created in
[`src/main/app/runtime.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/runtime.ts).

`createAppRuntime()` assembles the main backend pieces:

- `SqliteAppRepository`
- `HabitsApplicationService`
- reminder scheduler
- tray integration
- focus timer coordinator

This file answers the question: "what backend objects does the app need to run?"

### Step 3: the main process creates BrowserWindow instances

Window construction is split out into dedicated modules:

- [`src/main/app/windows/main-window.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/windows/main-window.ts)
- [`src/main/app/windows/focus-widget-window.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/windows/focus-widget-window.ts)

Supporting window behavior is also isolated:

- [`src/main/app/windows/focus-widget-bounds.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/windows/focus-widget-bounds.ts)
- [`src/main/app/windows/window-security.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/windows/window-security.ts)
- [`src/main/app/window-theme.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/window-theme.ts)

The point of this split is that `main.ts` decides when to create a window, but
the window modules decide how a window is configured.

### Step 4: each window loads the renderer bundle

The main window loads the normal app UI.
The focus widget window loads the same renderer bundle with `?view=widget`.

That means there is still one React app, but it can render in different modes.

### Step 5: the preload script exposes a safe API

The preload entry point is
[`src/preload/preload.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/preload/preload.ts).

It uses Electron's `contextBridge` to expose:

- `window.habits`
- `window.updater`

Those APIs are typed against shared contracts in:

- [`src/shared/contracts/habits-ipc.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/contracts/habits-ipc.ts)
- [`src/shared/contracts/app-updater.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/contracts/app-updater.ts)

This is a security boundary. React does not get raw access to `ipcRenderer`,
`fs`, or Electron globals. It only gets a small approved surface.

### Step 6: React boots in the renderer

The renderer entry point is
[`src/renderer/main.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/main.tsx).

That file mounts the React tree. The real app composition starts in
[`src/renderer/app/app-root.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/app-root.tsx).

`app-root.tsx` decides which top-level experience to show:

- loading screen,
- boot error screen,
- normal app shell,
- focus widget mode,
- today view,
- history,
- focus,
- settings.

## 4. The main-process backend

If you come from frontend work, the main process is easiest to think of as the
desktop backend for a single-user local app.

### `src/main/app`

This folder holds application-level desktop plumbing.

Important files:

- [`src/main/app/runtime.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/runtime.ts)
  Builds the runtime object containing the major backend services.
- [`src/main/app/data-management.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/data-management.ts)
  Handles backup export/import and opening the data folder.
- [`src/main/app/updater-runtime.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/updater-runtime.ts)
  Wires Electron updater events to renderer-facing state broadcasts.
- [`src/main/app/tray.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/tray.ts)
  Owns the system tray menu and behavior.
- [`src/main/app/lifecycle.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/lifecycle.ts)
  Encapsulates rules like minimize-to-tray and quit behavior.
- [`src/main/app/fatal-error.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/fatal-error.ts)
  Centralizes the last-resort crash dialog and cleanup path.
- [`src/main/app/single-instance.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/single-instance.ts)
  Ensures only one app instance owns the desktop state.

This folder is mostly about integration with Electron and the operating system.

### `src/main/infra`

This folder holds infrastructure concerns: IPC, SQLite, and persistence
adapters.

Important subfolders:

- `src/main/infra/ipc`
  Request validation, error serialization, and IPC handler registration.
- `src/main/infra/db`
  SQLite client, schema, and migrations.
- `src/main/infra/persistence`
  Repository interfaces and SQLite-backed implementations.

### `src/main/features`

This folder holds feature-level backend logic.

Notable examples:

- `habits`
  Main application service and behavior around habit operations.
- `reminders`
  Notification scheduling, timezone calculations, and reminder state.
- `today`
  Construction of the `TodayState` payload sent to the renderer.
- `weekly-review`
  Weekly review and trend aggregation.
- `focus`
  Focus timer coordination and persistence of focus sessions.
- `streaks`
  Rolling streak synchronization logic.

This is where most business logic belongs if it depends on the repository or
desktop runtime.

## 5. The preload bridge

The preload layer exists so the renderer can call the backend without being
trusted as a privileged process.

In Zucchini, the preload bridge does three things:

1. defines a typed API shape,
2. invokes IPC channels,
3. converts error payloads back into exceptions.

The bridge in
[`src/preload/preload.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/preload/preload.ts)
is intentionally thin.

That is a good sign. If the preload script ever becomes "smart", the design is
usually drifting in the wrong direction.

## 6. Shared contracts and domain logic

`src/shared` is the language spoken by the rest of the app.

### `src/shared/contracts`

This folder defines the IPC contract between renderer and main.

The most important file for that is
[`src/shared/contracts/habits-ipc.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/contracts/habits-ipc.ts).

It contains:

- IPC channel names,
- request and response types,
- the `HabitsApi` interface exposed on `window.habits`,
- payload shapes such as `TodayState`.

This is the contract both sides agree on:

- preload implements it,
- renderer consumes it,
- main handlers answer it.

### `src/shared/domain`

This folder holds the actual data model and pure domain rules.

Examples:

- [`habit.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/domain/habit.ts)
  Habit types, categories, frequencies, and normalization helpers.
- [`settings.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/domain/settings.ts)
  App settings types.
- [`history.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/domain/history.ts)
  History-facing domain types.
- [`weekly-review.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/domain/weekly-review.ts)
  Weekly review types.
- [`streak-engine.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/domain/streak-engine.ts)
  Pure streak logic.

When logic is pure and not tied to Electron, React, or SQLite, `src/shared` is
usually the right home.

### `src/shared/utils`

This folder contains reusable utility functions, especially date helpers that
are used by multiple backend features.

## 7. The application service and repository layers

If you want to understand "where the real app logic lives", start here.

### The repository layer

The main repository contract is
[`src/main/infra/persistence/app-repository.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/persistence/app-repository.ts).

This interface represents the persistence operations the application needs.

The concrete SQLite implementation is
[`src/main/infra/persistence/sqlite-app-repository.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/persistence/sqlite-app-repository.ts).

That class is an aggregate repository. It owns the database client and delegates
to smaller specialized repositories:

- habits repository,
- history repository,
- focus session repository,
- settings repository,
- streak repository,
- reminder runtime state repository.

This design keeps one main persistence entry point for the service layer while
still keeping the SQL-facing code split by domain.

### The application service

The main service is
[`src/main/features/habits/habits-application-service.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/features/habits/habits-application-service.ts).

This class is the center of the core backend behavior.

It is responsible for:

- initializing the database schema,
- seeding defaults,
- syncing rolling streak/history state,
- toggling habits,
- creating and editing habits,
- building the today payload,
- reading history,
- building weekly review data,
- recording focus sessions,
- reading and updating settings,
- persisting reminder runtime state.

The important pattern here is:

- IPC handlers do validation and transport concerns.
- `HabitsApplicationService` performs the operation.
- the repository handles persistence details.

That separation makes the code easier to test and easier to reason about.

## 8. IPC: how the frontend talks to the backend

The React app cannot call the service directly. It must go through IPC.

The flow looks like this:

```text
Renderer action
  -> window.habits.toggleHabit(habitId)
Preload
  -> ipcRenderer.invoke("habits:toggleHabit", habitId)
Main IPC handler
  -> validate habitId
  -> service.toggleHabit(habitId)
Service
  -> repository transaction + domain logic
Main handler
  -> return serialized success/error payload
Preload
  -> unwrap payload or throw typed error
Renderer
  -> update UI state
```

The handler registration lives in
[`src/main/infra/ipc/handlers.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/ipc/handlers.ts).

This file is worth reading because it shows the exact seam between transport
and application logic.

It does not contain the business rules themselves. It just:

- receives calls,
- validates inputs,
- delegates to the right service or coordinator,
- and serializes errors into a safe renderer-facing shape.

That is the correct level of responsibility for an IPC layer.

## 9. Persistence and SQLite

Zucchini is local-first, so SQLite is the source of truth for user data.

The database infrastructure lives under `src/main/infra/db`.

Important files:

- [`sqlite-client.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/db/sqlite-client.ts)
  Low-level database access and transaction control.
- [`schema.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/db/schema.ts)
  Table schema definitions.
- [`migrations.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/db/migrations.ts)
  Database migration setup.

The service layer does not write SQL directly.
It talks to repositories.
The repositories talk to the SQLite client.

This is useful for three reasons:

1. business logic stays readable,
2. persistence code stays localized,
3. tests can target behavior at the right layer.

## 10. Reminders, tray, and other desktop-specific behavior

These are parts of the app that exist because this is a desktop app, not a web
app.

### Reminders

Reminder logic now has a cleaner split:

- [`reminder-scheduler.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/features/reminders/reminder-scheduler.ts)
  Orchestration and timers.
- [`reminder-policy.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/features/reminders/reminder-policy.ts)
  Decision logic about when reminders should fire.
- [`reminder-timezone.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/features/reminders/reminder-timezone.ts)
  Timezone-aware date calculations.
- [`notifications.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/features/reminders/notifications.ts)
  Actual desktop notification delivery.

This is a good example of separating "what should happen" from "when do timers
run" and from "how do we compute dates safely".

### Tray

The tray integration lives in
[`src/main/app/tray.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/tray.ts).

The tray is part of the desktop experience:

- open the app,
- open the focus widget,
- snooze reminders,
- quit the app.

### Updater

Update integration spans:

- [`src/main/app/updater.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/updater.ts)
- [`src/main/app/updater-runtime.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/app/updater-runtime.ts)
- [`src/shared/contracts/app-updater.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/contracts/app-updater.ts)

The renderer does not talk to `electron-updater` directly. It talks to the
typed updater API exposed through preload.

## 11. The React renderer

The renderer is the app UI, but it is not just a pile of pages. It has its own
internal structure.

### `src/renderer/app`

This is the application shell and top-level controller area.

Important files:

- [`src/renderer/app/app-root.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/app-root.tsx)
  Top-level screen selection and lazy-loading.
- [`src/renderer/app/shell/app-shell.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/shell/app-shell.tsx)
  Shared layout and navigation chrome.
- [`src/renderer/app/controller/use-app-controller.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/use-app-controller.ts)
  Main controller hook that composes state and actions.

The controller area was intentionally split into smaller pieces:

- [`use-app-controller-state.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/use-app-controller-state.ts)
  Selects and shapes renderer state.
- [`use-app-lifecycle-effects.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/use-app-lifecycle-effects.ts)
  Runs startup and subscription effects.
- [`use-settings-autosave.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/use-settings-autosave.ts)
  Handles settings autosave behavior.
- [`app-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/app-actions.ts)
  Creates the app action set.
- [`boot-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/boot-actions.ts)
- [`today-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/today-actions.ts)
- [`history-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/history-actions.ts)
- [`focus-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/focus-actions.ts)
- [`settings-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/settings-actions.ts)
- [`action-helpers.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/action-helpers.ts)
  Shared renderer-side state transition helpers.

That split matters because the renderer controller used to mix too many
responsibilities in one place.

### Renderer state stores

The renderer uses feature-oriented state stores under `src/renderer/app/state`
and feature folders.

Examples:

- [`boot-store.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/state/boot-store.ts)
- [`ui-store.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/state/ui-store.ts)
- [`src/renderer/features/history/state/history-store.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/history/state/history-store.ts)

These stores hold UI-facing state. They should not duplicate business rules that
already live in the backend or shared domain.

### Shared renderer utilities

`src/renderer/shared` contains reusable UI pieces:

- generic UI components,
- shared hooks,
- design utilities,
- cross-feature renderer helpers.

This is the "frontend toolkit" area of the app.

## 12. Feature structure in the renderer

Most user-facing work lives in feature folders.

### Today

The Today experience is the default dashboard. It renders the current habit
state built by the backend and returned as `TodayState`.

This feature is intentionally backend-driven because "what counts as today's
state" is a domain concern, not just a display concern.

### History

History now has a cleaner split between data shaping, page composition, and UI
styling.

Important files:

- [`history-page.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/history/history-page.tsx)
  Page shell.
- [`use-history-view-state.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/history/use-history-view-state.ts)
  View-state derivation.
- [`components/history-overview-panel.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/history/components/history-overview-panel.tsx)
- [`components/weekly-review-section.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/history/components/weekly-review-section.tsx)
- [`history-status.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/history/history-status.ts)
  Status types.
- [`history-status-ui.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/history/history-status-ui.ts)
  Status-to-style mapping.

This is a good example of a UI refactor toward clearer responsibilities:

- type definitions in one place,
- style mapping in one place,
- page composition in one place,
- pure summary helpers under `lib`.

### Focus

The focus feature has both renderer behavior and main-process coordination.

Renderer-side focus files include:

- [`src/renderer/features/focus/focus-page.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/focus-page.tsx)
- [`components/focus-timer-card.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/components/focus-timer-card.tsx)
- [`components/focus-duration-editor.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/components/focus-duration-editor.tsx)
- [`components/focus-timer-header.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/components/focus-timer-header.tsx)
- [`components/focus-timer-actions.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/components/focus-timer-actions.tsx)
- [`components/focus-widget.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/components/focus-widget.tsx)
- [`components/use-focus-widget-snapshot.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/components/use-focus-widget-snapshot.ts)
- [`components/use-focus-widget-size-sync.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/components/use-focus-widget-size-sync.ts)
- [`components/focus-timer-view-model.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/focus/components/focus-timer-view-model.ts)

Main-process coordination lives in:

- [`src/main/features/focus/timer-coordinator.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/features/focus/timer-coordinator.ts)

This split exists because some focus behavior is just UI state, while some
behavior must coordinate across windows and the desktop app runtime.

### Settings

Settings is both:

- a real app settings editor,
- and a management area for habits and data operations.

One of the cleanup goals here was better naming for the habit editor controls.

The settings habit selectors are now split into:

- [`habit-category-selector.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/settings/components/habits/habit-category-selector.tsx)
- [`habit-frequency-selector.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/settings/components/habits/habit-frequency-selector.tsx)
- [`habit-weekday-selector.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/settings/components/habits/habit-weekday-selector.tsx)

That is much easier to navigate than one misleadingly named file doing three
separate jobs.

## 13. A full example: what happens when you toggle a habit

This is the best example to study because it touches almost every layer.

### In the renderer

A UI component calls an action from the app controller.
That action eventually calls `window.habits.toggleHabit(habitId)`.

### In preload

The preload bridge turns that method call into an `ipcRenderer.invoke(...)`
call using the channel name from the shared IPC contract.

### In the main process IPC layer

The handler in
[`src/main/infra/ipc/handlers.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/ipc/handlers.ts)
receives the request, validates the `habitId`, then calls
`service.toggleHabit(...)`.

### In the application service

`HabitsApplicationService.toggleHabit()`:

- ensures initialization happened,
- syncs rolling state,
- ensures today's status rows exist,
- toggles the stored status,
- rebuilds `TodayState`,
- returns the new state.

### In the repository layer

The repository handles the transaction and delegates the actual persistence work
to the history repository.

### Back to the renderer

The updated `TodayState` comes back through IPC and the renderer updates its
state, so React re-renders with the new completion state.

This pattern repeats throughout the app.

## 14. Why the architecture is shaped this way

Several design choices are intentional and worth learning from:

### The renderer is not the source of truth

The renderer displays and edits state, but the domain truth is built in the
backend. That is a strong fit for an Electron app with local persistence.

### Shared contracts keep the two sides honest

Typing the preload API and IPC payloads in `src/shared/contracts` reduces drift
between frontend and backend.

### Main-process services isolate business logic

This avoids spreading core rules across:

- React components,
- IPC handlers,
- and persistence code.

### Aggregate repositories hide infrastructure detail

The service does not need to know which table or repository owns each field. It
asks for domain operations and lets the repository layer handle storage.

### Feature folders help with local reasoning

Most renderer work can be understood feature by feature instead of requiring a
whole-app mental parse every time.

## 15. Where to add new code

A useful rule of thumb:

- If it touches OS APIs, windows, notifications, tray, or Electron lifecycle,
  it probably belongs in `src/main/app` or `src/main/features`.
- If it is a typed bridge method, it belongs in `src/preload` plus
  `src/shared/contracts`.
- If it is pure domain logic or a reusable type, it probably belongs in
  `src/shared`.
- If it is UI, state composition, or interactions inside React, it belongs in
  `src/renderer`.
- If it is SQL or persistence mapping, it belongs in `src/main/infra`.

When in doubt, ask: "is this code about desktop integration, domain behavior,
transport, storage, or UI?"

That usually reveals the correct layer.

## 16. How to trace a feature through the app

When you are new to the codebase, use this reading order:

1. Start with the user-facing page or component in `src/renderer/features`.
2. Follow the action into `src/renderer/app/controller`.
3. Look for the `window.habits` or `window.updater` call.
4. Jump to the matching contract in `src/shared/contracts`.
5. Open the matching handler in `src/main/infra/ipc/handlers.ts`.
6. Follow the call into `HabitsApplicationService` or another main feature
   module.
7. If storage is involved, continue into `src/main/infra/persistence`.

That path will explain almost any user action in the app.

## 17. Recommended files to read first

If you want a practical onboarding sequence, read these in order:

1. [`src/main/main.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/main.ts)
2. [`src/preload/preload.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/preload/preload.ts)
3. [`src/shared/contracts/habits-ipc.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/contracts/habits-ipc.ts)
4. [`src/renderer/app/app-root.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/app-root.tsx)
5. [`src/renderer/app/controller/use-app-controller.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/use-app-controller.ts)
6. [`src/main/infra/ipc/handlers.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/ipc/handlers.ts)
7. [`src/main/features/habits/habits-application-service.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/features/habits/habits-application-service.ts)
8. [`src/main/infra/persistence/sqlite-app-repository.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/persistence/sqlite-app-repository.ts)

Those files give you the top-level map before you dive into individual
features.

## 18. How testing maps to the architecture

The test layout mirrors the code structure.

Examples:

- shared domain logic has pure unit tests,
- main-process services and infrastructure have backend tests,
- IPC validation and handler logic has integration-style unit tests,
- renderer pages and hooks have React tests.

Representative examples:

- [`src/shared/domain/streak-engine.test.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/shared/domain/streak-engine.test.ts)
- [`src/main/features/habits/habits-application-service.test.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/features/habits/habits-application-service.test.ts)
- [`src/main/infra/ipc/handlers.test.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/main/infra/ipc/handlers.test.ts)
- [`src/renderer/app/controller/use-app-controller.test.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/app/controller/use-app-controller.test.tsx)
- [`src/renderer/features/history/history-page.test.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/apps/desktop/src/renderer/features/history/history-page.test.tsx)

When you add code, the best test placement is usually the layer that owns the
behavior.

## 19. Common mistakes to avoid

These mistakes are easy to make when learning Electron:

- Do not import Electron main-process APIs directly into renderer code.
- Do not put business rules only in React components if the backend also depends
  on them.
- Do not make the preload bridge fat; keep it narrow and typed.
- Do not bypass shared contracts when adding IPC.
- Do not put persistence logic in IPC handlers.
- Do not put unrelated responsibilities back into `main.ts`.

In this repo, good architecture usually means:

- one module has one obvious responsibility,
- file names match what they actually do,
- Electron boundaries stay explicit,
- shared types are the contract between layers.

## 20. Short glossary

- Main process: the Electron backend process with OS access.
- Renderer: the browser-like process running the React UI.
- Preload: the secure bridge injected into the renderer window.
- IPC: inter-process communication between renderer and main.
- Composition root: a file that wires major subsystems together.
- Repository: a persistence abstraction over SQLite operations.
- Application service: a class that coordinates business logic and repository
  usage.
- Local-first: user data lives locally on the machine and the app works without
  a cloud backend.

## 21. Final orientation

If the codebase feels large at first, focus on the boundaries:

- `main` owns desktop behavior and backend logic,
- `preload` owns safe bridging,
- `shared` owns contracts and pure domain language,
- `renderer` owns the UI.

Once that clicks, the rest of the project becomes much easier to navigate.
