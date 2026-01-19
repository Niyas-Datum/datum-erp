import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TextBoxModule, NumericTextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule, RadioButton, RadioButtonModule } from "@syncfusion/ej2-angular-buttons";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';

import { GridModule } from "@syncfusion/ej2-angular-grids";
import { RegistersComponent } from "./registers-component";
import { FinanceRegisterComponent } from "./finance-register/finance-register.component";
import { ChequeRegisterComponent } from "./cheque-register/cheque-register.component";
import { CustomerComponent } from "./account/customer.component";

const costcenterRoutes: Routes = [
  {
    path: '', component: RegistersComponent,
    children: [
      {
        path: 'financeregister', component: FinanceRegisterComponent,
        

      },
      {
        path: 'chequeregister', component: ChequeRegisterComponent,
      },
      {
        path: 'customer', component: CustomerComponent,
      },
  

      
      
    
     
    ]
  },
  { path: '**', redirectTo: 'finance-register', pathMatch: "full" }
];

@NgModule({

  declarations: [RegistersComponent, FinanceRegisterComponent, ChequeRegisterComponent, CustomerComponent],

  imports: [CommonModule,     
  ReactiveFormsModule
, RouterModule.forChild(costcenterRoutes),

    FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    NumericTextBoxModule,   // ✅ Needed for <ejs-numerictextbox>
    CheckBoxModule,          // ✅ Needed for <ejs-checkbox>
    ButtonModule,             // ✅ Needed for <button ejs-button>
    MultiColumnComboBoxModule,
    DropDownListModule, 
    DatePickerModule,
    GridModule,
    MultiColumnComboBoxModule,
    ButtonModule,
    RadioButtonModule
],
  providers: [],
})
export class MastersModule {}