import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentVoucherComponent } from './payment-voucher/payment-voucher.component';
import { ReceiptVoucherComponent } from './receipt-voucher/receipt-voucher.component';
import { OpeningVoucherComponent } from './opening-voucher/opening-voucher.component';
import { CreditNoteComponent } from './credit-note/credit-note.component';
import { DebitNoteComponent } from './debit-note/debit-note.component';
import { JournalVoucherComponent } from './journal-voucher/journal-voucher.component';
import { ContraVoucherComponent } from './contra-voucher/contra-voucher.component';
import { PdcClearingVoucherComponent } from './pdc-clearing-voucher/pdc-clearing-voucher.component';
import { AccountReconciliationComponent } from './account-reconciliation/account-reconciliation.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'payment-voucher',
        component: PaymentVoucherComponent
      },
      {
        path: 'receipt-voucher',
        component: ReceiptVoucherComponent
      },
      {
        path: 'opening-voucher',
        component: OpeningVoucherComponent
      },
      {
        path: 'credit-note',
        component: CreditNoteComponent
      },
      {
        path: 'debit-note',
        component: DebitNoteComponent
      },
      {
        path: 'journal-voucher',
        component: JournalVoucherComponent
      },
      {
        path: 'contra-voucher',
        component: ContraVoucherComponent
      },
      {
        path: 'pdc-clearing-voucher',
        component: PdcClearingVoucherComponent
      },
      {
        path: 'account-reconciliation',
        component: AccountReconciliationComponent
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
