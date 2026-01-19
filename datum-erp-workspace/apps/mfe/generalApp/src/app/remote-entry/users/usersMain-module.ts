import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MaskedTextBoxModule, TextBoxModule, UploaderModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule } from "@syncfusion/ej2-angular-buttons";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { ComboBoxModule, DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { UsersMainComponent } from "./usersMain-component";
import { UserComponent } from "./user/user-component";
import { EditService, FilterService, GridModule, GroupService, PageService, SortService, ToolbarService, VirtualScrollService } from "@syncfusion/ej2-angular-grids";
import { UserrolepopupComponent } from "./userpopup/userrole-popup.component";
import { DialogModule } from "@syncfusion/ej2-angular-popups";
import { RoleComponent } from "./roles/role-component";
import { PageMenuComponent } from "./pagemenu/pagemenu-component";
import { TreeViewModule } from "@syncfusion/ej2-angular-navigations";
import { PageMenuPopUpComponent } from "./pagemenupop/pagemenupopup-component";

const costcenterRoutes: Routes = [
  {
    path: '', component: UsersMainComponent,
    children: [
      {
        path: '', component: UserComponent,
      },
      {
        path: 'role', component: RoleComponent,
      },
      {
        path: 'pagemenu', component: PageMenuComponent,
      },
     
      { path: '**', redirectTo: 'user', pathMatch: "full" }
    ]
  },
  { path: '**', redirectTo: 'user', pathMatch: "full" }
];

@NgModule({
  declarations: [UsersMainComponent, UserComponent, UserrolepopupComponent, RoleComponent, PageMenuComponent, PageMenuPopUpComponent],
  imports: [CommonModule,     
  ReactiveFormsModule
, RouterModule.forChild(costcenterRoutes),

    FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    CheckBoxModule,          // ✅ Needed for <ejs-checkbox>
    MultiColumnComboBoxModule,
    DropDownListModule, 
    DatePickerModule,
    GridModule,
    ComboBoxModule,
    UploaderModule,
    DialogModule,
    ButtonModule,
    DialogModule,
    TreeViewModule,
    MaskedTextBoxModule
],
schemas: [CUSTOM_ELEMENTS_SCHEMA] ,
providers: [ SortService, GroupService, PageService, FilterService, VirtualScrollService, EditService, ToolbarService],
})
export class UsersMainModule {}