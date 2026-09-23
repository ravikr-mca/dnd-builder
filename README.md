# Drag & Drop Builder

A mini page builder: add blocks from a palette, drag to position/reorder them on a canvas,
edit the selected block live via a properties panel, and save/load the layout as JSON.

## Install & Run

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). Requires Node 18+.

```bash
npm run build   # production build + type-check
npm run lint     # oxlint
```

No environment variables or backend are required — the app is fully client-side.

## Features

- **Palette**: text / image / button / container blocks — drag onto the canvas or click `+` to add.
- **Canvas**: drag to reorder blocks; click a block to select it (outline shows selection); `×` deletes it.
- **Properties panel**: edit the selected block's content, color, font size, alignment, URL, and size — changes apply live.
- **Save/Load**: `Save`/`Load` persist to this browser's `localStorage`; `Export JSON`/`Import JSON` download/upload a layout file.
- **Responsive**: three-column layout on desktop; sidebars stack below the canvas under 900px width.

## Project Structure

```
src/
├── components/   Canvas, Palette, Block, PropertiesPanel, Toolbar
├── hooks/        useBuilder.ts — orchestration layer over the store
├── state/        store.ts — zustand store (single source of truth)
├── types/        block.ts — Block/Layout types
├── utils/        serialize.ts, validate.ts, helpers.ts, dragLogic.ts
├── App.tsx        DndContext wiring, drag handlers
└── main.tsx
```

## Performance decisions

| Requirement | How it's addressed |
|---|---|
| No whole-board re-render on an **edit** | State is normalized (`Record<id, Block>` + `order[]`). Each `Block` subscribes to **only its own** entry via a Zustand selector (`useBlock(id)` → `useBuilderStore(s => s.blocks[id])`). Verified empirically with a render-count probe: typing into the Properties panel re-rendered only the edited block — sibling blocks logged zero additional renders. |
| Stable keys, `React.memo`, `useMemo`/`useCallback` | `Block` is wrapped in `React.memo`. All handlers passed into the list (`onSelect`, `onRemove`) are built once with `useCallback` in `Canvas`/`App`, not recreated inline per render — including the palette's per-row add handler (`PaletteRow`), which previously created a new closure per item per render. Derived per-block style objects use `useMemo`. |
| No inline object/function churn in the render list | `Canvas.tsx`'s `.map()` passes only primitive props (`id`, `selected`) plus the two memoized callbacks — no `() => ...` or `{ ... }` literals created per item per render. |
| Reordering **does** re-render sibling blocks, by design of the library — documented, not hidden | Verified empirically: during an active drag-to-reorder, sibling `Block` components *do* re-render repeatedly, not just the dragged one. This is `@dnd-kit/sortable`'s live "shift to make room" reflow — every sibling's own `useSortable()` hook must recompute its transform on each drag tick to animate out of the way, and that's a context-driven update inside the child, which `React.memo` cannot block (memo only stops re-renders triggered by unchanged *props*, not by a hook/context the child subscribes to itself). This is inherent to any sortable list with a live reflow preview, not specific to this codebase. It stays smooth in practice because each re-render is cheap (lightweight JSX, no expensive work in `Block`) and the actual DOM writes dnd-kit applies are GPU-composited `transform: translate3d(...)`, not layout-triggering changes — chosen deliberately over disabling the live reflow (which would make sibling re-renders during drag literally zero, at the cost of losing the "blocks shift to make room while dragging" preview). |
| Update only the changed block | `updateBlockProps` in `state/store.ts` replaces `blocks[id]` alone; every other block keeps the same object reference, which is what makes the per-id selector skip re-rendering them on an **edit**. `reorder`/`addBlock` do change the shared `order` array reference, which is what drives the sibling re-renders described above. |
| Virtualization | The palette is a fixed 4-item list — virtualizing it would add complexity for no benefit. Documented trade-off: if the canvas needed to support very large block counts, the next step would be `react-window` for the block list; not implemented here since the assessment's block set is small by nature (a handful of page-builder blocks, not a data table), and a freely-reorderable virtualized list is a materially bigger effort than the assessment's time budget allows. |

## Security decisions

| Requirement | How it's addressed |
|---|---|
| No XSS via user-entered content | All block text renders as a plain JSX child (`{props.content}`) — React escapes it automatically. `dangerouslySetInnerHTML` is not used anywhere in this codebase. |
| Validate imported layouts | `utils/validate.ts` defines a Zod schema for the full `{version, blocks, order}` shape. Every import path — file upload, and the `localStorage` read on mount — goes through `safeParse`. On failure, the layout is rejected outright (error banner/toolbar status shown), and existing state is left untouched. |
| Guard configurable fields (URL / color) against injection | `isSafeUrl` allows only `http:`/`https:`/relative paths for `src`/`href` (rejects `javascript:`, `data:`, etc.). `isSafeColor` restricts `color` to hex/rgb/named-color patterns. Both are enforced **twice**: once on manual edit in `PropertiesPanel`/`Block` (invalid values are visibly flagged and simply not applied to the rendered style/href), and again via `sanitizeImportedBlocks` on anything coming from an import — defense in depth, since an imported layout could otherwise smuggle a bad value past a shape-only check. |
| Safe export | `serializeLayout` only ever `JSON.stringify`s `{version, blocks, order}` — plain data, never functions, DOM refs, or anything executable. |
| No secrets in the client | The app makes no backend calls and has no API keys or tokens anywhere in source or config. |

## Edge cases handled

- **Empty canvas** — placeholder message when there are no blocks.
- **Deleting a block** — removed from state; selection clears if it was the deleted block.
- **Invalid/malformed import** (file or corrupted `localStorage` value) — Zod validation rejects it, a visible error is shown, state is unchanged, app does not crash.
- **Block dragged out of bounds** — a custom `dnd-kit` modifier restricts *reordering* drags to the canvas's own bounds (palette→canvas drags are exempt, since they must cross container boundaries); dropping outside any valid target is simply a no-op.
- **Rapid drag operations** — handled natively by dnd-kit's sensors and React 18's automatic batching; no custom debouncing needed.
- **Reloading a saved layout** — on mount, the app reads `localStorage` and validates it through the same schema as any other import before applying it.

## Trade-offs / not implemented (time-boxed to ~2 hours)

- Undo/redo, automated tests, and snap-to-grid (listed as bonus items) were intentionally skipped to keep the core requirements — architecture, drag interaction, performance, and security — fully implemented within the time budget, rather than partially covering everything.
- Styling is plain CSS by design (explicitly listed as an acceptable option in the brief) — no UI framework dependency.
