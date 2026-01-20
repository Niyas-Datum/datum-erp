import { Component, inject, OnInit, signal } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { InventoryAppService } from "../../http/inventory-app.service";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup } from "@angular/forms";
import { ValidationService } from "@org/services";
import { LocationType } from "../model/pwarehouse.model";

@Component({
  selector: 'app-locationType-Main',
  standalone: false,
  templateUrl: './locationType-component.html',
  styles: [],
})
export class LocationTypeComponent extends BaseComponent implements OnInit{
 private httpService = inject(InventoryAppService);
  locationTypeForm = this.formUtil.thisForm;
  submitted=false;
  currentLocationType = signal<LocationType | null>(null);

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
    override FormInitialize(): void {
      this.locationTypeForm = new FormGroup({
      id: new FormControl({ value: 0, disabled: true }),
      locationType: new FormControl('', [ValidationService.required(), ValidationService.stringValidator()]),
      });
    }
    disbaleFormControls(){
       this.locationTypeForm.get('id')?.disable();
        this.locationTypeForm.get('locationType')?.disable();
    }
     enableFormControls(){
       this.locationTypeForm.get('id')?.enable();
        this.locationTypeForm.get('locationType')?.enable();
    }
   override SaveFormData() {
    this.submitted = true;
     const location=this.locationTypeForm.value;
    if(!location.locationType||location.locationType.trim()==='' )
    {
        alert("locationType is required");
        return;
    }
    console.info("SaveButton",this.isEditMode())
  //  if (this.locationTypeForm.invalid) {
  //             const invalidField = Object.keys(this.locationTypeForm.controls).find(
  //               (key) => this.locationTypeForm.get(key)?.invalid
  //             );
  //             if (invalidField) {
  //               alert(`Invalid field: ${invalidField}`);
  //             }
  //             return;
  //           }
            
      console.log('data scving');
      console.log(this.locationTypeForm.controls);
    const payload = this.buildPayload();

    // if (this.isEditMode() ) {
    //   this.updateCallback(payload);
    // } else if (this.isNewMode()) {
      this.saveNewLocationType(payload);
    // }
   this.isUpdate.set(false);
                this.isNewMode.set(false);
                this.isEditMode.set(false);
                this.toggleForm(false);
        
                this.LeftGridInit();
  }

  private buildPayload() {
    const v = this.locationTypeForm.value;
    return {
      id: (v.id ?? 0).toString().trim(),
      locationType: (v.locationType ?? '').toString().trim(),
    };
  }
  // private updateCallback(payLoad: any) {
  //   // const id = this.currentLocationType()?.id;
  //   // if (!id) return;
  //   console.info(payLoad)
  //     console.info("update PageID: ",this.currentPageInfo?.id)
  //   const endpoint = `${EndpointConstant.SAVELOCATION}${this.currentPageInfo?.id}`;
  //   this.httpService
  //     .patch(endpoint, payLoad)
  //     .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
  //     .subscribe({
  //       next: async (response) => {
  //       console.log('Save successful:', response);
  //         const resp = response as any; // cast to any and guard access
  //         const message = resp?.data?.msg ?? 'LocationType saved successfully!';
  //         if (resp?.isValid) {
  //           alert(message);
  //         } else {
  //           alert('Save failed: ' + (message || ''));
  //         }
  //          await this.LeftGridInit();
  //           this.serviceBase.dataSharingService.setData({
  //             columns: this.leftGrid.leftGridColumns,
  //             data: this.leftGrid.leftGridData,
  //             pageheading: this.pageheading,
  //           });
  //       },
  //       error: (err) => {
  //         console.error('Error updating location type', err);
  //         alert('Error updating location type');
  //       },
  //     });
  // }
    private saveNewLocationType(payLoad: any): void {
      console.info("Save PageID: ",this.currentPageInfo?.id)
      const endpoint = `${EndpointConstant.SAVELOCATION}${this.currentPageInfo?.id}`;
    this.httpService
      .post(endpoint, payLoad)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
         console.log('Save successful:', response);
          const resp = response as any; // cast to any and guard access
          const message = resp?.data?.msg ?? 'LocationType saved successfully!';
          if (resp?.isValid) {
            alert(message);
          } else {
            alert('Save failed: ' + (message || ''));
          }
          this.newbuttonClicked();
           await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
        },
        error: (err) => console.error('Error saving location type', err),
      });

  }
  toggleForm(editing: boolean) {
            if (editing) {
              this.locationTypeForm.enable();
            } else {
              this.locationTypeForm.disable();
            }
            this.isInputDisabled = !editing;
          }
    override async LeftGridInit() {
      this.pageheading = 'LocationType';
      try {
  
        // Developer permision allowed
        const res = await firstValueFrom(
          this.httpService
            .fetch<any[]>(EndpointConstant.FILLLOCATIONMASTER)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        );
  // not alolowed 
        // handle data here after await completes
        this.leftGrid.leftGridData = res.data;
        console.log('Fetched data:', this.leftGrid.leftGridData);
  
        this.leftGrid.leftGridColumns = [
          {
            headerText: 'LocationType List',
            columns: [
              {
                field: 'ID',
                datacol: 'ID',
                headerText: 'ID',
                textAlign: 'Left',
                 width: 50,
              },
              {
                field: 'locationType',
                datacol: 'locationType',
                headerText: 'LocationType',
                textAlign: 'Left',
                 width: 200,
              },
            ],
          },
        ];
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    }
     override newbuttonClicked(): void {
      console.log('new operation started');
      this.locationTypeForm.reset();
      this.isEditMode.set(false);
      this.isNewMode.set(true);
      this.isNewBtnDisabled.set(false);
      this.isEditBtnDisabled.set(true);
      this.enableFormControls();
    }
    protected override onEditClick(): void {      
   this.EditModeSet();    
   this.enableFormControls();
    }

    private EditModeSet()
    {
      this.isUpdate.set(true);
        console.log('Edit button clicked');
        // Enable edit mode
        this.isEditMode.set(true);
        this.isNewMode.set(false);
        
        // Enable form inputs for editing
        this.isInputDisabled = false;
        this.locationTypeForm.enable();
        
        // Enable save button and disable edit button
        this.isSaveBtnDisabled.set(false);
        this.isEditBtnDisabled.set(true);
    }
     private patchFormFromCurrent(): void {
    const cur = this.currentLocationType();
    if (!cur) return;
    this.locationTypeForm.patchValue({
      id: cur.ID ?? '',
      locationType: cur.LocationType ?? '',
    }, { emitEvent: false });
    this.disbaleFormControls();
  }
  protected override getDataById(data: LocationType): void {
    this.currentLocationType.set(data);
    console.info("current:",this.currentLocationType)
    this.patchFormFromCurrent();
  }
  protected override DeleteData(data: any): void {
        if (this.isUpdate() || !this.currentLocationType()) return;
    if (!confirm('Delete this location type?')) return;

    this.httpService
      .delete(EndpointConstant.DELETELOCATION + this.currentLocationType()?.ID)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res?.isValid && res?.httpCode !== 200) {
            console.error('Error deleting Location type:', res);
            alert('Error deleting location type');
            return;
          }
          alert('Location type deleted successfully');
          this.patchFormFromCurrent();
        },
        error: (err) => {
          console.error('Error deleting location type', err);
          alert('Error deleting location type');
        },
      });
      this.LeftGridInit();
  }
}