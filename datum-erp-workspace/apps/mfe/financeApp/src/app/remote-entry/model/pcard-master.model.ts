export interface ALLCARDMASTERS {
    id: number;
    accountName: string;
    description: string;
  }
  
  export interface CARDMASTER {
    id: number;
    accountID: number;
    description: string;
    commission: number;
    accountName: string;
    default: any; 
  }
  
  export interface ACCOUNTNAME{
    alias: string;
    name: string;
    id: number;
  }
  