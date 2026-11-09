# ADR-002: Build row virtualization in-house instead of using a library

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

Rendering 100K rows as DOM nodes is not viable: initial render takes seconds and scrolling stutters. Mature options exist (`react-window`, `@tanstack/react-virtual`). They are excellent, but:

- They add a runtime dependency (the project goal is **zero runtime deps** and a ~12 KB budget).
- The table needs tight integration between the virtual window and **accessibility**: `aria-rowindex` must reflect the absolute row, the roving tab stop must survive rows being unmounted, and keyboard navigation must scroll the target row into view _under a sticky header_.
- The project is partly a learning exercise; owning this code is the point.

## Decision

Implement fixed-row-height virtualization ourselves:

- **Maths in core** (`getVirtualRange`): `start = floor(scrollTop / rowHeight) - overscan`, `end = ceil((scrollTop + viewport) / rowHeight) + overscan`, both clamped. The viewport is the scroller height minus the sticky header.
- **Hook** (`useVirtualRows`) listens to `scroll` passively and only calls `setState` when the _range_ changes, not on every pixel. A `ResizeObserver` keeps the viewport height current.
- **Rendering**: a body element of height `rowCount × rowHeight`. Each visible row is absolutely positioned with `transform: translateY(index × rowHeight)`. Rows are `React.memo` components keyed by row id.
- **Fixed heights only** in v0.1 (variable heights need measurement, caching and scroll anchoring; this is deferred).

## Consequences

- 100K rows: ~23 DOM rows at any time, ~18 ms initial render and 60 fps scrolling with 0 long frames (production build, Chrome on Apple M4; see README).
- Total JS stays ~5 KB brotli with no dependencies.
- We own edge cases (scroll clamping after filtering, resize, overscan tuning). These are covered by unit tests on `getVirtualRange` and Playwright tests in a real browser.
- Variable row heights are explicitly a non-goal for v0.1.
