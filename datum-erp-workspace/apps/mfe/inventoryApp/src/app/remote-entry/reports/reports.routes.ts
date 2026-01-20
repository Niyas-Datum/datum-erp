import { Route } from '@angular/router';

import { ReportsModuleComponent } from './reports.component';


export const repRoutes: Route[] = [
  {
    path: '',
    component: ReportsModuleComponent,


    // children: [
    //   {
    //     path: 'salesreports',
    //     loadChildren: () =>
    //       import('./salesreports/salesreports.module').then((m) => m.SalesReportsModule),
    //   },
      
    // ],
  },
];

