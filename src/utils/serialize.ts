import type { Block, Layout } from '../types/block';
import { sanitizeImportedBlocks, validateLayout } from './validate';

const STORAGE_KEY = 'dnd-builder-layout';

// Security: export only ever serializes plain layout data (version/blocks/order).
// No functions, DOM refs, or anything executable can end up in the output.
export function serializeLayout(blocks: Record<string, Block>, order: string[]): string {
  const layout: Layout = { version: 1, blocks, order };
  return JSON.stringify(layout, null, 2);
}

export type ImportResult =
  | { success: true; layout: Layout }
  | { success: false; error: string };

// Security: the only path by which external JSON (file import, paste, or a
// localStorage value someone could hand-edit) is allowed to become app state.
export function parseAndValidateLayout(json: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { success: false, error: 'Not valid JSON.' };
  }
  const result = validateLayout(raw);
  if (!result.success) return { success: false, error: result.error };
  return { success: true, layout: sanitizeImportedBlocks(result.data) };
}

export function saveToLocalStorage(blocks: Record<string, Block>, order: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeLayout(blocks, order));
  } catch {
    // localStorage can throw (quota, private mode) — non-fatal, save is best-effort.
  }
}

export function loadFromLocalStorage(): ImportResult | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  return parseAndValidateLayout(raw);
}

export function downloadLayout(blocks: Record<string, Block>, order: string[]): void {
  const json = serializeLayout(blocks, order);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'layout.json';
  a.click();
  URL.revokeObjectURL(url);
}
