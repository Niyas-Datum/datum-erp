import { Component, inject, OnInit, signal } from "@angular/core";
import { GeneralAppService } from "../../http/general-app.service";
import { BaseComponent } from "@org/architecture";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import { PDesignationByIdModel, PDesignationModel } from "../model/pdesignation.component";
import { ApiResponseDto } from "@org/models";
import { BaseService, validCompanyName } from "@org/services";


@Component({
  //eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-settings-Main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './designation.component.html',
  //template: '<router-outlet></router-outlet>',
  styles: [],
})
export class DesignationComponent extends BaseComponent implements OnInit {
    
    isUpdate = signal(false);
    // STATE PROPERTIES
  isLoading = signal(false);
  isInputDisabled = true;
  isActive: unknown;
  currentid = signal(0);
  isDelete = true;
  firstDesignation!:number;
    // TOOLBAR STATE PROPERTIES
  isNewMode = signal(false);
  isEditMode = signal(false);
  isNewBtnDisabled = signal(false);
  isEditBtnDisabled = signal(false);
  isDeleteBtnDisabled = signal(false);
  isSaveBtnDisabled = signal(false);
  isPrintBtnDisabled = signal(false);
    private httpService = inject(GeneralAppService);
    private baseService = inject(BaseService);
    designationForm = this.formUtil.thisForm;
    constructor() {
      super();
      this.commonInit();
    }
  
    ngOnInit(): void {
      this.onInitBase();
      this.SetPageType(1);
      this.designationForm.disable();
    }
    
    override FormInitialize() {
      this.designationForm = new FormGroup({
        designationName: new FormControl({ value: '', disabled: false },[Validators.required, validCompanyName]),
      });
      console.log('form init started');
    }
   
    override SaveFormData() {
            if (this.designationForm.invalid) {
              const invalidField = Object.keys(this.designationForm.controls).find(
                (key) => this.designationForm.get(key)?.invalid
              );
              if (invalidField) {
                alert(`Invalid field: ${invalidField}`);
              }
              return;
            }
        
            const payload: any = { name: this.designationForm.value.designationName || '' };
            
            // Only include id if updating
            if (this.isUpdate()) {
              payload.id = this.currentid();
            }
            
            console.log('Saving payload:', payload);
            console.log('Is Update:', this.isUpdate());
        
            this.isLoading.set(true);
            const apiCall = this.isUpdate()
              ? this.httpService.patch<PDesignationModel>(
                  EndpointConstant.UPDATEDESIGNATION + this.currentid(),
                  payload
                )
              : this.httpService
              .post<PDesignationModel>(
                EndpointConstant.SAVEDESIGNATION, 
                payload
              )
        
            apiCall.pipe(takeUntilDestroyed(this.serviceBase.destroyRef)).subscribe({
              next: async (response: ApiResponseDto<PDesignationModel>) => {
                this.isLoading.set(false);
        
                const savedId = response?.data?.id ?? this.currentid();
        
                alert('Successfully saved designation');
                this.currentid.set(savedId);
               // this.lastSelectedId.set(savedId);
        
                this.isUpdate.set(false);
                this.isNewMode.set(false);
                this.isEditMode.set(false);
                this.toggleForm(false);
        
                // Refresh the left grid and update the data sharing service
                await this.LeftGridInit();
                this.serviceBase.dataSharingService.setData({
                  columns: this.leftGrid.leftGridColumns,
                  data: this.leftGrid.leftGridData,
                  pageheading: this.pageheading,
                });
              },
              error: () => {
                this.isLoading.set(false);
                alert('Please try again');
              },
            });
          }
        
        // 
        
        toggleForm(editing: boolean) {
            if (editing) {
              this.designationForm.enable();
            } else {
              this.designationForm.disable();
            }
            this.isInputDisabled = !editing;
          }
    onSaveClick() {
      this.SaveFormData();
    }
    override newbuttonClicked(){
       this.designationForm.reset();
      this.designationForm.enable();
    }
    override onEditClick() {
      if(this.isEditMode()) {
        const confirmed = confirm('Do you want to cancel the edit mode?');
        if (!confirmed) {
            console.log('Cancel edit cancelled by user');
            return;
        }
        
        this.isEditMode.set(false);
        this.isUpdate.set(false);
        this.isInputDisabled = true;
        this.designationForm.enable();
      }
        // Ask for confirmation before entering edit mode
        const confirmed = confirm('Do you want to edit?');
        if (!confirmed) {
            console.log('Edit cancelled by user');
            return;
        }
        
        this.isUpdate.set(true);
        console.log('Edit button clicked');
        // Enable edit mode
        this.isEditMode.set(true);
        this.isNewMode.set(false);
        
        // Enable form inputs for editing
        this.isInputDisabled = false;
        this.designationForm.disable();
        
        // Enable save button and disable edit button
        this.isSaveBtnDisabled.set(false);
        this.isEditBtnDisabled.set(true);
    }
  
  
    override async LeftGridInit() {
      this.pageheading = 'Designation';
      try {
        const res = await firstValueFrom(
          this.httpService
            .fetch<any[]>(EndpointConstant.FILLALLDESIGNATIONS)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef)));
  
        // handle data here after await completes
        this.leftGrid.leftGridData = res.data;
        console.log('Fetched data:', this.leftGrid.leftGridData);
  
        this.leftGrid.leftGridColumns = [
          {
            headerText: 'Designation List',
            columns: [
              {
                field: 'Name',
                datacol: 'Name',
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
  
    override getDataById(data: PDesignationModel) {
      this.designationForm.disable();
      console.log('data', data);
      console.log('DesignationComponent: Loading designation by ID:', data.id);
      this.httpService.fetch<PDesignationByIdModel>(EndpointConstant.FILLALLDESIGNATIONSBYID + data.id)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (res) => {
            console.log('Designation loaded:', res);
            const designation = Array.isArray(res.data) && res.data.length ? res.data[0] : res.data;
            console.log('designation', designation);
           this.currentid.set(designation.id);
            console.log('designation.Name', designation.name);
            this.designationForm.patchValue({
              designationName: designation.name,
            });
            console.log('Form patched with:', designation.name);
            console.log('Form value after patch:', this.designationForm.value);
          },
        });
    }
    
  
    override DeleteData(data: PDesignationModel) {
       if(!this.isDelete){
      this.baseService.showCustomDialogue('Permission Denied!');
      return false;
    }
    if(confirm("Are you sure you want to delete this details?")) {
      this.httpService.delete(EndpointConstant.DELETEDESIGNATION+this.currentid)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.baseService.showCustomDialogue(response.data as any);          
          this.currentid.set(this.firstDesignation);
          this.LeftGridInit();
        },
        error: (error) => {
          this.baseService.showCustomDialogue('Please try again');
        },
      });
    }
    return true;
    }
  
  
}
  

