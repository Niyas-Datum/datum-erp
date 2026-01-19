import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RemoteEntry } from './entry';
import { NxWelcome } from './nx-welcome';
import { remoteRoutes } from './entry.routes';
import { AlertDialogComponent, AlertDialogModule, AppHeaderComponent} from '@org/ui'; // Adjust the import path as necessary
import { CoreService } from '../../services/core.service';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { NotificationComponent } from '../notification/notification.component';
import { NotificationlistComponent } from '../notificationlist/notificationlist.component';
import { NotificationrecieverComponent } from '../notificationreciever/notificationreciever.component';
import { NotificationdetailsComponent } from '../notificationdetails/notificationdetails.component';
@NgModule({
  declarations: [RemoteEntry, NxWelcome,],
  imports: [CommonModule , RouterModule.forChild(remoteRoutes), AppHeaderComponent, NotificationComponent,
    NotificationrecieverComponent,
   
    AlertDialogModule,
    NotificationlistComponent,NotificationdetailsComponent],
  providers: [CoreService],
})
export class RemoteEntryModule {}
