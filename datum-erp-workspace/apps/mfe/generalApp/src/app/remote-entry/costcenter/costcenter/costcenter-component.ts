import { DatePipe } from "@angular/common";
import { ChangeDetectorRef, Component, inject, NgZone, OnInit, signal } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { GeneralAppService } from "../../http/general-app.service";
import { ClientDropdown, ConsultancyDropdown, CostCategories, CostCenter, CostCentreStatus, CreateUnder, Nature, StaffDropdown } from "../model/pCostCenter.model";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseService } from "@org/services";
@Component({
  selector: 'app-costcategory-Main',
  standalone: false,
  templateUrl: './costcenter-component.html',
  styles: [],
})
export class CostCenterComponent extends BaseComponent implements OnInit  {
       
selectedCategoryId!: string;  
selectedCategory = signal<CostCategories | null>(null);
foremanData = [] as Array<StaffDropdown>;
engineerData = [] as Array<StaffDropdown>;
selectedStatus = signal<CostCentreStatus | null>(null);
allStatus=signal<CostCentreStatus[]>([]);   
selectedStatusId!:String;
clientData = [] as Array<ClientDropdown>;
firstCostCenter!:number;
active: boolean = false;
isGroup: boolean = false;
clientValue = "";
consultancyValue = "";
engineerValue = "";
foremanValue = "";
isLoading = false;
isUpdate: boolean = false;  
selectedCostCenterId!: number;
currentCostCenter = {} as CostCenter;
clientreturnField:string = 'name';
clientKeys = ['ID','Name','Code'];
engineerreturnField:string = 'name';
engineerKeys = ['ID','Name','Code'];
foremanreturnField:string = 'name';
foremanKeys = ['ID','Name','Code'];
consultancyreturnField:string = 'name';
consultancyKeys = ['ID','Name','Code'];
pageId = 0;
natureList:Nature[] = [
    {
    "value":1, 
    "name":"Real"
    },
    {
    "value":2,
    "name":"UnReal"
    }];
selectedNatureId!: string;
selectedNature = {} as Nature;
selectedCreateUnderId!: string;  
costCategories =signal <CostCategories[]>([]);
selectedCreateUnder = signal<CreateUnder | null>(null);
createUnderData=signal<CreateUnder[]>([]);
clientOptions= signal<ClientDropdown[]>([]);
consultancyOptions= signal<ConsultancyDropdown[]>([]);
staffOptions= signal<StaffDropdown[]>([]);
public columns = [
  { field: 'id', header: 'ID', width: 80 },
  { field: 'code', header: 'Code', width: 120 },
  { field: 'name', header: 'Name', width: 150 }
];
public gridSettings = { rowHeight: 40, enableAltRow: true, gridLines: 'Both' };
 
private httpService = inject(GeneralAppService);
private baseService = inject(BaseService);
private datePipe= inject(DatePipe);
costCenterForm = this.formUtil.thisForm;

constructor() {
    super();
    this.commonInit();
  }
 
ngOnInit(): void {
  this.onInitBase();
  this.SetPageType(1);
  this.loadDropdown();
  this.costCenterForm.disable();
}

private loadDropdown(): void{
  this.fetchCategories();
  this.fetchStatus();
  this.fetchCreateUnder();
  this.fetchClient();
  this.fetchConsultancy();
  this.fetchStaffs();

}

  override FormInitialize() {
    this.costCenterForm = new FormGroup({
      code: new FormControl({ value: '', disabled: false }, Validators.required),
      name: new FormControl({ value: '', disabled: false }, Validators.required),
      category: new FormControl({ value: '', disabled: false }),
      isgroup: new FormControl({ value: true, disabled: false }),
      createunder: new FormControl({ value: '', disabled: false }),
      active: new FormControl({ value: true, disabled: false }),
      remarks: new FormControl({ value: '', disabled: false }),
      nature: new FormControl({ value: '', disabled: false }, Validators.required),
      status: new FormControl({ value: '', disabled: false}),
      regno: new FormControl({ value: '', disabled: false}),
      serialno: new FormControl({ value: '', disabled: false}),
      client: new FormControl({ value: '', disabled: false}),
      consultancy: new FormControl({ value: '', disabled: false}),
      engineer: new FormControl({ value: '', disabled: false}),
      foreman: new FormControl({ value: '', disabled: false}),
      startdate: new FormControl({ value: '', disabled: false}),
      enddate: new FormControl({ value: '', disabled: false}),
      contractvalue: new FormControl({ value: '', disabled: false}),
      invoicevalue: new FormControl({ value: '', disabled: false}),
      make: new FormControl({ value: '', disabled: false}),
      makeyear: new FormControl({ value: '', disabled: false}),
      site: new FormControl({ value: '', disabled: false}),
      rate: new FormControl({ value: '', disabled: false}),
    });
  }

  override newbuttonClicked(): void {
    this.costCenterForm.enable();
    this.costCenterForm.reset();
  }

 fetchClient(): void {
  this.httpService
    .fetch<any[]>(EndpointConstant.FILLCLIENTPOPUP)
    .subscribe({
      next: (response) => {
        // ✅ Use .set() for signals
        this.clientOptions.set(response?.data ?? []);
      },
      error: (error) => {
        console.error('An Error Occurred', error);
        this.clientOptions.set([]);
      }
    });
}

fetchConsultancy(): void {
  this.httpService
    .fetch<any[]>(EndpointConstant.FILLCONSULTANCYPOPUP)
    .subscribe({
      next: (response) => {
        this.consultancyOptions.set(response?.data ?? []);
      },
      error: (error) => {
        console.error('An Error Occurred', error);
        this.consultancyOptions.set([]);
      }
    });
}

fetchStaffs(): void {
  this.httpService
    .fetch<any[]>(EndpointConstant.FILLSTAFFOPUP)
    .subscribe({
      next: (response) => {
        this.staffOptions.set(response?.data ?? []);
      },
      error: (error) => {
        console.error('An Error Occurred', error);
        this.staffOptions.set([]);
      }
    });
}

fetchStatus(): void {
  this.httpService
    .fetch(EndpointConstant.FILLCOSTCENTERSTATUS)
    .subscribe({
      next: (response: any) => {
        const data = Array.isArray(response?.data)
          ? (Array.isArray(response.data[0]) ? response.data[0] : response.data)
          : [];

        // ✅ Use .set() for signals
        this.allStatus.set(data);
      },
      error: (error) => {
        console.error('An Error Occurred', error);
        // ✅ Set empty array on error
        this.allStatus.set([]);
      }
    });
}

fetchCategories(): void {
  this.httpService
    .fetch(EndpointConstant.FILLCOSTCATEGORY)
    .subscribe({
      next: (response: any) => {
        const raw = response?.data ?? [];

        // normalize nested array structure
        const parsed = Array.isArray(raw)
          ? (Array.isArray(raw[0]) ? raw[0] : raw)
          : [];

        // update signal
        this.costCategories.set(parsed);
      },
      error: (error) => {
        console.error('Error fetching categories', error);
      }
    });
}

fetchCreateUnder(): void {
  this.httpService
    .fetch(EndpointConstant.COSTCENTERDROPDOWN)
    .subscribe({
      next: (response: any) => {
        const data = Array.isArray(response?.data)
          ? (Array.isArray(response.data[0]) ? response.data[0] : response.data)
          : [];

        // ✅ Use .set() for signals
        this.createUnderData.set(data);
      },
      error: (error) => {
        console.error('An Error Occurred', error);
        // ✅ Set empty array on error too
        this.createUnderData.set([]);
      }
    });
}


onConsultancySelected(event: any): void {
  const selectedItem = event.itemData || event.selectedItem;
  const selectedId = event.value || selectedItem?.id;
  const selectedText = event.selectedText || selectedItem?.name;

   if (!selectedId || !selectedText) {
    console.warn('No valid selection:', event);
    return;
  }
  const found = this.consultancyOptions().find(item => item.id === selectedId);

   if (found) {
    this.consultancyValue = found.name;
    // ✅ Patch form with ID
    this.costCenterForm.patchValue({ consultancy: found.id });
  } else {
    console.warn('consultancy not found in options:', selectedId);
  }
}
 
onEngineerSelected(event: any): void {
  const selectedItem = event.itemData || event.selectedItem;
  const selectedId = event.value || selectedItem?.id;
  const selectedText = event.selectedText || selectedItem?.name;

   if (!selectedId || !selectedText) {
    console.warn('No valid selection:', event);
    return;
  }
  const found = this.staffOptions().find(item => item.id === selectedId);

   if (found) {
    this.engineerValue = found.name;
    // ✅ Patch form with ID
    this.costCenterForm.patchValue({ engineer: found.id });
  } else {
    console.warn('engineer not found in options:', selectedId);
  }
}
 
onForemanSelected(event: any): void {
  const selectedItem = event.itemData || event.selectedItem;
  const selectedId = event.value || selectedItem?.id;
  const selectedText = event.selectedText || selectedItem?.name;

   if (!selectedId || !selectedText) {
    console.warn('No valid selection:', event);
    return;
  }
  const found = this.staffOptions().find(item => item.id === selectedId);

   if (found) {
    this.engineerValue = found.name;
    // ✅ Patch form with ID
    this.costCenterForm.patchValue({ foreman: found.id });
  } else {
    console.warn('foreman not found in options:', selectedId);
  }
}

// ✅ FIXED Method - Handles Syncfusion $event
onCostCategorySelect(event?: any): void {
  const categoryId = event?.itemData?.id || this.costCenterForm.get('category')?.value;
  if (!categoryId) {
    this.selectedCategory.set(null);
    return;
  }
  const list = this.costCategories();
  const found = list.find(c => c.id == categoryId);
  this.selectedCategory.set(found ?? null);
}
 
onCostCategoryStatusSelect(event?: any): void {
  const statusVal = event?.itemData?.id || this.costCenterForm.get('status')?.value;
  if (!statusVal) {
    this.selectedStatus.set(null);
    return;
  }
  const list = this.allStatus();
  const found = list.find(x => x.id == statusVal);
  this.selectedStatus.set(found ?? null);
  
  if (!found) {
    console.warn('status not found for id:', statusVal, 'available:', this.allStatus().map(x => x.id));
  }
}
 
  onActiveChange(event: any) {
    this.active = event.target.checked ? true : false;
  }
 
  onGroupChange(event: any) {
    this.isGroup = event.target.checked ? true : false;
  }
 onNatureSelect(): void {
    this.selectedNatureId = this.costCenterForm?.get('nature')?.value;
    this.selectedNature = this.natureList?.find(obj => obj?.name == this.selectedNatureId) as Nature;

  }

onCreateUnderSelect(event?: any): void {
  const createUnderId = event?.itemData?.id || this.costCenterForm.get('createunder')?.value;
  
  if (!createUnderId) {
    this.selectedCreateUnder.set(null);
    return;
  }
  const list = this.createUnderData();
  const found = list.find(x => x.id == createUnderId);
  this.selectedCreateUnder.set(found ?? null);
  
  if (!found) {
    console.warn('CreateUnder not found for id:', createUnderId, 'available:', this.createUnderData().map(x => x.id));
  }
}
 
onClientSelected(event: any): void {
  // ✅ Syncfusion change event has .itemData with full object
  const selectedItem = event.itemData || event.selectedItem;
  const selectedId = event.value || selectedItem?.id;
  const selectedText = event.selectedText || selectedItem?.name;
  
  if (!selectedId || !selectedText) {
    console.warn('No valid selection:', event);
    return;
  }
  
  // ✅ Find from SIGNAL data (call as function)
  const found = this.clientOptions().find(item => item.id === selectedId);
  
  if (found) {
    this.clientValue = found.name;
    // ✅ Patch form with ID
    this.costCenterForm.patchValue({ client: found.id });
  } else {
    console.warn('Client not found in options:', selectedId);
  }
}

    convertToLocalDateString(selectedDate: Date | null): string | null {
    if (!selectedDate) {
      return null;
    }
  
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const seconds = selectedDate.getSeconds().toString().padStart(2, '0');
  
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  }

  override SaveFormData() {
    console.log(this.costCenterForm.controls);
    this.saveCostCenter();
  }
  private logFormValidationErrors() {
  const errors: Record<string, any> = {};
  Object.keys(this.costCenterForm.controls).forEach(key => {
    const control = this.costCenterForm.get(key);
    if (control && control.invalid) {
      errors[key] = {
        value: control.value,
        errors: control.errors
      };
    }
  });
  console.warn('Form validation errors:', errors);
  return errors;
}

  private saveCostCenter() {
  if (this.costCenterForm.invalid) {
    this.logFormValidationErrors();
    return;
  }

  this.isLoading = true;
  const category = this.selectedCategory();
  const sts = this.selectedStatus();
  
  // Build EXACT backend payload structure
  const payload = {
    "code": this.costCenterForm.value.code || "",
    "name": this.costCenterForm.value.name || "",
     "nature": {
        "key": this.selectedNature?.name || "Real",
        "value": this.selectedNature?.name || "Real"
      },
    "active": this.costCenterForm.value.active !== false, // ensure boolean
    "serialNo": this.costCenterForm.value.serialno || "",
    "regNo": this.costCenterForm.value.regno || "",
    "consultancy": this.costCenterForm.value.consultancy || 0,
     "status": {
      "id": this.selectedStatus()?.id || 0,
      "value": this.selectedStatus()?.value || ""
    },
    "remarks": this.costCenterForm.value.remarks || "",
    "rate": parseFloat(this.costCenterForm.value.rate) || 0,
    "startDate": this.costCenterForm.value.startdate 
      ? new Date(this.costCenterForm.value.startdate).toISOString() 
      : null,
    "make": this.costCenterForm.value.make || "",
    "makeYear": this.costCenterForm.value.makeyear || "",
    "endDate": this.costCenterForm.value.enddate 
      ? new Date(this.costCenterForm.value.enddate).toISOString() 
      : null,
    "contractValue": parseFloat(this.costCenterForm.value.contractvalue) || 0,
    "invoiceValue": parseFloat(this.costCenterForm.value.invoicevalue) || 0,
    "client": this.costCenterForm.value.client || 0,
    "engineer": this.costCenterForm.value.engineer || 0,
    "foreman": this.costCenterForm.value.foreman || 0,
    "site": this.costCenterForm.value.site || "",
    "isGroup": this.costCenterForm.value.isgroup,
    "category": {
      "id": category?.id ?? 0,
      "name": category?.name ?? ""
    },
   "createUnder": { 
  "id": this.selectedCreateUnder()?.id || 0, 
  "name": this.selectedCreateUnder()?.name || "" 
}
  };

  if (this.isUpdate) {
    this.updateCallback(payload, this.selectedCostCenterId);
  } else {
    this.createCallback(payload);
  }
}
  createCallback(payload: any) {
  this.httpService.post(EndpointConstant.SAVECOSTCENTER, payload)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: async (response) => {
        this.isLoading = false;
        console.log('✅ Save successful:', response);
        
        if (response.httpCode === 201) {
          this.baseService.showCustomDialogue('Cost center saved successfully!');
          // Refresh the left grid and update the data sharing service
                await this.LeftGridInit();
                this.serviceBase.dataSharingService.setData({
                  columns: this.leftGrid.leftGridColumns,
                  data: this.leftGrid.leftGridData,
                  pageheading: this.pageheading,
                });
                this.costCenterForm.disable();
        } else {
          this.baseService.showCustomDialogue(response.data as any);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('💥 Save error:', error);
        this.baseService.showCustomDialogue(
          error.error?.message || error.message || 'Save failed'
        );
      }
    });
}

updateCallback(payload: any, costCenterId: number) {
  this.httpService.patch(EndpointConstant.UPDATECOSTCENTER + costCenterId, payload)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: async (response) => {
        this.isLoading = false;
        if (response.httpCode === 200) {
          this.baseService.showCustomDialogue('Cost center updated successfully!');
          // Refresh the left grid and update the data sharing service
                await this.LeftGridInit();
                this.serviceBase.dataSharingService.setData({
                  columns: this.leftGrid.leftGridColumns,
                  data: this.leftGrid.leftGridData,
                  pageheading: this.pageheading,
                });
          this.costCenterForm.disable();  // Back to view mode
          // ✅ Only refresh if we have valid ID
          if (costCenterId) {
            this.fetchCostCenterById();
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('💥 Update error:', error);
        this.baseService.showCustomDialogue('Update failed');
      }
    });
}

   override onEditClick(){
    this.isUpdate = true;
    this.costCenterForm.enable();
  }

  override async LeftGridInit() {
    this.pageheading = 'Cost Center';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLCOSTCENTERS)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );
 
      // handle data here after await completes
      this.leftGrid.leftGridData = res?.data || [];
      console.log('Fetched data:', this.leftGrid.leftGridData);
 
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Cost Center List',
          columns: [
            {
              field: 'code',
              datacol: 'code',
              headerText: 'Code',
              textAlign: 'Left',
            },
            {
              field: 'description',
              datacol: 'description',
              headerText: 'Description',
              textAlign: 'Left',
            },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching cost centers:', err);
      this.leftGrid.leftGridData = [];
      // Set empty columns as fallback
      this.leftGrid.leftGridColumns = [];
    }
  }

  override getDataById(data: CostCenter) {
    this.selectedCostCenterId = data.id; // make sure ID is set before fetching
    this.fetchCostCenterById();
  }
 
  private  fetchCostCenterById():void{
    this.httpService
    .fetch(EndpointConstant.FILLALLCOSTCENTERBYID  +this.selectedCostCenterId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        console.log('Fetching URL:', `${EndpointConstant.FILLALLCOSTCENTERBYID}${this.selectedCostCenterId}`);

        this.currentCostCenter = (response?.data as any[])[0];
        let formsDate = null;
        let formeDate = null;
        if(this.currentCostCenter.sDate != null){
          formsDate = this.datePipe.transform(new Date(this.currentCostCenter.sDate), 'yyyy-MM-dd');
        }
        if(this.currentCostCenter.eDate != null){
          formeDate = this.datePipe.transform(new Date(this.currentCostCenter.eDate), 'yyyy-MM-dd');
        }
        this.costCenterForm.patchValue({
          code: this.currentCostCenter.code,
          name: this.currentCostCenter.description,          
          category: this.currentCostCenter.costCategoryID,
          isgroup: this.currentCostCenter.isGroup,          
          createunder: this.currentCostCenter.parentID,
          active: this.currentCostCenter.active,
          remarks: this.currentCostCenter.remarks,
          nature: this.currentCostCenter.pType,
          status: this.currentCostCenter.status,
          regno: this.currentCostCenter.regNo,
          serialno: this.currentCostCenter.serialNo,
          client: this.currentCostCenter.clientID,
          consultancy: this.currentCostCenter.supplierID,
          engineer: this.currentCostCenter.staffID,
          foreman: this.currentCostCenter.staffID1,
          startdate : formsDate,
          enddate : formeDate,
          contractvalue: this.currentCostCenter.contractValue,
          invoicevalue: this.currentCostCenter.invoicedAmt,
          make: this.currentCostCenter.make,
          makeyear: this.currentCostCenter.mYear,
          site: this.currentCostCenter.site,
          rate: this.currentCostCenter.rate 
        });
        
        this.onCostCategorySelect();
        this.onCreateUnderSelect();
        this.onNatureSelect();
        this.onCostCategoryStatusSelect();  
        // changing searcbable dropdown values...
        this.clientValue =   this.currentCostCenter.clientName;
        this.consultancyValue =   this.currentCostCenter.supplierName;
        this.engineerValue =   this.currentCostCenter.staffIDName;
        this.foremanValue =   this.currentCostCenter.staffIDName;

      },
      error: (error) => {
        console.error('An Error Occured', error);
      },
    });
  }
 
  override DeleteData(data: CostCenter) {
    console.log('deleted');
  }
   
}
   