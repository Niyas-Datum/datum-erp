import { Component, inject, OnInit, signal } from "@angular/core";
import { BaseComponent } from '@org/architecture';
import { InventoryAppService } from "../../http/inventory-app.service";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ValidationService } from "@org/services";
import {  PWarehouseModel, WarehouseTypes } from "../model/pwarehouse.model";

@Component({
  selector: 'app-warehouse-Main',
  standalone: false,
  templateUrl: './warehouse-component.html',
  styles: [],
})
export class WarehouseComponent extends BaseComponent implements OnInit {
  private httpService = inject(InventoryAppService);
  private fb = inject(FormBuilder);

  // Form group
  warehouseForm: FormGroup = this.fb.group({});

  // Signals / state
  warehouseTypes = signal<WarehouseTypes[]>([]);
  currentWarehouseType = signal<WarehouseTypes | null>(null);
  selectedWarehouseId = 0;
  warehouseTypeValue: any = null;

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

  constructor() {
    super();
    this.commonInit();
    // initialize form structure
    this.FormInitialize();
    // keep controls disabled by default
    this.disableFormControls();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.fetchWarehouseType();
    console.log(this.currentPageInfo?.menuText);
  }

  //Location Type
  fetchWarehouseType(): void {
    this.httpService
      .fetch<any[]>(EndpointConstant.FILLWAREHOUSETYPES)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data;
          const types = Array.isArray(data)
            ? (Array.isArray(data[0]) ? data[0] : data)
            : [];
          // update signal
          this.warehouseTypes.set(types as WarehouseTypes[]);
          console.log('warehouseTypes:', this.warehouseTypes());
        },
        error: (error) => {
          console.error('An Error Occurred', error);
        },
      });
  }

  onWarehouseTypeSelected($event: any): void {
    const selectedId = $event?.value ?? null;
    const selected =
      selectedId !== null
        ? this.warehouseTypes().find((t) => Number(t.id) === Number(selectedId)) ?? null
        : null;
    this.currentWarehouseType.set(selected);
    this.warehouseForm.patchValue({
      locationTypeID: selectedId,
    });
  }

  override FormInitialize() {
    this.warehouseForm = new FormGroup({
      id: new FormControl({ value: 0, disabled: true }),
      code: new FormControl(
        { value: '', disabled: false },
        [Validators.required, ValidationService.stringValidator()]
      ),
      name: new FormControl(
        { value: '', disabled: false },
        [Validators.required, ValidationService.stringValidator()]
      ),
      locationTypeID: new FormControl(
        { value: '', disabled: false },
        [Validators.required, ValidationService.stringValidator()]
      ),
      address: new FormControl('', [Validators.required]),
      remarks: new FormControl('', [Validators.required]),
      active: new FormControl(0, [Validators.required]),
      isDefault: new FormControl(0, [Validators.required]),
      clearingPerCFT: new FormControl(0.0, [Validators.required]),
      groundRentPerCFT: new FormControl(0.0, [Validators.required]),
      lottingPerPiece: new FormControl(0.0, [Validators.required]),
      lorryHirePerCFT: new FormControl(0.0, [Validators.required]),
    });

    console.log('form init completed');
  }

  enableFormControls() {
    Object.keys(this.warehouseForm.controls).forEach((k) =>
      this.warehouseForm.get(k)?.enable()
    );
  }

  disableFormControls() {
    Object.keys(this.warehouseForm.controls).forEach((k) =>
      this.warehouseForm.get(k)?.disable()
    );
  }

  override async LeftGridInit() {
    this.pageheading = 'warehouse';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLWAREHOUSEMASTERS)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      this.leftGrid.leftGridData = res?.data ?? [];
      console.log('Fetched data:', this.leftGrid.leftGridData);

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'warehouse List',
          columns: [
            {
              field: 'name',
              datacol: 'name',
              headerText: 'Name',
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
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }

  override getDataById(data: PWarehouseModel) {
    console.log('data', data);
    this.selectedWarehouseId = data?.id ?? 0;
    this.fetchWarehouseById();
    this.EditModeSet();
  }

  //fillbyid
  fetchWarehouseById(): void {
    console.info('ID: ', this.selectedWarehouseId);
    this.httpService
      .fetch<any>(EndpointConstant.FILLWAREHOUSEMASTERBYID + this.selectedWarehouseId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.info('WarehouseMaster1 :', response?.data?.warehouseView);
          const warehouseMasters = response?.data?.warehouseView?.warehousebyid ?? null;
          const warehouseBranch = response?.data?.warehouseView?.warehousebranch?.[0] ?? null;
          console.info('WarehouseMaster :', warehouseMasters);
          if (warehouseMasters) {
            const warehouse = warehouseMasters;
            const warehousebranch = warehouseBranch;
            console.info('Warehouse :', warehousebranch);
            console.info(warehouse);
            this.warehouseForm.patchValue({
              id: warehouse.id,
              code: warehouse.code,
              name: warehouse.name,
              address: warehouse.address,
              remarks: warehouse.remarks,
              active: warehousebranch?.active ?? warehouse.active ?? 0,
              isDefault: warehousebranch?.isDefault ?? 0,
              locationTypeID: warehouse.locationTypeID,
              clearingPerCFT: warehouse.clearingPerCFT ?? '',
              groundRentPerCFT: warehouse.groundRentPerCFT ?? '',
              lottingPerPiece: warehouse.lottingPerPiece ?? '',
              lorryHirePerCFT: warehouse.lorryHirePerCFT ?? '',
            });
          }
          console.info('warehouseform :', this.warehouseForm.value);
        },
        error: (error) => {
          console.error('An Error Occurred while fetching warehouse master by ID:', error);
        },
      });
    this.disableFormControls();
  }

  override newbuttonClicked(): void {
    console.log('new operation started');
    this.warehouseForm.reset({
      id: 0,
      code: '',
      name: '',
      locationTypeID: '',
      address: '',
      remarks: '',
      active: 0,
      isDefault: 0,
      clearingPerCFT: 0.0,
      groundRentPerCFT: 0.0,
      lottingPerPiece: 0.0,
      lorryHirePerCFT: 0.0,
    });

    this.isEditMode.set(false);
    this.isNewMode.set(true);
    this.isNewBtnDisabled.set(false);
    this.isEditBtnDisabled.set(true);
    this.enableFormControls();
  }

  protected override onEditClick(): void {
    this.enableFormControls();
    this.EditModeSet();
  }

  private EditModeSet() {
    this.isUpdate.set(true);
    console.log('Edit button clicked');
    this.isEditMode.set(true);
    this.isNewMode.set(false);
    this.isInputDisabled = false;
    this.warehouseForm.enable();
    this.isSaveBtnDisabled.set(false);
    this.isEditBtnDisabled.set(true);
  }

  //save
  override SaveFormData() {
    console.info('Save');

    const v = this.warehouseForm.value;

    if (!v.code || v.code.trim() === '' || !v.name || v.name.trim() === '') {
      alert('Code and Name are required!');
      return;
    }

    const payload = this.buildPayload();
    console.info('Payloadsave:', payload);

    if (this.isUpdate()) {
      this.updateCallback(payload);
    } else if (this.isNewMode()) {
      this.saveNewWarehouse(payload);
    }

    this.isUpdate.set(false);
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    this.toggleForm(false);

    // refresh grid
    this.LeftGridInit();
  }

  private buildPayload() {
    const v = this.warehouseForm.value;
    console.info('V:', v);
    const payload = {
      id: Number(v.id ?? 0),
      code: (v.code ?? '').toString().trim(),
      name: (v.name ?? '').toString().trim(),
      address: (v.address ?? '').toString().trim(),
      remarks: (v.remarks ?? '').toString().trim(),
      active: Number(v.active ?? 0),
      isDefault: Number(v.isDefault ?? 0),
      type: {
        id: Number(v.locationTypeID ?? 0),
        value: 'string',
      },
      clearingPerCFT: Number(v.clearingPerCFT ?? 0.0),
      groundRentPerCFT: Number(v.groundRentPerCFT ?? 0.0),
      lottingPerPiece: Number(v.lottingPerPiece ?? 0.0),
      lorryHirePerCFT: Number(v.lorryHirePerCFT ?? 0.0),
    };
    console.info('Payload:', payload);
    return payload;
  }

  private updateCallback(payLoad: any) {
    console.info('Update:', payLoad);
    const endpoint = `${EndpointConstant.UPDATEWAREHOUEMASTER}`;
    this.httpService
      .patch(endpoint, payLoad)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          console.log('Save successful:', response);
          const resp = response as any;
          const message = resp?.data?.msg ?? 'Warehouse Update successfully!';
          alert(resp?.isValid ? message : 'Save failed: ' + (message || ''));
          this.newbuttonClicked();
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
        },
        error: (err) => {
          alert('Error updating Warehouse ');
        },
      });
  }

  private saveNewWarehouse(payLoad: any): void {
    console.info('save:', payLoad);
    const endpoint = `${EndpointConstant.SAVEWAREHOUSEMASTER}`;
    this.httpService
      .post(endpoint, payLoad)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (res) => {
          console.log('Save successful:', res);
          const resp = res as any;
          const message = resp?.data?.msg ?? 'Warehouse saved successfully!';
          alert(resp?.isValid ? message : 'Save failed: ' + (message || ''));
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

  protected override DeleteData(data: PWarehouseModel): void {
    if (!confirm('Delete this Warehouse?')) return;
    console.info('Delete : ', this.selectedWarehouseId);
    this.httpService
      .delete(EndpointConstant.DELETELOCATION + this.selectedWarehouseId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (res) => {
          console.log('Delete successful:', res);
          const resp = res as any;
          const message = resp?.data?.msg ?? 'Warehouse Delete successfully!';
          alert(resp?.isValid ? message : 'Save failed: ' + (message || ''));
          this.newbuttonClicked();
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
        },
        error: (err) => {
          console.error('Error deleting warehouse', err);
          alert('Error deleting warehouse');
        },
      });
  }

  toggleForm(editing: boolean) {
    if (editing) {
      this.warehouseForm.enable();
    } else {
      this.warehouseForm.disable();
    }
    this.isInputDisabled = !editing;
  }
}
