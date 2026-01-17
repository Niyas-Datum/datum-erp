import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { App } from './app';
import { appRoutes } from './app.routes';
import { NxWelcome } from './nx-welcome';
import { AlertDialogModule, LoaderComponent, PopupContainerComponent, ToastHostComponent } from '@org/ui';
import { CommonModule } from '@angular/common';
import { ToastModule } from '@syncfusion/ej2-angular-notifications';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { TabTrackerService } from '@org/utils';

@NgModule({
  declarations: [App, NxWelcome],
  imports: [BrowserModule, RouterModule.forRoot(appRoutes),

    CommonModule, RouterModule,
     LoaderComponent, 
    AlertDialogModule, 
    PopupContainerComponent,
    ToastHostComponent, 
    ToastModule, 
    DialogModule
  ],
  providers: [provideBrowserGlobalErrorListeners(), TabTrackerService],
  bootstrap: [App],
})
export class AppModule {}
