export class CacheAsLRUMap<Key, Value> {
  private cache = new Map<Key, Value>();

  constructor(private max = 10) {}

  has(key: Key) {
    return this.cache.has(key);
  }

  get(key: Key) {
    const item = this.cache.get(key);
    if (item) {
      // refresh key
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: Key, val: Value) {
    // refresh key
    if (this.cache.has(key)) this.cache.delete(key);
    // evict oldest
    else if (this.cache.size == this.max) this.cache.delete(this.first());
    this.cache.set(key, val);
  }

  first() {
    return this.cache.keys().next().value;
  }
}
