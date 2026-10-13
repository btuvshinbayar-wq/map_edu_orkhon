/** Жижиг key-value cache. Хөтөч дээр IndexedDB, боломжгүй бол санах ой. Тест дээр солигдож болно. */
export interface KV {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

export class MemoryKV implements KV {
  private m = new Map<string, unknown>();
  async get<T>(k: string) { return this.m.get(k) as T | undefined; }
  async set(k: string, v: unknown) { this.m.set(k, v); }
  async del(k: string) { this.m.delete(k); }
}

export class IndexedDbKV implements KV {
  private dbp: Promise<IDBDatabase>;
  constructor(name = 'geo-cache', private store = 'kv') {
    this.dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(this.store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.dbp;
    return new Promise((resolve, reject) => {
      const r = fn(db.transaction(this.store, mode).objectStore(this.store));
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  get<T>(k: string) { return this.tx<T | undefined>('readonly', (s) => s.get(k)); }
  async set(k: string, v: unknown) { await this.tx('readwrite', (s) => s.put(v, k)); }
  async del(k: string) { await this.tx('readwrite', (s) => s.delete(k)); }
}

export function defaultKV(): KV {
  try {
    if (typeof indexedDB !== 'undefined') return new IndexedDbKV();
  } catch { /* fall through */ }
  return new MemoryKV();
}
