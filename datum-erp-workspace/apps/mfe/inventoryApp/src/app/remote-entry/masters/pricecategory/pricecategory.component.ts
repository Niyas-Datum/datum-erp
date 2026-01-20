import { Component, inject, OnInit } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { PRICECATEGORIES, PRICECATEGORY } from "../model/ppricecategory.model";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { InventoryAppService } from "../../http/inventory-app.service";

@Component({
  selector: 'app-priceCategory-Main',
  standalone: false,
  templateUrl: './priceCategory.component.html',
  styles: [],
})
export class PriceCategoryComponent extends BaseComponent implements OnInit{
     private httpService = inject(InventoryAppService);
      isLoading=false;
  selectedPriceCategory : number=0;
  //selectedpricecategoryId=0;
  //firstpricecategory !:number;
  isInputDisabled: boolean = true;
  isEditBtnDisabled: boolean = false;
  isDeleteBtnDisabled: boolean = false; 
  isSaveBtnDisabled: boolean = true; 
  isNewBtnDisabled: boolean = false;
  isUpdate: boolean = false;
  isOverlayVisible: boolean = false;
  allPriceCategory=[] as Array<PRICECATEGORY>;
  PriceCategoryForm= this.formUtil.thisForm;

  isNewMode:boolean=false;
  isEditMode:boolean=false;
  isDeleteMode:boolean=false;
  
  currentPriceCategory ={} as PRICECATEGORIES
  signList:any =[
    {
      "value" : "+",
    },
    {
      "value" : "-"
    }
  ];
    constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    
  }
  protected override FormInitialize(): void {
      this.PriceCategoryForm= new FormGroup({
       categoryname :new FormControl ({value:'',disabled: this.isInputDisabled},Validators.required),
       ofsellingpriceSign: new FormControl ({ value: '', disabled: this.isInputDisabled }),
       ofsellingpriceValue: new FormControl ({ value: '', disabled: this.isInputDisabled }, [Validators.required,  Validators.pattern(/^\d+(\.\d{1,8})?$/)]),
       description: new FormControl ({value: '', disabled: this.isInputDisabled}),
       active:new FormControl ({value: 1, disabled: this.isInputDisabled}),
       
     });
    
  }
    protected override async LeftGridInit() {
       this.pageheading = 'PriceCategory';
            try {
        
              // Developer permision allowed
              const res = await firstValueFrom(
                this.httpService
                  .fetch<any[]>(EndpointConstant.FILLALLPRICECATEGORY)
                  .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
              );
        // not alolowed 
              // handle data here after await completes
              this.leftGrid.leftGridData = res.data;
              console.log('Fetched data:', this.leftGrid.leftGridData);
        
              this.leftGrid.leftGridColumns = [
                {
                  headerText: 'PriceCategory List',
                  columns: [    
                                
                    {
                      field: 'Name',
                      datacol: 'Name',
                      headerText: 'Name',
                      textAlign: 'Left',
                    },
                     {
                      field: 'Perc',
                      datacol: 'Perc',
                      headerText: 'Perc',
                      textAlign: 'Left',
                    },
                    
                  ],
                },
              ];
            } catch (err) {
              console.error('Error fetching companies:', err);
            }       
            this.selectedPriceCategory=this.leftGrid.leftGridData[0].ID;
            console.info("selectedId:",this.selectedPriceCategory)
            this.fetchPriceCategoryById();
      }
      setInitialState(){
    this.isNewBtnDisabled=false;
    this.isEditBtnDisabled=false;
    this.isDeleteBtnDisabled=false;
    this.isSaveBtnDisabled=true;
    this.isInputDisabled=true;
    this.isUpdate=false;
    this.isNewMode=false
    this.disbaleFormControls();
   }
  
     disbaleFormControls(){
    this.PriceCategoryForm.get('categoryname')?.disable();
    this.PriceCategoryForm.get('ofsellingpriceSign')?.disable();
    this.PriceCategoryForm.get('ofsellingpriceValue')?.disable();
    this.PriceCategoryForm.get('description')?.disable();
    this.PriceCategoryForm.get('active')?.disable();
    
  }
  enableFormControls(){
    this.PriceCategoryForm.get('categoryname')?.enable();
    this.PriceCategoryForm.get('ofsellingpriceSign')?.enable();
    this.PriceCategoryForm.get('ofsellingpriceValue')?.enable();
    this.PriceCategoryForm.get('description')?.enable();
    this.PriceCategoryForm.get('active')?.enable();
   
  }
  protected override onEditClick(): void {
    
    this.isInputDisabled = !this.isInputDisabled;
    this.isDeleteBtnDisabled = !this.isInputDisabled;
    this.isNewBtnDisabled = !this.isInputDisabled;
    this.isSaveBtnDisabled = this.isInputDisabled;
    this.isUpdate = this.isInputDisabled;
    console.log(this.isInputDisabled)
    if(this.isInputDisabled){
      this.enableFormControls();
    } else{
      this.disbaleFormControls();
    }
    //this.fetchPriceCategoryById();
  }
  fetchPriceCategoryById():void{
    console.log("id:",this.selectedPriceCategory)
    this.httpService
    .fetch<PRICECATEGORIES[]>(EndpointConstant.FILLPRICECATEGORYBYID+this.selectedPriceCategory)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        this.currentPriceCategory = response.data[0];

        console.log('Current Price Category Data:', this.currentPriceCategory);

        let sign = '+';
        let decimalValue = Math.abs(this.currentPriceCategory.perc);
console.info("perc:",this.currentPriceCategory.perc)
        if (this.currentPriceCategory.perc < 0) {
          sign = '-';
        }

        this.PriceCategoryForm.patchValue({
          categoryname: this.currentPriceCategory.name,
          ofsellingpriceSign: sign,
          ofsellingpriceValue: decimalValue,
          active: this.currentPriceCategory.active,
          description: this.currentPriceCategory.note,    
        });

      // console.log('Form Values After Patching:', this.PriceCategoryForm.value);
      
      },
      error: (error) => {
        this.isLoading = false;
        console.error('An Error Occured', error);
      },
    });
  }
  protected override getDataById(data: PRICECATEGORY): void {
    this.selectedPriceCategory=data.ID;
      this.fetchPriceCategoryById();
  }

protected override DeleteData(data: any): void {
    // if(!this.isDelete){
    //   this.baseService.showCustomDialogue('Permission Denied!');
    //   return false;
    // }
     this.isInputDisabled = !this.isInputDisabled;
    this.isDeleteBtnDisabled = this.isInputDisabled;
    this.isNewBtnDisabled = !this.isInputDisabled;
    this.isSaveBtnDisabled = this.isInputDisabled;
    this.isEditBtnDisabled=this.isInputDisabled;
    this.isUpdate = !this.isInputDisabled;
    console.log(this.isInputDisabled)
    if(this.isInputDisabled){
      this.enableFormControls();
    } else{
      this.disbaleFormControls();
    }
    if(confirm("Are you sure you want to delete this details?")) {
      this.isLoading = true;
      this.httpService.delete(EndpointConstant.DELETEPRICECATEGORY+this.selectedPriceCategory +'&PageId=' +this.currentPageInfo?.id)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          this.isLoading = false;
         // this.baseService.showCustomDialogue(response.data);          
         // this.selectedPriceCategory = this.firstpricecategory;
          await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
         // this.setInitialState();
        },
        error: (error) => {
          this.isLoading = false;
         // this.baseService.showCustomDialogue('Please try again');
        },
      });
    }
}
protected override newbuttonClicked(): void {
    //  if(!this.isCreate){
    //   this.baseService.showCustomDialogue('Permission Denied!');
    //   return false;
    // }
   
    // if(this.isNewMode)
    // {
    //     this.isNewMode=false;
    //    if(confirm("are cancel new mode?"))
    //    {
    //     console.log("newmode-selectedid:",this.selectedPriceCategory)
    //     this.fetchPriceCategoryById();
    //     this.isInputDisabled=false;
    //    }
    // //    else
    // //     this.isInputDisabled=false;
    // }
    // else
    // {
    //     this.selectedPriceCategory=this.selectedPriceCategory;
    //     this.isNewMode=true;
    //     this.isInputDisabled=true;
    // }
    // console.log("input:",this.isInputDisabled)
    //this.isInputDisabled = !this.isInputDisabled;
   
    //this.isUpdate = !this.isInputDisabled;
    //this.selectedPriceCategory=0;
   // this.PriceCategoryForm.reset();    
    this.isEditBtnDisabled = !this.isInputDisabled;
    this.isDeleteBtnDisabled = !this.isInputDisabled;
    this.isSaveBtnDisabled = this.isInputDisabled;
    if(!this.isInputDisabled){
         this.selectedPriceCategory=this.selectedPriceCategory;
      this.disbaleFormControls();
      //this.selectedPriceCategory = this.firstpricecategory;
      this.fetchPriceCategoryById();
    }
    else{
      //this.selectedPriceCategory = 0;
      this.PriceCategoryForm.reset(); 
      this.enableFormControls();
    }
    this.PriceCategoryForm.get('ofsellingpriceSign')?.setValue('+');
    this.PriceCategoryForm.get('active')?.setValue(true);
   // this.setMode(this.isInputDisabled)
   // console.log("inputnext:",this.isInputDisabled)
    
}
protected override SaveFormData(): void {
    //  if (this.PriceCategoryForm.invalid) {
    //   for (const field of Object.keys(this.PriceCategoryForm.controls)) {
    //     const control: any = this.PriceCategoryForm.get(field);
    //     if (control.invalid) {
    //      // this.baseService.showCustomDialogue('Invalid field: ' + field);
    //       return;  // Stop after showing the first invalid field
    //     }
    //   }
    //   return;
    // }
    const price=this.PriceCategoryForm.value;
    if(!price.categoryname||price.categoryname.trim()==='' || !price.ofsellingpriceValue)
        alert("name and price is required")
    else
    {
    const sign = this.PriceCategoryForm.get('ofsellingpriceSign')?.value;
    const value = this.PriceCategoryForm.get('ofsellingpriceValue')?.value;
    const numericValue = parseFloat(value);
    let finalValue = numericValue;
    
    if (sign === '-') {
      finalValue = -numericValue; 
    } else if (sign === '+') {
      finalValue = +numericValue; 
    } else {
      console.error('Invalid sign value');
      return;
    }
    
  console.log("selectedPriceCategory:",this.selectedPriceCategory)
    const payload ={
      "ID" :  Number(this.selectedPriceCategory),
      "categoryName": this.PriceCategoryForm.value.categoryname,
      "sellingPrice": finalValue,
      "description":this.PriceCategoryForm.value.description,
      "active":Boolean(this.PriceCategoryForm.value.active)
    };
console.log("update:",this.isUpdate)
    if(this.isUpdate){
      this.updateCallBack(payload);
    }else{
      this.createCallBack(payload);
    }
    alert("Successfully Save")
}
}
 updateCallBack(payload:any){
     
    //console.log('Payload:', payload);
    this.httpService.patch(EndpointConstant.UPDATEPRICECATEGORY+this.currentPageInfo?.id,payload)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: async (response) => {
        this.isLoading = false;
        //this.baseService.showCustomDialogue("Successfully updated Price Category"); 
        //this.selectedPriceCategory = this.firstpricecategory;
        this.fetchPriceCategoryById();
        //this.fetchPriceCategory();
        this.setInitialState();
         this.newbuttonClicked();
           await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
      },
      error: (error) => {
        this.isLoading = false;
        //this.baseService.showCustomDialogue('Please try again');
      },
    });
}

  createCallBack(payload:any){
    this.httpService.post(EndpointConstant.SAVEPRICECATEGORY+this.currentPageInfo?.id,payload)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: async (response) => {
        this.isLoading = false;
        if(response.httpCode == 200){
         // this.baseService.showCustomDialogue('Successfully saves PriceCategory');
         // this.selectedPriceCategory = this.firstpricecategory;
          this.fetchPriceCategoryById();
          //this.fetchPriceCategory();
          this.setInitialState();
           this.newbuttonClicked();
           await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
        }
        if(response.httpCode == 500){
        //  this.baseService.showCustomDialogue(response.data);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving pricecategory',error);
      }
     });
  }
}