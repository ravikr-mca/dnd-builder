import { create } from 'zustand';
import type { Block, BlockProps, BlockType, Layout } from '../types/block';
import { defaultPropsFor } from '../types/block';
import { generateId } from '../utils/helpers';

interface HistorySnapshot {
  blocks: Record<string, Block>;
  order: string[];
}

const HISTORY_LIMIT = 50;

interface BuilderState {
  blocks: Record<string, Block>;
  order: string[];
  selectedId: string | null;
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  addBlock: (type: BlockType) => void;
  updateBlockProps: (id: string, patch: Partial<BlockProps>) => void;
  removeBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  reorder: (order: string[]) => void;
  replaceLayout: (layout: Layout) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  blocks: {},
  order: [],
  selectedId: null,
  past: [],
  future: [],

  // Structural changes (add/remove/reorder/replace/clear) are undoable.
  // Property edits are intentionally excluded — snapshotting per keystroke
  // would make undo granular to a single character, which is worse UX than
  // no undo for that action.
  //
  // Performance: only the `blocks` record gains one new key; existing block
  // entries keep the same object reference, so unrelated <Block> subscribers
  // (selecting their own id) do not re-render.
  addBlock: (type) =>
    set((state) => {
      const id = generateId();
      const block: Block = { id, type, props: defaultPropsFor(type) };
      return {
        past: [...state.past, { blocks: state.blocks, order: state.order }].slice(-HISTORY_LIMIT),
        future: [],
        blocks: { ...state.blocks, [id]: block },
        order: [...state.order, id],
        selectedId: id,
      };
    }),

  // Performance: replaces only blocks[id]; every other block entry's
  // reference is untouched, so React.memo + per-id selectors skip re-rendering
  // everything else on the canvas during a properties-panel edit.
  updateBlockProps: (id, patch) =>
    set((state) => {
      const existing = state.blocks[id];
      if (!existing) return state;
      return {
        blocks: {
          ...state.blocks,
          [id]: { ...existing, props: { ...existing.props, ...patch } },
        },
      };
    }),

  removeBlock: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.blocks;
      return {
        past: [...state.past, { blocks: state.blocks, order: state.order }].slice(-HISTORY_LIMIT),
        future: [],
        blocks: rest,
        order: state.order.filter((blockId) => blockId !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  selectBlock: (id) => set({ selectedId: id }),

  // Performance: reorder only ever touches the `order` array reference, never
  // the `blocks` record, so block components (which select their own data,
  // not their position) don't re-render just because the order changed.
  reorder: (order) =>
    set((state) => ({
      past: [...state.past, { blocks: state.blocks, order: state.order }].slice(-HISTORY_LIMIT),
      future: [],
      order,
    })),

  replaceLayout: (layout) =>
    set((state) => ({
      past: [...state.past, { blocks: state.blocks, order: state.order }].slice(-HISTORY_LIMIT),
      future: [],
      blocks: layout.blocks,
      order: layout.order,
      selectedId: null,
    })),

  clear: () =>
    set((state) => ({
      past: [...state.past, { blocks: state.blocks, order: state.order }].slice(-HISTORY_LIMIT),
      future: [],
      blocks: {},
      order: [],
      selectedId: null,
    })),

  undo: () => {
    if (get().past.length === 0) return;
    set((state) => {
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        future: [...state.future, { blocks: state.blocks, order: state.order }],
        blocks: previous.blocks,
        order: previous.order,
        selectedId: null,
      };
    });
  },

  redo: () => {
    if (get().future.length === 0) return;
    set((state) => {
      const next = state.future[state.future.length - 1];
      return {
        future: state.future.slice(0, -1),
        past: [...state.past, { blocks: state.blocks, order: state.order }],
        blocks: next.blocks,
        order: next.order,
        selectedId: null,
      };
    });
  },
}));
