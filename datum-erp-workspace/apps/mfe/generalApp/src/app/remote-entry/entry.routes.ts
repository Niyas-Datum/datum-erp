import { Route } from '@angular/router';
import { RemoteEntry } from './entry';

export const remoteRoutes: Route[] = [{ path: '', component: RemoteEntry ,
    children: [
       
        {
            path: 'zatca',
            loadChildren: () => import('./zatca/zatca-module').then(m => m.ZatcaModule)
        },
         {
            path: 'costcenter',
            loadChildren: () => import('./costcenter/costcenterMain-module').then(m => m.CostCenterMainModule)

        },
        {
            path: 'company',
            loadChildren: () => import('./company/company-module').then(m => m.CompanyModule)

        },
        {
            path: 'settings',
            loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)

        },
        {
            path: 'customer-supplier',
            loadChildren: () => import('./customer-supplier/customer-supplier.module').then(m => m.CustomerSupplierModule)
        },
        {
            path: 'user',
            loadChildren: () => import('./users/usersMain-module').then(m => m.UsersMainModule)
        },

    ]
}];

