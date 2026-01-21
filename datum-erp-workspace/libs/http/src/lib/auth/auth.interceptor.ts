import { inject, Injectable } from "@angular/core";
import { HttpInterceptor,HttpRequest,HttpHandler,HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable } from "rxjs";
import { LocalStorageService } from "@org/services";


export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const localStorageService = inject(LocalStorageService);
console.log('AuthInterceptor: Intercepting request', req);


        // Clone the request to add the new header.
        const token = localStorageService.getLocalStorageItem('access_token');
        console.log('AuthInterceptor: Intercepting request', token);
      
        const authReq = req.clone({
            setHeaders: {
    Authorization: `Bearer ${token}`  // No quotes around the token
  }
           // headers: req.headers.set('Authorization', `Bearer ${token}`)
        });

        // Pass the cloned request instead of the original request to the next handle.
        return next(authReq);

//   const authReq = req.clone({
//     setHeaders: {
//       Authorization: 'Bearer token-goes-here'
//     }
//   });
//   return next(authReq);
};
// export class AuthInterceptor implements HttpInterceptorFn {

//     protected localStorageService = inject(LocalStorageService);

//     constructor() {
//         console.log('AuthInterceptor: Initialized');
//     }

//     intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

//         console.log('AuthInterceptor: Intercepting request', req);
//         // Clone the request to add the new header.
//         const authReq = req.clone({
//             headers: req.headers.set('Authorization', 'Bearer YOUR_TOKEN_HERE')
//         });

//         // Pass the cloned request instead of the original request to the next handle.
//         return next.handle(authReq);
//     }
// }