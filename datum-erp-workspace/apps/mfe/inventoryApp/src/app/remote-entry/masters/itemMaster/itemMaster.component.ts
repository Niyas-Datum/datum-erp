import { ChangeDetectorRef,Component,DestroyRef, inject,Input,OnInit,signal, ViewChild } from '@angular/core';
import { BaseComponent } from '@org/architecture';
import { filter, firstValueFrom, take } from 'rxjs';
import { InventoryAppService } from '../../http/inventory-app.service';
import { EndpointConstant } from '@org/constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Category,CountryOfOrigin, ItemBrand,ItemColor,ItemHistory,ItemMaster,parentItem,SelectedCategory,  TaxType,  UnitData,  Account,  Quality} from '../model/pItemMasters.model';
import { MultiColumnComboBoxComponent } from '@syncfusion/ej2-angular-multicolumn-combobox';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseService, LocalStorageService } from '@org/services';
import { BranchDto } from '@org/models';
import { GridComponent } from '@syncfusion/ej2-angular-grids';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';

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
  @ViewChild('addUnitDialog', { static: false })
  addUnitDialog!: DialogComponent;
  itemMasterForm = this.formUtil.thisForm;
  private httpService = inject(InventoryAppService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
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
  selectedBranches: BranchDto[] = [];

  selectedBranchId = 0;
  filledBranchId = 0;
  currentBranchID = signal<number>(1);
  currentBranch = signal<number>(1);
  itemUnitDetails = signal<any[]>([]);

  addUnitDialogVisible = false;
  addUnitDialogSelectedUnitObj: any = null;
  /** When set, Save in Add Unit dialog updates this row index instead of adding */
  editingUnitIndex: number | null = null;
  addUnitFormData: {
    unit: string;
    basicUnit: string;
    factor: number;
    purchaseRate: number;
    sellingPrice: number;
    mrp: number;
    wholeSalePrice: number;
    retailPrice: number;
    wholeSalePrice2: number;
    retailPrice2: number;
    lowestRate: number;
    barcode: string | null;
    active: boolean;
  } = this.getDefaultAddUnitFormData();
  /** Unique basic units for Add Unit dialog dropdown */
  addUnitDialogBasicUnitOptions: { unit: string }[] = [];
  addUnitDialogButtons = [
    {
      click: () => this.saveAddUnitFromDialog(),
      buttonModel: { content: 'Save', cssClass: 'e-flat', isPrimary: true },
    },
    {
      click: () => this.closeAddUnitDialog(),
      buttonModel: { content: 'Cancel', cssClass: 'e-flat', isPrimary: false },
    },
  ];

  getDefaultAddUnitFormData() {
    return {
      unit: '',
      basicUnit: '',
      factor: 0,
      purchaseRate: 0,
      sellingPrice: 0,
      mrp: 0,
      wholeSalePrice: 0,
      retailPrice: 0,
      wholeSalePrice2: 0,
      retailPrice2: 0,
      lowestRate: 0,
      barcode: null as string | null,
      active: true,
    };
  }

  /** Safely get unit display string (handles object { unit: "PCS" } or plain string) */
  
  getUnitDisplay(unit: any): string {
  if (!unit) return '';

  // If it's object
  if (typeof unit === 'object') {
    return unit.unit ?? '';
  }

  // If it's string
  if (typeof unit === 'string') {
    return unit;
  }

  return '';
}


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
  selectedSellingUnitObj = {} as UnitData;
  allSellingUnits = [] as Array<UnitData>;
  updatedPurchaseUnit = '';
  selectedPurchaseUnitObj = {} as UnitData;
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

  imageData: string | ArrayBuffer | null = null;

  selectedInvAccountId = 0;
  selectedInvAccountName = '';
  invAccountOptions: any = [];
  allInvAccounts = [] as Array<Account>;

  basicUnitFields = [
    { field: 'unit', header: 'Unit', width: 50 },
    { field: 'basicunit', header: 'Basic Unit', width: 50 },
    { field: 'factor', header: 'Factor', width: 50 },
  ];
  categoryFields = [
    { field: 'code', header: 'Code', width: 50 },
    { field: 'description', header: 'Category', width: 50 },
  ];
  parentItemFields = [
    { field: 'itemCode', header: 'ItemCode', width: 50 },
    { field: 'itemName', header: 'ItemName', width: 50 },
    { field: 'id', header: 'ID', width: 50 },

  ];
  itemColorFields = [
    { field: 'code', header: 'Code', width: 50 },
    { field: 'value', header: 'Color', width: 50 },
  ];
  itemBrandFields = [
    { field: 'code', header: 'Code', width: 50 },
    { field: 'value', header: 'Value', width: 50 },
    { field: 'id', header: 'ID', width: 60}
  ];
  countryOfOriginFields = [
    { field: 'code', header: 'Code', width: 50 },
    { field: 'value', header: 'Value', width: 50 },
    { field: 'id', header: 'ID', width: 50 }
  ];

  itemHistoryFilterSettings: object = {
    type: 'Menu',
    showFilterBarStatus: false,
    immediateModeDelay: 0,
  };

  isDisabled=true;
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
    this.getPageID();
    this.disableFormControls();
    this.SetPageType(1);
    this.fetchAllBranches();
    this.fetchUnitDropdown();
    this.fetchAllTaxTypes();
    this.fetchItemQuality();
    this.fetchCategories();

     this.fetchParentItems();
     this.fetchItemColors();
     this.fetchItemBrands();
     this.fetchCountryOfOrigin();
     this.fetchAccounts();
  }
    fetchAccounts(): void {
    this.httpService
      .fetch(EndpointConstant.FILLITEMACCOUNT)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.allInvAccounts = response?.data as any;
          this.invAccountOptions = this.allInvAccounts.map((item: any) => item.name);
          this.allSalesAccounts = response?.data as any;
          this.salesAccountOptions = this.allSalesAccounts.map((item: any) => item.name);
          this.allPurchaseAccounts = response?.data as any;
          this.purchaseAccountOptions = this.allPurchaseAccounts.map((item: any) => item.name);
          this.allCostAccounts = response?.data as any;
          this.costAccountOptions = this.allCostAccounts.map((item: any) => item.name);
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

    fetchCountryOfOrigin(): void {
    this.httpService
      .fetch(EndpointConstant.FILLITEMORIGIN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.allCountryOfOrigin = (response as any)?.data[0];
          this.countryOfOriginOptions = this.allCountryOfOrigin.map((item: any) => ({
            code: item.code,
            value: item.value,
            id: item.id
          }));
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

    fetchParentItems(): void {
    this.httpService
      .fetch(EndpointConstant.FILLPARENTITEMS)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.allParentItems = response?.data as any;
          this.parentItemOptions = this.allParentItems.map((item: any) => ({
            itemCode: item.itemCode,
            itemName: item.itemName,
            id: item.id
          }));
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

   fetchItemColors(): void {
    this.httpService
      .fetch(EndpointConstant.FILLITEMCOLOR)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.allItemColors = (response as any)?.data[0];
          this.itemColorOptions = this.allItemColors.map((item: any) => ({
            code: item.code,
            value: item.value,
            id: item.id
          }));
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

    fetchItemBrands(): void {
    this.httpService
      .fetch(EndpointConstant.FILLITEMBRAND)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.allItemBrands = (response as any)?.data[0];
          this.itemBrandOptions = this.allItemBrands.map((item: any) => ({
            value: item.value,
            id: item.id
          }));
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  updateUnitDetail(index: number, field: string, value: any): void {
    const updatedDetails = [...this.itemUnitDetails()];
    if (index >= 0 && index < updatedDetails.length) {
      const row = updatedDetails[index];
      const numericFields = ['factor', 'purchaseRate', 'sellingPrice', 'mrp', 'wholeSalePrice', 'retailPrice', 'wholeSalePrice2', 'retailPrice2', 'lowestRate'];
      if (field === 'unit' && typeof value === 'object') {
        updatedDetails[index] = { ...row, unit: value };
      } else if (field === 'active') {
        updatedDetails[index] = { ...row, [field]: !!value };
      } else if (field === 'barcode') {
        updatedDetails[index] = { ...row, [field]: value ?? '' };
      } else if (numericFields.includes(field)) {
        updatedDetails[index] = { ...row, [field]: parseFloat(value) || 0 };
      } else {
        updatedDetails[index] = { ...row, [field]: value };
      }
      this.itemUnitDetails.set(updatedDetails);
    }
  }

  override async LeftGridInit() {
    this.pageheading = 'Item Master';
    try {
      const url = this.pageId
        ? `${EndpointConstant.FILLALLITEMMASTER}?pageId=${this.pageId}`
        : EndpointConstant.FILLALLITEMMASTER;
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(url)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );
      const rawData = res?.data ?? (Array.isArray(res) ? res : []);
      this.leftGrid.leftGridData = Array.isArray(rawData) ? [...rawData] : [];
      const arr = this.leftGrid.leftGridData;
      this.lastItemID = arr.length > 0 ? (arr[arr.length - 1]?.id ?? 0) : 0;
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
          const itemDetails = this.currentItemMaster?.item;
          if (!itemDetails) {
            return;
          }
          // Support multiple API response shapes: unit.data, unit (array), itemUnit
          const master = this.currentItemMaster as any;
          const rawUnits =
            master.unit?.data ??
            (Array.isArray(master.unit) ? master.unit : null) ??
            master.itemUnit ??
            [];
          const unitArray = Array.isArray(rawUnits) ? rawUnits : [];
          if (unitArray.length > 0) {
            const units = unitArray.map((itemunit: any) => ({
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
            }));
            this.itemUnitDetails.set(units);
            this.cdr.detectChanges();
            setTimeout(() => {
              if (this.unitDetailsGrid) {
                this.unitDetailsGrid.dataSource = this.itemUnitDetails();
                this.unitDetailsGrid.refresh();
              }
            }, 0);
          }

          //Assign history details of an item ....
          this.allItemHistoryDetails =
            this.currentItemMaster.history?.data ?? [];
          //set stock value...
          this.stockToDisplay =
            this.currentItemMaster.stock?.data?.[0]?.stock ?? 0;
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
    // Use getRawValue() so disabled controls are included (form.value excludes them)
    const fv = this.itemMasterForm.getRawValue();
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
        unit: '',
        basicUnit: '',
        factor: 0,
      };
    }

    if (Object.keys(this.selectedPurchaseUnitObj).length === 0) {
      this.selectedPurchaseUnitObj = {
        unit: '',
        basicUnit: '',
        factor: 0,
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

    // Resolve unit: use selectedBasicUnitObj, or from form basicunit so payload unit is never empty
    const rawBasicUnit = this.itemMasterForm.get('basicunit')?.value;
    const basicUnitStr =
      rawBasicUnit != null && typeof rawBasicUnit === 'object' && (rawBasicUnit as any).unit != null
        ? (rawBasicUnit as any).unit
        : rawBasicUnit != null && rawBasicUnit !== ''
          ? String(rawBasicUnit)
          : '';
    const payloadUnit =
      this.selectedBasicUnitObj && (this.selectedBasicUnitObj as any).unit != null
        ? this.selectedBasicUnitObj
        : basicUnitStr !== ''
          ? this.allBasicUnits.find((u) => u.unit === basicUnitStr) ?? {
              unit: basicUnitStr,
              basicUnit: basicUnitStr,
              factor: 1,
            }
          : ({} as UnitData);

    // Read signal value so itemUnit is a real array, not the signal reference
    const rawItemUnitArray = this.itemUnitDetails();
    // Build itemUnit array to match API: { unitID, unit: {unit, basicUnit, factor}, basicUnit, factor, sellingPrice, purchaseRate, mrp, wholeSalePrice, retailPrice, wholeSalePrice2, retailPrice2, lowestRate, barcode, active }
    const itemUnitArray = (Array.isArray(rawItemUnitArray) ? rawItemUnitArray : []).map((row: any) => {
      let unitObj = row?.unit;
      const unitStr = typeof unitObj?.unit === 'string' ? unitObj.unit : (unitObj?.unit?.unit ?? '');
      const hasUnit = unitObj != null && (unitStr !== '' || (unitObj?.basicUnit != null && unitObj.basicUnit !== ''));
      if (!hasUnit && (row?.basicUnit != null || row?.basicunit != null)) {
        const bu = row.basicUnit ?? row.basicunit;
        if (typeof bu === 'object' && bu !== null) {
          unitObj = {
            unit: bu.unit ?? bu.basicUnit ?? '',
            basicUnit: bu.basicUnit ?? bu.basicunit ?? bu.unit ?? '',
            factor: bu.factor ?? row.factor ?? 1,
          };
        } else {
          const buStr = String(bu ?? '').trim();
          unitObj = { unit: buStr, basicUnit: buStr, factor: row?.factor ?? 1 };
        }
      }
      const u = unitObj ?? { unit: '', basicUnit: '', factor: 1 };
      const buStr = u.basicUnit ?? u.basicunit ?? u.unit ?? row?.basicUnit ?? row?.basicunit ?? '';
      return {
        unitID: row?.unitID ?? 0,
        unit: { unit: u.unit ?? '', basicUnit: buStr, factor: u.factor ?? row?.factor ?? 1 },
        basicUnit: buStr,
        factor: row?.factor ?? u.factor ?? 1,
        sellingPrice: row?.sellingPrice ?? 0,
        purchaseRate: row?.purchaseRate ?? 0,
        mrp: row?.mrp ?? null,
        wholeSalePrice: row?.wholeSalePrice ?? null,
        retailPrice: row?.retailPrice ?? null,
        wholeSalePrice2: row?.wholeSalePrice2 ?? null,
        retailPrice2: row?.retailPrice2 ?? null,
        lowestRate: row?.lowestRate ?? 0,
        barcode: row?.barcode ?? null,
        active: row?.active ?? true,
      };
    });

    // Category payload: API expects { id, code, category } - never null. Use selectedCategoryObj or form value (combo may bind full row).
    const cat =
      this.selectedCategoryObj &&
      ((this.selectedCategoryObj as any).id != null || (this.selectedCategoryObj as any).code != null)
        ? this.selectedCategoryObj
        : this.itemMasterForm.get('category')?.value != null &&
            typeof this.itemMasterForm.get('category')?.value === 'object'
          ? this.itemMasterForm.get('category')?.value
          : null;
    let categoryName = (cat as any)?.category ?? (cat as any)?.description ?? '';
    if (!categoryName && cat != null && ((cat as any).id != null || (cat as any).code != null)) {
      const found = this.allCategories.find(
        (c: any) => c.id === (cat as any).id || c.code === (cat as any).code
      );
      categoryName = found?.description ?? found?.code ?? '';
    }
    const payloadCategory =
      cat != null && ((cat as any).id != null || (cat as any).code != null || categoryName !== '')
        ? {
            id: (cat as any).id ?? 0,
            code: (cat as any).code ?? '',
            category: String(categoryName),
          }
        : { id: 0, code: '', category: '' };

    // Normalize unit objects to API format: { unit, basicunit, factor } (lowercase basicunit for top-level)
    const toUnitPayload = (u: any) => {
      if (!u) return { unit: '', basicunit: '', factor: 1 };
      const unitStr = typeof u.unit === 'string' ? u.unit : (u.unit?.unit ?? '');
      const bu = u.basicUnit ?? u.basicunit ?? unitStr ?? '';
      return { unit: unitStr || bu, basicunit: bu, factor: u.factor ?? 1 };
    };
    const parentObj = this.selectedParentItemObj && Object.keys(this.selectedParentItemObj).length > 0
      ? this.selectedParentItemObj
      : { id: 0, itemCode: '', itemName: '' };
    const parentPayload = {
      id: (parentObj as any).id ?? 0,
      itemCode: String((parentObj as any).itemCode ?? ''),
      itemName: String((parentObj as any).itemName ?? ''),
    };

//     const payload = {
//       id: this.isUpdate ? this.selectedItemMasterId() : 0,
//       itemCode: fv.itemcode ?? '',
//       itemName: fv.itemname ?? '',
//       arabicName: fv.arabicname ?? '',
//      // unit: toUnitPayload(payloadUnit),
//      unit: {
//   unit: payloadUnit.unit,
//   basicUnit: payloadUnit.basicUnit,
//   factor: payloadUnit.factor
// },
//       barCode:
//         this.itemMasterForm.get('barcodeno')?.value != null
//           ? this.itemMasterForm.get('barcodeno')?.value.toString()
//           : '',
//       category: payloadCategory,
//       isUniqueItem: fv.unique ?? false,
//       stockItem: fv.stockitem ?? true,
//       costPrice: fv.costprice ?? 0,
//       sellingPrice: fv.sellingprice ?? 0,
//       mrp: fv.mrp ?? null,
//       margin: fv.margin ?? 0,
//       marginValue: fv.marginvalue ?? null,
//       taxType: this.selectedTaxTypeObj ?? {},
//       isExpiry: fv.expiryitem ?? false,
//       expiryPeriod: fv.expirydays ?? 0,
//       isFinishedGood: fv.finishedgoods ?? true,
//       isRawMaterial: fv.rawmaterials ?? false,
//       location: fv.racklocation ?? '',
//       itemDisc: fv.discount ?? 0,
//       hsn: fv.hsncode ?? '',
//       parent: parentPayload,
//       quality: this.selectedItemQualityObj ?? {},
//       modelNo: fv.modelno ?? '',
//       color: this.selectedItemColorObj ?? {},
//       brand: this.selectedItemBrandObj ?? {},
//       countryOfOrigin: this.selectedCountryOfOriginObj ?? {},
//       rol: fv.rol ?? 0,
//       roq: fv.roq ?? 0,
//       manufacturer: fv.manufacturer ?? null,
//       weight: fv.weight ?? 0,
//       sellingUnit: toUnitPayload(this.selectedSellingUnitObj),
//       oemNo: fv.oemno ?? '',
//       purchaseUnit: toUnitPayload(this.selectedPurchaseUnitObj),
//       isGroup: fv.groupitem ?? true,
//       active: fv.active ?? true,

// //       partNo: fv.stockcode ?? '',
// // shipMark: fv.shipmark ?? '',
// // paintMark: '',

//       invAccount: { id: this.selectedInvAccountId ?? 0, name: this.selectedInvAccountName ?? '' },
//       salesAccount: { id: this.selectedSalesAccountId ?? 0, name: this.selectedSalesAccountName ?? '' },
//       costAccount: { id: this.selectedCostAccountId ?? 0, name: this.selectedCostAccountName ?? '' },
//       purchaseAccount: { id: this.selectedPurchaseAccountId ?? 0, name: this.selectedPurchaseAccountName ?? '' },
//       remarks: fv.remarks ?? '',
//       itemUnit: Array.isArray(itemUnitArray) ? itemUnitArray : [],
//       branch: Array.isArray(this.selectedBranches) ? this.selectedBranches : [],
//       imageFile: this.imageData ?? null,
//     };

const payload = {
  id: this.isUpdate ? this.selectedItemMasterId() : 0,

  itemCode: fv.itemcode ?? '',
  itemName: fv.itemname ?? '',
  arabicName: fv.arabicname ?? '',

  unit: {
    unit: payloadUnit?.unit ?? '',
    basicUnit: payloadUnit?.basicUnit ?? '',
    factor: payloadUnit?.factor ?? 0
  },

  barCode: fv.barcodeno?.toString() ?? '',

  category: {
    id: payloadCategory?.id ?? 0,
    code: payloadCategory?.code ?? '',
    category: payloadCategory?.category ?? ''
  },

  isUniqueItem: fv.unique ?? false,
  stockItem: fv.stockitem ?? true,

  costPrice: fv.costprice ?? 0,
  sellingPrice: fv.sellingprice ?? 0,
  mrp: fv.mrp ?? 0,

  margin: fv.margin ?? 0,
  marginValue: fv.marginvalue ?? 0,

  taxType: {
    id: this.selectedTaxTypeObj?.id ?? 0,
    name: this.selectedTaxTypeObj?.name ?? ''
  },

  isExpiry: fv.expiryitem ?? false,
  expiryPeriod: fv.expirydays ?? 0,

  isFinishedGood: fv.finishedgoods ?? true,
  isRawMaterial: fv.rawmaterials ?? false,

  location: fv.racklocation ?? '',
  itemDisc: fv.discount ?? 0,
  hsn: fv.hsncode ?? '',

  parent: {
    id: parentPayload?.id ?? 0,
    itemCode: parentPayload?.itemCode ?? '',
    itemName: parentPayload?.itemName ?? ''
  },

  quality: {
    id: this.selectedItemQualityObj?.id ?? 0,
    value: this.selectedItemQualityObj?.value ?? ''
  },

  modelNo: fv.modelno ?? '',

  color: {
    id: this.selectedItemColorObj?.id ?? 0,
    name: this.selectedItemColorObj?.name ?? '',
    code: this.selectedItemColorObj?.code ?? '',
    description: this.selectedItemColorObj?.description ?? ''
  },

  brand: {
    id: this.selectedItemBrandObj?.id ?? 0,
    name: this.selectedItemBrandObj?.name ?? '',
    code: this.selectedItemBrandObj?.code ?? '',
    description: this.selectedItemBrandObj?.description ?? ''
  },

  countryOfOrigin: {
    id: this.selectedCountryOfOriginObj?.id ?? 0,
    name: this.selectedCountryOfOriginObj?.name ?? '',
    code: this.selectedCountryOfOriginObj?.code ?? '',
    description: this.selectedCountryOfOriginObj?.description ?? ''
  },

  rol: fv.rol ?? 0,
  partNo: fv.partno ?? '',
  roq: fv.roq ?? 0,

  manufacturer: fv.manufacturer ?? '',
  weight: fv.weight ?? 0,

  shipMark: fv.shipmark ?? '',
  paintMark: fv.paintmark ?? '',

  sellingUnit: {
    unit: this.selectedSellingUnitObj?.unit ?? '',
    basicUnit: this.selectedSellingUnitObj?.basicUnit ?? '',
    factor: this.selectedSellingUnitObj?.factor ?? 0
  },

  oemNo: fv.oemno ?? '',

  purchaseUnit: {
    unit: this.selectedPurchaseUnitObj?.unit ?? '',
    basicUnit: this.selectedPurchaseUnitObj?.basicUnit ?? '',
    factor: this.selectedPurchaseUnitObj?.factor ?? 0
  },

  isGroup: fv.groupitem ?? true,
  active: fv.active ?? true,

  invAccount: {
    id: this.selectedInvAccountId ?? 0,
    name: this.selectedInvAccountName ?? ''
  },

  salesAccount: {
    id: this.selectedSalesAccountId ?? 0,
    name: this.selectedSalesAccountName ?? ''
  },

  costAccount: {
    id: this.selectedCostAccountId ?? 0,
    name: this.selectedCostAccountName ?? ''
  },

  purchaseAccount: {
    id: this.selectedPurchaseAccountId ?? 0,
    name: this.selectedPurchaseAccountName ?? ''
  },

  remarks: fv.remarks ?? '',

  itemUnit: (itemUnitArray ?? []).map((u:any) => ({
    unitID: u.unitID ?? 0,
    unit: {
      unit: u.unit?.unit ?? '',
      basicUnit: u.unit?.basicUnit ?? '',
      factor: u.unit?.factor ?? 0
    },
    basicUnit: u.basicUnit ?? '',
    factor: u.factor ?? 0,
    purchaseRate: u.purchaseRate ?? 0,
    sellingPrice: u.sellingPrice ?? 0,
    mrp: u.mrp ?? 0,
    wholeSalePrice: u.wholeSalePrice ?? 0,
    retailPrice: u.retailPrice ?? 0,
    wholeSalePrice2: u.wholeSalePrice2 ?? 0,
    retailPrice2: u.retailPrice2 ?? 0,
    lowestRate: u.lowestRate ?? 0,
    barCode: u.barCode ?? '',
    active: u.active ?? true,
    status: u.status ?? 0
  })),

  branch: (this.selectedBranches ?? []).map((b:any) => ({
    id: b.id ?? 0,
    name: b.name ?? ''
  })),

  imageFile: this.imageData ?? ''
};
    console.log("save payload:", payload);
    console.log("SAVE PAYLOAD:", JSON.stringify(payload, null, 2));
    if (this.isUpdate) {
      this.updateCallback(payload, this.selectedItemMasterId());
    } else {
      this.createCallback(payload);
    }
  }

  updateCallback(payload: any, selectedItemMasterId: any) {
    console.log('Updating ID:', selectedItemMasterId);
     console.log('Payload:', payload);
    this.httpService.patch( EndpointConstant.UPDATEITEMMASTER + selectedItemMasterId+'&pageId='+this.pageId, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response: any) => {
          const resp = response as any;
          const message = resp?.data?.msg ?? 'Item updated successfully!';
          const httpCode = resp?.httpCode ?? resp?.data?.httpCode;
          const isFailure = resp?.isValid === false || (typeof httpCode === 'number' && httpCode >= 400);
          const ok = !isFailure;
          if (ok) {
            this.toast.success(message);
            await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
          this.cdr.detectChanges();
          this.itemMasterForm.disable();
          } else {
            this.toast.error('Update failed: ' + (message || ''));
          }
        },
        error: (error) => {
          const message = this.getSaveErrorMessage(error);
          this.baseService.showCustomDialogue(message);
        },
      });
  }

  createCallback(payload: any) {
    this.httpService
      .post(EndpointConstant.SAVEITEMMASTER + '?pageId=' + this.pageId, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          const resp = response as any;
          const message = resp?.data?.msg ?? 'Item saved successfully!';
          const httpCode = resp?.httpCode ?? resp?.data?.httpCode;
          const isFailure = resp?.isValid === false || (typeof httpCode === 'number' && httpCode >= 400);
          const ok = !isFailure;
          if (ok) {
            this.toast.success(message);
            await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
          this.cdr.detectChanges();
          this.itemMasterForm.disable();
          } else {
            this.toast.error('Save failed: ' + (message || ''));
          }
        },
        error: (error) => {
          const message = this.getSaveErrorMessage(error);
          this.baseService.showCustomDialogue(message);
        },
      });
  }

  private getSaveErrorMessage(error: any): string {
    const body = error?.error;
    if (body?.errors && typeof body.errors === 'object') {
      const lines: string[] = [];
      for (const [key, messages] of Object.entries(body.errors)) {
        const list = Array.isArray(messages) ? messages : [String(messages)];
        const label = key.replace(/^\$\.?/, '') || 'Field'; // e.g. "$.costPrice" -> "costPrice"
        list.forEach((msg: string) => lines.push(`${label}: ${msg}`));
      }
      if (lines.length > 0) return lines.join('\n');
    }
    return (
      body?.title ||
      body?.message ||
      error?.message ||
      'Save failed. Please try again.'
    );
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
      this.generateItemCode();
    }
  }
  
    generateItemCode() {
    this.httpService
      .fetch(EndpointConstant.FETCHNEWITEMCODE)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          // this.isLoading = false;
          this.itemMasterForm.patchValue({
            itemcode: response.data
          });
        },
        error: (error) => {
          // this.isLoading = false;
          console.error('An Error Occured', error);
        },
      });
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
    this.isUpdate=true;
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
      this.httpService
        .fetch(EndpointConstant.GENERATEBARCODE)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
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
            console.error('An Error Occured', error);
          },
        });
    }
  }

  generateBarCodeForAddUnitDialog(): void {
    this.httpService
      .fetch(EndpointConstant.GENERATEBARCODE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const barcode = (response?.data as any)?.[0]?.barcode?.toString() ?? null;
          this.addUnitFormData.barcode = barcode;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Generate barcode failed', error);
        },
      });
  }

  fetchAllTaxTypes(): void {
    this.httpService
      .fetch(EndpointConstant.FILLTAXDROPDOWN)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {

          this.allTaxTypes = response?.data as any;
          // this.itemMasterForm.patchValue({
          //   taxtype: this.allTaxTypes ? this.allTaxTypes[0].id : null,
          // });
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }
  
  fetchItemQuality(): void {
    this.httpService
      .fetch(EndpointConstant.FILLQUALITY)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const raw = response?.data as any;
          // API returns data as [ [ {...}, {...} ] ] - use first element
          const list = Array.isArray(raw) && raw.length > 0
            ? (Array.isArray(raw[0]) ? raw[0] : raw)
            : (raw?.Quality ?? raw?.data ?? []);
          this.allQualities = Array.isArray(list) ? list : [];
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }


  fetchUnitDropdown(): void {
    this.httpService
      .fetch(EndpointConstant.FILLUNITSPOPUP)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
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
          console.error('An Error Occured', error);
        },
      });
  }

  async fetchCategories(): Promise<void> {
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
    const branchId = event?.value ?? event?.itemData?.id;
    this.currentBranchID.set(branchId);

    this.itemMasterForm.patchValue({
      branch: branchId,
    });

    // Keep selectedBranches in sync so payload has the selected branch
    const branch = this.allBranches()?.find((b: any) => b.id == branchId || b.id === branchId);
    if (branch) {
      this.selectedBranches = [branch];
    }
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

  openAddUnitDialog(): void {
    const details = this.itemUnitDetails();
    const firstAvailableUnit =
      (this.allBasicUnits || []).length > 0
        ? (this.allBasicUnits as any[])[0]
        : null;
    const defaultUnitObj = firstAvailableUnit
      ? {
          unit: firstAvailableUnit.unit ?? firstAvailableUnit.basicUnit ?? '',
          basicUnit:
            typeof firstAvailableUnit.basicUnit === 'object'
              ? (firstAvailableUnit.basicUnit as any)?.unit ??
                firstAvailableUnit.basicUnit
              : firstAvailableUnit.basicUnit ?? firstAvailableUnit.unit ?? '',
          factor: firstAvailableUnit.factor ?? 1,
        }
      : { unit: '', basicUnit: '', factor: 1 };

    if (details.length > 0 && firstAvailableUnit) {
      const hasEmptyUnit = details.some(
        (unititem: any) => !unititem.unit?.unit || unititem.unit.unit.trim() === ''
      );
      if (hasEmptyUnit) {
        const updatedDetails = details.map((unititem: any) => {
          if (!unititem.unit?.unit || unititem.unit.unit.trim() === '') {
            return {
              ...unititem,
              unit: { ...defaultUnitObj },
              basicUnit:
                unititem.basicUnit ??
                (typeof firstAvailableUnit.basicUnit === 'object'
                  ? firstAvailableUnit.basicUnit
                  : { unit: defaultUnitObj.basicUnit }),
            };
          }
          return unititem;
        });
        this.itemUnitDetails.set(updatedDetails);
        if (this.unitDetailsGrid) {
          this.unitDetailsGrid.dataSource = this.itemUnitDetails();
          this.unitDetailsGrid.refresh();
        }
        this.cdr.detectChanges();
      }
    }
    this.addUnitFormData = this.getDefaultAddUnitFormData();
    this.addUnitDialogSelectedUnitObj = null;
    this.editingUnitIndex = null;
    // Build basic unit options (unique unit names from allBasicUnits for use as basic units)
    const seen = new Set<string>();
    const names: string[] = [];
    (this.allBasicUnits || []).forEach((u: any) => {
      const name = typeof u?.basicUnit === 'object' ? (u.basicUnit as any)?.unit : (u?.basicUnit ?? u?.unit ?? '');
      const s = name ? String(name).trim() : '';
      if (s && !seen.has(s)) {
        seen.add(s);
        names.push(s);
      }
    });
    if (names.length === 0 && (this.allBasicUnits || []).length > 0) {
      (this.allBasicUnits as any[]).forEach((u: any) => {
        const s = (u?.unit ?? '').trim();
        if (s && !seen.has(s)) {
          seen.add(s);
          names.push(s);
        }
      });
    }
    this.addUnitDialogBasicUnitOptions = names.map((unit) => ({ unit }));
    if (this.itemUnitDetails().length > 0) {
      const first = this.itemUnitDetails()[0].basicUnit;
      this.addUnitFormData.basicUnit =
        typeof first === 'object' && first != null
          ? (first as any)?.unit ?? ''
          : first != null && first !== undefined
            ? String(first)
            : '';
    }
    if (this.itemUnitDetails().length === 0) {
      this.addUnitFormData.barcode =
        this.itemMasterForm.get('barcodeno')?.value != null
          ? this.itemMasterForm.get('barcodeno')?.value.toString()
          : null;
      this.addUnitFormData.purchaseRate =
        this.itemMasterForm.get('costprice')?.value != null
          ? parseFloat(this.itemMasterForm.get('costprice')?.value)
          : 0;
      this.addUnitFormData.sellingPrice =
        this.itemMasterForm.get('sellingprice')?.value != null
          ? parseFloat(this.itemMasterForm.get('sellingprice')?.value)
          : 0;
      this.addUnitFormData.mrp =
        this.itemMasterForm.get('mrp')?.value != null
          ? parseFloat(this.itemMasterForm.get('mrp')?.value)
          : 0;
    }
    this.addUnitDialogVisible = true;
    this.cdr.detectChanges();
  }

  closeAddUnitDialog(): void {
    this.addUnitDialogVisible = false;
    this.addUnitFormData = this.getDefaultAddUnitFormData();
    this.addUnitDialogSelectedUnitObj = null;
    this.editingUnitIndex = null;
    this.cdr.detectChanges();
  }

  onAddUnitDialogOpen(): void {}
  onAddUnitDialogCreated(): void {}

  onAddUnitDialogUnitChange(event: any): void {
    this.addUnitDialogSelectedUnitObj = event?.itemData ?? null;
    if (this.addUnitDialogSelectedUnitObj) {
      const bu = this.addUnitDialogSelectedUnitObj.basicUnit ?? this.addUnitDialogSelectedUnitObj.unit;
      this.addUnitFormData.basicUnit =
        typeof bu === 'object' && bu != null ? (bu as any)?.unit ?? '' : bu != null && bu !== undefined ? String(bu) : '';
    }
  }

  onAddUnitFormNumberChange(
    field: keyof typeof this.addUnitFormData,
    event: any
  ): void {
    const val = event?.value ?? event?.target?.value;
    const num = parseFloat(val);
    if (field in this.addUnitFormData && typeof this.addUnitFormData[field] === 'number') {
      (this.addUnitFormData as any)[field] = isNaN(num) ? 0 : num;
    }
  }

  saveAddUnitFromDialog(): void {
    const unitStr = this.addUnitFormData.unit?.trim() ?? '';
    if (!unitStr) {
      this.baseService.showCustomDialogue('Please select a Unit.');
      return;
    }
    let selectedUnitObj = this.addUnitDialogSelectedUnitObj;
    if (!selectedUnitObj && this.allBasicUnits?.length) {
      selectedUnitObj = this.allBasicUnits.find((u: any) => u.unit === unitStr) ?? null;
    }
    if (!selectedUnitObj) {
      this.baseService.showCustomDialogue('Invalid unit selection.');
      return;
    }
    // Use Basic Unit from popup if set; otherwise derive from first row or selected unit
    let basicUnitStr: string = (this.addUnitFormData.basicUnit ?? '').trim();
    if (!basicUnitStr && this.itemUnitDetails().length > 0) {
      const first = this.itemUnitDetails()[0].basicUnit;
      basicUnitStr =
        typeof first === 'object' && first != null
          ? (first as any)?.unit ?? ''
          : (first != null && first !== undefined ? String(first) : '');
    }
    if (!basicUnitStr) {
      const bu = selectedUnitObj?.basicUnit ?? selectedUnitObj?.unit ?? unitStr;
      basicUnitStr =
        typeof bu === 'object' && bu != null
          ? (bu as any)?.unit ?? selectedUnitObj?.unit ?? unitStr
          : bu != null && bu !== undefined
            ? String(bu)
            : unitStr;
    }
    if (!basicUnitStr || basicUnitStr.trim() === '') {
      this.baseService.showCustomDialogue('Please select or enter a Basic unit.');
      return;
    }
    const newUnitItem = {
      unitID: 0,
      unit: selectedUnitObj,
      basicUnit: basicUnitStr,
      factor: Number(this.addUnitFormData.factor) || 0,
      sellingPrice: Number(this.addUnitFormData.sellingPrice) || 0,
      purchaseRate: Number(this.addUnitFormData.purchaseRate) || 0,
      mrp: Number(this.addUnitFormData.mrp) || 0,
      wholeSalePrice: Number(this.addUnitFormData.wholeSalePrice) || 0,
      retailPrice: Number(this.addUnitFormData.retailPrice) || 0,
      wholeSalePrice2: Number(this.addUnitFormData.wholeSalePrice2) || 0,
      retailPrice2: Number(this.addUnitFormData.retailPrice2) || 0,
      lowestRate: Number(this.addUnitFormData.lowestRate) || 0,
      barcode: this.addUnitFormData.barcode ?? null,
      active: !!this.addUnitFormData.active,
      status: 0,
    };
    if (this.editingUnitIndex !== null) {
      const arr = [...this.itemUnitDetails()];
      arr[this.editingUnitIndex] = { ...newUnitItem, unitID: arr[this.editingUnitIndex]?.unitID ?? 0 };
      this.itemUnitDetails.set(arr);
    } else {
      this.itemUnitDetails.set([...this.itemUnitDetails(), newUnitItem]);
    }
    this.closeAddUnitDialog();
  }

  editUnitRow(index: number): void {
    const row = this.itemUnitDetails()[index];
    if (!row) return;
    const unitObj = row.unit;
    const unitStr = typeof unitObj === 'object' && unitObj?.unit != null ? String(unitObj.unit) : (row.unit?.unit ?? '');
    const basicUnitStr =
      typeof row.basicUnit === 'object' && row.basicUnit != null
        ? (row.basicUnit as any)?.unit ?? (row.basicUnit as any)?.basicUnit ?? ''
        : row.basicUnit != null && row.basicUnit !== undefined
          ? String(row.basicUnit)
          : '';
    this.addUnitFormData = this.getDefaultAddUnitFormData();
    Object.assign(this.addUnitFormData, {
      unit: unitStr,
      basicUnit: basicUnitStr || unitStr,
      factor: Number(row.factor) || 0,
      purchaseRate: Number(row.purchaseRate) || 0,
      sellingPrice: Number(row.sellingPrice) || 0,
      mrp: Number(row.mrp) || 0,
      wholeSalePrice: Number(row.wholeSalePrice) || 0,
      retailPrice: Number(row.retailPrice) || 0,
      wholeSalePrice2: Number(row.wholeSalePrice2) || 0,
      retailPrice2: Number(row.retailPrice2) || 0,
      lowestRate: Number(row.lowestRate) || 0,
      barcode: row.barcode ?? null,
      active: !!row.active,
    });
    this.addUnitDialogSelectedUnitObj = unitObj && typeof unitObj === 'object' ? unitObj : null;
    if (!this.addUnitDialogSelectedUnitObj && unitStr && this.allBasicUnits?.length) {
      this.addUnitDialogSelectedUnitObj = this.allBasicUnits.find((u: any) => u.unit === unitStr) ?? null;
    }
    this.editingUnitIndex = index;
    this.addUnitDialogVisible = true;
    this.cdr.detectChanges();
  }

  deleteUnitRow(index: number): void {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    const updated = this.itemUnitDetails().filter((_, i) => i !== index);
    this.itemUnitDetails.set(updated);
    if (this.unitDetailsGrid) {
      this.unitDetailsGrid.dataSource = this.itemUnitDetails();
      this.unitDetailsGrid.refresh();
    }
    this.cdr.detectChanges();
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

  onCategorySelected(option: string | any): any {
    // Combo may emit full row object { id, code, description } or a string/number value
    const isObj = option != null && typeof option === 'object';
    const codeStr = isObj ? (option.code ?? option.id ?? '') : String(option ?? '');
    this.itemMasterForm.patchValue({
      category: isObj ? (option.id ?? option.code) : option,
    });
    let selectedCategory: any = {};
    if (isObj && (option.id != null || option.code != null)) {
      selectedCategory = {
        id: option.id ?? 0,
        code: option.code ?? '',
        category: option.description ?? option.category ?? '',
        categoryType: '',
      };
    } else {
      this.allCategories.forEach((item: any) => {
        if (item.code === codeStr || item.id === option) {
          selectedCategory = {
            id: item.id,
            code: item.code,
            category: item.description,
            categoryType: '',
          };
        }
      });
    }
    this.selectedCategoryObj = selectedCategory;
    this.selectedCategory = selectedCategory.code ?? codeStr;
    console.log('Category selected from dropdown:', {
      option,
      selectedCategoryObj: this.selectedCategoryObj,
    });
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
    const value = option || this.itemMasterForm.get('brandname')?.value || '';
    this.itemMasterForm.patchValue({
      brandname: value,
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

    let selectedSellingUnit: UnitData = { unit: '', basicUnit: '', factor: 0 };
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
    let selectedPurchaseUnit: UnitData = { unit: '', basicUnit: '', factor: 0 };
    this.allBasicUnits.forEach(function (item) {
      if (item.unit === value) {
        selectedPurchaseUnit = item;
      }
    });
    this.selectedPurchaseUnitObj = selectedPurchaseUnit;
    this.updatedPurchaseUnit = value;
  }

  onChangeQuality(event: any): void {
  if (!event || event.value == null) return;

  const selectedQuality = this.allQualities.find(
    q => q.id === event.value
  );

  this.selectedItemQualityObj = {
    id: event.value,
    value: selectedQuality?.value || ''
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
    const form = new FormGroup({
      branch: new FormControl({ value: this.currentBranchID(), disabled: false },Validators.required),
      itemcode: new FormControl({ value: '', disabled: false },Validators.required),
      active: new FormControl({ value: '', disabled: false }),
      itemname: new FormControl({ value: '', disabled: false },Validators.required),
      arabicname: new FormControl({ value: '', disabled: false }),
      basicunit: new FormControl({ value: '',disabled: false },Validators.required),
      barcodeno: new FormControl({ value: '', disabled: false }), 
      category: new FormControl({value: null,disabled: false,}), 
      unique: new FormControl({ value: false, disabled: false }),
      stockitem: new FormControl({ value: '', disabled: false }),
      costprice: new FormControl({ value: '', disabled: false }), //, [Validators.required,Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')]
      sellingprice: new FormControl({ value: '',disabled: false,}), //, [Validators.required,Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')]
      mrp: new FormControl({ value: '', disabled: false }), //, [Validators.required,Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')]
      taxtype: new FormControl({ value: null, disabled: false }),
      margin: new FormControl({ value: '', disabled: false }), //, Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')
      marginvalue: new FormControl({value: '', disabled: false,}), //, Validators.pattern('[0-9]+(\.[0-9][0-9]?)?')
      isdisabled: new FormControl({value: false,disabled: false,}),
      expiryitem: new FormControl({value: false,disabled: false,}),
      finishedgoods: new FormControl({value: false,disabled: false}),
      rawmaterials: new FormControl({value: false,disabled: false}),
      expirydays: new FormControl({ value: '',disabled: this.isInputDisabled}),
      racklocation: new FormControl({value: '',disabled: this.isInputDisabled}),
      discount: new FormControl({ value: '', disabled: this.isInputDisabled }),
      hsncode: new FormControl({ value: '', disabled: this.isInputDisabled }),
      parentitem: new FormControl({value: '', disabled: this.isInputDisabled}), //,Validators.required
      quality: new FormControl({ value: '', disabled: this.isInputDisabled }),
      modelno: new FormControl({ value: '', disabled: this.isInputDisabled }),
      color: new FormControl({ value: '', disabled: this.isInputDisabled }),
      brandname: new FormControl({value: '',disabled: this.isInputDisabled}),
      countryoforigin: new FormControl({value: '',disabled: this.isInputDisabled}),
      manufacturer: new FormControl({ value: '', disabled: this.isInputDisabled}),
      rol: new FormControl({ value: '', disabled: this.isInputDisabled }),
      roq: new FormControl({ value: '', disabled: this.isInputDisabled }),
      shipmark: new FormControl({ value: '', disabled: this.isInputDisabled }),
      paintmark: new FormControl({ value: '', disabled: this.isInputDisabled }),
      stockcode: new FormControl({ value: '', disabled: this.isInputDisabled }),
      weight: new FormControl({ value: 0, disabled: this.isInputDisabled }),
      purchaseunit: new FormControl({ value: '',disabled: this.isInputDisabled}), //,Validators.required
      sellingunit: new FormControl({value: '',disabled: this.isInputDisabled}), //,Validators.required
      oemno: new FormControl({ value: '', disabled: this.isInputDisabled }),
      groupitem: new FormControl({ value: '', disabled: this.isInputDisabled }),
      invaccount: new FormControl({ value: '',disabled: this.isInputDisabled || this.isStockItem}),
      salesaccount: new FormControl({ value: '',disabled: this.isInputDisabled || this.isStockItem}),
      costaccount: new FormControl({ value: '',disabled: this.isInputDisabled || this.isStockItem}),
      purchaseaccount: new FormControl({value: '',disabled: this.isInputDisabled || this.isStockItem}),
      remarks: new FormControl({ value: '', disabled: this.isInputDisabled }),
    });
    this.itemMasterForm = form;
    this.formUtil.thisForm = form;
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
    this.itemMasterForm.get('brandname')?.enable();
    this.itemMasterForm.get('countryoforigin')?.enable();
    this.itemMasterForm.get('manufacturer')?.enable();
    this.itemMasterForm.get('rol')?.enable();
    this.itemMasterForm.get('roq')?.enable();
    this.itemMasterForm.get('weight')?.enable();
    this.itemMasterForm.get('shipmark')?.enable();
    this.itemMasterForm.get('paintmark')?.enable();
    this.itemMasterForm.get('stockcode')?.enable();
    this.itemMasterForm.get('oemno')?.enable();
    this.itemMasterForm.get('groupitem')?.enable();
    this.itemMasterForm.get('purchaseunit')?.enable();
    this.itemMasterForm.get('sellingunit')?.enable();
    this.itemMasterForm.get('remarks')?.enable();
    const isStockItem = this.itemMasterForm.get('stockitem')?.value;
    if (!isStockItem) {
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
    this.itemMasterForm.get('brandname')?.disable();
    this.itemMasterForm.get('countryoforigin')?.disable();
    this.itemMasterForm.get('manufacturer')?.disable();
    this.itemMasterForm.get('rol')?.disable();
     this.itemMasterForm.get('roq')?.disable();
    this.itemMasterForm.get('weight')?.disable();
    this.itemMasterForm.get('shipmark')?.disable();
    this.itemMasterForm.get('paintmark')?.disable();
    this.itemMasterForm.get('stockcode')?.disable();
    this.itemMasterForm.get('oemno')?.disable();
    this.itemMasterForm.get('groupitem')?.disable();
    this.itemMasterForm.get('purchaseunit')?.disable();
    this.itemMasterForm.get('sellingunit')?.disable();
    this.itemMasterForm.get('remarks')?.disable();
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
