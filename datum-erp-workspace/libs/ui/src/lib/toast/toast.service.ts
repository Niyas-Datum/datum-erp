import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastPayload = { type: 'info'|'success'|'warning'|'error', title?: string, content?: string };

@Injectable({ providedIn: 'root' })
export class ToastService {
  private queue$ = new Subject<ToastPayload>();
  public toasts$ = this.queue$.asObservable();

  show(payload: ToastPayload) {
    this.queue$.next(payload);
  }

  info(content: string, title = 'Information') { this.show({ type: 'info', title, content }); }
  success(content: string, title = 'Success') { this.show({ type: 'success', title, content }); }
  warning(content: string, title = 'Warning') { this.show({ type: 'warning', title, content }); }
  error(content: string, title = 'Error') { this.show({ type: 'error', title, content }); }
}