import { RouterModule, Routes } from "@angular/router";
import { ReportsModuleComponent } from "./reports.component";
import { GeneralRegisterComponent } from "./generalregister/generalregister.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule, RadioButtonModule } from "@syncfusion/ej2-angular-buttons";
import { DropDownListModule } from "@syncfusion/ej2-angular-dropdowns";
import { GridModule } from "@syncfusion/ej2-angular-grids";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { DatePickerModule } from "@syncfusion/ej2-angular-calendars";

const reportsRoutes: Routes = [
  {
    path: '', component: ReportsModuleComponent,
    children: [
      {
        path: 'generalregister', component: GeneralRegisterComponent,
      }, 
       {
        path: 'salesreports',
        loadChildren: () =>
          import('./salesreports/salesreports.module')
            .then(m => m.SalesReportsModule)
      }  ,
      {
        path: 'purchasereports',
        loadChildren: () =>
          import('./purchasereports/purchasereports.module')
            .then(m => m.PurchaseReportsModule)
      }    
     
      
    ]
  },
  
];

@NgModule({
  declarations: [ReportsModuleComponent, GeneralRegisterComponent],
  imports: [CommonModule,     
  ReactiveFormsModule
, RouterModule.forChild(reportsRoutes),

  FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    CheckBoxModule,          // ✅ Needed for <ejs-checkbox>
    ButtonModule,             // ✅ Needed for <button ejs-button>
    TextBoxModule,
    CheckBoxModule,
    MultiColumnComboBoxModule,
    DropDownListModule,    
    GridModule,    
    DatePickerModule,
    RadioButtonModule
],
  providers: [],
})

export class ReportsModule{}





