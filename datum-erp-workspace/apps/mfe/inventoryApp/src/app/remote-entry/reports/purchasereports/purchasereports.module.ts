import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DatePickerModule } from "@syncfusion/ej2-angular-calendars";
import { ButtonModule, CheckBoxModule, RadioButtonModule } from "@syncfusion/ej2-angular-buttons";
import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { DropDownListModule } from "@syncfusion/ej2-angular-dropdowns";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { GridModule } from "@syncfusion/ej2-angular-grids";
import { PurchaseReportsComponent } from "./purchasereports.component";
import { purchasereportRoutes } from "./purchasereports.routes";
import { PurchaseRegisterComponent } from "./purchaseregister/purchaseregister.component";

@NgModule({
  declarations: [
    PurchaseReportsComponent,     
    PurchaseRegisterComponent   
      
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(purchasereportRoutes) ,
    FormsModule,               
    ReactiveFormsModule,       
    DatePickerModule,          
    ButtonModule,
    RadioButtonModule,
    CheckBoxModule,
    TextBoxModule,
    DropDownListModule ,
    MultiColumnComboBoxModule,
    GridModule
  ]
})
export class PurchaseReportsModule {}
