/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { EditSettingsModel } from '@syncfusion/ej2-grids';
import { MultiColumnComboBoxModule } from '@syncfusion/ej2-angular-multicolumn-combobox';
import {
  GridModule,
  GridComponent,
  FilterService,
  VirtualScrollService,
  EditService,
  ToolbarService,
} from '@syncfusion/ej2-angular-grids';
import { FormsModule } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
 
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
 

@Component({
  selector: 'app-paymentpopup',
  standalone: true,
  imports: [
    CommonModule,
    MultiColumnComboBoxModule,
    GridModule,
    FormsModule,
    DatePickerModule,
  ],
  templateUrl: './paymentpopup.component.html',
  styleUrl: './paymentpopup.component.css',
  providers: [FilterService, VirtualScrollService, EditService, ToolbarService],
})
export class PaymentpopupComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Input() popupData: any[] = [];
  @Input() accountList: any[] = [];
  @Input() popupType!: 'cash' | 'card' | 'cheque' | 'epay';
  @Input() initialAmount: number = 0;
  @Input() existingData: any[] = []; // Existing payment entries for edit mode
  @Output() itemSelected = new EventEmitter<any>();
  @ViewChild('grid') public grid!: GridComponent;
  @ViewChild('accountCodeTemplate', { static: true })
  accountCodeTemplate!: TemplateRef<any>;
  @ViewChild('descriptionEdit', { static: true })
  descriptionEditTemplate!: TemplateRef<any>;
  @ViewChild('pdcPayableTemplate', { static: true })
  pdcPayableTemplate!: TemplateRef<any>;
  @ViewChild('bankNameTemplate', { static: true })
  bankNameTemplate!: TemplateRef<any>;
  @Input() bankData: any[] = [];
  @ViewChild('chequeDateTemplate', { static: true })
  chequeDateTemplate!: TemplateRef<any>;
  popupVisible = false;
  popupData1: any[] = [];
  popupGridColumns: any[] = [];
  private rowCounter = 1;
  

  editSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: false,
    allowDeleting: false,
    mode: 'Batch',
  };
  descInput!: HTMLInputElement;
  amtInput!: HTMLInputElement;
  selectedRowForPopup: any = null;

  ngOnInit() {
    // If existing data is provided (edit mode), use it; otherwise create default row
    if (this.existingData && this.existingData.length > 0) {
      // Map existing data to popup grid format
      this.popupData1 = this.existingData.map((item: any) => ({
        id: this.rowCounter++,
        accountcode: item.accountcode || item.accountCode?.code || '',
        accountname: item.accountname || item.accountCode?.name || '',
        accountId: item.id || item.accountCode?.id || 0,
        description: item.description || '',
        amount: Number(item.amount) || 0,
        paymentType: this.popupType,
        // Cheque-specific fields
        pdcpayable: item.pdcpayable?.accountname || '',
        pdcpayableId: item.pdcpayable?.id || 0,
        pdcAlias: item.pdcpayable?.accountcode || '',
        chequeno: item.chequeno || '',
        chequedate: item.chequedate ? new Date(item.chequedate) : null,
        bankName: item.bankName?.accountname || '',
        bankId: item.bankId || item.bankName?.id || 0,
        bankAlias: item.bankName?.accountcode || '',
        clearingdays: item.clearingdays || 0,
      }));

      // Add an empty row at the end for new entries
      this.popupData1.push(this.getDefaultRow());

      console.log('✅ Loaded existing payment data:', this.popupData1);
    } else {
      // New mode: Create default row
      this.popupData1 = [this.getDefaultRow()];

      // Pre-populate first row amount based on provided initial amount
      const amt = Number(this.initialAmount) || 0;
      if (this.popupData1.length > 0) {
        this.popupData1[0].amount = parseFloat(amt.toFixed(4));
      }

      // Auto-select first account if available
      if (this.popupData && this.popupData.length > 0 && this.popupData1.length > 0) {
        const firstAccount = this.popupData[0];
        this.popupData1[0].accountcode = firstAccount.accountcode;
        this.popupData1[0].accountname = firstAccount.accountname;
        this.popupData1[0].accountId = firstAccount.id;
      }
    }
  }


  ngAfterViewInit(): void {
    this.setPopupConfig(this.popupType);

    // If auto-selected first account filled the only row, add a trailing empty row for split payments.
    if (this.popupData1?.length && (this.popupData?.length ?? 0) > 1) {
      const first = this.popupData1[0];
      if (!this.isRowEmpty(first)) {
        setTimeout(() => this.ensureTrailingEmptyRow(), 0);
      }
    }
  }

  // Computed footer total for Amount column
  get totalAmount(): number {
    try {
      return (this.popupData1 ?? []).reduce((sum, r: any) => sum + (Number(r?.amount) || 0), 0);
    } catch {
      return 0;
    }
  }

  // When a cell is saved (e.g., pressing Enter), merge batch changes so footer total updates
  onGridCellSaved(_: any): void {
    this.mergeBatchChangesIntoSource();
  }

  getDefaultRow() {
    return {
      id: this.rowCounter++,
      accountcode: '',
      accountname: '',
      accountId: null,
      description: '',
      amount: 0,
      paymentType: this.popupType,
      pdcpayable: '',
      chequeno: '',
      chequedate: null as Date | null,
      bankName: '',
      clearingdays: '',
    };
  }

  close() {
    this.closePopup.emit();
  }

  setPopupConfig(type: 'cash' | 'card' | 'cheque' | 'epay') {
    switch (type) {
      case 'cash':
      case 'epay':
        this.popupGridColumns = [
          {
            field: 'id',
            headerText: 'ID',
            width: 60,
            allowEditing: false,
            textAlign: 'Center',
            isPrimaryKey: true,
          },
          {
            field: 'accountcode',
            headerText: 'Account Code',
            width: 200,
            editTemplate: this.accountCodeTemplate,
          },
          {
            field: 'accountname',
            headerText: 'Account Name',
            width: 200,
            allowEditing: true,
          },
          {
            field: 'description',
            headerText: 'Description',
            width: 220,
            allowEditing: true,
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'e-input';
                return input;
              },
              write: (args: any) => {
                (args as any).element.value = args.rowData?.description || '';
                (args as any).element.addEventListener('input', (e: any) => {
                  args.rowData.description = e.target.value;
                });
                setTimeout(() => (args as any).element.focus());
              },
              read: (args: any) => {
                return (args as any).element.value;
              },
              destroy: () => {
                /* no-op */
              },
            },
          },
          {
            field: 'amount',
            headerText: 'Amount',
            width: 120,
            allowEditing: true,
            type: 'number',
            format: 'N2',
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.01';
                input.className = 'e-input';
                return input;
              },
              write: (args: any) => {
                (args as any).element.value = args.rowData?.amount || 0;
                (args as any).element.addEventListener('input', (e: any) => {
                  args.rowData.amount = parseFloat(e.target.value) || 0;
                });
                setTimeout(() => (args as any).element.focus());
              },
              read: (args: any) => {
                return parseFloat((args as any).element.value) || 0;
              },
              destroy: () => {
                /* no-op */
              },
            },
          },
        ];
        break;

      


      case 'card':
        this.popupGridColumns = [
          {
            field: 'id',
            headerText: 'ID',
            width: 60,
            allowEditing: false,
            textAlign: 'Center',
            isPrimaryKey: true,
          },
          {
            field: 'accountcode',
            headerText: 'Account Code',
            width: 200,
            editTemplate: this.accountCodeTemplate,
          },
          {
            field: 'accountname',
            headerText: 'Account Name',
            width: 200,
            allowEditing: true,
          },
          {
            field: 'description',
            headerText: 'Description',
            width: 220,
            allowEditing: true,
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'e-input';
                return input;
              },
              write: (args: any) => {
                (args as any).element.value = args.rowData?.description || '';
                (args as any).element.addEventListener('input', (e: any) => {
                  args.rowData.description = e.target.value;
                });
                setTimeout(() => (args as any).element.focus());
              },
              read: (args: any) => {
                return (args as any).element.value;
              },
              destroy: () => {
                /* no-op */
              },
            },
          },
          {
            field: 'amount',
            headerText: 'Amount',
            width: 120,
            allowEditing: true,
            type: 'number',
            format: 'N2',
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.01';
                input.className = 'e-input';
                return input;
              },
              write: (args: any) => {
                (args as any).element.value = args.rowData?.amount || 0;
                (args as any).element.addEventListener('input', (e: any) => {
                  args.rowData.amount = parseFloat(e.target.value) || 0;
                });
                setTimeout(() => (args as any).element.focus());
              },
              read: (args: any) => {
                return parseFloat((args as any).element.value) || 0;
              },
              destroy: () => {
                /* no-op */
              },
            },
          },
        ];
        break;

      case 'cheque':
        this.popupGridColumns = [
          {
            field: 'id',
            headerText: 'ID',
            width: 60,
            allowEditing: false,
            textAlign: 'Center',
            isPrimaryKey: true,
          },
          {
            field: 'pdcpayable',
            headerText: 'PDC Payable',
            width: 220,
            allowEditing: true,
            editTemplate: this.pdcPayableTemplate,
          },
          {
            field: 'chequeno',
            headerText: 'Cheque No',
            width: 160,
            allowEditing: true,
          },
          {
            field: 'chequedate',
            headerText: 'Cheque Date',
            width: 160,
            allowEditing: true,
            type: 'date',
            format: { type: 'date', format: 'dd/MM/yyyy' },
            editTemplate: this.chequeDateTemplate,
          },

          {
            field: 'bankName',
            headerText: 'Bank Name',
            width: 180,
            allowEditing: true,
            editTemplate: this.bankNameTemplate,
          },
          {
            field: 'clearingdays',
            headerText: 'Clearing Days',
            width: 140,
            allowEditing: true,
          },
          {
            field: 'description',
            headerText: 'Description',
            width: 220,
            allowEditing: true,
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'e-input';
                return input;
              },
              write: (args: any) => {
                (args as any).element.value = args.rowData?.description || '';
                (args as any).element.addEventListener('input', (e: any) => {
                  args.rowData.description = e.target.value;
                });
                setTimeout(() => (args as any).element.focus());
              },
              read: (args: any) => {
                return (args as any).element.value;
              },
              destroy: () => {
                /* no-op */
              },
            },
          },
          {
            field: 'amount',
            headerText: 'Amount',
            width: 120,
            allowEditing: true,
            type: 'number',
            format: 'N2',
            edit: { params: { decimals: 2 } },
          },
        ];
        break;

      
    }
    this.popupVisible = true;
  }

  onAccountSelect(args: any, row: any): void {
    const selected = args.item;
    if (!selected) return;

    // Merge any unsaved edits before updating the source
    this.mergeBatchChangesIntoSource();

    row.accountcode = selected.accountcode;
    row.accountname = selected.accountname;
    row.accountId = selected.id
    const rowIndex = this.popupData1.findIndex((item) => item.id === row.id);
    if (rowIndex !== -1) {
      this.popupData1[rowIndex] = { ...row };
    }

    const hasEmptyRow = this.popupData1.some(
      (r) => !r.accountcode && !r.accountname && !r.amount
    );

    if (!hasEmptyRow) {
      this.popupData1.push(this.getDefaultRow());
    }

    this.grid.refresh();
  }

  submit() {
    // 1) Commit any pending edits to the data source
    try { this.grid.saveCell(); } catch { /* no-op */ }
    this.mergeBatchChangesIntoSource();
    try { this.grid.editModule?.batchSave(); } catch { /* no-op */ }

    const rows = this.popupData1 ?? [];

    // 2) Filter out truly empty rows
    const filled = rows.filter(r => {
      if (this.popupType === 'cheque') {
        return !this.isChequeRowEmpty(r);
      }
      const isEmpty =
        !r.accountcode &&
        !r.accountname &&
        !r.description &&
        (r.amount ?? 0) === 0;
      return !isEmpty;
    });
    
    // 2.1) Validate: if amount is entered, account code must be selected
    for (const row of filled) {
      const amount = Number(row.amount) || 0;
      debugger;
      if (this.popupType === 'cheque') {
        // For cheque, check if amount exists but PDC Payable is not selected
        if (amount > 0 && !row.pdcpayable && !row.pdcpayableId) {
          alert('Please select PDC Payable for all rows with amount.');
          return;
        }
      } else {
        // For cash/card/epay, check if amount exists but account code is empty
        if (amount > 0 && !row.accountcode) {
          alert('Please select Account Code for all rows with amount.');
          return;
        }
      }
    }

    // 3) Map to the required output shape compatible with the voucher payload builder
    const result = (this.popupType === 'cheque')
      ? filled.map(r => ({
          // Expected by buildPaymentBreakdownFromSelections() as "pdcpayable"
          pdcpayable: {
            accountcode: r.pdcAlias ?? '',
            accountname: r.pdcpayable ?? '',
            id: Number(r.pdcpayableId) || 0,
          },
          chequeno: r.chequeno ?? '',
          chequedate: r.chequedate ? new Date(r.chequedate) : null,
          description: r.description ?? '',
          amount: Number(r.amount) || 0,

          // Bank can be provided either as bankId or bankName object; provide both
          bankId: Number(r.bankId) || 0,
          bankName: {
            accountcode: r.bankAlias ?? '',
            accountname: r.bankName ?? '',
            id: Number(r.bankId) || 0,
          },

          // Keep original field name used by selection mapper
          clearingdays: Number(r.clearingdays) || 0,

          // Optional extras (ensure numeric types, avoid nulls for ints)
          veid: Number(r.veid) || 0,
          cardType: r.cardType ?? '',
          commission: Number(r.commission) || 0,
          bankID: Number(r.bankId) || 0,
          status: r.status ?? '',
          partyID: Number(r.partyId ?? r.partyID) || 0,
        }))
      : filled.map(r => ({
          // Flat fields expected by selection mapper for cash/card/epay
          accountcode: r.accountcode ?? '',
          accountname: r.accountname ?? '',
          id: Number(r.accountId ?? r.id) || 0,
          description: r.description ?? '',
          amount: Number(r.amount) || 0,
        }));

    // 4) Emit & close
    this.itemSelected.emit(result);
    this.close();
  }


  onPdcSelect(e: any, row: any): void {
    debugger;
    const sel = e?.item;
    if (!sel) return;
    try {
      this.grid.saveCell();
    } catch { }
    this.mergeBatchChangesIntoSource();
    this.grid.setCellValue(row.id, 'pdcpayable', sel.accountname);
    const ix = this.popupData1.findIndex((r) => r.id === row.id);
    if (ix > -1) {
      const r = this.popupData1[ix];
      r.pdcpayableId = sel.id;
      r.pdcpayable = sel.accountname;
      r.pdcAlias = sel.accountcode;
    }
    this.ensureTrailingEmptyRow();
  }

  private isChequeRowEmpty(r: any): boolean {
    return !(
      r?.pdcpayableId ||
      r?.pdcpayable ||
      r?.chequeno ||
      r?.chequedate ||
      r?.bankName ||
      r?.clearingdays ||
      (r?.amount ?? 0) !== 0 ||
      (r?.description && r.description.trim() !== '')
    );
  }

  private isRowEmpty(r: any): boolean {
    if (this.popupType === 'cheque') {
      return this.isChequeRowEmpty(r);
    }
    return !(
      r?.accountcode ||
      r?.accountname ||
      (r?.description && r.description.trim() !== '') ||
      (r?.amount ?? 0) !== 0
    );
  }

  private ensureTrailingEmptyRow(): void {
    if (this.grid) {
      try {
        this.grid.saveCell();
      } catch { }
      this.mergeBatchChangesIntoSource();
    }

    if (!this.popupData1.length) {
      this.popupData1.push(this.getDefaultRow());
      if (this.grid) {
        this.grid.refresh();
      }
      return;
    }
    const last = this.popupData1[this.popupData1.length - 1];
    if (!this.isRowEmpty(last)) {
      this.popupData1.push(this.getDefaultRow());
      if (this.grid) {
        this.grid.refresh();
      }
    }
  }

  onBankSelect(e: any, row: any): void {
    const sel = e?.item ?? e?.itemData;
    if (!sel) return;

    try {
      this.grid.saveCell();
    } catch { }
    this.mergeBatchChangesIntoSource();

    this.grid.setCellValue(row.id, 'bankName', sel.accountname);

    const ix = this.popupData1.findIndex((r) => r.id === row.id);
    if (ix > -1) {
      const r = this.popupData1[ix];
      r.bankName = sel.accountname;
      r.bankId = sel.id;
      r.bankAlias = sel.accountcode;
    }

    this.ensureTrailingEmptyRow();
  }

  onDescriptionChange(event: any, row: any) {
    row.description = event.target.value;
    this.grid.refresh();
  }

  private coerce(field: string, value: any) {
    if (field === 'amount') {
      const n = parseFloat(value);
      return isNaN(n) ? 0 : n;
    }
    return value ?? '';
  }

  onCellChange(field: 'description' | 'amount', value: any, row: any) {
    const ix = this.popupData1.findIndex((r) => r.id === row.id);
    if (ix > -1) {
      this.popupData1[ix][field] = this.coerce(field, value);
      const rowIndex = this.grid.getRowIndexByPrimaryKey
        ? this.grid.getRowIndexByPrimaryKey(row.id)
        : this.grid
          .getCurrentViewRecords()
          .findIndex((r: any) => r.id === row.id);
      if (rowIndex > -1) {
        this.grid.updateCell(rowIndex, field, this.popupData1[ix][field]);
      }
    }
  }

  private mergeBatchChangesIntoSource(): void {
    if (!this.grid) return;
    try {
      this.grid.saveCell();
    } catch {
      /* no-op */
    }

    const changes = (this.grid as any).getBatchChanges?.();
    if (!changes) return;

    const apply = (records: any[] = []) => {
      for (const ch of records) {
        const ix = this.popupData1.findIndex((r) => r.id === ch.id);
        if (ix > -1) {
          this.popupData1[ix] = { ...this.popupData1[ix], ...ch };
        }
      }
    };
    apply(changes.changedRecords);
    apply(changes.addedRecords);
  }

  onChequeDateChange(event: any, row: any) {
    const v: Date | null = event?.value ? new Date(event.value) : null;

    // Step 1: Save current cell first (exit edit mode)
    try {
      this.grid.saveCell();
    } catch { }

    // Step 2: Merge any batch changes
    this.mergeBatchChangesIntoSource();

    // Step 3: Update the cell value
    this.grid.setCellValue(row.id, 'chequedate', v);

    // Step 4: Update data source
    const ix = this.popupData1.findIndex((r) => r.id === row.id);
    if (ix > -1) {
      this.popupData1[ix].chequedate = v;
    }

    // Step 5: Refresh grid and ensure empty row (CRITICAL!)
    this.ensureTrailingEmptyRow();
  }

  
}
