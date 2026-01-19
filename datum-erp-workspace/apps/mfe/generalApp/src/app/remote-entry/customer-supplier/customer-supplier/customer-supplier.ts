import { Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, takeUntil } from 'rxjs';
import { BaseComponent } from '@org/architecture';
import { GeneralAppService } from '../../http/general-app.service';
import { EndpointConstant } from '@org/constants';
import { Country,PCustomerSupplierCommodityDto, PCustomerSupplierFetchbyIdModel, PCustomerSupplierDetailDto,  PCustomerSupplierModel,Pcustomersuppliergettype,DELIVERYDETAILS,AREA, ACCOUNT, CREDITCOLLECTION, ACCOUNTGROUP, CUSTOMERCOMMODITY, CUSTOMERSUPPLIERCATEGORIES, CUSTOMERCATEGORIES, CUSTOMERSUPPLIERTYPE, AREAGROUPPOPUP, PLACEOFSUPPLY,} from '../Model/pcustomer-supplier.model';
import { ApiResponseDto } from '@org/models';
import { EditSettingsModel } from '@syncfusion/ej2-grids';
import { GridComponent } from '@syncfusion/ej2-angular-grids';
import { BaseService, validEmail, validPhoneNumber } from '@org/services';
import { ActivatedRoute } from '@angular/router';

type Mode = 'view' | 'new' | 'edit';

const hasDataWrapper = <T>(value: unknown): value is ApiResponseDto<T> =>
  !!value && typeof value === 'object' && 'data' in (value as Record<string, unknown>);

type PCustomerSupplierFetchbyIdResponse = PCustomerSupplierFetchbyIdModel & {
  custDetails?: PCustomerSupplierDetailDto[];
  commoditySought?: PCustomerSupplierCommodityDto[];
};

@Component({
    selector: 'app-customer-supplier-main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
    templateUrl: './customer-supplier.html',
  styleUrls: ['./customer-supplier.css'],
})
  export class CustomerSupplierComponent extends BaseComponent implements OnInit {
    @ViewChild('grid')grid!: GridComponent;
    public headerText: object[] = [{ 'text': 'General' }, { 'text': 'Customer Details' },{ 'text': 'Other Details' }];
    customerSupplierTypes = signal<Pcustomersuppliergettype[]>([]);
    selectedArea = signal<{ id: number ; name: string ; code: string  }>({
      id: 0,
      name: "",
      code: "",
    });
    selectedPlaceofSupply = signal<{id:number ; value : string }>({
      id:0,
      value: "",
    })
    selectedCommodities: any[] = [];
   selectedarea = { id: 0,value:'' };
   //placeofSupplyOptions = [] as Array<PLACEOFSUPPLY>;
   placeofSupplyOptions= signal<PLACEOFSUPPLY[]>([]);
 selectedPlaceofSupplyOption = '';
  placeofSupplyreturnField = 'value';
  placeofSupplyKeys = ['ID','VALUE'];
  selectedPlaceofSupplyId = 0;
    placeKeys= [
  { field: 'id', header: 'ID', width: 80 },
  { field: 'value', header: 'Value', width: 150 }
];

iscustomerdetails=signal<boolean>(false);
allAccounts = signal<ACCOUNT[]>([]);
imageData: string | ArrayBuffer | null = null;
//isUpdate: boolean = false;
 isUpdate = signal<boolean>(false);
 selectedAccountId = 0;
  selectedAccountGroupId = 0;
  selectedAreaGroupOption = '';
  selectedGroupId = 0; 
selectedCustomerSupplierId!: number;
selectedCustomerType:any = [];
 selectedCustomerSupplierType = 0;
selectedCategory:any = [];
 customerCategories = [] as Array<CUSTOMERCATEGORIES>;

editSettings: EditSettingsModel = {
  allowEditing: true,
  allowAdding: true,
  allowDeleting: true,
  mode: 'Normal' as any // cast because EditMode is not a runtime enum
};
allDeliveryDetails = [] as Array<DELIVERYDETAILS>;
 isNewMode = signal<boolean>(false);
 isEditMode = signal<boolean>(false);
    private httpService = inject(GeneralAppService);
    private baseService = inject(BaseService);
    private route = inject(ActivatedRoute);
    selectedCustomerSupplierSalutation = signal<{ key: string | null; value: string | null }>({
      key: null,
      value: null,
    });
    customerSupplierForm = this.formUtil.thisForm;
     firstCustomerSupplier!:number;
     listCommoditySought=signal<CUSTOMERCOMMODITY[]>([]); 
    commodityOptions = signal<any[]>([]);
    creditcollectiontypeOptions = signal<any[]>([]);
    customerSupplierCode = 0;
   creditCollectionData = signal<CREDITCOLLECTION[]>([]);
    accountData = signal<ACCOUNT[]>([]);
    account:any = {
    "id": 0,
    "name": "string"
  };
    accountGroupData = signal<ACCOUNTGROUP[]>([]);
  accountGroup:any = {
    "id": 0,
    "name": "string"
  };
   areaOptions = signal<AREAGROUPPOPUP[]>([]);
    selectedAreaOption: number | null = null;
    areareturnField = 'name';
    areaKeys = [
  { field: 'id', header: 'ID', width: 80 },
  { field: 'code', header: 'Code', width: 120 },
  { field: 'value', header: 'Group Name', width: 150 }
];

    selectedCustomerSupplierCategory = signal<{ key: string | null; value: string | null }>({
      key: null,
      value: null,
    });
     customerSupplierCategories = [] as Array<CUSTOMERSUPPLIERCATEGORIES>;
    availedanyloanlimitsOptions = signal<Array<{ value: number; name: string }>>([
      {
        value: 1,
        name: 'Yes'
      },
      {
        value: 0,
        name: 'No'
      }
    ]);
    businessAddressOptions = signal<Array<{ value: number; name: string }>>([
      {
        value: 1,
        name: 'Owned'
      },
      {
        value: 0,
        name: 'Rented'
      }
    ]);
    selectedCreditCollectionType = signal<{ key: string | null; value: string | null }>({
      key: null,
      value: null,
    });
    selectedAvailedLoanLimits = signal<{ key: string | null; value: string | null }>({
          "key": null,
          value: null,
    });
    selectedBusinessNature = signal<{ key: string | null; value: string | null }>({
           "key": null,
            value: null,
    });
      selectedCategoryRecommended= signal<{ id: number | null; name: string | null }>({
    "id":null,
    "name":"string"
  });
    selectedBusinessAddress = signal<{ key: string | null; value: string | null }>({
      key: null,
      value: null,
    });
    BusinessAddressOptions = signal<any[]>([]);
    
    // STATE PROPERTIES
    priceCategoryOptions = signal<any[]>([]);
    selectedPriceCategory = signal<{ id:string | null; name: string | null }>({
    id: null,
      name: null,
    });
    isInputDisabled = true;
    mode = signal<Mode>('view');
    currentCustomerSupplier = signal<any | null>(null);
    
    // Dropdown Data Sources
    
    salesmanOptions: any[] = [];
    deliveryDetails: any[] = [];
    countries = signal<Country[]>([]);
    categoryfixed = signal<Array<{ id: number; name: string }>>([]);
    selectedCategoryFixed = signal<{ id: number | null; name: string | null }>({
      id: null,
      name: null,
    });
    selectedLimitRecommended = signal<{ id: number | null; name: string | null }>({
      id: null,
      name: null,
    });
      selectedMarketReputation= signal<{ key: number | null; value: string | null }>({
    "key": null,
    "value": "string"
  });

    saleTypes = signal<Array<{ id: string; value: string }>>([
      {
        id: 'S',
        value: 'Cash',
      },
      {
        id: 'R',
        value: 'Credit',
      },
    ]);
    selectedSalesType = signal<{ key: string | null; value: string | null }>({
      key: null,
      value: null,
    });
    businessTypes = signal([
          {
            "value":'p',
            "name":"Primary"
          },
          {
            "value":"s",
            "name":"Secondary"
          }
        ]);
        selectedBusinessType = signal<{ key: string | null; value: string | null }>({
          key: null,
          value: null,
        });
     
 onBusinessTypeSelect(event: any) {
  console.log('Business Type selected:', event);

  const selected = this.businessTypes().find(
    (type: any) => type.id == event
  );

  this.selectedBusinessType.set({
    key: event,
    value: selected?.value ?? null
  });
}

        onBusinessAddressSelect($event: any): void {
          console.log('Business Address selected:', $event);
          this.selectedBusinessAddress.set({
            key: $event.itemData?.name,
            value: $event.itemData?.value,
          });
          console.log('Selected Business Address:', this.selectedBusinessAddress());
        }
        onAvailedLoanLimitsSelect($event: any): void {
          console.log('Availed Loan Limits selected:', $event);
          this.selectedAvailedLoanLimits.set({
            key: $event.itemData?.value,
            value: $event.itemData?.name,
          });
          console.log('Selected Availed Loan Limits:', this.selectedAvailedLoanLimits());
        }
        fetchCustomerPriceCategory():void{
          this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERPRICECATEGORY)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          .subscribe({
            next: (res) => {
              const flatpricecategory = Array.isArray(res.data) && Array.isArray(res.data[0])
              ? res.data[0]
              : res.data;
              console.log('Price Category response:', flatpricecategory);
              this.priceCategoryOptions.set(flatpricecategory);
            },
            error: (err) => {
              console.error('Error fetching price category', err);
            },
          });
        }
        // onPriceCategorySelect($event: any){
        //   console.log('Price Category selected:', $event);
        //   this.selectedPriceCategory.set({
        //     key: $event,
        //     value: this.priceCategoryOptions().find(type => type.id === $event)?.name ?? null,
        //   });
        //   console.log("price category", this.selectedPriceCategory());
        // }

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

  console.log('price category:', this.selectedPriceCategory());
}




    selectedCountry = signal<Country | null>(null);
    // Salutation Options
    salutationOptions = [
      { text: 'Ms', value: 'ms' },
      { text: 'Mr', value: 'mr' }
    ];
    isRadioDisabled = computed(() => {
        // Disable radio buttons in 'view' mode, enable in 'edit' or 'new' mode
        const isDisabled = this.mode() === 'view';
        console.log('Radio disabled state:', isDisabled, 'Mode:', this.mode());
        return isDisabled;
      });
      isRadioDisbled = computed(() => { const isEnabled = this.mode() === 'edit';
      console.log('Radio disabled state:', isEnabled, 'Mode:', this.mode());
      return isEnabled;
    });
    
    constructor() {
      super();
      this.commonInit();
      this.fetchCountries();
      this.fethchcommodity();
    }
    fethchcommodity():void{
      this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERCOMMODITY)
      .pipe()
      .subscribe({
        next: (res) => {
          if (!res.isValid && res.httpCode !== 200) {
            console.log(JSON.stringify(res.data, null, 2));
          } else {
            // Flatten from nested array to single array
            const flatcommdity = Array.isArray(res.data) && Array.isArray(res.data[0])
              ? res.data[0]
              : res.data;
            this.commodityOptions.set(flatcommdity);
            console.log('commodity:', this.commodityOptions());
          }
        },
        error: (err) => console.error('Error fetching companies', err),
      });

    }
    onSaleTypeSelect($event: any): void {
      console.log('Sale Type selected:', $event);
      this.selectedSalesType.set({
        key: $event.itemData.id,
        value: $event.itemData.value,
      });
      console.log('Selected Sale Type:', this.selectedSalesType());
    }

    onCommoditySelect(commodity: any):void{
      console.log('Commodity selected:', this.customerSupplierForm.get('commoditysought')?.value);
       const index = this.selectedCommodities.findIndex(c => c.id === commodity.id);
    if (index === -1) {
      // Add the commodity to the array if it's not already present
      this.selectedCommodities.push(commodity);
    } else {
      // Remove the commodity from the array if it's already present
      this.selectedCommodities.splice(index, 1);
    }
    }

    fetchCountries(): void {
        console.log('Fetching countries...');
        this.httpService.fetch<Country[]>(EndpointConstant.FILLCOUNTRY)
          .pipe()
          .subscribe({
            next: (res) => {
              if (!res.isValid && res.httpCode !== 200) {
                console.log(JSON.stringify(res.data, null, 2));
              } else {
                // Flatten from nested array to single array
                const flatCountries = Array.isArray(res.data) && Array.isArray(res.data[0])
                  ? res.data[0]
                  : res.data;
                this.countries.set(flatCountries);
                console.log('Countries:', this.countries());
              }
            },
            error: (err) => console.error('Error fetching companies', err),
          });
      }
  
    ngOnInit(): void {
        this.onInitBase();
      this.SetPageType(1);
      this.fetchCustomerCategory();
      this.fetchcategoryfixed();
      this.fetchCustomerSupplierTypes();
      this.fetchsalutations();
      this.fethchcreditcollectiontype();
      this.fetchCustomerPriceCategory();
      this.fetchArea();
      this.fetchPlaceOfSupply();
      console.log(this.currentPageInfo?.menuText);
    }
   
    override FormInitialize() {
      console.log('FormInitialize called - creating form');
      this.customerSupplierForm = new FormGroup(
        { type: new FormControl({ value: '', disabled: this.isInputDisabled }, Validators.required), // Dropdown Required
          code: new FormControl({ value: '', disabled: this.isInputDisabled },Validators.required), // string Required
          name: new FormControl({ value: '', disabled: this.isInputDisabled },Validators.required), // string Required
          category: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
          active: new FormControl({ value: true, disabled: this.isInputDisabled },Validators.required), // bool Required
        salutation: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown (Mr/Ms)
        arabicname: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        contactpersonname: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        telephoneno: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        addresslineone: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        addressarabic: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        mobileno: new FormControl({ value: '', disabled: this.isInputDisabled },[validPhoneNumber]), // string
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
        emailaddress: new FormControl({ value: '', disabled: this.isInputDisabled },[validEmail]),
        telephoneno2: new FormControl({ value: '', disabled: this.isInputDisabled }),
        centralsalestaxno: new FormControl({ value: '', disabled: this.isInputDisabled }),
        actassupplieralso: new FormControl({ value: false, disabled: this.isInputDisabled }),
        panno: new FormControl({ value: '', disabled: this.isInputDisabled }),
        letsystemgeneratenewaccountforparty: new FormControl({value: true,disabled: this.isInputDisabled,}),
        accountgroup: new FormControl({ value: '', disabled: this.isInputDisabled }), // Add Validators as needed
        account: new FormControl({ value: '', disabled: this.isInputDisabled }), // Add Validators as needed
        remarks: new FormControl({ value: '', disabled: this.isInputDisabled }),
        commoditysought: new FormControl<string[]>([]),
        salestype: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        quantityplanned: new FormControl({ value: '', disabled: this.isInputDisabled }), // int
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
        valueofproperty: new FormControl({ value: '', disabled: this.isInputDisabled }), // decimal
        yearsofbusiness: new FormControl({ value: '', disabled: this.isInputDisabled }), // int
        yearlyturnover: new FormControl({ value: '', disabled: this.isInputDisabled }), // decimal
        marketreputation: new FormControl({ value: '', disabled: this.isInputDisabled }), // string
        categoryrecommended: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        limitrecommended: new FormControl({ value: '', disabled: this.isInputDisabled }),
        categoryfixed: new FormControl({ value: '', disabled: this.isInputDisabled }), // Dropdown
        limitfixedforcustomer: new FormControl({ value: '', disabled: this.isInputDisabled }), // int
        creditperiodpermitted: new FormControl({ value: '', disabled: this.isInputDisabled }), // int
        overdueamountlimit: new FormControl({ value: '', disabled: this.isInputDisabled }), // decimal
        overdueperiodlimit: new FormControl({ value: '', disabled: this.isInputDisabled }), // int
        chequebouncecountlimit: new FormControl({ value: '', disabled: this.isInputDisabled }), // int
        salespricelowvarlimit: new FormControl({ value: '', disabled: this.isInputDisabled }), // decimal
        salespriceupVarlimit: new FormControl({ value: '', disabled: this.isInputDisabled }), // decimal
      });
      console.log('Form initialized with', Object.keys(this.customerSupplierForm.controls).length, 'controls');
      console.log('Form controls:', Object.keys(this.customerSupplierForm.controls));
    }

  onChangeCategory(){
    let selectedCategoryId = this.customerSupplierForm?.get('category')?.value;
    this.selectedCategory = this.customerSupplierCategories?.find(obj => obj?.id == selectedCategoryId) as CUSTOMERSUPPLIERCATEGORIES;
  }

     fetchCustomerSupplierCode(): void{
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
    oncategorychanged($event: any):void{
      console.log('Category changed:', $event);
      this.selectedCategoryFixed.set({
        id: $event.itemData.id,
        name: $event.itemData.name,
      });
      console.log('Selected Category Fixed:', this.selectedCategoryFixed());
    }
fetchCustomerCategory(): void {
  this.httpService
    .fetch(EndpointConstant.FILLCATEGORY)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        console.log('API Response:', response);

        const data = response?.data ?? response;

        this.customerSupplierCategories = Array.isArray(data) ? [...data] : [];

        console.log('Categories loaded:', this.customerSupplierCategories);
      },
      error: (error) => {
        console.error('An Error Occurred', error);
      },
    });
}

    fetchcategoryfixed():void{
      this.httpService.fetch<any>(EndpointConstant.FILLCATEGORYFIXED1)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          console.log('Category fixed response:', res.data);
          const flatcategoryfixed = Array.isArray(res.data) && Array.isArray(res.data[0])
          ? res.data[0]
          : res.data;
          this.categoryfixed.set(flatcategoryfixed);
          console.log('Category fixed:', this.categoryfixed());
        },
      });
    }
    fethchcreditcollectiontype():void{
       this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERCREDITDROPDOWN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          console.log('Salutations response:', res.data);
          this.creditcollectiontypeOptions.set(res.data);
        },
        error: (err) => {
          console.error('Error fetching salutations', err);
        },
      });}

    onCreditCollectionTypeSelect(): void {
      console.log('Credit Collection Type selected:', this.customerSupplierForm.get('creditcollectiontype')?.value);
      this.selectedCreditCollectionType.set({
        key: this.customerSupplierForm.get('creditcollectiontype')?.value,
        value: this.creditcollectiontypeOptions().find(type => type.id === this.customerSupplierForm.get('creditcollectiontype')?.value)?.description ?? null,
      });

    }

    onTypeSelect($event: any): void {
       this.selectedCustomerSupplierType = this.customerSupplierForm?.get('type')?.value;
     this.selectedCustomerType = this.customerSupplierTypes().find((obj: CUSTOMERSUPPLIERTYPE) => obj.id === this.selectedCustomerSupplierType) ?? null;
    if(this.selectedCustomerSupplierType == 1){
      this.customerSupplierForm.get('creditperiod')?.enable();
    } else if(this.selectedCustomerSupplierType == 2){
      this.customerSupplierForm.get('creditperiod')?.disable();
    }
    this.fetchCustomerSupplierCode();
    this.fetchAccountGroup();
    }

  fetchCustomerSupplierTypes(): void {
  this.httpService
    .fetch<any[]>(EndpointConstant.FILLCUSTOMERSUPPLIERTYPE)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (res) => {
          console.log('CustomerSupplierTypes response:', res.data);
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
 
fetchAccountGroup() {
  console.log("account group data:");

  const type = this.customerSupplierForm.get('type')?.value;
  let typename = "";

  if (type === 1) {
    typename = 'CUSTOMER';
  } else if (type === 2) {
    typename = 'SUPPLIER';
  }

  if (typename != "") {
    this.httpService
      .fetch(EndpointConstant.FILLCUSTOMERACCOUNTGROUP)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {

          // ✅ IMPORTANT FIX
          this.accountGroupData.set(response?.data ?? [] as any);

          console.log("api response:", this.accountGroupData());

          if (!this.isUpdate() && !this.isInputDisabled) {
            this.accountGroupData().forEach(element => {
              if (
                (element.name === 'Sundry Debtors' && type === 1) ||
                (element.name === 'Sundry Creditors' && type === 2)
              ) {
                this.customerSupplierForm.patchValue({
                  accountgroup: element.id
                });
                this.onChangeAccountGroup();
              }
            });
          }

          if (this.selectedAccountGroupId !== 0) {
            this.customerSupplierForm.patchValue({
              accountgroup: this.selectedAccountGroupId
            });
            this.onChangeAccountGroup();
          }
        },
        error: (error) => {
          console.error('An Error Occurred', error);
        },
      });
  }
}

onChangeAccountOption(event: any) {
  const accountGenerate = event.checked === true;

  const accountControl = this.customerSupplierForm.get('account');

  if (accountGenerate) {
    accountControl?.disable();   // ✅ disable dropdown
  } else {
    accountControl?.enable();    // ✅ enable dropdown
  }
}

   onChangeAccountGroup(){
    let accountGroupId = this.customerSupplierForm?.get('accountgroup')?.value;
    this.fetchAccount(accountGroupId);
  }

    fetchAccount(accountGroupId:any){
    this.httpService
    .fetch(EndpointConstant.FILLCUSTOMERACCOUNT+accountGroupId+'&tree=true')
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        //this.accountData = response?.data as any;
         this.accountData.set(response?.data ?? [] as any);
        if(this.selectedAccountId != 0){
          this.customerSupplierForm.patchValue({
            account:this.selectedAccountId
          });
        }
      },
      error: (error) => {
        console.error('An Error Occured', error);
      },
    });
  }

  onSalutationSelect($event: any): void {
    console.log('Salutation selected:', $event);
    this.selectedCustomerSupplierSalutation.set({
      key: $event.itemData.id,
      value: $event.itemData.text,
    });
    console.log('Selected Customer Supplier Salutation:', this.selectedCustomerSupplierSalutation());
  }
  
addRow(startEdit: boolean = true) {
  if (!this.grid) {
    console.warn("Grid reference not available yet");
    return;
  }

  this.grid.addRecord();    // inserts a new row at top

  if (startEdit) {
    setTimeout(() => this.grid.startEdit(), 50);   // optional: immediately open edit
  }
}

  private unwrapArrayResponse<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      const [first] = response;
      return Array.isArray(first) ? first : (response as T[]);
    }

    if (response && typeof response === 'object') {
      const data = (response as { data?: unknown }).data;
      if (Array.isArray(data)) {
        return this.unwrapArrayResponse<T>(data);
      }
    }

    return [];
  }

  fetchsalutations(): void {
    this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERSUPPLIERSALESMANDROPDOWN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          console.log('Salutations response:', res.data);
        },
        error: (err) => {
          console.error('Error fetching salutations', err);
        },
      });
  }
  
    override async LeftGridInit() {
      this.pageheading = 'Customer Supplier';
      try {
        const res = await firstValueFrom(
          this.httpService
            .fetch<any[]>(EndpointConstant.FILLALLCUSTOMERSUPPLIER)
        );

        // Handle different response structures
        let dataToUse: any[] = [];
        
        // Check if response is directly an array (unwrapped)
        if (Array.isArray(res)) {
          dataToUse = res;
          console.log('Response is directly an array, using res directly');
        }
        // Check if data exists in res.data
        else if (res && res.data !== undefined) {
          // Check if res.data is an array
          if (Array.isArray(res.data)) {
            // Check if it's nested array like [[{...}]]
            if (Array.isArray(res.data[0])) {
              dataToUse = res.data[0];
              console.log('Data is nested array, using res.data[0]');
            } else {
              dataToUse = res.data;
              console.log('Data is array, using res.data');
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
        console.log('Final data to use:', this.leftGrid.leftGridData);
        console.log('Data length:', this.leftGrid.leftGridData?.length);

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
        console.error('Error fetching companies:', err);
      }
    }
  
    override getDataById(data:PCustomerSupplierModel) { 
        console.log('data', data);
        this.currentCustomerSupplier.set(data);
        this.mode.set('view'); // Set mode to 'view' to disable radio buttons
        this.patchFormFromCurrent();
       // this.makePristine();
      
    }
    private patchFormFromCurrent(): void {
        const cur = this.currentCustomerSupplier();
        console.log('currentCustomerSupplier',cur);
        this.httpService.fetch<PCustomerSupplierFetchbyIdModel>(EndpointConstant.FILLCUSTOMERSUPPLIERBYID+cur.id+'&pageId='+105)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (
            response:
              | ApiResponseDto<PCustomerSupplierFetchbyIdModel>
              | PCustomerSupplierFetchbyIdModel
          ) => {
            const payload: PCustomerSupplierFetchbyIdResponse | undefined = hasDataWrapper<
              PCustomerSupplierFetchbyIdModel
            >(response)
              ? response.data
              : (response as PCustomerSupplierFetchbyIdResponse | undefined);
            console.log('response', payload?.result);
            this.currentCustomerSupplier.set(payload?.result ?? null);
             const customerSupplierData = payload?.result;
            if (!customerSupplierData) {
              console.warn('Customer supplier payload missing `result`.', payload);
              return;
            }
            

            const customerData =
              payload?.result?.custDetails?.[0] ?? payload?.custDetails?.[0];
            this.customerSupplierForm.patchValue({
              type: customerSupplierData.nature === 'C' ? 1 : 2,
              code: customerSupplierData.code,
              name: customerSupplierData.name,
              category: customerSupplierData.partyCategoryID,
              active: customerSupplierData.active,
              salutation: customerSupplierData.salutation,
              arabicname: customerSupplierData.arabicName,
              contactpersonname: customerSupplierData.contactPerson,
              telephoneno: customerSupplierData.telephoneNo,
              addresslineone: customerSupplierData.addressLineOne,
              addressarabic: customerSupplierData.addressLineTwo,
              mobileno: customerSupplierData.mobileNo,
              vatno: customerSupplierData.salesTaxNo,
              creditperiod: customerData ? customerData.creditPeriod : null,
              creditlimit: customerSupplierData.creditLimit,
              salesman: customerSupplierData.salesManID,
              city: customerSupplierData.city,
              pobox: customerSupplierData.pobox,
              countrycode: customerSupplierData.countryCode,
              country:customerSupplierData.country,
              buildingno: customerSupplierData.bulidingNo,
              district: customerSupplierData.district,
              districtarabic: customerSupplierData.districtArabic,
              cityarabic: customerSupplierData.cityArabic,
              provincearabic: customerSupplierData.provinceArabic,
              area: customerSupplierData.area,
              province: customerSupplierData.province,
              faxno: customerSupplierData.faxNo,
              contactperson2: customerSupplierData.contactPerson2,
              emailaddress: customerSupplierData.emailAddress,
              telephoneno2: customerSupplierData.telephoneNo2,
              centralsalestaxno: customerSupplierData.centralSalesTaxNo,
              actassupplieralso: customerSupplierData.isMultiNature,
              panno: customerSupplierData.panNo,
              letsystemgeneratenewaccountforparty: false,
             account: customerSupplierData.accountID,
              remarks: customerSupplierData.remarks,
              salestype:customerData?.cashCreditType,
              quantityplanned: customerData?.plannedPcs,
              basicunit:customerData?.plannedCFT,
               creditcollectiontype:customerData?.creditCollnThru,
               dl1:customerSupplierData.dL1,
               dl2:customerSupplierData.dL2,
               pricecategory:customerSupplierData.priceCategoryID,
               placeofsupply:customerSupplierData.placeOfSupply,
               businesstype:customerData?.busPrimaryType,
               availedanyloanlimits:customerData?.isLoanAvailed,
               businessnature:customerData?.busRetailType,
               othermerchantsofcustomer:customerData?.mainMerchants,
               businessaddress:customerData?.addressOwned,
               valueofproperty:customerData?.valueofProperty,
               yearsofbusiness:customerData?.busYears,
               yearlyturnover:customerData?.busYearTurnover,
               marketreputation:customerData?.marketReputation,
               categoryrecommended:customerData?.bandByImportID,
               limitrecommended:customerData?.salesLimitByImport,
               categoryfixed:customerData?.bandByHOID,
               limitfixedforcustomer:customerData?.salesLimitByHO,
               creditperiodpermitted:customerData?.creditPeriodByHO,
               overdueamountlimit:customerData?.overdueLimitPerc,
               chequebouncecountlimit:customerData?.chequeBounceLimit,          
               overdueperiodlimit:customerData?.overduePeriodLimit,
               salespricelowvarlimit:customerData?.salesPriceLowVarPerc,          
               salespriceupVarlimit:customerData?.salesPriceUpVarPerc ,           
               commoditysought:(
                payload?.result?.commoditySought ??
                payload?.commoditySought ??
                []
              ).map((commodity: PCustomerSupplierCommodityDto) => commodity.id)
            });
            
            // Set selectedAreaOption for the multidropdown
            const areaValue = customerSupplierData.area;
            if (areaValue) {
              // Handle both number (id) and object cases
              const areaId = typeof areaValue === 'object' && areaValue !== null && 'id' in areaValue 
                ? (areaValue as { id: number }).id 
                : (typeof areaValue === 'number' ? areaValue : null);
              this.selectedAreaOption = areaId ?? null;
              
              // Find and set the selected area
              if (areaId !== null) {
                const selectedArea = this.areaOptions().find((a) => a.id === areaId);
                if (selectedArea) {
                  this.selectedArea.set({
                    code: selectedArea.code ?? "",
                    name: selectedArea.value ?? "",
                    id: selectedArea.id ?? 0,
                  });
                }
              }
            } else {
              this.selectedAreaOption = null;
            }
            
            // this.onTypeSelect();
            // this.onChangeCategory();
            // this.accountGroup = response.accountGroup[0];
            // this.selectedCommodities = response.commoditySought;
            // this.selectedAccountId = customerSupplierData.accountID;
            // this.selectedAccountGroupId = response.accountGroup[0].id;
            // this.selectedSalesmanOption = (customerSupplierData.salesMan == null) ? '' : customerSupplierData.salesMan;
            // this.selectedSalesmanId = customerSupplierData.salesManID;
            // this.onAreaSelected(customerSupplierData.area);
            // this.selectedPlaceofSupplyOption = customerSupplierData.placeOfSupply;
            // this.imageData = response?.img;
            // this.onChangePriceCategory();
            // this.onChangeCategoryFixed();
            // this.onChangeCategoryRecommended();
            // if(this.currentCustomerSupplier.nature === 'C'){
            //   this.selectedCustomerSupplierType = 1;
            // } else{
            //   this.selectedCustomerSupplierType = 2;
            // }
          },
          error: (err: any) => {
            console.error('Error fetching customer supplier:', err);
          }
        });
          
      }

        findcountry(countryId: number): Country | null {
           const country = this.countries().find(c => c.id === countryId) || null;
           console.log('country',country);
           this.selectedCountry.set(country);
           return country;
        }
      
  
    override DeleteData(data: PCustomerSupplierModel) {
      console.log('deleted');
    }
  
    override formValidationError(){
      console.log("form error found");
    }
    override newbuttonClicked(): void {
        console.log('new operation started');
        this.customerSupplierForm.reset();
        this.selectedAreaOption = null;
      //  this.selectedArea.set({ id: 0, name: "", code: "" });
        this.fetchCountries();
        this.fetchCustomerSupplierTypes();
        this.isInputDisabled=false;
        this.customerSupplierForm.enable();
         this.grid.addRecord();
        //this.isInputDisabled=false;
        this.fetchArea();
    
        
        // this.selectedContactPerson.set(null);
        // this.selectedCountry.set(null);
      
        // this.isActive = true;
        // this.isEditMode.set(false);
        // this.isNewMode.set(true);
        // this.isNewBtnDisabled.set(false);
        // this.isEditBtnDisabled.set(true);
      }
  override onEditClick(){
    console.log('we have entered in to edit mode ')
    this.isUpdate.set(true);
    this.customerSupplierForm.enable();
    this.isInputDisabled=false;
  }

    onAreaSelected($event: any):void{
       const selectedId =$event?.itemData?.id ?? $event?.value ?? null; 
       console.log("darzu",$event);
       this.selectedarea = { id: Number($event.itemData.value), value: $event.itemData.text };
    console.log(this.selectedarea);
  }

  fetchArea(): void{
    this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERSUPPLIERAREA)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        const areaData:any = response?.data;
        console.log('areaData', areaData);
        this.areaOptions.set(areaData);
        console.log('areaOptions', this.areaOptions());
      },
      error: (error) => {
        console.error('An Error Occured', error);
        this.areaOptions.set([]);
      },
    });    
  }
  //  onPlayofSupplySelected($event: any):void{
  //      const selectedId =$event?.itemData?.id ?? $event?.value ?? null; 
  //      this.selectedPlaceofSupply = { id: Number($event.itemData.value), value: $event.itemData.text };
  //   console.log(this.selectedPlaceofSupply);
  // }
onPlayofSupplySelected($event: any): void {
  const item = $event?.itemData;

  // if (!item) {
  //   this.selectedPlaceofSupply.set(null);
  //   return;
  // }

  this.selectedPlaceofSupply.set({
    id: Number(item.id ?? item.value),
    value: item.text
  });

  console.log(this.selectedPlaceofSupply());
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
        console.log('placeofsupply:', this.placeofSupplyOptions());
      },
      error: (error) => {
        console.error('An Error Occured', error);
      },
    });
}


// fetchPlaceOfSupply(): void {
//   this.httpService
//     .fetch(EndpointConstant.FILLCUSTOMERPLACEOFSUPPLY)
//     .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
//     .subscribe({
//       next: (response: any) => {
//         const data = response?.data?.[0] ?? [];

//         const options: AREAGROUPPOPUP[] = data.map((item: any) => ({
//           id: item.id,
//           value: item.value
//         }));

//         this.placeofSupplyOptions.set(options);

//         console.log('Place of supply options:', this.placeofSupplyOptions());
//       },
//       error: (error) => {
//         console.error('An Error Occured', error);
//       },
//     });
// }

  
    onCountrySelect($event: any): void {
        console.log('Country selected:', $event);
        this.selectedCountry.set({
          id: $event.itemData.id,
          value: $event.itemData.value,
        });
        console.log('Selected Country:', this.selectedCountry());
       
        console.log('Country selected, value:', this.selectedCountry()?.value);
    
    
      }

    // Tab Selection Handler
    onTabSelecting(args: any): void {
      console.log('Tab selecting:', args);
    }

    // Dropdown Change Handlers
    
    onSalesmanSelected(event: any): void {
      console.log('Salesman selected:', event);
    }


    translateItemName(): void {
      console.log('Translate clicked');
      // Implement translation logic here
    }

    // Delivery Grid Handlers
    onDeliveryGridActionBegin(args: any): void {
      console.log('Grid action begin:', args);
    }

    onDeliveryGridActionComplete(args: any): void {
      console.log('Grid action complete:', args);
    }
     // Handle account selection change
  onAccountChange($event: any): void {
    if ($event && $event.itemData) {
      const selectedAccount = $event.itemData;
      console.log('Selected account:', selectedAccount);
      
      // You can update other form controls or perform actions
      // For example, set account name in a separate field:
      this.customerSupplierForm.patchValue({
        accountName: selectedAccount.name,
        accountId: selectedAccount.id
      });
    }
  }

  override SaveFormData(): void {
   
//     if(this.customerSupplierForm.value.businesstype){
//       // Update the signal using .set() method
// this.selectedBusinessAddress.set({
//   key: "string",
//   value: this.customerSupplierForm.value.businesstype
// });

// // To verify it's set correctly
// console.log('Selected Business Address:', this.selectedBusinessAddress());
//     }
//     //credit collection type ...
//     if(this.customerSupplierForm.value.salestype){
//       let salesTypeName = null;
//       this.saleTypes().forEach(item => {
//         if(item.id == this.customerSupplierForm.value.salestype){
//           salesTypeName = item.value;
//         }
//       });

//       this.selectedSalesType.set({
//         key:this.customerSupplierForm.value.salestype,
//         value:salesTypeName
//       });
//     }

//     //availed loan limits ...
//     if(this.customerSupplierForm.value.availedanyloanlimits){
//       let availedLoanLimitName = "string";
//       if(this.customerSupplierForm.value.availedanyloanlimits == 'Y'){
//         availedLoanLimitName = 'Yes';
//       } else if(this.customerSupplierForm.value.availedanyloanlimits == 'N'){
//         availedLoanLimitName = 'No';
//       } 

//       this.selectedAvailedLoanLimits.set({
//         key:this.customerSupplierForm.value.availedanyloanlimits,
//         value:availedLoanLimitName
//       });
//     }

//     //business nature....
//     if(this.customerSupplierForm.value.businessnature){
//       let businessNatureName = "string";
//       if(this.customerSupplierForm.value.businessnature == 'R'){
//         businessNatureName = 'Retail';
//       } else if(this.customerSupplierForm.value.businessnature == 'W'){
//         businessNatureName = 'Whole Sale';
//       } 
//       this.selectedBusinessNature.set({
//         key:this.customerSupplierForm.value.businessnature,
//         value:businessNatureName
//       });
//     }

//     //business address....
//     if(this.customerSupplierForm.value.businessaddress){
//       let businessAddressName = "string";
//       if(this.customerSupplierForm.value.businessnature == 'O'){
//         businessAddressName = 'Owned';
//       } else if(this.customerSupplierForm.value.businessnature == 'R'){
//         businessAddressName = 'Rented';
//       } 

//       this.selectedBusinessAddress.set({
//         key:this.customerSupplierForm.value.businessaddress,
//         value:businessAddressName
//       });
//     }

//     //credit collection type...
//     if(this.customerSupplierForm.value.creditcollectiontype){
//       let creditCollectionName = "string";
//       this.creditCollectionData().forEach(item => {
//         if(item.value == this.customerSupplierForm.value.creditcollectiontype){
//           creditCollectionName = item.description;
//         }
//       });

//       this.selectedCreditCollectionType.set({
//         key:this.customerSupplierForm.value.creditcollectiontype,
//         value:creditCollectionName
//       });
//     }

//     //market reputattion...
//     if(this.customerSupplierForm.value.marketreputation){
//       let marketReputationName = null;
//       if(this.customerSupplierForm.value.marketreputation == 'V'){
//         marketReputationName = 'Very Good';
//       } else if(this.customerSupplierForm.value.marketreputation == 'G'){
//         marketReputationName = 'Good';
//       }  else if(this.customerSupplierForm.value.marketreputation == 'A'){
//         marketReputationName = 'Average';
//       }  else if(this.customerSupplierForm.value.marketreputation == 'B'){
//         marketReputationName = 'Below Average';
//       } 

//       this.selectedMarketReputation.set({
//         key:this.customerSupplierForm.value.marketreputation,
//         value:marketReputationName
//       });
//     }

//     this.accountGroupData().forEach(item => {
//       if(item.id == this.customerSupplierForm.value.accountgroup){
//         this.accountGroup = item;
//       }
//     });

//     this.accountData().forEach(item => {
//       if(item.id == this.customerSupplierForm.value.account){
//         this.account = item;
//       }
//     });
//     let placeofsupply = {
//       "id": 0,
//       "value": this.customerSupplierForm.value.placeofsupply
//     }
//     let countryName = null;
//     this.countries().forEach(item => {
//       if(item.id == this.customerSupplierForm.value.country){
//         countryName = item.value;
//       }
//     });
//     let country = {
//       "id": this.customerSupplierForm.value.country ? this.customerSupplierForm.value.country : 0,
//       "value": countryName
//     }

//     // Assuming selectedCommodityIds contains the selected IDs
//     let selectedCommodityIds = this.customerSupplierForm.get('commoditysought')?.value;

//     // Filter the listCommoditySought array to get the selected commodity objects
//     if(selectedCommodityIds){
//       this.selectedCommodities = this.listCommoditySought().filter(commodity =>
//         selectedCommodityIds.includes(commodity.id)
//       );
//     }
let countryName = null;

    const payloadtest = {
  "id": this.isUpdate() ? this.selectedCustomerSupplierId : 0,
  "type": this.selectedCustomerType,
  "category": this.selectedCategory,
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
  "creditPeriod": this.customerSupplierForm.value.creditperiod ? this.customerSupplierForm.value.creditperiod: 0,
  "creditLimit": this.customerSupplierForm.value.creditlimit,
  "salesMan": this.customerSupplierForm.value.salesman,
  "city": this.customerSupplierForm.value.city,
  "poBox": this.customerSupplierForm.value.pobox,
  "countryCode": this.customerSupplierForm.value.countrycode,
   "country": {
      "id": this.customerSupplierForm.value.country ? this.customerSupplierForm.value.country : 0,
      "value": countryName
    },
     "bulidingNo": this.customerSupplierForm.value.buildingno,
     "district": this.customerSupplierForm.value.district,
     "districtArabic": this.customerSupplierForm.value.districtarabic,
     "cityArabic": this.customerSupplierForm.value.cityarabic,
     "provinceArabic": this.customerSupplierForm.value.provincearabic,
     "area": this.selectedarea,
      "province": this.customerSupplierForm.value.province,
     "faxNo": this.customerSupplierForm.value.faxno,
    "contactPerson2": this.customerSupplierForm.value.contactperson2,
    "emailAddress": this.customerSupplierForm.value.emailaddress,
    "telephoneNo2": this.customerSupplierForm.value.telephoneno2,
   "centralSalesTaxNo": this.customerSupplierForm.value.centralsalestaxno,
     "actAsSupplierAlso": this.customerSupplierForm.value.actassupplieralso,
     "panNo": this.customerSupplierForm.value.panno,
   "letSystemGenNewAccForParty": this.customerSupplierForm.value.letsystemgeneratenewaccountforparty,
  // "accountGroup": this.selectedAccountGroupId,
  //   "account": this.account,
   "accountGroup": {
    "id": 633,
    "name": "string"
  },
  "account": {
    "id": 1,
    "name": "string"
  },
   "remarks": this.customerSupplierForm.value.remarks,
   "image": this.imageData ? this.imageData : null,
        "customerDetails": {
           "commoditySought": this.selectedCommodities,
           "salesType": this.selectedSalesType(),
           "quantityPlanned":this.customerSupplierForm.value.quantityplanned ? this.customerSupplierForm.value.quantityplanned : 0,
           "basicUnit": this.customerSupplierForm.value.basicunit ? this.customerSupplierForm.value.basicunit : 0,
           "creditCollectionType": this.selectedCreditCollectionType,
           "dL1": this.customerSupplierForm.value.dl1,
           "dL2": this.customerSupplierForm.value.dl2,
          "priceCategory": this.selectedPriceCategory(),
           "placeOfSupply":this.placeofSupplyOptions(),
           "businessType": this.selectedBusinessType,
          "availedAnyLoanLimits": this.selectedAvailedLoanLimits,
          "businessNature": this.selectedBusinessNature,
          "otherMerchantsOfCustomer": this.customerSupplierForm.value.othermerchantsofcustomer,
          "businessAddress": this.selectedBusinessAddress,
          "valueOfProperty": this.customerSupplierForm.value.valueofproperty ? this.customerSupplierForm.value.valueofproperty :0,
          "yearsOfBusiness": this.customerSupplierForm.value.yearsofbusiness ? this.customerSupplierForm.value.yearsofbusiness : 0,
          "yearlyTurnover": this.customerSupplierForm.value.yearlyturnover ? this.customerSupplierForm.value.yearlyturnover : 0,
          "marketReputation":this.selectedMarketReputation,
          "categoryRecommended": this.selectedCategoryRecommended,
          "limitRecommended": this.customerSupplierForm.value.limitrecommended ? this.customerSupplierForm.value.limitrecommended : 0,
          "categoryFixed": this.selectedCategoryFixed,
          "limitFixedForCustomer": this.customerSupplierForm.value.limitfixedforcustomer ? this.customerSupplierForm.value.limitfixedforcustomer : 0,
          "creditPeriodPermitted": this.customerSupplierForm.value.creditperiodpermitted ? this.customerSupplierForm.value.creditperiodpermitted : 0,
          "overdueAmountLimit": this.customerSupplierForm.value.overdueamountlimit ? this.customerSupplierForm.value.overdueamountlimit : 0,
          "overduePeriodLimit": this.customerSupplierForm.value.overdueperiodlimit ? this.customerSupplierForm.value.overdueperiodlimit : 0,
          "chequeBounceCountLimit": this.customerSupplierForm.value.chequebouncecountlimit ? this.customerSupplierForm.value.chequebouncecountlimit : 0,
          "salesPriceLowVarLimit": this.customerSupplierForm.value.salespricelowvarlimit ? this.customerSupplierForm.value.salespricelowvarlimit : 0,
          "salesPriceUpVarLimit": this.customerSupplierForm.value.salespriceupVarlimit ? this.customerSupplierForm.value.salespriceupVarlimit : 0,
        },
         "deliveryDetails": this.allDeliveryDetails

  // "customerDetails": {
  //   "commoditySought": [
  //     {
  //       "id": 54,
  //       "value": "string"
  //     }
  //   ],
  //   "salesType": {
  //     "key": null,
  //     "value": "string"
  //   },
  //   "quantityPlanned": 0,
  //   "basicUnit": 0,
  //   "creditCollectionType": {
  //     "key": null,
  //     "value": "string"
  //   },
  //   "dL1": "string",
  //   "dL2": "string",
  //   "priceCategory": {
  //     "id": 0,
  //     "name": "string"
  //   },
  //   "placeOfSupply": {
  //     "id": 0,
  //     "value": "string"
  //   },
  //   "businessType": {
  //     "key": "P",
  //     "value": "string"
  //   },
  //   "availedAnyLoanLimits": {
  //     "key": "Y",
  //     "value": "string"
  //   },
  //   "businessNature": {
  //     "key": "R",
  //     "value": "string"
  //   },
  //   "otherMerchantsOfCustomer": "string",
  //   "businessAddress": {
  //     "key": "O",
  //     "value": "string"
  //   },
  //   "valueOfProperty": 0,
  //   "yearsOfBusiness": 0,
  //   "yearlyTurnover": 0,
  //   "marketReputation": {
  //     "key": "G",
  //     "value": "string"
  //   },
  //   "categoryRecommended": {
  //     "id": 1,
  //     "name": "string"
  //   },
  //   "limitRecommended": 0,
  //   "categoryFixed": {
  //     "id": 1,
  //     "name": "string"
  //   },
  //   "limitFixedForCustomer": 0,
  //   "creditPeriodPermitted": 0,
  //   "overdueAmountLimit": 0,
  //   "overduePeriodLimit": 0,
  //   "chequeBounceCountLimit": 0,
  //   "salesPriceLowVarLimit": 0,
  //   "salesPriceUpVarLimit": 0
  // },
  // "deliveryDetails": [
  //   {
  //     "delId": 0,
  //     "locationName": "Kochi",
  //     "projectName": "Abcd",
  //     "contactPerson": "string",
  //     "contactNo": "string",
  //     "address": "string"
  //   }
  // ]
};

console.log("=======================================================")
console.log(payloadtest);
  
    // console.log("payload in save:",payload);
    if(this.isUpdate()){
      this.updateCallback(payloadtest);
    } else{
      this.createCallback(payloadtest);

      console.log("#====================================")
    }
  }

  updateCallback(payload:any){
    this.httpService.patch(EndpointConstant.UPDATECUSTOMERSUPPLIER+this.currentPageInfo?.id,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          if(response.httpCode == 201){
            this.toast.success("Successfully updated customer supplier"); 
            this.imageData = null;         
            this.selectedCustomerSupplierId=this.firstCustomerSupplier;
            //this.getDataById();
            this.LeftGridInit();
          } else{
            this.baseService.showCustomDialogue('Some error occred');
          }
        },
        error: (error) => {
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

  createCallback(payload:any){
    console.log("save:",payload);
    this.httpService.post(EndpointConstant.SAVECUSTOMERSUPPLIER+this.currentPageInfo?.id,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.log("dataaaa",response.data);
          if(response.httpCode == 201){
            console.log(response.data)
            this.toast.success('Successfully saved customer supplier');  
            this.imageData = null;         
            this.selectedCustomerSupplierId = this.firstCustomerSupplier;
            this.LeftGridInit(); 
            const queryParams = this.route.snapshot.queryParams;
   
            if (queryParams && queryParams['partyId'] && queryParams['partyId'] == 0) {
              // Notify other tabs
              localStorage.setItem('customerSaved', JSON.stringify({ timestamp: new Date() }));
            } 
          } else{            
            this.baseService.showCustomDialogue('Some error occured');
          }
          
        },
        error: (error) => {
          console.error('Error saving customersupplier', error);
        },
      });
  }


  }
  