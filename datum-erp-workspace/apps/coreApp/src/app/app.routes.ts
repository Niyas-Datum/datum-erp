import { Route } from '@angular/router';
import { NxWelcome } from './remote-entry/nx-welcome';

export const appRoutes: Route[] = [
  {
    path: 'financialApp',
    loadChildren: () =>
      import('financeApp/Module').then((m) => m!.RemoteEntryModule),
  },
  {
    path: 'generalApp',
    loadChildren: () =>
      import('generalApp/Module').then((m) => m!.RemoteEntryModule),
  },
  {
    path: 'inventoryApp',
    loadChildren: () =>
      import('inventoryApp/Module').then((m) => m!.RemoteEntryModule),
  },
  {
    path: '',
    component: NxWelcome,
  },
  {
    path: '',
    loadChildren: () =>
      import('./remote-entry/entry-module').then((m) => m.RemoteEntryModule),
  },
];
