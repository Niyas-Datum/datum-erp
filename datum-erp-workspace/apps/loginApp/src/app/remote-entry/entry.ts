import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-loginApp-entry',
  standalone: true,
  imports: [RouterModule],

  template: ` 
 hello from loginApp Remote Entry Component!
 `,
  
})
export class RemoteEntry {

  constructor() {
     console.log('loginApp Remote Entry Component loaded');

  }
  protected title = 'loginApp -tes';
}
