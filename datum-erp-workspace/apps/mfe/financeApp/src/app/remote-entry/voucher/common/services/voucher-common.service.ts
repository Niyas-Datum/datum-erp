import { Injectable, signal } from '@angular/core';

@Injectable()
export class VoucherCommonService {
  // Grid data signals (like CommonService in inventory)
  accountDetailsData = signal<any[]>([]);
  paymentDetailsData = signal<any[]>([]);

  // Selected payment items
  cashSelected = signal<any[]>([]);
  cardSelected = signal<any[]>([]);
  chequeSelected = signal<any[]>([]);
  epaySelected = signal<any[]>([]);

  /**
   * Assign row IDs to account details data
   * Same pattern as CommonService.assignRowIds()
   */
  assignAccountRowIds(): void {
    // Mirror inventory item-list behavior: always stamp rowId/index so updates work on new rows
    this.accountDetailsData.set(
      this.accountDetailsData().map((item: any, index: number) => ({
        ...item,
        rowId: item?.rowId ?? index + 1,
        index: item?.index ?? index,
      }))
    );
  }

  /**
   * Update a single account row in grid
   * Same pattern as item-list.ts updateRowInGrid()
   */
  updateAccountRow(rowData: any): void {
    const rows = this.accountDetailsData();

    // Prefer rowId match; fallback to index; final fallback to strict reference equality
    let index = rows.findIndex((row: any) => row.rowId === rowData.rowId);
    if (index === -1 && rowData?.index !== undefined) {
      index = rows.findIndex((row: any) => row.index === rowData.index);
    }
    if (index === -1) {
      index = rows.findIndex((row: any) => row === rowData);
    }

    if (index !== -1) {
      rows[index] = { ...rowData };
      this.accountDetailsData.set([...rows]);
    }
  }

  /**
   * Ensure there's always an empty editable row at the end
   * Used so selecting an account on the current last row auto-creates the next row (rowId incremented)
   */
  ensureTrailingEmptyAccountRow(): void {
    const rows = this.accountDetailsData();

    if (rows.length === 0) {
      this.initializeAccountDetails();
      return;
    }

    const last = rows[rows.length - 1] || {};
    const hasData =
      (last.accountCode && String(last.accountCode).trim() !== '') ||
      (last.accountName && String(last.accountName).trim() !== '') ||
      (Number(last.debit) || 0) !== 0 ||
      (Number(last.credit) || 0) !== 0 ||
      (last.description && String(last.description).trim() !== '');

    if (hasData) {
      rows.push({
        accountCode: '',
        accountName: '',
        description: '',
        dueDate: '',
        debit: 0,
        credit: 0,
      });
      this.accountDetailsData.set([...rows]);
      this.assignAccountRowIds();
    }
  }

  /**
   * Initialize account details with empty row
   * Called when user clicks "New" button
   */
  initializeAccountDetails(): void {
    this.accountDetailsData.set([
      {
        accountCode: '',
        accountName: '',
        description: '',
        dueDate: '',
        debit: 0,
        credit: 0,
      },
    ]);
    this.assignAccountRowIds();
  }

  /**
   * Clear all data
   * Called when clearing form or switching vouchers
   */
  clearAllData(): void {
    this.accountDetailsData.set([]);
    this.paymentDetailsData.set([]);
    this.cashSelected.set([]);
    this.cardSelected.set([]);
    this.chequeSelected.set([]);
    this.epaySelected.set([]);
  }

  /**
   * Update payment details grid
   * Combines cash, card, and cheque selections
   */
  updatePaymentDetailsGrid(): void {
    const paymentDetails: any[] = [];

    // Add cash entries
    this.cashSelected().forEach((item) => {
      paymentDetails.push({
        AccountName: item.accountCode?.name || item.accountname || '',
        Description: item.description || '',
        Amount: parseFloat(item.amount) || 0,
        TranType: 'Cash',
      });
    });

    // Add card entries
    this.cardSelected().forEach((item) => {
      paymentDetails.push({
        AccountName: item.accountCode?.name || item.accountname || '',
        Description: item.description || '',
        Amount: parseFloat(item.amount) || 0,
        TranType: 'Card',
      });
    });

    // Add cheque entries
    this.chequeSelected().forEach((item) => {
      paymentDetails.push({
        AccountName: item.pdcpayable.accountname || '',
        Description: item.description || '',
        Amount: parseFloat(item.amount) || 0,
        TranType: 'Cheque',
      });
    });

    // Add e-pay entries
    this.epaySelected().forEach((item) => {
      paymentDetails.push({
        AccountName: item.accountCode?.name || item.accountname || '',
        Description: item.description || '',
        Amount: parseFloat(item.amount) || 0,
        TranType: 'E-Pay',
      });
    });

    this.paymentDetailsData.set(paymentDetails);
  }
}
