import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentVoucherComponent } from './payment-voucher/payment-voucher.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'payment-voucher',
        component: PaymentVoucherComponent
      },
      {
        path: '',
        redirectTo: 'payment-voucher',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VoucherRoutingModule { }
