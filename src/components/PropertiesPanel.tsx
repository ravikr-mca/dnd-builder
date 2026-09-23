import { useCallback } from 'react';
import { useSelectedBlock } from '../hooks/useBuilder';
import { isSafeColor, isSafeUrl } from '../utils/validate';
import type { BlockProps } from '../types/block';
import styles from './PropertiesPanel.module.css';
import shared from './shared.module.css';

export function PropertiesPanel({
  onChange,
}: {
  onChange: (id: string, patch: Partial<BlockProps>) => void;
}) {
  const block = useSelectedBlock();

  const set = useCallback(
    (patch: Partial<BlockProps>) => {
      if (block) onChange(block.id, patch);
    },
    [block, onChange],
  );

  if (!block) {
    return (
      <div className={styles.properties}>
        <h2 className={shared.panelTitle}>Properties</h2>
        <p className={styles.empty}>Select a block to edit its properties</p>
      </div>
    );
  }

  const { props } = block;
  const colorInvalid = props.color !== undefined && props.color !== '' && !isSafeColor(props.color);
  const urlField = block.type === 'image' ? 'src' : block.type === 'button' ? 'href' : null;
  const urlValue = urlField ? (props[urlField] ?? '') : '';
  const urlInvalid = urlField !== null && urlValue !== '' && !isSafeUrl(urlValue);

  return (
    <div className={styles.properties}>
      <h2 className={shared.panelTitle}>Properties — {block.type}</h2>

      {(block.type === 'text' || block.type === 'button') && (
        <label className={styles.field}>
          Content
          <textarea
            value={props.content ?? ''}
            maxLength={2000}
            onChange={(e) => set({ content: e.target.value })}
          />
        </label>
      )}

      {block.type !== 'image' && (
        <label className={styles.field}>
          Color
          <input
            type="text"
            value={props.color ?? ''}
            placeholder="#2563eb"
            onChange={(e) => set({ color: e.target.value })}
          />
          {colorInvalid && (
            <span className={styles.fieldError}>Unsafe or invalid color value — ignored on render.</span>
          )}
        </label>
      )}

      {block.type === 'text' && (
        <>
          <label className={styles.field}>
            Font size
            <input
              type="number"
              min={1}
              max={200}
              value={props.fontSize ?? 16}
              onChange={(e) => set({ fontSize: Number(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            Align
            <select value={props.align ?? 'left'} onChange={(e) => set({ align: e.target.value as BlockProps['align'] })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </>
      )}

      {urlField && (
        <label className={styles.field}>
          {urlField === 'src' ? 'Image URL' : 'Link URL'}
          <input
            type="text"
            value={urlValue}
            placeholder="https://example.com"
            onChange={(e) => set({ [urlField]: e.target.value })}
          />
          {urlInvalid && (
            <span className={styles.fieldError}>Only http(s) or relative URLs are allowed — ignored on render.</span>
          )}
        </label>
      )}

      {(block.type === 'image' || block.type === 'container') && (
        <>
          <label className={styles.field}>
            Width (px)
            <input
              type="number"
              min={1}
              max={4000}
              value={props.width ?? ''}
              onChange={(e) => set({ width: Number(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            Height (px)
            <input
              type="number"
              min={1}
              max={4000}
              value={props.height ?? ''}
              onChange={(e) => set({ height: Number(e.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  );
}
