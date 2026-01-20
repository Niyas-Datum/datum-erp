import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToastComponent, ToastModule } from '@syncfusion/ej2-angular-notifications';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastPayload, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true    ,
  template: `
      <ejs-toast #toast [position]="{ X: 'Right' }"></ejs-toast>

  `,
  imports: [ToastModule]
})

export class ToastHostComponent implements OnInit, OnDestroy {

  @ViewChild('toast', { static: true }) toast!: ToastComponent;
  private sub?: Subscription;

  constructor(private toastService: ToastService) {

  }

  ngOnInit() {
    
    this.sub = this.toastService.toasts$.subscribe((p: ToastPayload) => {
      const map = {
        info: { title: p.title ?? 'Info', content: p.content, cssClass: 'e-toast-info', icon: 'e-info toast-icons' },
        success: { title: p.title ?? 'Success', content: p.content, cssClass: 'e-toast-success', icon: 'e-success toast-icons' },
        warning: { title: p.title ?? 'Warning', content: p.content, cssClass: 'e-toast-warning', icon: 'e-warning toast-icons' },
        error: { title: p.title ?? 'Error', content: p.content, cssClass: 'e-toast-danger', icon: 'e-error toast-icons' },
      } as any;
      const toastMeta = map[p.type];
      if (this.toast) this.toast.show(toastMeta);
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}