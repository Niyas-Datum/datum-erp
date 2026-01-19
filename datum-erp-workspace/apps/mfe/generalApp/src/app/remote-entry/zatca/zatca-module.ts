import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ZatcaComponent } from "./zatca-component";

const zatcaRoutes = [
  {
    path: '', component: ZatcaComponent,
    children: [
    //   {
    //     path: 'cost-centre',
    //     loadChildren: () => import('./cost-centre/cost-centre-routing.module').then(m => m.CostCentreRoutingModule)
    //   }
    ]
  }
];

@NgModule({
  declarations: [ZatcaComponent,],
  imports: [CommonModule, RouterModule.forChild(zatcaRoutes)],
  providers: [],
})
export class ZatcaModule {}