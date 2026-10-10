import type { Term } from '../terms';

export function Example({ term }: { term: Term }) {
  return (
    <span className="example">
      <span className="ex-en" lang="en">
        {term.example.en}
      </span>
      <span className="ex-ja" lang="ja">
        {term.example.ja}
      </span>
    </span>
  );
}
