import { elementIcon } from '@holdem-lab/assets';
import './home-link.css';

// Drawn inline rather than loaded from the home page, so an installed app still shows it offline.
// The gradient id is renamed so it cannot clash with another inline SVG on the page.
const LOGO = elementIcon({ number: 0, symbol: 'Hl' }).replaceAll('#felt', '#home-link-felt').replace('id="felt"', 'id="home-link-felt"');

export function HomeLink({ href }: { href: string }) {
  return (
    <a className="home-link" href={href} aria-label="holdem-lab">
      <span className="home-link-logo" aria-hidden="true" dangerouslySetInnerHTML={{ __html: LOGO }} />
      <span className="home-link-sep" aria-hidden="true">
        ›
      </span>
    </a>
  );
}
