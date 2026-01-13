import { Route } from '@angular/router';
import { RemoteEntry } from './entry';

export const remoteRoutes: Route[] = [  {
    path: 'a',
    loadChildren: () =>
      import('generalApp/Module').then((m) => m!.RemoteEntryModule),
  },
    {
    path: 'b',
    loadChildren: () =>
      import('inventoryApp/Module').then((m) => m!.RemoteEntryModule),
  },
   {
    path: 'c',
    loadChildren: () =>
      import('financeApp/Module').then((m) => m!.RemoteEntryModule),
  },
    { path: '', component: RemoteEntry }];
