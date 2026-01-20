/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild, inject, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
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
import { CommonService } from '../services/common.services';
import { from, Subject, takeUntil } from 'rxjs';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { DataSharingService } from '@org/services';

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
export class PaymentpopupComponent implements OnChanges, OnDestroy {
  @Output() closePopup = new EventEmitter<void>();
  @Input() popupData: any[] = [];
  @Input() accountList: any[] = [];
  @Input() popupType!: 'cash' | 'card' | 'addcharge' | 'cheque' | 'tax';
  @Input() grandTotal: number = 0; // Grand total from invoice footer
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
  private dataSharingService = inject(DataSharingService);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  taxTotal = 0.0000;
  popupVisible = false;
  popupData1: any[] = [];
  popupGridColumns: any[] = [];
  private rowCounter = 1;
  commonService = inject(CommonService);

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
    this.popupData1 = [this.getDefaultRow()];
    this.dataSharingService.triggerRTaxValueTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalculateTaxValue();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle popupData changes
    if (changes['popupData'] && changes['popupData'].currentValue) {
      // Set popup visible when data is received
      this.popupVisible = true;
      
      // Use setTimeout to defer changes to next change detection cycle
      setTimeout(() => {
        // The popupData is now available for the multicolumncombobox
        this.refreshMulticolumnCombobox();
        
        // For cash popup, automatically load default account in the grid
        // Use a longer delay to ensure grid is fully initialized
        if (this.popupType === 'cash' && this.popupData && this.popupData.length > 0) {
          setTimeout(() => {
            this.autoLoadDefaultCashAccount();
            this.cdr.detectChanges();
          }, 100);
        }
        
        // For card popup, automatically load default card account
        if (this.popupType === 'card' && this.popupData && this.popupData.length > 0) {
          setTimeout(() => {
            this.autoLoadDefaultCardAccount();
            this.cdr.detectChanges();
          }, 100);
        }
      }, 0);
    }
  }

  /**
   * Automatically loads the default cash account in the grid when cash popup opens
   */
  private autoLoadDefaultCashAccount(): void {
    // Check if grid already has a row with an account selected
    const hasAccountSelected = this.popupData1.some(
      (row: any) => row.accountcode && row.accountcode.trim() !== ''
    );
    
    // If no account is selected and we have default cash account data
    if (!hasAccountSelected && this.popupData && this.popupData.length > 0) {
      // Get the first/default cash account
      const defaultAccount = this.popupData[0];
      
      // Get grand total for amount - use the grandTotal input passed from parent
      const cashAmount = parseFloat(String(this.grandTotal || 0));
      
      // Create new data array to avoid change detection errors
      let newData: any[];
      
      // If grid is empty or only has empty default row, replace it with default account
      if (this.popupData1.length === 0 || 
          (this.popupData1.length === 1 && !this.popupData1[0].accountcode)) {
        newData = [{
          id: this.rowCounter++,
          accountcode: defaultAccount.accountcode || defaultAccount.alias || '',
          accountname: defaultAccount.accountname || defaultAccount.name || '',
          accountId: defaultAccount.id || null, // Set accountId for accountCode.id
          description: '',
          amount: cashAmount,
          paymentType: this.popupType,
          pdcpayable: '',
          chequeno: '',
          chequedate: null as Date | null,
          bankName: '',
          clearingdays: '',
        }];
        
      } else {
        // If grid has rows, update the first empty row with default account
        newData = [...this.popupData1]; // Create a copy to avoid direct mutation
        const firstEmptyRow = newData.find(
          (row: any) => !row.accountcode || row.accountcode.trim() === ''
        );
        if (firstEmptyRow) {
          firstEmptyRow.accountcode = defaultAccount.accountcode || defaultAccount.alias || '';
          firstEmptyRow.accountname = defaultAccount.accountname || defaultAccount.name || '';
          firstEmptyRow.accountId = defaultAccount.id || null; // Set accountId for accountCode.id
          firstEmptyRow.amount = cashAmount;
        } else {
          // No empty row found, don't modify
          return;
        }
      }
      
      // Update popupData1 in next tick to avoid change detection errors
      setTimeout(() => {
        this.popupData1 = newData;
        
        // Refresh the grid to show the changes
        if (this.grid) {
          try {
            this.grid.refresh();
          } catch (error) {
            console.warn('Grid refresh error (non-critical):', error);
          }
        }
        // Trigger change detection after data update
        this.cdr.detectChanges();
      }, 0);
    }
  }

  private autoLoadDefaultCardAccount(): void {
    // Similar to cash account auto-loading
    const hasAccountSelected = this.popupData1.some(
      (row: any) => row.accountcode && row.accountcode.trim() !== ''
    );
    
    if (!hasAccountSelected && this.popupData && this.popupData.length > 0) {
      const defaultAccount = this.popupData[0];
      const balanceAmount = parseFloat(String(this.grandTotal || 0));
      
      let newData: any[];
      if (this.popupData1.length === 0 || 
          (this.popupData1.length === 1 && !this.popupData1[0].accountcode)) {
        newData = [{
          id: this.rowCounter++,
          accountcode: defaultAccount.accountcode || defaultAccount.alias || '',
          accountname: defaultAccount.accountname || defaultAccount.name || '',
          accountId: defaultAccount.id || null,
          description: '',
          amount: balanceAmount,
        }];
      } else {
        newData = [...this.popupData1];
        const firstEmptyRow = newData.find(
          (row: any) => !row.accountcode || row.accountcode.trim() === ''
        );
        if (firstEmptyRow) {
          firstEmptyRow.accountcode = defaultAccount.accountcode || defaultAccount.alias || '';
          firstEmptyRow.accountname = defaultAccount.accountname || defaultAccount.name || '';
          firstEmptyRow.accountId = defaultAccount.id || null;
          firstEmptyRow.amount = balanceAmount;
        } else {
          return;
        }
      }
      
      setTimeout(() => {
        this.popupData1 = newData;
        if (this.grid) {
          try {
            this.grid.refresh();
          } catch (error) {
            console.warn('Grid refresh error (non-critical):', error);
          }
        }
        this.cdr.detectChanges();
      }, 0);
    }
  }

  private refreshMulticolumnCombobox(): void {
    // Force the multicolumncombobox to refresh its data source
    // This ensures the dropdown shows data immediately when opened
    if (this.popupData && this.popupData.length > 0) {
      // The data is now available for the template
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  ngAfterViewInit(): void {
    this.setPopupConfig(this.popupType);
  }

  getDefaultRow() {
    return {
      id: this.rowCounter++,
      accountcode: '',
      accountname: '',
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

  addNewRow(): void {
    // Add a new row to the grid
    const newRow = this.getDefaultRow();
    this.popupData1 = [...this.popupData1, newRow];
    
    if (this.grid) {
      try {
        this.grid.refresh();
        // Select the new row
        const newRowIndex = this.popupData1.length - 1;
        this.grid.selectRow(newRowIndex);
        // Start editing the first editable cell
        setTimeout(() => {
          this.grid.startEdit();
        }, 100);
      } catch (error) {
        console.warn('Error adding new row:', error);
      }
    }
  }

  setPopupConfig(type: 'cash' | 'card' | 'cheque' | 'addcharge' | 'tax') {
    switch (type) {
      case 'cash':
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
            format: 'N4',
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.0001';
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

      case 'tax':
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
            format: 'N4',
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.0001';
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
            format: 'N4',
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.0001';
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
            format: { type: 'date', format: 'dd-MMM-yyyy' },
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
            edit: { params: { decimals: 4 } },
          },
        ];
        break;

      case 'addcharge':
        this.popupGridColumns = [
          {
            field: 'id',
            headerText: 'ID',
            width: 60,
            allowEditing: false,
            textAlign: 'Center',
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
            format: 'N4',
            edit: {
              create: () => {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.0001';
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
    }
    // Removed automatic popup visibility - popup should only show when explicitly triggered
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

    // 3) Map to the required output shape
    const result = (this.popupType === 'cheque')
      ? filled.map(r => ({
        pdcPayable: {
          alias: r.pdcAlias ?? '',
          name: r.pdcpayable ?? '',
          id: r.pdcpayableId ?? null,
        },
        bankInfo: {
          alias: r.bankAlias ?? '',
          name: r.bankName ?? '',
          id: r.bankId ?? null,
        },
        pdcPayableInfo: r.pdcpayable ?? '',
        veid: r.veid ?? null,
        cardType: r.cardType ?? null,
        commission: Number(r.commission ?? 0),
        chequeNo: r.chequeno ?? '',
        chequeDate: r.chequedate ? new Date(r.chequedate) : null,
        clrDays: r.clearingdays ?? '',
        bankID: r.bankId ?? null,
        bankName: r.bankName ?? '',
        status: r.status ?? '',
        partyID: r.partyId ?? r.partyID ?? null,
        description: r.description ?? '',
        amount: Number(r.amount ?? 0),
      }))
      : filled.map(r => {
        if (this.popupType === 'tax') {
          return {
            accountCode: {
              alias: r.accountcode,
              name: r.accountname,
              id: r.accountId ?? null,
            },
            description: r.description || '',
            amount: Number(r.amount || 0).toFixed(4),
            //amount: this.taxTotal,
          };
        }

        return {
          accountCode: {
            alias: r.accountcode,
            name: r.accountname,
            id: r.accountId ?? null,
          },
          description: r.description || '',
          amount: Number(r.amount || 0).toFixed(4),
        };
      });

    // 4) Emit & close
    this.itemSelected.emit(result);
    this.close();
  }


  onPdcSelect(e: any, row: any): void {
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

  private ensureTrailingEmptyRow(): void {
    try {
      this.grid.saveCell();
    } catch { }
    this.mergeBatchChangesIntoSource();

    if (!this.popupData1.length) {
      this.popupData1.push(this.getDefaultRow());
      this.grid.refresh();
      return;
    }
    const last = this.popupData1[this.popupData1.length - 1];
    if (!this.isChequeRowEmpty(last)) {
      this.popupData1.push(this.getDefaultRow());
      this.grid.refresh();
    }
  }

  onBankSelect(e: any, row: any): void {
    const sel = e?.item;
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
    this.grid.setCellValue(row.id, 'chequedate', v);
    const ix = this.popupData1.findIndex((r) => r.id === row.id);
    if (ix > -1) this.popupData1[ix].chequedate = v;
    try {
      this.grid.saveCell();
    } catch {
      /* no-op */
    }
  }

  public recalculateTaxValue(): void {
    const items = this.commonService.tempItemFillDetails() || [];
    this.taxTotal = items.reduce(
      (sum: number, item: any) => sum + this.toNum(item?.taxValue ?? 0),
      0
    );
    
  }

  private toNum(v: any): number {
    if (v === null || v === undefined || v === '') return 0;
    const s = typeof v === 'string' ? v.replace(/,/g, '') : v;
    const n = parseFloat(s as any);
    return isNaN(n) ? 0 : n;
  }
}
