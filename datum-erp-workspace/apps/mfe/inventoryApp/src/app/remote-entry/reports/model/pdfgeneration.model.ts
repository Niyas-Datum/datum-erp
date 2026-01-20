//  export interface GeneralRegisterRow {
//   vDate: string;
//   vNo: string;
//   vatNo: string;
//   particulars: string;
//   debit: number;
//   credit: number;
// }

// export interface GeneralRegisterData {
//   companyName: string;
//   address: string;
//   fromDate: string;
//   toDate: string;
//   rows: GeneralRegisterRow[];
// }

// export interface PdfReportRow {
//   debit?: number;
//   credit?: number;

//   // inventory fields
//   Debit?: number;
//   Credit?: number;

//   [key: string]: any; // allow dynamic columns
// }

// export interface PdfReportData {
//   pageName: string;
//   companyName: string;
//   address: string;
//   fromDate: string;
//   toDate: string;
//   columns: {
//     headerText: string;
//     field: string;
//     textAlign?: 'Left' | 'Right' | 'Center';
//   }[];
//   rows: PdfReportRow[];
// }


export interface PdfColumn {
  header: string;
  field: string;
  align?: 'left' | 'right' | 'center';
}

export interface PdfReportData {
  pageName: string;
  companyName: string;
  address: string;
  fromDate: string;
  toDate: string;

  columns: PdfColumn[];
  rows: any[];

  showTotals?: boolean;
}
