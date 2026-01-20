import { Component, inject, OnInit, signal } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { InventoryAppService } from "../../http/inventory-app.service";
import { CATEGORIES, CATEGORY, CategoryType } from "../model/pcategory.model";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { DatePipe } from "@angular/common";

@Component({
  selector: 'app-category-Main',
  standalone: false,
  templateUrl: './category.component.html',
  styles: [],
})
export class CategoryComponent extends BaseComponent implements OnInit{
 private httpService = inject(InventoryAppService);
  categoryForm = this.formUtil.thisForm;

  allCategories = signal<Array<CATEGORIES>>([]);   
  selectedCategoryId = 0;
  firstCategory = 0;
  isActive: number = 0;
  currentCategory = signal<CATEGORY | null>(null);   
     isUpdate = signal(false);
          // STATE PROPERTIES
        isLoading = signal(false);
        isInputDisabled = true;
        //isActive: unknown;
        currentid = signal(0);
          // TOOLBAR STATE PROPERTIES
        isNewMode = signal(false);
        isEditMode = signal(false);
        isNewBtnDisabled = signal(false);
        isEditBtnDisabled = signal(false);
        isDeleteBtnDisabled = signal(false);
        isSaveBtnDisabled = signal(false);
      isPrintBtnDisabled = signal(false);

      
  private datePipe= inject(DatePipe);
  //userform = this.formUtil.thisForm;
  categoryTypeOptions = signal<Array<CategoryType>>([]);
  selectedCategoryTypeOption = '';
  categoryTypereturnField = 'ID';
  categoryTypeKeys = ['Code','Description','ID'];
  selectedCategoryTypeObj:any = {};
  public columns = [
  { field: 'id', header: 'ID', width: 80 },
  { field: 'Code', header: 'Code', width: 120 },
  { field: 'Description', header: 'Description', width: 150 }
];

  
    
    constructor() {
      super();
      this.commonInit();
    }
  
    ngOnInit(): void {
      this.onInitBase();
      this.SetPageType(1);
      console.log(this.currentPageInfo?.menuText);
      this.fetchallCategoryType();
    }
    protected override FormInitialize(): void {
      this.categoryForm = new FormGroup({  
      categorycode: new FormControl({value: '', disabled: this.isInputDisabled}, Validators.required),
      categoryname: new FormControl({value: '', disabled: this.isInputDisabled}, Validators.required),
      categorytype: new FormControl({value: '', disabled: this.isInputDisabled},),
      startdate: new FormControl({value: '', disabled: this.isInputDisabled}),      
      enddate: new FormControl({value: '', disabled: this.isInputDisabled}),      
      active: new FormControl({value: true, disabled: this.isInputDisabled}),      
      disableminusstock: new FormControl({value: '', disabled: this.isInputDisabled}),      
      discountperc: new FormControl({value: '', disabled: this.isInputDisabled})
    });
    }
    override async LeftGridInit() {
        this.pageheading = 'Category Master';
        try {
    
          // Developer permision allowed
          const res = await firstValueFrom(
            this.httpService
              .fetch<any[]>(EndpointConstant.FILLALLMASTERCATEGORIES)
              .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          );
    // not alolowed 
          // handle data here after await completes
          this.leftGrid.leftGridData = res.data;
          console.log('Fetched data:', this.leftGrid.leftGridData);
    
          this.leftGrid.leftGridColumns = [
            {
              headerText: 'Category List',
              columns: [
                {
                  field: 'Description',
                  datacol: 'Description',
                  headerText: 'Description',
                  textAlign: 'Left',
                },
                {
                  field: 'code',
                  datacol: 'code',
                  headerText: 'Code',
                  textAlign: 'Left',
                },
              ],
            },
          ];
            const count = this.leftGrid.leftGridData.length;
    
    if (count > 0) {
      this.currentCategory.set(this.leftGrid.leftGridData[count - 1]);
      console.info("selectedId:", this.currentCategory());
      this.getDataById(this.currentCategory());
        } else {
        console.warn("No Category data available.");
        }
        } catch (err) {
          console.error('Error fetching companies:', err);
        }
    }
      
 onCategoryTypeSelected(e: any) {
  console.log("Category Type Selected Event:", e);
  this.selectedCategoryTypeOption = e ?? '';
  this.categoryTypeOptions().forEach((item) => {
      if (item.code === e) {
        this.selectedCategoryTypeObj = item;
      }
    });
//  this.selectedCategoryTypeObj = e?.itemData ?? null;

  this.categoryForm.patchValue({
    categorytype: this.selectedCategoryTypeOption,
  });

  console.log("Selected Category Type Option:", this.selectedCategoryTypeOption);
  console.log("Selected Category Type Object:", this.selectedCategoryTypeObj);
}


  enableFormControls(){
    this.categoryForm.get('categorycode')?.enable();
    this.categoryForm.get('categoryname')?.enable();
    this.categoryForm.get('categorytype')?.enable();
    this.categoryForm.get('startdate')?.enable();
    this.categoryForm.get('enddate')?.enable();
    this.categoryForm.get('active')?.enable();
    this.categoryForm.get('disableminusstock')?.enable();
    this.categoryForm.get('discountperc')?.enable();
  }

  disbaleFormControls(){
    this.categoryForm.get('categorycode')?.disable();
    this.categoryForm.get('categoryname')?.disable();
    this.categoryForm.get('categorytype')?.disable();
    this.categoryForm.get('startdate')?.disable();
    this.categoryForm.get('enddate')?.disable();
    this.categoryForm.get('active')?.disable();
    this.categoryForm.get('disableminusstock')?.disable();
    this.categoryForm.get('discountperc')?.disable();
  }
  fetchallCategoryType(): void {
    this.httpService
    .fetch(EndpointConstant.FILLALLCATEGORYTYPES)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response: any) => {
        const responseCategoryType = Array.isArray(response?.data) ? response.data as any[] : [];
        responseCategoryType.forEach((element: any) => {
          this.categoryTypeOptions.update(prev => [...prev, {
            "code": element.code,
            "description": element.description,
            "id": element.id
          }]);
        });
      },
      error: (error) => {
        //this.isLoading = false;
        console.error('An Error Occured', error);
      },
    });
  }

   override newbuttonClicked(): void {
    console.log('New button clicked');
    this.categoryForm.enable();
     this.categoryForm.reset();
     this.categoryForm.patchValue({
      active: true
     });
  }

  override onEditClick(){
    console.log('we have entered in to edit mode ')
    this.isUpdate.set(true);
    this.categoryForm.enable();
  }

protected override SaveFormData(): void {
 if (this.categoryForm.invalid) {
      for (const field of Object.keys(this.categoryForm.controls)) {
        const control: any = this.categoryForm.get(field);
        if (control.invalid) {
          this.toast.error('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }
    this.selectedCategoryTypeObj.name = null;
    const selectedsDate = this.categoryForm.value.startdate;
    // Create a JavaScript Date object from the provided date components
    const sDateisoString = selectedsDate ? (this.convertToLocalDateString(new Date(selectedsDate))) : null;
   
    const selectedeDate = this.categoryForm.value.enddate;
    // Create a JavaScript Date object from the provided date components
    const eDateisoString = selectedeDate ? (this.convertToLocalDateString(new Date(selectedeDate))) : null;
    

    const payload = {
      "categoryName": this.categoryForm.get('categoryname')?.value,
      "categoryCode": this.categoryForm.get('categorycode')?.value,
      "categoryType":this.selectedCategoryTypeObj,
      "category": "s",
      "activeFlag": this.categoryForm.get('active')?.value ? 1 : 0,
      "measurementType": "s",
      "minimumQuantity": 0,
      "maximumQuantity": 0,
      "floorRate": 0,
      "minusStock":this.categoryForm.get('disableminusstock')?.value ? 1 : 0,
      "startDate": sDateisoString,
      "endDate": eDateisoString,
      "discountPerc": this.categoryForm.get('discountperc')?.value
    };
    if (this.isUpdate()) {
      this.updateCallback(payload);
    } else {
      this.createCallback(payload);
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
  updateCallback(payload:any){
    this.httpService.patch(EndpointConstant.UPDATEMASTERCATEGORY+this.selectedCategoryId,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response: any) => {
          this.isLoading.set(false);
         console.log('Save successful:', response);
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
          this.selectedCategoryId = this.firstCategory;
          this.fetchCategoryById();
          this.fetchallCategoryType();
          this.setInitialState();

        },
        error: (error) => {
          this.isLoading.set(false);
          this.toast.error('Please try again');
        },
      });
  }
setInitialState(){
    this.isNewBtnDisabled.set(false);
    this.isEditBtnDisabled.set(false);
    this.isDeleteBtnDisabled.set(false);
    this.isSaveBtnDisabled.set(true);
    this.isInputDisabled = true;
    this.isUpdate.set(false);
    this.disbaleFormControls();
  }
  createCallback(payload:any){
    this.httpService.post(EndpointConstant.SAVEMASTERCATEGORY,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response: any) => {
          this.isLoading.set(false);
         console.log('Save successful:', response);
          const resp = response as any; // cast to any and guard access
          const message = resp?.data?.msg ?? 'Area saved successfully!';
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
          this.selectedCategoryId = this.firstCategory;
          this.fetchCategoryById();
          this.setInitialState();
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error saving Category', error);
        },
      });
  }
  fetchCategoryById(): void { 
    this.httpService
    .fetch(EndpointConstant.FILLMASTERSCATEGORYBYID+this.selectedCategoryId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
         let startDate = null;
        let endDate = null;
        const data: any = response?.data;
        const current: any = Array.isArray(data) ? data[0] : (data ?? null);
        if (!current) {
          console.warn('No category returned for id', this.selectedCategoryId);
          return;
        }
        this.currentCategory.set(current);

       
console.log("Current Start Date Raw:", current.startDate);
        if (current.startDate != null) {
          startDate = this.datePipe.transform(new Date(current.startDate), 'yyyy-MM-dd');
        }
        console.log("Current Start Date:", startDate);
        if (current.endDate != null) {
          endDate = this.datePipe.transform(new Date(current.endDate), 'yyyy-MM-dd');
        }
console.log("Current Category Data:", current);
        this.categoryForm.patchValue({
          categorycode: current.code,
          categoryname: current.description,
          categorytype: current.typeCode,
          startdate: startDate,
          enddate: endDate,
          active: current.activeFlag,
          disableminusstock: current.minusStock,
          discountperc: current.discount,
        });
        this.onCategoryTypeSelected(current.typeCode);
        
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('An Error Occured', error);
      },
    });
  }
  protected override getDataById(selectedData: any): void {    
    console.log("Selected Data:", selectedData);
    this.selectedCategoryId = selectedData.id;
    console.log("Selected Category ID:", this.selectedCategoryId);
    this.firstCategory = this.selectedCategoryId;
    this.fetchCategoryById();
    this.setInitialState();
  }
}