import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CostCategoryComponent } from "./costcategory/costcategory-component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { GridAllModule, GridModule } from "@syncfusion/ej2-angular-grids";
import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule } from "@syncfusion/ej2-angular-buttons";
import { CostCenterMainComponent } from "./costcenterMain-component";
import { CostCenterComponent } from "./costcenter/costcenter-component";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { TabModule } from "@syncfusion/ej2-angular-navigations";
import { ComboBoxModule } from "@syncfusion/ej2-angular-dropdowns";

const costcenterRoutes: Routes = [
  {
    path: '', component: CostCenterMainComponent,
    children: [
      {
        path: 'category', component: CostCategoryComponent,
      },
      {
        path: '', component: CostCenterComponent,
      },
      { path: '**', redirectTo: 'category', pathMatch: "full" }
    ]
  },
  { path: '**', redirectTo: 'category', pathMatch: "full" }
];

@NgModule({
  declarations: [CostCenterMainComponent, CostCategoryComponent,CostCenterComponent],
  imports: [CommonModule,     
  ReactiveFormsModule
, RouterModule.forChild(costcenterRoutes),

    FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    CheckBoxModule,          // ✅ Needed for <ejs-checkbox>
    ButtonModule,             // ✅ Needed for <button ejs-button>
    MultiColumnComboBoxModule ,
    DropDownListModule, 
    DatePickerModule,
    TabModule,
    DropDownListModule,
    ComboBoxModule,
],
  providers: [],
})
export class CostCenterMainModule {}