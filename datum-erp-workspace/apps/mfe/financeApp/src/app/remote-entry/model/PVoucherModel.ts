export interface PVoucherModel {
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

export interface PaymentDetailsModel {
  AccountName: string;
  Description: string;
  Amount: number;
  TranType: string;
}

export interface AccountMasterModel {
  accountCode: string;
  accountName: string;
  details: string;
  id: number;
  isBillWise: boolean;
  isCostCentre: boolean;
}

export interface UnpaidPOModel {
  selection: boolean;
  invoiceNo: string;
  invoiceDate: string;
  partyInvNo: string | null;
  partyInvDate: string | null;
  description: string | null;
  account: string | null;
  invoiceAmount: number;
  allocated: number;
  amount: number;
  balance: number;
  // Additional fields from API (for internal use)
  vid?: number;
  veid?: number;
  accountID?: number;
  drCr?: string;
}

export interface POAllocation {
  selection: boolean;
  invoiceNo: string;
  invoiceDate: string;
  partyInvNo: string | null;
  partyInvDate: string | null;
  description: string | null;
  account: string | null;
  invoiceAmount: number;
  allocated: number;
  amount: number;  // This is the allocated amount
  balance: number;
  vid: number;
  veid: number;
  accountID: number;
  drCr: string;
}

export interface POAllocationResult {
  totalAllocatedAmount: number;
  allocations: POAllocation[];
  invoiceNosString: string;
}