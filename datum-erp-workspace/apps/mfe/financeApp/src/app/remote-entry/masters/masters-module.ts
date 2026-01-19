import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TextBoxModule, NumericTextBoxModule, MaskedTextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule } from "@syncfusion/ej2-angular-buttons";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { MastersComponent } from "./masters-component";
import { CurrencyComponent } from "./currency/currency-component";
import { FinancialYearComponent } from "./financialYear/financialYear-component";
import { GridModule } from "@syncfusion/ej2-angular-grids";
import { ContextMenuModule, TreeViewModule } from "@syncfusion/ej2-angular-navigations";
import { CardComponent } from "./card-master/cardmaster-component";
import { AccountSortorderComponent } from "./account-sortorder/account-sortorder";
import { BranchAccounts } from "./branch-accounts/branch-account";
import { AccountConfigurationComponent } from "./account-configuartion/Account-configuration";
import { AccountsListComponent } from "./accounts-list/accounts-list";
import { VouchersComponent } from "./vouchers/vouchers-component";
import { ChartOfAccountComponent } from "./chart-of-account/chart-of-account.component";
import { LedgerComponent } from "./ledger/ledger-component";
import { Popup } from "./popup/popup.component";
import { DialogModule } from "@syncfusion/ej2-angular-popups";

const costcenterRoutes: Routes = [
  {
    path: '', component: MastersComponent,
    children: [
      {
        path: 'currency', component: CurrencyComponent,
      },
      {
        path: 'financeYear', component: FinancialYearComponent,
      },
      {path :'cardmaster', component:CardComponent},
      {path :'accountsortorder', component:AccountSortorderComponent},
      {path :'branchaccounts', component:BranchAccounts},
      {path :'accountconfiguration', component:AccountConfigurationComponent},
      {path :'accountslist', component:AccountsListComponent},
      {path :'ledgers', component:LedgerComponent},

      {path:'vouchers', component:VouchersComponent},

      {path:'chartofaccounts', component:ChartOfAccountComponent},
      
      { path: '**', redirectTo: 'currency', pathMatch: "full" },
     
    ]
  },
  { path: '**', redirectTo: 'currency', pathMatch: "full" }
];

@NgModule({

  declarations: [MastersComponent, CurrencyComponent,
     FinancialYearComponent, CardComponent, AccountSortorderComponent,
      BranchAccounts,
     AccountConfigurationComponent, AccountsListComponent, VouchersComponent, 
     ChartOfAccountComponent, LedgerComponent,Popup],

  imports: [CommonModule,     
  ReactiveFormsModule,DialogModule, ContextMenuModule
 
, RouterModule.forChild(costcenterRoutes),

    FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    NumericTextBoxModule,   // ✅ Needed for <ejs-numerictextbox>
    MaskedTextBoxModule,    // ✅ Needed for <ejs-maskedtextbox>
    CheckBoxModule,          // ✅ Needed for <ejs-checkbox>
    ButtonModule,             // ✅ Needed for <button ejs-button>
    MultiColumnComboBoxModule,
    DropDownListModule, 
    DatePickerModule,
    GridModule,
    MultiColumnComboBoxModule,
    ButtonModule,
    TreeViewModule
],
  providers: [],
})
export class MastersModule {}