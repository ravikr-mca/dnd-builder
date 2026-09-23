import { z } from 'zod';

// Security: only http(s) or relative/root-relative paths are ever accepted for
// src/href fields. javascript:, data:, vbscript:, etc. are rejected outright,
// which closes off the classic "URL field as XSS/injection vector" attack.
export function isSafeUrl(value: string): boolean {
  if (value === '') return true;
  const trimmed = value.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return true;
  try {
    const url = new URL(trimmed, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Security: restrict color input to a small set of safe patterns (hex, rgb/rgba,
// named CSS colors) so an attacker can't smuggle arbitrary CSS (e.g. url(),
// expression(), or other injection vectors) through a "color" field.
const SAFE_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)|[a-zA-Z]{3,20})$/;
export function isSafeColor(value: string): boolean {
  if (value === '') return true;
  return SAFE_COLOR_RE.test(value.trim());
}

const blockPropsSchema = z
  .object({
    content: z.string().max(2000).optional(),
    color: z.string().max(50).optional(),
    fontSize: z.number().min(1).max(200).optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    src: z.string().max(2000).optional(),
    href: z.string().max(2000).optional(),
    width: z.number().min(1).max(4000).optional(),
    height: z.number().min(1).max(4000).optional(),
  })
  .strict();

const blockSchema = z
  .object({
    id: z.string().min(1).max(100),
    type: z.enum(['text', 'image', 'button', 'container']),
    props: blockPropsSchema,
  })
  .strict();

export const layoutSchema = z
  .object({
    version: z.literal(1),
    blocks: z.record(z.string(), blockSchema),
    order: z.array(z.string()),
  })
  .strict()
  .refine(
    (layout) => layout.order.every((id) => id in layout.blocks),
    { message: 'order references a block id that does not exist' },
  )
  .refine(
    (layout) => Object.keys(layout.blocks).every((id, _i) => layout.order.includes(id)),
    { message: 'blocks contains an id missing from order' },
  );

export type ValidationResult =
  | { success: true; data: z.infer<typeof layoutSchema> }
  | { success: false; error: string };

// Security: the single choke point every import/paste/localStorage-read must
// pass through before it is ever applied to app state. Never trust external JSON.
export function validateLayout(raw: unknown): ValidationResult {
  const result = layoutSchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues.map((i) => i.message).join('; ') };
}

// Defense in depth: re-check every imported block's fields against the same
// guards used for manual edits, even though the shape already passed zod.
export function sanitizeImportedBlocks(layout: z.infer<typeof layoutSchema>): z.infer<typeof layoutSchema> {
  const blocks: typeof layout.blocks = {};
  for (const [id, block] of Object.entries(layout.blocks)) {
    blocks[id] = {
      ...block,
      props: {
        ...block.props,
        src: block.props.src && isSafeUrl(block.props.src) ? block.props.src : undefined,
        href: block.props.href && isSafeUrl(block.props.href) ? block.props.href : undefined,
        color: block.props.color && isSafeColor(block.props.color) ? block.props.color : undefined,
      },
    };
  }
  return { ...layout, blocks };
}
