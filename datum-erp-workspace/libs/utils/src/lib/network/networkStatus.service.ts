import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
private online$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor(private zone: NgZone) {
    window.addEventListener('online', () => {
      this.zone.run(() => this.online$.next(true));
    });

    window.addEventListener('offline', () => {
      this.zone.run(() => this.online$.next(false));
    });
  }

  getNetworkStatus() {
    return this.online$.asObservable();
  }
  }

