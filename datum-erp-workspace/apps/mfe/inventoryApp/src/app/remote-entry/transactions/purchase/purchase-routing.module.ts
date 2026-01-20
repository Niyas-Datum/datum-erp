import { Route } from '@angular/router';
import { PurchaseInvoiceComponent } from './purchase-invoice/purchase-invoice-component';
import { PurchaseReturnComponent } from './purchase-return/purchase-return-component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order-component';
import { PurchaseQuotationComponent } from './purchase-quotation/purchase-quotation-component';
import { PurchaseEnquiryComponent } from './purchase-enquiry/purchase-enquiry-component';
import { PurchaseInternationalComponent } from './purchase-international/purchase-international-component';
import { PurchaseMaterialRequestComponent } from './purchase-material-request/purchase-material-request-component';
import { PurchaseDeliveryInComponent } from './purchase-delivery-in/purchase-delivery-in-component';

export const purchaseRoutes: Route[] = [
  {
    path: '',
    children: [
      { path: 'purchase', component: PurchaseInvoiceComponent },
      { path: 'return', component: PurchaseReturnComponent },
      { path: 'order', component: PurchaseOrderComponent },
      { path: 'quotation', component: PurchaseQuotationComponent },
      { path: 'enquiry', component: PurchaseEnquiryComponent },
      { path: 'international', component: PurchaseInternationalComponent },
      { path: 'material-request', component: PurchaseMaterialRequestComponent },
      { path: 'delivery-in', component: PurchaseDeliveryInComponent }
    ]
  }
];

