export interface PCurrencyModel {
    currencyID: number;
    currency: string;
    abbreviation: string;
}

export interface Currency {
  currencyID: number;
  currency: string;
  abbreviation: string;
  defaultCurrency: boolean;
  currencyRate: number;
  createdBy: number;
  createdOn: string;
  activeFlag: number;
  precision: number;
  culture: string;
  coin: string;
  formatString: string;
  symbol:string;
}

export interface CurrencyCodes{
  id:number;
  code: string;
  name: string;
}

