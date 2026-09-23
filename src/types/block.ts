export type BlockType = 'text' | 'image' | 'button' | 'container';

export interface BlockProps {
  content?: string;
  color?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  src?: string;
  href?: string;
  width?: number;
  height?: number;
}

export interface Block {
  id: string;
  type: BlockType;
  props: BlockProps;
}

export interface Layout {
  version: 1;
  blocks: Record<string, Block>;
  order: string[];
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: 'Text',
  image: 'Image',
  button: 'Button',
  container: 'Container',
};

export function defaultPropsFor(type: BlockType): BlockProps {
  switch (type) {
    case 'text':
      return { content: 'Edit this text', color: '#1a1a1a', fontSize: 16, align: 'left' };
    case 'image':
      return { src: `${import.meta.env.BASE_URL}images/ui-ux-wireframe.jpg`, width: 300, height: 150 };
    case 'button':
      return { content: 'Click me', color: '#2563eb', href: '' };
    case 'container':
      return { color: '#f3f4f6', width: 400, height: 120 };
  }
}
