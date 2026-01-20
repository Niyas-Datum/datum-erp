import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { BaseComponent } from '@org/architecture';
import { filter, firstValueFrom, take } from 'rxjs';
import { InventoryAppService } from '../../http/inventory-app.service';
import { EndpointConstant } from '@org/constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Category,
  CountryOfOrigin,
  ItemBrand,
  ItemColor,
  ItemHistory,
  ItemMaster,
  parentItem,
  SelectedCategory,
  TaxType,
  UnitData,
  Account,
  Quality,
} from '../model/pItemMasters.model';
import { MultiColumnComboBoxComponent } from '@syncfusion/ej2-angular-multicolumn-combobox';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseService, LocalStorageService } from '@org/services';
import { BranchDto } from '@org/models';
import { GridComponent } from '@syncfusion/ej2-angular-grids';

@Component({
  selector: 'app-itemmaster',
  standalone: false,
  templateUrl: './itemMaster.component.html',
  styleUrls: ['./itemMaster.component.scss'],
})
export class ItemMasterComponent extends BaseComponent implements OnInit {
  @ViewChild('multicolumn')
  public multicomboBoxObj?: MultiColumnComboBoxComponent;
  @ViewChild('unitDetailsGrid', { static: false })
  unitDetailsGrid!: GridComponent;

  private httpService = inject(InventoryAppService);

  itemMasterForm = this.formUtil.thisForm;

  private destroyRef = inject(DestroyRef);

  private localstorageService = inject(LocalStorageService);
  private baseService = inject(BaseService);

  isLoading = false;
  isView = true;
  isCreate = true;
  isEdit = true;
  isDelete = true;
  isCancel = true;
  isEditApproved = true;
  isHigherApproved = true;

  forceComboReset = signal(0);

  allBranches = signal<BranchDto[]>([]);
  selectedBranches: { id: number; company: string; nature: string }[] = [];
  selectedBranchId = 0;
  filledBranchId = 0;
  currentBranchID = signal<number>(1);
  currentBranch = signal<number>(1);
  itemUnitDetails = signal<any[]>([]);

  // Filter out empty rows in view mode
  get filteredUnitDetails(): Array<any> {
    if (this.isInputDisabled) {
      // In view mode, filter out empty rows (rows where unit.unit is empty)
      return this.itemUnitDetails().filter(
        (item: any) => item.unit?.unit && item.unit.unit.trim() !== ''
      );
    }
    // In edit/new mode, show all rows including empty ones
    return this.itemUnitDetails();
  }

  allItemColors = [] as Array<ItemColor>;
  selectedItemColorObj: any = {};
  selectedItemColorName = '';
  itemColorOptions: any = [];
  pageId = 0;

  stockToDisplay = 0;

  currentItemMaster = {} as ItemMaster;
  allItemHistoryDetails = [] as Array<ItemHistory>;

  selectedItemMasterId = signal<number>(0);
  isManualChange = false;

  selectedItemQualityObj: any = {};
  allQualities = [] as Array<Quality>;

  allSalesAccounts = [] as Array<Account>;
  salesAccountOptions: any = [];
  selectedSalesAccountId = 0;
  selectedSalesAccountName = '';

  lastItemID = 0;
  firstItemId = 0;

  allCostAccounts = [] as Array<Account>;
  costAccountOptions: any = [];
  selectedCostAccountId = 0;
  selectedCostAccountName = '';

  allPurchaseAccounts = [] as Array<Account>;
  purchaseAccountOptions: any = [];
  selectedPurchaseAccountId = 0;
  selectedPurchaseAccountName = '';

  selectedItemBrandObj: any = {};
  selectedItemBrandName = '';
  itemBrandOptions: any = [];
  allItemBrands = [] as Array<ItemBrand>;

  selectedCountryOfOriginObj: any = {};
  selectedCountryOfOriginName = '';
  countryOfOriginOptions: any = [];
  allCountryOfOrigin = [] as Array<CountryOfOrigin>;

  selectedCategory = '';
  selectedCategoryObj: SelectedCategory | null = null;
  categoryOptions: any = [];
  allCategories = [] as Array<Category>;
  allTaxTypes = [] as Array<TaxType>;
  selectedTaxTypeObj: any = {};

  filteredCategories: any = [];
  selectedCategories: any = [];

  allParentItems = [] as Array<parentItem>;
  selectedParentItemObj: any = {};
  selectedParentItemName = '';
  parentItemOptions: any = [];

  updatedBasicUnit = '';
  selectedBasicUnitObj = {} as UnitData;
  basicUnitOptions: any = [];
  allBasicUnits = [] as Array<UnitData>;
  unitsInGrid: any = [];

  purchaseUnitOptions: any = [];
  sellingUnitOptions: any = [];

  expiryitem = true;
  rawmaterials = true;
  finishedgoods = true;
  isUpdate = false;
  updatedSellingUnit = '';
  selectedSellingUnitObj = {};
  allSellingUnits = [] as Array<UnitData>;
  updatedPurchaseUnit = '';
  selectedPurchaseUnitObj = {};
  allPurchaseUnits = [] as Array<UnitData>;
  firstItemMaster!: number;

  active = true;
  unique = false;

  isStockItem = true;
  stockitem = true;

  // Button and input state flags
  isInputDisabled = true;
  isNewBtnDisabled = false;
  isEditBtnDisabled = false;
  isDeleteBtnDisabled = false;
  isSaveBtnDisabled = true;

  allInvAccounts = [] as Array<Account>;
  imageData: string | ArrayBuffer | null = null;

  selectedInvAccountId = 0;
  selectedInvAccountName = '';

  basicUnitFields = [
    { field: 'unit', header: 'Unit', width: 120 },
    { field: 'basicunit', header: 'Basic Unit', width: 120 },
    { field: 'factor', header: 'Factor', width: 70 },
  ];
  categoryFields = [
    { field: 'code', header: 'Code', width: 120 },
    { field: 'description', header: 'Category', width: 120 },
  ];
  parentItemFields = [
    { field: 'itemCode', header: 'Code', width: 120 },
    { field: 'itemName', header: 'Item Name', width: 200 },
  ];
  itemColorFields = [
    { field: 'code', header: 'Code', width: 120 },
    { field: 'value', header: 'Color', width: 120 },
  ];
  itemBrandFields = [
    { field: 'code', header: 'Code', width: 120 },
    { field: 'value', header: 'Brand', width: 120 },
  ];
  countryOfOriginFields = [
    { field: 'code', header: 'Code', width: 120 },
    { field: 'value', header: 'Country', width: 120 },
  ];
  accountFields = [
    { field: 'code', header: 'Code', width: 120 },
    { field: 'name', header: 'Account Name', width: 200 },
  ];

  itemHistoryFilterSettings: object = {
    type: 'Menu',
    showFilterBarStatus: false,
    immediateModeDelay: 0,
  };

  unitDetailsEditSettings: object = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Batch',
    newRowPosition: 'Bottom',
  };

  constructor() {
    super();
    this.commonInit();
  }
  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.fetchAllBranches();
    this.fetchUnitDropdown();
    this.fetchAllTaxTypes();
    this.fetchCategories();
  }

  override async LeftGridInit() {
    this.pageheading = 'Item Master';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLITEMMASTER)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );
      this.leftGrid.leftGridData = res.data;
this.lastItemID = res.data?.[res.data.length - 1]?.id;
      this.selectedItemMasterId.set(this.lastItemID);
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Item List',
          columns: [
            {
              field: 'itemCode',
              datacol: 'itemCode',
              headerText: 'Code',
              width: 100,
            },
            {
              field: 'itemName',
              datacol: 'itemName',
              headerText: 'Name',
              width: 300,
            },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching item master:', err);
    }
  }
  fetchItemMasterById(): void {
    this.selectedBranches = [];
    this.selectedBranchId = 0;
    this.itemUnitDetails.set([]);
    if (this.filledBranchId == 0) {
      this.filledBranchId = this.currentBranch();
    }

    this.getPageID();

    this.httpService
      .fetch(
        EndpointConstant.FILLITEMMASTERSBYID +
          'pageId=' +
          this.pageId +
          '&Id=' +
          this.selectedItemMasterId() +
          '&BranchId=' +
          this.filledBranchId
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.currentItemMaster = response?.data as any;
          const itemDetails = this.currentItemMaster.item;
          if (Array.isArray(this.currentItemMaster.unit?.data)) {
            const units = this.currentItemMaster.unit.data.map(
              (itemunit: any) => ({
                unitID: itemunit.id,
                unit: {
                  unit: itemunit.unit,
                  basicUnit: itemunit.basicUnit,
                  factor: itemunit.factor,
                },
                basicUnit: itemunit.basicUnit,
                factor: itemunit.factor,
                sellingPrice:
                  itemunit.sellingPrice != null
                    ? Number(itemunit.sellingPrice)
                    : 0,
                purchaseRate: itemunit.purchaseRate,
                mrp: itemunit.mrp,
                wholeSalePrice: itemunit.wholeSalePrice,
                retailPrice: itemunit.retailPrice,
                wholeSalePrice2: itemunit.discountPrice,
                retailPrice2: itemunit.otherPrice,
                lowestRate: itemunit.lowestRate,
                barcode: itemunit.barcode,
                active: itemunit.active,
                branchID: itemunit.branchID,
              })
            );

            this.itemUnitDetails.set(units);
            // make sure grid sees the new source
            if (this.unitDetailsGrid) {
              this.unitDetailsGrid.dataSource = this.itemUnitDetails();
              this.unitDetailsGrid?.refresh();
            }
          }

          //Assign history details of an item ....
          this.allItemHistoryDetails = this.currentItemMaster.history.data;
          //set stock value...
          this.stockToDisplay = this.currentItemMaster.stock.data[0].stock;
          //set form values...
          this.itemMasterForm.patchValue({
            itemcode: itemDetails.itemCode,
            active: itemDetails.active,
            itemname: itemDetails.itemName,
            arabicname: itemDetails.arabicName,
            basicunit: itemDetails.unit,
            category: itemDetails.commodityID,
            barcodeno: itemDetails.barCode,
            unique: itemDetails.isUniqueItem,
            stockitem: itemDetails.stockItem,
            costprice: itemDetails.purchaseRate,
            margin: itemDetails.margin,
            marginvalue: itemDetails.marginValue,
            sellingprice: this.baseService.formatInput(
              itemDetails.sellingPrice
            ),
            mrp: itemDetails.mrp,
            taxtype: itemDetails.taxTypeID,
            expiryitem: itemDetails.isExpiry,
            finishedgoods: itemDetails.isFinishedGood,
            rawmaterials: itemDetails.isRawMaterial,
            expirydays: itemDetails.expiryPeriod,
            racklocation: itemDetails.location,
            discount: itemDetails.itemDisc,
            hsncode: itemDetails.hsn,
            quality: itemDetails.qualityID,
            modelno: itemDetails.modelNo,
            manufacturer: itemDetails.manufacturer,
            rol: itemDetails.rol,
            roq: itemDetails.roq,
            shipmark: itemDetails.shipMark,
            paintmark: itemDetails.paintMark,
            stockcode: itemDetails.stock,
            weight: itemDetails.weight,
            oemno: itemDetails.oemNo,
            groupitem: itemDetails.isGroup,
            remarks: itemDetails.remarks,
          });
          //set stock item field as true
          if (itemDetails.stockItem) {
            this.isStockItem = true;
          }
          //set image data...
          this.imageData = this.currentItemMaster.img; //itemDetails.imagepath;
          //set basic unit...
          this.allBasicUnits.forEach((item) => {
            if (item.unit == itemDetails.unit) {
              this.selectedBasicUnitObj = item;
              this.updatedBasicUnit = item.unit;
            }
          });

          this.onBasicUnitSelected(itemDetails.unit, null);
          this.updatedSellingUnit = itemDetails.sellingUnit;
          this.onSellingUnitSelected(itemDetails.sellingUnit);
          this.updatedPurchaseUnit = itemDetails.purchaseUnit;
          this.onPurchaseUnitSelected(itemDetails.purchaseUnit);

          if (itemDetails.commodityCode != null) {
            this.onCategorySelected(itemDetails.commodityCode);
          }

          //set parent item...
          this.allParentItems.forEach((item) => {
            if (item.id === itemDetails.parentID) {
              this.onParentItemSelected(item.itemName);
            }
          });

          //set inv account...
          this.allInvAccounts.forEach((item) => {
            if (item.id === itemDetails.invAccountID) {
              this.selectedInvAccountId = item.id;
              this.selectedInvAccountName = item.name;
            }
          });

          //set sales account...
          this.allSalesAccounts.forEach((item) => {
            if (item.id == itemDetails.salesAccountID) {
              this.selectedSalesAccountId = item.id;
              this.selectedSalesAccountName = item.name;
            }
          });
          //set cost account...
          this.allCostAccounts.forEach((item) => {
            if (item.id === itemDetails.costAccountID) {
              this.selectedCostAccountId = item.id;
              this.selectedCostAccountName = item.name;
            }
          });

          //set purchase account...
          this.allPurchaseAccounts.forEach((item) => {
            if (item.id === itemDetails.purchaseAccountID) {
              this.selectedPurchaseAccountId = item.id;
              this.selectedPurchaseAccountName = item.name;
            }
          });

          // this.selectedItemColorName = itemDetails.colorName;
          // this.selectedItemBrandName = itemDetails.brandName;
          // this.selectedCountryOfOriginName = itemDetails.originName;

          //set color...
          this.onItemColorSelected(itemDetails.colorName);

          //set brand...
          this.onItemBrandSelected(itemDetails.brandName);

          //set country of origin..
          this.onItemOriginSelected(itemDetails.originName);

          // this.isLoading = false;
        },
        error: (error) => {
          // this.isLoading = false;
          console.error('An Error Occured', error);
        },
      });
  }
  protected override getDataById(data: any): void {
    this.selectedItemMasterId.set(data.id);
    this.fetchItemMasterById();
  }
  protected override SaveFormData(): void {
    if (this.itemMasterForm.invalid) {
      for (const field of Object.keys(this.itemMasterForm.controls)) {
        const control: any = this.itemMasterForm.get(field);
        if (control.invalid) {
          this.toast.error('Invalid field: ' + field);
          return; // Stop after showing the first invalid field
        }
      }
      return;
    }
    //this.isLoading = true;
    if (Object.keys(this.selectedParentItemObj).length === 0) {
      this.selectedParentItemObj = {
        id: 0,
        itemCode: '',
        itemName: '',
      };
    }

    if (Object.keys(this.selectedSellingUnitObj).length === 0) {
      this.selectedSellingUnitObj = {
        id: 0,
        unit: '',
        basicUnit: '',
      };
    }

    if (Object.keys(this.selectedPurchaseUnitObj).length === 0) {
      this.selectedPurchaseUnitObj = {
        id: 0,
        unit: '',
        basicUnit: '',
      };
    }

    // set branches...
    if (this.selectedBranches.length == 0) {
      this.allBranches().forEach((branch: any) => {
        if (branch.id == this.currentBranch) {
          this.selectedBranches.push(branch);
        }
      });
    }
    // this.itemUnitDetails.pop();

    const payload = {
      itemCode: this.itemMasterForm.value.itemcode,
      itemName: this.itemMasterForm.value.itemname,
      arabicName: this.itemMasterForm.value.arabicname,
      unit: this.selectedBasicUnitObj,
      barCode:
        this.itemMasterForm.get('barcodeno')?.value != null
          ? this.itemMasterForm.get('barcodeno')?.value.toString()
          : '',
      category: this.selectedCategoryObj ? this.selectedCategoryObj : {},
      isUniqueItem: this.itemMasterForm.value.unique ?? false,
      stockItem: this.itemMasterForm.value.stockitem ?? false,
      costPrice: this.itemMasterForm.value.costprice,
      sellingPrice: this.itemMasterForm.value.sellingprice,
      mrp: this.itemMasterForm.value.mrp,
      margin: this.itemMasterForm.value.margin,
      marginValue: this.itemMasterForm.value.marginvalue,
      taxType: this.selectedTaxTypeObj,
      isExpiry: this.itemMasterForm.value.expiryitem ?? false,
      expiryPeriod: this.itemMasterForm.value.expirydays ?? 0,
      isFinishedGood: this.itemMasterForm.value.finishedgoods ?? false,
      isRawMaterial: this.itemMasterForm.value.rawmaterials ?? false,
      location: this.itemMasterForm.value.racklocation,
      itemDisc: this.itemMasterForm.value.discount ?? 0,
      hsn: this.itemMasterForm.value.hsncode,
      parent: this.selectedParentItemObj,
      quality: this.selectedItemQualityObj,
      modelNo: this.itemMasterForm.value.modelno,
      color: this.selectedItemColorObj,
      brand: this.selectedItemBrandObj,
      countryOfOrigin: this.selectedCountryOfOriginObj,
      rol: this.itemMasterForm.value.rol ?? 0,
      partNo: this.itemMasterForm.value.stockcode,
      roq: this.itemMasterForm.value.roq ?? 0,
      manufacturer: this.itemMasterForm.value.manufacturer,
      weight: this.itemMasterForm.value.weight ?? 0,
      shipMark: this.itemMasterForm.value.shipmark,
      paintMark: this.itemMasterForm.value.paintmark,
      sellingUnit: this.selectedSellingUnitObj,
      oemNo: this.itemMasterForm.value.oemno,
      purchaseUnit: this.selectedPurchaseUnitObj,
      isGroup: this.itemMasterForm.value.groupitem ?? false,
      active: this.itemMasterForm.value.active,
      invAccount: {
        id: this.selectedInvAccountId,
        name: this.selectedInvAccountName,
      },
      salesAccount: {
        id: this.selectedSalesAccountId,
        name: this.selectedSalesAccountName,
      },
      costAccount: {
        id: this.selectedCostAccountId,
        name: this.selectedCostAccountName,
      },
      purchaseAccount: {
        id: this.selectedPurchaseAccountId,
        name: this.selectedPurchaseAccountName,
      },
      remarks: this.itemMasterForm.value.remarks,
      itemUnit: this.itemUnitDetails,
      branch: this.selectedBranches,
      imageFile: this.imageData,
    };
    if (this.isUpdate) {
      this.updateCallback(payload, this.selectedItemMasterId);
    } else {
      this.createCallback(payload);
    }
  }

  updateCallback(payload: any, itemMasterId: any) {
    this.httpService
      .patch(
        EndpointConstant.UPDATEITEMMASTER +
          itemMasterId +
          '&pageId=' +
          this.pageId,
        payload
      )
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response: any) => {
          const resp = response as any; // cast to any and guard access
          const message = resp?.data?.msg ?? 'category update successfully!';
          if (resp?.isValid) {
            this.toast.success(message);
          } else {
            this.toast.error('Save failed: ' + (message || ''));
          }
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
        },
        error: (error) => {
          // this.isLoading = false;
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

  createCallback(payload: any) {
    this.httpService
      .post(EndpointConstant.SAVEITEMMASTER + '?pageId=' + this.pageId, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          //this.isLoading = false;
          const resp = response as any; // cast to any and guard access
          const message = resp?.data?.msg ?? 'Item save successfully!';
          if (resp?.isValid) {
            this.toast.success(message);
          } else {
            this.toast.error('Save failed: ' + (message || ''));
          }
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
        },
        error: (error) => {
          //this.isLoading = false;
          console.error('Error saving branch', error);
        },
      });
  }

  protected override newbuttonClicked(): void {
    // Toggle input enable/disable state
    this.isInputDisabled = !this.isInputDisabled;
  
    // Update button states
    this.isEditBtnDisabled = !this.isInputDisabled;
    this.isDeleteBtnDisabled = !this.isInputDisabled;
    this.isSaveBtnDisabled = this.isInputDisabled;
  
    // Reset form data and component variables
    this.itemMasterForm.reset();
    this.itemmasterFormReset();
  
    // Enable/disable form controls
    if (this.isInputDisabled) {
      this.disableFormControls();
    } else {
      this.enableFormControls();
    }
  }
  
  itemmasterFormReset(): void {
    // Prevent reactive triggers (e.g., onBasicUnitSelected firing again)
    this.isManualChange = true;
    this.forceComboReset.update(v => v + 1);
  
    // 🔹 Clear all model variables and state
    this.selectedBasicUnitObj = {} as UnitData;
    this.updatedBasicUnit = '';
    this.updatedSellingUnit = '';
    this.updatedPurchaseUnit = '';
  
    this.selectedCategoryObj = null;
    this.selectedCategory = '';
  
    this.selectedParentItemObj = {};
    this.selectedParentItemName = '';
  
    this.selectedItemBrandObj = {};
    this.selectedItemBrandName = '';
  
    this.selectedItemColorObj = {};
    this.selectedItemColorName = '';
  
    this.selectedCountryOfOriginObj = {};
    this.selectedCountryOfOriginName = '';
  
    this.selectedItemQualityObj = {};
  
    this.allItemHistoryDetails = [] as Array<ItemHistory>;
    this.currentItemMaster = {} as ItemMaster;
  
    this.itemUnitDetails.set([]); // clear grid data
  
    // 🔹 Clear reactive form controls
    this.itemMasterForm.patchValue({
      basicunit: '',
      category: '',
      purchaseunit: '',
      sellingunit: '',
      barcodeno: '',
      itemcode: '',
      itemname: '',
      arabicname: '',
      taxtype: null,
      costprice: '',
      sellingprice: '',
      mrp: '',
      margin: '',
      marginvalue: '',
    });
  
    // 🔹 Clear dropdown component UI if attached
    if (this.multicomboBoxObj) {
      this.multicomboBoxObj.value = '';
      this.multicomboBoxObj.text = '';
    }
  
    // Reset units-in-grid and options
    this.unitsInGrid = [];
    this.purchaseUnitOptions = [];
    this.sellingUnitOptions = [];
  
    // 🔹 Clear form validation states
    this.itemMasterForm.markAsPristine();
    this.itemMasterForm.markAsUntouched();
  
    // Allow reactive triggers again
    this.isManualChange = false;
  }
  protected override onEditClick(): void {
    //this.isInputDisabled = !this.isInputDisabled;
    this.isEditBtnDisabled = !this.isInputDisabled;
    this.isDeleteBtnDisabled = !this.isInputDisabled;
    this.isSaveBtnDisabled = this.isInputDisabled;
    if (this.isInputDisabled == false) {
      this.disableFormControls();
    } else {
      this.enableFormControls();
    }
  }

  fetchAllBranches(): void {
    this.allBranches.set(
      JSON.parse(this.localstorageService.getLocalStorageItem('branchList'))
    );
    this.currentBranch.set(
      Number(this.localstorageService.getLocalStorageItem('current_branch'))
    );
  }

  generateBarCode(rowIndex: any): void {
    const barCodeValue = this.itemMasterForm.get('barcodeno')?.value;
    if (
      (barCodeValue != '' &&
        confirm('Are you sure you want to update the barcode?')) ||
      barCodeValue == ''
    ) {
      // this.isLoading = true;
      this.httpService
        .fetch(EndpointConstant.GENERATEBARCODE)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            // this.isLoading = false;
            if (rowIndex == 0) {
              this.itemMasterForm.patchValue({
                barcodeno: (response?.data as any)?.[0]?.barcode,
              });
            }
            if (this.itemUnitDetails().length > 0) {
              const updatedDetails = [...this.itemUnitDetails()];
              updatedDetails[rowIndex] = {
                ...updatedDetails[rowIndex],
                barcode: (response?.data as any)?.[0]?.barcode?.toString(),
              };
              this.itemUnitDetails.set(updatedDetails);
            }
          },
          error: (error) => {
            // this.isLoading = false;
            console.error('An Error Occured', error);
          },
        });
    }
  }

  fetchAllTaxTypes(): void {
    // this.isLoading = true;
    this.httpService
      .fetch(EndpointConstant.FILLTAXDROPDOWN)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          //this.isLoading = false;

          this.allTaxTypes = response?.data as any;
          this.itemMasterForm.patchValue({
            taxtype: this.allTaxTypes ? this.allTaxTypes[0].id : null,
          });
        },
        error: (error) => {
          // this.isLoading = false;
          console.error('An Error Occured', error);
        },
      });
  }
  fetchUnitDropdown(): void {
    // this.isLoading = true;
    this.httpService
      .fetch(EndpointConstant.FILLUNITSPOPUP)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // this.isLoading = false;
          this.allBasicUnits = response?.data as any;
          this.basicUnitOptions = this.allBasicUnits.map(
            (item: any) => item.unit
          );
          // this.allSellingUnits = response?.data;
          // this.sellingUnitOptions = this.allSellingUnits.map((item:any) => item.unit);
          // this.allPurchaseUnits = response?.data;
          // this.purchaseUnitOptions = this.allPurchaseUnits.map((item:any) => item.unit);
        },
        error: (error) => {
          // this.isLoading = false;
          console.error('An Error Occured', error);
        },
      });
  }
  async fetchCategories(): Promise<void> {
    // this.isLoading = true;
    this.httpService
      .fetch(EndpointConstant.FILLALLITEMMASTERCATEGORIES)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .toPromise()
      .then((response) => {
        this.allCategories = response?.data as any;
        this.categoryOptions = this.allCategories.map((item: any) => ({
          code: item.code,
          description: item.description,
        }));
        this.filteredCategories = this.allCategories.map((item: any) => ({
          id: item.id,
          value: item.description,
        }));
        return response;
      })
      .catch((error) => {
        console.error('An Error Occured', error);
        return error;
      });
  }

  onBranchChange(event: any): void {
    // Update the service's current branch ID
    this.currentBranchID.set(event.value);

    // Update the form control
    this.itemMasterForm.patchValue({
      branch: event.value,
    });
  }
  onBasicUnitSelected(option: string, rowIndex: any): any {
    let selectedBasicUnit: any = {};
    if (rowIndex == 0) {
      this.itemMasterForm.patchValue({
        basicunit: option,
      });
      this.updatedBasicUnit = option;
    }
    this.allBasicUnits.forEach(function (item) {
      if (item.unit === option) {
        selectedBasicUnit = item;
      }
    });
    this.selectedBasicUnitObj = selectedBasicUnit;
    if (option != '' && rowIndex != null) {
      if (this.itemUnitDetails().length > 0) {
        const preUnit = this.itemUnitDetails()[rowIndex]['unit'];

        const index = Object.keys(this.unitsInGrid).findIndex(
          (key) => this.unitsInGrid['unit'] === preUnit.unit
        );

        // If the unit is found, remove it
        if (index !== -1) {
          const unitIdToRemove = Object.keys(this.unitsInGrid)[index];
          delete this.unitsInGrid[unitIdToRemove];
        }
      }
      if (this.itemUnitDetails().length == 0) {
        const newUnitItem = {
          unitID: 0,
          unit: this.selectedBasicUnitObj,
          basicUnit: option,
          factor: 1,
          sellingPrice:
            this.itemMasterForm.get('costprice')?.value != null
              ? parseFloat(this.itemMasterForm.get('costprice')?.value)
              : 0.0,
          purchaseRate:
            this.itemMasterForm.get('sellingprice')?.value != null
              ? parseFloat(this.itemMasterForm.get('sellingprice')?.value)
              : 0.0,
          mrp:
            this.itemMasterForm.get('mrp')?.value != null
              ? parseFloat(this.itemMasterForm.get('mrp')?.value)
              : 0.0,
          wholeSalePrice: 0.0,
          retailPrice: 0,
          wholeSalePrice2: 0,
          retailPrice2: 0,
          lowestRate: 0,
          barcode:
            this.itemMasterForm.get('barcodeno')?.value != null
              ? this.itemMasterForm.get('barcodeno')?.value.toString()
              : '',
          active: true,
          status: 0,
        };
        this.itemUnitDetails.set([...this.itemUnitDetails(), newUnitItem]);
      } else {
        const updatedDetails = [...this.itemUnitDetails()];
        updatedDetails[rowIndex] = {
          ...updatedDetails[rowIndex],
          unit: this.selectedBasicUnitObj,
        };
        this.itemUnitDetails.set(updatedDetails);
      }
    }

    if (rowIndex == 0) {
      // setting all basic unit in grid to item basic unit
      const updatedDetails = this.itemUnitDetails().map((item: any) => ({
        ...item,
        basicUnit: option,
      }));
      this.itemUnitDetails.set(updatedDetails);
    }

    if (
      this.selectedBasicUnitObj &&
      !this.unitsInGrid.some(
        (unit: any) => unit.unit === this.selectedBasicUnitObj.unit
      )
    ) {
      this.unitsInGrid.push(this.selectedBasicUnitObj);
      this.purchaseUnitOptions = this.unitsInGrid;
      this.sellingUnitOptions = this.unitsInGrid;
    }
    //call addunit function only in edit/new mode
    if (!this.isInputDisabled) {
      this.addUnit();
    }
  }

  addUnit() {
    const allItemCodesFilled = this.itemUnitDetails().every(
      (unititem: any) => unititem.unit.unit && unititem.unit.unit.trim() !== ''
    );

    if (!allItemCodesFilled) {
      return false;
    }
    let basicUnit = null;
    if (this.itemUnitDetails().length > 0) {
      basicUnit = this.itemUnitDetails()[0].basicUnit;
    }
    const newUnitItem = {
      unitID: 0,
      unit: { unit: '', basicUnit: '', factor: 0 },
      basicUnit: basicUnit,
      factor: 0,
      sellingPrice: 0,
      purchaseRate: 0,
      mrp: 0,
      wholeSalePrice: 0,
      retailPrice: 0,
      wholeSalePrice2: 0,
      retailPrice2: 0,
      lowestRate: 0,
      barcode: null,
      active: true,
      status: 0,
    };
    if (this.itemUnitDetails().length == 0) {
      newUnitItem.barcode =
        this.itemMasterForm.get('barcodeno')?.value != null
          ? this.itemMasterForm.get('barcodeno')?.value.toString()
          : '';
    }
    this.itemUnitDetails.set([...this.itemUnitDetails(), newUnitItem]);
    return true;
  }

  onActiveChange(event: any) {
    this.active = event.target.checked ? true : false;
  }
  onStockItemChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.isStockItem = checkbox.checked;
    if (this.isStockItem == false) {
      this.itemMasterForm.get('invaccount')?.enable();
      this.itemMasterForm.get('salesaccount')?.enable();
      this.itemMasterForm.get('costaccount')?.enable();
      this.itemMasterForm.get('purchaseaccount')?.enable();
    } else {
      this.itemMasterForm.get('invaccount')?.disable();
      this.itemMasterForm.get('salesaccount')?.disable();
      this.itemMasterForm.get('costaccount')?.disable();
      this.itemMasterForm.get('purchaseaccount')?.disable();
    }
  }
  onCategorySelected(option: string): any {
    this.itemMasterForm.patchValue({
      category: option,
    });
    const selectedCategory: any = {};
    this.allCategories.forEach(function (item) {
      if (item.code === option) {
        selectedCategory.id = item.id;
        selectedCategory.code = item.code;
        selectedCategory.category = item.description;
        selectedCategory.categoryType = '';
      }
    });
    this.selectedCategoryObj = selectedCategory;
    this.selectedCategory = option;
  }
  onParentItemSelected(option: string): any {
    let selectedParentItem: any = {};
    const value = option || this.itemMasterForm.get('parentitem')?.value || '';
    this.itemMasterForm.patchValue({
      parentitem: value,
    });
    this.allParentItems.forEach(function (item) {
      if (item.itemName === value) {
        selectedParentItem = item;
      }
    });
    this.selectedParentItemObj = selectedParentItem;
    this.selectedParentItemName = value;
  }

  onItemColorSelected(option: string): any {
    const selectedItemColor: any = {};
    const value = option || this.itemMasterForm.get('color')?.value || '';
    this.itemMasterForm.patchValue({
      color: value,
    });
    this.allItemColors.forEach(function (item) {
      if (item.value === value) {
        selectedItemColor.id = item.id;
        selectedItemColor.code = item.code;
        selectedItemColor.name = item.value;
        selectedItemColor.description = '';
      }
    });
    this.selectedItemColorObj = selectedItemColor;
    this.selectedItemColorName = value;
  }

  onItemBrandSelected(option: string): any {
    const selectedItemBrand: any = {};
    const value = option || this.itemMasterForm.get('brancdname')?.value || '';
    this.itemMasterForm.patchValue({
      brancdname: value,
    });
    this.allItemBrands.forEach(function (item) {
      if (item.value === value) {
        selectedItemBrand.id = item.id;
        selectedItemBrand.code = item.code;
        selectedItemBrand.name = item.value;
        selectedItemBrand.description = '';
      }
    });
    this.selectedItemBrandObj = selectedItemBrand;
    this.selectedItemBrandName = value;
  }

  onItemOriginSelected(option: string): any {
    const selectedCountryOfOrigin: any = {};
    const value =
      option || this.itemMasterForm.get('countryoforigin')?.value || '';
    this.itemMasterForm.patchValue({
      countryoforigin: value,
    });
    this.allCountryOfOrigin.forEach(function (item) {
      if (item.value === value) {
        selectedCountryOfOrigin.id = item.id;
        selectedCountryOfOrigin.code = item.code;
        selectedCountryOfOrigin.name = item.value;
        selectedCountryOfOrigin.description = '';
      }
    });
    this.selectedCountryOfOriginObj = selectedCountryOfOrigin;
    this.selectedCountryOfOriginName = value;
  }
  onCostPriceChange() {
    if (!this.isManualChange) {
      this.isManualChange = true;

      const costPrice = this.itemMasterForm.get('costprice')?.value;
      const marginPercent = this.itemMasterForm.get('margin')?.value ?? 0;
      const marginvalue = this.baseService.formatInput(
        Number(costPrice) * (Number(marginPercent) / 100)
      );
      const sellingPrice = this.baseService.formatInput(
        Number(costPrice) + Number(marginvalue)
      );

      this.itemMasterForm.patchValue({
        sellingprice: sellingPrice,
        marginvalue: marginvalue,
      });

      if (this.itemUnitDetails().length > 0) {
        const updatedDetails = [...this.itemUnitDetails()];
        updatedDetails[0] = {
          ...updatedDetails[0],
          purchaseRate: Number(costPrice) || 0,
          sellingPrice: Number(sellingPrice) || 0,
          mrp: Number(this.itemMasterForm.get('mrp')?.value) || 0,
        };
        this.itemUnitDetails.set(updatedDetails);
      }

      this.onFormSellingPriceChange();

      this.isManualChange = false;
    }
  }

  onMarginPercentageChange() {
    if (this.isManualChange) return;

    this.isManualChange = true;

    const costPrice = Number(this.itemMasterForm.get('costprice')?.value ?? 0);
    const marginPercent = Number(this.itemMasterForm.get('margin')?.value ?? 0);

    if (costPrice > 0) {
      const marginValue = this.baseService.formatInput(
        costPrice * (marginPercent / 100)
      );
      const sellingPrice = this.baseService.formatInput(
        costPrice + Number(marginValue)
      );
      this.isManualChange = false;

      this.itemMasterForm.patchValue(
        {
          marginvalue: marginValue,
          sellingprice: sellingPrice,
        },
        { emitEvent: false }
      ); // prevents recursive valueChange triggers
    }
  }

  onMarginValueChange() {
    if (!this.isManualChange) {
      this.isManualChange = true;

      const costPrice: number =
        Number(this.itemMasterForm.get('costprice')?.value) || 0;
      if (costPrice != null) {
        const marginvalue: number =
          Number(this.itemMasterForm.get('marginvalue')?.value) || 0;
        const sellingPrice: number = this.baseService.formatInput(
          costPrice + marginvalue
        );
        const marginPercentage: number = this.baseService.formatInput(
          (marginvalue / costPrice) * 100
        );

        this.itemMasterForm.patchValue({
          sellingprice: sellingPrice,
          margin: marginPercentage,
        });
      }

      this.isManualChange = false;
    }
  }

  onFormSellingPriceChange() {
    if (!this.isManualChange) {
      this.isManualChange = true;

      const sellingPrice = this.itemMasterForm.get('sellingprice')?.value;
      if (sellingPrice != null) {
        const taxType = this.itemMasterForm.get('taxtype')?.value;
        let taxPercentage = 0;
        this.allTaxTypes.forEach(function (item) {
          if (item.id == taxType) {
            taxPercentage = item.salesPerc;
          }
        });

        const taxValue = sellingPrice * (taxPercentage / 100);
        const costPrice = this.itemMasterForm.get('costprice')?.value ?? 0;
        const mrpPrice = this.baseService.formatInput(
          parseFloat(sellingPrice) + taxValue
        );
        const marginPercentage: number = this.baseService.formatInput(
          ((sellingPrice - costPrice) / costPrice) * 100
        );
        const marginValue: number = this.baseService.formatInput(
          sellingPrice - costPrice
        );

        this.itemMasterForm.patchValue({
          mrp: mrpPrice,
          margin: marginPercentage,
          marginvalue: marginValue,
        });

        if (this.itemUnitDetails().length > 0) {
          const updatedDetails = [...this.itemUnitDetails()];
          updatedDetails[0] = {
            ...updatedDetails[0],
            purchaseRate: this.itemMasterForm.get('costprice')?.value ?? 0,
            sellingPrice: Number(sellingPrice) || 0,
            mrp: Number(mrpPrice) || 0,
          };
          this.itemUnitDetails.set(updatedDetails);
        }
      }

      this.isManualChange = false;
    }
  }

  onItemMrpChange() {
    if (!this.isManualChange) {
      this.isManualChange = true;

      const mrpPrice = this.itemMasterForm.get('mrp')?.value;
      const taxType = this.itemMasterForm.get('taxtype')?.value;
      let taxPercentage = 0;
      this.allTaxTypes.forEach(function (item) {
        if (item.id == taxType) {
          taxPercentage = item.salesPerc;
        }
      });

      const sellingPrice = this.baseService.formatInput(
        mrpPrice * (100 / (100 + taxPercentage))
      );
      this.itemMasterForm.patchValue({
        sellingprice: sellingPrice,
      });

      if (this.itemUnitDetails().length > 0) {
        const updatedDetails = [...this.itemUnitDetails()];
        updatedDetails[0] = {
          ...updatedDetails[0],
          sellingPrice: Number(sellingPrice) || 0,
          mrp: Number(mrpPrice) || 0,
        };
        this.itemUnitDetails.set(updatedDetails);
      }

      this.isManualChange = false;
    }
  }
  onChangeTaxType(event?: any): void {
    const selectedTaxTypeId =
      event?.value ??
      event?.itemData?.id ??
      this.itemMasterForm.get('taxtype')?.value;
    const selectedTaxTypeName = this.allTaxTypes.find(
      (taxtype) => taxtype.id === selectedTaxTypeId
    )?.name;
    this.selectedTaxTypeObj = {
      id: selectedTaxTypeId,
      name: selectedTaxTypeName || '',
    };
  }
  onSellingUnitSelected(option: string): any {
    const value = option || this.itemMasterForm.get('sellingunit')?.value || '';
    this.itemMasterForm.patchValue({
      sellingunit: value,
    });

    let selectedSellingUnit = {};
    this.allBasicUnits.forEach(function (item) {
      if (item.unit === value) {
        selectedSellingUnit = item;
      }
    });
    this.selectedSellingUnitObj = selectedSellingUnit;
    this.updatedSellingUnit = value;
  }
  onPurchaseUnitSelected(option: string): any {
    const value =
      option || this.itemMasterForm.get('purchaseunit')?.value || '';
    this.itemMasterForm.patchValue({
      purchaseunit: value,
    });
    let selectedPurchaseUnit = {};
    this.allBasicUnits.forEach(function (item) {
      if (item.unit === value) {
        selectedPurchaseUnit = item;
      }
    });
    this.selectedPurchaseUnitObj = selectedPurchaseUnit;
    this.updatedPurchaseUnit = value;
  }
  onChangeQuality(): void {
    const selectedQualityId = this.itemMasterForm.get('quality')?.value;
    const selectedQualityValue = this.allQualities.find(
      (quality) => quality.id == selectedQualityId
    )?.value;
    this.selectedItemQualityObj = {
      id: selectedQualityId,
      value: selectedQualityValue || '',
    };
  }
  onInvAccountSelected(option: string): any {
    const value = option || this.itemMasterForm.get('invaccount')?.value || '';
    let selectedInvAccountId = 0;
    this.allInvAccounts.forEach(function (item) {
      if (item.name === value) {
        selectedInvAccountId = item.id;
      }
    });
    this.selectedInvAccountId = selectedInvAccountId;
    this.selectedInvAccountName = value;
  }
  onCostAccountSelected(option: string): any {
    const value = option || this.itemMasterForm.get('costaccount')?.value || '';
    let selectedCostAccountId = 0;
    this.allCostAccounts.forEach(function (item) {
      if (item.name === value) {
        selectedCostAccountId = item.id;
      }
    });
    this.selectedCostAccountId = selectedCostAccountId;
    this.selectedCostAccountName = value;
  }

  onSalesAccountSelected(option: string): any {
    const value =
      option || this.itemMasterForm.get('salesaccount')?.value || '';
    let selectedSalesAccountId = 0;
    this.allSalesAccounts.forEach(function (item) {
      if (item.name === value) {
        selectedSalesAccountId = item.id;
      }
    });
    this.selectedSalesAccountId = selectedSalesAccountId;
    this.selectedSalesAccountName = value;
  }
  onPurchaseAccountSelected(option: string): any {
    const value =
      option || this.itemMasterForm.get('purchaseaccount')?.value || '';
    let selectedPurchaseAccountId = 0;
    this.allPurchaseAccounts.forEach(function (item) {
      if (item.name === value) {
        selectedPurchaseAccountId = item.id;
      }
    });
    this.selectedPurchaseAccountId = selectedPurchaseAccountId;
    this.selectedPurchaseAccountName = value;
  }

  itemmasterformshow(): void {
    console.log('itemmasterformshow', this.itemMasterForm);
  }
  protected override FormInitialize(): void {
    this.itemMasterForm = new FormGroup({
      branch: new FormControl(
        { value: this.currentBranchID(), disabled: this.isInputDisabled },
        Validators.required
      ),
      itemcode: new FormControl(
        { value: '', disabled: this.isInputDisabled },
        Validators.required
      ),
      active: new FormControl({ value: '', disabled: this.isInputDisabled }),
      itemname: new FormControl(
        { value: '', disabled: this.isInputDisabled },
        Validators.required
      ),
      arabicname: new FormControl(
        { value: '', disabled: this.isInputDisabled },
        Validators.required
      ),
      basicunit: new FormControl(
        { value: '', disabled: this.isInputDisabled },
        Validators.required
      ),
      barcodeno: new FormControl({ value: '', disabled: this.isInputDisabled }), //, Validators.required
      category: new FormControl({
        value: null,
        disabled: this.isInputDisabled,
      }), //, Validators.required
      unique: new FormControl({ value: false, disabled: this.isInputDisabled }),
      stockitem: new FormControl({ value: '', disabled: this.isInputDisabled }),
      costprice: new FormControl({ value: '', disabled: this.isInputDisabled }), //, [Validators.required,Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')]
      sellingprice: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }), //, [Validators.required,Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')]
      mrp: new FormControl({ value: '', disabled: this.isInputDisabled }), //, [Validators.required,Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')]
      taxtype: new FormControl({ value: null, disabled: this.isInputDisabled }),
      margin: new FormControl({ value: '', disabled: this.isInputDisabled }), //, Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')
      marginvalue: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }), //, Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')
      isdisabled: new FormControl({
        value: false,
        disabled: this.isInputDisabled,
      }),
      expiryitem: new FormControl({
        value: false,
        disabled: this.isInputDisabled,
      }),
      finishedgoods: new FormControl({
        value: false,
        disabled: this.isInputDisabled,
      }),
      rawmaterials: new FormControl({
        value: false,
        disabled: this.isInputDisabled,
      }),
      expirydays: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }),
      racklocation: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }),
      discount: new FormControl({ value: '', disabled: this.isInputDisabled }),
      hsncode: new FormControl({ value: '', disabled: this.isInputDisabled }),
      parentitem: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }), //,Validators.required
      quality: new FormControl({ value: '', disabled: this.isInputDisabled }),
      modelno: new FormControl({ value: '', disabled: this.isInputDisabled }),
      color: new FormControl({ value: '', disabled: this.isInputDisabled }),
      brancdname: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }),
      countryoforigin: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }),
      manufacturer: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }),
      rol: new FormControl({ value: '', disabled: this.isInputDisabled }),
      roq: new FormControl({ value: '', disabled: this.isInputDisabled }),
      shipmark: new FormControl({ value: '', disabled: this.isInputDisabled }),
      paintmark: new FormControl({ value: '', disabled: this.isInputDisabled }),
      stockcode: new FormControl({ value: '', disabled: this.isInputDisabled }),
      weight: new FormControl({ value: 0, disabled: this.isInputDisabled }),
      purchaseunit: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }), //,Validators.required
      sellingunit: new FormControl({
        value: '',
        disabled: this.isInputDisabled,
      }), //,Validators.required
      oemno: new FormControl({ value: '', disabled: this.isInputDisabled }),
      groupitem: new FormControl({ value: '', disabled: this.isInputDisabled }),
      invaccount: new FormControl({
        value: '',
        disabled: this.isInputDisabled || this.isStockItem,
      }),
      salesaccount: new FormControl({
        value: '',
        disabled: this.isInputDisabled || this.isStockItem,
      }),
      costaccount: new FormControl({
        value: '',
        disabled: this.isInputDisabled || this.isStockItem,
      }),
      purchaseaccount: new FormControl({
        value: '',
        disabled: this.isInputDisabled || this.isStockItem,
      }),
      remarks: new FormControl({ value: '', disabled: this.isInputDisabled }),
    });
  }

  enableFormControls(): void {
    this.itemMasterForm.get('branch')?.enable();
    this.itemMasterForm.get('itemcode')?.enable();
    this.itemMasterForm.get('active')?.enable();
    this.itemMasterForm.get('itemname')?.enable();
    this.itemMasterForm.get('arabicname')?.enable();
    this.itemMasterForm.get('basicunit')?.enable();
    this.itemMasterForm.get('barcodeno')?.enable();
    this.itemMasterForm.get('category')?.enable();
    this.itemMasterForm.get('unique')?.enable();
    this.itemMasterForm.get('stockitem')?.enable();
    this.itemMasterForm.get('costprice')?.enable();
    this.itemMasterForm.get('sellingprice')?.enable();
    this.itemMasterForm.get('mrp')?.enable();
    this.itemMasterForm.get('taxtype')?.enable();
    this.itemMasterForm.get('margin')?.enable();
    this.itemMasterForm.get('marginvalue')?.enable();
    this.itemMasterForm.get('isdisabled')?.enable();
    this.itemMasterForm.get('expiryitem')?.enable();
    this.itemMasterForm.get('finishedgoods')?.enable();
    this.itemMasterForm.get('rawmaterials')?.enable();
    this.itemMasterForm.get('expirydays')?.enable();
    this.itemMasterForm.get('racklocation')?.enable();
    this.itemMasterForm.get('discount')?.enable();
    this.itemMasterForm.get('hsncode')?.enable();
    this.itemMasterForm.get('parentitem')?.enable();
    this.itemMasterForm.get('quality')?.enable();
    this.itemMasterForm.get('modelno')?.enable();
    this.itemMasterForm.get('color')?.enable();
    this.itemMasterForm.get('brancdname')?.enable();
    this.itemMasterForm.get('countryoforigin')?.enable();
    this.itemMasterForm.get('manufacturer')?.enable();
    this.itemMasterForm.get('rol')?.enable();
    this.itemMasterForm.get('purchaseunit')?.enable();
    this.itemMasterForm.get('sellingunit')?.enable();
    if (!this.isStockItem) {
      this.itemMasterForm.get('invaccount')?.enable();
      this.itemMasterForm.get('salesaccount')?.enable();
      this.itemMasterForm.get('costaccount')?.enable();
      this.itemMasterForm.get('purchaseaccount')?.enable();
    }
  }
  disableFormControls(): void {
    this.itemMasterForm.get('branch')?.disable();
    this.itemMasterForm.get('itemcode')?.disable();
    this.itemMasterForm.get('active')?.disable();
    this.itemMasterForm.get('itemname')?.disable();
    this.itemMasterForm.get('arabicname')?.disable();
    this.itemMasterForm.get('basicunit')?.disable();
    this.itemMasterForm.get('barcodeno')?.disable();
    this.itemMasterForm.get('category')?.disable();
    this.itemMasterForm.get('unique')?.disable();
    this.itemMasterForm.get('stockitem')?.disable();
    this.itemMasterForm.get('costprice')?.disable();
    this.itemMasterForm.get('sellingprice')?.disable();
    this.itemMasterForm.get('mrp')?.disable();
    this.itemMasterForm.get('taxtype')?.disable();
    this.itemMasterForm.get('margin')?.disable();
    this.itemMasterForm.get('marginvalue')?.disable();
    this.itemMasterForm.get('isdisabled')?.disable();
    this.itemMasterForm.get('expiryitem')?.disable();
    this.itemMasterForm.get('finishedgoods')?.disable();
    this.itemMasterForm.get('rawmaterials')?.disable();
    this.itemMasterForm.get('expirydays')?.disable();
    this.itemMasterForm.get('racklocation')?.disable();
    this.itemMasterForm.get('discount')?.disable();
    this.itemMasterForm.get('hsncode')?.disable();
    this.itemMasterForm.get('parentitem')?.disable();
    this.itemMasterForm.get('quality')?.disable();
    this.itemMasterForm.get('modelno')?.disable();
    this.itemMasterForm.get('color')?.disable();
    this.itemMasterForm.get('brancdname')?.disable();
    this.itemMasterForm.get('countryoforigin')?.disable();
    this.itemMasterForm.get('manufacturer')?.disable();
    this.itemMasterForm.get('rol')?.disable();
    this.itemMasterForm.get('purchaseunit')?.disable();
    this.itemMasterForm.get('sellingunit')?.disable();
    this.itemMasterForm.get('invaccount')?.disable();
    this.itemMasterForm.get('salesaccount')?.disable();
    this.itemMasterForm.get('costaccount')?.disable();
    this.itemMasterForm.get('purchaseaccount')?.disable();
  }
  getPageID(): void {
    this.serviceBase.dataSharingService.currentPageInfo$
      .pipe(
        filter((pageInfo) => pageInfo && pageInfo.id !== undefined),
        take(1),
        takeUntilDestroyed(this.serviceBase.destroyRef)
      )
      .subscribe((pageInfo) => {
        this.currentPageInfo = pageInfo;
        this.pageId = this.currentPageInfo?.id ?? 0;
      });
  }

  onUnitGridActionBegin(args: any): void {
    if (args.requestType === 'save') {
      // Handle save action if needed
      this.itemUnitDetails.set([...this.itemUnitDetails()]);
    } else if (args.requestType === 'delete') {
      // Handle delete action
      const index = args.rowIndex;
      const updatedData = this.itemUnitDetails().filter((_, i) => i !== index);
      this.itemUnitDetails.set(updatedData);
    }
  }

  onUnitGridActionComplete(args: any): void {
    if (args.requestType === 'save') {
      // Update the signal after save
      this.itemUnitDetails.set([...this.itemUnitDetails()]);
    }
  }

  onBasicUnitSelectedFromGrid(event: any, rowData: any): void {
    const selectedUnit = event?.itemData?.unit || event;
    const rowIndex = this.itemUnitDetails().findIndex(
      (item) => item === rowData
    );

    if (rowIndex !== -1) {
      this.onBasicUnitSelected(selectedUnit, rowIndex);
    }
  }
}
