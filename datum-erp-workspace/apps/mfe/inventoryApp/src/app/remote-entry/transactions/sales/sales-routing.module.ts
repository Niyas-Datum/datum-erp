import { SalesInvoiceComponent } from './sales-invoice/sales-invoice-component';
import { SalesQuotationComponent } from './sales-quotation/sales-quotation.component';
import { SalesReturnComponent } from './sales-return/sales-return.component';
import { SalesOrderComponent } from './sales-order/sales-order-component';
import { SalesEnquiryComponent } from './sales-enquiry/sales-enquiry-component';
import { SalesProformaInvoiceComponent } from './sales-proforma-invoice/sales-proforma-invoice-component';
import { SalesDeliveryOutComponent } from './sales-delivery-out/sales-delivery-out-component';
import { SalesPackingListComponent } from './sales-packing-list/sales-packing-list-component';
import { SalesMaterialIssueComponent } from './sales-material-issue/sales-material-issue-component';
import { Route } from '@angular/router';
import { SalesMainComponent } from './sales-main-component';

export const salesRoutes: Route[] = [
  {
    path: '',
    component: SalesMainComponent,
    children: [
      { path: 'invoice', component: SalesInvoiceComponent },
      { path: 'return', component: SalesReturnComponent },
      { path: 'order', component: SalesOrderComponent },
      { path: 'enquiry', component: SalesEnquiryComponent },
      { path: 'proforma-invoice', component: SalesProformaInvoiceComponent },
      { path: 'delivery-out', component: SalesDeliveryOutComponent },
      { path: 'packing-list', component: SalesPackingListComponent },
      { path: 'material-issue', component: SalesMaterialIssueComponent },
      // { path: 'quotation', component: SalesQuotationComponent },
    ]
  }
];

