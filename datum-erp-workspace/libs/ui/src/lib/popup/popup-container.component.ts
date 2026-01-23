import { AfterViewInit, Component, inject, OnDestroy, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { tmepPopupService as PopupService} from './ptempopup.service';

@Component({
  selector: 'app-popup-container',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="popup-container"  (click)="close()" *ngIf="isVisible" >
    <div class="popup-overlay" (click)="$event.stopPropagation()" [class.open]="isOpen">
      <div class="popup-content" (click)="$event.stopPropagation()" [class.open]="isOpen">
        <ng-template #host ></ng-template>
      </div>
    </div>
  </div>`,
  
  styleUrls: ['./popup-container.component.scss']
  //   :host { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
  //   :host > * { pointer-events: auto; }
  // `]
})
export class PopupContainerComponent implements AfterViewInit, OnDestroy {
  isVisible = false;
    isOpen = false;
    inputs:any;

  @ViewChild('host', { read: ViewContainerRef, static: false }) host?: ViewContainerRef;

  popup= inject(PopupService)
  

  ngAfterViewInit() {
    this.popup.registerContainer(this);
  }

  open(component: Type<any>, inputs?: any) {
    this.inputs=inputs;
console.log('PopupContainerComponent: open called with inputs', inputs);
    this.isVisible = true;
      return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!this.host) return reject(new Error('Host not available'));
          const createdRef = this.host.createComponent(component);
          if (inputs) Object.assign(createdRef.instance, inputs);
          // show with animation
          this.isOpen = true;
          resolve(createdRef);
        } catch (err) {
          reject(err);
        }
      }, 0);
    });
    
    // // Schedule the component creation after the template is rendered (*ngIf completes)
    // setTimeout(() => {
    //   if (!this.host) {
    //     console.error('ViewContainerRef host not available');
    //     return;
    //   }
    //   try {
    //     const ref = this.host.createComponent(component);
    //     if (inputs) Object.assign(ref.instance, inputs);
    //   } catch (err) {
    //     console.error('Failed to create component:', err);
    //   }
    // }, 0);
  }

  close() {
        this.isVisible = false;
   this.isOpen = false;
    const delay = 220;
    setTimeout(() => {
      try { this.host?.clear(); } catch { /* ignore */ }
      this.isVisible = false;
    }, delay);
  }

  ngOnDestroy() {
    // unregister to avoid stale reference
    this.popup.registerContainer(undefined);
  }
}
