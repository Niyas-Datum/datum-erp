import { inject, Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '@org/services';

export const LoaderInterceptor : HttpInterceptorFn = (req, next) => {

console.log('[LoaderInterceptor] Intercepted request:', req.url);

//     this.loaderService.show();
//     return next.handle(req).pipe(
//       finalize(() => this.loaderService.hide())
//     );
  const loaderService = inject(LoaderService);
  loaderService.show();
  return next(req).pipe(
    finalize(() => loaderService.hide())
  );
};
//   constructor(private loaderService: LoaderService) {       console.log('[LoaderInterceptor] Intercepted request:');
// }

//   intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

//       console.log('[LoaderInterceptor] Intercepted request:', req.url);

//     this.loaderService.show();
//     return next.handle(req).pipe(
//       finalize(() => this.loaderService.hide())
//     );
//   }
