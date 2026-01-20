export interface BASICTYPE {
  id: number;
  name: string;
}

export interface VOUCHERTYPE {
  code: string;
  name: string;
  id: number;
  primaryVoucherId: number;
}
export interface ITEMS {
  itemCode: string;
  itemName: string;
  unit: string;
  id: number;
}
export interface STAFF {
  code: string;
  name: string;
  id: number;
}
export interface CUSTOMERSUPPLIER {
  accountCode: string;
  accountName: string;
  id: number;
}
export interface AREA {
  code: string;
  name: string;
  id: number;
}
export interface PAYMENTTYPE {
  id: number;
  name: string;
}
export interface COUNTERS {
  machineName: string;
  counterCode: string;
  counterName: string;
  machineIp: string;
  id: number;
}

export interface USERS {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  emailId: string;
  mobileNumber: string;
}

export interface BRANCHES {
  id: number;
  company: string;
  nature: string;
}

export interface REPORTDATA {
  SlNo: string;
  Type: string;
  VID: string;
  VType: string;
  VNo: string;
  VDate: string;
  RefrenceNo?: string;
  AccountID: string;
  Particulars: string;
  TaxFormID?: string;
  ModeID?: string;
  CounterName?: string;
  Customer?: string;
  PhNo?: string;
  Staff: string;
  Area?: string;
  AddedBy: string;
  VATNO: string;
  PartyInvNo: string;
  Debit?: string;
  Credit?: string;
  isSummaryRow:boolean;
  debit?: string;
  credit?: string;
}



