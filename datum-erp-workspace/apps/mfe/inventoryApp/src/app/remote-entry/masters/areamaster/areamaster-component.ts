import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { BaseComponent } from '@org/architecture';
import { InventoryAppService } from "../../http/inventory-app.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AREAGROUPPOPUP, PAreamasterModel } from "../model/pareamaster.model";
import { BaseService } from "@org/services";

@Component({
  selector: 'app-areamaster-Main',
  standalone: false,
  templateUrl: './areamaster-component.html',
  styles: [],
})
export class AreaMasterComponent extends BaseComponent implements OnInit {

  private httpService = inject(InventoryAppService);
  private baseService = inject(BaseService);
  areaMasterForm = this.formUtil.thisForm;

  selectedAreaMasterUnit!: string;
  selectedAreaMasterId = 0;
  firstAreaMaster = 0;
  currentAreaMaster = signal<PAreamasterModel>({} as PAreamasterModel);
  areaGroupData = signal<AREAGROUPPOPUP[]>([]);
  selectedAreaGroupOption = '';
  selectedGroupId = 0; 
  isLoading = false;
  isActive: unknown;
  isDelete = true;
  isUpdate: boolean = false;

  data: AREAGROUPPOPUP[] = [];
  
  public fields = { text: 'value', value: 'id' };

  public columns = [
  { field: 'id', header: 'ID', width: 80 },
  { field: 'code', header: 'Code', width: 120 },
  { field: 'value', header: 'Group Name', width: 150 }
];

  public gridSettings = { rowHeight: 40, enableAltRow: true, gridLines: 'Both' };

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    console.log(this.currentPageInfo?.menuText);
    this.fetchAreaGroup();
    this.areaMasterForm.disable();
  }

 override FormInitialize() {
    this.areaMasterForm = new FormGroup({
      code: new FormControl({ value: '', disabled: false },Validators.required),
      name: new FormControl({ value: '', disabled: false },Validators.required),
      description: new FormControl({ value: '', disabled: false }),
      group: new FormControl({ value: '', disabled: false }),
      isgroup: new FormControl({ value: true, disabled: false }),
      active: new FormControl({ value: true, disabled: false })
    });
    console.log('form init started');
    }

  resetForm(): void {
    this.areaMasterForm.reset();
    this.isActive = false;
  }

onAreaGroupSelected($event: any): void {
  const selectedId =$event?.itemData?.id ?? $event?.value ?? null;    

 if (selectedId) {
   this.selectedGroupId = Number(selectedId);
  console.log('Area Group :', this.areaGroupData());
          const selectedArea = this.areaGroupData().find((item) => item.id === Number(selectedId));
          console.log('Selected Area from data:', selectedArea);
          const selectedValue = (selectedArea?.value ?? '').toString().trim();
          if (selectedValue !== '') {
            this.selectedAreaGroupOption = selectedValue;
            this.areaMasterForm.patchValue({
              group: selectedId,
            });
            console.log('Account selected:', this.selectedAreaGroupOption, 'ID:', selectedId);
          }
        } else {
          this.selectedAreaGroupOption = "";
          this.areaMasterForm.patchValue({
            group: null,
          });
        }

  // console.log('Selected Group ID:', this.selectedGroupId);
  // console.log('Selected Group Value:', this.selectedAreaGroupOption);
}

   enableFormControls(){
    this.areaMasterForm.get('code')?.enable();
    this.areaMasterForm.get('name')?.enable();
    this.areaMasterForm.get('description')?.enable();
    this.areaMasterForm.get('group')?.enable();
    this.areaMasterForm.get('isgroup')?.enable();
    this.areaMasterForm.get('active')?.enable();
  }

  disableFormControls(){
    this.areaMasterForm.get('code')?.disable();
    this.areaMasterForm.get('name')?.disable();
    this.areaMasterForm.get('description')?.disable();
    this.areaMasterForm.get('group')?.disable();
    this.areaMasterForm.get('isgroup')?.disable();
    this.areaMasterForm.get('active')?.disable();
  }

  private fetchAreaGroup(): void {
     this.httpService
        .fetch(EndpointConstant.FILLAREAGROUPPOPUP)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
        next: (response) => {
        this.data = Array.isArray(response?.data) ? response.data : [];
        this.areaGroupData.set(this.data);
        console.log("Data in popup:",this.data);
      },
      error: (error) => {
        console.error('An Error Occurred', error);
      },
    });
  }
  // onGroupChange(data: any): void {
  //   console.log("Group changed:", data);
  //   console.log('Selected Group ID:', data.itemData.value);
  //   this.selectedGroupId = data.itemData.id;
    
  // }

   override newbuttonClicked(): void {
    console.log('New button clicked');
    this.areaMasterForm.enable();
     this.areaMasterForm.reset();
  }

  override onEditClick(){
    console.log('we have entered in to edit mode ')
    this.isUpdate = true;
    this.areaMasterForm.enable();
  }

  override SaveFormData() {
   // console.log('data scving');
    console.log(this.areaMasterForm.controls);
     const area=this.areaMasterForm.value;
    if(!area.code||area.code.trim()==='' || !area.name||area.name.trim()==='')
    {
        alert("name and code is required");
        return;
    }
    this.saveAreaMaster();
  }

   private saveAreaMaster() {
    if (this.areaMasterForm.invalid) {
      for (const field of Object.keys(this.areaMasterForm.controls)) {
        const control: any = this.areaMasterForm.get(field);
        if (control.invalid) {
          this.toast.error('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }

    const payload = {
      "code": this.areaMasterForm.value.code,
      "name": this.areaMasterForm.value.name,
      "description": this.areaMasterForm.value.description,
      "group": this.selectedGroupId,
      "isGroup": this.areaMasterForm.value.isgroup ? this.areaMasterForm.value.isgroup : false,
      "active": this.areaMasterForm.value.active ? this.areaMasterForm.value.active : false,
    };
    if(this.isUpdate){
      console.log("we are entered into update block");
      this.updateCallback(payload);
    } else{
      this.createCallback(payload);
    }
  }

  updateCallback(payload:any){
    this.httpService.patch(EndpointConstant.UPDATEAREAMASTER+this.selectedAreaMasterId,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          this.isLoading = false;
          //this.baseService.showCustomDialogue("Successfully saved Area master"); 
          this.selectedAreaMasterId = this.firstAreaMaster;
          this.fetchAreaMasterById();
          this.disableFormControls();
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
        },
        error: (error) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

  createCallback(payload:any){
    this.httpService.post(EndpointConstant.SAVEAREAMASTER,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          this.isLoading = false;
          //this.baseService.showCustomDialogue('Successfully saved Area master'); 
          this.selectedAreaMasterId = this.firstAreaMaster;
          this.disableFormControls();
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
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving Area master', error);
          this.baseService.showCustomDialogue('Error saving Area master');
        },
        complete:()=>{
          this.LeftGridInit();
        }
      });
  }

  override async LeftGridInit() {
    this.pageheading = 'AreaMaster';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLAREAMASTER)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      // handle data here after await completes
      this.leftGrid.leftGridData = res.data;
      console.log('Fetched data:', this.leftGrid.leftGridData);

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'AreaMaster List',
          columns: [
            {
              field: 'code',
              datacol: 'code',
              headerText: 'Code',
              textAlign: 'Left',
            },
            {
              field: 'name',
              datacol: 'name',
              headerText: 'Name',
              textAlign: 'Left',
            },
            {
              field: 'isGroup',
              datacol: 'isGroup',
              headerText: 'IsGroup',
              textAlign: 'Left',
            },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }

override getDataById(data: PAreamasterModel) {
    console.log('data', data);
     this.selectedAreaMasterId = data.id;
    this.fetchAreaMasterById();
  }

 private fetchAreaMasterById(): void {  
    this.httpService
    .fetch(EndpointConstant.FILLAREAMASTERBYID+this.selectedAreaMasterId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        console.log("response",response)
       const area = (response?.data as any)?.[0] as PAreamasterModel;
       if (area) {
         this.currentAreaMaster.set(area);
         console.log(response.data);
        this.areaMasterForm.patchValue({
  code: area.code,
  name: area.name,
  description: area.note,
  group: area.parentId,     // <-- correct
  isgroup: area.isGroup,
  active: area.active,
},
{ emitEvent: false });

const areaId=Number(area.parentId);

         console.log("selected area ",this.areaGroupData());
         const selectedArea = this.areaGroupData().find((item) => item.id === areaId);
          console.log('Selected Area from data:', selectedArea);
          const selectedValue = (selectedArea?.value ?? '').toString().trim();
         this.selectedAreaGroupOption = selectedValue;
         this.selectedGroupId = area.parentId;
         //console.log('Selected Group ID:', this.selectedGroupId);
//  console.log('Selected Group Value:', this.selectedAreaGroupOption);
       
       } else {
         console.warn('No area data found for id', this.selectedAreaMasterId);
       }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('An Error Occured', error);
      },
    });
    this.disableFormControls();
  }


  override DeleteData(data: PAreamasterModel) {
    console.log('deleted');
    this.areaMasterDelete();
  }

private areaMasterDelete(){
    if(!this.isDelete){
      this.baseService.showCustomDialogue('Permission Denied!');
      return false;
    }
    if(confirm("Are you sure you want to delete this details?")) {
      this.isLoading = true;
      this.httpService.fetch(EndpointConstant.DELETEAREAMASTER+this.selectedAreaMasterId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue(response.data as any);
          this.selectedAreaMasterId = this.firstAreaMaster;
          this.disableFormControls();
        },
        error: (error) => {
          this.isLoading = false;
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
