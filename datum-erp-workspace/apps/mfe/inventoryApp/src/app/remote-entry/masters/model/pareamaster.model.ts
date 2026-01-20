  export interface AREAMASTERS {
    id: number;
    code: string;
    name: string;
    isGroup: boolean;
  }

  export interface PAreamasterModel {
    id: number;
    code: string;
    name: string;
    note: string;
    parentId: number;
    isGroup: boolean;
    parentName: string;
    createdBy: number;
    createdBranchId: number;
    createdOn: string; // ISO date string format
    active: boolean;
  }
  export interface AREAGROUPPOPUP {
    id: number;
    code: string;
    value: string;
  }
  

  

  