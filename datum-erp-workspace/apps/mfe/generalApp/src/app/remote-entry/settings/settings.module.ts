import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule, RadioButtonModule } from "@syncfusion/ej2-angular-buttons";
import { ComboBoxModule, DropDownListModule } from "@syncfusion/ej2-angular-dropdowns";
import { EditService, FilterService, GridModule, GroupService, PageService, SortService, ToolbarService, VirtualScrollService } from "@syncfusion/ej2-angular-grids";
import { SettingsComponent } from "./settings.component";
import { SettingsComponentMain } from "./settings/settings-component";
import { FormlabelsettingsComponent } from "./Formlabelsettings/formlabelsettings.component";
import { SubMastersComponent } from "./submasters/submasters-component";
import { FormGridSettingsComponent } from "./formgridsettings/formgridsettings.component";


const companyRoutes: Routes = [
  {
    path: '', component: SettingsComponent,
    children: [
      {
        path: 'settings', component: SettingsComponentMain,
      },
      {
        path: 'formlabelsettings', component: FormlabelsettingsComponent,
      },
      {
        path: 'formgridsettings', component: FormGridSettingsComponent,
      },
      { 
        path: 'submasters', component: SubMastersComponent 
      },
      { 
        path: '**', redirectTo: 'settings', pathMatch: "full" 
      },
    ]
  },
  //{ path: '**', redirectTo: 'department', pathMatch: "full" }
];

@NgModule({
  declarations: [
   SettingsComponent,
   SettingsComponentMain,
   FormlabelsettingsComponent,
   FormGridSettingsComponent,
   SubMastersComponent
  ],
  imports: [CommonModule,     
  ReactiveFormsModule
, RouterModule.forChild(companyRoutes),

    FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    ButtonModule,             // ✅ Needed for <button ejs-button>
    DropDownListModule,
    ComboBoxModule,          // ✅ Needed for <ejs-combobox>
    CheckBoxModule,
    RadioButtonModule,
    GridModule,             // ✅ Needed for <ejs-grid>
],
  providers: [ SortService, GroupService, PageService, FilterService, VirtualScrollService, EditService, ToolbarService],
})

export class SettingsModule {}