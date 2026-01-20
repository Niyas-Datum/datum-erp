export interface ItemMasters {
    id: number;
    itemCode: number;
    itemName: string;
    imagePath: string;
    barCode: number;
  }
  
  export interface Item {
  id: number;
  itemCode: string;
  itemName: string;
  sellingPrice: number;
  oemNo: string | null;
  partNo: string | null;
  categoryID: number | null;
  manufacturer: string | null;
  barCode: string | null;
  modelNo: string | null;
  unit: string;
  rol: number | null;
  remarks: string | null;
  isGroup: boolean;
  stockItem: boolean;
  active: boolean;
  invAccountID: number | null;
  purchaseAccountID: number | null;
  costAccountID: number | null;
  salesAccountID: number | null;
  stock: number | null;
  invoicedStock: number | null;
  avgCost: number | null;
  lastCost: number | null;
  createdDate: Date | null;
  createdUserID: number | null;
  modifiedDate: Date | null;
  modifiedUserID: number | null;
  branchID: number | null;
  location: string | null;
  cashPrice: number | null;
  roq: number | null;
  commodityID: number;
  commodityCode: string;
  commodity: string;
  shipMark: string | null;
  paintMark: string | null;
  qualityID: number | null;
  quality: string | null;
  weight: number | null;
  parentID: number;
  parentItem: string;
  margin: number | null;
  purchaseRate: number | null;
  imagepath: string;
  taxTypeID: number;
  taxType: string;
  sizeItem: string | null;
  colorID: number;
  brandID: number;
  colorName: string;
  brandName: string;
  originName: string;
  originID: number;
  isExpiry: boolean;
  expiryPeriod: number | null;
  barcodeDesignId: number | null;
  isFinishedGood: boolean | null;
  isRawMaterial: boolean | null;
  isUniqueItem: boolean;
  purchaseUnit: string;
  sellingUnit: string;
  marginValue: number;
  arabicName: string | null;
  hsn: string | null;
  itemDisc: number | null;
  mrp: number;
  }
  
  interface Unit {
  isValid: boolean;
  exception: any;
  httpCode: number;
  data: any[];
  }
  
  interface History {
  isValid: boolean;
  exception: any;
  httpCode: number;
  data: any[];
  }
  
  interface Stock {
  isValid: boolean;
  exception: any;
  httpCode: number;
  data: { stock: number }[];
  }
  
  export interface ItemMaster {
  item: Item;
  img:string;
  unit: Unit;
  history: History;
  stock: Stock;
  }
  export interface UnitData {
  unit: string;
  basicUnit: string;
  factor: number;
  }
  export interface Category {
  id: number;
  code: string;
  description: string;
  }
  export interface TaxType{
  id:number,
  name:string,
  salesPerc: number
  }
  export interface parentItem{
  id:number,
  itemCode:number,
  itemName:string
  }
  export interface ItemColor{
  id:number,
  code:string,
  value:string
  }
  export interface ItemBrand{
  id:number,
  code:string,
  value:string
  }
  
  export interface CountryOfOrigin{
  id:number,
  code:string,
  value:string
  }
  export interface Account{
  id:number,
  name:string
  }
  
  export interface ItemUnitDetails {
  unitID: number;
  unit: UnitData;
  basicUnit: string | null;
  factor: number;
  sellingPrice: number;
  purchaseRate: number;
  mrp: number;
  wholeSalePrice: number;
  retailPrice: number;
  wholeSalePrice2: number;
  retailPrice2: number;
  lowestRate: number;
  barcode: string | null;
  active: boolean;
  status: number;
  }
  export interface Branches {
  id: number;
  company: string;
  nature: string;
  }
  
  export interface Quality {
  id: number;
  value: string;
  }
  
  export interface ItemHistory {
  vTypeID: number;
  vType: string;
  vid: number;
  vNo: string;
  vDate: string;
  accountID: number;
  accountCode: string;
  accountName: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
  }
  export interface SelectedCategory {
    category: string;
    id:number;
    code:string;
    categoryType:string;
  }
  
  
  
  