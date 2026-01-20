import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PurchaseInvoiceComponent } from './purchase-invoice/purchase-invoice-component';
import { PurchaseReturnComponent } from './purchase-return/purchase-return-component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order-component';
import { PurchaseQuotationComponent } from './purchase-quotation/purchase-quotation-component';
import { PurchaseEnquiryComponent } from './purchase-enquiry/purchase-enquiry-component';
import { PurchaseInternationalComponent } from './purchase-international/purchase-international-component';
import { PurchaseMaterialRequestComponent } from './purchase-material-request/purchase-material-request-component';
import { PurchaseDeliveryInComponent } from './purchase-delivery-in/purchase-delivery-in-component';

import { InvoiceHeader } from '../common/invoice-header/invoice-header';
import { purchaseRoutes } from './purchase-routing.module';
import { ItemList } from '../common/item-list/item-list';
import { InvoiceFooter } from '../common/invoice-footer/invoice-footer';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(purchaseRoutes),
    InvoiceHeader,
    PurchaseInvoiceComponent,
    PurchaseReturnComponent,
    PurchaseOrderComponent,
    PurchaseQuotationComponent,
    PurchaseEnquiryComponent,
    PurchaseInternationalComponent,
    PurchaseMaterialRequestComponent,
    PurchaseDeliveryInComponent,
    ItemList,
    InvoiceFooter,
  ]
})
export class PurchaseModule { }

