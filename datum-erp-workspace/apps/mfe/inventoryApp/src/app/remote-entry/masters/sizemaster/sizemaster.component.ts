import { Component, inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@org/architecture";
import { SIZEMASTERBYID, SIZEMASTERS } from "../model/psizemaster.model";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { InventoryAppService } from "../../http/inventory-app.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SizeMaster } from "../../transactions/common/interface/transactions.interface";

@Component({
  selector: 'app-sizemaster-Main',
  standalone: false,
  templateUrl: './sizemaster.component.html',
  styles: [],
})
export class SizeMasterComponent extends BaseComponent implements OnInit{
      private httpService = inject(InventoryAppService);
    sizeMasterForm=this.formUtil.thisForm;
  isNewBtnDisabled: boolean = false;
  isEditBtnDisabled: boolean = false;
  isDeleteBtnDisabled: boolean = false; 
  isSaveBtnDisabled: boolean = true; 
  isUpdate: boolean = false;
  isInputDisabled: boolean = true;
  isLoading = false;
  selectedSizeMasterId!:number;
  allSizeMaster=[] as Array<SIZEMASTERS>; 
  currentSizemaster={} as SIZEMASTERBYID
  firstSizeMaster=0;
     constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
  }
  protected override FormInitialize(): void {
      this.sizeMasterForm = new FormGroup({      
      code:new FormControl({value: '', disabled: this.isInputDisabled}, Validators.required),
      name: new FormControl ({value: '', disabled: this.isInputDisabled}, Validators.required),
      description: new FormControl ({value: '', disabled: this.isInputDisabled}),     
      active: new FormControl ({value: true, disabled: this.isInputDisabled})
    });  
  }
  override async LeftGridInit() {
     this.pageheading = 'SizeMaster';
          try {
      
            // Developer permision allowed
            const res = await firstValueFrom(
              this.httpService
                .fetch<any[]>(EndpointConstant.FILLSIZEMASTER)
                .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            );
      // not alolowed 
            // handle data here after await completes
            this.leftGrid.leftGridData = res.data;
            console.log('Fetched data:', this.leftGrid.leftGridData);
      
            this.leftGrid.leftGridColumns = [
              {
                headerText: 'SizeMaster List',
                columns: [
                  {
                    field: 'Code',
                    datacol: 'Code',
                    headerText: 'Code',
                    textAlign: 'Left',
                  },
                  {
                    field: 'Name',
                    datacol: 'Name',
                    headerText: 'Name',
                    textAlign: 'Left',
                  },
                ],
              },
            ];
            this.firstSizeMaster=this.leftGrid.leftGridData[0].id;
          this.selectedSizeMasterId=this.firstSizeMaster;
          console.log("selectId",this.selectedSizeMasterId)
          this.fetchSizeMasterById();
          } catch (err) {
            console.error('Error fetching companies:', err);
          }   
          
    }
enableFormControls(){
    this.sizeMasterForm.get('code')?.enable();
    this.sizeMasterForm.get('name')?.enable();
    this.sizeMasterForm.get('description')?.enable();    
    this.sizeMasterForm.get('active')?.enable();
  }

  disbaleFormControls(){
    this.sizeMasterForm.get('code')?.disable();
    this.sizeMasterForm.get('name')?.disable();
    this.sizeMasterForm.get('description')?.disable();    
    this.sizeMasterForm.get('active')?.disable();
  }
  protected override newbuttonClicked(): void {
    //    if(!this.isCreate){
    //   //this.baseService.showCustomDialogue('Permission Denied!');
    //   return false;
    // }
    this.isInputDisabled = !this.isInputDisabled;
    this.isEditBtnDisabled = !this.isInputDisabled;
    this.isDeleteBtnDisabled = !this.isInputDisabled;
    this.isSaveBtnDisabled = this.isInputDisabled;
    this.sizeMasterForm.reset();
    if(this.isInputDisabled == true){
      this.disbaleFormControls();
      this.selectedSizeMasterId = this.firstSizeMaster;
      this.fetchSizeMasterById();
    } else{
      this.selectedSizeMasterId = 0;
      this.enableFormControls(); 
      this.sizeMasterForm.patchValue({
        active:true,       
      });     
    }
  }
    fetchSizeMasterById(): void {
    this.httpService
      .fetch<SIZEMASTERBYID>(EndpointConstant.FILLSIZEMASTERBYID + this.selectedSizeMasterId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.currentSizemaster = response.data;
          console.log(this.currentSizemaster);
          this.sizeMasterForm.patchValue({
            code: this.currentSizemaster.code,
            name: this.currentSizemaster.name,
            active: this.currentSizemaster.active,
            description: this.currentSizemaster.description            
          });
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },

      });
  }
  protected override getDataById(data: SIZEMASTERBYID): void {
    this.isInputDisabled=false;
    this.selectedSizeMasterId=data.id
      this.fetchSizeMasterById();
  }
    protected override onEditClick(): void {
        //  if(!this.isEdit){
        //   this.baseService.showCustomDialogue('Permission Denied!');
        //   return false;
        // }
        
        console.info(this.isInputDisabled)
        this.isInputDisabled = !this.isInputDisabled;
        this.isDeleteBtnDisabled = !this.isInputDisabled;
        this.isNewBtnDisabled = !this.isInputDisabled;
        this.isSaveBtnDisabled = this.isInputDisabled;
        this.isUpdate = !this.isInputDisabled;
        if (!this.isInputDisabled) {
        this.enableFormControls();
        } else {
        this.disbaleFormControls();
        }
        
    }
    protected override async SaveFormData(): Promise<void> {
        const size=this.sizeMasterForm.value;
    if(!size.code||size.code.trim()==='' || !size.name||size.name.trim()==='')
    {
        alert("name and code is required");
        return;
    }
         if (this.sizeMasterForm.invalid) {
      for (const field of Object.keys(this.sizeMasterForm.controls)) {
        const control: any = this.sizeMasterForm.get(field);
        // if (control.invalid) {
        //   this.baseService.showCustomDialogue('Invalid field: ' + field);
        //   return;  // Stop after showing the first invalid field
        // }
      }
      return;
    }
    if(!this.isUpdate)
      this.selectedSizeMasterId=0;
    const payload = {
      id: this.selectedSizeMasterId,      
      code: this.sizeMasterForm.value.code,
      name: this.sizeMasterForm.value.name,
      description: this.sizeMasterForm.value.description,
      active:this.sizeMasterForm.value.active
    };
    this.createCallback(payload);
     await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
    }
      createCallback(payload: any) {
        console.info("PageId:",this.currentPageInfo?.id)
        console.info("Payload:",payload)
    this.httpService.post(EndpointConstant.SAVESIZEMASTER + this.currentPageInfo?.id, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          this.isLoading = false;
          //this.baseService.showCustomDialogue('Successfully saved Size Master');
          this.selectedSizeMasterId = this.firstSizeMaster;
         console.log('Save successful:', response);
          const resp = response as any; // cast to any and guard access
          const message = resp?.data?.msg ?? 'SizeMaster saved successfully!';
          if (resp?.isValid) {
            alert(message);
          } else {
            alert('Save failed: ' + (message || ''));
          }
           await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });

        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving Sizemasters', error);
        },
      });
  }
  
  protected override  DeleteData(data: any): void {
    //   if(!this.isDelete){
    //   this.baseService.showCustomDialogue('Permission Denied!');
    //   return false;
    // }
    if (confirm("Are you sure you want to delete this details?")) {
      this.isLoading = true;    
      this.httpService.delete(EndpointConstant.DELETESIZEMASTER + this.selectedSizeMasterId +'&pageId=' + this.currentPageInfo?.id)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: async (response) => {
            //this.baseService.showCustomDialogue(response.data);
            this.selectedSizeMasterId = this.firstSizeMaster;
            // this.fetchAllSizeMaster();
            // this.setInitialState();
            this.isLoading = false;
            console.log('Save successful:', response);
          const resp = response as any; // cast to any and guard access
          const message = resp?.data?.msg ?? 'Unit saved successfully!';
          if (resp?.isValid) {
            alert(message);
          } else {
            alert('Save failed: ' + (message || ''));
          }
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
}