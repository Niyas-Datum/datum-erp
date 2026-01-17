import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { AlertDialogComponent } from './alert-dialog.component';

@NgModule({
  declarations: [AlertDialogComponent],
  imports: [CommonModule, DialogModule],
  exports: [AlertDialogComponent]
})
export class AlertDialogModule {}
