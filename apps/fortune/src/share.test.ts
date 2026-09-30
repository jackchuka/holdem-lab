import { describe, expect, it, vi } from 'vitest';
import { shareFortune, xIntentUrl } from './share';

const image = new Blob(['png'], { type: 'image/png' });
const payload = { text: '今日のポーカー運勢は 中吉', url: 'https://holdem-lab.com/fortune/?k=ntaro&d=2026-09-30', image };
const abort = () => Object.assign(new Error('cancel'), { name: 'AbortError' });

describe('xIntentUrl', () => {
  it('encodes text and url', () => {
    expect(xIntentUrl('a b&c', 'https://x/?k=1&d=2')).toBe(
      'https://x.com/intent/post?text=a%20b%26c&url=https%3A%2F%2Fx%2F%3Fk%3D1%26d%3D2',
    );
  });
});

describe('shareFortune', () => {
  it('shares the image when files are supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn();
    const outcome = await shareFortune(payload, { nav: { share, canShare: () => true }, open });
    expect(outcome).toBe('shared');
    const data = share.mock.calls[0][0] as ShareData;
    expect(data.files?.[0].type).toBe('image/png');
    expect(data.files?.[0].name).toBe('holdem-lab-fortune.png');
    expect(data.text).toBe(payload.text);
    expect(data.url).toBe(payload.url);
    expect(open).not.toHaveBeenCalled();
  });

  it('does nothing when the user cancels', async () => {
    const open = vi.fn();
    const outcome = await shareFortune(payload, { nav: { share: vi.fn().mockRejectedValue(abort()), canShare: () => true }, open });
    expect(outcome).toBe('cancelled');
    expect(open).not.toHaveBeenCalled();
  });

  it('falls back to the X intent when sharing fails', async () => {
    const open = vi.fn();
    const outcome = await shareFortune(payload, {
      nav: { share: vi.fn().mockRejectedValue(new Error('NotAllowed')), canShare: () => true },
      open,
    });
    expect(outcome).toBe('fallback');
    expect(open).toHaveBeenCalledWith(xIntentUrl(payload.text, payload.url));
  });

  it('shares text only when files are not supported but share exists', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareFortune(payload, { nav: { share, canShare: () => false }, open: vi.fn() });
    expect(outcome).toBe('shared');
    expect((share.mock.calls[0][0] as ShareData).files).toBeUndefined();
  });

  it('shares text only when there is no image', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    await shareFortune({ ...payload, image: null }, { nav: { share, canShare: () => true }, open: vi.fn() });
    expect((share.mock.calls[0][0] as ShareData).files).toBeUndefined();
  });

  it('falls back when the Web Share API is missing', async () => {
    const open = vi.fn();
    expect(await shareFortune(payload, { nav: {}, open })).toBe('fallback');
    expect(open).toHaveBeenCalledTimes(1);
  });
});
