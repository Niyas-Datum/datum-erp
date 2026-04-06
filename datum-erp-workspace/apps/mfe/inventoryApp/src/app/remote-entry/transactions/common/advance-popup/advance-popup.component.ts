/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  GridComponent,
  GridModule,
  SelectionSettingsModel,
} from '@syncfusion/ej2-angular-grids';

/** Row shape aligned with `popupAdvance` API / finance PO allocation grid. */
export interface AdvanceBillRow {
  selection: boolean;
  invoiceNo: string;
  invoiceDate: string;
  partyInvNo: string | null;
  partyInvDate: string | null;
  description: string | null;
  account: string | null;
  invoiceAmount: number;
  allocated: number;
  amount: number;
  balance: number;
  vid?: number;
  veid?: number;
  accountID?: number;
  drCr?: string;
  vNo?: string;
}

export interface AdvancePopupResult {
  allocatedAmount: number;
  selectedAdvanceData: any[];
  advanceData: AdvanceBillRow[];
}

@Component({
  selector: 'app-advance-popup',
  standalone: true,
  imports: [CommonModule, GridModule],
  providers: [DecimalPipe],
  templateUrl: './advance-popup.component.html',
  styleUrl: './advance-popup.component.css',
})
export class AdvancePopupComponent implements OnInit, OnChanges {
  @ViewChild('advGrid') advGrid!: GridComponent;

  /** When > 0, allocation is capped by this amount (e.g. invoice grand total). */
  @Input() crdrAmount = 0;
  @Input() advanceRows: AdvanceBillRow[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<AdvancePopupResult>();

  private readonly decimalPipe = inject(DecimalPipe);
  private isSyncingSelection = false;

  displayRows: AdvanceBillRow[] = [];
  remainingAmount = 0;

  totalInvoiceAmount = 0;
  totalPayAmount = 0;
  totalAllocatedAmount = 0;
  totalBalanceAmount = 0;

  selectionSettings: SelectionSettingsModel = {
    type: 'Multiple',
    mode: 'Row',
    checkboxOnly: true,
  };

  ngOnInit(): void {
    this.bootstrapFromRows();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['advanceRows'] || changes['crdrAmount']) {
      this.bootstrapFromRows();
    }
  }

  private bootstrapFromRows(): void {
    this.crdrAmount = Number(this.crdrAmount) || 0;
    this.remainingAmount = this.crdrAmount;
    this.displayRows = (this.advanceRows ?? []).map((r) => ({
      ...r,
      selection: !!r.selection,
    }));
    this.resetAllocations();
  }

  close(): void {
    this.closed.emit();
  }

  private resetAllocations(): void {
    this.displayRows.forEach((po) => {
      const isSelected = !!po.selection;
      const existingAmount = Number(po.amount) || 0;
      const allocatedBase = Number(po.allocated) || 0;

      po.selection = isSelected;
      po.amount = isSelected ? existingAmount : 0;
      po.balance = po.invoiceAmount - allocatedBase - po.amount;
      if (po.balance < 0) po.balance = 0;
    });
    this.calculateFooterTotals();
    setTimeout(() => this.syncSelectionCheckboxes());
    this.remainingAmount = this.totalBalanceAmount;
  }

  onRowSelected(args: any): void {
    if (this.isSyncingSelection) return;
    const selectedRow: AdvanceBillRow = args.data;
    if (this.crdrAmount === 0) {
      this.handleCase1Selection(selectedRow, true);
    } else {
      this.handleCase2Selection(selectedRow, true);
    }
    selectedRow.selection = true;
    this.patchRow(selectedRow);
    this.calculateFooterTotals();
  }

  onRowDeselected(args: any): void {
    if (this.isSyncingSelection) return;
    const row: AdvanceBillRow = args.data;
    if (this.crdrAmount === 0) {
      this.handleCase1Selection(row, false);
    } else {
      this.handleCase2Selection(row, false);
    }
    row.selection = false;
    this.patchRow(row);
    this.calculateFooterTotals();
  }

  onRowSelecting(args: any): void {
    if (this.isSyncingSelection) return;
    const rowData = args.data as AdvanceBillRow;
    if (this.crdrAmount > 0 && this.remainingAmount <= 0 && !rowData.selection) {
      args.cancel = true;
    }
  }

  private patchRow(selectedRow: AdvanceBillRow): void {
    const arrayIndex = this.displayRows.findIndex(
      (po) => po.invoiceNo === selectedRow.invoiceNo
    );
    if (arrayIndex > -1) {
      this.displayRows[arrayIndex] = { ...selectedRow };
      if (this.advGrid) {
        this.advGrid.setCellValue(selectedRow.invoiceNo, 'amount', this.displayRows[arrayIndex].amount);
        this.advGrid.setCellValue(selectedRow.invoiceNo, 'balance', this.displayRows[arrayIndex].balance);
      }
    }
  }

  private handleCase1Selection(row: AdvanceBillRow, isSelected: boolean): void {
    if (isSelected) {
      row.amount = row.invoiceAmount - row.allocated;
      row.balance = 0;
    } else {
      row.balance = row.invoiceAmount - row.allocated;
      row.amount = 0;
    }
  }

  private handleCase2Selection(row: AdvanceBillRow, isSelected: boolean): void {
    if (isSelected) {
      const currentBalance = row.invoiceAmount - row.allocated;
      if (this.remainingAmount >= currentBalance) {
        row.amount = currentBalance;
        row.balance = 0;
        this.remainingAmount -= currentBalance;
      } else {
        row.amount = this.remainingAmount;
        row.balance = currentBalance - this.remainingAmount;
        this.remainingAmount = 0;
      }
    } else {
      this.remainingAmount += row.amount;
      row.balance = row.invoiceAmount - row.allocated;
      row.amount = 0;
    }
  }

  private calculateFooterTotals(): void {
    const selectedRows = this.displayRows.filter((po) => po.selection === true);
    this.totalInvoiceAmount = selectedRows.reduce((sum, po) => sum + po.invoiceAmount, 0);
    this.totalPayAmount = this.crdrAmount;
    this.totalAllocatedAmount = selectedRows.reduce((sum, po) => sum + po.amount, 0);
    this.totalBalanceAmount = this.totalPayAmount - this.totalAllocatedAmount;
    this.remainingAmount = this.totalBalanceAmount;
  }

  syncSelectionCheckboxes(): void {
    if (!this.advGrid) return;
    this.isSyncingSelection = true;
    this.advGrid.clearSelection();
    const selectedIndexes = this.displayRows
      .map((po, idx) => (po.selection ? idx : -1))
      .filter((idx) => idx >= 0);
    if (selectedIndexes.length) {
      this.advGrid.selectRows(selectedIndexes);
    }
    setTimeout(() => {
      this.isSyncingSelection = false;
    });
  }

  onOkClick(): void {
    const selectedPOs = this.advGrid
      ? (this.advGrid.getSelectedRecords() as AdvanceBillRow[])
      : this.displayRows.filter((po) => po.selection);

    const selectedAdvanceData = selectedPOs.map((po) => ({
      selection: po.selection,
      invoiceNo: po.invoiceNo,
      invoiceDate: po.invoiceDate,
      partyInvNo: po.partyInvNo,
      partyInvDate: po.partyInvDate,
      description: po.description,
      account: po.account,
      invoiceAmount: po.invoiceAmount,
      allocated: po.allocated,
      amount: po.amount,
      balance: po.balance,
      vid: po.vid ?? 0,
      veid: po.veid ?? 0,
      accountID: po.accountID ?? 0,
      drCr: po.drCr ?? '',
    }));

    this.confirmed.emit({
      allocatedAmount: this.totalAllocatedAmount,
      selectedAdvanceData,
      advanceData: this.displayRows.map((r) => ({ ...r })),
    });
    this.close();
  }

  onCancelClick(): void {
    this.close();
  }

  formatCurrency(value: number): string {
    return this.decimalPipe.transform(value, '1.2-2') || '0.00';
  }
}
