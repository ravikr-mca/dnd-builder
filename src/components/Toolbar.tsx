import { useCallback, useRef, useState } from 'react';
import { cx } from '../utils/helpers';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  onSave: () => void;
  onLoadSaved: () => { success: boolean; error?: string };
  onExport: () => void;
  onImportFile: (json: string) => { success: boolean; error?: string };
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Toolbar({
  onSave,
  onLoadSaved,
  onExport,
  onImportFile,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'error'; message: string }>({
    kind: 'idle',
    message: '',
  });
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    onSave();
    setStatus({ kind: 'ok', message: 'Saved to this browser.' });
  }, [onSave]);

  const handleLoad = useCallback(() => {
    const result = onLoadSaved();
    setStatus(
      result.success
        ? { kind: 'ok', message: 'Loaded saved layout.' }
        : { kind: 'error', message: result.error ?? 'Could not load saved layout.' },
    );
  }, [onLoadSaved]);

  const handleImportClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      setBusy(true);
      try {
        const text = await file.text();
        const result = onImportFile(text);
        setStatus(
          result.success
            ? { kind: 'ok', message: 'Layout imported.' }
            : { kind: 'error', message: `Import rejected: ${result.error}` },
        );
      } finally {
        setBusy(false);
      }
    },
    [onImportFile],
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.actions}>
        <button
          type="button"
          className={cx(styles.btn, styles.btnGhost)}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          className={cx(styles.btn, styles.btnGhost)}
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          Redo
        </button>
        <button type="button" className={cx(styles.btn, styles.btnPrimary)} onClick={handleSave}>
          Save
        </button>
        <button type="button" className={cx(styles.btn, styles.btnGhost)} onClick={handleLoad}>
          Load
        </button>
        <button type="button" className={cx(styles.btn, styles.btnPrimary)} onClick={onExport}>
          Export JSON
        </button>
        <button
          type="button"
          className={cx(styles.btn, styles.btnGhost)}
          onClick={handleImportClick}
          disabled={busy}
        >
          {busy && <span className={styles.spinner} aria-hidden="true" />}
          {busy ? 'Importing…' : 'Import JSON'}
        </button>
        <button type="button" className={cx(styles.btn, styles.btnDanger)} onClick={onClear}>
          Clear
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          hidden
        />
      </div>
      {status.kind !== 'idle' && (
        <div
          className={cx(
            styles.status,
            status.kind === 'ok' && styles.statusOk,
            status.kind === 'error' && styles.statusError,
          )}
          role="status"
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
