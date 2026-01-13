  export interface BranchDto {
    id: number;
    name: string;
  }

  
export interface ContactPerson {
    id: number;
    name: string;
}

export interface BranchType {
    value: string;
    name: string;
}

export interface Country {
    id: number;
    value: string;
}


export interface Branches {
  id: number;
  company?: string;
  branchName?: string;
  activeFlag?: number;
}


export interface Branch {
    id: number;
    company: string;
    nature: string;
    contactPersonID: number,
    addressLineOne: string,
    addressLineTwo: string,
    city: string,
    country: string,
    poBox: string,
    telephoneNo: string,
    mobileNo: string,
    emailAddress: string,
    faxNo: string,
    remarks: string,
    createdBy: number,
    createdOn: Date,
    activeFlag: number,
    salesTaxNo: number,
    centralSalesTaxNo: string,
    uniqueID: string,
    reference: string,
    bankCode: string,
    imagePath: string,
    dL1: string,
    dL2: string,
    arabicName: string,
    hoCompanyName: string,
    hoCompanyNameArabic:string,
    bulidingNo: string,
    district: string,
    province: string,
    countryCode: string
}

export interface Departments {
    id: number;
    department: string;
}

export interface Department {
    id: number;
    departmentTypeID: number;
    departmentType: string;
    companyID: number;
    company: string;
    createdBy: number;
    createdOn: string;
    activeFlag:number
}

export interface DepartmentDropdown {
    id: number;
    name: string;
}

export interface DepartmentPopup {
    id: number;
    name: string;
}
