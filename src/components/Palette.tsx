import { useDraggable } from '@dnd-kit/core';
import { BLOCK_TYPE_LABELS, type BlockType } from '../types/block';

const BLOCK_TYPES: BlockType[] = ['text', 'image', 'button', 'container'];
export const PALETTE_DRAG_PREFIX = 'palette-';

function PaletteItem({ type }: { type: BlockType }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${PALETTE_DRAG_PREFIX}${type}`,
    data: { paletteType: type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`palette__item${isDragging ? ' palette__item--dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {BLOCK_TYPE_LABELS[type]}
    </button>
  );
}

// Small fixed list (4 types) — no virtualization needed here; see README for
// the trade-off note on when that would change.
export function Palette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="palette">
      <h2 className="panel__title">Palette</h2>
      <p className="palette__hint">Drag onto the canvas, or click to add</p>
      <div className="palette__list">
        {BLOCK_TYPES.map((type) => (
          <div key={type} className="palette__row">
            <PaletteItem type={type} />
            <button type="button" className="palette__add" onClick={() => onAdd(type)} aria-label={`Add ${type}`}>
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
