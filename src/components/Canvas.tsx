import { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Block } from './Block';
import { useBuilder } from '../hooks/useBuilder';

export const CANVAS_DROPPABLE_ID = 'canvas';

export function Canvas() {
  const { order, selectedId, selectBlock, removeBlock } = useBuilder();
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROPPABLE_ID });

  // Performance: stable callback identity so <Block> memoization isn't
  // defeated by a new function reference on every Canvas render.
  const handleSelect = useCallback((id: string) => selectBlock(id), [selectBlock]);
  const handleRemove = useCallback((id: string) => removeBlock(id), [removeBlock]);

  return (
    <div
      ref={setNodeRef}
      className={`canvas${isOver ? ' canvas--over' : ''}`}
      onClick={() => selectBlock(null)}
    >
      {order.length === 0 ? (
        <div className="canvas__empty">Drag a block here to get started</div>
      ) : (
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map((id) => (
            <Block
              key={id}
              id={id}
              selected={id === selectedId}
              onSelect={handleSelect}
              onRemove={handleRemove}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}
