import { Component,DestroyRef,ElementRef,inject,OnInit,signal,ViewChild,} from '@angular/core';
import { FormBuilder,FormControl,FormGroup,Validators,} from '@angular/forms';
import { GeneralAppService } from '../../http/general-app.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { registerLicense } from '@syncfusion/ej2-base';
import { AlertDialogComponent } from '@org/ui';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { COSTCATEGORY, PCosftCategoryModel } from '../model/pCosftCategory.model';
import { BaseService } from '@org/services';

@Component({
  //eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-costcategory-Main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './costcategory-component.html',
  styles: [],
})
export class CostCategoryComponent extends BaseComponent implements OnInit {
  private httpService = inject(GeneralAppService);
  private baseService = inject(BaseService);
  costCategoryForm = this.formUtil.thisForm;

  selectedCostCategoryId = 0;
  firstCategory = 0;
  currentCostCategory = {} as COSTCATEGORY;
  isCreate = true; 
  isUpdate = false;

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    console.log(this.currentPageInfo?.menuText);
    this.costCategoryForm.disable();
  }
  override FormInitialize() {
    this.costCategoryForm = new FormGroup({
      name: new FormControl({ value: '', disabled: false },Validators.required),
      description: new FormControl({ value: '', disabled: false },Validators.required),
      allocaterevenue: new FormControl({ value: '', disabled: false }),
      allocatenonrevenue: new FormControl({ value: '', disabled: false }),
      active: new FormControl({ value: true, disabled: false }),
    });
    console.log('form init started');
  }

   override newbuttonClicked(): void {
    console.log('New button clicked');
    this.costCategoryForm.enable();
     this.costCategoryForm.reset();
  }

 override onEditClick(){
    console.log('we have entered in to edit mode ')
    this.isUpdate = true;
    this.costCategoryForm.enable();
  }

  override SaveFormData() {
   // console.log('data scving');
    console.log(this.costCategoryForm.controls);
    this.saveCostCategory();
  }

  private  saveCostCategory() {
    if (this.costCategoryForm.invalid) {
      for (const field of Object.keys(this.costCategoryForm.controls)) {
        const control: any = this.costCategoryForm.get(field);
        if (control.invalid) {
          this.baseService.showCustomDialogue('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }
   
    const payload =  {
      "name": this.costCategoryForm.get('name')?.value,
      "description": this.costCategoryForm.get('description')?.value,
      "allocateRevenue": this.costCategoryForm.get('allocaterevenue')?.value ? true : false,
      "allocateNonRevenue": this.costCategoryForm.get('allocatenonrevenue')?.value ? true : false,
      "active": this.costCategoryForm.get('active')?.value ? true : false,
    };
    if(this.isUpdate){
      this.updateCallback(payload);
    } else{
      this.createCallback(payload);
    }
  }

updateCallback(payload: any) {
  this.httpService
    .patch(EndpointConstant.UPDATECOSTCATEGORY + this.selectedCostCategoryId, payload)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response: any) => {
        this.baseService.showCustomDialogue("Successfully saved Cost Category");
        // Updated record received from backend
        const updatedCategory = response?.data;

        if (updatedCategory) {
          // 🔥 Update old record in leftGrid without refresh
          this.leftGrid.leftGridData = this.leftGrid.leftGridData.map(item =>
            item.id === updatedCategory.id ? updatedCategory : item
          );
        }

        // Update shared service if required
        this.serviceBase.dataSharingService.setData({
          columns: this.leftGrid.leftGridColumns,
          data: this.leftGrid.leftGridData,
          pageheading: this.pageheading,
        });

        // Reset selected ID
        this.selectedCostCategoryId = this.firstCategory;
        this.costCategoryForm.disable();
        
      },

      error: () => {
        this.baseService.showCustomDialogue('Please try again');
      },
    });
}

createCallback(payload: any) {
  this.httpService
    .post(EndpointConstant.SAVECOSTCATEGORY, payload)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response: any) => {
        this.baseService.showCustomDialogue('Successfully saved Cost Category');

        // Newly added category received from API
        const newCategory = response?.data;

        if (newCategory) {
          // 🔥 Add to left grid instantly (NO refresh required)
          this.leftGrid.leftGridData = [...this.leftGrid.leftGridData, newCategory];
        }

        // Update shared service if required
        this.serviceBase.dataSharingService.setData({
          columns: this.leftGrid.leftGridColumns,
          data: this.leftGrid.leftGridData,
          pageheading: this.pageheading,
        });

        // Reset form selection
        this.selectedCostCategoryId = this.firstCategory;
        this.costCategoryForm.disable();
      },

      error: (error) => {
        console.error('Error saving Category', error);
      },
    });
}

  override async LeftGridInit() {
    this.pageheading = 'Cost Category';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLCOSTCATEGORIES)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      // handle data here after await completes
      this.leftGrid.leftGridData = res.data;
      console.log('Fetched data:', this.leftGrid.leftGridData);

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Cost Category List',
          columns: [
            {
              field: 'id',
              datacol: 'id',
              headerText: 'ID',
              textAlign: 'Left',
            },
            {
              field: 'name',
              datacol: 'id',
              headerText: 'Name',
              textAlign: 'Left',
            },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }

  override getDataById(data: PCosftCategoryModel) {
    console.log('data', data);
    this.selectedCostCategoryId = data.id;
    this.fetchCostCategoryById();
  }

  private fetchCostCategoryById(): void { 
    this.httpService
    .fetch(EndpointConstant.FILLCOSTCATEGORYBYID+this.selectedCostCategoryId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response: any) => {
        this.currentCostCategory = response?.data[0];  
        this.costCategoryForm.patchValue({
          name: this.currentCostCategory.name,
          description: this.currentCostCategory.description,
          allocaterevenue: this.currentCostCategory.allocateRevenue,
          allocatenonrevenue:this.currentCostCategory.allocateNonRevenue,
          active: this.currentCostCategory.active,
        });
        
      },
      error: (error) => {
        console.error('An Error Occured', error);
      },
    });
  }


  override DeleteData(data: PCosftCategoryModel) {
    console.log('deleted');
     if(!this.isCreate){
      this.baseService.showCustomDialogue('Permission Denied!');
      return false;
    }
    if(confirm("Are you sure you want to delete this details?")) {
      this.httpService.delete(EndpointConstant.DELETECOSTCATEGORY+this.selectedCostCategoryId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.baseService.showCustomDialogue(response.data as any);          
          this.selectedCostCategoryId = this.firstCategory;
          this.LeftGridInit();
        },
        error: (error) => {
          this.baseService.showCustomDialogue('Please try again');
        },
      });
    }
    return true;
  }

  override formValidationError(){
    console.log("form error found");
  }
}
