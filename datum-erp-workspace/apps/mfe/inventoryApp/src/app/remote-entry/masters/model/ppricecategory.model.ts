

export interface PRICECATEGORY{
    ID:number;
    Name : string;
    Perc : number;
}

// export interface SELLINGPRICE{
//     value: string;
//     label: string;
// }

export interface PRICECATEGORIES{
        id : number;
        name:string;
        perc:number;
        note:string;
        active:boolean;
        createdBy :number;
        createdon:Date;
        createdBranchId:number;

}