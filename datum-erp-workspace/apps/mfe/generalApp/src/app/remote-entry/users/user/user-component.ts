import { Component,inject,OnInit,signal,ViewChild,} from '@angular/core';
import { FormControl,FormGroup,Validators,} from '@angular/forms';
import { GeneralAppService } from '../../http/general-app.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom, Subject } from 'rxjs';
import { AccountPopup, BranchDetails, EmployeeType, PettyCash, PUserModel, Supervisor, UserData, Warehouse } from '../model/puser.model';
import { Branches } from '../../company/model/pbranch.model';
import { DepartmentPopup } from '../../company/model/pDepartment.model';
import { PDesignationModel } from '../../company/model/pdesignation.component';
import { BaseService, validEmail, validPhoneNumber } from '@org/services';
import { EditSettingsModel, GridComponent } from '@syncfusion/ej2-angular-grids';
import { SelectedEventArgs, SuccessEventArgs } from '@syncfusion/ej2-angular-inputs';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user-component.html',
  styles: [],
})
export class UserComponent extends BaseComponent implements OnInit {
  @ViewChild('branchGrid', { static: false }) branchGrid!: GridComponent;
  @ViewChild('userRoleDialog') userRoleDialog!: DialogComponent;
   isLoading = signal(false);
    showChild = false;
    private destroy$ = new Subject<void>();
     
   // Input signals
      isNewMode = signal(false);
      isEditMode = signal(false);

      isInputEnabled: boolean = false; //

 editSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Normal' as any // cast because EditMode is not a runtime enum
  };
  
   public editForm!: FormGroup;
    selectedBranch = signal< null>(null);

  private httpService = inject(GeneralAppService);
  private baseService = inject(BaseService);
  userForm = this.formUtil.thisForm;
  allUsers = [] as Array<PUserModel>; 
  allDesignations = [] as Array<PDesignationModel>; 
  allAccounts = [] as Array<AccountPopup>;

  currentMaRoleID = 0;
  employeeType:EmployeeType[] = [
    {
    "value":1,
    "name":"Employee"
    },
    {
    "value":0,
    "name":"External Service Provider"
    }];
  selectedUserId!: number;
  firstUser!:number;
  isActive: number = 0;
  currentUser = {} as UserData;
  isInputDisabled: boolean = false;
  isNewBtnDisabled: boolean = false;
  isEditBtnDisabled: boolean = false;
  isDeleteBtnDisabled: boolean = false; 
  isSaveBtnDisabled: boolean = true; 
  isUpdate: boolean = false;
  isDelete = true;
  isLocationRestrictedUser: boolean = false;    
  accountOptions:any = [];  
  departmentOptions:any = [];  
  branchOptions:any = [];
 // allroles = [] as Array<UserRoles>;
//  roleOptions: any[] = [];
  supervisorOptions:any = [];
  departmentData = [] as Array<DepartmentPopup>;
  branchData = [] as Array<Branches>;
  supervisorData = [] as Array<Supervisor>;
  //departmentValue = "";
  //branchValue = "";
  allBranchDetails: any[] = [];
  allUserRights: any[] = [];
  currentBranchTableIndex: number | null = null;
  showUserRolePopup = false;
  currentBranchDetailsIndex: number =0;
  selectedAccountId: number = 0;
  selectedAccountName: string = "";
  accountreturnField:string = 'name';
  accountKeys = ['Account Code','Account Name','ID'];
  departmentreturnField:string = 'name';
  departmentKeys = ['ID','Department Name'];
  branchreturnField:string = 'company';
  branchKeys = ['Company','ID'];
  supervisorreturnField:string = 'name';
  supervisorKeys = ['Name','ID'];
  showPopup = true;

  imageData: string | ArrayBuffer | null = null;
  showImageContainer = true;

  pettycashData = [] as Array<PettyCash>;
  warehouseData = [] as Array<Warehouse>;

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
  console.log(this.currentPageInfo?.menuText);

  // Disable form initially while data loads
  this.userForm.disable();

  // Start critical dropdowns first (minimum data for form display)
  try {
    await Promise.all([
      this.fetchAllDesignations(),
      this.fetchAccountDropdown()
    ]);

    console.log("Primary dropdown data loaded.");

    // Now load non-critical data in background (no UI blocking)
    this.loadSecondaryData();

  } catch (error) {
    console.error("Error loading primary data:", error);
  }

}

/**
 * Load non-critical dropdowns asynchronously after UI is shown
 */
private loadSecondaryData(): void {
  // Run background async tasks without blocking UI
  setTimeout(() => {
    Promise.allSettled([
      this.fetchDepartmentDropdown(),
      this.fetchBranchDropdown(),
      this.fetchSupervisorDropdown(),
      this.fetchPettyCashList(),
      this.fetchWareHouseDropdown(),
    ]).then(results => {
      console.log("Secondary dropdown data loaded (background).", results);
    }).catch(error => {
      console.error("Background data load error:", error);
    });
  }, 300); // short delay allows UI to stabilize first
}
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
    //this.recalculateAndUpdateRow(data);
  }
onActionComplete(args: any): void {
    // Reserved for future logic
  }

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
      id: item.id
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
      id: item.id
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

 onAccountSelected(event: any): void {    
    let selectedAccountId = 0;
    this.allAccounts.forEach(function(item) {
      if (item.name === event) {
        selectedAccountId = item.id;
      }
    });
    this.selectedAccountId = selectedAccountId;
    this.selectedAccountName = event;
      
  }
  override FormInitialize() { 
    this.userForm = new FormGroup({firstName: new FormControl( { value: '', disabled: false },Validators.required ),
      middleName: new FormControl(  { value: '', disabled: false }),
      lastName: new FormControl({ value: '', disabled: false },Validators.required),
      address: new FormControl({ value: '', disabled: false },Validators.required),
      emailId: new FormControl({ value: '', disabled: false }, [Validators.required,validEmail],),
      residenceNumber: new FormControl({ value: '', disabled: false }),
      officeNumber: new FormControl({ value: '', disabled: false }, [Validators.required,validPhoneNumber],),
      mobileNumber: new FormControl({ value: '', disabled: false }, [Validators.required,validPhoneNumber],),
      designationId: new FormControl({ value: '', disabled: false }, Validators.required),
      active: new FormControl({ value: '', disabled: false }, Validators.required),
      employeeType: new FormControl({ value: '', disabled: false }, Validators.required),
      username: new FormControl({ value: '', disabled: false }, Validators.required),
      password: new FormControl({ value: '', disabled: false }, Validators.required),
      pettycash: new FormControl({ value: '', disabled: false }),
      warehouse: new FormControl({ value: '', disabled: false }),
      gmailId: new FormControl({ value: '', disabled: false }, [Validators.required,validEmail]),
      isLocationRestrictedUser: new FormControl({ value: '', disabled: false}),
      photoId: new FormControl({ value: '', disabled: false}),
      imagePath: new FormControl({ value: '', disabled: false}),
      employeeId: new FormControl({ value: '', disabled: false}),
      departmentId: new FormControl({ value: '', disabled: false}),
      createdOn: new FormControl({ value: '', disabled: false}),
      //accountDropdown: new FormControl({ value: '', disabled: false })
    });
    console.log('form init started');
  }

   addRow(clicknew = false) {
    this.currentMaRoleID = 0;
    //checking department is empty or not....
    if(this.checkFieldEmpty('departmentId') && clicknew){
      this.baseService.showCustomDialogue('Please fill department');
      return false;
    }
    //checking branchname is empty or not....
    if(this.checkFieldEmpty('branchName') && clicknew){
      this.baseService.showCustomDialogue('Please fill branchName');
      return false;
    }

    //checking supervisorId is empty or not....
    if(this.checkFieldEmpty('supervisorId') && clicknew){
      this.baseService.showCustomDialogue('Please fill supervisorId');
      return false;
    }

    this.allBranchDetails.push({
      id: 0,
      employeeID: 0,
      branchID: 0,
      branchName: "",
      employeeName: "",
      departmentName: "",
      departmentID: 0,
      createdBy: 0,
      createdOn: new Date().toISOString().slice(0, 23) + 'Z',
      activeFlag: false,
      isMainBranch: false,
      supervisorID: 0,
      firstName:"",
      maRoleID: this.currentMaRoleID,
      mapagemenuDto:[]
    });
    this.currentBranchTableIndex = this.allBranchDetails.length - 1;
    this.allBranchDetails = [...this.allBranchDetails];
    return true;
  }
// ✅ Update your addRow method to accept row data

   checkFieldEmpty(key:any){
    for (const obj of this.allBranchDetails) {
      if (obj[key] == "" ) {
          return true; // Key is null in at least one object
      }
    }
    return false;
  }

   onClickActiveFlag(event: any, row: any, rowIndex: number) {   
    const isChecked = event.target.checked;
    this.allBranchDetails[rowIndex].activeFlag = isChecked ? 1 : 0;
  }

    onClickMainBranch(event: any, row: any, rowIndex: number) {
    const isChecked = event.target.checked;
    if(isChecked == true){
      for (const obj of this.allBranchDetails) {
        if (obj['isMainBranch'] == true ) {
          obj['isMainBranch'] = false;
        }
      }
    }
    this.allBranchDetails[rowIndex].isMainBranch = isChecked;
    
  }

onDepartmentSelected(option: any,rowIndex:any): any {
    if(option == ""){
      this.allBranchDetails[rowIndex].departmentID = "";
      this.allBranchDetails[rowIndex].departmentName = "";
      return true;
    }
    let selectedDepartmentId;
    this.departmentData.forEach(function(item) {
      if (item.name === option) {
        selectedDepartmentId = item.id;
      }
    });
    this.allBranchDetails[rowIndex].departmentID = selectedDepartmentId;
    this.allBranchDetails[rowIndex].departmentName = Option;
  }

    onBranchSelected(option: string,rowIndex:any): any {
    if(option == ""){
      this.allBranchDetails[rowIndex].branchID = "";
      this.allBranchDetails[rowIndex].branchName = "";
      return true;
    }
    let selectedBranchId;
    this.branchData.forEach(function(item) {
      if (item.company === option) {
        selectedBranchId = item.id;
      }
    });
    this.allBranchDetails[rowIndex].branchID = selectedBranchId;
    this.allBranchDetails[rowIndex].branchName = option;
  }

 openUserRolePopup(row: any, index: number): void {
    this.currentMaRoleID = row.maRoleID;
    this.allUserRights = row.mapagemenuDto;
    this.currentBranchDetailsIndex = index;

//  this.currentMaRoleID = row.maRoleID; // ensure this is set
//  this.showUserRolePopup = true;

    // ✅ Opens the Syncfusion dialog programmatically
    this.userRoleDialog.show();
  }

 // ✅ Enable/Disable Grid Editing
 enableGridEditing(enable: boolean): void {
    if (!this.branchGrid) return;

    // construct a proper EditSettingsModel object
    const newEditSettings: EditSettingsModel = {
      allowEditing: enable,
      allowAdding: enable,
      allowDeleting: enable,
      mode: 'Normal' as any
    };

    // assign to component property (bound to [editSettings])
    this.editSettings = newEditSettings;

    // also assign to the grid instance (ensures grid uses new settings)
    this.branchGrid.editSettings = newEditSettings;

    // force the grid to re-render templates & data
    // small timeout helps in some timing cases
    setTimeout(() => {
      this.branchGrid.refreshColumns();
      this.branchGrid.refresh();
    }, 0);
  }

  override newbuttonClicked(): void {
    console.log('New button clicked');
    this.userForm.enable();
    this.isInputDisabled = true;
    this.userForm.reset();
    this.isNewMode.set(true);
    this.isEditMode.set(true);
    const defaultData = {
    activeFlag: true,
    isMainBranch: true,
    departmentName: null,
    branchName: null,
    supervisorID: null,
    maRoleID: null
  };

  this.branchGrid.addRecord(defaultData);
  setTimeout(() => this.enableGridEditing(true), 100);
  }

  override onEditClick(){
    console.log('Entered edit mode');
    this.isUpdate = true;
    this.userForm.enable();
    this.isInputDisabled = true;
    this.isEditMode.set(true);
     this.branchGrid.addRecord();
  setTimeout(() => this.branchGrid.startEdit(), 50);
  }

  override SaveFormData() {
    console.log(this.userForm.controls);
    this.saveUser();
  }
    saveUser() {
    if (this.userForm.invalid) {
      for (const field of Object.keys(this.userForm.controls)) {
        const control: any = this.userForm.get(field);
        if (control.invalid) {
          this.baseService.showCustomDialogue('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }
    let resbranchDetailsValid = this.checkBranchDetailsValid(this.allBranchDetails);
    if(!resbranchDetailsValid){
      return false;
    }
    let branchInfo = this.processBranchInformation(this.allBranchDetails);
    let cashAccount = {};
    let warehouse = {};
    if(this.userForm.value.pettycash){
      this.pettycashData.forEach(element => {
        if(element.accountID == this.userForm.value.pettycash){
          cashAccount = {
            id: element.accountID,
            value: element.name
            };
        }
      });
    }

    if(this.userForm.value.warehouse){
      this.warehouseData.forEach(element => {
        if(element.id == this.userForm.value.warehouse){
          warehouse = element;
        }
      });
    }
    const payload:any = {     
      id: this.selectedUserId ?  this.selectedUserId : 0, 
      firstName: this.userForm.value.firstName.trim(),
      middleName: this.userForm.value.middleName ? this.userForm.value.middleName.trim() : null,
      lastName: this.userForm.value.lastName.trim(),
      address: this.userForm.value.address,
      emailId: this.userForm.value.emailId,
      residenceNumber: this.userForm.value.residenceNumber,
      officeNumber: this.userForm.value.officeNumber,
      mobileNumber: this.userForm.value.mobileNumber,
      designation: {
        id:this.userForm.value.designationId ? this.userForm.value.designationId : 0,
        value:""
      },
      active: this.userForm.value.active,
      employeeType: {
        id:this.userForm.value.employeeType,
        value: "string"
      },
      username: this.userForm.value.username,
      password: this.userForm.value.password,
      gmailId: this.userForm.value.gmailId,
      isLocationRestrictedUser: this.isLocationRestrictedUser,
      photoId: this.userForm.value.photoId,
      account: {
        id: this.selectedAccountId,
        value: this.selectedAccountName
      },
      imagePath: this.imageData,
      cashAccountId: cashAccount,
      warehouseId: warehouse,
      userBranchDetails:branchInfo
    };
    console.log("payload:",JSON.stringify(payload));
    if(this.isUpdate){
      this.updateCallback(payload);
    } else{
      this.createCallback(payload);
    }
    return true;
  }

  checkBranchDetailsValid(branchDetails: any): boolean {
    let isMainBranchFlag = false;
  console.log(branchDetails);
    for (const item of branchDetails) {
      if (item.branchID === "" || item.departmentID === "" || item.supervisorID === "" || item.mapagemenuDto.length === 0) {
        this.baseService.showCustomDialogue('Branch details cannot be empty');
        return false;
      }
      if (item.isMainBranch === true) {
        isMainBranchFlag = true;
      }
    }
  
    if (isMainBranchFlag === false) {
      this.baseService.showCustomDialogue('Please select isMainBranch');
      return false;
    }
  
    return true;
  }
  
  processBranchInformation(branchDetails:any){
    let branchDetailsArray:any = [];
    branchDetails.forEach((item:any) => {
      let pageMenuArray:any = [];
      item.mapagemenuDto.forEach((pagemenu:any)=>{
        if(pagemenu.isApprove == true || pagemenu.isView == true || pagemenu.isCreate == true || pagemenu.isEdit == true || pagemenu.isCancel == true || pagemenu.isDelete == true || pagemenu.isEditApproved == true || pagemenu.isHigherApprove == true || pagemenu.isPrint == true || pagemenu.isEmail == true || pagemenu.frequentlyUsed == true){
          let userRightsStruct = {
            userDetailsId : item.id,
            pageMenuId:pagemenu.pageMenuID,
            isView: pagemenu.isView,
            isCreate: pagemenu.isCreate,
            isEdit: pagemenu.isEdit,
            isCancel: pagemenu.isCancel,
            isDelete: pagemenu.isDelete,
            isApprove: pagemenu.isApprove,
            isEditApproved: pagemenu.isEditApproved,
            isHigherApprove:pagemenu.isHigherApprove,
            isPrint: pagemenu.isPrint,
            isEmail: pagemenu.isEmail,
            frequentlyUsed: pagemenu.frequentlyUsed
          };     
          pageMenuArray.push(userRightsStruct);
        }
      });

      let branchDetailsStruct = {
        employeeId:item.employeeID,
        branchName: {
          id: item.branchID,
          value: item.branchName
        },
        departmentName: {
          id: item.departmentID,
          value: item.departmentName
        },
        activeFlag: item.activeFlag ? 1 : 0,
        isMainBranch: item.isMainBranch,
        supervisor: {
          id: item.supervisorID,
          value:item.firstName
        },
        maRoleId: item.maRoleID,
        mapagemenuDto: pageMenuArray
      };      
      branchDetailsArray.push(branchDetailsStruct);
    });
    return branchDetailsArray;
  }

  updateCallback(payload:any){
    this.httpService.patch(EndpointConstant.UPDATEUSER,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          if(response.httpCode == 201){
            this.baseService.showCustomDialogue("Successfully updated user");          
            this.selectedUserId = this.firstUser;
             this.userForm.disable();
// Refresh the left grid and update the data sharing service
                await this.LeftGridInit();
                this.serviceBase.dataSharingService.setData({
                  columns: this.leftGrid.leftGridColumns,
                  data: this.leftGrid.leftGridData,
                  pageheading: this.pageheading,
                });
          } else{
            this.baseService.showCustomDialogue('Some error occured');
          }         
        },
        error: (error) => {
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

  createCallback(payload:any){
    this.httpService.post(EndpointConstant.SAVEUSER,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          if(response.httpCode == 201){
            this.baseService.showCustomDialogue('Successfully saved user');          
            this.selectedUserId = this.firstUser;
            this.userForm.disable();
// Refresh the left grid and update the data sharing service
                await this.LeftGridInit();
                this.serviceBase.dataSharingService.setData({
                  columns: this.leftGrid.leftGridColumns,
                  data: this.leftGrid.leftGridData,
                  pageheading: this.pageheading,
                });

          } else{
            this.baseService.showCustomDialogue('Some error occured');
          }
        },
        error: (error) => {
          console.error('Error saving user', error);
        },
      });
  }

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
      console.log('Fetched data:', this.leftGrid.leftGridData);

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
      console.error('Error fetching companies:', err);
    }
  }

  override getDataById(data: PUserModel) {
    console.log('data', data);
     this.selectedUserId = data.id;
    this.fetchUserById();
  }
  private fetchUserById(){
    this.httpService
    .fetch(EndpointConstant.FILLALLUSERSBYID  +this.selectedUserId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        const res = response as any;
        this.currentUser = res?.data.user;        
        this.imageData =  res?.data.image;
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
          warehouse: this.currentUser.userDetails.warehouseId
        });
        this.selectedAccountId = this.currentUser.userDetails.accountID;
        this.selectedAccountName = this.currentUser.userDetails.accountName ? this.currentUser.userDetails.accountName : "";
        //set branch details....
        this.allBranchDetails =   this.currentUser.branchDetails;
        // check user rights and set to corresponding branch details....
        this.allBranchDetails.forEach((item:any,index:number)=>{
          let branchDetailsId = item.id;
          this.allBranchDetails[index]['mapagemenuDto'] = this.currentUser.userRights.filter(userRights => userRights.userDetailsID === branchDetailsId);
        });
        this.currentBranchTableIndex = this.allBranchDetails.length - 1;
        console.log(this.allBranchDetails);
      },
      error: (error) => {
        //this.isLoading = false;
        console.error('An Error Occured', error);
      },
    });
  }
getSupervisorName(id: number): string {
  const supervisor = this.supervisorOptions.find((s: Supervisor) => s.id === id);
  return supervisor ? supervisor.name : '';
}

onSupervisorSelected(event: any, data: BranchDetails): void {
  const selected = this.supervisorOptions.find(
    (s: Supervisor) => s.id === event.value || s.id === event.itemData?.id
  );
  if (selected) {
    data.supervisorID = selected.id;
    data.employeeName = selected.name; // optional
  }
}

// onUserRoleSelected(data: any) {
//   if (data) {
//     this.allBranchDetails[this.currentBranchDetailsIndex]['mapagemenuDto'] = data.pageMenus;
//     this.allBranchDetails[this.currentBranchDetailsIndex]['maRoleID'] = data.maRoleId;
//     this.currentMaRoleID = data.maRoleId;
//   }

//   this.userRoleDialog.hide();
// }

//   onDialogClose(): void {
//     console.log('Dialog closed');
//     this.userRoleDialog.hide();
//   }

 uploadSettings = {
    saveUrl: '', // Optional if you want backend upload
    removeUrl: '', // Optional if you want backend delete
  };

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
  onImageSelected(event: any) {
    const file: File = event.target.files[0];
  
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      console.error('Only image files are allowed.');
      return;
    }
  
    // Check file size (e.g., 5 MB maximum)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
      console.error('File size exceeds the maximum allowed size.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.imageData = reader.result; 
    };
    reader.readAsDataURL(file);
  }

 removeImage() {
    this.imageData = null;
  }

  override DeleteData(data: PUserModel) {
    console.log('deleted');
    this.deleteUser();
  }

private deleteUser(){
    if(!this.isDelete){
      this.baseService.showCustomDialogue('Permission Denied!');
      return false;
    }
    if(confirm("Are you sure you want to delete this details?")) {
      this.httpService.delete(EndpointConstant.DELETEUSER+this.currentUser.userDetails.id)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => { 
          this.LeftGridInit();
          this.baseService.showCustomDialogue(response.data as any);  
        },
        error: (error) => {
          this.baseService.showCustomDialogue('Please try again');
        },
      });    
    }
    return true;
  }

  override formValidationError(){
    console.log("form error found");
  }

  closeUserRolePopup(): void {
    this.showUserRolePopup = false;
    if (this.userRoleDialog) this.userRoleDialog.hide();
  }
  onActiveFlagChange(event: Event, data: any) {
  const checkbox = event.target as HTMLInputElement;
  data.activeFlag = checkbox.checked;
  // You can add any additional logic here
  console.log('Active flag changed:', data.activeFlag, 'for row:', data);
}
onKeyDown(event: KeyboardEvent, data: any, field: string) {
  if (event.key === 'Enter' || event.key === 'Tab') {
    console.log(`${field} updated for row:`, data);
  }
}
 openPopup(maRoleId: number, allRights: any[]) {
    this.currentMaRoleID = maRoleId;
    this.allUserRights = allRights;

    this.showChild = false;           // reset
    this.userRoleDialog.show();       // open dialog
  }

  onDialogOpen() {
    // wait for dialog to fully open, THEN load child
    setTimeout(() => {
      this.showChild = true;
    });
  }

  onDialogClose() {
    this.showChild = false;   // remove child from DOM
  }

  onUserRoleSelected(event: any) {
    console.log("Returned Data:", event);
  }
  ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
}

