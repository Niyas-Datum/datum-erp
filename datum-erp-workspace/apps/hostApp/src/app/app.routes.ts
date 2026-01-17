import { Route } from '@angular/router';
import { AuthGuard } from '@org/http';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadChildren: () =>
      import('loginApp/Module').then((m) => m!.RemoteEntryModule),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('AuthApp/Module').then((m) => m?.RemoteEntryModule),
  },

 
  {
    path: '',
    loadChildren: () =>
      import('coreApp/Module').then((m) => m?.RemoteEntryModule),
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: 'auth' },
];
