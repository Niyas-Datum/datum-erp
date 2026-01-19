  export interface PUserModel {
      id: number;
      fullName: string;
      role: string;
      imagePath: string;
      active: boolean;
  }



  export interface UserDetails {
    id: number;
    firstName: string;
    middleName: string | null;
    lastName: string;
    address: string;
    emailID: string;
    residenceNumber: string | null;
    officeNumber: string | null;
    mobileNumber: string;
    designationID: number;
    active: boolean;
    employeeType: number;
    userName: string;
    password: string;
    gmailID: string;
    isLocationRestrictedUser: boolean;
    photoID: string | null;
    createdBranchID: string | null;
    createdBy: number;
    createdOn: string;
    accountID: number;
    accountCode: string;
    accountName: string;
    imagePath: string;
    cashAccountId: number,
    warehouseId: string
  }

  export interface BranchDetails {
    id: number;
    employeeID: number;
    branchID: number;
    branchName: string;
    employeeName: string;
    departmentName: string;
    departmentID: number;
    createdBy: number;
    createdOn: string;
    activeFlag: boolean;
    isMainBranch: boolean;
    supervisorID: number;
    maRoleID: number;
  }

  export interface UserRights {
    id: number;
    userDetailsID: number;
    pageMenuID: number;
    pageName: string;
    moduleType: string;
    isView: boolean;
    isCreate: boolean;
    isEdit: boolean;
    isCancel: boolean;
    isDelete: boolean;
    isApprove: boolean;
    isEditApproved: boolean;
    isHigherApprove: boolean;
    isPrint: boolean;
    isEmail: boolean | null;
    frequentlyUsed: boolean | null;
    isPage: boolean;
  }

  export interface UserData {
    userDetails: UserDetails;
    branchDetails: BranchDetails[];
    userRights: UserRights[];
    locationRestrictions: any[]; // You can replace 'any' with a more specific type if needed
  }


  export interface EmployeeType{
    value:number;
    name:string;
  }

  export interface Supervisor{
    id:number;
    name:string;
  }

  export interface PageMenu{
    pageMenuID: number;
    isPage: boolean;
    pageName: string;
    moduleType: string;
    isCreate: boolean;
    isView: boolean;
    isCancel: boolean;
    isDelete: boolean;
    isEditApproved: boolean;
    isEdit: boolean;
    isApprove: boolean;
    isHigherApprove: boolean;
    isPrint: boolean;
    isEmail:boolean;
    frequentlyUsed:boolean;
    [key: string]: any;
   }

   export interface UserRoles{
    id: number;
    role: string;
   }

  export interface AccountPopup{
    alias:string,
    name:string,
    id:number
  }

  export interface PettyCash{
    id: number;
    listID: number;
    accountID: number;
    branchID: number;
    alias: string;
    name: string;
  }

  export interface Warehouse{
    id: number;
    code: string;
    name: string;
  }