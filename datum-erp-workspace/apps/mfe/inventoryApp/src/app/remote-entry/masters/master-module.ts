import { CommonModule } from "@angular/common";
import { MasterModuleComponent } from "./master-component";
import { WarehouseComponent } from "./warehouse/warehouse-compnent";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { TextBoxModule } from "@syncfusion/ej2-angular-inputs";
import { ButtonModule, CheckBoxModule } from "@syncfusion/ej2-angular-buttons";
import { LocationTypeComponent } from "./locationType/locationType-component";
import { UnitmasterComponent } from "./unitMaster/unitmaster-component";
import { CategoryTypeComponent } from "./categoryType/categoryType-component";
import { AreaMasterComponent } from "./areamaster/areamaster-component";
import { MultiColumnComboBoxModule } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { DropDownListModule } from "@syncfusion/ej2-angular-dropdowns";
import { TaxTypeComponent } from "./taxType/taxType.component";
import { SizeMasterComponent } from "./sizemaster/sizemaster.component";
import { PriceCategoryComponent } from "./pricecategory/pricecategory.component";
import { ItemMasterComponent } from "./itemMaster/itemMaster.component";
import { GridModule, FilterService, SortService, PageService, EditService } from "@syncfusion/ej2-angular-grids";
import { TabModule } from "@syncfusion/ej2-angular-navigations";
import { MultiColumnComboBoxComponent } from "@org/ui";
import { CategoryComponent } from "./category/category.component";
import { DatePickerModule } from "@syncfusion/ej2-angular-calendars";

const masterRoutes: Routes = [
  {
    path: '', component: MasterModuleComponent,
    children: [
      {
        path: 'warehouse', component: WarehouseComponent,
      },
      {
        path: 'locationType', component: LocationTypeComponent,
      },
      {
        path: 'unitmaster', component: UnitmasterComponent,
      },
      {
        path: 'categoryType', component: CategoryTypeComponent
      },
       { path: 'areamaster', component: AreaMasterComponent,
      },
      { path: '', redirectTo: 'warehouse', pathMatch: "full" },
      {
        path: 'taxtype', component: TaxTypeComponent
      },
      {
        path: 'sizemaster', component: SizeMasterComponent
      },
      {
        path: 'priceCategory', component: PriceCategoryComponent
      },
      {
        path: 'itemmaster', component: ItemMasterComponent
      },
      {
        path: 'category', component: CategoryComponent
      },
    ]
  },
  { path: '**', redirectTo: 'warehouse', pathMatch: "full" }
];

@NgModule({
  declarations: [MasterModuleComponent, WarehouseComponent, AreaMasterComponent,CategoryTypeComponent,CategoryComponent,
    UnitmasterComponent,LocationTypeComponent,TaxTypeComponent,SizeMasterComponent,PriceCategoryComponent,ItemMasterComponent],
  imports: [CommonModule,     
  ReactiveFormsModule
, RouterModule.forChild(masterRoutes),

  FormsModule,             // ✅ Needed for ControlValueAccessor
    ReactiveFormsModule,     // ✅ Needed for Reactive Forms
    TextBoxModule,           // ✅ Needed for <ejs-textbox>
    CheckBoxModule,          // ✅ Needed for <ejs-checkbox>
    ButtonModule,             // ✅ Needed for <button ejs-button>
    TextBoxModule,
    CheckBoxModule,
    MultiColumnComboBoxModule,
    DropDownListModule,
    TabModule,
    GridModule,
    MultiColumnComboBoxComponent,  // ✅ Standalone component from @org/ui
    DatePickerModule
],
  providers: [],
})
export class MasterModule {}