 export interface USERSPOP {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    emailId: string;
    mobileNumber: string;
  }

  export interface ACCOUNTSPOPUP{
    id:number;
    accountName:string;
    accountCode:string;
    details:string;
    isBillWise:boolean;
    isCostCentre:boolean;
  }

  export interface AccountStatementRow {
   
//   vDate: string;
//   vNo: string;
//   commonNarration: string;
//   narration: string;
//   particulars: string;
//   debit: number;
//   credit: number;
//   rBalance: number;
}
 export interface REPORTDATA {
    [key: string]: any; 
    vid: number;           
    veid: number;          
    accountID: number;     
    refNo: string;         
    narration: string | null;
    particulars: string;   
    rBalance: number;      
    user: string;         
    vType: string;         
    vDate: string;         
    vNo: string;           
    commonNarration: string | null; 
    debit: number;         
    credit: number | null; 
  }

  export interface VOUCHERTYPE{
    id:number;
    name:string;
  }

  export interface ACCGROUP{
    accountID:number,
    accountCode:string,
    accountName:string
  }

  export interface AccountCategory {
  id: number;
  description: string;
}
