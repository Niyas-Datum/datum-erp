import { Injectable, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinanceAppService } from '../../../http/finance-app.service';
import { EndpointConstant } from '@org/constants';
import { VoucherCommonService } from './voucher-common.service';
import { AccountMasterModel, UnpaidPOModel } from '../../../model/PVoucherModel';
import { DatePipe } from '@angular/common';

@Injectable()
export class VoucherService {
  private httpService = inject(FinanceAppService);
  private voucherCommonService = inject(VoucherCommonService);
  private datePipe = inject(DatePipe);

  // Dropdown data signals (like ItemService.fillItemDataOptions)
  accountMasterData = signal<AccountMasterModel[]>([]);
  cashPopupData = signal<any[]>([]);
  cardPopupData = signal<any[]>([]);
  chequePopupData = signal<any[]>([]);
  bankData = signal<any[]>([]);
  unpaidPOsData = signal<UnpaidPOModel[]>([]);

  /**
   * Fetch account master data for AccountCode dropdown
   * Like ItemService.fetchItemsWithParams()
   */
  fetchAccountMaster(): void {
    // Don't fetch if already loaded
    if (this.accountMasterData().length > 0) {
      console.log('✅ Account master already loaded');
      return;
    }

    console.log('🔄 Fetching account master data...');

    this.httpService
      .fetch<AccountMasterModel[]>(EndpointConstant.ACCOUNTCODEPOPUP)
      .subscribe({
        next: (response) => {
          this.accountMasterData.set(response?.data ?? []);
          console.log('✅ Account master loaded:', this.accountMasterData().length, 'accounts');
        },
        error: (error) => {
          console.error('❌ Error fetching account master:', error);
        },
      });
  }

  /**
   * Fetch cash popup data
   */
  fetchCashPopup(): void {
    // Use cached data if available
    if (this.cashPopupData().length > 0) {
      console.log('✅ Using cached cash popup data');
      return;
    }

    console.log('🔄 Fetching cash popup data...');

    this.httpService
      .fetch<any>(EndpointConstant.FILLCASHPOPUP)
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          const cashData = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.cashPopupData.set(cashData);
          console.log('✅ Cash popup data loaded:', cashData.length, 'accounts');
        },
        error: (error) => {
          console.error('❌ Error fetching cash popup:', error);
        },
      });
  }

  /**
   * Fetch card popup data
   */
  fetchCardPopup(): void {
    console.log('🔄 Fetching card popup data...');

    this.httpService
      .fetch<any>(EndpointConstant.FILLCARDPOPUP)
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          const cardData = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.cardPopupData.set(cardData);
          console.log('✅ Card popup data loaded:', cardData.length, 'accounts');
        },
        error: (error) => {
          console.error('❌ Error fetching card popup:', error);
        },
      });
  }

  /**
   * Fetch cheque popup data
   */
  fetchChequePopup(): void {
    console.log('🔄 Fetching cheque popup data...');

    this.httpService
      .fetch<any>(EndpointConstant.FILLCHEQUEPOPUP)
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          const chequeData = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.chequePopupData.set(chequeData);
          console.log('✅ Cheque popup data loaded:', chequeData.length, 'accounts');
        },
        error: (error) => {
          console.error('❌ Error fetching cheque popup:', error);
        },
      });
  }

  /**
   * Fetch bank details for cheque popup
   */
  fetchBankDetails(): void {
    console.log('🔄 Fetching bank details...');

    this.httpService
      .fetch<any>(EndpointConstant.FILLBANKPOPUP)
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          const bankDataMapped = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.bankData.set(bankDataMapped);
          console.log('✅ Bank details loaded:', bankDataMapped.length, 'banks');
        },
        error: (error) => {
          console.error('❌ Error fetching bank details:', error);
        },
      });
  }

  /**
   * Fetch unpaid POs/Advances for the selected account
   * @param accountId - Account ID from accountMasterModel.id
   * @param drcr - 'D' for Debit (Payment Voucher), 'C' for Credit (Receipt Voucher)
   */
  fetchUnpaidPOs(accountId: number, drcr: 'D' | 'C'): void {
    const voucherId = 17; // Constant value
    const url = `${EndpointConstant.FILLADVANCE}${accountId}&voucherId=${voucherId}&drcr=${drcr}`;

    console.log('🔄 Fetching unpaid POs with URL:', url);

    this.httpService
      .fetch<any>(url)
      .subscribe({
        next: (response) => {
          console.log('✅ Unpaid POs response:', response);
          const responseData = response?.data ?? [];

          // Map API response to UnpaidPOModel
          const mappedData: UnpaidPOModel[] = responseData.map((item: any) => ({
            selection: item.selection ?? false,
            invoiceNo: item.vNo ?? '',
            invoiceDate: this.datePipe.transform(item.vDate, 'dd/MM/yyyy') ?? '',
            partyInvNo: item.partyInvNo,
            partyInvDate: item.partyInvDate ? this.datePipe.transform(item.partyInvDate, 'dd/MM/yyyy') : null,
            description: item.description,
            account: item.account,
            invoiceAmount: item.billAmount ?? 0,
            allocated: item.allocated ?? 0,
            amount: item.amount ?? 0,
            balance: (item.billAmount ?? 0) - (item.allocated ?? 0),
            // Store additional fields for later use
            vid: item.vid,
            veid: item.veid,
            accountID: item.accountID,
            drCr: item.drCr
          }));

          this.unpaidPOsData.set(mappedData);
          console.log('📊 Mapped unpaid POs:', mappedData);
          console.log('📊 Total unpaid POs:', mappedData.length);
        },
        error: (error) => {
          console.error('❌ Error fetching unpaid POs:', error);
          this.unpaidPOsData.set([]);
        },
      });
  }
}
