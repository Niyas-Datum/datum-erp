import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RemoteEntry } from './entry';
import { NxWelcome } from './nx-welcome';
import { remoteRoutes } from './entry.routes';
import { LeftGridComponent } from './common/leftGrid/leftGrid.component';
import { FormToolbarComponent } from './common/form-toolbar/form-toolbar.component';
import { SidebarModule } from '@syncfusion/ej2-angular-navigations';
import { AlertDialogModule } from '@org/ui';
import { GridAllModule } from '@syncfusion/ej2-angular-grids';
import { FinanceAppService } from './http/finance-app.service';

@NgModule({
  declarations: [RemoteEntry, NxWelcome],
  imports: [
    CommonModule,
    RouterModule.forChild(remoteRoutes),
    GridAllModule,
    LeftGridComponent,
    FormToolbarComponent,
    SidebarModule,
    AlertDialogModule,
  ],
  providers: [FinanceAppService],
})
export class RemoteEntryModule {}
