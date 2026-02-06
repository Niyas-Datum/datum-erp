import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, Subject } from 'rxjs';

import { EditSettingsModel, GridComponent } from '@syncfusion/ej2-angular-grids';
import { SelectedEventArgs, SuccessEventArgs } from '@syncfusion/ej2-angular-inputs';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';

import { BaseComponent } from '@org/architecture';
import { EndpointConstant } from '@org/constants';
import { BaseService, validEmail, validPhoneNumber } from '@org/services';

import { GeneralAppService } from '../../http/general-app.service';
import { Branches } from '../../company/model/pbranch.model';
import { DepartmentPopup } from '../../company/model/pDepartment.model';
import { PDesignationModel } from '../../company/model/pdesignation.component';
import {
  AccountPopup,
  BranchDetails,
  EmployeeType,
  PettyCash,
  PUserModel,
  Supervisor,
  UserData,
  Warehouse,
} from '../model/puser.model';

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user-component.html',
  styles: [],
})
export class UserComponent extends BaseComponent implements OnInit {
  // ----- ViewChild & injects -----
  @ViewChild('branchGrid', { static: false }) branchGrid!: GridComponent;
  @ViewChild('userRoleDialog') userRoleDialog!: DialogComponent;

  private httpService = inject(GeneralAppService);
  private baseService = inject(BaseService);
  private destroy$ = new Subject<void>();

  // ----- Signals & mode state -----
  isLoading = signal(false);
  isNewMode = signal(false);
  isEditMode = signal(false);
  selectedBranch = signal<null>(null);

  // ----- Form & grid edit -----
  userForm = this.formUtil.thisForm;
  public editForm!: FormGroup;
  editSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: false, // no extra "add" row; rows added only via "+" button
    allowDeleting: true,
    mode: 'Normal' as any,
  };

  // ----- Data arrays -----
  allUsers = [] as Array<PUserModel>;
  allDesignations = [] as Array<PDesignationModel>;
  allAccounts = [] as Array<AccountPopup>;
  departmentData = [] as Array<DepartmentPopup>;
  branchData = [] as Array<Branches>;
  supervisorData = [] as Array<Supervisor>;
  pettycashData = [] as Array<PettyCash>;
  warehouseData = [] as Array<Warehouse>;

  // ----- Dropdown options -----
  accountOptions: any = [];
  departmentOptions: any = [];
  branchOptions: any = [];
  supervisorOptions: any = [];

  // ----- Branch details & user rights -----
  allBranchDetails: any[] = [];
  allUserRights: any[] = [];
  currentBranchTableIndex: number | null = null;
  currentBranchDetailsIndex: number = 0;

  // ----- User & selection state -----
  currentUser = {} as UserData;
  selectedUserId!: number;
  firstUser!: number;
  currentMaRoleID = 0;
  selectedAccountId: number = 0;
  selectedAccountName: string = '';

  // ----- UI & permission flags -----
  showChild = false;
  showPopup = true;
  showUserRolePopup = false;
  showImageContainer = true;
  isInputEnabled: boolean = false;
  isInputDisabled: boolean = false;
  isNewBtnDisabled: boolean = false;
  isEditBtnDisabled: boolean = false;
  isDeleteBtnDisabled: boolean = false;
  isSaveBtnDisabled: boolean = true;
  isUpdate: boolean = false;
  isDelete = true;
  isActive: number = 0;
  isLocationRestrictedUser: boolean = false;

  // ----- Dropdown config (return fields & keys) -----
  accountreturnField: string = 'name';
  accountKeys = ['Account Code', 'Account Name', 'ID'];
  departmentreturnField: string = 'name';
  departmentKeys = ['ID', 'Department Name'];
  branchreturnField: string = 'company';
  branchKeys = ['Company', 'ID'];
  supervisorreturnField: string = 'name';
  supervisorKeys = ['Name', 'ID'];

  // ----- Account popup columns -----
  public accountColumns = [
    { field: 'id', header: 'ID', width: 80 },
    { field: 'alias', header: 'Alias', width: 120 },
    { field: 'name', header: 'Name', width: 150 },
  ];

  // ----- Constants -----
  employeeType: EmployeeType[] = [
    { value: 1, name: 'Employee' },
    { value: 0, name: 'External Service Provider' },
  ];

  // ----- Image -----
  imageData: string | ArrayBuffer | null = null;
  /** True when user selected a new image; on update we only send imagePath when this is true to avoid re-sending huge base64. */
  userChangedImage = false;

  uploadSettings = {
    saveUrl: '',
    removeUrl: '',
  };

  constructor() {
    super();
    this.commonInit();
  }

  // ========== Lifecycle ==========
  async ngOnInit(): Promise<void> {
    this.onInitBase();
    this.SetPageType(1);
    console.log(this.currentPageInfo?.menuText);

    this.userForm.disable();

    try {
      await Promise.all([
        this.fetchAllDesignations(),
        this.fetchAccountDropdown(),
      ]);
      console.log('Primary dropdown data loaded.');
      this.loadSecondaryData();
    } catch (error) {
      console.error('Error loading primary data:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== Secondary data (background) ==========
  private loadSecondaryData(): void {
    setTimeout(() => {
      Promise.allSettled([
        this.fetchDepartmentDropdown(),
        this.fetchBranchDropdown(),
        this.fetchSupervisorDropdown(),
        this.fetchPettyCashList(),
        this.fetchWareHouseDropdown(),
      ])
        .then((results) => {
          console.log('Secondary dropdown data loaded (background).', results);
        })
        .catch((error) => {
          console.error('Background data load error:', error);
        });
    }, 300);
  }

  // ========== Form initialization ==========
  override FormInitialize(): void {
    this.userForm = new FormGroup({
      firstName: new FormControl({ value: '', disabled: false }, Validators.required),
      middleName: new FormControl({ value: '', disabled: false }),
      lastName: new FormControl({ value: '', disabled: false }, Validators.required),
      address: new FormControl({ value: '', disabled: false }, Validators.required),
      emailId: new FormControl({ value: '', disabled: false }, [Validators.required, validEmail]),
      residenceNumber: new FormControl({ value: '', disabled: false }),
      officeNumber: new FormControl({ value: '', disabled: false }, [Validators.required, validPhoneNumber]),
      mobileNumber: new FormControl({ value: '', disabled: false }, [Validators.required, validPhoneNumber]),
      designationId: new FormControl({ value: '', disabled: false }, Validators.required),
      active: new FormControl({ value: '', disabled: false }, Validators.required),
      employeeType: new FormControl({ value: '', disabled: false }, Validators.required),
      username: new FormControl({ value: '', disabled: false }, Validators.required),
      password: new FormControl({ value: '', disabled: false }, Validators.required),
      pettycash: new FormControl({ value: '', disabled: false }),
      warehouse: new FormControl({ value: '', disabled: false }),
      gmailId: new FormControl({ value: '', disabled: false }, [Validators.required, validEmail]),
      isLocationRestrictedUser: new FormControl({ value: '', disabled: false }),
      photoId: new FormControl({ value: '', disabled: false }),
      imagePath: new FormControl({ value: '', disabled: false }),
      employeeId: new FormControl({ value: '', disabled: false }),
      departmentId: new FormControl({ value: '', disabled: false }),
      createdOn: new FormControl({ value: '', disabled: false }),
      accountDropdown: new FormControl({ value: '', disabled: false }),
    });
    console.log('form init started');
  }

  override formValidationError(): void {
    console.log('form error found');
  }

  // ========== Data fetching (dropdowns) ==========
  async fetchAccountDropdown(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLACCOUNTPOPUP)
      );
      this.allAccounts = response?.data as any;
      this.accountOptions = this.allAccounts.map((item: any) => item.name);
      console.log('Accounts:', this.allAccounts);
    } catch (error) {
      console.error('An error occurred while fetching accounts:', error);
    }
  }

  async fetchAllDesignations(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLALLDESIGNATIONS)
      );
      this.allDesignations = response?.data as any;
      console.log('Designations:', this.allDesignations);
    } catch (error) {
      console.error('An error occurred while fetching designations:', error);
    }
  }

  async fetchDepartmentDropdown(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.DEPARTMENTPOPUP)
      );
      this.departmentData = response?.data as any;
      this.departmentOptions = this.departmentData.map((item: any) => item.name);
      console.log('Departments:', this.departmentData);
    } catch (error) {
      console.error('An error occurred while fetching departments:', error);
    }
  }

  async fetchBranchDropdown(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLALLBRANCH)
      );
      this.branchData = response?.data as any;
      this.branchOptions = this.branchData.map((item: any) => ({
        company: item.company,
        id: item.id,
      }));
      console.log('Branches:', this.branchData);
    } catch (error) {
      console.error('An error occurred while fetching branches:', error);
    }
  }

  async fetchSupervisorDropdown(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.USERDROPDOWN)
      );
      this.supervisorData = response?.data as any;
      this.supervisorOptions = this.supervisorData.map((item: any) => ({
        name: item.name,
        id: item.id,
      }));
      console.log('Supervisors:', this.supervisorData);
    } catch (error) {
      console.error('An error occurred while fetching supervisors:', error);
    }
  }

  async fetchPettyCashList(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLPETTYCASH)
      );
      this.pettycashData = response?.data as any;
      console.log('Petty cash list:', this.pettycashData);
    } catch (error) {
      console.error('An error occurred while fetching petty cash list:', error);
    }
  }

  async fetchWareHouseDropdown(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLWAREHOUSEDROPDOWN)
      );
      this.warehouseData = response?.data as any;
      console.log('Warehouse list:', this.warehouseData);
    } catch (error) {
      console.error('An error occurred while fetching warehouse list:', error);
    }
  }

  // ========== Account selection ==========
  onAccountSelected(event: any): void {
    const selectedValue =
      typeof event === 'string'
        ? event
        : event?.value ?? event?.itemData?.id ?? event?.itemData?.name;

    const selectedAccount =
      this.allAccounts?.find((a: any) => a.id === selectedValue) ??
      this.allAccounts?.find((a: any) => a.name === selectedValue);

    this.selectedAccountId = selectedAccount?.id ?? 0;
    this.selectedAccountName =
      selectedAccount?.name ?? (typeof selectedValue === 'string' ? selectedValue : '');

    if (this.userForm?.get('accountDropdown')) {
      this.userForm.get('accountDropdown')?.setValue(this.selectedAccountId, { emitEvent: false });
    }
  }

  // ========== Branch grid: row & validation ==========
  addRow(clicknew = false): boolean {
    this.currentMaRoleID = 0;

    if (this.checkFieldEmpty('departmentID') && clicknew) {
      this.baseService.showCustomDialogue('Please fill department');
      return false;
    }
    if (this.checkFieldEmpty('branchName') && clicknew) {
      this.baseService.showCustomDialogue('Please fill branch name');
      return false;
    }
    if (this.checkFieldEmpty('supervisorID') && clicknew) {
      this.baseService.showCustomDialogue('Please fill supervisor');
      return false;
    }

    this.allBranchDetails.push({
      id: 0,
      employeeID: 0,
      branchID: 0,
      branchName: '',
      employeeName: '',
      departmentName: '',
      departmentID: 0,
      createdBy: 0,
      createdOn: new Date().toISOString().slice(0, 23) + 'Z',
      activeFlag: false,
      isMainBranch: false,
      supervisorID: 0,
      firstName: '',
      maRoleID: this.currentMaRoleID,
      mapagemenuDto: [],
    });
    this.currentBranchTableIndex = this.allBranchDetails.length - 1;
    this.allBranchDetails = [...this.allBranchDetails];
    return true;
  }

  checkFieldEmpty(key: any): boolean {
    for (const obj of this.allBranchDetails) {
      const val = obj[key];
      if (val === '' || val === null || val === undefined || val === 0) {
        return true;
      }
    }
    return false;
  }

  checkBranchDetailsValid(branchDetails: any): boolean {
    let isMainBranchFlag = false;
    console.log(branchDetails);

    for (const item of branchDetails) {
      const pageMenus = Array.isArray(item?.mapagemenuDto) ? item.mapagemenuDto : [];
      const branchId = item?.branchID ?? item?.branchName?.id ?? item?.branchId;
      const deptId = item?.departmentID ?? item?.departmentName?.id ?? item?.departmentId;
      const supervisorId = item?.supervisorID ?? item?.supervisor?.id ?? item?.supervisorId;

      const branchMissing = branchId === '' || branchId === null || branchId === undefined || branchId === 0;
      const deptMissing = deptId === '' || deptId === null || deptId === undefined || deptId === 0;
      const supervisorMissing =
        supervisorId === '' || supervisorId === null || supervisorId === undefined || supervisorId === 0;

      if (branchMissing || deptMissing || supervisorMissing || pageMenus.length === 0) {
        this.baseService.showCustomDialogue('Branch details cannot be empty');
        return false;
      }
      if (item.isMainBranch === true || item.isMainBranch === 1) {
        isMainBranchFlag = true;
      }
    }

    if (!isMainBranchFlag) {
      this.baseService.showCustomDialogue('Please select isMainBranch');
      return false;
    }

    return true;
  }

  /** Normalize branch display value to string (row may have string or object). */
  private branchDisplayValue(item: any): string {
    const v = item?.branchName;
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (v?.value ?? v?.company ?? v?.name ?? '') || '';
  }

  /** Normalize department display value to string. */
  private departmentDisplayValue(item: any): string {
    const v = item?.departmentName;
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (v?.value ?? v?.name ?? '') || '';
  }

  /** Normalize supervisor display value to string. */
  private supervisorDisplayValue(item: any): string {
    const v = item?.firstName ?? item?.employeeName;
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (v?.value ?? v?.name ?? '') || '';
  }

  processBranchInformation(branchDetails: any): any[] {
    const branchDetailsArray: any[] = [];
    const list = Array.isArray(branchDetails) ? branchDetails : [];
    list.forEach((item: any) => {
      const pageMenuArray: any[] = [];
      const pageMenus = Array.isArray(item?.mapagemenuDto) ? item.mapagemenuDto : [];
      pageMenus.forEach((pagemenu: any) => {
        const pageMenuId = pagemenu.pageMenuID ?? pagemenu.pageMenuId;
        if (
          pagemenu.isApprove === true ||
          pagemenu.isView === true ||
          pagemenu.isCreate === true ||
          pagemenu.isEdit === true ||
          pagemenu.isCancel === true ||
          pagemenu.isDelete === true ||
          pagemenu.isEditApproved === true ||
          pagemenu.isHigherApprove === true ||
          pagemenu.isPrint === true ||
          pagemenu.isEmail === true ||
          pagemenu.frequentlyUsed === true
        ) {
          pageMenuArray.push({
            userDetailsId: item.id ?? 0,
            pageMenuId,
            isView: !!pagemenu.isView,
            isCreate: !!pagemenu.isCreate,
            isEdit: !!pagemenu.isEdit,
            isCancel: !!pagemenu.isCancel,
            isDelete: !!pagemenu.isDelete,
            isApprove: !!pagemenu.isApprove,
            isEditApproved: !!pagemenu.isEditApproved,
            isHigherApprove: !!pagemenu.isHigherApprove,
            isPrint: !!pagemenu.isPrint,
            isEmail: !!pagemenu.isEmail,
            frequentlyUsed: !!pagemenu.frequentlyUsed,
          });
        }
      });

      const branchId = item?.branchID ?? item?.branchId ?? 0;
      const deptId = item?.departmentID ?? item?.departmentId ?? 0;
      const supId = item?.supervisorID ?? item?.supervisorId ?? 0;
      branchDetailsArray.push({
        employeeId: item.employeeID ?? 0,
        branchName: { id: Number(branchId) || 0, value: this.branchDisplayValue(item) },
        departmentName: { id: Number(deptId) || 0, value: this.departmentDisplayValue(item) },
        activeFlag: item.activeFlag === true || item.activeFlag === 1 ? 1 : 0,
        isMainBranch: item.isMainBranch === true || item.isMainBranch === 1,
        supervisor: { id: Number(supId) || 0, value: this.supervisorDisplayValue(item) },
        maRoleId: Number(item.maRoleID ?? 0) || 0,
        mapagemenuDto: pageMenuArray,
      });
    });
    return branchDetailsArray;
  }

  private normalizeBranchDetails(details: any[]): any[] {
    if (!Array.isArray(details)) return [];

    const normalized = details.map((d: any) => {
      const branchId = d?.branchID ?? d?.branchId ?? d?.branchName?.id ?? d?.branch?.id ?? 0;
      const branchName =
        d?.branchName?.value ?? d?.branchName ?? d?.branch?.value ?? d?.branch?.name ?? '';

      const departmentId =
        d?.departmentID ?? d?.departmentId ?? d?.departmentName?.id ?? d?.department?.id ?? 0;
      const departmentName =
        d?.departmentName?.value ??
        d?.departmentName ??
        d?.department?.value ??
        d?.department?.name ??
        '';

      const supervisorId = d?.supervisorID ?? d?.supervisorId ?? d?.supervisor?.id ?? 0;
      const supervisorName =
        d?.firstName ?? d?.employeeName ?? d?.supervisor?.value ?? d?.supervisor?.name ?? '';

      return {
        ...d,
        branchID: branchId,
        branchName,
        departmentID: departmentId,
        departmentName,
        supervisorID: supervisorId,
        firstName: supervisorName,
        mapagemenuDto: Array.isArray(d?.mapagemenuDto) ? d.mapagemenuDto : [],
      };
    });

    return normalized.filter((row: any) => {
      const hasIds = !!row.branchID || !!row.departmentID || !!row.supervisorID;
      const hasRights = Array.isArray(row.mapagemenuDto) && row.mapagemenuDto.length > 0;
      return hasIds || hasRights;
    });
  }

  // ========== Branch grid: column selection handlers ==========
  onDepartmentSelected(event: any, row: any): void {
    if (!event || event.value === null || event.value === undefined) {
      row.departmentID = 0;
      row.departmentName = '';
      return;
    }
    const selectedId = event.value ?? event.itemData?.id;
    const selectedName = event.itemData?.name ?? event.text ?? '';
    row.departmentID = selectedId;
    row.departmentName = selectedName;
  }

  onBranchSelected(event: any, row: any): void {
    if (!event || event.value === null || event.value === undefined) {
      row.branchID = 0;
      row.branchName = '';
      return;
    }
    const selectedId = event.value ?? event.itemData?.id;
    const selectedName = event.itemData?.company ?? event.text ?? '';
    row.branchID = selectedId;
    row.branchName = selectedName;
  }

  onSupervisorSelected(event: any, data: BranchDetails): void {
    const selected = this.supervisorOptions.find(
      (s: Supervisor) => s.id === event.value || s.id === event.itemData?.id
    );
    if (selected) {
      data.supervisorID = selected.id;
      data.employeeName = selected.name;
      (data as any).firstName = selected.name; // used as supervisor display value in payload
    }
  }

  getSupervisorName(id: number): string {
    const supervisor = this.supervisorOptions.find((s: Supervisor) => s.id === id);
    return supervisor ? supervisor.name : '';
  }

  // ========== Branch grid: actions & checkboxes ==========
  onActionBegin(args: any): void {
    if (!this.isNewMode() && !this.isEditMode()) {
      if (['beginEdit', 'add'].includes(args.requestType)) {
        args.cancel = true;
      }
      return;
    }
    if (args.requestType === 'save' && args.action === 'edit') {
      this.onQTYChange(args, args.data);
    }
  }

  onQTYChange(event: any, data: any): void {
    data.qty = parseFloat(event.target.value) || 0;
  }

  onActionComplete(args: any): void {}

  onClickActiveFlag(event: any, row: any, rowIndex: number): void {
    const isChecked = event.target.checked;
    this.allBranchDetails[rowIndex].activeFlag = isChecked ? 1 : 0;
  }

  onClickMainBranch(event: any, row: any): void {
    if (!row) return;
    const isChecked = event?.target?.checked ?? false;
    if (isChecked === true) {
      for (const obj of this.allBranchDetails) {
        if (obj !== row && obj['isMainBranch'] === true) {
          obj['isMainBranch'] = false;
        }
      }
    }
    row.isMainBranch = isChecked;
  }

  onActiveFlagChange(event: any, data: any): void {
    if (!data) return;
    // Syncfusion ejs-checkbox emits ChangeEventArgs { checked, event }, not native Event
    const checked = event?.checked ?? event?.target?.checked ?? false;
    data.activeFlag = checked;
  }

  onKeyDown(event: KeyboardEvent, data: any, field: string): void {
    if (event.key === 'Enter' || event.key === 'Tab') {
      console.log(`${field} updated for row:`, data);
    }
  }

  enableGridEditing(enable: boolean): void {
    if (!this.branchGrid) return;
    const newEditSettings: EditSettingsModel = {
      allowEditing: enable,
      allowAdding: false,
      allowDeleting: enable,
      mode: 'Normal' as any,
    };
    this.editSettings = newEditSettings;
    this.branchGrid.editSettings = newEditSettings;
    setTimeout(() => {
      this.branchGrid.refreshColumns();
      this.branchGrid.refresh();
    }, 0);
  }

  // ========== Toolbar: New / Edit / Save ==========
  override newbuttonClicked(): void {
    this.userForm.enable();
    this.isInputDisabled = true;
    this.userForm.reset();
    this.isNewMode.set(true);
    this.isEditMode.set(true);
    this.allBranchDetails = [];
    this.currentBranchTableIndex = -1;
    this.userChangedImage = false;
    setTimeout(() => this.enableGridEditing(true), 100);
  }

  override onEditClick(): void {
    this.isUpdate = true;
    this.userForm.enable();
    this.isInputDisabled = true;
    this.isEditMode.set(true);
    this.currentBranchTableIndex = Math.max(0, (this.allBranchDetails?.length ?? 1) - 1);
    setTimeout(() => this.enableGridEditing(true), 50);
  }

  override SaveFormData(): void {
    this.saveUser();
  }

  /**
   * Returns image for payload: null on update when unchanged; otherwise raw base64 only.
   * Backend expects raw base64, not "data:image/jpeg;base64,..." (which causes Base-64 decode error).
   */
  private getImagePathForPayload(): string | null {
    if (this.isUpdate && !this.userChangedImage) {
      return null;
    }
    const raw = this.imageData;
    if (raw == null) return null;
    if (typeof raw === 'string' && raw.startsWith('data:')) {
      const comma = raw.indexOf(',');
      return comma >= 0 ? raw.slice(comma + 1) : raw;
    }
    return typeof raw === 'string' ? raw : null;
  }

  /** Returns only rows that have branch, department and supervisor filled (no empty placeholder rows). */
  private getFilledBranchDetails(): any[] {
    const list = Array.isArray(this.allBranchDetails) ? this.allBranchDetails : [];
    return list.filter((row: any) => {
      const branchId = row?.branchID ?? row?.branchId ?? 0;
      const deptId = row?.departmentID ?? row?.departmentId ?? 0;
      const supId = row?.supervisorID ?? row?.supervisorId ?? 0;
      const hasBranch = branchId !== '' && branchId != null && branchId !== 0;
      const hasDept = deptId !== '' && deptId != null && deptId !== 0;
      const hasSup = supId !== '' && supId != null && supId !== 0;
      return hasBranch && hasDept && hasSup;
    });
  }

  saveUser(): boolean {
    if (this.userForm.invalid) {
      for (const field of Object.keys(this.userForm.controls)) {
        const control: any = this.userForm.get(field);
        if (control.invalid) {
          this.baseService.showCustomDialogue('Invalid field: ' + field);
          return false;
        }
      }
      return false;
    }

    const branchDetailsToSave = this.getFilledBranchDetails();
    if (branchDetailsToSave.length === 0) {
      this.baseService.showCustomDialogue('Please add at least one branch detail with Department, Branch and Supervisor.');
      return false;
    }

    if (!this.checkBranchDetailsValid(branchDetailsToSave)) {
      return false;
    }

    const branchInfo = this.processBranchInformation(branchDetailsToSave) ?? [];
    let cashAccount: any = {};
    let warehouse: any = {};
    if (this.userForm.value.pettycash) {
      this.pettycashData.forEach((element) => {
        if (element.accountID === this.userForm.value.pettycash) {
          cashAccount = { id: element.accountID, value: element.name };
        }
      });
    }
    if (this.userForm.value.warehouse) {
      this.warehouseData.forEach((element) => {
        if (element.id === this.userForm.value.warehouse) {
          warehouse = element;
        }
      });
    }

    const payload: any = {
      id: this.selectedUserId ?? 0,
      firstName: (this.userForm.value.firstName ?? '').trim(),
      middleName: this.userForm.value.middleName ? (this.userForm.value.middleName ?? '').trim() : null,
      lastName: (this.userForm.value.lastName ?? '').trim(),
      address: this.userForm.value.address ?? '',
      emailId: this.userForm.value.emailId ?? '',
      residenceNumber: this.userForm.value.residenceNumber ?? '',
      officeNumber: this.userForm.value.officeNumber ?? '',
      mobileNumber: this.userForm.value.mobileNumber ?? '',
      designation: {
        id: this.userForm.value.designationId ?? 0,
        value: '',
      },
      active: this.userForm.value.active ?? false,
      employeeType: { id: this.userForm.value.employeeType ?? 0, value: 'string' },
      username: this.userForm.value.username ?? '',
      password: this.userForm.value.password ?? '',
      gmailId: this.userForm.value.gmailId ?? '',
      isLocationRestrictedUser: this.userForm.value.isLocationRestrictedUser ?? false,
      photoId: this.userForm.value.photoId ?? null,
      account: { id: this.selectedAccountId ?? 0, value: this.selectedAccountName ?? '' },
      // On update, send image only if user selected a new one. Send raw base64 only (no data URL prefix).
      imagePath: this.getImagePathForPayload(),
      cashAccountId: cashAccount && Object.keys(cashAccount).length > 0 ? cashAccount : null,
      warehouseId: warehouse && Object.keys(warehouse).length > 0 ? warehouse : null,
      userBranchDetails: Array.isArray(branchInfo) ? branchInfo : [],
    };
    const payloadForLog = { ...payload, imagePath: payload.imagePath ? '(base64 image)' : payload.imagePath };
    console.log('payload:', JSON.stringify(payloadForLog));

    if (this.isUpdate) {
      this.updateCallback(payload);
    } else {
      this.createCallback(payload);
    }
    return true;
  }

  updateCallback(payload: any): void {
    this.httpService
      .patch(EndpointConstant.UPDATEUSER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          if (response.httpCode === 201) {
            this.baseService.showCustomDialogue('Successfully updated user');
            this.selectedUserId = this.firstUser;
            this.userForm.disable();
            await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
          } else {
            this.baseService.showCustomDialogue('Some error occured');
          }
        },
        error: () => {
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

  createCallback(payload: any): void {
    this.httpService
      .post(EndpointConstant.SAVEUSER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          if (response.httpCode === 201) {
            this.baseService.showCustomDialogue('Successfully saved user');
            this.selectedUserId = this.firstUser;
            this.userForm.disable();
            await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
          } else {
            this.baseService.showCustomDialogue('Some error occured');
          }
        },
        error: (error) => {
          console.error('Error saving user', error);
        },
      });
  }

  // ========== Left grid & load by ID ==========
  override async LeftGridInit(): Promise<void> {
    this.pageheading = 'Users';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLUSERS)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );
      this.leftGrid.leftGridData = res.data;
      console.log('Fetched data:', this.leftGrid.leftGridData);
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Users List',
          columns: [
            { field: 'fullName', datacol: 'fullName', headerText: 'FullName', textAlign: 'Left' },
            { field: 'role', datacol: 'role', headerText: 'Role', textAlign: 'Left' },
            { field: 'active', datacol: 'active', headerText: 'Active', textAlign: 'Left' },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }

  override getDataById(data: PUserModel): void {
    console.log('data', data);
    this.selectedUserId = data.id;
    this.fetchUserById();
  }

  private fetchUserById(): void {
    this.httpService
      .fetch(EndpointConstant.FILLALLUSERSBYID + this.selectedUserId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const res = response as any;
          this.currentUser = res?.data.user;
          this.imageData = res?.data.image;
          this.userChangedImage = false;
          this.userForm.patchValue({
            firstName: this.currentUser.userDetails.firstName,
            middleName: this.currentUser.userDetails.middleName,
            lastName: this.currentUser.userDetails.lastName,
            address: this.currentUser.userDetails.address,
            emailId: this.currentUser.userDetails.emailID,
            residenceNumber: this.currentUser.userDetails.residenceNumber,
            officeNumber: this.currentUser.userDetails.officeNumber,
            mobileNumber: this.currentUser.userDetails.mobileNumber,
            designationId: this.currentUser.userDetails.designationID,
            active: this.currentUser.userDetails.active,
            employeeType: this.currentUser.userDetails.employeeType,
            username: this.currentUser.userDetails.userName,
            password: this.currentUser.userDetails.password,
            gmailId: this.currentUser.userDetails.gmailID,
            isLocationRestrictedUser: this.currentUser.userDetails.isLocationRestrictedUser,
            photoId: this.currentUser.userDetails.photoID,
            imagePath: this.currentUser.userDetails.imagePath,
            employeeId: this.currentUser.userDetails.employeeType,
            pettycash: this.currentUser.userDetails.cashAccountId,
            warehouse: this.currentUser.userDetails.warehouseId,
          });
          this.selectedAccountId = this.currentUser.userDetails.accountID;
          this.selectedAccountName = this.currentUser.userDetails.accountName
            ? this.currentUser.userDetails.accountName
            : '';
          this.allBranchDetails = this.normalizeBranchDetails(this.currentUser.branchDetails);
          this.allBranchDetails.forEach((item: any, index: number) => {
            const branchDetailsId = item.id;
            this.allBranchDetails[index]['mapagemenuDto'] = this.currentUser.userRights.filter(
              (userRights) => userRights.userDetailsID === branchDetailsId
            );
          });
          this.currentBranchTableIndex = this.allBranchDetails.length - 1;
          console.log(this.allBranchDetails);
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  // ========== Delete ==========
  override DeleteData(data: PUserModel): void {
    console.log('deleted');
    this.deleteUser();
  }

  private deleteUser(): boolean {
    if (!this.isDelete) {
      this.baseService.showCustomDialogue('Permission Denied!');
      return false;
    }
    if (confirm('Are you sure you want to delete this details?')) {
      this.httpService
        .delete(EndpointConstant.DELETEUSER + this.currentUser.userDetails.id)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            this.LeftGridInit();
            this.baseService.showCustomDialogue(response.data as any);
          },
          error: () => {
            this.baseService.showCustomDialogue('Please try again');
          },
        });
    }
    return true;
  }

  // ========== User role dialog ==========
  openUserRolePopup(row: any, index: number): void {
    this.currentMaRoleID = row.maRoleID;
    this.allUserRights = row.mapagemenuDto;
    this.currentBranchDetailsIndex = index;
    this.userRoleDialog.show();
  }

  openPopup(maRoleId: number, allRights: any[]): void {
    this.currentMaRoleID = maRoleId;
    this.allUserRights = allRights;
    this.showChild = false;
    this.userRoleDialog.show();
  }

  closeUserRolePopup(): void {
    this.showUserRolePopup = false;
    if (this.userRoleDialog) this.userRoleDialog.hide();
  }

  onDialogOpen(): void {
    setTimeout(() => {
      this.showChild = true;
    });
  }

  onDialogClose(): void {
    this.showChild = false;
  }

  onUserRoleSelected(event: any): void {
    if (event != null && this.currentBranchDetailsIndex >= 0 && this.allBranchDetails[this.currentBranchDetailsIndex]) {
      this.allBranchDetails[this.currentBranchDetailsIndex].maRoleID = event.maRoleId ?? this.currentMaRoleID;
      this.allBranchDetails[this.currentBranchDetailsIndex].mapagemenuDto = Array.isArray(event.pageMenus) ? event.pageMenus : [];
      this.allBranchDetails = [...this.allBranchDetails];
    }
    this.userRoleDialog?.hide();
  }

  // ========== File / image upload ==========
  onFileSelected(event: SelectedEventArgs): void {
    const file = event.filesData[0].rawFile as File;
    const reader = new FileReader();
    reader.onload = () => {
      this.imageData = reader.result;
    };
    reader.readAsDataURL(file);
  }

  onUploadSuccess(event: SuccessEventArgs): void {
    console.log('Upload success:', event);
  }

  onUploadFailure(event: any): void {
    console.error('Upload failed:', event);
  }

  onImageSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file.type.startsWith('image/')) {
      console.error('Only image files are allowed.');
      return;
    }
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      console.error('File size exceeds the maximum allowed size.');
      return;
    }
    this.userChangedImage = true;
    const reader = new FileReader();
    reader.onload = () => {
      this.imageData = reader.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imageData = null;
    this.userChangedImage = true;
  }
}
