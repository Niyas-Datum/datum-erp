import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: false,
  template: '<h1>{{appname}}</h1><router-outlet></router-outlet>',
})
export class App {
  protected readonly appname = 'InventoryApp';
}
