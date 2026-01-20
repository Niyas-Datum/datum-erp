import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { salesreportRoutes } from "./salesreports.routes";
import { SalesReportsComponent } from "./salesreports.component";
import { SalesRegisterComponent } from "./salesregister/salesregister.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DatePickerModule } from "@syncfusion/ej2-angular-calendars";
import { ButtonModule, CheckBoxModule, RadioButtonModule } from "@syncfusion/ej2-angular-buttons";
import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { DropDownListModule } from "@syncfusion/ej2-angular-dropdowns";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { GridModule } from "@syncfusion/ej2-angular-grids";

@NgModule({
  declarations: [
    SalesReportsComponent,     
    SalesRegisterComponent   
      
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(salesreportRoutes) ,
    FormsModule,               // ✅ Needed for form controls
    ReactiveFormsModule,       // ✅ Needed for formControlName
    DatePickerModule,          // ✅ REQUIRED for <ejs-datepicker>
    ButtonModule,
    RadioButtonModule,
    CheckBoxModule,
    TextBoxModule,
    DropDownListModule ,
    MultiColumnComboBoxModule,
    GridModule
  ]
})
export class SalesReportsModule {}
