import { useCallback } from 'react';
import { useBuilderStore } from '../state/store';
import type { Block, BlockProps, BlockType } from '../types/block';
import {
  downloadLayout,
  loadFromLocalStorage,
  parseAndValidateLayout,
  saveToLocalStorage,
} from '../utils/serialize';

/**
 * Thin orchestration layer over the zustand store + serialize utils, kept out
 * of App.tsx per the assessment's "don't put all logic in App.tsx" instruction.
 */
export function useBuilder() {
  const order = useBuilderStore((s) => s.order);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const addBlock = useBuilderStore((s) => s.addBlock);
  const updateBlockProps = useBuilderStore((s) => s.updateBlockProps);
  const removeBlock = useBuilderStore((s) => s.removeBlock);
  const selectBlock = useBuilderStore((s) => s.selectBlock);
  const reorder = useBuilderStore((s) => s.reorder);
  const replaceLayout = useBuilderStore((s) => s.replaceLayout);
  const clear = useBuilderStore((s) => s.clear);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const canUndo = useBuilderStore((s) => s.past.length > 0);
  const canRedo = useBuilderStore((s) => s.future.length > 0);

  const save = useCallback(() => {
    const { blocks, order: currentOrder } = useBuilderStore.getState();
    saveToLocalStorage(blocks, currentOrder);
  }, []);

  const exportFile = useCallback(() => {
    const { blocks, order: currentOrder } = useBuilderStore.getState();
    downloadLayout(blocks, currentOrder);
  }, []);

  const loadSaved = useCallback((): { success: boolean; error?: string } => {
    const result = loadFromLocalStorage();
    if (!result) return { success: false, error: 'No saved layout found.' };
    if (!result.success) return { success: false, error: result.error };
    replaceLayout(result.layout);
    return { success: true };
  }, [replaceLayout]);

  const importFromText = useCallback(
    (json: string): { success: boolean; error?: string } => {
      const result = parseAndValidateLayout(json);
      if (!result.success) return { success: false, error: result.error };
      replaceLayout(result.layout);
      return { success: true };
    },
    [replaceLayout],
  );

  return {
    order,
    selectedId,
    addBlock,
    updateBlockProps,
    removeBlock,
    selectBlock,
    reorder,
    clear,
    save,
    exportFile,
    loadSaved,
    importFromText,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

export function useBlock(id: string): Block | undefined {
  return useBuilderStore((s) => s.blocks[id]);
}

export function useSelectedBlock(): Block | undefined {
  const selectedId = useBuilderStore((s) => s.selectedId);
  return useBuilderStore((s) => (selectedId ? s.blocks[selectedId] : undefined));
}

export type { Block, BlockProps, BlockType };
