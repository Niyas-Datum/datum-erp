import { Component } from '@angular/core';
  import { registerLicense } from '@syncfusion/ej2-base';
  import { APPLICATION_CONSTANT } from '@org/constants';
@Component({
  selector: 'app-coreApp-entry',
  standalone: false,
  template: `<main class="content"  > hello from coreApp Remote Entry Component!
    <router-outlet></router-outlet> </main>`,
})
export class RemoteEntry {


constructor() {
     console.log('coreApp Remote Entry Component loaded');
     registerLicense(APPLICATION_CONSTANT.syncfusion.licenseKey);

  }

}
