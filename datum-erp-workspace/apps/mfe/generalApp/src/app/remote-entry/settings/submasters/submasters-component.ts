import { Component, inject,OnInit,} from '@angular/core';
import {FormControl,FormGroup, Validators } from '@angular/forms';
import { GeneralAppService } from '../../http/general-app.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { Event, registerLicense } from '@syncfusion/ej2-base';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { Keys, PSubMasterModel } from '../model/psubmasters.model';

@Component({
  selector: 'app-submasters-Main',
  standalone: false,
  templateUrl: './submasters-component.html',
  styles: [],
})
export class SubMastersComponent extends BaseComponent implements OnInit {
  private httpService = inject(GeneralAppService);
  subMasterForm = this.formUtil.thisForm;
  
  allkeys = [] as Array<Keys>;
  selectedKey = {} as Keys;
  selectedKeyValue!: string;
  selectedSubmaserId!: number;
  currentSubmaster = {} as PSubMasterModel;
  firstsubmaster!: number;
  isUpdate: boolean = false;
  isDelete: boolean = true;
  pageId = 112;

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.disableFormControls();
    console.log(this.currentPageInfo?.menuText);
    this.fetchAllKeys();
  }
  override FormInitialize() {
    this.subMasterForm = new FormGroup({
      key: new FormControl({ value: '', disabled: false },Validators.required),
      code: new FormControl({ value: '', disabled: false }),
      value: new FormControl({ value: '', disabled: false }, Validators.required),
      description: new FormControl({ value: '', disabled: false }),
    });
    console.log('form init started');
  }

 private fetchAllKeys(): void {
    this.httpService
      .fetch(EndpointConstant.FILLALLKEYS)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.allkeys = response?.data as any;
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  enableFormControls() {
    this.subMasterForm.get('value')?.enable();
    this.subMasterForm.get('description')?.enable();
    this.subMasterForm.get('code')?.enable();

  }
  disableFormControls() {
    this.subMasterForm.get('value')?.disable();
    this.subMasterForm.get('description')?.disable();
    this.subMasterForm.get('code')?.disable();
  }

override newbuttonClicked(): void {
  console.log('New button clicked');
  this.enableFormControls();
  this.subMasterForm.reset();
 this.subMasterForm.get('key')?.setValue(this.selectedKeyValue);
    
}

 override onEditClick(){
    console.log('we have entered in to edit mode ')
    this.isUpdate = true;
    this.enableFormControls();
  }
  override SaveFormData() {
    console.log(this.subMasterForm.controls);
    this.saveSubmaster();
  }

saveSubmaster() {
    if (this.subMasterForm.invalid) {
      for (const field of Object.keys(this.subMasterForm.controls)) {
        const control: any = this.subMasterForm.get(field);
        if (control.invalid) {
          alert('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }
   
   const payload = {
      id: this.selectedSubmaserId,
      key: {
        value: this.selectedKeyValue
      },
      code: this.subMasterForm.value.code,
      value: this.subMasterForm.value.value,
      description: this.subMasterForm.value.description
    };
    console.log("payload in save function:",payload);
    
    if (this.isUpdate) {
      this.updateCallback(payload);
    } else {
      this.createCallback(payload);
    }
  }

  updateCallback(payload: any) {
    this.httpService.patch(EndpointConstant.UPDATESUBMASTER + this.currentPageInfo?.id, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async(response) => {
          alert('Successfully Updated Submaster');
          //this.selectedSubmaserId = this.firstsubmaster;
          this.fetchSubmasterById();
           this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
       await this.LeftGridInit();
        },
        error: (error) => {
          console.log(error);
          alert('Please try again');
        },
        
      });
      
  }

  createCallback(payload: any) {
    this.httpService.post(EndpointConstant.SAVESUBMASTER + this.currentPageInfo?.id, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next:async (response) => {
          alert('Successfully saved Submaster');
          this.selectedSubmaserId = this.firstsubmaster;
          this.fetchSubmasterById();
           this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
         await this.LeftGridInit();
        },
        error: (error) => {
          console.error('Error saving Submasters', error);
        },
      });
  }
  
onKeySelect(): void {
  this.selectedKeyValue = this.subMasterForm.get('key')?.value;

  this.selectedKey = this.allkeys.find(k => k.Key === this.selectedKeyValue) as Keys;

  console.log("Selected key:", this.selectedKey);
  
  this.getDataById({ ID: this.firstsubmaster } as PSubMasterModel);
  this.LeftGridInit();

}

// override async LeftGridInit() {
//   this.pageheading = 'SubMasters';
//    const res = await firstValueFrom(
//       this.httpService
//         .fetch<any[]>(EndpointConstant.FILLSUBMASTER + this.selectedKeyValue)
//         .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
//     );

//   // Clear grid when no key selected
//   if (!this.selectedKeyValue) {
//     console.log('selected keyfrom',this.selectedKey);
//     console.log("No key selected → Clearing grid");
//     this.leftGrid.leftGridData = [];
//     return;
//   }
//   else{
//       try {
//         console.log('selected key is from the else block',this.selectedKey);
   

//     // safely assign data
//     this.leftGrid.leftGridData = res?.data;

//     console.log("Fetched data:", this.leftGrid.leftGridData);
// this.serviceBase.dataSharingService.setData({
//   columns: this.leftGrid.leftGridColumns,
//   data: this.leftGrid.leftGridData,
//   pageheading: this.pageheading,
// });
//     // Assign columns (only if not already set)
//     this.leftGrid.leftGridColumns = [
//       {
//         headerText: 'SubMasters List',
//         columns: [
//           { field: 'Key', datacol: 'Key', headerText: 'Key', textAlign: 'Left' },
//           { field: 'Value', datacol: 'Value', headerText: 'Value', textAlign: 'Left' }
//         ],
//       },
//     ];

//   } catch (err) {
//     console.error('Error fetching submasters:', err);
//     this.leftGrid.leftGridData = [];
//   }
//   }
// }
override async LeftGridInit() {
  if (!this.selectedKeyValue) return;  

  const res = await firstValueFrom(
    this.httpService.fetch<any[]>(
      EndpointConstant.FILLSUBMASTER + this.selectedKeyValue
    )
  );

  this.leftGrid.leftGridData = res?.data ?? [];

  // Set first submaster ID for default selection
  if (this.leftGrid.leftGridData.length > 0) {
    this.firstsubmaster = this.leftGrid.leftGridData[0].ID;
  }

  this.leftGrid.leftGridColumns = [
    {
      headerText: 'SubMasters List',
      columns: [
        { field: 'Key', headerText: 'Key', textAlign: 'Left' },
        { field: 'Value', headerText: 'Value', textAlign: 'Left' }
      ]
    }
  ];

  this.serviceBase.dataSharingService.setData({
    columns: this.leftGrid.leftGridColumns,
    data: this.leftGrid.leftGridData,
    pageheading: this.pageheading,
  });

  // auto load latest record on UI
  if (!this.isUpdate) {
    this.selectedSubmaserId = this.firstsubmaster;
    this.fetchSubmasterById();
  }
}


  override getDataById(data: PSubMasterModel) {
    console.log('data', data);
    this.subMasterForm.patchValue({
    value: '',
    description: '',
    code: ''
});
    this.selectedSubmaserId = data.ID;
    this.fetchSubmasterById();
  }

  private  fetchSubmasterById(): void {
    this.httpService
      .fetch(EndpointConstant.FILLSUBMASTERBYID + this.selectedSubmaserId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.currentSubmaster = (response?.data as any[])[0];
          this.subMasterForm.patchValue({
            key: this.currentSubmaster.Key,
            value: this.currentSubmaster.Value,
            description: this.currentSubmaster.Description,
            code: this.currentSubmaster.Code
          });
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },

      });
  }


  override DeleteData(data: PSubMasterModel) {
    if(!this.isDelete){
      alert('Permission Denied!');
      return false;
    }
    if (confirm("Are you sure you want to delete this details?")) {
    
      this.httpService.delete(EndpointConstant.DELETESUBMASTER + this.selectedSubmaserId +'&PageId=' + this.currentPageInfo?.id)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            alert(response.data);
            this.selectedSubmaserId = this.firstsubmaster;
            this.LeftGridInit();
          },
          error: (error) => {
            alert('Please try again');
          },
        });
    }
    return true;
  }

  override formValidationError(){
    console.log("form error found");
  }
}
