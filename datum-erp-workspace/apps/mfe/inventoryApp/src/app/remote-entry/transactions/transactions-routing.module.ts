
import { Route } from '@angular/router';
import { TransactionsComponent } from './transactions-component';

export const transactionsRoutes: Route[] = [
  {
    path: '',    component: TransactionsComponent,
    children: [
      {
          path: 'sales',loadChildren: () => import('./sales/sales-routing.module').then((m) => m.salesRoutes),
      },
      {
          path: 'purchase',loadChildren: () => import('./purchase/purchase-routing.module').then((m) => m.purchaseRoutes),
      }
    ]
  }
];

