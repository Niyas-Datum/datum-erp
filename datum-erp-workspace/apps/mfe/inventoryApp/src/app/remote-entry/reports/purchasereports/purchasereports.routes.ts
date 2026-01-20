import { Route } from "@angular/router";
import { PurchaseReportsComponent } from "./purchasereports.component";
import { PurchaseRegisterComponent } from "./purchaseregister/purchaseregister.component";




export const purchasereportRoutes: Route[] = [
  {
    path: '',
    component: PurchaseReportsComponent,
    children: [
      {
        path: 'purchaseregister',
        component: PurchaseRegisterComponent
      }
    ]
  }
];
