# ADR-001: Keep a pure TypeScript core separate from the React layer

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

A data table mixes two kinds of work:

1. **Data logic**: sorting, filtering, selection maths, column sizing/pinning layout, virtual-window maths.
2. **Rendering and interaction**: React state, DOM events, focus, ARIA.

When these are interleaved inside components, logic can only be tested through rendering. It becomes hard to reason about (e.g. "why did this re-sort?"), and it is tied to one framework forever.

## Decision

`src/core/` contains only pure functions and types, with **zero React imports**. An ESLint `no-restricted-imports` rule enforces this on `core/**`.

- `sortRows`, `getNextSorting`, `compareValues`
- `filterRows`, `setColumnFilter`, `defaultFilterFn`
- `toggleRowSelected`, `selectRange`, `setAllSelected`, `getSelectAllStatus`
- `getColumnLayout`, `clampWidth`, `getColumnWidth`
- `getVirtualRange`, `getScrollTopForIndex`

`src/react/` wires these into `useTable` (state + memoization) and `<DataTable />` (DOM, events, ARIA). The core ships as its own entry point, `@himanshusingh11/tablekit/core`, without the `"use client"` banner, so it can run on a server (e.g. the server-side example uses the same `sortRows`/`filterRows` to fake an API).

## Consequences

- Core is unit-tested directly with plain inputs/outputs (100% coverage) and runs in milliseconds with no DOM.
- All state transitions are immutable and return the _same reference_ when nothing changed, which lets React skip renders and lets `useTable` avoid spurious `on*Change` callbacks.
- A Vue/Svelte/vanilla adapter would only need to re-implement the thin rendering layer.
- Cost: a little indirection. Some functions (e.g. `getColumnLayout`) exist only to keep geometry out of components.
