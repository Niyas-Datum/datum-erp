import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";



@Component({
  selector: 'app-sales',
  templateUrl: './sales-main-component.html',
  styles: [''],
  standalone: true,
  imports: [
   CommonModule,
    RouterModule,


  //  ReactiveFormsModule,
  //  ItemList,
  //  InvoiceHeader,
  //  InvoiceFooter,
   // AdditionalDetailsComponent,

  ],
})
export class SalesMainComponent {



}