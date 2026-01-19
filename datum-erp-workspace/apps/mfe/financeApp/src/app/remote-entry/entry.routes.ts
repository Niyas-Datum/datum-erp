import { Route } from '@angular/router';
import { RemoteEntry } from './entry';
import { PaymentVoucherComponent } from './voucher/payment-voucher/payment-voucher.component';


export const remoteRoutes: Route[] = [{ path: '', component: RemoteEntry,
    children: [
        {
            path: 'vouchers',
            loadChildren: () => import('./voucher/voucher.module').then(m => m.VoucherModule)
        },
        {
            path: 'voucher/paymentvoucher',
            component: PaymentVoucherComponent
        },
        {
            path: 'masters',
            loadChildren: () => import('./masters/masters-module').then(m => m.MastersModule)
        },
        {
            path: 'registers',
            loadChildren: () => import('./registers/registers-module').then(m => m.MastersModule)
        },
         {
            path: 'statements',
            loadChildren: () => import('./statements/statements.module').then(m => m.StatementsModule)
        }
    ]
 }];
