import { Component } from '@angular/core';

@Component({
  selector: 'app-coreApp-entry',
  standalone: false,
  template: `<main class="content"  > hello from coreApp Remote Entry Component!
    <router-outlet></router-outlet> </main>`,
})
export class RemoteEntry {
constructor() {
     console.log('coreApp Remote Entry Component loaded');

  }

}
