import {
  ApplicationConfig,
  importProvidersFrom,
  // provideBrowserGlobalErrorListeners, // Removed: not available in Angular 19
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import {
  provideHttpClient,
  HTTP_INTERCEPTORS,
  withInterceptors,
} from '@angular/common/http';
import { authInterceptor, LoaderInterceptor } from '@org/http';
import { appRoutes } from './app.routes';
//import { itemFeatureKey, itemReducer } from '@org/shared-state';
import { ReactiveFormsModule } from '@angular/forms'; // ✅ Classic module-based import
import { DatePipe } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
  //   importProvidersFrom(ReactiveFormsModule), // ✅ Enables FormBuilder, FormGroup, etc.

  //   // provideBrowserGlobalErrorListeners(), // Removed: not available in Angular 19
  //   provideZoneChangeDetection({ eventCoalescing: true }),
  // //  provideRouter(appRoutes),
  // //  provideStore({ [itemFeatureKey]: itemReducer }, {}),
  //   provideEffects([]),
  //   provideStoreDevtools({ maxAge: 25, logOnly: false }),
    DatePipe,

    //  interceptor: AuthInterceptor
    provideHttpClient(withInterceptors([authInterceptor, LoaderInterceptor])),
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: AuthInterceptor,
    //   multi: true
    // },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: LoaderInterceptor,
    //   multi: true
    // }
  ],
};
