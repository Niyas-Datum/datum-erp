import { Injectable } from "@angular/core";
@Injectable({ providedIn: 'root' })
export class CacheStorageService {
  private cache = new Map<string, any>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const raw = localStorage.getItem('appCache');
    if (raw) {
      const obj = JSON.parse(raw);
      Object.entries(obj).forEach(([k, v]) => this.cache.set(k, v));
    }
  }

  private persist() {
    localStorage.setItem(
      'appCache',
      JSON.stringify(Object.fromEntries(this.cache))
    );
  }

  set(key: string, data: any) {
    this.cache.set(key, data);
    this.persist();
  }

  get(key: string) {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  size(): number {
    return this.cache.size;
  }

  clear(key: string) {
    this.cache.delete(key);
    this.persist();
  }

  reset(): void {
    this.cache.clear();
    localStorage.removeItem('appCache');
  }
}
/// Usage in InventoryAppService
/// inject CacheService and use it to cache API responses. For example:
// getProducts(): Observable<any[]> {
//   const key = 'products';

//   if (this.cache.has(key)) {
//     return of(this.cache.get(key)); //  instant
//   }

//   return this.http.get<any[]>('/api/products').pipe(
//     tap(data => this.cache.set(key, data))
//   );
// }
