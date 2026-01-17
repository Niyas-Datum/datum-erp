import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DialogComponent, DialogModule } from '@syncfusion/ej2-angular-popups';
import { AlertDialogModule } from './alert-dialog.module';
@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html',
  standalone: false, // Set standalone to false to allow declaration in NgModule

  styleUrls: ['./alert-dialog.component.scss'],
})
export class AlertDialogComponent implements OnInit {
  public visible = false;
  public title = 'Alert';
  public message = 'This is an alert message.';
  ngOnInit(): void {
    // License registration should be done in main.ts, not here
  }

  constructor() {
    console.log('AlertDialogComponent initialized');
  }

  @ViewChild('alertDialog') alertDialog!: DialogComponent;

  show(title: string, message: string) {

    console.log('AlertDialogComponent show called with:', title, message);
    this.title = title;
    this.message = message;
    this.visible = true;
  }

  close() {
    this.visible = false;
  }
}
