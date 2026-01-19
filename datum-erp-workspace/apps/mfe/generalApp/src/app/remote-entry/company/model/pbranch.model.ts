export interface PBranchByIdModel {
    id: number;
    company?: string;
    nature?: string;
    branchName?: string;
    activeFlag?: number;
  }
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

export interface BranchType1 {
    key: string;
    value: string;
}
export interface Branches {
  id: number;
  company?: string;
  branchName?: string;
  activeFlag?: number;
}
export interface BranchSaveDto{
        companyName: string;
        contactPerson: ContactPerson;
        branchType: BranchType1;
        addressLineOne: string;
        addressLineTwo: string;
        city: string;
        country: Country;
        pObox: string;
        telephone: string;
        mobile: string;
        emailAddress: string;
        faxNo: string;
        remarks: string;
        vatNo: string;
        centralSalesTaxNo: string;
        uniqueId: string;
        reference: string;
        bankCode: string;
        dl1: string;
        dl2: string;
        arabicName: string;
        hocompanyName: string;
        hocompanyNameArabic: string;
        buildingNo: string;
        district: string;
        province: string;
        countryCode: string;
        active: number;
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

