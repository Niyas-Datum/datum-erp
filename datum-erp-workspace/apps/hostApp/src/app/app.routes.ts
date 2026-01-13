import { NxWelcome } from './nx-welcome';
import { Route } from '@angular/router';
import { AuthGuard } from '@org/http';

export const appRoutes: Route[] = [
  {
    path: 'sss',
    loadChildren: () =>
      import('coreApp/Module').then((m) => m!.RemoteEntryModule), canActivate: [AuthGuard]
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('loginApp/Module').then((m) => m!.RemoteEntryModule),
  },
  {
    path: '',
    component: NxWelcome,
  },
];
