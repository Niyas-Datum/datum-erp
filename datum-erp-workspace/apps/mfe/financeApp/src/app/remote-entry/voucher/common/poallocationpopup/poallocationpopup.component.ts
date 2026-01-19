import { Component, OnInit, ViewChild, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GridComponent, GridModule, SelectionSettingsModel } from '@syncfusion/ej2-angular-grids';
import { UnpaidPOModel, POAllocationResult } from '../../../model/PVoucherModel';
import { VoucherService } from '../services/voucher.service';

@Component({
  selector: 'app-poallocationpopup',
  standalone: true,
  imports: [CommonModule, GridModule],
  providers: [DecimalPipe],
  templateUrl: './poallocationpopup.component.html',
  styleUrls: ['./poallocationpopup.component.css']
})
export class PoallocationpopupComponent implements OnInit {
  @ViewChild('poGrid') poGrid!: GridComponent;

  // Event emitter to send result back to parent
  @Output() allocationComplete = new EventEmitter<POAllocationResult>();

  private voucherService = inject(VoucherService);
  private decimalPipe = inject(DecimalPipe);
  private isSyncingSelection = false;

  public popupVisible: boolean = false;
  public unpaidPOs: UnpaidPOModel[] = [];
  public crdrAmount: number = 0;  // Amount from Debit (Payment Voucher) or Credit (Receipt Voucher) column
  public remainingAmount: number = 0;

  // Footer totals
  public totalInvoiceAmount: number = 0;
  public totalPayAmount: number = 0;
  public totalAllocatedAmount: number = 0;
  public totalBalanceAmount: number = 0;

  // Grid settings
  public selectionSettings: SelectionSettingsModel = {
    type: 'Multiple',
    mode: 'Row',
    checkboxOnly: true
  };

  ngOnInit(): void {
    // Component initialized
  }

  open(crdrAmount: number): void {
    console.log('🔓 Opening popup with crdrAmount:', crdrAmount);

    this.crdrAmount = Number(crdrAmount) || 0; // Ensure it's a number
    this.remainingAmount = Number(crdrAmount) || 0;

    // Load unpaid POs from service signal
    this.loadUnpaidPOs();

    // Reset all selections and amounts
    this.resetAllocations();

    this.popupVisible = true;
  }

  close(): void {
    this.popupVisible = false;
  }

  loadUnpaidPOs(): void {
    // Get data from service signal and create deep copy to avoid mutating original
    this.unpaidPOs = this.voucherService.unpaidPOsData().map(po => ({
      ...po,
      selection: !!po.selection,
    }));
    console.log('📊 Loaded unpaid POs in popup:', this.unpaidPOs.length);
    console.log('📊 Unpaid POs data:', this.unpaidPOs);

    if (this.unpaidPOs.length === 0) {
      console.warn('⚠️ No unpaid POs found!');
    }
  }

  resetAllocations(): void {
    this.unpaidPOs.forEach(po => {
      const isSelected = !!po.selection;
      const existingAmount = Number(po.amount) || 0;
      const allocatedBase = Number(po.allocated) || 0;

      po.selection = isSelected;
      po.amount = isSelected ? existingAmount : 0;
      po.balance = po.invoiceAmount - allocatedBase - po.amount;
      if (po.balance < 0) po.balance = 0;
    });
    this.calculateFooterTotals();
    this.syncSelectionCheckboxes();
    // Remaining amount should reflect current balance so new selections are allowed when available
    this.remainingAmount = this.totalBalanceAmount;
  }

  onRowSelected(args: any): void {
    if (this.isSyncingSelection) return;

    console.log('✅ Row selected event fired');

    const selectedRow: UnpaidPOModel = args.data;
    const rowIndex = args.rowIndex;

    if (this.crdrAmount === 0) {
      // Case 1: Cr/Dr Amount = 0
      this.handleCase1Selection(selectedRow, true);
    } else {
      // Case 2: Cr/Dr Amount > 0
      this.handleCase2Selection(selectedRow, true);
    }

    // Mark as selected
    selectedRow.selection = true;

    // Update the underlying array
    const arrayIndex = this.unpaidPOs.findIndex(po => po.invoiceNo === selectedRow.invoiceNo);
    if (arrayIndex > -1) {
      this.unpaidPOs[arrayIndex] = { ...selectedRow };

      // Update specific cells in grid using primary key
      this.poGrid.setCellValue(selectedRow.invoiceNo, 'amount', this.unpaidPOs[arrayIndex].amount);
      this.poGrid.setCellValue(selectedRow.invoiceNo, 'balance', this.unpaidPOs[arrayIndex].balance);
    }

    // Recalculate footer totals immediately after each selection (real-time update)
    this.calculateFooterTotals();
  }

  onRowDeselected(args: any): void {
    if (this.isSyncingSelection) return;

    const deselectedRow: UnpaidPOModel = args.data;
    const rowIndex = args.rowIndex;

    if (this.crdrAmount === 0) {
      // Case 1: Cr/Dr Amount = 0
      this.handleCase1Selection(deselectedRow, false);
    } else {
      // Case 2: Cr/Dr Amount > 0
      this.handleCase2Selection(deselectedRow, false);
    }

    // Mark as deselected
    deselectedRow.selection = false;

    // Update the underlying array
    const arrayIndex = this.unpaidPOs.findIndex(po => po.invoiceNo === deselectedRow.invoiceNo);
    if (arrayIndex > -1) {
      this.unpaidPOs[arrayIndex] = { ...deselectedRow };

      // Update specific cells in grid using primary key
      this.poGrid.setCellValue(deselectedRow.invoiceNo, 'amount', this.unpaidPOs[arrayIndex].amount);
      this.poGrid.setCellValue(deselectedRow.invoiceNo, 'balance', this.unpaidPOs[arrayIndex].balance);
    }

    // Recalculate footer totals immediately after each deselection (real-time update)
    this.calculateFooterTotals();
  }

  // Prevent selecting additional rows when remaining amount is exhausted in Case 2
  onRowSelecting(args: any): void {
    if (this.isSyncingSelection) return;

    const rowData = args.data as UnpaidPOModel;
    if (this.crdrAmount > 0 && this.remainingAmount <= 0 && !rowData.selection) {
      args.cancel = true;
    }
  }

  handleCase1Selection(row: UnpaidPOModel, isSelected: boolean): void {
    if (isSelected) {
      row.amount = row.balance;
      row.balance = 0;
    } else {
      row.balance = row.invoiceAmount - row.allocated;
      row.amount = 0;
    }
  }

  handleCase2Selection(row: UnpaidPOModel, isSelected: boolean): void {
    if (isSelected) {
      const currentBalance = row.invoiceAmount - row.allocated;

      if (this.remainingAmount >= currentBalance) {
        // Allocate full balance
        row.amount = currentBalance;
        row.balance = 0;
        this.remainingAmount -= currentBalance;
      } else {
        // Allocate partial amount
        row.amount = this.remainingAmount;
        row.balance = currentBalance - this.remainingAmount;
        this.remainingAmount = 0;
      }

    } else {
      // Deselection: return amount to remaining
      this.remainingAmount += row.amount;
      row.balance = row.invoiceAmount - row.allocated;
      row.amount = 0;
    }
  }

  // TODO: Re-enable in final stage - Prevent selection when remaining = 0
  // onRowSelecting(args: any): void {
  //   const rowData = args.data as UnpaidPOModel;
  //   if (this.crdrAmount > 0 && this.remainingAmount === 0 && !rowData.selection) {
  //     args.cancel = true;
  //     console.log('⚠️ Cannot select more rows. Allocation limit reached.');
  //   }
  // }

  calculateFooterTotals(): void {
    // Use manual selection tracking via po.selection boolean
    const selectedRows = this.unpaidPOs.filter(po => po.selection === true);

    console.log('🧮 Calculating totals for', selectedRows.length, 'selected rows');

    // Total invoice amount of selected POs
    this.totalInvoiceAmount = selectedRows.reduce((sum, po) => sum + po.invoiceAmount, 0);

    // Total payment amount = constant (debit amount entered by user)
    this.totalPayAmount = this.crdrAmount;

    // Total amount being allocated now (sum of po.amount for selected rows)
    this.totalAllocatedAmount = selectedRows.reduce((sum, po) => sum + po.amount, 0);

    // Balance = Payment amount - Allocated amount (remaining unallocated)
    this.totalBalanceAmount = this.totalPayAmount - this.totalAllocatedAmount;
    // Keep remainingAmount in sync with footer balance
    this.remainingAmount = this.totalBalanceAmount;
  }

  syncSelectionCheckboxes(): void {
    if (!this.poGrid) return;

    this.isSyncingSelection = true;
    this.poGrid.clearSelection();

    const selectedIndexes = this.unpaidPOs
      .map((po, idx) => (po.selection ? idx : -1))
      .filter(idx => idx >= 0);

    if (selectedIndexes.length) {
      this.poGrid.selectRows(selectedIndexes);
    }

    setTimeout(() => {
      this.isSyncingSelection = false;
    });
  }

  onOkClick(): void {
    // Get selected records using grid if available, otherwise use manual tracking
    const selectedPOs = this.poGrid
      ? this.poGrid.getSelectedRecords() as UnpaidPOModel[]
      : this.unpaidPOs.filter(po => po.selection);
  
    console.log('✅ OK clicked, selected POs:', selectedPOs.length);

    const result: POAllocationResult = {
      totalAllocatedAmount: this.totalAllocatedAmount, // Use calculated total
      allocations: selectedPOs.map(po => ({
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
        vid: po.vid || 0,
        veid: po.veid || 0,
        accountID: po.accountID || 0,
        drCr: po.drCr || ''
      })),
      invoiceNosString: selectedPOs.map(po => po.invoiceNo).join(', ')
    };

    console.log('📤 Emitting result:', result);
    
    
    // Emit event to parent component
    this.allocationComplete.emit(result);

    this.close();
  }

  onCancelClick(): void {
    this.close();
  }

  formatCurrency(value: number): string {
    return this.decimalPipe.transform(value, '1.2-2') || '0.00';
  }
}
