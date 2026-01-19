import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule, RadioButtonModule } from "@syncfusion/ej2-angular-buttons";
import { ComboBoxModule, DropDownListModule, MultiSelectModule } from "@syncfusion/ej2-angular-dropdowns";
import { EditService, FilterService, GridModule, GroupService, PageService, SortService, ToolbarService, VirtualScrollService } from "@syncfusion/ej2-angular-grids";
import { TabModule } from "@syncfusion/ej2-angular-navigations";

import { CustomerSupplierComponent } from "./customer-supplier/customer-supplier";
import { CustomerSupplierComponentMain } from "./customer-supplier.component";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";



const companyRoutes: Routes = [
  {
    path: '', component: CustomerSupplierComponentMain,
    children: [
      {
        path: 'customer-supplier', component: CustomerSupplierComponent,
      },
      
       { path: '**', redirectTo: 'customer-supplier', pathMatch: "full" }
       ,
    ]
  },
  //{ path: '**', redirectTo: 'department', pathMatch: "full" }
];

@NgModule({
  declarations: [
   CustomerSupplierComponent,
   CustomerSupplierComponentMain,
  ],
  imports: [CommonModule,     
  ReactiveFormsModule
, RouterModule.forChild(companyRoutes),

    FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    ButtonModule,             // ✅ Needed for <button ejs-button>
    DropDownListModule,
    MultiSelectModule,
    ComboBoxModule,          // ✅ Needed for <ejs-combobox>
    CheckBoxModule,
    RadioButtonModule,
    GridModule,             // ✅ Needed for <ejs-grid>
    TabModule,  
    DropDownListModule,
    MultiColumnComboBoxModule,
    
               // ✅ Needed for <ejs-tab>
],
  providers: [ SortService, GroupService, PageService, FilterService, VirtualScrollService, EditService, ToolbarService],
})
export class CustomerSupplierModule {}