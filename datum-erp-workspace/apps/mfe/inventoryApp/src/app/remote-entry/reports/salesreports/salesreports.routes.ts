import { Route } from "@angular/router";
import { SalesReportsComponent } from "./salesreports.component";
import { SalesRegisterComponent } from "./salesregister/salesregister.component";



export const salesreportRoutes: Route[] = [
  {
    path: '',
    component: SalesReportsComponent,
    children: [
      {
        path: 'salesregister',
        component: SalesRegisterComponent
      }
    ]
  }
];
