import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasWebGL } from './webgl';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const offer = (contexts: Record<string, unknown>) => {
  vi.stubGlobal('WebGLRenderingContext', function WebGLRenderingContext() {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((id: string) => contexts[id] ?? null) as never);
};

describe('hasWebGL', () => {
  it('rejects a WebGL1-only device, since three.js needs WebGL2', () => {
    offer({ webgl: {} });
    expect(hasWebGL()).toBe(false);
  });

  it('accepts WebGL2 and releases the probe context', () => {
    const loseContext = vi.fn();
    offer({ webgl2: { getExtension: () => ({ loseContext }) } });
    expect(hasWebGL()).toBe(true);
    expect(loseContext).toHaveBeenCalled();
  });
});
