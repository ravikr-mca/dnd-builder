import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { Palette, PALETTE_DRAG_PREFIX } from './components/Palette';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Toolbar } from './components/Toolbar';
import { useBuilder } from './hooks/useBuilder';
import { resolveDragAction } from './utils/dragLogic';
import { BLOCK_TYPE_LABELS, type BlockType } from './types/block';
import './App.css';

// Restrict block *reordering* drags to the canvas bounds (the "dragged out of
// bounds" edge case) without restricting palette→canvas drags, which need to
// cross from the palette container into the canvas container.
const restrictSortableBlocksOnly: Modifier = (args) => {
  const id = args.active?.id;
  if (typeof id === 'string' && id.startsWith(PALETTE_DRAG_PREFIX)) return args.transform;
  return restrictToParentElement(args);
};

export default function App() {
  const { order, addBlock, reorder, updateBlockProps, save, loadSaved, exportFile, importFromText, clear } =
    useBuilder();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Reload a saved layout on mount (validated via the same schema as any
  // other import — a raw localStorage value is external, untrusted data).
  useEffect(() => {
    const result = loadSaved();
    if (!result.success && result.error && result.error !== 'No saved layout found.') {
      setBannerError(`Could not restore saved layout: ${result.error}`);
    }
    setInitializing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = useCallback((e: DragStartEvent) => setActiveId(String(e.active.id)), []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      const action = resolveDragAction({
        activeId: String(e.active.id),
        overId: e.over ? String(e.over.id) : null,
        paletteType: e.active.data.current?.paletteType as BlockType | undefined,
        order,
      });

      if (action.kind === 'add') addBlock(action.blockType);
      else if (action.kind === 'reorder') reorder(arrayMove(order, action.oldIndex, action.newIndex));
    },
    [order, addBlock, reorder],
  );

  const activeType = activeId?.startsWith(PALETTE_DRAG_PREFIX)
    ? (activeId.slice(PALETTE_DRAG_PREFIX.length) as BlockType)
    : null;

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictSortableBlocksOnly]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="app">
        <header className="app__header">
          <h1>Drag &amp; Drop Builder</h1>
        </header>

        <div className="hero">
          <img
            className="hero__image"
            src="/images/ui-ux-wireframe.jpg"
            alt="Wireframe and UI design mockups on a desk"
          />
          <div className="hero__caption">
            <p>Design layouts visually — drag, drop, done.</p>
          </div>
        </div>

        {bannerError && (
          <div className="app__banner app__banner--error" role="alert">
            {bannerError}
            <button type="button" onClick={() => setBannerError(null)} aria-label="Dismiss">×</button>
          </div>
        )}

        <Toolbar
          onSave={save}
          onLoadSaved={loadSaved}
          onExport={exportFile}
          onImportFile={importFromText}
          onClear={clear}
        />

        <main className="app__main">
          <aside className="app__sidebar">
            <Palette onAdd={addBlock} />
          </aside>

          <section className="app__canvas-area">
            {initializing ? (
              <div className="canvas__loading">Loading…</div>
            ) : (
              <Canvas />
            )}
          </section>

          <aside className="app__sidebar">
            <PropertiesPanel onChange={updateBlockProps} />
          </aside>
        </main>
      </div>

      <DragOverlay>
        {activeType ? (
          <div className="palette__item palette__item--overlay">{BLOCK_TYPE_LABELS[activeType]}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
