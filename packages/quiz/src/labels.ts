import { NUT_CATEGORY_KEYS, streetText, type NutCategoryKey, type Street } from './generators/nuts';
import { drawText, handCategoryText, text, type Text } from './i18n/text';

export function labelOfKey(itemKey: string): Text {
  const i = itemKey.indexOf(':');
  const prefix = itemKey.slice(0, i);
  const rest = itemKey.slice(i + 1);
  switch (prefix) {
    case 'eq': {
      const [a, b] = rest.split('-vs-');
      return text('label.equity', { a, b });
    }
    case 'outs':
      return drawText(rest);
    case 'odds':
      return text('label.odds', { n: rest });
    case 'rfi': {
      const [pos, hand] = rest.split(':');
      return text('label.rfi', { pos, hand });
    }
    case 'po':
      return text('label.po', { bet: rest.replace('bet-', '') });
    case 'mdf':
      return text('label.mdf', { bet: rest.replace('bet-', '') });
    case 'nuts':
    case 'nutsnext': {
      const [street, key] = rest.split(':');
      return text(prefix === 'nuts' ? 'label.nuts' : 'label.nutsnext', {
        street: streetText(street as Street),
        name: handCategoryText(NUT_CATEGORY_KEYS[key as NutCategoryKey]),
      });
    }
    case 'nuts2':
      return text('label.nuts2', { street: streetText(rest as Street) });
    default:
      return text('value', { value: itemKey });
  }
}
