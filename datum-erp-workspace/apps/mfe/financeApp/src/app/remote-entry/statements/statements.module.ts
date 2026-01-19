import { Route, RouterModule, Routes } from "@angular/router";
import { StatementsComponent } from "./statements.component";
import { AccountStatementComponent } from "./accountstatement/accountstatement.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule, RadioButtonModule } from "@syncfusion/ej2-angular-buttons";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { DropDownListModule } from "@syncfusion/ej2-angular-dropdowns";
import { DatePickerModule } from "@syncfusion/ej2-angular-calendars";
import { GridModule } from "@syncfusion/ej2-angular-grids";
import { DaybookComponent } from "./daybook/daybook.component";
import { BillwiseStatementComponent } from "./billwisestatement/billwisestatement.component";

const statementsRoutes: Routes = [
  {
    path: '', component: StatementsComponent,
    children: [
      {
        path: 'accountstatement', component: AccountStatementComponent,
      },
      {
        path: 'daybook', component: DaybookComponent,
      },
      {
        path: 'billwisestatement', component: BillwiseStatementComponent,
      }

    ]
  },

];

@NgModule({
  declarations: [
    StatementsComponent,
    AccountStatementComponent,
    DaybookComponent,
    BillwiseStatementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RadioButtonModule,
    RouterModule.forChild(statementsRoutes),

    TextBoxModule,
    CheckBoxModule,
    ButtonModule,
    MultiColumnComboBoxModule,
    DropDownListModule,
    DatePickerModule,
    GridModule
  ],
})
export class StatementsModule { }
