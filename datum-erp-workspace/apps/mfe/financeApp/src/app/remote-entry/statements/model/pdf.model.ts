export interface PdfColumn {
  header: string;
  field: string;
  align?: 'left' | 'right' | 'center';
  format?: 'date' | 'amount';
}

export interface PdfReportData {
  companyName: string;
  address: string;
  pageName: string;
  fromDate: string;
  toDate: string;
  columns: PdfColumn[];
  rows: any[];
  showTotals?: boolean;
}
