import {
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FinanceAppService } from '../../http/finance-app.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EDITABLE_PERIOD, EndpointConstant } from '@org/constants';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { PVoucherModel } from '../../model/PVoucherModel';
import { DatePipe } from '@angular/common';
import { DataSharingService, BaseService } from '@org/services';
import { EditSettingsModel, GridComponent, IEditCell } from '@syncfusion/ej2-angular-grids';
import { VoucherCommonService } from '../common/services/voucher-common.service';
import { VoucherService } from '../common/services/voucher.service';

@Component({
  selector: 'app-opening-voucher',
  standalone: false,
  templateUrl: './opening-voucher.component.html',
  styles: [],
})
export class OpeningVoucherComponent extends BaseComponent implements OnInit {
  @ViewChild('accountDetailsGrid') accountDetailsGrid!: GridComponent;

  private httpService = inject(FinanceAppService);
  private datePipe = inject(DatePipe);
  private dataSharingService = inject(DataSharingService);
  private baseService = inject(BaseService);
  public voucherCommonService = inject(VoucherCommonService);
  public voucherService = inject(VoucherService);

  openingVoucherForm = this.formUtil.thisForm;
  pageId = 73;
  readonly voucherId = 26; // Opening Voucher ID

  selectedOpeningVoucherId!: number;
  currentOpeningVoucher: any = null;

  // Common fill data
  commonFillData: any = {};
  voucherName: string = '';
  readonly today = new Date();

  // Grid configurations
  public accountDetailsEditSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Batch'
  };

  // Both debit and credit edit params - disable spin buttons
  public debitEditParams: IEditCell = {
    params: { format: 'N2', decimals: 2, showSpinButton: false }
  };
  public creditEditParams: IEditCell = {
    params: { format: 'N2', decimals: 2, showSpinButton: false }
  };

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();

    // Set pageId for opening voucher
    this.dataSharingService.setPageId(this.pageId);

    // Set to new/add mode on initialization
    this.SetPageType(1);

    // Initialize grid
    this.voucherCommonService.initializeAccountDetails();

    // Fetch voucher data (name, no, date) from API
    this.fetchCommonFillData();
    this.fetchVoucherDate();

    // Fetch dropdown data from services
    this.voucherService.fetchAccountMaster();

    // Subscribe to pageId from DataSharingService
    this.dataSharingService.pageId$
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe((id) => {
        if (id !== this.pageId) {
          this.pageId = id;
          console.log('PageId updated to:', this.pageId);
          this.LeftGridInit();
        }
      });
  }

  override FormInitialize() {
    this.openingVoucherForm = new FormGroup({
      voucherName: new FormControl(
        { value: '', disabled: true },
        Validators.required
      ),
      voucherNo: new FormControl(
        { value: '', disabled: false },
        Validators.required
      ),
      voucherDate: new FormControl(
        { value: '', disabled: true },  // DISABLED - fetched from API
        Validators.required
      ),
      narration: new FormControl({ value: '', disabled: false }),
    });
    this.formUtil.thisForm = this.openingVoucherForm;
  }

  /**
   * Fetch voucher date from VOUCHERDATE API endpoint
   * Response: { isValid: true, httpCode: 200, data: "2025-12-04T00:00:00" }
   */
  private fetchVoucherDate(): void {
    this.httpService
      .fetch<any>(EndpointConstant.VOUCHERDATE)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            const voucherDate = this.datePipe.transform(new Date(response.data), 'dd/MM/yyyy');
            this.openingVoucherForm.patchValue({ voucherDate });
            console.log('✅ Voucher date fetched:', voucherDate);
          }
        },
        error: (error) => {
          console.error('Error fetching voucher date:', error);
        }
      });
  }

  override SaveFormData() {
    try {
      const isUpdate = !!(this.selectedOpeningVoucherId && this.selectedOpeningVoucherId > 0);

      // Block save when form is invalid
      if (!this.openingVoucherForm || this.openingVoucherForm.invalid) {
        this.openingVoucherForm?.markAllAsTouched();
        this.formValidationError();
        return;
      }

      const formVals = this.openingVoucherForm.getRawValue();

      // Required: voucherNo
      const voucherNo = (formVals.voucherNo ?? '').toString().trim();
      if (!voucherNo) {
        this.baseService.showCustomDialogue('Voucher No is required.');
        return;
      }

      // Required: voucherDate (must parse to ISO)
      const voucherDateIso = this.toISO(formVals.voucherDate);
      if (!voucherDateIso) {
        this.baseService.showCustomDialogue('Voucher Date is required and must be valid.');
        return;
      }

      // Get account details rows
      const accRows = this.voucherCommonService.accountDetailsData() || [];
      if (!accRows.length) {
        this.showError('Add at least one account row');
        return;
      }

      // Resolve accountId for rows that don't have it
      const accountMasterData = this.voucherService.accountMasterData();
      accRows.forEach((r: any) => {
        if (!r.accountId || Number(r.accountId) <= 0) {
          const matchedAccount = accountMasterData.find((acc: any) =>
            acc.accountCode === r.accountCode || acc.accountName === r.accountName
          );
          if (matchedAccount) {
            r.accountId = matchedAccount.id;
            console.log(`Resolved accountId for ${r.accountCode}: ${r.accountId}`);
          }
        }
      });

      // Validate that all account rows have valid accountId
      const invalidAccounts = accRows.filter((r: any) => !r.accountId || Number(r.accountId) <= 0);
      if (invalidAccounts.length > 0) {
        this.showError('Please select a valid account for all rows');
        console.error('Invalid account rows:', invalidAccounts);
        return;
      }
      debugger;

      // Build account details payload
      const accountDetails = accRows.map((r: any) => {
        const obj: any = {
          accountCode: {
            id: Number(r.accountId) || 0,
            name: r.accountName || '',
            code: r.accountCode || '',
            description: '',
          },
          description: r.description || '',
          amount: Number(r.debit || 0) || Number(r.credit || 0),
          debit: Number(r.debit) || 0,
          credit: Number(r.credit) || 0,
        };
        debugger;

        // Handle dueDate
        if (r.dueDate) {
          const dueIso = this.toISO(r.dueDate);
          if (dueIso) obj.dueDate = dueIso;
        } else {
          obj.dueDate = new Date().toISOString();
        }

        return obj;
      });

      // Build payload (simplified - no payment details, no PO allocations)
      const payload: any = {
        id: this.selectedOpeningVoucherId || 0,
        voucherNo: voucherNo,
        voucherDate: voucherDateIso,
        narration: formVals.narration || '',
        accountDetails,
      };

      // Endpoint with voucherId
      const url = isUpdate
        ? `${EndpointConstant.UPDATEOPENINGVOUCHER}${this.pageId}&VoucherId=${this.voucherId}`
        : `${EndpointConstant.SAVEOPENINGVOUCHER}${this.pageId}&VoucherId=${this.voucherId}`;

      // Debug log
      console.log('============ OPENING VOUCHER SAVE ============');
      console.log('Operation:', isUpdate ? 'UPDATE' : 'CREATE');
      console.log('Voucher ID:', this.selectedOpeningVoucherId);
      console.log('URL:', url);
      console.log('Account Details count:', accountDetails.length);
      console.log('Full Payload:', JSON.stringify(payload, null, 2));
      console.log('==============================================');

      // Use patch for updates, post for new records
      const httpRequest = isUpdate
        ? this.httpService.patch(url, payload)
        : this.httpService.post(url, payload);
        debugger;

      httpRequest
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            const httpCode = (response as any)?.httpCode ?? (response as any)?.data?.httpCode;
            const isValid = (response as any)?.isValid ?? (response as any)?.data?.isValid;
            const dataMsg = (response as any)?.data?.msg || (response as any)?.message || (response as any)?.data;

            if ((typeof httpCode === 'number' && httpCode >= 400) || isValid === false) {
              const details = typeof dataMsg === 'string' ? dataMsg : this.stringifyError(response);
              console.error('Save Opening Voucher returned error:', response);
              this.baseService.showCustomDialogue(`Save failed:\n${details}`);
              return;
            }

            const msg = (response as any)?.data?.msg || 'Opening voucher saved successfully';
            this.baseService.showCustomDialogue(msg);
            this.LeftGridInit();
          },
          error: (error) => {
            const details = this.stringifyError(error);
            console.error('Save Opening Voucher failed:', error);
            this.baseService.showCustomDialogue(`Save failed:\n${details}`);
          },
        });
    } catch (err: any) {
      const details = this.stringifyError(err);
      console.error('Save Opening Voucher exception:', err);
      this.baseService.showCustomDialogue(`Save failed:\n${details}`);
    }
  }

  override async LeftGridInit() {
    this.pageheading = 'Opening Voucher';
    try {
      const apiUrl = `${EndpointConstant.FILLALLPURCHASE}PageId=${this.pageId}`;

      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(apiUrl)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      res.data.forEach(item => {
        item.Date = this.datePipe.transform(new Date(item.Date), 'dd/MM/yyyy');
      });

      this.leftGrid.leftGridData = res.data;

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Opening Voucher List',
          columns: [
            {
              field: 'TransactionNo',
              datacol: 'TransactionNo',
              headerText: 'VNo',
              textAlign: 'Left',
            },
            {
              field: 'Date',
              datacol: 'Date',
              headerText: 'VDate',
              textAlign: 'Left'
            }
          ],
        },
      ];

      // Push updated left grid data to the shell
      this.serviceBase.dataSharingService.setData({
        columns: this.leftGrid.leftGridColumns,
        data: this.leftGrid.leftGridData,
        pageheading: this.pageheading,
      });
    } catch (err) {
      console.error('Error fetching opening vouchers:', err);
    }
  }

  override getDataById(data: PVoucherModel) {
    console.log('data', data);
    this.selectedOpeningVoucherId = data.ID;

    // Set page type to view mode
    this.SetPageType(3);

    // Disable form for viewing
    this.openingVoucherForm.disable();

    this.fetchOpeningVoucherById();
  }

  override onEditClick() {
    const selectedId = this.selectedOpeningVoucherId || (this as any).leftgridSelectedData?.ID;
    if (!selectedId || Number(selectedId) <= 0) {
      this.baseService.showCustomDialogue('Please select a voucher from the list to edit.');
      return;
    }

    if (this.isVoucherBeyondEditablePeriod()) {
      this.baseService.showCustomDialogue(`Editing disabled for vouchers older than ${EDITABLE_PERIOD} days.`);
      this.openingVoucherForm.disable({ emitEvent: false });
      this.SetPageType(3);
      return;
    }

    this.selectedOpeningVoucherId = Number(selectedId);

    // Set page type to edit mode
    this.SetPageType(2);

    // Enable the form for editing
    this.openingVoucherForm.enable();

    // Keep voucher name, voucher no, and voucher date disabled
    this.openingVoucherForm.get('voucherName')?.disable({ emitEvent: false });
    this.openingVoucherForm.get('voucherNo')?.disable({ emitEvent: false });
    this.openingVoucherForm.get('voucherDate')?.disable({ emitEvent: false });

    // Ensure dropdown data is loaded
    this.voucherService.fetchAccountMaster();

    // Fetch voucher details if not already loaded
    if (!this.currentOpeningVoucher || this.currentOpeningVoucher.id !== this.selectedOpeningVoucherId) {
      this.fetchOpeningVoucherById();
    }
  }

  override formValidationError() {
    const c = this.openingVoucherForm?.controls || {} as any;
    const errors: string[] = [];
    if (c['voucherNo']?.invalid) errors.push('Voucher No is required.');
    if (c['voucherDate']?.invalid) errors.push('Voucher Date is required.');
    if (errors.length === 0) {
      errors.push('Please fix the highlighted fields.');
    }
    this.baseService.showCustomDialogue(errors.join('\n'));
  }

  private fetchOpeningVoucherById(): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLPURCHASEBYID + this.selectedOpeningVoucherId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const transactionData = response?.data?.transaction?.fillTransactions;
          const transactionEntries = response?.data?.transaction?.fillTransactionEntries || [];

          this.currentOpeningVoucher = transactionData ?? null;

          // Format voucher date
          let formVoucherDate = null;
          if (this.currentOpeningVoucher?.date) {
            formVoucherDate = this.datePipe.transform(
              new Date(this.currentOpeningVoucher.date),
              'dd/MM/yyyy'
            );
          }

          // Fill form fields
          this.openingVoucherForm.patchValue({
            voucherName: this.voucherName || 'OPBL',
            voucherNo: this.currentOpeningVoucher?.transactionNo,
            voucherDate: formVoucherDate,
            narration: this.currentOpeningVoucher?.commonNarration,
          });

          // Fill Account Details Grid - Load ALL entries (both debit and credit)
          const accountMasterData = this.voucherService.accountMasterData();
          const accountDetails = transactionEntries.map((entry: any) => {
            let accountId = entry.accountID || entry.accountId || 0;
            if (!accountId || accountId <= 0) {
              const matchedAccount = accountMasterData.find((acc: any) =>
                acc.accountCode === entry.alias || acc.accountName === entry.name
              );
              if (matchedAccount) {
                accountId = matchedAccount.id;
              }
            }

            return {
              accountCode: entry.alias?.toString() || '',
              accountName: entry.name || '',
              accountId: accountId,
              description: entry.description || '',
              dueDate: entry.dueDate ? this.datePipe.transform(new Date(entry.dueDate), 'dd/MM/yyyy') : '',
              debit: entry.debit || 0,
              credit: entry.credit || 0,
            };
          });

          this.voucherCommonService.accountDetailsData.set(accountDetails);
          this.voucherCommonService.assignAccountRowIds();

          console.log('Account Details:', this.voucherCommonService.accountDetailsData());
        },
        error: (error) => {
          console.error('An Error Occurred', error);
        },
      });
  }

  override newbuttonClicked() {
    const currentPageType = this.serviceBase.formToolbarService.pagetype;
    const isNewMode = currentPageType === 1;

    if (isNewMode) {
      // From New mode, switch to topmost voucher in View mode
      this.viewTopVoucherFromLeftGrid();
      return;
    }

    // From other modes, return to New mode
    this.enterNewMode();
  }

  // Enter New mode with clean form
  private enterNewMode(): void {
    console.log('Entering New mode for opening voucher');

    // Set page type to new/add mode
    this.SetPageType(1);

    // Clear selected voucher data
    this.selectedOpeningVoucherId = 0;
    this.currentOpeningVoucher = null;

    // Initialize grid and clear data
    this.voucherCommonService.initializeAccountDetails();

    // Enable form for new entry
    this.openingVoucherForm.enable();

    // Keep voucher name and voucher date disabled
    this.openingVoucherForm.get('voucherName')?.disable({ emitEvent: false });
    this.openingVoucherForm.get('voucherDate')?.disable({ emitEvent: false });

    // Reset form fields
    this.openingVoucherForm.patchValue({
      narration: '',
    });

    // Refresh voucher data from API
    this.fetchCommonFillData();
    this.fetchVoucherDate();

    // Clear any left-grid selection in local state
    this.leftgridSelectedData = null;

    console.log('Form reset for new opening voucher');
  }

  // Switch to topmost voucher in View mode
  private viewTopVoucherFromLeftGrid(): void {
    const firstVoucher = Array.isArray(this.leftGrid.leftGridData) && this.leftGrid.leftGridData.length
      ? this.leftGrid.leftGridData[0]
      : null;

    if (!firstVoucher) {
      this.baseService.showCustomDialogue('No vouchers available to view.');
      return;
    }

    this.getDataById(firstVoucher);
  }

  override DeleteData(data: PVoucherModel) {
    console.log('Delete requested for opening voucher:', data);

    if (!data || !data.ID) {
      this.baseService.showCustomDialogue('Please select a valid opening voucher to delete.');
      return;
    }

    const voucherId = data.ID;
    const voucherNo = data.TransactionNo || 'Unknown';

    const confirmDelete = confirm(
      `Are you sure you want to delete Opening Voucher "${voucherNo}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      console.log('Delete cancelled by user');
      return;
    }

    this.deleteOpeningVoucher(voucherId, voucherNo);
  }

  // Fetch common fill data (voucher number, etc.)
  private fetchCommonFillData(): void {
    const endpoint = `${EndpointConstant.FILLCOMMONPURCHASEDATA}${this.pageId}&voucherId=${this.voucherId}`;

    this.httpService
      .fetch<any>(endpoint)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => this.handleCommonFillResponse(response),
        error: (error) => {
          console.error('Error loading common fill data:', error);
        },
      });
  }

  private handleCommonFillResponse(response: any): void {
    this.commonFillData = response?.data || {};
    console.log('Common fill data loaded:', this.commonFillData);
    this.setVoucherData();
  }

  private setVoucherData(): void {
    this.voucherName = this.commonFillData?.vNo?.code || 'OV';
    const voucherNo = this.commonFillData?.vNo?.result || '';

    this.openingVoucherForm.patchValue({
      voucherName: this.voucherName,
      voucherNo: voucherNo,
    });

    console.log('Voucher data set:', { voucherName: this.voucherName, voucherNo });
  }

  private isVoucherBeyondEditablePeriod(): boolean {
    const voucherDate = this.getVoucherDateForEditCheck();
    if (!voucherDate) return false;

    const msInDay = 1000 * 60 * 60 * 24;
    const ageInDays = Math.floor((Date.now() - voucherDate.getTime()) / msInDay);
    return ageInDays > EDITABLE_PERIOD;
  }

  private getVoucherDateForEditCheck(): Date | null {
    const rawDate = this.currentOpeningVoucher?.date || this.openingVoucherForm.get('voucherDate')?.value;
    if (!rawDate) return null;

    const iso = this.toISO(rawDate);
    if (!iso) return null;

    const parsed = new Date(iso);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Handle account selection in AccountCode dropdown
  onAccountSelect(args: any, data: any): void {
    const selectedAccount = args.item || args.itemData?.item;
    if (!selectedAccount) return;

    // Update account details
    Object.assign(data, {
      accountCode: selectedAccount.accountCode,
      accountName: selectedAccount.accountName,
      accountId: selectedAccount.id,
    });

    // Update the row in grid
    this.voucherCommonService.updateAccountRow(data);

    console.log(`✅ Account selected: ${selectedAccount.accountCode} - ${selectedAccount.accountName}`);
  }

  // Handle filtering in AccountCode dropdown
  onAccountFiltering(args: any): void {
    if (!args?.text) return;

    const query = args.text.toLowerCase();
    const accountMasterData = this.voucherService.accountMasterData();
    const filtered = accountMasterData.filter((account: any) =>
      account?.accountCode?.toLowerCase().includes(query) ||
      account?.accountName?.toLowerCase().includes(query)
    );

    args.updateData(filtered.length ? filtered : accountMasterData);
  }

  // Handle cellSave event - only for description and dueDate
  onAccountDetailsCellSave(args: any): void {
    debugger;
    const columnName = args.columnName;
    const rowData = args.rowData;
    const value = args.value;

    if (columnName === 'description') {
      rowData.description = value;
      this.voucherCommonService.updateAccountRow(rowData);
      return;
    }

    if (columnName === 'dueDate') {
      rowData.dueDate = value;
      this.voucherCommonService.updateAccountRow(rowData);
      return;
    }

    // For debit/credit columns, update the value and sync the row
    if (columnName === 'debit') {
      rowData.debit = value;
      this.voucherCommonService.updateAccountRow(rowData);
      return;
    }

    if (columnName === 'credit') {
      rowData.credit = value;
      this.voucherCommonService.updateAccountRow(rowData);
      return;
    }
  }

  private showError(msg: string): void {
    this.baseService.showCustomDialogue(msg);
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

  private stringifyError(err: any): string {
    try {
      const parts: string[] = [];
      if (err?.status) parts.push(`status: ${err.status}`);
      if (err?.statusText) parts.push(`statusText: ${err.statusText}`);
      if (err?.message) parts.push(`message: ${err.message}`);
      if (err?.url) parts.push(`url: ${err.url}`);
      const server = err?.error ?? err?.data ?? err?.body;
      if (server) {
        const json = typeof server === 'string' ? server : JSON.stringify(server);
        parts.push(`server: ${json}`);
      }
      return parts.join('\n');
    } catch {
      try { return JSON.stringify(err); } catch { return String(err); }
    }
  }

  private deleteOpeningVoucher(voucherId: number, voucherNo: string): void {
    const deleteUrl = `${EndpointConstant.DELETEOPENINGVOUCHER}${this.pageId}&TransId=${voucherId}`;

    console.log('Deleting opening voucher:', { voucherId, voucherNo, pageId: this.pageId, url: deleteUrl });

    this.httpService
      .delete(deleteUrl)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.handleDeleteSuccess(response, voucherNo);
        },
        error: (error) => {
          this.handleDeleteError(error, voucherNo);
        }
      });
  }

  private handleDeleteSuccess(response: any, voucherNo: string): void {
    console.log('Delete response:', response);

    const httpCode = (response as any)?.httpCode ?? (response as any)?.data?.httpCode;
    const isValid = (response as any)?.isValid ?? (response as any)?.data?.isValid;
    const dataMsg = (response as any)?.data?.msg || (response as any)?.message;

    if ((typeof httpCode === 'number' && httpCode >= 400) || isValid === false) {
      const details = typeof dataMsg === 'string' ? dataMsg : this.stringifyError(response);
      console.error('Delete opening voucher returned error:', response);
      this.baseService.showCustomDialogue(`Delete failed:\n${details}`);
      return;
    }

    const successMsg = dataMsg || `Opening Voucher "${voucherNo}" deleted successfully.`;
    this.baseService.showCustomDialogue(successMsg);

    this.clearFormAfterDelete();
    this.LeftGridInit();
  }

  private handleDeleteError(error: any, voucherNo: string): void {
    const details = this.stringifyError(error);
    console.error('Delete opening voucher failed:', error);

    this.baseService.showCustomDialogue(
      `Failed to delete Opening Voucher "${voucherNo}":\n${details}`
    );
  }

  private clearFormAfterDelete(): void {
    this.selectedOpeningVoucherId = 0;
    this.currentOpeningVoucher = null;

    this.voucherCommonService.clearAllData();

    this.openingVoucherForm.reset();
    this.openingVoucherForm.disable();

    this.SetPageType(0);

    console.log('✅ Form cleared after deletion');
  }
}
