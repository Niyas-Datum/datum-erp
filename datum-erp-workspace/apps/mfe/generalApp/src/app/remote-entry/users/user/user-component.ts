import { Component, inject, OnInit, signal } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { firstValueFrom, Subject } from "rxjs";
import { GeneralAppService } from "../../http/general-app.service";
import { AccountPopup, EmployeeType, PageMenu, PettyCash, PUserModel, Supervisor, UserData, UserRoles, Warehouse } from "../model/puser.model";
import { PDesignationModel } from "../../company/model/pdesignation.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { validCompanyName, validEmail, validName, validPhoneNumber } from "@org/services";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EndpointConstant } from "@org/constants";
import { DepartmentPopup } from "../../company/model/pDepartment.model";
import { Branches } from "@org/models/lib/general/branch.dto";

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user-component.html',
  styleUrls: ['./user-component.css']
})
export class UserComponent extends BaseComponent implements OnInit {

  isLoading = signal(false);
  showChild = false;

  formSubmitted = false;

  // Input signals
  isNewMode = signal(false);
  isEditMode = signal(false);
  isInputEnabled: boolean = false;
  isInputDisabled: boolean = true;
  isNewBtnDisabled: boolean = false;
  isEditBtnDisabled: boolean = false;
  isDeleteBtnDisabled: boolean = false;
  isSaveBtnDisabled: boolean = true;
  isUpdate: boolean = false;
  isDelete = true;


  private httpService = inject(GeneralAppService);
  userForm = this.formUtil.thisForm;
  allUsers = [] as Array<PUserModel>;
  allDesignations = [] as Array<PDesignationModel>;
  allAccounts = [] as Array<AccountPopup>;
  pettycashData = [] as Array<PettyCash>;
  warehouseData = [] as Array<Warehouse>;

  accountOptions: any = [];
  selectedAccountId: number = 0;
  selectedAccountName: string = "";

  //for searching roles
  searchText: string = '';
  filteredRolesGridData: any[] = [];

  //for roles popup
  allPageMenus: PageMenu[] = [];
  filteredContent: PageMenu[] = [];
  rolesGridData: any[] = [];
  selectedBranchRow: any = null;
  showRolesPopup = false;
  allUserRoles = [] as Array<UserRoles>;
  selectedRoleId: number | null = null;

  //for fillby id
  selectedUserId!: number;
  currentUser = {} as UserData;

  //for branch details
  showBranchPopup = false;
  branchDetails: any[] = [];
  supervisorOptions: any = [];
  departmentData = [] as Array<DepartmentPopup>;
  branchData = [] as Array<Branches>;
  supervisorData = [] as Array<Supervisor>;
  departmentOptions: { id: number; name: string }[] = [];
  branchOptions: any = [];
   userBranchPayload: any = null;

  employeeType: EmployeeType[] = [
    {
      "value": 1,
      "name": "Employee"
    },
    {
      "value": 0,
      "name": "External Service Provider"
    }];

  public accountColumns = [
    { field: 'id', header: 'ID', width: 80 },
    { field: 'alias', header: 'Alias', width: 120 },
    { field: 'name', header: 'Name', width: 150 }
  ];

  constructor() {
    super();
    this.commonInit();
  }
  async ngOnInit(): Promise<void> {
    this.onInitBase();
    this.SetPageType(1);

    this.fetchAllDesignations();
    this.fetchPettyCashList();
    this.fetchWareHouseDropdown();
    this.fetchAccountDropdown();
    this.fetchDepartmentDropdown();
    this.fetchBranchDropdown();
    this.fetchSupervisorDropdown();
    this.fetchUserRoles();
  }

  override FormInitialize() {
    this.userForm = new FormGroup({
      //firstName: new FormControl( { value: '', disabled: false },Validators.required ),

      firstName: new FormControl({ value: '', disabled: false }, [Validators.required, validName]),
      middleName: new FormControl({ value: '', disabled: false }, [validName]),
      lastName: new FormControl({ value: '', disabled: false }, [Validators.required, validName]),
      address: new FormControl({ value: '', disabled: false }, Validators.required),
      emailId: new FormControl({ value: '', disabled: false }, [Validators.required, validEmail],),
      residenceNumber: new FormControl({ value: '', disabled: false }),
      officeNumber: new FormControl({ value: '', disabled: false }, [Validators.required, validPhoneNumber],),
      mobileNumber: new FormControl({ value: '', disabled: false }, [Validators.required, validPhoneNumber],),
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
      account: new FormControl({ value: '', disabled: false })
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.userForm.get(controlName);
    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty || this.formSubmitted)
    );
  }

  initialize() {
    this.userForm.reset();
    this.imagePreview = null;
    /* ---------- Clear Branch Grid ---------- */
    this.branchDetails = [];

    /* ---------- Clear Roles Grid ---------- */
    this.rolesGridData = [];
    this.filteredRolesGridData = [];

    /* ---------- Clear Role Selection ---------- */
    this.selectedBranchRow = null;
    this.selectedRoleId = null;
  }


  override newbuttonClicked(): void {
    this.isInputDisabled = false;
    this.userForm.enable();
    this.userForm.patchValue({
      active: true,
      letsystemgeneratenewaccountforparty: true
    });
    this.initialize();
  }

  override onEditClick() {

    this.isUpdate = true;
    this.userForm.enable();
    this.isInputDisabled = false;
    this.isEditMode.set(true);

  }

  //fills left grid data
  override async LeftGridInit() {
    this.pageheading = 'Users';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLUSERS)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      // handle data here after await completes
      this.leftGrid.leftGridData = res.data;
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Users List',
          columns: [
            {
              field: 'fullName',
              datacol: 'fullName',
              headerText: 'FullName',
              textAlign: 'Left',
            },
            {
              field: 'role',
              datacol: 'role',
              headerText: 'Role',
              textAlign: 'Left',
            },
            {
              field: 'active',
              datacol: 'active',
              headerText: 'Active',
              textAlign: 'Left',
            },
          ],
        },
      ];
    } catch (err) {
      this.toast.error('Error fetching companies:' + err);
    }
  }

  //Image uploading
  imagePreview: string | null = null;
  selectedImageFile: File | null = null;

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

    // Image-only validation
    if (!file.type.startsWith('image/')) {
      this.toast.error('Only image files are allowed');
      input.value = '';
      return;
    }

    // Size validation
    if (file.size > maxSizeInBytes) {
      this.toast.error('File size exceeds 5MB. Please upload an image less than 5MB');
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.imagePreview = base64;
    };
    reader.readAsDataURL(file);
  }

  async fetchAllDesignations(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLALLDESIGNATIONS)
      );

      this.allDesignations = response?.data as any;
    } catch (error) {
      this.toast.error('An error occurred while fetching designations:' + error);
    }
  }
  async fetchPettyCashList(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLPETTYCASH)
      );

      this.pettycashData = response?.data as any;
    } catch (error) {
      this.toast.error('An error occurred while fetching petty cash list:' + error);
    }
  }

  async fetchWareHouseDropdown(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLWAREHOUSEDROPDOWN)
      );

      this.warehouseData = response?.data as any;
    } catch (error) {
      this.toast.error('An error occurred while fetching warehouse list:' + error);
    }
  }

  async fetchAccountDropdown(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLACCOUNTPOPUP)
      );
      this.allAccounts = response?.data as any;
      this.accountOptions = this.allAccounts.map((item: any) => item.name);
    } catch (error) {
      this.toast.error('An error occurred while fetching accounts:' + error);
    }
  }
  onAccountSelected(event: any): void {
    let selectedAccountId = 0;
    this.allAccounts.forEach(function (item) {
      if (item.name === event) {
        selectedAccountId = item.id;
      }
    });
    this.selectedAccountId = selectedAccountId;
    this.selectedAccountName = event;

  }

  //fill by id
  override getDataById(data: PUserModel) {
    console.log('data', data);
    this.selectedUserId = data.id;
    this.fetchUserById(this.selectedUserId);
  }

  fetchUserById(id: number) {
    this.initialize();
    this.httpService
      .fetch(EndpointConstant.FILLALLUSERSBYID + id)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res: any) => {
          const user = res?.data?.user;
          if (!user) {
            console.error('❌ user object not found', res);
            return;
          }

          const userDetails = user.userDetails;
          const branchDetails = user.branchDetails || [];
          const userRights = user.userRights || [];
          const imageString = res?.data.image;
          if (imageString != null)
            this.imagePreview = `data:image/jpeg;base64,${imageString}`;

          console.log("User data:" + JSON.stringify(userDetails))
          console.log("Branch data:" + JSON.stringify(branchDetails))
          console.log("Roles data:" + JSON.stringify(userRights))
          // ================= USER FORM =================
          this.userForm.patchValue({
            firstName: userDetails.firstName,
            middleName: userDetails.middleName,
            lastName: userDetails.lastName,
            address: userDetails.address,
            emailId: userDetails.emailID,
            residenceNumber: userDetails.residenceNumber,
            officeNumber: userDetails.officeNumber,
            mobileNumber: userDetails.mobileNumber,
            designationId: userDetails.designationID,
            active: userDetails.active,
            employeeType: userDetails.employeeType,
            username: userDetails.userName,
            password: userDetails.password,
            gmailId: userDetails.gmailID,
            isLocationRestrictedUser: userDetails.isLocationRestrictedUser,
            pettycash: userDetails.cashAccountId,
            warehouse: userDetails.warehouseId,
            account: userDetails.accountID
          });

          // ================= FILL BRANCH GRID =================
          this.branchDetails = branchDetails.map((bd: any) => ({
            activeFlag: bd.activeFlag === true,
            isMainBranch: !!bd.isMainBranch,

            // dropdown binding IDs
            departmentName: bd.departmentID || null,
            branchName: bd.branchID || null,
            supervisor: bd.supervisorID || null,

            selectedRoleId: bd.maRoleID || null,

          }));

          // ================= MAP RIGHTS TO BRANCH =================

          this.branchDetails.forEach((branch: any) => {

            // Find rights for this branch
            const rights = userRights.filter(
              (r: any) => r.userDetailsID === branch.id
            );

            // Map rights to UI format
            branch.mapagemenuDto = rights.map((r: any) => ({
              userDetailsId: r.userDetailsID,
              pageMenuId: r.pageMenuID,
              pageName: r.pageName,
              moduleType: r.moduleType,

              isView: r.isView,
              isCreate: r.isCreate,
              isEdit: r.isEdit,
              isCancel: r.isCancel,
              isDelete: r.isDelete,
              isApprove: r.isApprove,
              isEditApproved: r.isEditApproved,
              isHigherApprove: r.isHigherApprove,
              isPrint: r.isPrint,
              isEmail: r.isEmail,
              frequentlyUsed: r.frequentlyUsed,
              isPage: r.isPage
            }));

          });
        },
        error: (error: any) => {
          this.toast.error('Fill by ID failed', error);
        }
      });
  }

  //save user
  override SaveFormData() {
    this.formSubmitted = true;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const f = this.userForm.value;
    const payload = {
      "id": this.selectedUserId ? this.selectedUserId : 0,
      "firstName": this.userForm.value.firstName.trim(),
      "middleName": this.userForm.value.middleName ? this.userForm.value.middleName.trim() : null,
      "lastName": this.userForm.value.lastName.trim(),
      "address": this.userForm.value.address,
      "emailId": this.userForm.value.emailId,
      "residenceNumber": this.userForm.value.residenceNumber,
      "officeNumber": this.userForm.value.officeNumber,
      "mobileNumber": this.userForm.value.mobileNumber,
      "designation": {
        "id": this.userForm.value.designationId ? this.userForm.value.designationId : null,
        "value": ""
      },
      "active": this.userForm.value.active ? this.userForm.value.active : false,
      "employeeType": {
        "id": this.userForm.value.employeeType ? this.userForm.value.employeeType : null,
        "value": "string"
      },
      "username": this.userForm.value.username,
      "password": this.userForm.value.password,
      "gmailId": this.userForm.value.gmailId,
      "isLocationRestrictedUser": this.userForm.value.isLocationRestrictedUser ? this.userForm.value.isLocationRestrictedUser : false,
      "photoId": null,
      "account": {
        "id": this.userForm.value.account ? this.userForm.value.account : null,
        "value": null
      },
      "imagePath": this.imagePreview,
      "cashAccountId": {
        "id": this.userForm.value.pettycash ? this.userForm.value.pettycash : null
      },
      "warehouseId": {
        "id": this.userForm.value.warehouse ? this.userForm.value.warehouse : null
      },
      "userBranchDetails": this.userBranchPayload.userBranchDetails
    }
    if (this.isUpdate) {
      this.updateCallback(payload);
    } else {
      this.createCallback(payload);
    }
    this.LeftGridInit();

  }

  createCallback(payload: any) {
    this.httpService.post(EndpointConstant.SAVEUSER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          if (response.httpCode == 201) {
            this.toast.success('Successfully saved user');
            this.userForm.disable();
            // Refresh the left grid and update the data sharing service
            await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });

          } else {
            this.toast.error('Some error occured');
          }
        },
        error: (error) => {
          console.error('Error saving user', error);
        },
      });
  }

  updateCallback(payload: any) {
    console.log("Calling update")
    this.httpService.patch(EndpointConstant.UPDATEUSER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          if (response.httpCode == 201) {
            this.toast.success("Successfully updated user");
            this.userForm.disable();
            // Refresh the left grid and update the data sharing service
            await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
          } else {
            this.toast.error('Some error occured');
          }
        },
        error: (error) => {
          this.toast.error('Please try again');
        },
      });
  }

  //Branch Details
  async fetchDepartmentDropdown(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.DEPARTMENTPOPUP)
      );
      const dataArray = Array.isArray(response?.data) ? response.data : [];
      this.departmentOptions = dataArray.map((item: any) => ({
        id: item.id,
        name: item.name
      }));

    } catch (error) {
      this.toast.error('An error occurred while fetching departments:'+ error);
    }
  }

  async fetchBranchDropdown(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.FILLALLBRANCH)
      );
      const dataArray = Array.isArray(response?.data) ? response.data : [];

      this.branchOptions = dataArray.map((item: any) => ({
        id: item.id,
        company: item.company 
      }));

      console.log('Branches:', this.branchOptions);

    } catch (error) {
      console.error('An error occurred while fetching branches:', error);
    }
  }

  async fetchSupervisorDropdown(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.httpService.fetch(EndpointConstant.USERDROPDOWN)
      );
      const dataArray = Array.isArray(response?.data) ? response.data : [];

      this.supervisorOptions = dataArray.map((item: any) => ({
        id: item.id,
        name: item.name
      }));

      console.log('Supervisors:', JSON.stringify(this.supervisorOptions, null, 2));

    } catch (error) {
      this.toast.error('An error occurred while fetching supervisors:'+ error);
    }
  }


  openBranchPopup() {
    this.showBranchPopup = true;
  }

  closeBranchPopup() {
    this.showBranchPopup = false;
  }

  addBranchRow() {
    this.branchDetails.push({
      activeFlag: false,
      isMainBranch: false,
      departmentName: null,
      branchName: null,
      supervisor: null,
      maRoleId: null,      
      mapagemenuDto: []    
    });
  }
 

  saveBranchDetails() {

    this.userBranchPayload = {
      userBranchDetails: this.branchDetails.map(row => {

        // ✅ REMOVE DUPLICATES BY pageMenuId
        const uniqueMenuMap = new Map<number, any>();

        (row.mapagemenuDto || []).forEach((m: any) => {
          if (!uniqueMenuMap.has(m.pageMenuId)) {
            uniqueMenuMap.set(m.pageMenuId, m);
          } else {
            // 🔥 merge permissions (OR logic)
            const existing = uniqueMenuMap.get(m.pageMenuId);
            uniqueMenuMap.set(m.pageMenuId, {
              ...existing,
              isView: existing.isView || m.isView,
              isCreate: existing.isCreate || m.isCreate,
              isEdit: existing.isEdit || m.isEdit,
              isCancel: existing.isCancel || m.isCancel,
              isDelete: existing.isDelete || m.isDelete,
              isApprove: existing.isApprove || m.isApprove,
              isEditApproved: existing.isEditApproved || m.isEditApproved,
              isHigherApprove: existing.isHigherApprove || m.isHigherApprove,
              isPrint: existing.isPrint || m.isPrint,
              isEmail: existing.isEmail || m.isEmail,
              frequentlyUsed: existing.frequentlyUsed || m.frequentlyUsed
            });
          }
        });

        return {

          employeeId: 0,

          departmentName: {
            id: row.departmentName,
            value: this.departmentOptions.find(d => d.id === row.departmentName)?.name || ''
          },

          activeFlag: row.activeFlag ? 1 : 0,

          isMainBranch: !!row.isMainBranch,

          branchName: {
            id: row.branchName,
            value: this.branchOptions.find((b: any) => b.id === row.branchName)?.company || ''
          },

          supervisor: {
            id: row.supervisor,
            value: this.supervisorOptions.find((s: any) => s.id === row.supervisor)?.name || ''
          },

          // ✅ correct role binding
          maRoleId: row.selectedRoleId ? Number(row.selectedRoleId) : null,

          // ✅ unique rights only
          mapagemenuDto: Array.from(uniqueMenuMap.values())
        };
      })
    };

    console.log('FINAL PAYLOAD 🔥', JSON.stringify(this.userBranchPayload, null, 2));
    this.showBranchPopup = false;
  }

onMainBranchChange(row: any, index: number) {

  if (row.isMainBranch === true) {

    const alreadyMain = this.branchDetails.find(
      (r: any, i: number) => r.isMainBranch === true && i !== index
    );

    if (alreadyMain) {
      // ❌ block
      row.isMainBranch = false;   // revert model

      alert('Only one branch can be set as Main Branch');
      return;
    }
  }
}


  //rols popup
  openRolesPopup(row: any) {
    this.selectedBranchRow = row;
    this.selectedRoleId = row.selectedRoleId;
    this.onRoleChange();
    this.showRolesPopup = true;
  }

  fetchUserRoles(): void {
    this.httpService
      .fetch(EndpointConstant.FILLROLEDROPDOWN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response: any) => {
          const data = response?.data;
          this.allUserRoles = Array.isArray(data) ? data : [];
        },
        error: (error: any) => {
          this.toast.error('An Error Occurred while fetching roles'+ error);
        }
      });
  }

  onRoleChange(event?: Event) {
    let roleId: number | null = null;
    if (event) {
      roleId = Number((event.target as HTMLSelectElement).value);
    } else {
      roleId = this.selectedBranchRow?.selectedRoleId;
    }
    if (!roleId) {
      this.filteredRolesGridData = [];
      this.selectedBranchRow.mapagemenuDto = []; // ✅ clear old rights
      return;
    }
    // ✅ clear before loading
    this.selectedBranchRow.mapagemenuDto = [];
    this.fetchUserRoleById(roleId);
  }

  fetchUserRoleById(roleid: number): void {
    this.httpService
      .fetch(EndpointConstant.FILLROLEBYID + roleid)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response: any) => {

          const data = response?.data;
          this.rolesGridData = Array.isArray(data) ? data.map((x: any) => ({
            pageMenuID: x.pageMenuID,
            isPage: x.isPage,
            pageName: x.pageName,
            moduleType: x.moduleType,

            view: x.isView,
            create: x.isCreate,
            edit: x.isEdit,
            cancel: x.isCancel,
            delete: x.isDelete,
            approve: x.isApprove,

            print: x.isPrint,
            higherApprove: x.isHigherApprove,
            editApproved: x.isEditApproved
          })) : [];

          // UI copy
          this.filteredRolesGridData = [...this.rolesGridData];
        },
        error: (error: any) => {
          this.toast.error('Error fetching roles', error);
        },
      });
  }


  // searching
  filterByPageName() {
    const text = this.searchText?.toLowerCase().trim();
    if (!text) {
      this.filteredRolesGridData = [...this.rolesGridData];
      return;
    }
    this.filteredRolesGridData = this.rolesGridData.filter(item =>
      item.pageName?.toLowerCase().includes(text)
    );
  }

  saveRoles() {
    if (!this.selectedBranchRow) {
      console.error('No branch row selected');
      return;
    }
    const userDetailsId = 0;
    const mappedRoles = this.rolesGridData.map(r => ({
      userDetailsId: userDetailsId,
      pageMenuId: r.pageMenuID,

      isView: !!r.view,
      isCreate: !!r.create,
      isEdit: !!r.edit,
      isCancel: !!r.cancel,
      isDelete: !!r.delete,
      isApprove: !!r.approve,
      isEditApproved: !!r.editApproved,
      isHigherApprove: !!r.higherApprove,
      isPrint: !!r.print,
      isEmail: false,
      frequentlyUsed: false
    }));

    // 🔥 now updates actual branchDetails row
    this.selectedBranchRow.maRoleId = this.selectedRoleId;
    this.selectedBranchRow.mapagemenuDto = mappedRoles;
    this.showRolesPopup = false;
  }


  toggleColumn(type: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    this.filteredRolesGridData.forEach((r: any) => {

      switch (type) {
        case 'view':
          r.view = checked;
          break;
        case 'create':
          r.create = checked;
          break;
        case 'edit':
          r.edit = checked;
          break;
        case 'delete':
          r.delete = checked;
          break;
        case 'cancel':
          r.cancel = checked;
          break;
        case 'print':
          r.print = checked;
          break;
      }
    });
  }

  //Delete user
  override DeleteData(data: PUserModel) {
    if (!this.isDelete) {
      this.toast.warning('Permission Denied!');
      return false;
    }
    if (confirm("Are you sure you want to delete this details?")) {
      this.httpService.delete(EndpointConstant.DELETEUSER + this.selectedUserId)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            this.LeftGridInit();
            this.toast.success("User Deleted Successfully");
            this.LeftGridInit();
          },
          error: (error) => {
            this.toast.error('Please try again');
          },
        });
    }
    return true;
  }

}