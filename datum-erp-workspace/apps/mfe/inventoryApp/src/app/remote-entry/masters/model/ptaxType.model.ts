export interface TaxTypeAcDrpDwn{
    ID:number,
    Name:string,
Alias:string,
   }
   export interface TaxTypeDrpDwn{
    ID:number,
    Value:string,
   }
   export interface TaxTypeMaster{
    id:number,
    name:string,
    type:string,
    active:boolean,
    isDefault:boolean,
    purchasePerc:number,
    salesPerc: number
    receivableAccountID:number,
    payableAccountID:number,
    salePurchaseModeID:number,
    taxAccountID:number,
    sgstReceivableAccountID:number,
    cgstReceivableAccountID:number,
    sgstPayableAccountID:number,
    cgstPayableAccountID:number,
    cessPerc:number,
    cessReceivable:number,
    cessPayable:number,
    description:string,
    taxMiscID:number,
   }
   export interface TaxTypeFillMaster{
    ID:number,
    Name:string,
    Type:string
   }