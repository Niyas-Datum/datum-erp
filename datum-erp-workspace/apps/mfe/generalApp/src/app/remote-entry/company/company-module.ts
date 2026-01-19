import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { CompanyComponent } from "./company-component";
import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule } from "@syncfusion/ej2-angular-buttons";
import { DropDownListModule, MultiSelectModule } from "@syncfusion/ej2-angular-dropdowns";
import { DepartmentComponent } from "./department/department-component";
import { BranchComponent } from "./branch/branch-component";
import { DesignationComponent } from "./designation/designation.component";
import { ListViewModule } from '@syncfusion/ej2-angular-lists'
import { GridModule } from "@syncfusion/ej2-angular-grids";

const companyRoutes: Routes = [
  {
    path: '', component: CompanyComponent,
    children: [
      {
        path: 'department', component: DepartmentComponent,
      },
      {
        path: 'branch', component: BranchComponent,
      },
      {
        path: 'designation', component: DesignationComponent,
      },
       { path: '**', redirectTo: 'department', pathMatch: "full" }
       ,
    ]
  },
  //{ path: '**', redirectTo: 'department', pathMatch: "full" }
];


@NgModule({
  declarations: [
    CompanyComponent,
    DepartmentComponent,
    BranchComponent,
    DesignationComponent,
    
  ],
  imports: [CommonModule,     
  ReactiveFormsModule
, RouterModule.forChild(companyRoutes),

    FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    ButtonModule,             // ✅ Needed for <button ejs-button>
    DropDownListModule, 
    ListViewModule,
    GridModule
],
schemas: [CUSTOM_ELEMENTS_SCHEMA], 
  providers: [],
})
export class CompanyModule {}