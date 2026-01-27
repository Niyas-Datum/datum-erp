import {
  Component,
  inject,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FinanceAppService } from '../../http/finance-app.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { BaseComponent } from '@org/architecture';
import { DatePipe } from '@angular/common';
import { DataSharingService, BaseService } from '@org/services';
import { EditSettingsModel, GridComponent } from '@syncfusion/ej2-angular-grids';

@Component({
  selector: 'app-account-reconciliation',
  standalone: false,
  templateUrl: './account-reconciliation.component.html',
  styles: [`
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .summary-table th,
    .summary-table td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    .summary-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .search-section {
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 15px;
    }
  `],
})
export class AccountReconciliationComponent extends BaseComponent implements OnInit {
  @ViewChild('reconciliationGrid') reconciliationGrid!: GridComponent;

  private httpService = inject(FinanceAppService);
  private datePipe = inject(DatePipe);
  private dataSharingService = inject(DataSharingService);
  private baseService = inject(BaseService);

  searchForm = this.formUtil.thisForm;
  pageId = 75; // Account Reconciliation PageId
  readonly today = new Date();

  // Dropdown data sources
  accountData: any[] = [];

  // Grid data
  reconciliationData = signal<any[]>([]);

  // Summary totals
  bookBalance = signal<{ debit: number; credit: number; balance: number }>({
    debit: 0,
    credit: 0,
    balance: 0
  });

  clearedBalance = signal<{ debit: number; credit: number; balance: number }>({
    debit: 0,
    credit: 0,
    balance: 0
  });

  unclearedBalance = signal<{ debit: number; credit: number; balance: number }>({
    debit: 0,
    credit: 0,
    balance: 0
  });

  // Grid configurations - initially read-only
  public reconciliationEditSettings = signal<EditSettingsModel>({
    allowEditing: false,
    allowAdding: false,
    allowDeleting: false,
    mode: 'Batch'
  });

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();

    // Set pageId for account reconciliation
    this.dataSharingService.setPageId(this.pageId);

    // Set to view mode (no new/edit modes for this component)
    this.SetPageType(3);

    // Fetch account dropdown data
    this.fetchAccountPopup();
  }

  override FormInitialize() {
    this.searchForm = new FormGroup({
      fromDate: new FormControl(
        { value: '', disabled: false },
        Validators.required
      ),
      toDate: new FormControl(
        { value: '', disabled: false },
        Validators.required
      ),
      accountId: new FormControl({ value: '', disabled: false }), // Optional
    });
    this.formUtil.thisForm = this.searchForm;
  }

  override SaveFormData() {
    // TODO: Implement save logic for BankDate changes later
    console.log('Save functionality to be implemented later');
    this.baseService.showCustomDialogue('Save functionality will be implemented later.');
  }

  override async LeftGridInit() {
    // No left grid for Account Reconciliation
    console.log('No left grid for Account Reconciliation');
  }

  override getDataById(data: any) {
    // No getDataById for this component
    console.log('getDataById not applicable for Account Reconciliation');
  }

  override onEditClick() {
    // Enable grid editing for BankDate column
    this.SetPageType(2);

    // Enable grid editing
    this.reconciliationEditSettings.set({
      allowEditing: true,
      allowAdding: false,
      allowDeleting: false,
      mode: 'Batch'
    });

    console.log('Edit mode enabled for BankDate column');
  }

  override formValidationError() {
    const c = this.searchForm?.controls || {} as any;
    const errors: string[] = [];
    if (c['fromDate']?.invalid) errors.push('From Date is required.');
    if (c['toDate']?.invalid) errors.push('To Date is required.');
    if (errors.length === 0) {
      errors.push('Please fix the highlighted fields.');
    }
    this.baseService.showCustomDialogue(errors.join('\n'));
  }

  // Fetch account dropdown/popup data
  private fetchAccountPopup(): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLACCOUNTRECOPOPUP)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.accountData = response?.data || [];
          console.log('Account popup data loaded:', this.accountData.length, 'accounts');

          // Set default date range (current month)
          this.setDefaultDateRange();
        },
        error: (error) => {
          console.error('Error fetching account popup:', error);
          this.accountData = [];
        },
      });
  }

  // Set default date range to today
  private setDefaultDateRange(): void {
    const today = new Date();

    this.searchForm.patchValue({
      fromDate: this.formatDate(today),
      toDate: this.formatDate(today),
    });
  }

  // Handle account filtering to search by both code and name
  onAccountFiltering(args: any): void {
    if (!args?.text) return;

    const query = args.text.toLowerCase();
    const allAccounts = this.accountData || [];

    // Filter by both accountCode and accountName
    const filtered = allAccounts.filter((account: any) =>
      (account?.accountCode?.toLowerCase().includes(query)) ||
      (account?.accountName?.toLowerCase().includes(query)) ||
      (account?.alias?.toLowerCase().includes(query)) ||
      (account?.name?.toLowerCase().includes(query))
    );

    args.updateData(filtered.length ? filtered : allAccounts);
  }

  // Handle search button click
  onSearchClick(): void {
    if (!this.searchForm || this.searchForm.invalid) {
      this.searchForm?.markAllAsTouched();
      this.formValidationError();
      return;
    }

    const formVals = this.searchForm.getRawValue();

    // Required: fromDate
    const fromDateIso = this.toISO(formVals.fromDate);
    if (!fromDateIso) {
      this.baseService.showCustomDialogue('From Date is required and must be valid.');
      return;
    }

    // Required: toDate
    const toDateIso = this.toISO(formVals.toDate);
    if (!toDateIso) {
      this.baseService.showCustomDialogue('To Date is required and must be valid.');
      return;
    }

    // Validate date range
    if (new Date(fromDateIso) > new Date(toDateIso)) {
      this.baseService.showCustomDialogue('From Date cannot be greater than To Date.');
      return;
    }

    // Optional: accountId
    const accountId = formVals.accountId || '';

    this.searchReconciliation(fromDateIso, toDateIso, accountId);
  }

  // Search reconciliation data
  private searchReconciliation(fromDate: string, toDate: string, accountId: string): void {
    // Extract just the date part (YYYY-MM-DD) from ISO string
    const fromDateOnly = fromDate.split('T')[0];
    const toDateOnly = toDate.split('T')[0];

    // Build URL with query parameters
    let url = `${EndpointConstant.FILLACCOUNTRECONCILIATION}${fromDateOnly}&ToDate=${toDateOnly}`;

    // Add accountId if provided
    if (accountId) {
      url += `&AccountID=${accountId}`;
    }

    console.log('Searching reconciliation with URL:', url);

    this.httpService
      .fetch<any>(url)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const accountReconcilViews = response?.data?.accountReconcilViews || [];

          // Map API response to grid format
          const reconciliationRecords = accountReconcilViews.map((record: any, index: number) => ({
            rowId: index + 1,
            id: record.id || 0,
            vNo: record.vNo || '',
            vDate: record.vDate ? this.datePipe.transform(new Date(record.vDate), 'dd/MM/yyyy') : '',
            particulars: record.particulars || '',
            transactionType: record.transactionType || '',
            vType: record.vType || '',
            instrumentNo: record.instrumentNo || '',
            instrumentDate: record.instrumentDate ? this.datePipe.transform(new Date(record.instrumentDate), 'dd/MM/yyyy') : '',
            bankDate: record.bankDate ? this.datePipe.transform(new Date(record.bankDate), 'dd/MM/yyyy') : '',
            debit: Number(record.debit) || 0,
            credit: Number(record.credit) || 0,
            balance: Number(record.balance) || 0,
            // For cleared/uncleared calculation
            cleared: !!record.bankDate, // If bankDate exists, it's cleared
          }));

          this.reconciliationData.set(reconciliationRecords);
          console.log(`Fetched ${reconciliationRecords.length} reconciliation records`);

          // Set grid to view mode (read-only) after search
          this.SetPageType(3);
          this.reconciliationEditSettings.set({
            allowEditing: false,
            allowAdding: false,
            allowDeleting: false,
            mode: 'Batch'
          });

          // Calculate summary totals
          this.calculateSummaryTotals();
        },
        error: (error) => {
          console.error('Error fetching reconciliation data:', error);
          this.reconciliationData.set([]);
          this.resetSummaryTotals();
          this.baseService.showCustomDialogue('Failed to fetch reconciliation data. Please try again.');
        },
      });
  }

  // Calculate summary totals
  private calculateSummaryTotals(): void {
    const data = this.reconciliationData();

    // Book Balance (all transactions)
    const totalDebit = data.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = data.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const bookBal = totalDebit - totalCredit;

    this.bookBalance.set({
      debit: totalDebit,
      credit: totalCredit,
      balance: bookBal
    });

    // Cleared Balance (cleared = true, i.e., bankDate exists)
    const clearedRecords = data.filter(r => r.cleared === true);
    const clearedDebit = clearedRecords.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const clearedCredit = clearedRecords.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const clearedBal = clearedDebit - clearedCredit;

    this.clearedBalance.set({
      debit: clearedDebit,
      credit: clearedCredit,
      balance: clearedBal
    });

    // Uncleared Balance (cleared = false, i.e., bankDate is null/empty)
    const unclearedRecords = data.filter(r => r.cleared === false);
    const unclearedDebit = unclearedRecords.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const unclearedCredit = unclearedRecords.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const unclearedBal = unclearedDebit - unclearedCredit;

    this.unclearedBalance.set({
      debit: unclearedDebit,
      credit: unclearedCredit,
      balance: unclearedBal
    });

    console.log('Summary Totals:', {
      book: this.bookBalance(),
      cleared: this.clearedBalance(),
      uncleared: this.unclearedBalance()
    });
  }

  // Reset summary totals
  private resetSummaryTotals(): void {
    this.bookBalance.set({ debit: 0, credit: 0, balance: 0 });
    this.clearedBalance.set({ debit: 0, credit: 0, balance: 0 });
    this.unclearedBalance.set({ debit: 0, credit: 0, balance: 0 });
  }

  // Handle cell save event (for BankDate editing)
  onReconciliationCellSave(args: any): void {
    const columnName = args.columnName;
    const rowData = args.rowData;
    const value = args.value;

    if (columnName === 'bankDate') {
      rowData.bankDate = value;
      // Update cleared status based on bankDate
      rowData.cleared = !!value;

      // Recalculate summary totals
      this.calculateSummaryTotals();

      console.log('BankDate updated:', { rowData, value });
    }
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private toISO(input: any): string | null {
    const toUtcIso = (y: number, m: number, d: number) =>
      new Date(Date.UTC(y, m, d)).toISOString();

    try {
      if (!input) return null;

      if (input instanceof Date) {
        return toUtcIso(input.getFullYear(), input.getMonth(), input.getDate());
      }

      if (typeof input === 'string') {
        const m = input.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
        if (m) {
          const day = Number(m[1]);
          const month = Number(m[2]) - 1;
          const year = Number(m[3]);
          return toUtcIso(year, month, day);
        }
        const parsed = new Date(input);
        return isNaN(parsed.getTime())
          ? null
          : toUtcIso(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      }
      return null;
    } catch {
      return null;
    }
  }
}
