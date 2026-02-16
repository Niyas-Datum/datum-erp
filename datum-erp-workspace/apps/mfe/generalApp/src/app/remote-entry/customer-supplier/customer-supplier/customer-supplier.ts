import { Component, inject, OnInit, signal, ViewChild, viewChild } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { filter, firstValueFrom, take } from "rxjs";
import { GeneralAppService } from "../../http/general-app.service";
import { BaseService, validEmail, validPhoneNumber,integerOnly, decimalOnly } from "@org/services";
import { ActivatedRoute } from "@angular/router";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { EndpointConstant } from "@org/constants";
import { ACCOUNT, ACCOUNTGROUP, AREAGROUPPOPUP, Country, CUSTOMERCOMMODITY, CUSTOMERSUPPLIERCATEGORIES, CUSTOMERSUPPLIERTYPE, Pcustomersuppliergettype, PCustomerSupplierModel, PLACEOFSUPPLY, SALESMAN } from "../Model/pcustomer-supplier.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EditSettingsModel } from "@syncfusion/ej2-grids";
import { GridComponent } from "@syncfusion/ej2-angular-grids";

type Mode = 'view' | 'new' | 'edit';

@Component({
  selector: 'app-customer-supplier-main',
  standalone: false,
  templateUrl: './customer-supplier.html',
  styleUrls: ['./customer-supplier.css'],
})
export class CustomerSupplierComponent extends BaseComponent implements OnInit {

  // @ViewChild('grid', { static: false })
  // public grid!: GridComponent;
  @ViewChild('deliveryDetailsGrid') deliveryDetailsGrid!: GridComponent;

  public deliveryDetailsEditSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Normal'
  };

  public deliveryToolbar: string[] = ['Add', 'Edit', 'Delete', 'Update', 'Cancel'];

  allDeliveryDetails: any[] = [];   // stores ALL rows

  customerSupplierForm = this.formUtil.thisForm;
  isInputDisabled = true;
  isNewBtnDisabled: boolean = false;
  isEditBtnDisabled: boolean = false;
  isDeleteBtnDisabled: boolean = false;
  isSaveBtnDisabled: boolean = true;
  isUpdate = signal<boolean>(false);

  //injected services
  private httpService = inject(GeneralAppService);
  private baseService = inject(BaseService);
  private route = inject(ActivatedRoute);

  /*=======================Signals==================*/
  customerSupplierTypes = signal<Pcustomersuppliergettype[]>([]);
  countries = signal<Country[]>([]);
  areaOptions = signal<AREAGROUPPOPUP[]>([]);
  salesmanData = signal<SALESMAN[]>([]);
  accountGroupData = signal<ACCOUNTGROUP[]>([]);
  accountData = signal<ACCOUNT[]>([]);

  listCommoditySought = signal<CUSTOMERCOMMODITY[]>([]);
  commodityOptions = signal<any[]>([]);
  creditcollectiontypeOptions = signal<any[]>([]);
  priceCategoryOptions = signal<any[]>([]);
  placeofSupplyOptions = signal<PLACEOFSUPPLY[]>([]);
  BusinessAddressOptions = signal<any[]>([]);
  categoryfixed = signal<Array<{ id: number; name: string }>>([]);

  currentCustomerSupplier = signal<any | null>(null);


  /*=======================Static lookup values==================*/
  public headerText: object[] = [
    { 'text': 'General' },
    { 'text': 'Customer Details' },
    { 'text': 'Delivery Details' }
  ];

  salutationOptions = [
    { text: 'Ms', value: 'ms' },
    { text: 'Mr', value: 'mr' }
  ];


  /*=======================Popup values==================*/
  areaKeys = [
    { field: 'id', header: 'ID', width: 80 },
    { field: 'code', header: 'Code', width: 120 },
    { field: 'value', header: 'Group Name', width: 150 }
  ];
  salesmanKeys = [
    { field: 'id', header: 'ID', width: 80 },
    { field: 'code', header: 'Code', width: 120 },
    { field: 'name', header: 'Name', width: 150 }
  ]



  //selected values
  selectedCustomerSupplierType = 0;
  selectedCustomerType: any = [];

  customerSupplierCode = 0;
  customerSupplierCategories = [] as Array<CUSTOMERSUPPLIERCATEGORIES>;
  selectedCategory: any = [];
  selectedCategoryId = null;
  selectedAccountId = 0;

  selectedCommodities: { id: number; value: string }[] = [];

  // ===== Image Upload State =====
  imageData: string | null = null;   // for preview (base64)
  imageBase64: string | null = null; // for payload
  showImageContainer = true;
  selectedFile: File | null = null;
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];

  //sales type
  saleTypes = signal<Array<{ id: string; value: string }>>([
    { id: '', value: '--Select--', },
    { id: 'S', value: 'Cash', },
    { id: 'R', value: 'Credit', },
  ]);

  selectedSalesType = signal<{ key: string | null; value: string | null }>({
    key: null,
    value: null,
  });

  selectedCreditCollectionType = signal<{ key: string | null; value: string | null }>({
    key: null,
    value: null,
  });

  selectedPriceCategory = signal<{ id: string | null; name: string | null }>({
    id: null,
    name: null,
  });

  placeKeys = [
    { field: 'id', header: 'ID', width: 80 },
    { field: 'value', header: 'Value', width: 150 }
  ];
  selectedPlaceofSupply = signal<{ id: any; value: any }>({
    id: 0,
    value: null,
  });

  //business types
  businessTypes = signal([
    { "value": '', "name": '--Select--' },
    { "value": 'p', "name": "Primary" },
    { "value": "s", "name": "Secondary" }
  ]);

  selectedBusinessType = signal<{ key: string | null; value: string | null }>({
    key: null,
    value: null,
  });

  //market reputation
  marketReputations = signal([

    { id: 'V', value: 'Very Good', },
    { id: 'G', value: 'Good', },
    { id: 'A', value: 'Average', },
    { id: 'B', value: 'Below Average', },
  ]);

  availedanyloanlimitsOptions = signal<Array<{ value: string; name: string }>>([
    { "value": '', "name": '--Select--' },
    { "value": 'Y', "name": "Yes" },
    { "value": "N", "name": "No" }
  ]);

  selectedAvailedLoanLimits = signal<{ key: string | null; value: string | null }>({
    "key": null,
    value: null,
  });

  businessNatureOptions = [
    { text: '-- Select --', value: '' },
    { text: 'Retail', value: 'R' },
    { text: 'Whole Sale', value: 'W' }
  ];

  selectedBusinessAddress = signal<{ key: string | null; value: string | null }>({
    key: null,
    value: null,
  });
  businessAddressOptions = signal<Array<{ value: string; name: string }>>([

    { value: "O", name: 'Owned' },
    { value: "R", name: 'Rented' }
  ]);

  selectedCategoryFixed = signal<{ id: number | null; name: string | null }>({
    id: null,
    name: null,
  });

  //common variables
  pageId = 0;
  mode = signal<Mode>('view');

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.fetchCustomerSupplierTypes();
    this.fetchCustomerCategory();
    this.fetchCountries();
    this.fetchArea();
    this.fetchSalesmanPopup();
    this.fethchcreditcollectiontype();
    this.fetchCustomerPriceCategory();
    this.fetchPlaceOfSupply();
    this.fetchcategoryfixed();
    this.fetchCommoditySoughts();
  }

  override newbuttonClicked(): void {
    this.isInputDisabled = false;
    this.customerSupplierForm.reset();
    this.customerSupplierForm.enable();
    this.imageData = null;
  }

  //form initialisation
  override FormInitialize() {
    this.customerSupplierForm = new FormGroup(
      {
        type: new FormControl({ value: '', disabled: this.isInputDisabled }, Validators.required), // Dropdown Required
        code: new FormControl({ value: '', disabled: this.isInputDisabled }, Validators.required), // string Required
        name: new FormControl({ value: '', disabled: this.isInputDisabled }, Validators.required), // string Required
        category: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        // active: new FormControl({ value: true, disabled: this.isInputDisabled }, Validators.required), // bool Required
        //active: new FormControl(true, Validators.required),
        active: new FormControl(true, Validators.requiredTrue),


        salutation: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown (Mr/Ms)
        arabicname: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        contactpersonname: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        telephoneno: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        addresslineone: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        addressarabic: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        mobileno: new FormControl({ value: '', disabled: this.isInputDisabled }, [validPhoneNumber]), // string
        vatno: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        creditperiod: new FormControl({ value: '', disabled: this.isInputDisabled }), // decimal
        creditlimit: new FormControl({ value: '', disabled: this.isInputDisabled }), // decimal
        salesman: new FormControl({ value: '', disabled: this.isInputDisabled }), // popup
        city: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        pobox: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        countrycode: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        country: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        buildingno: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        district: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        districtarabic: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        cityarabic: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        provincearabic: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        area: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        province: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        faxno: new FormControl({ value: '', disabled: this.isInputDisabled }),
        contactperson2: new FormControl({ value: '', disabled: this.isInputDisabled }),
        emailaddress: new FormControl({ value: '', disabled: this.isInputDisabled }, [validEmail]),
        telephoneno2: new FormControl({ value: '', disabled: this.isInputDisabled }),
        centralsalestaxno: new FormControl({ value: '', disabled: this.isInputDisabled }),
        actassupplieralso: new FormControl({ value: false, disabled: this.isInputDisabled }),
        panno: new FormControl({ value: '', disabled: this.isInputDisabled }),
        letsystemgeneratenewaccountforparty: new FormControl({ value: true, disabled: this.isInputDisabled, }),
        accountgroup: new FormControl({ value: '', disabled: this.isInputDisabled }), // Add Validators as needed
        account: new FormControl({ value: '', disabled: this.isInputDisabled }), // Add Validators as needed
        remarks: new FormControl({ value: '', disabled: this.isInputDisabled }),
        commoditysought: new FormControl<string[]>([]),
        salestype: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown 
        quantityplanned: new FormControl({ value: '', disabled: this.isInputDisabled },[integerOnly]),// int
        basicunit: new FormControl({ value: '', disabled: this.isInputDisabled }), // decimal
        creditcollectiontype: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        dl1: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        dl2: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        pricecategory: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        placeofsupply: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        businesstype: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        availedanyloanlimits: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        businessnature: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        othermerchantsofcustomer: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        businessaddress: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        valueofproperty: new FormControl({ value: '', disabled: this.isInputDisabled },[decimalOnly]), // decimal
        yearsofbusiness: new FormControl({ value: '', disabled: this.isInputDisabled },[integerOnly]), // int
        yearlyturnover: new FormControl({ value: '', disabled: this.isInputDisabled },[decimalOnly]), // decimal
        marketreputation: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        categoryrecommended: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        limitrecommended: new FormControl({ value: '', disabled: this.isInputDisabled }),
        categoryfixed: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        limitfixedforcustomer:  new FormControl({ value: '', disabled: this.isInputDisabled },[integerOnly]), // int
        creditperiodpermitted:new FormControl({ value: '', disabled: this.isInputDisabled },[integerOnly]), // int
        overdueamountlimit: new FormControl({ value: '', disabled: this.isInputDisabled },[decimalOnly]), // decimal
        overdueperiodlimit: new FormControl({ value: '', disabled: this.isInputDisabled },[integerOnly]), // int
        chequebouncecountlimit:new FormControl({ value: '', disabled: this.isInputDisabled },[integerOnly]), // int
        salespricelowvarlimit: new FormControl({ value: '', disabled: this.isInputDisabled },[decimalOnly]), // decimal
        salespriceupVarlimit: new FormControl({ value: '', disabled: this.isInputDisabled },[decimalOnly]), // decimal
      });

    // 🔁 Auto-enable / disable account based on checkbox
    const autoCtrl = this.customerSupplierForm.get('letsystemgeneratenewaccountforparty');
    const accountCtrl = this.customerSupplierForm.get('account');

    // Initial state handling (page load)
    if (autoCtrl?.value === true) {
      accountCtrl?.disable();
    } else {
      accountCtrl?.enable();
    }

    // Reactive change handling
    autoCtrl?.valueChanges.subscribe((value: boolean) => {
      if (value === true) {
        accountCtrl?.disable();       // system generates → disable account
        accountCtrl?.setValue(null);  // optional: clear value
      } else {
        accountCtrl?.enable();        // manual mode → enable account
      }

    });

  }

  isInvalid(controlName: string): boolean {
    const control = this.customerSupplierForm.get(controlName);
    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }


  //for left grid data
  override async LeftGridInit() {
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLCUSTOMERSUPPLIER)
      );
      let dataToUse: any[] = [];
      if (Array.isArray(res)) {
        dataToUse = res;
      }
      else if (res && res.data !== undefined) {
        if (Array.isArray(res.data)) {
          if (Array.isArray(res.data[0])) {
            dataToUse = res.data[0];
          } else {
            dataToUse = res.data;
          }
        } else {
          console.warn('res.data exists but is not an array:', res.data);
          dataToUse = [];
        }
      } else {
        console.error('Unexpected response structure:', res);
        dataToUse = [];
      }

      this.leftGrid.leftGridData = dataToUse;

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Customer Supplier List',
          columns: [
            {
              field: 'code',
              datacol: 'code',
              headerText: 'Code',
              textAlign: 'Left',
            },
            {
              field: 'name',
              datacol: 'name',
              headerText: 'Name',
              textAlign: 'Left',
            },
            {
              field: 'nature',
              datacol: 'nature',
              headerText: 'Nature',
              textAlign: 'Left',
            }
          ],
        },
      ];

      // Update the data sharing service to populate the left grid
      this.serviceBase.dataSharingService.setData({
        columns: this.leftGrid.leftGridColumns,
        data: this.leftGrid.leftGridData,
        pageheading: this.pageheading,
      });
    } catch (err) {
      this.toast.error('Error fetching companies:' + err);
    }
  }

  fetchCustomerSupplierTypes(): void {
    this.httpService
      .fetch<any[]>(EndpointConstant.FILLCUSTOMERSUPPLIERTYPE)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          // If res is already an array, use it directly
          const data = Array.isArray(res) ? res : res?.data || [];
          this.customerSupplierTypes.set(data);

        },
        error: (err) => {
          console.error('Error:', err);
          this.customerSupplierTypes.set([]);
        }
      });
  }

  onTypeSelect($event: any): void {
    const selectedId = $event?.itemData?.id ?? $event?.value;
    this.selectedCustomerSupplierType = selectedId;
    this.selectedCustomerType =
      this.customerSupplierTypes().find(
        (obj: CUSTOMERSUPPLIERTYPE) => obj.id === selectedId
      ) ?? null;

    if (selectedId === 1) {
      this.customerSupplierForm.get('creditperiod')?.enable();
    } else if (selectedId === 2) {
      this.customerSupplierForm.get('creditperiod')?.disable();
    }
    const selectedText = $event?.itemData?.description ?? $event?.text;
    this.fetchCustomerSupplierCode();
    this.fetchAccountGroup(selectedText);
  }

  //auto generate code
  fetchCustomerSupplierCode(): void {
    this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERSUPPLIERCODE)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.customerSupplierCode = response?.data.code;
          this.customerSupplierForm.patchValue({
            code: this.customerSupplierCode
          });
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });

  }

  //getting category dropdown data

  fetchCustomerCategory(): void {
    this.httpService
      .fetch(EndpointConstant.FILLCATEGORY)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data ?? response;
          this.customerSupplierCategories = Array.isArray(data) ? [...data] : [];
        },
        error: (error) => {
          this.toast.error('An Error Occurred', error);
        },
      });
  }

  onChangeCategory() {
    let selectedCategoryId = this.customerSupplierForm?.get('category')?.value;
    this.selectedCategory = this.customerSupplierCategories?.find(obj => obj?.id == selectedCategoryId) as CUSTOMERSUPPLIERCATEGORIES;
  }

  fetchCountries(): void {
    this.httpService.fetch<Country[]>(EndpointConstant.FILLCOUNTRY)
      .pipe()
      .subscribe({
        next: (res) => {
          if (!res.isValid && res.httpCode !== 200) {
          } else {
            // Flatten from nested array to single array
            const flatCountries = Array.isArray(res.data) && Array.isArray(res.data[0])
              ? res.data[0]
              : res.data;
            this.countries.set(flatCountries);
          }
        },
        error: (err) => console.error('Error fetching companies', err),
      });
  }

  fetchArea(): void {
    this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERSUPPLIERAREA)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const areaData: any = response?.data;
          this.areaOptions.set(areaData);
        },
        error: (error) => {
          this.toast.error('An Error Occured', error);
          this.areaOptions.set([]);
        },
      });
  }

  //fills salesman popup  
  fetchSalesmanPopup(): void {
    this.httpService
      .fetch<any>(EndpointConstant.GETSALESMAN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data ?? [];
          this.salesmanData.set(data);
        },
        error: (error) => {
          this.toast.error('An Error Occured', error);
          this.salesmanData.set([]);
        }
      });
  }

  //fills account group dropdown
  fetchAccountGroup(type: string): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLCUSTOMERACCOUNTGROUP + type)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data ?? [];
          this.accountGroupData.set(data);
        },
        error: (error) => {
          this.toast.error('An Error Occured', error);
          this.accountGroupData.set([]);
        }
      });
  }

  onChangeAccountGroup(event: any) {
    const selectedId = event?.value;
    // const selectedObj = event?.itemData;
    this.fetchAccount(selectedId);
  }

  fetchAccount(accountGroupId: any) {
    this.httpService
      .fetch(EndpointConstant.FILLCUSTOMERACCOUNT + accountGroupId + '&tree=true')
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          //this.accountData = response?.data as any;
          this.accountData.set(response?.data ?? [] as any);
          if (this.selectedAccountId != 0) {
            this.customerSupplierForm.patchValue({
              account: this.selectedAccountId
            });
          }
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  //image uploading
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      const fullBase64 = reader.result as string;
      this.imageData = fullBase64;
      // ✅ For payload (REMOVE data:image/...;base64,)
      this.imageBase64 = fullBase64.split(',')[1];
    };
    reader.readAsDataURL(file);
  }


  removeImage(): void {
    this.imageData = null;
    this.imageBase64 = null;
  }



  /*===================================== CUSTOMER DETAILS =======================================*/

  //fetch commodity soughts-multi select
  fetchCommoditySoughts(): void {
    this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERCOMMODITY)
      .pipe()
      .subscribe({
        next: (res) => {
          if (!res.isValid && res.httpCode !== 200) {
          } else {
            // Flatten from nested array to single array
            const flatcommdity = Array.isArray(res.data) && Array.isArray(res.data[0])
              ? res.data[0]
              : res.data;
            this.commodityOptions.set(flatcommdity);
          }
        },
        error: (err) => this.toast.error('Error fetching commodities', err),
      });
  }

  onCommoditySelect(event: any): void {
    if (!event) return;

    const selectedIds: number[] = event?.value ?? [];   // selected IDs from multiselect

    this.selectedCommodities = selectedIds.map((id: number) => {
      const obj = this.commodityOptions().find((c: any) => c.id === id);

      return {
        id: obj?.id ?? id,
        value: obj?.description ?? ''   // 👈 API wants "value"
      };
    });
  }

  onSaleTypeSelect($event: any): void {
    this.selectedSalesType.set({
      key: $event.itemData.id,
      value: $event.itemData.value,
    });
  }

  fethchcreditcollectiontype(): void {
    this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERCREDITDROPDOWN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          this.creditcollectiontypeOptions.set(res.data);
        },
        error: (err) => {
          console.error('Error fetching salutations', err);
        },
      });
  }
  onCreditCollectionTypeSelect(): void {
    this.selectedCreditCollectionType.set({
      key: this.customerSupplierForm.get('creditcollectiontype')?.value,
      value: this.creditcollectiontypeOptions().find(type => type.id === this.customerSupplierForm.get('creditcollectiontype')?.value)?.description ?? null,
    });
  }

  fetchCustomerPriceCategory(): void {
    this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERPRICECATEGORY)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          const flatpricecategory = Array.isArray(res.data) && Array.isArray(res.data[0])
            ? res.data[0]
            : res.data;

          // ✅ Add default select option
          const dataWithSelect = [
            { id: null, name: '-- Select --' },
            ...(flatpricecategory ?? [])
          ];
          this.priceCategoryOptions.set(dataWithSelect);
        },
        error: (err) => {
          console.error('Error fetching price category', err);
          this.priceCategoryOptions.set([
            { id: null, name: '-- Select --' }
          ]);
        },
      });
  }

  onPriceCategorySelect($event: any): void {
    const selectedId =
      $event?.itemData?.id ??
      $event?.value ??
      null;

    if (selectedId !== null) {
      const selected = this.priceCategoryOptions()
        .find(type => String(type.id) === String(selectedId));

      this.selectedPriceCategory.set({
        id: String(selectedId),
        name: selected?.name ?? null,
      });
    } else {
      // reset safely
      this.selectedPriceCategory.set({
        id: null,
        name: null,
      });
    }
  }

  fetchPlaceOfSupply(): void {
    this.httpService
      .fetch(EndpointConstant.FILLCUSTOMERPLACEOFSUPPLY)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response: any) => {
          const placeofSupplyData = response?.data ?? [];

          const options = placeofSupplyData.map((item: any) => ({
            id: item.id,
            value: item.value
          }));

          this.placeofSupplyOptions.set(options);
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  onPlayofSupplySelected($event: any): void {
    const item = $event?.itemData;

    this.selectedPlaceofSupply.set({
      id: Number(item.id ?? item.value),
      value: item.text
    });
  }
  onBusinessTypeSelect(event: any) {
    const selected = this.businessTypes().find(
      (type: any) => type.id == event
    );

    this.selectedBusinessType.set({
      key: event,
      value: selected?.value ?? null
    });
  }
  onAvailedLoanLimitsSelect($event: any): void {
    this.selectedAvailedLoanLimits.set({
      key: $event.itemData?.value,
      value: $event.itemData?.name,
    });
  }
  onBusinessAddressSelect($event: any): void {
    this.selectedBusinessAddress.set({
      key: $event.itemData?.name,
      value: $event.itemData?.value,
    });
  }

  fetchcategoryfixed(): void {
    this.httpService.fetch<any>(EndpointConstant.FILLCATEGORYFIXED1)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          const flatcategoryfixed = Array.isArray(res.data) && Array.isArray(res.data[0])
            ? res.data[0]
            : res.data;
          this.categoryfixed.set(flatcategoryfixed);
        },
      });
  }
  oncategorychanged(event: any): void {
    if (!event) return;

    const item = event.itemData;

    this.selectedCategoryFixed.set({
      id: item?.id ?? 0,
      name: item?.value ?? ''
    });
  }

  //getting current pageid
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
  /*******************************Fill by id******************************* */
  override getDataById(data: PCustomerSupplierModel) {
    this.currentCustomerSupplier.set(data);
    this.mode.set('view');
    this.patchFormFromCurrent();

  }

  private patchFormFromCurrent(): void {
    const cur = this.currentCustomerSupplier();
    this.selectedCustomerSupplierId = cur.id;
    if (!cur?.id) return;
    this.httpService
      .fetch<any>(EndpointConstant.FILLCUSTOMERSUPPLIERBYID + cur.id + '&pageId=105')
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response: any) => {

          const payload = response?.data ?? response;   // support wrapped & direct
          const result = payload?.result;
          const custDetails = payload?.custDetails ?? null;
          this.allDeliveryDetails = payload?.delDetails ?? null;
          const imageString = payload?.img ?? null;
          const accGrp = payload?.accountGroup ?? [];
          this.accountGroupData.set(accGrp);

          const accountGroupId = accGrp?.[0]?.id ? Number(accGrp[0].id) : null;
          this.fetchAccount(accountGroupId);

          if (imageString != null)
            this.imageData = `data:image/jpeg;base64,${imageString}`;
          if (!result) {
            this.toast.warning('Customer supplier payload missing result', payload);
            return;
          }

          // store state
          this.currentCustomerSupplier.set(result);

          /* ---------------- FORM PATCH ---------------- */

          this.customerSupplierForm.patchValue({
            type: result.nature === 'C' ? 1 : 2,
            code: result.code,
            name: result.name,
            category: result.partyCategoryID,
            active: result.active,
            salutation: result.salutation,
            arabicname: result.arabicName,

            contactpersonname: result.contactPerson,
            telephoneno: result.telephoneNo,
            addresslineone: result.addressLineOne,
            addressarabic: result.addressLineTwo,
            mobileno: result.mobileNo,
            vatno: result.salesTaxNo,

            creditlimit: result.creditLimit,
            salesman: result.salesManID,

            city: result.city,
            pobox: result.pobox,
            countrycode: result.countryCode,
            country: result.country,
            buildingno: result.bulidingNo,
            district: result.district,
            districtarabic: result.districtArabic,
            cityarabic: result.cityArabic,
            provincearabic: result.provinceArabic,
            //image:this.imageData,
            area: result.areaID,               // ✅ FIXED
            province: result.province,

            faxno: result.faxNo,
            contactperson2: result.contactPerson2,
            emailaddress: result.emailAddress,
            telephoneno2: result.telephoneNo2,
            centralsalestaxno: result.centralSalesTaxNo,

            actassupplieralso: result.isMultiNature,
            panno: result.panNo,

            letsystemgeneratenewaccountforparty: false,

            // accountgroup: payload?.accountGroup?.id ?? null, 

            accountgroup: accountGroupId,
            //payload?.accountGroup?.[0]?.id ?? null,
            account: Number(result.accountID),
            remarks: result.remarks,

            dl1: result.dL1,
            dl2: result.dL2,

            pricecategory: result.priceCategoryID,
            placeofsupply: result.placeOfSupply,
            creditperiod: custDetails.creditPeriod,

            /* ---------- custDetails object mapping ---------- */

            salestype: custDetails?.cashCreditType ?? null,
            quantityplanned: custDetails?.plannedPcs ?? null,
            basicunit: custDetails?.plannedCFT ?? null,
            creditcollectiontype: custDetails?.creditCollnThru ?? null,

            businesstype: custDetails?.busPrimaryType ?? null,
            availedanyloanlimits: custDetails?.isLoanAvailed ?? null,
            businessnature: custDetails?.busRetailType ?? null,
            othermerchantsofcustomer: custDetails?.mainMerchants ?? null,
            businessaddress: custDetails?.addressOwned ?? null,
            valueofproperty: custDetails?.valueofProperty ?? null,
            yearsofbusiness: custDetails?.busYears ?? null,
            yearlyturnover: custDetails?.busYearTurnover ?? null,
            marketreputation: custDetails?.marketReputation ?? null,

            categoryrecommended: custDetails?.bandByImportID ?? null,
            limitrecommended: custDetails?.salesLimitByImport ?? null,
            categoryfixed: custDetails?.bandByHOID ?? null,
            limitfixedforcustomer: custDetails?.salesLimitByHO ?? null,
            creditperiodpermitted: custDetails?.creditPeriodByHO ?? null,
            overdueamountlimit: custDetails?.overdueLimitPerc ?? null,
            overdueperiodlimit: custDetails?.overduePeriodLimit ?? null,
            chequebouncecountlimit: custDetails?.chequeBounceLimit ?? null,
            salespricelowvarlimit: custDetails?.salesPriceLowVarPerc ?? null,
            salespriceupVarlimit: custDetails?.salesPriceUpVarPerc ?? null,

            commoditysought: (payload?.commoditySought ?? []).map((c: any) => c.id)
          });

          /* ---------------- AREA SELECTION ---------------- */


        },
        error: (err: any) => {
          console.error('Error fetching customer supplier:', err);
        }
      });
  }

  override onEditClick() {
    this.isUpdate.set(true);
    this.customerSupplierForm.enable();
    this.isInputDisabled = false;
    // this.onTypeSelect();
  }

  markTouched(controlName: string) {
    const ctrl = this.customerSupplierForm.get(controlName);
    if (ctrl && !ctrl.touched) {
      ctrl.markAsTouched();
    }
  }


  //save customer supplier
  override SaveFormData(): void {
    //this.formSubmitted = true;   // 🔥 trigger validation display

    if (this.customerSupplierForm.invalid) {
      this.customerSupplierForm.markAllAsTouched(); // optional
      console.log('❌ Form invalid');
      return; // stop save
    }

    let countryName = null;
    const payload = {
      "id": this.isUpdate() ? this.selectedCustomerSupplierId : 0,
      "type": {
        "id": this.customerSupplierForm.value.type,
        "description": null
      },
      "category": {
        "id": this.customerSupplierForm.value.category ? this.customerSupplierForm.value.category : null,
        "value": "string"
      },
      "code": this.customerSupplierForm.value.code.toString(),
      "salutation": this.customerSupplierForm.value.salutation,
      "active": this.customerSupplierForm.value.active,
      "name": this.customerSupplierForm.value.name,
      "arabicName": this.customerSupplierForm.value.arabicname,
      "contactPersonName": this.customerSupplierForm.value.contactpersonname,
      "telephoneNo": this.customerSupplierForm.value.telephoneno,
      "addressLineOne": this.customerSupplierForm.value.addresslineone,
      "addressArabic": this.customerSupplierForm.value.addressarabic,
      "mobileNo": this.customerSupplierForm.value.mobileno,
      "vatno": this.customerSupplierForm.value.vatno,
      "creditPeriod": this.customerSupplierForm.value.creditperiod,
      "creditLimit": this.customerSupplierForm.value.creditlimit,
      "salesMan": this.customerSupplierForm.value.salesman,
      "city": this.customerSupplierForm.value.city,
      "poBox": this.customerSupplierForm.value.pobox,
      "countryCode": this.customerSupplierForm.value.countrycode,
      "country": {
        "id": this.customerSupplierForm.value.country ? this.customerSupplierForm.value.country : null,
        "value": null
      },
      "bulidingNo": this.customerSupplierForm.value.buildingno,
      "district": this.customerSupplierForm.value.district,
      "districtArabic": this.customerSupplierForm.value.districtarabic,
      "cityArabic": this.customerSupplierForm.value.cityarabic,
      "provinceArabic": this.customerSupplierForm.value.provincearabic,
      "area": {
        "id": this.customerSupplierForm.value.area ? this.customerSupplierForm.value.area : null,
        "value": ""
      },
      "province": this.customerSupplierForm.value.province,
      "faxNo": this.customerSupplierForm.value.faxno,
      "contactPerson2": null,
      "emailAddress": this.customerSupplierForm.value.emailaddress,
      "telephoneNo2": this.customerSupplierForm.value.telephoneno2,
      "centralSalesTaxNo": this.customerSupplierForm.value.centralsalestaxno,
      "actAsSupplierAlso": this.customerSupplierForm.value.actassupplieralso,
      "panNo": this.customerSupplierForm.value.panno,
      "letSystemGenNewAccForParty": this.customerSupplierForm.value.letsystemgeneratenewaccountforparty,
      "accountGroup": {
        "id": this.customerSupplierForm.value.accountgroup ? this.customerSupplierForm.value.accountgroup : null,
        "name": "string"
      },
      "account": {
        "id": this.customerSupplierForm.value.account ? this.customerSupplierForm.value.account : null,
        "name": "string"
      },
      "remarks": this.customerSupplierForm.value.remarks,
      "image": this.imageBase64,
      "customerDetails": {
        "commoditySought": this.selectedCommodities,
        "salesType": {
          "key": this.customerSupplierForm.value.salestype ? this.customerSupplierForm.value.salestype : null,
          "value": null
        },
        "quantityPlanned": this.customerSupplierForm.value.quantityplanned,
        "basicUnit": this.customerSupplierForm.value.basicunit,
        "creditCollectionType": {
          "key": this.customerSupplierForm.value.creditcollectiontype ? this.customerSupplierForm.value.creditcollectiontype : null,
          "value": null
        },
        "dL1": this.customerSupplierForm.value.dl1,
        "dL2": this.customerSupplierForm.value.dl2,
        "priceCategory": {
          "id": this.customerSupplierForm.value.pricecategory ? this.customerSupplierForm.value.pricecategory : null,
          "name": null
        },
        "placeOfSupply": {
          "id": null,//this.customerSupplierForm.value.placeofsupply ? this.customerSupplierForm.value.placeofsupply : null,
          "value": null
        },
        "businessType": {
          "key": this.customerSupplierForm.value.businesstype ? this.customerSupplierForm.value.businesstype : null,
          "value": "string"
        },
        "availedAnyLoanLimits": {
          "key": this.customerSupplierForm.value.availedanyloanlimits ? this.customerSupplierForm.value.availedanyloanlimits : null,
          "value": "string"
        },
        "businessNature": {
          "key": this.customerSupplierForm.value.businessnature ? this.customerSupplierForm.value.businessnature : null,
          "value": "string"
        },

        "otherMerchantsOfCustomer": this.customerSupplierForm.value.othermerchantsofcustomer,
        "businessAddress": {
          "key": this.customerSupplierForm.value.businessaddress ? this.customerSupplierForm.value.businessaddress : null,
          "value": null
        },
        "valueOfProperty": this.customerSupplierForm.value.valueofproperty,
        "yearsOfBusiness": this.customerSupplierForm.value.yearsofbusiness,
        "yearlyTurnover": this.customerSupplierForm.value.yearlyturnover,
        "marketReputation": {
          "key": this.customerSupplierForm.value.marketreputation ? this.customerSupplierForm.value.marketreputation : null,
          "value": null
        },
        "categoryRecommended": {
          "id": this.customerSupplierForm.value.categoryrecommended != -1 ? this.customerSupplierForm.value.categoryrecommended : null,
          "name": null
        },
        "limitRecommended": this.customerSupplierForm.value.limitrecommended,
        "categoryFixed": {
          "id": this.customerSupplierForm.value.categoryfixed != -1 ? this.customerSupplierForm.value.categoryfixed : null,
          "name": null
        },
        "limitFixedForCustomer": this.customerSupplierForm.value.limitfixedforcustomer,
        "creditPeriodPermitted": this.customerSupplierForm.value.creditperiodpermitted,
        "overdueAmountLimit": this.customerSupplierForm.value.overdueamountlimit,
        "overduePeriodLimit": this.customerSupplierForm.value.overdueperiodlimit,
        "chequeBounceCountLimit": this.customerSupplierForm.value.chequebouncecountlimit,
        "salesPriceLowVarLimit": this.customerSupplierForm.value.salespricelowvarlimit,
        "salesPriceUpVarLimit": this.customerSupplierForm.value.salespriceupVarlimit
      },
      "deliveryDetails": this.allDeliveryDetails
    }
    if (this.isUpdate()) {
      this.updateCallback(payload);
    } else {
      this.createCallback(payload);

    }
  }

  selectedCustomerSupplierId!: number;
  firstCustomerSupplier!: number;

  updateCallback(payload: any) {
    this.httpService.patch(EndpointConstant.UPDATECUSTOMERSUPPLIER + this.currentPageInfo?.id, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.httpCode == 201) {
            this.toast.success("Successfully updated customer supplier");
            this.selectedCustomerSupplierId = this.firstCustomerSupplier;
            this.LeftGridInit();
          } else {
            this.toast.error('Some error occred');
          }
        },
        error: (error) => {
          this.toast.error('Please try again');
        },
      });
  }

  createCallback(payload: any) {
    this.httpService.post(EndpointConstant.SAVECUSTOMERSUPPLIER + this.currentPageInfo?.id, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.httpCode == 201) {
            this.toast.success('Successfully saved customer supplier');
            this.imageData = null;
            this.selectedCustomerSupplierId = this.firstCustomerSupplier;
            this.LeftGridInit();
            const queryParams = this.route.snapshot.queryParams;
            if (queryParams && queryParams['partyId'] && queryParams['partyId'] == 0) {
              localStorage.setItem('customerSaved', JSON.stringify({ timestamp: new Date() }));
            }
          } else {
            this.toast.error('Some error occured');
          }

        },
        error: (error) => {
          this.toast.error('Error saving customersupplier', error);
        },
      });
  }

  //delete customer -supplier

  override DeleteData() {
    const confirmed = confirm('Are you sure you want to delete this details?');
    if (!confirmed) {
      return;
    }
    this.httpService.delete(EndpointConstant.DELETECUSTOMERSUPPLIER + this.selectedCustomerSupplierId + '&pageId=105')
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          this.toast.success('Deleted successfully');
          this.LeftGridInit();
        },
      });
  }

  // Delivery details

  // ➕ Add button
  addDeliveryRow() {
    const newRow = {
      locationName: '',
      projectName: '',
      contactPerson: '',
      contactNo: '',
      address: ''
    };

    this.allDeliveryDetails.push(newRow);
    this.allDeliveryDetails = this.allDeliveryDetails.filter(row =>
      Object.values(row).some(
        v => v !== null && v !== undefined && v.toString().trim() !== ''
      )
    );
  }

  onDeliveryActionComplete(args: any) {
    if (args.requestType === 'save') {
      const data = this.deliveryDetailsGrid.dataSource as any[];
      const lastRow = data[data.length - 1];
      const isRowFilled = Object.values(lastRow).some(v => v && v.toString().trim() !== '');
      if (isRowFilled) {
        data.push({
          locationName: '',
          projectName: '',
          contactPerson: '',
          contactNo: '',
          address: ''
        });

        this.allDeliveryDetails = [...data];
      }
    }
  }








}