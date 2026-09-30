export const DEV_PORTS = { flashcards: 5173, equity: 5174, fortune: 5175 } as const;
export type AppName = keyof typeof DEV_PORTS;

// Built apps sit side by side under one origin; in `pnpm dev` each app is its own server on a fixed port.
export function appLinks(mode: string): Record<AppName, string> {
  const link = (app: AppName) => (mode === 'development' ? `http://localhost:${DEV_PORTS[app]}/` : `../${app}/`);
  return { flashcards: link('flashcards'), equity: link('equity'), fortune: link('fortune') };
}
