import { Component, inject, OnInit, signal } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { InventoryAppService } from "../../http/inventory-app.service";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { decimalOnly, integerOnly, ValidationService } from "@org/services";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BasicUnitDto, UnitMasterByIdDto, UnitMAstersDto } from "@org/models";

@Component({
  selector: 'app-unitmaster-Main',
  standalone: false,
  templateUrl: './unitmaster-component.html',
  styles: [],
})
export class UnitmasterComponent extends BaseComponent implements OnInit {
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
  }
  override FormInitialize(): void {
    this.unitMasterForm = new FormGroup({
      unit: new FormControl({ value: '', disabled: false }, Validators.required),//new FormControl('', [ValidationService.required(), ValidationService.stringValidator()]),
      active: new FormControl(true),
      basicunit: new FormControl('', [ValidationService.required()]),
      factor: new FormControl({ value: null, disabled: false },[Validators.required, decimalOnly] ),
      //new FormControl({ value: '', disabled: this.isInputDisabled }, [integerOnly]),
      precision: new FormControl({ value: null, disabled: false },[Validators.required, integerOnly] ),
      // precision:new FormControl({ value: '', disabled: this.isInputDisabled }, [integerOnly]),
      iscomplex: new FormControl(false),
      description: new FormControl('', [ValidationService.required()]),
      arabicname: new FormControl(''),
    });
  }
  isInvalid(controlName: string): boolean {
    const control = this.unitMasterForm.get(controlName);
    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  override SaveFormData() {
    this.submitted = true;
     if (this.unitMasterForm.invalid) {
      this.unitMasterForm.markAllAsTouched();      
    }
    const formValues = this.unitMasterForm.value;
    if (!formValues.unit || formValues.unit.trim() === '') {
      this.toast.error("Please enter the Unit");
      return;
    }
    if (!formValues.factor || formValues.factor === '') {
      this.toast.error("Please enter Factor");
      return;
    }
    if (!formValues.precision) {
      this.toast.error("Please enter Precision");
      return;
    }
    if (!formValues.description) {
      this.toast.error("Please enter Description");
      return;
    }

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
      this.toast.error('Error fetching companies:'+ err);
    }
  }
  fetchBasicUnit(): void {
    this.httpService
      .fetch<any[]>(EndpointConstant.FILLUNITMASTERUNITDROPDOWN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res || !res.data) {
            this.toast.error('Invalid response received:'+ res);
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
        },
        error: (err) => {
          this.toast.error('Error fetching basic units:', err);
        },
      });
  }
  saveUnit(payload: any) {
    this.httpService
      .post(EndpointConstant.SAVEUNITMASTER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
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
          this.toast.error('Error while saving unit:', err);
          
        }
      });
  }

  updateUnit(payload: any) {
    this.httpService
      .patch(EndpointConstant.UPDATEUNITMASTER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          const resp = response as any; // cast to any and guard access
          const message = resp?.data?.msg ?? 'Unit Update successfully!';
          if (resp?.isValid) {
            this.toast.success(message);
          } else {
            this.toast.error('Update failed: ' + (message || ''));
          }
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
        },
        error: (err) => {
          this.toast.error('Error while saving unit:'+err);
          
        }
      });
  }
  override newbuttonClicked(): void {
    this.isInputDisabled = !this.isInputDisabled;
    this.isEditBtnDisabled = signal(!this.isInputDisabled);
    this.isDeleteBtnDisabled = signal(!this.isInputDisabled);
    this.isSaveBtnDisabled = signal(this.isInputDisabled);
    this.unitMasterForm.reset();
    if (this.isInputDisabled == true) {
      this.disbaleFormControls();
      //this.selectedUnitMasterUnit = this.fi;
      this.fetchUnitMasterById(this.selectedUnitMasterUnit);
    } else {
      this.selectedUnitMasterUnit = "";
      this.enableFormControls();
      this.unitMasterForm.patchValue({
        active: true,
      });
    }

  }
  protected override onEditClick(): void {
    this.isEditMode.set(true)
    this.isInputDisabled = !this.isInputDisabled;
    this.isDeleteBtnDisabled = signal(!this.isInputDisabled);
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
    if (!confirm('Delete this Unit?')) return;

    this.httpService.delete(EndpointConstant.DELETEUNITMASTER + this.selectedUnitMasterUnit)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
         if(response.httpCode===200){
          this.toast.success("Delete successfully");
         }
         if(response.httpCode===500){
          this.toast.error("This unit is used in another pages. So cannot be deleted!!")
         }
          
        },
        error: (error) => {
         this.toast.error(
            'An Error Occurred while deleting unit master ',
            error
          );
        },
      });
  }
  fetchUnitMasterById(unitName: string): void {
this.selectedUnitMasterUnit=unitName;
    this.httpService
      .fetch<UnitMasterByIdDto[]>(
        EndpointConstant.FILLUNITMASTERBYNAME + unitName

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
          this.toast.error(
            'An Error Occurred while fetching unit master by ID:',
            error
          );
        },
      });
    this.LeftGridInit();
    this.disbaleFormControls();
  }
  enableFormControls() {
    this.unitMasterForm.get('unit')?.enable();
    this.unitMasterForm.get('basicunit')?.enable();
    this.unitMasterForm.get('precision')?.enable();
    this.unitMasterForm.get('description')?.enable();
    this.unitMasterForm.get('arabicname')?.enable();
    this.unitMasterForm.get('active')?.enable();
    this.unitMasterForm.get('factor')?.enable();
    this.unitMasterForm.get('iscomplex')?.enable();
  }

  disbaleFormControls() {
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