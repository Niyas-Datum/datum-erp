import { Component, inject, OnInit } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { InventoryAppService } from "../../http/inventory-app.service";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TaxTypeAcDrpDwn, TaxTypeDrpDwn, TaxTypeFillMaster, TaxTypeMaster } from "../model/ptaxType.model";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ValidationService } from "@org/services";

@Component({
  selector: 'app-taxType-Main',
  standalone: false,
  templateUrl: './taxType.component.html',
  styles: [],
})
export class TaxTypeComponent extends BaseComponent implements OnInit{
     private httpService = inject(InventoryAppService);
      taxTypeForm = this.formUtil.thisForm;
       allTaxTypeMaster = [] as Array<TaxTypeFillMaster>;   
  selectedTaxTypeMasterId = 0;
  firstTaxTypeMaster = 0;

  isLoading = false;
   isView = true;
  isCreate = true;
  isEdit = true;
  isDelete = true;
  isCancel = true;
  isEditApproved = true;
  isHigherApproved = true;

allType: any[] = [
  { Id: "Item", Value: "Item" },
  { Id: "Total", Value: "Total" },
  { Id: "Service", Value: "Service" }
];

selectedTypeId = 0;
selectedTypeName = "";


  allreceivableAccount = [] as Array<TaxTypeAcDrpDwn>;
receivableAccountOptions: any = [];
  selectedreceivableAccountId = 0;
  selectedreceivableAccountName = "";


  allpayableAccount = [] as Array<TaxTypeAcDrpDwn>;
  payableAccountOptions: any = [];
  selectedpayableAccountId = 0;
  selectedpayableAccountName = "";

  allsalePurMode = [] as Array<TaxTypeDrpDwn>;
  salePurModeOptions: any = [];
  selectedsalePurModeId = 0;
  selectedsalePurModeName = "";

  allTaxType = [] as Array<TaxTypeDrpDwn>;
  saleTaxTypeOptions: any = [];
  selectedTaxTypeId = 0;
  selectedTaxTypeName = "";


  allsgstReceivable = [] as Array<TaxTypeAcDrpDwn>;
  sgstReceivableOptions: any = [];
  selectedsgstReceivableId = 0;
  selectedsgstReceivableName = "";

  allcgstReceivable = [] as Array<TaxTypeAcDrpDwn>;
  cgstReceivableOptions: any = [];
  selectedcgstReceivableId = 0;
  selectedcgstReceivableName = "";

  allsgstPayable = [] as Array<TaxTypeAcDrpDwn>;
  sgstPayableOptions: any = [];
  selectedsgstPayableId = 0;
  selectedsgstPayableName = "";

  allcgstPayable = [] as Array<TaxTypeAcDrpDwn>;
  cgstPayableOptions: any = [];
  selectedcgstPayableId =0;
  selectedcgstPayableName = "";

  allcessPayables = [] as Array<TaxTypeAcDrpDwn>;
  cessPayablesOptions: any = [];
  selectedcessPayablesId  = 0;
  selectedcessPayablesName = "";

  allcessReceivable = [] as Array<TaxTypeAcDrpDwn>;
  cessReceivableOptions: any = [];
  selectedcessReceivableId= 0;
  selectedcessReceivableName = "";

  currentTaxType = {} as TaxTypeMaster;   
  isInputDisabled = true;
  isNewBtnDisabled = false;
  isEditBtnDisabled = false;
  isDeleteBtnDisabled = false; 
  isSaveBtnDisabled = true; 
  isUpdate = false;
  
    commonFillData:any = [];

  
      constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.fetchLoadData();
  }
    override async LeftGridInit() {
      this.pageheading = 'TaxType';
      try {
  
        // Developer permision allowed
        const res = await firstValueFrom(
          this.httpService
            .fetch<any[]>(EndpointConstant.FILLTAXTYPEMASTER)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        );
  // not alolowed 
        // handle data here after await completes
        this.leftGrid.leftGridData = res.data;
        console.log('Fetched data:', this.leftGrid.leftGridData);
  
        this.leftGrid.leftGridColumns = [
          {
            headerText: 'TaxType List',
            columns: [
              {
                field: 'name',
                datacol: 'name',
                headerText: 'Name',
                textAlign: 'Left',
              },
              {
                field: 'type',
                datacol: 'type',
                headerText: 'Type',
                textAlign: 'Left',
              },
            ],
          },
        ];
         const count = this.leftGrid.leftGridData.length;

if (count > 0) {
        this.selectedTaxTypeMasterId=this.leftGrid.leftGridData[count-1].ID;
        this.selectedTaxTypeId=this.selectedTaxTypeMasterId;
        this.fetchTaxTypeById();
}
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    }

   onTypeSelected(e: any = {}) {
  const id = e.value ?? this.taxTypeForm.get("type")?.value;

  if (!id) {
    this.selectedTypeId = 0;
    this.selectedTypeName = "";
    return;
  }

  this.selectedTypeId = id;
  this.selectedTypeName = e.itemData?.Value ?? "";
  console.info("type",this.selectedTypeName)
}

    onreceivableAccountSelected() 
    {  
    this.receivableAccountOptions = this.taxTypeForm.get("receivableAccount");
if (!this.receivableAccountOptions) return;

  const value = this.receivableAccountOptions.value;

  if (!value) {
    this.selectedreceivableAccountId = 0;
    this.selectedreceivableAccountName = "";
    return;
  }

  this.selectedreceivableAccountId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allreceivableAccount)) {
    console.warn("allreceivableAccount is not loaded yet");
    return;
  }
console.log("selectedreceivableAccountId",this.selectedreceivableAccountId)


        // Find the selected option in the list
        const selectedItem = this.allreceivableAccount.find(item => item.ID === this.selectedreceivableAccountId);
        if (selectedItem) {
        this.selectedreceivableAccountName = selectedItem.Name;
        
    }
    }

    onpayableAccountSelected() 
    {  
        this.payableAccountOptions = this.taxTypeForm.get("payableAccount");
  if (!this.payableAccountOptions) return;

  const value = this.payableAccountOptions.value;

  if (!value) {
    this.selectedpayableAccountId = 0;
    this.selectedpayableAccountName = "";
    return;
  }

  this.selectedpayableAccountId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allpayableAccount)) {
    console.warn("allTaxType is not loaded yet");
    return;
  }
console.log("cessid",this.selectedpayableAccountId)

            // Find the selected option in the list
            const selectedItem = this.allpayableAccount.find(item => item.ID === this.selectedpayableAccountId);
            if (selectedItem) {
            this.selectedpayableAccountName = selectedItem.Name;
            }
        
    }

    onsalePurcModeSelected() {  
            const control = this.taxTypeForm.get("salePurcMode");
            if (!control) return;
            const value = control.value;

            if (!value) {
              this.selectedsalePurModeId = 0;
              this.selectedsalePurModeName = "";
              return;
            }

            this.selectedsalePurModeId = Number(value);

            // ❌ this.allsalePurMode may be NULL
            if (!Array.isArray(this.allsalePurMode)) {
              console.warn("allsalePurMode is not loaded yet");
              return;
            }

            const selectedItem = this.allsalePurMode.find(
              item => Number(item.ID) === this.selectedsalePurModeId
            )?.Value;

            this.selectedsalePurModeName = selectedItem ?? "";

            console.log("selectedsalePurModeName:", this.selectedsalePurModeName);
          }


    ontaxTypeSelected()
    {   
        this.saleTaxTypeOptions = this.taxTypeForm.get("taxType");
        if (!this.saleTaxTypeOptions) return;

  const value = this.saleTaxTypeOptions.value;

  if (!value) {
    this.selectedTaxTypeId = 0;
    this.selectedTaxTypeName = "";
    return;
  }

  this.selectedTaxTypeId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allTaxType)) {
    console.warn("allTaxType is not loaded yet");
    return;
  }
console.log("cessid",this.selectedTaxTypeId)

            // Find the selected option in the list
            const selectedItem = this.allTaxType.find(item => item.ID === this.selectedTaxTypeId);
            if (selectedItem) {
            this.selectedTaxTypeName = selectedItem.Value;
            }
         
    }
    onsgstReceivableSelected()
    {   
        this.sgstReceivableOptions = this.taxTypeForm.get("sgstReceivable");
         if (!this.sgstReceivableOptions) return;

  const value = this.sgstReceivableOptions.value;

  if (!value) {
    this.selectedsgstReceivableId = 0;
    this.selectedsgstReceivableName = "";
    return;
  }

  this.selectedcgstPayableId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allcgstReceivable)) {
    console.warn("allcgstReceivable is not loaded yet");
    return;
  }
console.log("cessid",this.selectedsgstReceivableId)

            // Find the selected option in the list
            const selectedItem = this.allcgstReceivable.find(item => item.ID === this.selectedsgstReceivableId);
            if (selectedItem) {
            this.selectedsgstReceivableName = selectedItem.Name;
            }
         
    }
    onsgstPayableSelected()
    {   
        this.sgstPayableOptions = this.taxTypeForm.get("sgstPayable");
        if (!this.sgstPayableOptions) return;

  const value = this.sgstPayableOptions.value;

  if (!value) {
    this.selectedsgstPayableId = 0;
    this.selectedsgstReceivableName = "";
    return;
  }

  this.selectedsgstPayableId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allsgstPayable)) {
    console.warn("allsgstPayable is not loaded yet");
    return;
  }
console.log("cessid",this.selectedsgstPayableId)
            // Find the selected option in the list
            const selectedItem = this.allsgstPayable.find(item => item.ID === this.selectedsgstPayableId);
            if (selectedItem) {
            this.selectedsgstReceivableName = selectedItem.Name;
            }
         
    }
    oncgstReceivableSelected()
    {   
        this.cgstReceivableOptions = this.taxTypeForm.get("cgstReceivable");
        if (!this.cgstReceivableOptions) return;

  const value = this.cgstReceivableOptions.value;

  if (!value) {
    this.selectedcgstReceivableId = 0;
    this.selectedcgstPayableName = "";
    return;
  }

  this.selectedcgstPayableId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allcgstReceivable)) {
    console.warn("allcgstReceivable is not loaded yet");
    return;
  }
console.log("cessid",this.selectedcgstReceivableId)

            // Find the selected option in the list
            const selectedItem = this.allcgstReceivable.find(item => item.ID === this.selectedcgstReceivableId);
            if (selectedItem) {
            this.selectedcgstReceivableName = selectedItem.Name;
            }
        
    }
    oncgstPayableSelected()
    {   
        this.cgstPayableOptions = this.taxTypeForm.get("cgstPayable");
       if (!this.cessReceivableOptions) return;

  const value = this.cgstPayableOptions.value;

  if (!value) {
    this.selectedcgstPayableId = 0;
    this.selectedcgstPayableName = "";
    return;
  }

  this.selectedcgstPayableId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allcgstPayable)) {
    console.warn("allcgstPayable is not loaded yet");
    return;
  }
console.log("cessid",this.selectedcgstPayableId)

            // Find the selected option in the list
            const selectedItem = this.allcgstPayable.find(item => item.ID === this.selectedcgstPayableId);
            if (selectedItem) {
            this.selectedcgstPayableName = selectedItem.Name;
            }
          
    }
    oncessPayablesSelected()
    {   
        this.cessPayablesOptions = this.taxTypeForm.get("cessPayables");
          if (!this.cessPayablesOptions) return;

  const value = this.cessPayablesOptions.value;

  if (!value) {
    this.selectedcessPayablesId = 0;
    this.selectedcessPayablesName = "";
    return;
  }

  this.selectedcessPayablesId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allcessPayables)) {
    console.warn("allsalePurMode is not loaded yet");
    return;
  }

        if(this.cessPayablesOptions == "" ){
            this.selectedcessPayablesId = 0;
        }
        else {
            // const selectedOptionId = Number(this.cessPayablesOptions.value); // Convert option to number
            // this.selectedcessPayablesId = selectedOptionId;
console.log("cessid",this.selectedcessReceivableId)
console.log("all",this.allcessReceivable)
            // Find the selected option in the list
            const selectedItem = this.allcessPayables.find(item => item.ID === this.selectedcessPayablesId);
            if (selectedItem) {
            this.selectedcessPayablesName = selectedItem.Name;
            }
        }
    }
    oncessReceivableSelected()
    {   
        this.cessReceivableOptions = this.taxTypeForm.get("cessReceivable");
       if (!this.cessReceivableOptions) return;

  const value = this.cessReceivableOptions.value;

  if (!value) {
    this.selectedcessReceivableId = 0;
    this.selectedcessReceivableName = "";
    return;
  }

  this.selectedcessReceivableId = Number(value);

  // ❌ this.allsalePurMode may be NULL
  if (!Array.isArray(this.allcessReceivable)) {
    console.warn("allsalePurMode is not loaded yet");
    return;
  }
console.log("cessid",this.selectedcessReceivableId)
console.log("all",this.allcessReceivable)
            // Find the selected option in the list
            const selectedItem = this.allcessReceivable.find(item => item.ID === this.selectedcessReceivableId);
            if (selectedItem) {
            this.selectedcessReceivableName = selectedItem.Name;
            }
         
    }
    protected override FormInitialize(): void {
    this.taxTypeForm = new FormGroup({      
      type: new FormControl ({value: '', disabled: this.isInputDisabled}, [Validators.required, ValidationService.stringValidator()]),
      name: new FormControl ({value: '', disabled: this.isInputDisabled}, Validators.required),
      description: new FormControl ({value: '', disabled: this.isInputDisabled}),
      purchasePerc: new FormControl ({value: 0, disabled: this.isInputDisabled},[Validators.required,Validators.pattern(/^\d+(\.\d{1,8})?$/)]),
      salesPerc: new FormControl ({value: 0, disabled: this.isInputDisabled},[Validators.required,Validators.pattern(/^\d+(\.\d{1,8})?$/)]),
      cess: new FormControl ({value: '', disabled: this.isInputDisabled}),
      default: new FormControl ({value: 0, disabled: this.isInputDisabled}), 
      active: new FormControl ({value: 0, disabled: this.isInputDisabled}),
      receivableAccount: new FormControl ({value: '', disabled: this.isInputDisabled}, Validators.required),
      payableAccount: new FormControl ({value: '', disabled: this.isInputDisabled}, Validators.required),
      salePurcMode: new FormControl ({value: '', disabled: this.isInputDisabled}, Validators.required),
      taxType: new FormControl ({value: '', disabled: this.isInputDisabled}, Validators.required),
      cgstReceivable: new FormControl ({value: '', disabled: this.isInputDisabled}),
      cgstPayable: new FormControl ({value: '', disabled: this.isInputDisabled}),
      sgstPayable: new FormControl ({value: '', disabled: this.isInputDisabled}),
      sgstReceivable: new FormControl ({value: '', disabled: this.isInputDisabled}),
      cessPayables: new FormControl ({value: '', disabled: this.isInputDisabled}),
      cessReceivable: new FormControl ({value: '', disabled: this.isInputDisabled}),
    });
   
    }

    fetchTaxTypeById(): void {    
        console.info("Selected id:",this.selectedTaxTypeMasterId)
        this.httpService
        .fetch<TaxTypeMaster[]>(EndpointConstant.FILLTAXTYPEBYID+this.selectedTaxTypeMasterId)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
            next: (response) => {
            const taxdata = response.data;
      if (!taxdata || taxdata.length === 0) {
        console.warn("No TaxType found for id:", this.selectedTaxTypeMasterId);
        return;
      }

      this.currentTaxType = taxdata[0];
            console.info("currentTax:",this.currentTaxType)
            this.taxTypeForm.patchValue({
                name: this.currentTaxType.name ?? '',
                type: this.currentTaxType.type ?? "",
                description: this.currentTaxType.description ?? '',
                purchasePerc: this.currentTaxType.purchasePerc ?? 0,
                default: this.currentTaxType.isDefault ?? 0,
                active: this.currentTaxType.active ?? 0,
                salesPerc: this.currentTaxType.salesPerc ?? 0,
                receivableAccount: this.currentTaxType.receivableAccountID ?? "",
                payableAccount: this.currentTaxType.payableAccountID ?? "",
                salePurcMode: this.currentTaxType.salePurchaseModeID ?? 0,
                taxType: this.currentTaxType.taxMiscID ?? "",
                sgstReceivable: this.currentTaxType.sgstReceivableAccountID ?? "",
                sgstPayable: this.currentTaxType.sgstPayableAccountID ?? "",
                cgstReceivable: this.currentTaxType.cgstReceivableAccountID ?? "",
                cgstPayable: this.currentTaxType.cgstPayableAccountID ?? "",
                cess: this.currentTaxType.cessPerc ?? 0,
                cessReceivable: this.currentTaxType.cessReceivable ?? "",
                cessPayables: this.currentTaxType.cessPayable ?? "",
            });             
             // 🔥 NOW call selection handlers AFTER form values are set
          this.onTypeSelected();
          this.onreceivableAccountSelected();
          this.onpayableAccountSelected();
          this.onsalePurcModeSelected();
          this.ontaxTypeSelected();
          this.onsgstReceivableSelected();
          this.onsgstPayableSelected();
          this.oncgstReceivableSelected();
          this.oncgstPayableSelected();
          this.oncessPayablesSelected();
          this.oncessReceivableSelected();
        }
    });
  }
    protected override getDataById(data: TaxTypeFillMaster): void {
        this.selectedTaxTypeMasterId=data.ID; 
        this.fetchTaxTypeById();         
        console.log("salespurchase:",this.selectedsalePurModeName)

    }
    protected override newbuttonClicked(): void {
//          if(!this.isCreate){
//     this.baseService.showCustomDialogue('Permission Denied!');
//     return false;
//   }
  this.isInputDisabled = !this.isInputDisabled;
  this.isEditBtnDisabled = !this.isInputDisabled;
  this.isDeleteBtnDisabled = !this.isInputDisabled;
  this.isSaveBtnDisabled = this.isInputDisabled;
  this.taxTypeForm.reset();
  if(this.isInputDisabled == true){
    this.disbaleFormControls();
    this.selectedTaxTypeMasterId = this.firstTaxTypeMaster;
    this.fetchTaxTypeById();
  } else{
    this.selectedTaxTypeMasterId = 0;
    this.enableFormControls(); 
    this.taxTypeForm.patchValue({
      active:1,
      default:0
    });     
  }
    }
    enableFormControls(){
  this.taxTypeForm.get('name')?.enable();
  this.taxTypeForm.get('type')?.enable();
  this.taxTypeForm.get('description')?.enable();
  this.taxTypeForm.get('purchasePerc')?.enable();
  this.taxTypeForm.get('salesPerc')?.enable();
  this.taxTypeForm.get('default')?.enable();
  this.taxTypeForm.get('active')?.enable();
  this.taxTypeForm.get('salePurcMode')?.enable();
  this.taxTypeForm.get('taxType')?.enable();
  this.taxTypeForm.get('receivableAccount')?.enable();
  this.taxTypeForm.get('payableAccount')?.enable();
  this.taxTypeForm.get('cgstPayable')?.enable();
  this.taxTypeForm.get('sgstPayable')?.enable();
  this.taxTypeForm.get('cgstReceivable')?.enable();
  this.taxTypeForm.get('sgstReceivable')?.enable();
  this.taxTypeForm.get('cessPayables')?.enable();
  this.taxTypeForm.get('cessReceivable')?.enable();
  this.taxTypeForm.get('cess')?.enable();
}

disbaleFormControls(){
  this.taxTypeForm.get('name')?.disable();
  this.taxTypeForm.get('type')?.disable();
  this.taxTypeForm.get('description')?.disable();
  this.taxTypeForm.get('purchasePerc')?.disable();
  this.taxTypeForm.get('salesPerc')?.disable();
  this.taxTypeForm.get('default')?.disable();
  this.taxTypeForm.get('active')?.disable();
  this.taxTypeForm.get('salePurcMode')?.disable();
  this.taxTypeForm.get('taxType')?.disable();
  this.taxTypeForm.get('receivableAccount')?.disable();
  this.taxTypeForm.get('payableAccount')?.disable();
  this.taxTypeForm.get('cgstPayable')?.disable();
  this.taxTypeForm.get('sgstPayable')?.disable();
  this.taxTypeForm.get('cgstReceivable')?.disable();
  this.taxTypeForm.get('sgstReceivable')?.disable();
  this.taxTypeForm.get('cessPayables')?.disable();
  this.taxTypeForm.get('cessReceivable')?.disable();
  this.taxTypeForm.get('cess')?.disable();
}
fetchLoadData(): void {
  this.httpService
  .fetch(EndpointConstant.TAXTYPELOADDATA)
  .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
  .subscribe({
    next: (response) => {          
      this.commonFillData = response?.data;
      //set salePurchaseMode data..
      this.allsalePurMode = this.commonFillData?.salePurchaseMode;
          if (this.allsalePurMode?.length > 0) {
            this.taxTypeForm.patchValue({
              salePurcMode: this.allsalePurMode[0].ID
            });
          }
          console.log("allsalepurchsemode:",this.allsalePurMode)
          this.allType=this.commonFillData?.type;
           if (this.allType?.length > 0) {
            this.taxTypeForm.patchValue({
              type: this.allType[0].ID
            });
          }
      //set taxTypes data..
      this.allTaxType = this.commonFillData?.taxTypes;
          if (this.allTaxType?.length > 0) {
            this.taxTypeForm.patchValue({
              taxType: this.allTaxType[0].ID
            });
          }
          //set receivableAccount data..
      this.allreceivableAccount = this.commonFillData?.receivableAccount;
      if (this.allreceivableAccount?.length > 0) {
        this.taxTypeForm.patchValue({
          receivableAccount: this.allreceivableAccount[0].ID
        });
      } 
       //set payableAccount data..
      this.allpayableAccount = this.commonFillData?.payableAccount;
      if (this.allpayableAccount?.length > 0) {
        this.taxTypeForm.patchValue({
          payableAccount: this.allpayableAccount[0].ID
        });
      }
       //set cgstPayable data..
      this.allcgstPayable = this.commonFillData?.cgstPayable;
      if (this.allcgstPayable?.length > 0) {
        this.taxTypeForm.patchValue({
          cgstPayable: this.allcgstPayable[0].ID
        });
      }
       //set sgstPayable data..
      this.allsgstPayable = this.commonFillData?.sgstPayable;
      if (this.allsgstPayable?.length > 0) {
        this.taxTypeForm.patchValue({
          sgstPayable: this.allsgstPayable[0].ID
        });
      }
       //set cgstReceivable data..
      this.allcgstReceivable = this.commonFillData?.cgstReceivable;
      if (this.allcgstReceivable?.length > 0) {
        this.taxTypeForm.patchValue({
          cgstReceivable: this.allcgstReceivable[0].ID
        });
      }
       //set sgstReceivable data..
      this.allsgstReceivable = this.commonFillData?.sgstReceivable;
      if (this.allsgstReceivable?.length > 0) {
        this.taxTypeForm.patchValue({
          sgstReceivable: this.allsgstReceivable[0].ID
        });
      }
       //set cessPayables data..
      this.allcessPayables = this.commonFillData?.cessPayables;
      if (this.allcessPayables?.length > 0) {
        this.taxTypeForm.patchValue({
          cessPayables: this.allcessPayables[0].ID
        });
      }
       //set cessReceivable data..
      this.allcessReceivable = this.commonFillData?.cessReceivable;
      if (this.allcessReceivable?.length > 0) {
        this.taxTypeForm.patchValue({
          cessReceivable: this.allcessReceivable[0].ID
        });
      }
      //this.fetchTaxTypeById();
    },
    error: (error) => {
      this.isLoading = false;
      console.error('An Error Occured', error);
    },
  });
}
protected override DeleteData(data: any): void {
//       if(!this.isDelete){
//     this.baseService.showCustomDialogue('Permission Denied!');
//     return false;
//   }
  if(confirm("Are you sure you want to delete this details?")) {
    this.isLoading = true;
    this.httpService.delete(EndpointConstant.DELETETAXTYPE+this.selectedTaxTypeMasterId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: async (response) => {
        this.isLoading = false;
        //this.baseService.showCustomDialogue(response.data.msg);          
        this.selectedTaxTypeMasterId = this.firstTaxTypeMaster;
         await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
      },
      error: (error) => {
        this.isLoading = false;
       // this.baseService.showCustomDialogue('Please try again');
      },
    });
  }
}
protected override onEditClick(): void {
//     if(!this.isEdit){
//     this.baseService.showCustomDialogue('Permission Denied!');
//     return false;
//   }
  this.isInputDisabled = !this.isInputDisabled;
  this.isDeleteBtnDisabled = !this.isInputDisabled;
  this.isNewBtnDisabled = !this.isInputDisabled;
  this.isSaveBtnDisabled = this.isInputDisabled;
  this.isUpdate = !this.isInputDisabled;
  if(!this.isInputDisabled){
    this.enableFormControls();
  } else{
    this.disbaleFormControls();
  }
  this.fetchTaxTypeById();
  this.onTypeSelected();
  this.oncessPayablesSelected();
  this.oncessReceivableSelected();
  this.oncgstPayableSelected();
  this.oncgstReceivableSelected();
  this.onpayableAccountSelected();
  this.onreceivableAccountSelected();
  this.onsalePurcModeSelected();
  this.onsgstPayableSelected();
  this.onsgstReceivableSelected();
  this.ontaxTypeSelected();
}
protected override SaveFormData(): void {
    
    const taxType=this.taxTypeForm.value;
    if(!taxType.name||taxType.name.trim()==='' || !taxType.type || taxType.type.trim()==='Select Type')
    {
        alert("name and type is required");
        return;
    }
    const payload = {
    "id":Number(this.selectedTaxTypeMasterId),
    "name": taxType.name,
    "type": {
          "id": taxType.type,
          "value": taxType.type
        },
    "description": taxType.description,
    "purchasePerc": Number(taxType.purchasePerc),
    "default":  taxType.default ? taxType.default : false,
    "active":  taxType.active ? taxType.active : false,
    "salesPerc": Number(taxType.salesPerc),
    "cess_Perc": Number(taxType.cess),
    "sales_Pur_Mode": {
          "id": taxType.salePurcMode,
          "value": this.selectedsalePurModeName
        },
"taxType": {
          "id": taxType.taxtype,
          "value": this.selectedTaxTypeName
        },
      "receivableAccount": {
          "id": taxType.receivableAccount,
          "value": this.selectedreceivableAccountName,
        }  ,
        "payableAccount": {
          "id": this.selectedpayableAccountId,
          "value": this.selectedpayableAccountName,
        }  , 
         "sgstReceivable": {
          "id": this.selectedsgstReceivableId,
          "value": this.selectedsgstReceivableName,
        }  , 
        "cgstReceivable": {
          "id": this.selectedcgstReceivableId,
          "value": this.selectedcgstReceivableName,
        }  , 
        "sgstPayable": {
          "id": this.selectedsgstPayableId,
          "value": this.selectedsgstPayableName,
        }  ,
        "cgstPayable": {
          "id": this.selectedcgstPayableId,
          "value": this.selectedcgstPayableName,
        }  ,
        "cessReceivable": {
          "id": this.selectedcessReceivableId,
          "value": this.selectedcessReceivableName,
        }  ,
        "cessPayable": {
          "id": this.selectedcessPayablesId,
          "value": this.selectedcessPayablesName,
        }  ,
  };
  console.info("Save:",payload)
  // if(this.isUpdate){
  //   this.updateCallback(payload);
  // } else{
    this.createCallback(payload);

}
createCallback(payload:any){
  console.log("payload:", payload);
  this.httpService.post(EndpointConstant.SAVETAXTYPE,payload)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: async (response) => {
        this.isLoading = false;
       // this.baseService.showCustomDialogue(response.data.msg); 
        this.selectedTaxTypeMasterId = this.firstTaxTypeMaster;
        //this.fetchTaxTypeById();
         await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
          alert("Save Successfully")
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving TaxType master', error);
        //this.baseService.showCustomDialogue('Error saving TaxType master');
      },
    });
}
}