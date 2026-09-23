import type { BlockType } from '../types/block';
import { PALETTE_DRAG_PREFIX } from '../components/Palette';

export type DragAction =
  | { kind: 'add'; blockType: BlockType }
  | { kind: 'reorder'; oldIndex: number; newIndex: number }
  | { kind: 'noop' };

interface ResolveDragActionParams {
  activeId: string;
  overId: string | null;
  paletteType: BlockType | undefined;
  order: string[];
}

// Pure decision logic for a dnd-kit onDragEnd event, kept out of App.tsx so
// it's plain data in/data out — no React, no DnD-kit event objects — and
// testable on its own.
export function resolveDragAction({
  activeId,
  overId,
  paletteType,
  order,
}: ResolveDragActionParams): DragAction {
  if (overId === null) return { kind: 'noop' }; // dropped out of bounds

  if (activeId.startsWith(PALETTE_DRAG_PREFIX)) {
    return paletteType ? { kind: 'add', blockType: paletteType } : { kind: 'noop' };
  }

  if (activeId === overId) return { kind: 'noop' };
  if (!order.includes(overId)) return { kind: 'noop' };

  const oldIndex = order.indexOf(activeId);
  const newIndex = order.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) return { kind: 'noop' };

  return { kind: 'reorder', oldIndex, newIndex };
}
