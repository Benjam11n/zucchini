# Stress Test Observations

This document captures observations from manual stress testing with the seeded
`stress` fixture database and recommends the highest-value fixes.

## Summary

Overall result:

- The seeded stress database is useful and representative.
- Focus and weekly review data generation held up well.
- The biggest pain points are habit-management CRUD latency, full-history
  rendering cost, and a couple of renderer layout issues.

Best next move:

1. Reduce habit CRUD work by avoiding a full today-state refresh for every
   edit/reorder operation.
2. Reduce History tab workload by limiting the default contribution graph to
   the current year and lazily loading older history only when explicitly
   needed.
3. Fix the Today top carousel layout/overflow behavior so it scrolls inside its
   own container instead of shifting the page width.

## Observations And Recommendations

### 1. [x] Habit CRUD is very laggy under stress data

Status:

- Completed in first pass.
- Structural habit writes no longer trigger the full `reloadAll()` path.
- Reorder now updates the visible list optimistically before the persistence
  round trip completes.
- Weekly review refreshes, when needed, now happen in the background instead of
  blocking the settings interaction.

Observed:

- Reordering habits is extremely laggy.
- Most habit CRUD actions feel laggy, not just reordering.

Likely cause:

- Most habit mutations route through [`app-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/app/controller/app-actions.ts), and each one calls `refreshToday(...)`.
- That means every create, rename, frequency change, weekday change, archive,
  unarchive, and reorder pulls a full `TodayState` back from main.
- Under a large dataset, that rehydrates all habits, settings, streak state,
  and any status rebuilding work tied to today.

Relevant files:

- [`app-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/app/controller/app-actions.ts)
- [`service.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/main/features/habits/service.ts)
- [`habit-management-content.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/features/settings/components/habits/habit-management-content.tsx)

Best fix:

- Split habit-management writes into two classes:
  - structural edits that only need the habit list updated
  - stateful actions that truly need a full today refresh
- For reorder specifically, apply an optimistic local reorder in the renderer
  and persist the order in the background, instead of blocking on a full round
  trip and full-state reload.

Recommended implementation:

- Add lighter-weight main-process responses for:
  - `createHabit`
  - `renameHabit`
  - `updateHabitCategory`
  - `updateHabitFrequency`
  - `updateHabitWeekdays`
  - `archiveHabit`
  - `unarchiveHabit`
  - `reorderHabits`
- Return either the updated habits list or the changed habit record rather than
  full `TodayState` for all of those operations.
- Keep `toggleHabit` on the current full today-state path, since it directly
  affects streak preview and completion state.
- For reorder, debounce or batch writes while dragging, and only persist once
  drop completes.

Expected impact:

- This should provide the largest visible UX improvement for settings-heavy
  workflows.

### 1a. [x] Checking off habits on the main page is laggy

Status:

- Completed.
- Habit toggles now flip the targeted habit locally in the renderer before the
  main-process refresh resolves.
- The returned `TodayState` remains authoritative and reconciles the optimistic
  state once the mutation completes.
- Failed toggles restore the previous renderer state instead of leaving the UI
  in a mismatched state.

Observed:

- Checking off habits on the Today page still feels laggy even after the
  structural habit-management writes were sped up.

Likely cause:

- `toggleHabit` still goes through the full today-state refresh path, which is
  appropriate for correctness but expensive under larger datasets.
- The Today page also recomputes ring, streak, and checklist state on every
  toggle.

Relevant files:

- [`app-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/app/controller/app-actions.ts)
- [`service.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/main/features/habits/service.ts)
- [`today-page.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/features/today/today-page.tsx)

Best fix:

- Keep the toggle response authoritative, but optimistically update the
  toggled habit in the renderer immediately and reconcile with the returned
  `TodayState` once the mutation completes.

Recommended implementation:

- Apply an optimistic toggle to the matching habit in `todayState`.
- Persist via the existing main-process mutation.
- Reconcile with the returned `TodayState` once it arrives.
- If a mismatch occurs, trust the main-process response and overwrite the local
  optimistic state.

### 2. [x] New habits are created at the bottom of the list

Status:

- Completed.
- New habits are now inserted at the top of the active list.
- The newly created habit auto-expands in the manager so it is immediately
  visible and editable.

Observed:

- New habits appear at the bottom of the settings list.
- This is functional, but not ideal UX, especially when the list is long.

Current behavior:

- New habits are appended after the current max sort order, so they land at the
  end of the list.

Relevant files:

- [`service.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/main/features/habits/service.ts)
- [`habit-management-content.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/features/settings/components/habits/habit-management-content.tsx)

Best fix:

- Insert new habits at the top of the active list and auto-expand them for
  immediate editing.

Why this is better:

- A newly created habit is the user’s current focus.
- Top insertion gives immediate visual confirmation.
- It avoids forcing the user to scroll to the bottom in large lists.

Recommended implementation:

- Insert new habits at sort order `0`.
- Shift existing active habits down by `+1`.
- Auto-expand the created row and focus the name field or the first editable
  control.
- If preserving user context is a concern, scroll the list to top after create.

Alternative if top insertion feels too aggressive:

- Insert directly below the new-habit form, which is usually equivalent in
  practice.

### 3. [x] History page loading is extremely laggy

Status:

- Completed.
- History now boots with the current year's timeline instead of a tiny recent
  slice or the full archive.
- Entering the History tab no longer forces a full-history fetch.
- Older history now loads only from an explicit user action in the History
  header.

Observed:

- The History tab is the main read-path performance issue.

Likely causes:

- Entering the History tab triggers `loadFullHistory()`.
- `loadFullHistory()` calls `window.habits.getHistory()` with no limit.
- `getHistory()` in main builds the entire history set and maps each day to its
  full habit list.
- The contribution grid is then built from the full history payload.

Relevant files:

- [`history-store.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/features/history/state/history-store.ts)
- [`app-actions.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/app/controller/app-actions.ts)
- [`service.ts`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/main/features/habits/service.ts)
- [`history-page.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/features/history/history-page.tsx)

Best fix:

- Stop treating the full history payload as the default History-tab load.

Recommended implementation:

1. Load a recent window first.
   - Example: 90 days or 180 days.
2. Restrict the GitHub-style contribution graph to the current year by default.
3. Load older history only when the user explicitly asks for it.
   - Example: year picker, “Load older history”, or paged month navigation.
4. Separate summary data from full day detail payloads.
   - The contribution graph and headline stats do not need full per-habit day
     payloads for every historical day.

Specific recommendation for the contribution graph:

- Yes, only display the current year by default.
- This is a good product decision, not just a performance compromise.
- It matches user expectation for a GitHub-style year view and reduces both
  render cost and cognitive load.
- The next refinement should be year-by-year loading rather than a single
  "load all older history" action.
- A practical shape is:
  - current year loads by default
  - selecting an unloaded year fetches just that year's summary payload
  - day detail still loads only for the selected date
- This keeps the year selector fast even for long-lived datasets and avoids
  paying the cost of the full archive up front.

Suggested API shape:

- Add a summary-oriented history endpoint that returns:
  - `date`
  - completion status
  - completed count
  - total count
  - freeze state
- Fetch full day detail only for the selected date.

Expected impact:

- This should be the biggest performance improvement on the History page.

### 4. [x] Today-page ring carousel changes app width and drags the whole screen

Status:

- Completed in first pass.
- The today-history carousel now uses explicit `min-w-0`, `max-w-full`, and
  overflow clipping so the ring strip stays within its own container.
- Horizontal overflow is contained at the carousel level instead of pushing the
  page width outward.

Observed:

- With many past-day rings, the app width shifts.
- Horizontal movement affects the whole page instead of just the carousel.

Likely cause:

- The carousel content is allowed to influence parent width and overflow.
- The container is not strongly clipping horizontal overflow at the page
  boundary.

Relevant files:

- [`today-history-carousel.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/features/today/components/today-history-carousel.tsx)
- [`carousel.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/shared/ui/carousel.tsx)

Best fix:

- Constrain the carousel with explicit overflow clipping and a stable min/max
  width contract.

Recommended implementation:

- Ensure the outer carousel wrapper uses:
  - `min-w-0`
  - `max-w-full`
  - `overflow-hidden`
- Ensure the page section containing the carousel also has `min-w-0`.
- Prevent the carousel content row from expanding the page width.
- If needed, add `overscroll-contain` to the carousel viewport so horizontal
  wheel or trackpad gestures stay scoped to the carousel.

Expected impact:

- Fixes the layout jump and makes the ring strip feel like an isolated control.

### 5. [x] Weekly review habit-completion graph is too tall

Status:

- Completed.
- The chart now caps the plotted habits to a compact top slice instead of
  growing without bound.
- Per-row density and y-axis label width are tighter, which keeps the chart
  height under control.
- Remaining habits move into a secondary compact list below the chart rather
  than forcing the plot itself to sprawl vertically.

Observed:

- The Habit completion chart is not compact enough vertically.

Current behavior:

- Chart height scales with `chartData.length * 52`, with a minimum of `280px`.
- Under large habit counts, this grows aggressively.

Relevant files:

- [`weekly-review-habit-chart-impl.tsx`](/Users/benjaminwang/Desktop/Random%20Projects/Zucchini/src/renderer/features/history/weekly-review/components/weekly-review-habit-chart-impl.tsx)

Best fix:

- Cap the number of rows shown in the chart and move the rest into a secondary
  list or scroll region.

Recommended implementation:

- Show only the top `8` to `12` habits in the chart.
  - Prefer top missed habits or lowest completion rates, depending on the
    product intent.
- Reduce per-row height from roughly `52px` to something closer to `32px` to
  `40px`.
- Tighten y-axis label width and abbreviate long names.
- If full coverage is still needed, place the remaining habits below in a simple
  table/list instead of forcing the chart itself to become very tall.

Expected impact:

- Better information density and less vertical sprawl in Weekly Review.

## Prioritized Fix Order

Recommended order of work:

1. History page load strategy
2. Habit CRUD/reorder path optimization
3. Today carousel overflow/layout fix
4. New-habit insertion UX improvement
5. Weekly review chart compaction

## Suggested Acceptance Criteria

### Habit CRUD

- Reordering a habit in a large list feels immediate.
- Creating, renaming, and editing habits no longer cause obvious UI stalls.

### History

- Entering the History tab under the stress fixture is noticeably faster.
- The default contribution graph renders only the current year.
- Older history is available through explicit loading or navigation.

### Today carousel

- The app width no longer changes when many rings are present.
- Horizontal scrolling affects only the ring carousel.

### Weekly review chart

- The habit-completion graph fits comfortably above the fold on typical laptop
  heights.
- The chart remains readable with larger habit counts.

### New habit UX

- A created habit appears in a prominent, immediately editable position.
