import { inject, Injectable, signal } from "@angular/core";
import { BaseService } from "./base.service";
import { CacheStorageService } from "./storage/cachestorage.service";
import { defer, finalize, Observable, of, tap } from "rxjs";

@Injectable({ providedIn: 'root' })
export class BackgroundHttpService {
   private inFlightCount = signal(0);
   public isLoading = signal(false);
    baseService= inject( BaseService);
  cache = inject(CacheStorageService);

   /// This service handles HTTP requests with in-flight tracking and optional UI loading toggle.
   private startRequest(showLoading: boolean = true) {
     this.inFlightCount.update((count) => count + 1);
     if (showLoading) {
       this.isLoading.set(true);
     }
   }

   /// When a request completes, decrement in-flight count and set UI state only for non-background loads.
   private endRequest(showLoading: boolean = true) {
     this.inFlightCount.update((count) => Math.max(0, count - 1));
     if (showLoading && this.inFlightCount() <= 0) {
       this.isLoading.set(false);
     }
   }

   /// The fetch method wraps BaseService HTTP call with background logic.
   fetch<T>(endpoint: string, key: string | null, background: boolean = false): Observable<T> {
     if (key && this.cache.has(key)) {
       return of(this.cache.get(key)); // instant
     }

     const showLoading = !background;

     return defer(() => {
       this.startRequest(showLoading);
       return this.baseService.get<T>(endpoint).pipe(
         tap(data => {
           if (key) {
             this.cache.set(key, data);
           }
         }),
         finalize(() => this.endRequest(showLoading))
       );
     });
   }


}

