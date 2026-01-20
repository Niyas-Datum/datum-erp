export interface CategoryTypeDto{
      ID:number;
      code:string;
      description:string;
      active:number;
      notes:string;
}
export interface CategoryType{
      id:number;
      code:string;
      description:string;
}
  export interface CATEGORIES {
    id: number;
    description: string;
    code: string;
  }

  export interface CATEGORY{
    id: number;
    description: string;
    typeofWoodId: number;
    typeCode: string;
    typeName: string;
    category: string;
    categoryName: string;
    createdBy: number;
    createdOn: string; // ISO 8601 date string
    activeFlag: number;
    code: string;
    measurementType: string | null;
    minQty: number | null;
    maxQty: number | null;
    floorRate: number | null;
    minusStock: number;
    startDate: string | null; // ISO 8601 date string or null
    endDate: string | null; // ISO 8601 date string or null
    discount: number | null;
  }