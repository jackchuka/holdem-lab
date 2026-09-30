import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const felt = { background: '#0d3b26', fit: 'contain' };

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.2, resizeOptions: felt },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: felt },
  },
  images: ['public/icon.svg'],
});
