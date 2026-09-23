import { describe, it, expect } from 'vitest';
import { isSafeUrl, isSafeColor, validateLayout } from './validate';

describe('isSafeUrl', () => {
  it('allows http(s) and relative URLs', () => {
    expect(isSafeUrl('https://example.com/img.png')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
    expect(isSafeUrl('/images/foo.jpg')).toBe(true);
    expect(isSafeUrl('')).toBe(true);
  });

  it('rejects javascript: and data: URLs', () => {
    // The exact payload used against the live app during manual security testing.
    expect(isSafeUrl('javascript:alert(document.cookie)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });
});

describe('isSafeColor', () => {
  it('allows hex, rgb, and named colors', () => {
    expect(isSafeColor('#2563eb')).toBe(true);
    expect(isSafeColor('rgba(37, 99, 235, 0.5)')).toBe(true);
    expect(isSafeColor('red')).toBe(true);
    expect(isSafeColor('')).toBe(true);
  });

  it('rejects CSS-injection-style values', () => {
    expect(isSafeColor('red; background:url(javascript:alert(1))')).toBe(false);
    expect(isSafeColor('expression(alert(1))')).toBe(false);
  });
});

describe('validateLayout', () => {
  const validLayout = {
    version: 1,
    blocks: { a: { id: 'a', type: 'text', props: { content: 'hi' } } },
    order: ['a'],
  };

  it('accepts a well-formed layout', () => {
    const result = validateLayout(validLayout);
    expect(result.success).toBe(true);
  });

  it('rejects a block type outside the allowed enum', () => {
    const result = validateLayout({
      version: 1,
      blocks: { a: { id: 'a', type: 'iframe', props: {} } },
      order: ['a'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unexpected/extra keys (schema smuggling)', () => {
    const result = validateLayout({
      version: 1,
      blocks: { a: { id: 'a', type: 'text', props: { content: 'hi' }, onClick: 'alert(1)' } },
      order: ['a'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects order referencing a block id that does not exist', () => {
    const result = validateLayout({
      version: 1,
      blocks: { a: { id: 'a', type: 'text', props: {} } },
      order: ['a', 'ghost'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects blocks containing an id missing from order', () => {
    const result = validateLayout({
      version: 1,
      blocks: {
        a: { id: 'a', type: 'text', props: {} },
        b: { id: 'b', type: 'text', props: {} },
      },
      order: ['a'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-JSON-shaped garbage', () => {
    expect(validateLayout(null).success).toBe(false);
    expect(validateLayout('not an object').success).toBe(false);
    expect(validateLayout({ not: 'a valid layout' }).success).toBe(false);
  });
});
