# Architecture

Zucchini uses one-way dependency flow. Runtime code can depend on pure code,
but pure code must not depend on runtime adapters, UI, Electron, or SQLite.

The goal is to keep UI, business logic, runtime adapters, and domain rules from
collapsing into one import graph.

## Dependency Shape

```text
main/app
  -> main/features -> main/ports -> shared
  -> main/infra    -> main/ports -> shared

renderer
  -> renderer/shared
  -> shared
  -> preload API at runtime, not imports

preload
  -> shared

shared/domain
  -> shared/utils only
```

## Boundary Rules

### Web Stays Separate

`apps/web` must not import desktop code.

The public website should not depend on Electron internals, preload contracts,
desktop build paths, or app runtime assumptions.

### Renderer Is UI Only

Renderer code must not import main-process code, preload code, repositories,
database modules, filesystem modules, or Electron APIs.

Renderer code talks to the desktop app through the preload-exposed API at
runtime. This keeps the renderer sandboxed and avoids leaking privileged
implementation details into UI code.

### Preload Is A Thin Bridge

Preload code should only import shared contracts, shared domain types, and
shared utilities.

It should expose safe APIs, validate or normalize IPC payloads where needed,
and translate between renderer calls and main-process IPC. It should not become
a second application runtime.

### Features Depend On Ports, Not Infra

Main-process feature services may import `main/ports` and `shared`, but not
`main/infra`.

Feature code owns application behavior. It can depend on abstractions such as
`AppRepository`, but not concrete implementations such as `SqliteAppRepository`,
Drizzle tables, SQLite clients, or Electron adapters. This keeps business logic
testable and prevents persistence details from leaking into services.

### Infra Implements Ports

Main-process infrastructure may import `main/ports` and `shared`, but should
not import feature services.

Persistence, database, IPC, and Electron adapters implement the runtime edges of
the app. They should satisfy port contracts and translate external systems into
domain data. They should not own business decisions.

IPC is the narrow exception: IPC handlers may call feature services because
they are an adapter from renderer requests into application behavior.

### App Wires Everything

`main/app` is the composition and runtime shell.

It may create repositories, create services, register IPC handlers, configure
windows, start timers, wire tray actions, and apply runtime settings. This layer
is allowed to know both features and infrastructure because composition is its
job.

### Shared Domain Is Pure

`shared/domain` must not import contracts, renderer code, main-process code, or
infrastructure.

Domain code should hold pure types, validation, date rules, streak rules,
settings rules, and other app concepts that can be used from any runtime.

### Renderer Shared Must Stay Shared

`renderer/shared` must not import `renderer/features`.

Shared renderer components, hooks, types, and utilities must stay generic. If a
shared module needs feature-specific types or behavior, either move it into the
feature or move the neutral type down into `renderer/shared`.

Renderer features should not import other renderer features by default. A
feature may depend on its own folder, `renderer/shared`, and `shared`. If a
cross-feature import looks useful, first decide whether the imported code is
neutral enough to live in `renderer/shared`; otherwise keep the dependency
feature-local and review it as an intentional coupling.

## Practical Examples

- A client component should never import repository functions. It should use
  renderer state/hooks that call the preload API.
- A service should depend on `AppRepository` or a smaller port, not
  `SqliteAppRepository`.
- A repository should not call a service to decide business behavior. The
  service decides; the repository persists and retrieves.
- Shared domain code should not import IPC schemas. IPC schemas can import
  domain types and validators.
- A reusable renderer component should not import history, today, focus, or
  settings feature modules.
