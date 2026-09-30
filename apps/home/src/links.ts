import { appLinks, type AppName } from '@holdem-lab/assets/apps';

// appLinks points each app at its siblings (../<id>/); the home page sits beside them at the site root.
export function homeAppUrl(mode: string): (id: string) => string {
  const links = appLinks(mode);
  return (id) => (mode === 'development' ? links[id as AppName] : `${id}/`);
}
