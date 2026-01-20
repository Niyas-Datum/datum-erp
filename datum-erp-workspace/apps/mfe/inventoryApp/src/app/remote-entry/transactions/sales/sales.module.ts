import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SalesInvoiceComponent } from './sales-invoice/sales-invoice-component';
import { InvoiceHeader } from '../common/invoice-header/invoice-header';
import { salesRoutes } from './sales-routing.module';
import { ItemList } from '../common/item-list/item-list';
import { InvoiceFooter } from '../common/invoice-footer/invoice-footer';
import { SalesReturnComponent } from './sales-return/sales-return.component';
import { SalesOrderComponent } from './sales-order/sales-order-component';
import { SalesEnquiryComponent } from './sales-enquiry/sales-enquiry-component';
import { SalesProformaInvoiceComponent } from './sales-proforma-invoice/sales-proforma-invoice-component';
import { SalesDeliveryOutComponent } from './sales-delivery-out/sales-delivery-out-component';
import { SalesPackingListComponent } from './sales-packing-list/sales-packing-list-component';
import { SalesMaterialIssueComponent } from './sales-material-issue/sales-material-issue-component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(salesRoutes),
    InvoiceHeader,
    SalesInvoiceComponent,
    SalesReturnComponent,
    SalesOrderComponent,
    SalesEnquiryComponent,
    SalesProformaInvoiceComponent,
    SalesDeliveryOutComponent,
    SalesPackingListComponent,
    SalesMaterialIssueComponent,
    ItemList,
    InvoiceFooter,
  ]
})
export class SalesModule { }
