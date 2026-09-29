import { createDexieStore } from './dexieStore';
import { createMemoryStore, type Store } from './store';

export async function openStore(): Promise<Store> {
  try {
    return await createDexieStore();
  } catch {
    return createMemoryStore();
  }
}
