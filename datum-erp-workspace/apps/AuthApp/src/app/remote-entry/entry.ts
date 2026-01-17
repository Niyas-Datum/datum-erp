import { Component } from '@angular/core';

@Component({
  selector: 'app-AuthApp-entry',
  standalone: false,
 
  template: `
  <app-base-header></app-base-header>
  <main class="content">
    <router-outlet></router-outlet> </main>`,
})
export class RemoteEntry {}
