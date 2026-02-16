import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RemoteEntry } from './entry';
import { NxWelcome } from './nx-welcome';
import { remoteRoutes } from './entry.routes';
import { LeftGridComponent } from './common/leftGrid/leftGrid.component';
import { FormToolbarComponent } from './common/form-toolbar/form-toolbar.component';
import { GridAllModule } from '@syncfusion/ej2-angular-grids';
import { GeneralAppService } from './http/general-app.service';
import { SidebarModule } from '@syncfusion/ej2-angular-navigations';
import { AlertDialogComponent, AlertDialogModule } from '@org/ui';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { CheckBoxModule, ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { MultiColumnComboBoxModule } from '@syncfusion/ej2-angular-multicolumn-combobox';

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
    MultiColumnComboBoxModule,

   
  ],
  providers: [GeneralAppService],
})
export class RemoteEntryModule {}
