export interface PCustomerSupplierModel {
    id: number;
    code: string;
    name: string;
    accountID: number;
    imagePath: string;
    nature: string;
}
export interface Pcustomersuppliergettype{
    id: number;
    description: string;
}
export interface PCustomerSupplierSaveDto {
    id: number;
    type: {
        id: number;
        description: string;
    };
    category: {
        id: number;
        value: string;
    };
    code: string;
    salutation: string;
    active: boolean;
    name: string;
    arabicName: string;
    contactPersonName: string;
    telephoneNo: string;
    addressLineOne: string;
    addressArabic: string;
    mobileNo: string;
    vatno: string;
    creditPeriod: number;
    creditLimit: number;
    salesMan: number;
    city: string;
    poBox: string;
    countryCode: string;
    country: {
        id: number;
        value: string;
    };
    bulidingNo: string;
    district: string;
    districtArabic: string;
    cityArabic: string;
    provinceArabic: string;
    area: {
        id: number;
        name: string;
    };
    province: string;
    faxNo: string;
    contactPerson2: string;
    emailAddress: string;
    telephoneNo2: string;
    centralSalesTaxNo: string;
    actasSupplierAlso: boolean;
    panNo: string;
    letSystemGenNewAccForParty: boolean;
    accountGroup: {
        id: number;
        name: string;
    };
    account: {
        id: number;
        name: string;
    };
    remarks: string;
    image: string;
    customerDetails: {
        commoditySought: Array<{
            id: number;
            value: string;
        }>;
        salesType: {
            key: string;
            value: string;
        };
        quantityPlanned: number;
        basicUnit: number;
        creditCollectionType: {
            key: string;
            value: string;
        };
        dL1: string;
        dL2: string;
        priceCategory: {
            id: number;
            name: string;
        };
        placeOfSupply: {
            id: number;
            value: string;
        };
        businessType: {
            key: string;
            value: string;
        };
        availedAnyLoanLimits: {
            key: string;
            value: string;
        };
        businessNature: {
            key: string;
            value: string;
        };
        otherMerchantsOfCustomer: string;
        businessAddress: {
            key: string;
            value: string;
        };
        valueOfProperty: number;
        yearsOfBusiness: number;
        yearlyTurnover: number;
        marketReputation: {
            key: string;
            value: string;
        };
        categoryRecommended: {
            id: number;
            name: string;
        };
        limitRecommended: number;
        categoryFixed: {
            id: number;
            name: string;
        };
        limitFixedForCustomer: number;
        creditPeriodPermitted: number;
        overdueAmountLimit: number;
        overduePeriodLimit: number;
        chequeBounceCountLimit: number;
        salesPriceLowVarLimit: number;
        salesPriceUpVarLimit: number;
    };
    deliveryDetails: Array<{
        delId: number;
        locationName: string;
        projectName: string;
        contactPerson: string;
        contactNo: string;
        address: string;
    }>;
}
export interface Country {
    id: number;
    value: string;
}
export interface PCustomerSupplierFetchbyIdModel {
    result: {
    id: number;
    name: string;
    contactPerson?: string | null;
    nature?: string | null;
    addressLineOne?: string | null;
    addressLineTwo?: string | null;
    city?: string | null;
    country?: number | null;
    pobox?: string | null;
    remarks?: string | null;
    telephoneNo?: string | null;
    mobileNo?: string | null;
    emailAddress?: string | null;
    faxNo?: string | null;
    active: boolean;
    panNo?: string | null;
    salesTaxNo?: string | null;
    centralSalesTaxNo?: string | null;
    salutation?: string | null;
    contactPerson2?: string | null;
    telephoneNo2?: string | null;
    companyID?: number | null;
    branchID?: number | null;
    createdBy?: number | null;
    createdOn?: string | null;
    isMultiNature?: boolean;
    imagePath?: string | null;
    code: string;
    accountID: number;
    dL1?: string | null;
    dL2?: string | null;
    areaID?: number | null;
    bulidingNo?: string | null;
    district?: string | null;
    province?: string | null;
    countryCode?: string | null;
    area?: string | null;
    creditLimit?: number | null;
    priceCategoryID?: number | null;
    placeOfSupply?: string | null;
    arabicName?: string | null;
    salesManID?: number | null;
    salesMan?: string | null;
    partyCategoryID?: number | null;
    districtArabic?: string | null;
    cityArabic?: string | null;
    provinceArabic?: string | null;
    custDetails: PCustomerSupplierDetailDto[];
    img: string | null;
    delDetails: PCustomerSupplierDeliveryDto[];
    accountGroup: PCustomerSupplierAccountGroupDto[];
    commoditySought: PCustomerSupplierCommodityDto[];
    }
}

export interface PCustomerSupplierDetailDto {
    id: number;
    partyID: number;
    plannedPcs: number | null;
    plannedCFT: number | null;
    cashCreditType: string | null;
    creditPeriod: number | null;
    creditCollnThru: string | null;
    busPrimaryType: string | null;
    busRetailType: string | null;
    busYears: number | null;
    busYearTurnover: number | null;
    isLoanAvailed: boolean | null;
    mainMerchants: string | null;
    addressOwned: string | null;
    valueofProperty: number | null;
    marketReputation: string | null;
    bandByImportID: number | null;
    salesLimitByImport: number | null;
    bandByHOID: number | null;
    salesLimitByHO: number | null;
    creditPeriodByHO: number | null;
    overdueLimitPerc: number | null;
    overduePeriodLimit: number | null;
    chequeBounceLimit: number | null;
    salesPriceLowVarPerc: number | null;
    salesPriceUpVarPerc: number | null;
}

export interface PCustomerSupplierAccountGroupDto {
    id: number;
    name: string;
}

export interface PCustomerSupplierCommodityDto {
    id: number;
    description: string;
}

export interface PCustomerSupplierDeliveryDto {
    delId: number;
    locationName: string;
    projectName: string;
    contactPerson: string;
    contactNo: string;
    address: string;
}
export interface CUSTOMERSUPPLIERS {
    id: number;
    code: string;
    name: string;
    accountID: number;
    imagePath: string;
    nature: string;
}
 
export interface CUSTOMERSUPPLIER {
    id: number;
    name: string;
    contactPerson: string | null;
    nature: string;
    addressLineOne: string | null;
    addressLineTwo: string | null;
    city: string | null;
    country: number;
    pobox: string | null;
    remarks: string | null;
    telephoneNo: string | null;
    mobileNo: string | null;
    emailAddress: string | null;
    faxNo: string | null;
    active: boolean;
    panNo: string | null;
    salesTaxNo: string | null;
    centralSalesTaxNo: string | null;
    salutation: string | null;
    contactPerson2: string | null;
    telephoneNo2: string | null;
    companyID: number;
    branchID: number;
    createdBy: number;
    createdOn: string;
    isMultiNature: boolean | null;
    imagePath: string;
    code: string;
    accountID: number;
    dL1: string | null;
    dL2: string | null;
    areaID: number;
    bulidingNo: string | null;
    district: string | null;
    province: string | null;
    countryCode: string | null;
    area: string;
    creditLimit: number | null;
    priceCategoryID: number | null;
    placeOfSupply: string;
    arabicName: string | null;
    salesManID: number | null;
    salesMan: string | null;
    partyCategoryID: number;
}
 
export interface CUSTOMERSUPPLIERTYPE {
    id: number;
    description: string;
}
 
export interface CUSTOMERSUPPLIERCATEGORIES {
    id: number;
    value: string;
}
 
export interface CUSTOMERPRICECATEGORIES {
    id: number;
    name: string;
}
 
export interface CUSTOMERCATEGORIES {
    id: number;
    name: string;
}
 
export interface CUSTOMERCOMMODITY {
    id: number;
    description: string;
    code: string;
}
 
export interface CUSTOMERCOUNTRIES {
    id: number;
    value: string;
}
 
export interface CREDITCOLLECTION {
    id: number;
    value: string;
    description: string;
}
 
export interface SALESMAN{
    id: number;
    name: string;
    code: string;
}
 
export interface AREA{
    id: number;
    name?: string;
    value: string;
    code:string;
}
 export interface AREAGROUPPOPUP {
    id: number;
    code: string;
    value: string;
  }
 
export interface ACCOUNTGROUP{
    id: number;
    name: string;
}
 
export interface ACCOUNT{
    id: number;
    date: string;
    name: string;
    narration: string | null;
    isGroup: boolean;
    subGroup: any; // Change the type if subGroup has a specific type
    accountCategory: number;
    parent: number;
    createdBy: number;
    createdBranchID: any; // Change the type if createdBranchID has a specific type
    createdOn: string;
    isBillWise: boolean;
    active: boolean;
    alias: string;
    accountTypeID: any; // Change the type if accountTypeID has a specific type
    sortField: number;
    level: number;
    finalAccount: boolean;
    accountGroup: number;
    systemAccount: boolean;
    preventExtraPay: any; // Change the type if preventExtraPay has a specific type
    alternateName: string;
}
 
export interface DELIVERYDETAILS{
  delId: number;
  locationName: string;
  projectName: string;
  contactPerson: string;
  contactNo: string;
  address: string;
}
 
export interface PLACEOFSUPPLY {
    id: number;
    value: string;
}
 
 
 
 
 
 
 
 