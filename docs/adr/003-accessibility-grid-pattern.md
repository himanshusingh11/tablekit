# ADR-003: Accessibility via the ARIA grid pattern with roving tabindex

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

A data table can be exposed as a static `table` (read-only, Tab moves through every interactive cell) or as an interactive `grid` (one tab stop, arrow keys move between cells). With sorting, selection and potentially thousands of rows, a static table forces keyboard users through hundreds of tab stops. Virtualization adds another problem: rows that are not rendered cannot hold focus.

## Decision

Implement the [WAI-ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) using `div`s with explicit roles:

- `role="grid"` with `aria-rowcount` (total rows + header, **not** rendered rows), `aria-colcount`, `aria-multiselectable` when selection is on, and `aria-busy` while loading.
- `role="row"` with `aria-rowindex` = absolute index + 2 (header is 1), so screen readers announce "row 50,001 of 100,001" even though only ~23 rows exist.
- `role="columnheader"` with `aria-sort` on sorted columns. `role="gridcell"` with `aria-colindex`. `aria-selected` on rows.
- **Roving tabindex**: exactly one cell has `tabIndex=0`. Arrow keys, Home/End, Ctrl+Home/End and PageUp/PageDown move it. The target row is scrolled into view (accounting for the sticky header) and focused after render with `preventScroll`.
- If the active row is virtualized away (mouse scrolling), the tab stop falls back to the header cell of the same column, so the grid never loses its tab stop.
- Actions: Enter sorts on headers, Space toggles selection (Shift+Space for a range), Ctrl/Cmd+A selects all, Alt+←/→ resizes a column, Enter on a row calls `onRowClick`.
- Checkboxes inside cells have `tabIndex=-1` and accessible labels; the cell owns focus.
- Visible focus ring via `:focus-visible` with a themeable `--tk-focus` colour.

## Consequences

- One tab stop regardless of size; keyboard users can operate every feature.
- Verified by `vitest-axe` in jsdom (structure), `@axe-core/playwright` in real Chrome (including colour contrast), and RTL keyboard tests.
- Using `div`s means we must keep roles consistent ourselves (no native table semantics). Tests guard this.
- Screen reader testing with VoiceOver/NVDA is still recommended before each release; automated tools catch roughly a third of issues.
