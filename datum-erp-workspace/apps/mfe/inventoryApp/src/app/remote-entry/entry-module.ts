import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RemoteEntry } from './entry';

import { remoteRoutes } from './entry.routes';
import { LeftGridComponent } from './common/leftGrid/leftGrid.component';
import { FormToolbarComponent } from './common/form-toolbar/form-toolbar.component';
import { TransactionsComponent } from './transactions/transactions-component';
import { InvoiceHeader } from './transactions/common/invoice-header/invoice-header';
import { ItemList } from './transactions/common/item-list/item-list';
import { InvoiceFooter } from './transactions/common/invoice-footer/invoice-footer';
import { AdditionalDetailsComponent } from './transactions/common/additional-details/additional-details.component';
import { TransactionsModule } from './transactions/transactions.module';
import { SalesReturnComponent } from './transactions/sales/sales-return/sales-return.component';
import { GridAllModule, GridModule } from '@syncfusion/ej2-angular-grids';
import { SidebarModule } from '@syncfusion/ej2-angular-navigations';
import { AlertDialogComponent, AlertDialogModule } from '@org/ui';
import { InventoryAppService } from './http/inventory-app.service';
import { ReportsModule } from './reports/reports.module';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';

@NgModule({
  declarations: [RemoteEntry], 

  imports: [CommonModule, FormToolbarComponent,RouterModule.forChild(remoteRoutes),InvoiceHeader,ItemList,InvoiceFooter,AdditionalDetailsComponent,TransactionsComponent,TransactionsModule
    ,SalesReturnComponent, GridAllModule,
    LeftGridComponent,    
    SidebarModule,
    AlertDialogModule,
    ReportsModule,
    GridModule,
        DatePickerModule

   ],

  providers: [InventoryAppService],

})
export class RemoteEntryModule {}
