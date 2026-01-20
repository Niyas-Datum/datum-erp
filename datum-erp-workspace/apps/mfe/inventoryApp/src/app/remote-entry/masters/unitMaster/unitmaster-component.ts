import { Component, inject, OnInit, signal } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { InventoryAppService } from "../../http/inventory-app.service";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ValidationService } from "@org/services";
import { FormControl, FormGroup } from "@angular/forms";
import { BasicUnitDto, UnitMasterByIdDto, UnitMAstersDto } from "@org/models";

@Component({
  selector: 'app-unitmaster-Main',
  standalone: false,
  templateUrl: './unitmaster-component.html',
  styles: [],
})
export class UnitmasterComponent extends BaseComponent implements OnInit{
 private httpService = inject(InventoryAppService);
  unitMasterForm = this.formUtil.thisForm;
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
   allUnitMaster = signal<UnitMAstersDto[]>([]);
  BasicUnitList = signal<BasicUnitDto[]>([]);
  currentUnitMaster = signal<UnitMasterByIdDto[]>([])
  selectedBasicUnit = signal<BasicUnitDto | null>(null);
  selectedUnitMasterUnit!: string;
   submitted = false;
  constructor() {
    super();
    this.commonInit();
  }
  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.fetchBasicUnit();
    console.log(this.currentPageInfo?.menuText);
  }
  override FormInitialize(): void {
    this.unitMasterForm = new FormGroup({
      // unit: [""],
      // active: [true],
      // basicunit: [''],
      // factor: [null],
      // precision: [null],
      // iscomplex: [false],
      // description: [''],
      // arabicname: [''],
       unit: new FormControl('', [ValidationService.required(), ValidationService.stringValidator()]),
      active: new FormControl(true),
      basicunit: new FormControl('', [ValidationService.required()]),
      factor: new FormControl(null, [ValidationService.required()]),
      precision: new FormControl(null, [ValidationService.required(), ValidationService.integerValidator()]),
      iscomplex: new FormControl(false),
      description: new FormControl('', [ValidationService.required(), ValidationService.stringValidator()]),
      arabicname: new FormControl(''),
    });
  }
   override SaveFormData() {
      console.log('data scving');
      this.submitted = true;
        const formValues = this.unitMasterForm.value;
    if(!formValues.unit||formValues.unit.trim()==='' || !formValues.factor||formValues.factor.trim()==='')
    {
        alert("unit and factor is required");
        return;
    }
//  if (this.unitMasterForm.invalid) {
//               const invalidField = Object.keys(this.unitMasterForm.controls).find(
//                 (key) => this.unitMasterForm.get(key)?.invalid
//               );
//               if (invalidField) {
//                 alert(`Invalid field: ${invalidField}`);
//               }
//               return;
//             }

    
    const payload = {
      unit: formValues.unit,
      active: !!formValues.active,
      basicUnit: {
        id: 0,
        value: formValues.basicunit
      },
      factor: Number(formValues.factor),
      precision: Number(formValues.precision),
      isComplex: !!formValues.iscomplex,
      description: formValues.description,
      arabicName: formValues.arabicname
    };
    console.log("Save payload:" + JSON.stringify(payload, null, 2))

    if (this.isEditMode()) {
      this.updateUnit(payload);
    }
    else {
      this.saveUnit(payload);
    }
    this.isUpdate.set(false);
                this.isNewMode.set(false);
                this.isEditMode.set(false);
                this.toggleForm(false);
        
                this.LeftGridInit();

    }
    toggleForm(editing: boolean) {
            if (editing) {
              this.unitMasterForm.enable();
            } else {
              this.unitMasterForm.disable();
            }
            this.isInputDisabled = !editing;
          }
  
    override async LeftGridInit() {
      this.pageheading = 'UnitMaster';
      try {
  
        // Developer permision allowed
        const res = await firstValueFrom(
          this.httpService
            .fetch<any[]>(EndpointConstant.FILLALLUNITMASTER)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        );
  // not alolowed 
        // handle data here after await completes
        this.leftGrid.leftGridData = res.data;
        console.log('Fetched data:', this.leftGrid.leftGridData);
  
        this.leftGrid.leftGridColumns = [
          {
            headerText: 'UnitMaster List',
            columns: [
              {
                field: 'Unit',
                datacol: 'Unit',
                headerText: 'Unit',
                textAlign: 'Left',
              },
              {
                field: 'Description',
                datacol: 'Description',
                headerText: 'Description',
                textAlign: 'Left',
              },
            ],
          },
        ];
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    }
    fetchBasicUnit(): void {
    this.httpService
      .fetch<any[]>(EndpointConstant.FILLUNITMASTERUNITDROPDOWN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res || !res.data) {
            console.error('Invalid response received:', res);
            return;
          }

          let unitList: BasicUnitDto[] = [];

          if (Array.isArray(res.data)) {
            if (res.data.length && Array.isArray(res.data[0])) {
              unitList = res.data[0]; // nested array
            } else {
              unitList = res.data as BasicUnitDto[];
            }
          }

          this.BasicUnitList.set(unitList);
          console.log('BasicUnit loaded:', JSON.stringify(this.BasicUnitList, null, 2));
        },
        error: (err) => {
          console.error('Error fetching basic units:', err);
        },
      });
  }
  saveUnit(payload: any) {
    this.httpService
      .post(EndpointConstant.SAVEUNITMASTER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
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
        error: (err) => {
          console.error('Error while saving unit:', err);
          alert('An error occurred while saving.');
        }
      });
  }

  updateUnit(payload: any) {
    this.httpService
      .patch(EndpointConstant.UPDATEUNITMASTER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          console.log('Update successful:', response);
          const resp = response as any; // cast to any and guard access
          const message = resp?.data?.msg ?? 'Unit Update successfully!';
          if (resp?.isValid) {
            alert(message);
          } else {
            alert('Update failed: ' + (message || ''));
          }
           await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
        },
        error: (err) => {
          console.error('Error while saving unit:', err);
          alert('An error occurred while saving.');
        }
      });
  }
   override newbuttonClicked(): void {
      console.log('new operation started');
      this.isInputDisabled = !this.isInputDisabled;
    this.isEditBtnDisabled =signal(!this.isInputDisabled);
    this.isDeleteBtnDisabled = signal(!this.isInputDisabled);
    this.isSaveBtnDisabled = signal(this.isInputDisabled);
    this.unitMasterForm.reset();
    if(this.isInputDisabled == true){
      this.disbaleFormControls();
      //this.selectedUnitMasterUnit = this.fi;
      this.fetchUnitMasterById(this.selectedUnitMasterUnit);
    } else{
      this.selectedUnitMasterUnit = "";
      this.enableFormControls(); 
      this.unitMasterForm.patchValue({
        active:true,       
      });     
    }
    
    }
    protected override onEditClick(): void {
      this.isInputDisabled = !this.isInputDisabled;
        this.isDeleteBtnDisabled =signal(!this.isInputDisabled);
        this.isNewBtnDisabled = signal(!this.isInputDisabled);
        this.isSaveBtnDisabled = signal(this.isInputDisabled);
        this.isUpdate = signal(!this.isInputDisabled);
        if (!this.isInputDisabled) {
        this.enableFormControls();
        } else {
        this.disbaleFormControls();
        }
      
    }

    
    protected override DeleteData(data: any): void {
      if (this.isUpdate() || !this.currentUnitMaster()) return;
    if (!confirm('Delete this location type?')) return;

      this.httpService.delete(EndpointConstant.DELETEUNITMASTER + this.selectedUnitMasterUnit)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
           // this.isLoading = false;
            alert("Delete successfully");
          },
          error: (error) => {
            console.error(
              'An Error Occurred while deleting unit master ',
              error
            );
          },
        });
    }
    fetchUnitMasterById(unitName: string): void {
      //id1:Number;
    this.httpService
      .fetch<UnitMasterByIdDto[]>(
        EndpointConstant.FILLUNITMASTERBYNAME+unitName
        
      )
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const unitMasters = response?.data ?? [];
          if (unitMasters.length > 0) {
            const unit = unitMasters[0]; // pick the first record

            // Patch form values
            this.unitMasterForm.patchValue({
              unit: unit.unit,
              active: unit.active,
              basicunit: unit.basicUnit,
              factor: unit.factor,
              precision: unit.precision,
              iscomplex: unit.isComplex,
              description: unit.description,
              arabicname: unit.arabicName
            });
          }
        },
        error: (error) => {
          console.error(
            'An Error Occurred while fetching unit master by ID:',
            error
          );
        },
      });
      this.LeftGridInit();
      this.disbaleFormControls();
  }
  enableFormControls(){
    this.unitMasterForm.get('unit')?.enable();
    this.unitMasterForm.get('basicunit')?.enable();
    this.unitMasterForm.get('precision')?.enable();
    this.unitMasterForm.get('description')?.enable();
    this.unitMasterForm.get('arabicname')?.enable();
    this.unitMasterForm.get('active')?.enable();
    this.unitMasterForm.get('factor')?.enable();
    this.unitMasterForm.get('iscomplex')?.enable();
  }

  disbaleFormControls(){
    this.unitMasterForm.get('unit')?.disable();
    this.unitMasterForm.get('basicunit')?.disable();
    this.unitMasterForm.get('precision')?.disable();
    this.unitMasterForm.get('description')?.disable();
    this.unitMasterForm.get('arabicname')?.disable();
    this.unitMasterForm.get('active')?.disable();
    this.unitMasterForm.get('factor')?.disable();
    this.unitMasterForm.get('iscomplex')?.disable();
  }

protected override getDataById(data: UnitMasterByIdDto): void {
  this.fetchUnitMasterById(data.unit)
}
}