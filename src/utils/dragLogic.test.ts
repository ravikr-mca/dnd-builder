import { describe, it, expect } from 'vitest';
import { resolveDragAction } from './dragLogic';
import { PALETTE_DRAG_PREFIX } from '../components/Palette';

describe('resolveDragAction', () => {
  it('resolves a palette drag onto the canvas as an add', () => {
    const action = resolveDragAction({
      activeId: `${PALETTE_DRAG_PREFIX}text`,
      overId: 'canvas',
      paletteType: 'text',
      order: [],
    });
    expect(action).toEqual({ kind: 'add', blockType: 'text' });
  });

  it('no-ops a palette drag with no resolvable type', () => {
    const action = resolveDragAction({
      activeId: `${PALETTE_DRAG_PREFIX}text`,
      overId: 'canvas',
      paletteType: undefined,
      order: [],
    });
    expect(action).toEqual({ kind: 'noop' });
  });

  it('resolves a block dragged over another block as a reorder', () => {
    const action = resolveDragAction({
      activeId: 'a',
      overId: 'c',
      paletteType: undefined,
      order: ['a', 'b', 'c'],
    });
    expect(action).toEqual({ kind: 'reorder', oldIndex: 0, newIndex: 2 });
  });

  it('no-ops when dropped outside any valid target (out of bounds)', () => {
    const action = resolveDragAction({
      activeId: 'a',
      overId: null,
      paletteType: undefined,
      order: ['a', 'b'],
    });
    expect(action).toEqual({ kind: 'noop' });
  });

  it('no-ops when dropped on itself', () => {
    const action = resolveDragAction({
      activeId: 'a',
      overId: 'a',
      paletteType: undefined,
      order: ['a', 'b'],
    });
    expect(action).toEqual({ kind: 'noop' });
  });

  it('no-ops when the over id is not a known block (stale/foreign id)', () => {
    const action = resolveDragAction({
      activeId: 'a',
      overId: 'not-in-order',
      paletteType: undefined,
      order: ['a', 'b'],
    });
    expect(action).toEqual({ kind: 'noop' });
  });
});
