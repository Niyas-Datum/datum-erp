import { Component } from '@angular/core';

@Component({
  selector: 'shared-ui-loader',
  standalone: true,
  template: `<div class="loader">Loading...</div>`,
  styles: [`
    .loader {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      // background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      z-index: 9999;
    }
  `]
})
export class LoaderComponent {}
