export type Category = 'position' | 'action' | 'hand-board' | 'math' | 'slang';
export const CATEGORIES: Category[] = ['position', 'action', 'hand-board', 'math', 'slang'];

export type Term = {
  id: string;
  en: string;
  ja: string;
  kana: string;
  aliases?: string[];
  def: { ja: string; en: string };
  example: { en: string; ja: string };
};

export type Entry = { term: Term; category: Category };
