import { memo, useCallback, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBlock } from '../hooks/useBuilder';
import { isSafeColor, isSafeUrl } from '../utils/validate';
import { cx } from '../utils/helpers';
import styles from './Block.module.css';

interface BlockProps {
  id: string;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

function BlockImpl({ id, selected, onSelect, onRemove }: BlockProps) {
  // Performance: subscribes only to this block's own data — editing block B
  // never causes block A's subscriber to fire.
  const block = useBlock(id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(id);
    },
    [id, onSelect],
  );
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(id);
    },
    [id, onRemove],
  );

  // Performance: dnd-kit moves the element via CSS transform, not by
  // recomputing layout/re-rendering siblings — this is what keeps a
  // many-block drag smooth.
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }),
    [transform, transition, isDragging],
  );

  if (!block) return null;

  const { type, props } = block;
  // Security: color/src/href are re-validated at render time as a last line
  // of defense, on top of validation already done at write-time.
  const safeColor = props.color && isSafeColor(props.color) ? props.color : undefined;
  const safeSrc = props.src && isSafeUrl(props.src) ? props.src : undefined;
  const safeHref = props.href && isSafeUrl(props.href) ? props.href : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(styles.block, selected && styles.blockSelected)}
      onClick={handleSelect}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        className={styles.remove}
        onClick={handleRemove}
        aria-label="Delete block"
      >
        ×
      </button>

      {/* Security: all user-supplied text renders as a plain JSX text child —
          React escapes it automatically. dangerouslySetInnerHTML is never used. */}
      {type === 'text' && (
        <p style={{ color: safeColor, fontSize: props.fontSize, textAlign: props.align }}>
          {props.content}
        </p>
      )}

      {type === 'button' && (
        <a
          className={styles.button}
          style={{ backgroundColor: safeColor }}
          href={safeHref || undefined}
          onClick={(e) => e.preventDefault()}
        >
          {props.content}
        </a>
      )}

      {type === 'image' &&
        (safeSrc ? (
          <img
            src={safeSrc}
            alt="Image block content"
            className={styles.image}
            style={{ width: props.width, height: props.height }}
          />
        ) : (
          <div className={styles.imagePlaceholder}>No image</div>
        ))}

      {type === 'container' && (
        <div
          className={styles.container}
          style={{ backgroundColor: safeColor, width: props.width, height: props.height }}
        />
      )}
    </div>
  );
}

// Performance: React.memo skips re-render when props (id/selected/callback
// refs) are unchanged — combined with useCallback upstream, an edit to one
// block or a selection change does not re-render every other Block instance.
export const Block = memo(BlockImpl);
