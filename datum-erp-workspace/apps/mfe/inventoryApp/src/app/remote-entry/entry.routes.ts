import { Route } from '@angular/router';
import { RemoteEntry } from './entry';


export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntry,


    children: [
      {
        path: 'ts',
        loadChildren: () =>
          import('./transactions/transactions.module').then(
            (m) => m!.TransactionsModule
          ),
      },
      {
        path: 'masters',
        loadChildren: () =>
          import('./masters/master-module').then((m) => m.MasterModule),
      },
        {
        path: 'reports',
        loadChildren: () =>
          import('./reports/reports.module').then((m) => m.ReportsModule),
      },
    ],
  },
];

