/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface Purchases {
    ID: number;
    TransactionNo: string;
    Date: string;
    Amount: string;
    Cancelled: string;
    EntryNo: string;
    EntryDate: string;
    AccountName: string;
    Phone: string;
    Status: string;
    SerialNo: string;
    VATNo: string;
  }

  export interface Projects{
    projectcode: number;
    projectname: string;
    id: string;
  }

  export interface Warehouse{
    id: number;
    name: string;
    isDefault: boolean;
    value?:string;
  }

  export interface Salesman{
    code: string;
    name: string;
    id: number;
  }

  export interface SalesmanMobile{
    code: string;
    name: string;
    id: number;
  }

  export interface Supplier{
    id: number;
    partyID: number;
    accountCode: string;
    accountName: string;
    address: string;
    mobileNo: string | null;
    vatNo: string | null;
    accBalance: number;  
  }

  export interface CustomerMobile{
    id: number;
    partyID: number;
    accountCode: string;
    accountName: string;
    salesManID: number;
    vatNo: string | null;
  }
  export interface Customer{
    id: number;
    partyID: number;
    accountCode: string;
    accountName: string;
    address: string;
    mobileNo: string | null;
    salesManID: number;
    vatNo: string | null;
    accBalance: number;  
  }

  export interface VoucherType{
    id: number;
    name: string;
  }

  export interface PayType{
    id: number;
    name: string;
  }

  export interface chequePopup{
    alias: string;
    name: string;
    id:number;
  }

  export interface cardPopup{
    alias: string;
    name: string;
    id:number;
  }

  export interface cashPopup{
    accontcode: string;
    accontname: string;
    id:number;
  }

  export interface bankPopup{
    accontcode: string;
    accontname: string;
    id:number;
  }

  export interface additonalChargesPopup{
    accontcode: string;
    accontname: string;
    id:number;
  }

  export interface taxPopup{
    taxid:number,
    accountCode: {
      alias:string,
      name:string,
      id:number
    },
    discription: string;
    amount:number;
    payableAccount:{}
  }

  export interface DeliveryLocation {
    id: number;
    locationname: string;
    projectname: string;
    contactperson: string;
    contactno: string;
    address: string;
  }

  export interface VehicleNo{
    vehicleNo: string,
    name: string,
    id: number
  }

  export interface Items {
    item:{
      id: number;
      itemCode: string;
      itemName: string;
      location: string | null;
      unit: string;
      stock: number;
      rate: number;
      purchaseRate: number;
      taxPerc: number;
      taxTypeID: number;
      factor: number;
      taxAccountID: number | null;
      avgCost: number | null;
      expiryDate: string;
      arabicName: string | null;
      partNo: string | null;
      oemNo: string | null;
      remarks: string | null;
      costAccountID: number | null;
      brandID: number;
      printedRate: number | null;
      brandName: string;
      discountAmt: number | null;
      discountPerc: number | null;
      barCode: string | null;
      categoryID: number | null;
      qty: number;
      modelNo: string | null;
      sellingPrice: number;
    },
    uniqueItem: string,
    expiryItem: {
      expiryPeriod: string,
      isExpiry: string
    },
    unitPopup: UnitPopupItem[];
  }

  interface UnitPopupItem {
    id: number;
    unit: string;
    basicUnit: string;
    factor: number;
    sellingPrice: number;
    purchaseRate: number;
    mrp: number;
  }

  export interface ItemOptions {
    id: number;
    itemCode: string;
    itemName: string;
    location: string | null;
    unit: string;
    stock: number;
    rate: number;
    purchaseRate: number;
    taxPerc: number;
    taxTypeID: number;
    factor: number;
    taxAccountID: number | null;
    avgCost: number | null;
    expiryDate: string;
    arabicName: string | null;
    partNo: string | null;
    oemNo: string | null;
    remarks: string | null;
    costAccountID: number | null;
    brandID: number;
    printedRate: number | null;
    brandName: string;
    discountAmt: number | null;
    discountPerc: number | null;
    barCode: string | null;
    categoryID: number | null;
    qty: number;
    modelNo: string | null;
    sellingPrice: number;
  }

  export interface Purchase{
    transaction:{
      fillTransactions:FillTransactions,
      fillAdditionals:fillTransactionAdditional,
      fillTransactionEntries:FillTransactionEntries[],
      fillVoucherAllocationUsingRef: string | null,
      fillCheques: string | null,
      fillTransCollnAllocations: string | null,
      fillInvTransItems:FillInvTransItems[],
      fillInvTransItemDetails: string | null,
      fillTransactionItemExpenses: string | null,
      fillDocuments: string | null,
      fillTransactionExpenses: string | null,
      fillDocumentRequests: string | null,
      fillDocumentReferences: string | null,
      fillTransactionReferences: string | null,
      fillTransLoadSchedules: string | null,
      fillTransCollections: string | null,
      fillTransEmployees: string | null,
      vMFuelLog: string | null,
      fillDocumentImages: string | null,
      fillHRFinalSettlement: string | null,
      fillTransCostAllocations: string | null
    },
    payment:{
      data:Payment
    },
    cheque:{
      data:Payment
    }
    
  }

  export interface Payment {
    ID: string;
    TransactionID: string;
    DrCr: string;
    Nature: string;
    AccountID: string;
    DueDate: string;
    Alias: string;
    Name: string;
    Amount: string;
    Debit: string;
    Credit: string;
    FCAmount: string;
    BankDate: string;
    RefPageTypeID: string;
    CurrencyID: string;
    ExchangeRate: string;
    RefPageTableID: string;
    ReferenceNo: string;
    Description: string;
    TranType: string;
    IsBillWise: string;
    RefTransID: string;
    TaxPerc: string;
    ValueOfGoods: string;
}

  export interface FillTransactions {
    id: number;
    date: string;
    effectiveDate: string;
    voucherID: number;
    serialNo: number;
    transactionNo: string;
    isPostDated: boolean;
    currencyID: number;
    exchangeRate: number;
    refPageTypeID: any;
    refPageTableID: any;
    referenceNo: any;
    companyID: number;
    finYearID: any;
    instrumentType: any;
    instrumentNo: any;
    instrumentDate: any;
    instrumentBank: any;
    commonNarration: any;
    addedBy: number;
    approvedBy: any;
    addedDate: string;
    approvedDate: any;
    approvalStatus: any;
    approveNote: any;
    action: any;
    statusID: number;
    isAutoEntry: boolean;
    posted: boolean;
    active: boolean;
    cancelled: boolean;
    accountID: number;
    accountCode: string;
    accountName: string;
    description: any;
    status: string;
    createdEmployee: string;
    approvedEmployee: any;
    editedEmployee: any;
    currency: string;
    refTransID: any;
    refCode: any;
    costCentreID: any;
    projectCode: any;
    projectName: any;
    costCategoryID: any;
    allocateRevenue: any;
    allocateNonRevenue: any;
    pageID: number;
    accountNameArabic: any;
  }
  
  export interface FillTransactionEntries {
    id: number;
    transactionId: number;
    drCr: string;
    nature: any;
    accountId: number;
    dueDate: any;
    alias: number;
    name: string;
    amount: number;
    debit: number;
    credit: any;
    fcAmount: number;
    bankDate: any;
    refPageTypeID: any;
    currencyId: number;
    exchangeRate: number;
    refPageTableId: any;
    referenceNo: any;
    description: any;
    tranType: string;
    isBillWise: any;
    refTransId: any;
    taxPerc: any;
    valueOfGoods: number;
  }
  
  export interface FillInvTransItems {
    id: number;
    transactionId: number;
    itemId: number;
    serialNo: number;
    itemName: string;
    uniqueNo: any;
    barCode: string;
    refTransId1: any;
    unit: string;
    priceCategoryId: any;
    qty: number;
    pcs: any;
    rate: number;
    proformaAmount: number;
    advanceRate: any;
    otherRate: any;
    masterMiscId1: any;
    rowType: number;
    refCode: string;
    description: any;
    remarks: any;
    isBit: any;
    itemCode: string;
    stockType: any;
    categoryType: string;
    commodity: string;
    category: string;
    lengthCm: any;
    lengthFt: any;
    lengthIn: any;
    thicknessCm: any;
    thicknessFt: any;
    thicknessIn: any;
    girthFt: any;
    girthIn: any;
    girthCm: any;
    poLotQty: number;
    selection: boolean;
    quality: any;
    lotStatus: string;
    status: any;
    invAvgCostId: any;
    additional: any;
    discount: number;
    isReturn: any;
    factor: number;
    qtyPrecision: number;
    basicQtyPrecision: number;
    margin: any;
    rateDisc: any;
    totalAmount: number;
    amount: number;
    grossAmount: number;
    discountPerc: number;
    taxPerc: number;
    tranType: string;
    sizeMasterId: any;
    taxValue: number;
    taxTypeId: number;
    costPerc: any;
    inLocId: number;
    outLocId: any;
    batchNo: string;
    sizeMasterName: any;
    taxAccountId: number;
    manufactureDate: any;
    expiryDate: any;
    orderQty: any;
    focQty: any;
    refId: any;
    refTransItemId: any;
    stockQty: number;
    basicQty: number;
    tempQty: number;
    tempRate: number;
    replaceQty: any;
    printedMrp: any;
    printedRate: any;
    ptsRate: any;
    ptrRate: any;
    tempBatchNo: any;
    stockItemId: any;
    stockItem: any;
    arabicName: any;
    location: any;
    unitArabic: string;
    costAccountId: any;
    cgstPerc: any;
    cgstValue: any;
    sgstPerc: any;
    sgstValue: any;
    hsn: any;
    brandId: any;
    brandName: string;
    complaintNature: any;
    accLocation: any;
    repairsRequired: any;
    outLocation: any;
    exchangeRate: number;
    measuredById: any;
    cessAccountId: any;
    cessPerc: any;
    cessValue: any;
    modelNo: any;
    avgCost: any;
    profit: any;
    finishDate: any;
    updateDate: any;
    parentId: any;
    parentName: any;
  }

  export interface fillTransactionAdditional{
    transactionID: number;
    refTransID1: number | null;
    refTransID2: number | null;
    typeID: number | null;
    modeID: number;
    measureTypeID: number | null;
    loadMeasureTypeID: number | null;
    consignTermID: number | null;
    fromLocationID: number | null;
    toLocationID: number;
    exchangeRate1: number | null;
    advanceExRate: number | null;
    customsExRate: number | null;
    approvalDays: number | null;
    workflowDays: number | null;
    postedBranchID: number | null;
    shipBerthDate: string | null;
    isBit: boolean | null;
    name: string | null;
    code: string | null;
    address: string;
    rate: number | null;
    systemRate: number;
    period: string | null;
    days: number | null;
    lcOptionID: number | null;
    lcNo: string;
    lcAmt: number | null;
    availableLCAmt: number | null;
    creditAmt: number | null;
    marginAmt: number;
    interestAmt: number | null;
    availableAmt: number;
    allocationPerc: number;
    interestPerc: number;
    tolerencePerc: number;
    countryID: number | null;
    country: string | null;
    countryOfOriginID: number | null;
    maxDays: number | null;
    documentNo: string | null;
    documentDate: string | null;
    beMaxDays: number | null;
    entryDate: string | null;
    entryNo: string | null;
    applicationCode: string | null;
    bankAddress: string | null;
    unit: string | null;
    amount: number | null;
    acceptDate: string | null;
    expiryDate: string | null;
    dueDate: string | null;
    openDate: string | null;
    closeDate: string | null;
    startDate: string | null;
    endDate: string | null;
    clearDate: string | null;
    receiveDate: string | null;
    submitDate: string | null;
    endTime: string | null;
    handOverTime: string | null;
    lorryHireRate: number | null;
    qtyPerLoad: number | null;
    passNo: string | null;
    referenceDate: string | null;
    referenceNo: string | null;
    auditNote: string | null;
    terms: string | null;
    firmID: number | null;
    vehicleID: number | null;
    weekDays: string | null;
    bankWeekDays: string | null;
    recommendByID: number | null;
    recommendDate: string | null;
    recommendNote: string | null;
    recommendStatus: string | null;
    isHigherApproval: boolean | null;
    lcApplnTransID: number | null;
    inLocID: number;
    outLocID: number | null;
    exchangeRate2: number | null;
    lcAppNo: string | null;
    lcOptionCode: string | null;
    fromLocation: string | null;
    saleSite: string | null;
    locTypeID: number | null;
    refCode: string | null;
    refCode1: string | null;
    accountID: number | null;
    routeID: number | null;
    accountID2: number | null;
    accountName: string;
    vehicleName: string | null;
    account2Name: string | null;
    hours: number | null;
    year: number | null;
    areaID: number | null;
    otherBranchID: number | null;
    branchName: string | null;
    area: string | null;
    taxFormID: number | null;
    priceCategoryID: number | null;
    priceCategory: string | null;
    isClosed: boolean;
    departmentID: number | null;
    department: string | null;
    partyName: string | null;
    address1: string | null;
    address2: string | null;
    itemID: number | null;
    itemName: string | null;
    equipMentName: string | null;
    vatNo: string;
  }

  export interface Reference {
    sel: boolean;
    addItem: boolean;
    voucherID: number;
    vNo: string;
    vDate: string; // You can use Date if you convert the string to a Date object
    referenceNo: string | null;
    accountID: number;
    accountName: string;
    amount: number;
    partyInvNo: string | null;
    partyInvDate: string | null; // You can use Date if you convert the string to a Date object
    id: number;
    voucherType: string;
    mobileNo: string | null;
  }

  export interface itemTransaction {
    batchNo: string;
    priceCategory: PriceCategory[];
  }

  interface PriceCategory {
    id: number;
    rate: number | null;
    priceCategory: string;
    perc: number;
  }

  export interface UnitPopup {
    id: number;
    unit: string;
    basicUnit: string;
    factor: number;
    sellingPrice: number;
    purchaseRate: number;
    mrp: number;
  }

  export interface UnitPricePopup{
    id: number;
    itemID: number;
    unit: string;
    basicUnit: string;
    factor: number;
    sellingPrice: number;
    purchaseRate: number;
    mrp: number;
    wholeSalePrice: number;
    retailPrice: number;
    discountPrice: number;
    otherPrice: number;
    lowestRate: number;
    barcode: string;
    active: boolean;
  }

  export interface StockItems{
    id: number,
    itemCode: string,
    itemName: string
  }

  export interface Currency{
    currencyID: number;
    abbreviation: string;
    currencyRate: number;
    defaultCurrency: boolean;
    precision: number;
    culture: string;
    formatString: string;
  }

  export interface SizeMaster{
    code: string;
    sizeMasterName: string;
    id: number;
  }

  export interface GridSettings{
    id: number;
    formName: string;
    gridName: string;
    columnName: string;
    originalCaption: string;
    newCaption: string;
    visible: boolean;
    pageId: number;
    branchId: number | null;
    arabicCaption: string | null;
  }
  
  
  export interface CustomerInfo{
    id:number;
    code:string;
    name:string;
    arabicName:string;
    addressLineOne:string;
    addressLineTwo:string;
    contactPerson:string;
    city:string;
    country:string;
    pobox:string;
    telephoneNo:string;
    mobileNo:string;
    emailAddress:string;
    salesTaxNo:string;
    centralSalesTaxNo:string;
    contactPerson2:string;
    telephoneNo2:string;
    area:string;
    areaArabic:string;
    salesManId:number;
    salesmanName:string;
    bulidingNo:string;
    district:string;
    province:string;
    cityArabic:string;
    provinceArabic:string;
  }
