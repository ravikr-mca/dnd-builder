import { create } from 'zustand';
import type { Block, BlockProps, BlockType, Layout } from '../types/block';
import { defaultPropsFor } from '../types/block';
import { generateId } from '../utils/helpers';

interface BuilderState {
  blocks: Record<string, Block>;
  order: string[];
  selectedId: string | null;

  addBlock: (type: BlockType) => void;
  updateBlockProps: (id: string, patch: Partial<BlockProps>) => void;
  removeBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  reorder: (order: string[]) => void;
  replaceLayout: (layout: Layout) => void;
  clear: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  blocks: {},
  order: [],
  selectedId: null,

  // Performance: only the `blocks` record gains one new key; existing block
  // entries keep the same object reference, so unrelated <Block> subscribers
  // (selecting their own id) do not re-render.
  addBlock: (type) =>
    set((state) => {
      const id = generateId();
      const block: Block = { id, type, props: defaultPropsFor(type) };
      return {
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
        blocks: rest,
        order: state.order.filter((blockId) => blockId !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  selectBlock: (id) => set({ selectedId: id }),

  // Performance: reorder only ever touches the `order` array reference, never
  // the `blocks` record, so block components (which select their own data,
  // not their position) don't re-render just because the order changed.
  reorder: (order) => set({ order }),

  replaceLayout: (layout) =>
    set({ blocks: layout.blocks, order: layout.order, selectedId: null }),

  clear: () => set({ blocks: {}, order: [], selectedId: null }),
}));
