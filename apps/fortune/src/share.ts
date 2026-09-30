export type ShareNavigator = { share?: (data: ShareData) => Promise<void>; canShare?: (data: ShareData) => boolean };
export type ShareOutcome = 'shared' | 'cancelled' | 'fallback';

export function xIntentUrl(text: string, url: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export async function shareFortune(
  p: { text: string; url: string; image: Blob | null },
  deps: { nav: ShareNavigator; open: (url: string) => void },
): Promise<ShareOutcome> {
  const { nav, open } = deps;
  if (nav.share) {
    const files = p.image ? [new File([p.image], 'holdem-lab-fortune.png', { type: 'image/png' })] : null;
    const data: ShareData = files && nav.canShare?.({ files }) ? { files, text: p.text, url: p.url } : { text: p.text, url: p.url };
    try {
      await nav.share(data);
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  open(xIntentUrl(p.text, p.url));
  return 'fallback';
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
