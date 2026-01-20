import { Component, inject, OnInit, signal } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { InventoryAppService } from "../../http/inventory-app.service";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup } from "@angular/forms";
import { ValidationService } from "@org/services";
import { CategoryType, CategoryTypeDto } from "../model/pcategory.model";

@Component({
  selector: 'app-categoryType-Main',
  standalone: false,
  templateUrl: './categoryType-component.html',
  styles: [],
})
export class CategoryTypeComponent extends BaseComponent implements OnInit{
 private httpService = inject(InventoryAppService);
  categoryTypeForm = this.formUtil.thisForm;
   currentCategoryType ={} as CategoryType ;

   isUpdate = signal(false);
        // STATE PROPERTIES
      isLoading = signal(false);
      isInputDisabled = true;
      isActive: unknown;
      currentid = signal(0);
        // TOOLBAR STATE PROPERTIES
      isNewMode = signal(false);
      isEditMode = signal(false);
      isNewBtnDisabled = signal(false);
      isEditBtnDisabled = signal(false);
      isDeleteBtnDisabled = signal(false);
      isSaveBtnDisabled = signal(false);
      isPrintBtnDisabled = signal(false);
  //userform = this.formUtil.thisForm;

  
  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    console.log(this.currentPageInfo?.menuText);
  }
  // override FormInitialize() {
  //   this.warehouseForm = new FormGroup({
  //     name: new FormControl(
  //       { value: '', disabled: false },
  //       Validators.required
  //     ),
  //     description: new FormControl(
  //       { value: '', disabled: false },
  //       Validators.required
  //     ),
  //     allocaterevenue: new FormControl({ value: '', disabled: false }),
  //     allocatenonrevenue: new FormControl({ value: '', disabled: false }),
  //     active: new FormControl({ value: true, disabled: false }),
  //   });
  //   console.log('form init started');
  //   }
  enableFormControls(){
    this.categoryTypeForm.get('id')?.enable();
    this.categoryTypeForm.get('code')?.enable();
    this.categoryTypeForm.get('description')?.enable();    
    this.categoryTypeForm.get('active')?.enable();
    this.categoryTypeForm.get('notes')?.enable();
  }

  disbaleFormControls(){
    this.categoryTypeForm.get('id')?.disable();
    this.categoryTypeForm.get('code')?.disable();
    this.categoryTypeForm.get('description')?.disable();    
    this.categoryTypeForm.get('active')?.disable();
    this.categoryTypeForm.get('notes')?.disable();
  }
    override SaveFormData() {
    console.log('data scving');
       const category=this.categoryTypeForm.value;
    if(!category.code||category.code.trim()==='' || !category.description||category.description.trim()==='' )
    {
        alert("code and description is required")
        return;
    }
    const payload = this.buildPayload();
console.info("isupdate:",this.isUpdate())
console.info("newmode:",this.isNewMode())
    if (this.isUpdate()) {
      this.updateCallback(payload);
    } else if (this.isNewMode()) {
      this.saveNewCategoryType(payload);
    }
   this.isUpdate.set(false);
                this.isNewMode.set(false);
                this.isEditMode.set(false);
                this.toggleForm(false);
        
                this.LeftGridInit();
  }
  toggleForm(editing: boolean) {
            if (editing) {
              this.categoryTypeForm.enable();
            } else {
              this.categoryTypeForm.disable();
            }
            this.isInputDisabled = !editing;
          }

  override async LeftGridInit() {
    this.pageheading = 'CategoryType';
    try {

      // Developer permision allowed
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLCATEGORYTYPES)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );
// not alolowed 
      // handle data here after await completes
      this.leftGrid.leftGridData = res.data;
      console.log('Fetched data:', this.leftGrid.leftGridData);

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'CategoryType List',
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
  this.currentCategoryType = this.leftGrid.leftGridData[count - 1];
  console.info("selectedId:", this.currentCategoryType);
  this.getDataById(this.currentCategoryType);
} else {
  console.warn("No CategoryType data available.");
}
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }
    private patchFormFromCurrent(): void {
    const cur = this.currentCategoryType;
    console.info(cur)
    console.info("Id:",cur?.id)
    if (!cur) return;
    this.httpService
        .fetch<any>(
          EndpointConstant.FILLCATEGORYTYPEBYID+cur.id
        )
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
           const cat=response.data[0];
              // Patch form values
    this.categoryTypeForm.patchValue({
      id: cat.id??0,
      code: cat.code ?? '',
      description: cat.description ?? '',
      active: !!cat.active,
      notes: cat.notes ?? '',
    }, { emitEvent: false });
  
            console.info("warehouseform :",this.categoryTypeForm)
          },
          error: (error) => {
            console.error(
              'An Error Occurred while fetching warehouse master by ID:',
              error
            );
          },
        });
  }
  protected override getDataById(data: CategoryType): void {
    console.info(data)
     this.currentCategoryType=data;
    console.info("current:",this.currentCategoryType)
    this.patchFormFromCurrent();
  }
  protected override FormInitialize(): void {
    this.categoryTypeForm = new FormGroup({
      code: new FormControl('', [ValidationService.required(), ValidationService.stringValidator()]),
      description: new FormControl(''),
      active: new FormControl(0,),
      notes: new FormControl(''),
          });
  }
  protected override DeleteData(data: any): void {
     if (this.isUpdate() || !this.currentCategoryType) return;
    if (!confirm('Delete this category type?')) return;

    this.httpService
      .delete(EndpointConstant.DELETECATEGORYTYPE + this.currentCategoryType?.id)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res?.isValid && res?.httpCode !== 200) {
            console.error('Error deleting category type:', res);
            alert('Error deleting category type');
            return;
          }
          alert('Category type deleted successfully');
          this.LeftGridInit();
        },
        error: (err) => {
          console.error('Error deleting category type', err);
          alert('Error deleting category type');
        },
      });
      this.LeftGridInit();
  }
  private buildPayload() {
    const v = this.categoryTypeForm.value;
    return {
      code: (v.code ?? '').toString().trim(),
      description: (v.description ?? '').toString().trim(),
      avgStockQuantity: 0,
      active: !!v.active,
      notes: v.notes ?? ''
    };
  }

  private saveNewCategoryType(payLoad: any): void {
    console.info("Save :",payLoad)
    this.httpService
      .post(EndpointConstant.SAVECATEGORYTYPE, payLoad)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res?.isValid && res?.httpCode !== 200) {
            console.error('Error saving category type:', res);
            alert('Error saving category type');
            return;
          }
          alert('Category type saved successfully'); 
          this.patchFormFromCurrent();
        },
        error: (err) => console.error('Error saving category type', err),
      });
  }

  private updateCallback(payLoad: any) {

    const id = this.currentCategoryType?.id;
    console.info("Update:",payLoad);
    console.info(id);
    if (!id) return;
    this.httpService
      .patch(EndpointConstant.UPDATECATEGORYTYPE + id, payLoad)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          alert('Category type updated successfully');
          this.patchFormFromCurrent();
        },
        error: (err) => {
          console.error('Error updating category type', err);
          alert('Error updating category type');
        },
      });
  }
  override newbuttonClicked(): void {
       this.isInputDisabled = !this.isInputDisabled;
  this.isEditBtnDisabled =signal(!this.isInputDisabled);
  this.isDeleteBtnDisabled = signal(!this.isInputDisabled);
  this.isSaveBtnDisabled = signal(this.isInputDisabled);
  this.categoryTypeForm.reset();
  if(this.isInputDisabled == true){
    this.disbaleFormControls();
    
  } else{
    this.enableFormControls(); 
    this.categoryTypeForm.patchValue({
      active:1,
    });     
  }
    
    }
      protected override onEditClick(): void {
    
    this.isInputDisabled = !this.isInputDisabled;
    this.isDeleteBtnDisabled =signal( !this.isInputDisabled);
    this.isNewBtnDisabled = signal(!this.isInputDisabled);
    this.isSaveBtnDisabled = signal(this.isInputDisabled);
    this.isUpdate = signal(this.isInputDisabled);
    console.log(this.isInputDisabled)
    if(this.isInputDisabled){
      this.enableFormControls();
    } else{
      this.disbaleFormControls();
    }
    //this.fetchPriceCategoryById();
  }

   
}