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
import { PVoucherModel, POAllocationResult } from '../../model/PVoucherModel';
import { DatePipe } from '@angular/common';
import { DataSharingService, BaseService } from '@org/services';
import { EditSettingsModel, GridComponent, IEditCell } from '@syncfusion/ej2-angular-grids';
import { VoucherCommonService } from '../common/services/voucher-common.service';
import { VoucherService } from '../common/services/voucher.service';
import { PoallocationpopupComponent } from '../common/poallocationpopup/poallocationpopup.component';

@Component({
  selector: 'app-journal-voucher',
  standalone: false,
  templateUrl: './journal-voucher.component.html',
  styles: [],
})
export class JournalVoucherComponent extends BaseComponent implements OnInit {
  @ViewChild('poAllocationPopup') poAllocationPopup!: PoallocationpopupComponent;

  private httpService = inject(FinanceAppService);
  private datePipe = inject(DatePipe);
  private dataSharingService = inject(DataSharingService);
  private baseService = inject(BaseService);
  public voucherCommonService = inject(VoucherCommonService);
  public voucherService = inject(VoucherService);
  private lastKeyWasEnter = false;
  journalVoucherForm = this.formUtil.thisForm;
  pageId = 68;

  // Dropdown data sources
  costCentreData: any[] = [];

  selectedJournalVoucherId!: number;
  currentJournalVoucher: any = null;

  // Store reference to current row being edited for PO allocation
  private currentRowData: any;
  private currentAllocationColumn: 'debit' | 'credit' = 'debit';

  // Common fill data
  commonFillData: any = {};
  voucherName: string = '';
  readonly today = new Date();
  readonly voucherId = 6; // Journal Voucher VoucherId

  // Grid configurations
  public accountDetailsEditSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Batch'
  };
  public debitEditParams: IEditCell = {
    params: { format: 'N2', decimals: 2 , showSpinButton:false}
  };
  public creditEditParams: IEditCell = {
    params: { format: 'N2', decimals: 2, showSpinButton:false }
  };

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();

    // Set pageId for journal voucher
    this.dataSharingService.setPageId(this.pageId);

    // Set to new/add mode on initialization
    this.SetPageType(1);

    // Initialize grid
    this.voucherCommonService.initializeAccountDetails();

    // Fetch common fill data
    this.fetchCommonFillData();

    // Fetch account master from service
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
    this.journalVoucherForm = new FormGroup({
      voucherName: new FormControl(
        { value: '', disabled: true },
        Validators.required
      ),
      voucherNo: new FormControl(
        { value: '', disabled: false },
        Validators.required
      ),
      voucherDate: new FormControl(
        { value: '', disabled: false },
        Validators.required
      ),
      narration: new FormControl({ value: '', disabled: false }),
      costCentre: new FormControl({ value: '', disabled: false }),
      referenceNo: new FormControl({ value: '', disabled: false }),
      // Hidden fields with default values
      currency: new FormControl({ value: 'SAR', disabled: true }),
      exchangeRate: new FormControl({ value: 1, disabled: true }),
    });
    this.formUtil.thisForm = this.journalVoucherForm;
  }

  override SaveFormData() {
    try {
      const isUpdate = !!(this.selectedJournalVoucherId && this.selectedJournalVoucherId > 0);

      if (!this.journalVoucherForm || this.journalVoucherForm.invalid) {
        this.journalVoucherForm?.markAllAsTouched();
        this.formValidationError();
        return;
      }

      const formVals = this.journalVoucherForm.getRawValue();

      // Required: voucherNo
      const voucherNo = (formVals.voucherNo ?? '').toString().trim();
      if (!voucherNo) {
        this.baseService.showCustomDialogue('Voucher No is required.');
        return;
      }

      // Required: voucherDate
      const voucherDateIso = this.toISO(formVals.voucherDate);
      if (!voucherDateIso) {
        this.baseService.showCustomDialogue('Voucher Date is required and must be valid.');
        return;
      }

      // Account details
      // Drop trailing/empty rows before validation so blank placeholder rows don't block save
      const accRows = (this.voucherCommonService.accountDetailsData() || []).filter((row: any) => {
        const hasAccount =
          (row.accountId && Number(row.accountId) > 0) ||
          (row.accountCode && String(row.accountCode).trim() !== '') ||
          (row.accountName && String(row.accountName).trim() !== '');
        const hasAmount = (Number(row.debit) || 0) !== 0 || (Number(row.credit) || 0) !== 0;
        const hasOther =
          (row.description && String(row.description).trim() !== '') ||
          !!row.dueDate;
        return hasAccount || hasAmount || hasOther;
      });
      this.voucherCommonService.accountDetailsData.set(accRows);
      if (!accRows.length) {
        this.showError('Add at least one account row');
        return;
      }
      debugger;
      // Resolve accountId for rows
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

      // Validate all rows have accountId
      const invalidAccounts = accRows.filter((r: any) => !r.accountId || Number(r.accountId) <= 0);
      if (invalidAccounts.length > 0) {
        this.showError('Please select a valid account for all rows');
        console.error('Invalid account rows:', invalidAccounts);
        return;
      }

      // CRITICAL VALIDATION: Total debit MUST equal total credit
      const totalDebit = accRows.reduce((s: number, r: any) => s + (Number(r.debit) || 0), 0);
      const totalCredit = accRows.reduce((s: number, r: any) => s + (Number(r.credit) || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.0001) {
        this.showError(
          `Debit and Credit do not match.\nDebit: ${totalDebit.toFixed(2)}\nCredit: ${totalCredit.toFixed(2)}`
        );
        return;
      }

      // Build payload with nested billandRef
      const accountData = accRows.map((r: any) => {
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
          billandRef: [] // NESTED billandRef
        };

        if (r.dueDate) {
          const dueIso = this.toISO(r.dueDate);
          if (dueIso) obj.dueDate = dueIso;
        } else {
          obj.dueDate = new Date().toISOString();
        }

        // Add PO allocations to THIS row's billandRef
        if (Array.isArray(r.poAllocations) && r.poAllocations.length > 0) {
          obj.billandRef = r.poAllocations.map((alloc: any) => ({
            selection: alloc.selection,
            invoiceNo: alloc.invoiceNo,
            invoiceDate: this.toISO(alloc.invoiceDate) || new Date().toISOString(),
            partyInvNo: Number(alloc.partyInvNo) || 0,
            partyInvDate: this.toISO(alloc.partyInvDate) || new Date().toISOString(),
            description: alloc.description,
            account: alloc.account,
            invoiceAmount: parseFloat((Number(alloc.invoiceAmount) || 0).toFixed(2)),
            allocated: parseFloat((Number(alloc.allocated) || 0).toFixed(2)),
            amount: parseFloat((Number(alloc.amount) || 0).toFixed(2)),
            balance: parseFloat((Number(alloc.balance) || 0).toFixed(2)),
            vid: Number(alloc.vid) || 0,
            veid: Number(alloc.veid) || 0,
            accountID: Number(alloc.accountID) || 0,
            drCr: alloc.drCr || ''
          }));
        }

        return obj;
      });

      // Get cost centre object
      let costCentrePayload: any = {};
      if (formVals.costCentre) {
        const selectedCostCentre = this.costCentreData.find(c => c.id === formVals.costCentre);
        if (selectedCostCentre) {
          costCentrePayload = {
            id: selectedCostCentre.id || 0,
            name: selectedCostCentre.name || '',
            code: selectedCostCentre.code || '',
            description: selectedCostCentre.description || '',
          };
        }
      }

      // Build payload
      const payload: any = {
        id: this.selectedJournalVoucherId || 0,
        voucherNo: voucherNo,
        voucherDate: voucherDateIso,
        narration: formVals.narration || '',
        costCentre: costCentrePayload,
        referenceNo: formVals.referenceNo || '',
        currency: { id: 1, value: 'SAR' },
        exchangeRate: 1,
        accountData,
      };

      // Endpoint with PageId and voucherId
      const url = isUpdate
        ? `${EndpointConstant.UPDATEJOURNAL}${this.pageId}&voucherId=${this.voucherId}`
        : `${EndpointConstant.SAVEJOURNAL}${this.pageId}&voucherId=${this.voucherId}`;

      console.log('============ JOURNAL VOUCHER SAVE ============');
      console.log('Operation:', isUpdate ? 'UPDATE' : 'CREATE');
      console.log('Journal Voucher ID:', this.selectedJournalVoucherId);
      console.log('URL:', url);
      console.log('Account Data count:', accountData.length);
      console.log('Total Debit:', totalDebit.toFixed(2));
      console.log('Total Credit:', totalCredit.toFixed(2));

      try {
        console.log('Full Payload:', JSON.stringify(payload, null, 2));
      } catch (e) {
        console.log('Full Payload (raw):', payload);
      }
      console.log('==============================================');

      const httpRequest = isUpdate
        ? this.httpService.patch(url, payload)
        : this.httpService.post(url, payload);

      httpRequest
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            const httpCode = (response as any)?.httpCode ?? (response as any)?.data?.httpCode;
            const isValid = (response as any)?.isValid ?? (response as any)?.data?.isValid;
            const dataMsg = (response as any)?.data?.msg || (response as any)?.message || (response as any)?.data;

            if ((typeof httpCode === 'number' && httpCode >= 400) || isValid === false) {
              const details = typeof dataMsg === 'string' ? dataMsg : this.stringifyError(response);
              console.error('Save Journal Voucher returned error payload:', response);
              this.baseService.showCustomDialogue(`Save failed:\n${details}`);
              return;
            }

            const msg = (response as any)?.data?.msg || 'Journal voucher saved successfully';
            this.baseService.showCustomDialogue(msg);
            // After save, switch to view mode to disable Save button
            this.SetPageType(3);
            this.journalVoucherForm.disable({ emitEvent: false });
            this.LeftGridInit();
          },
          error: (error) => {
            const details = this.stringifyError(error);
            console.error('Save Journal Voucher failed:', error);
            this.baseService.showCustomDialogue(`Save failed:\n${details}`);
          },
        });
    } catch (err: any) {
      const details = this.stringifyError(err);
      console.error('Save Journal Voucher exception:', err);
      this.baseService.showCustomDialogue(`Save failed:\n${details}`);
    }
  }

  override async LeftGridInit() {
    this.pageheading = 'Journal Voucher';
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
          headerText: 'Journal Voucher List',
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

      this.serviceBase.dataSharingService.setData({
        columns: this.leftGrid.leftGridColumns,
        data: this.leftGrid.leftGridData,
        pageheading: this.pageheading,
      });
    } catch (err) {
      console.error('Error fetching journal vouchers:', err);
    }
  }

  override getDataById(data: PVoucherModel) {
    console.log('data', data);
    this.selectedJournalVoucherId = data.ID;

    this.SetPageType(3);
    this.journalVoucherForm.disable();
    this.fetchJournalVoucherById();
  }

  override onEditClick() {
    const selectedId = this.selectedJournalVoucherId || (this as any).leftgridSelectedData?.ID;
    if (!selectedId || Number(selectedId) <= 0) {
      this.baseService.showCustomDialogue('Please select a journal voucher from the list to edit.');
      return;
    }

    if (this.isVoucherBeyondEditablePeriod()) {
      this.baseService.showCustomDialogue(`Editing disabled for vouchers older than ${EDITABLE_PERIOD} days.`);
      this.journalVoucherForm.disable({ emitEvent: false });
      this.SetPageType(3);
      return;
    }

    this.selectedJournalVoucherId = Number(selectedId);
    this.SetPageType(2);
    this.journalVoucherForm.enable();
    this.journalVoucherForm.get('voucherName')?.disable({ emitEvent: false });
    this.journalVoucherForm.get('voucherNo')?.disable({ emitEvent: false });

    this.voucherService.fetchAccountMaster();

    if (!this.currentJournalVoucher || this.currentJournalVoucher.id !== this.selectedJournalVoucherId) {
      this.fetchJournalVoucherById();
    }
  }

  override formValidationError() {
    const c = this.journalVoucherForm?.controls || {} as any;
    const errors: string[] = [];
    if (c['voucherNo']?.invalid) errors.push('Voucher No is required.');
    if (c['voucherDate']?.invalid) errors.push('Voucher Date is required.');
    if (errors.length === 0) {
      errors.push('Please fix the highlighted fields.');
    }
    this.baseService.showCustomDialogue(errors.join('\n'));
  }

  private fetchJournalVoucherById(): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLPURCHASEBYID + this.selectedJournalVoucherId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const transactionData = response?.data?.transaction?.fillTransactions;
          const transactionEntries = response?.data?.transaction?.fillTransactionEntries || [];

          this.currentJournalVoucher = transactionData ?? null;

          let formVoucherDate = null;
          if (this.currentJournalVoucher?.date) {
            formVoucherDate = this.datePipe.transform(
              new Date(this.currentJournalVoucher.date),
              'dd/MM/yyyy'
            );
          }

          // Extract cost centre
          const costCentreId = this.currentJournalVoucher?.costCentreID || 0;

          this.journalVoucherForm.patchValue({
            voucherName: this.voucherName || 'JV',
            voucherNo: this.currentJournalVoucher?.transactionNo,
            voucherDate: formVoucherDate,
            narration: this.currentJournalVoucher?.commonNarration,
            costCentre: costCentreId,
            referenceNo: this.currentJournalVoucher?.referenceNo,
          });

          // Fill Account Details Grid - ALL entries (both debit and credit)
          const accountMasterData = this.voucherService.accountMasterData();
          const accountDetails = transactionEntries.map((entry: any) => {
            let accountId = entry.accountID || entry.accountId || 0;
            if (!accountId || accountId <= 0) {
              const matchedAccount = accountMasterData.find((acc: any) =>
                acc.accountCode === entry.alias || acc.accountName === entry.name
              );
              if (matchedAccount) {
                accountId = matchedAccount.id;
                console.log(`Resolved accountId for ${entry.alias}: ${accountId}`);
              }
            }

            const accountRow: any = {
              accountCode: entry.alias?.toString() || '',
              accountName: entry.name || '',
              accountId: accountId,
              description: entry.description || '',
              dueDate: entry.dueDate ? this.datePipe.transform(new Date(entry.dueDate), 'dd/MM/yyyy') : '',
              debit: entry.debit || 0,
              credit: entry.credit || 0,
              manualOverride: true // Existing entries are manual
            };

            // Restore PO allocations from NESTED billandRef
            if (entry.billandRef && Array.isArray(entry.billandRef)) {
              accountRow.poAllocations = entry.billandRef.map((bill: any) => ({
                selection: bill.selection,
                invoiceNo: bill.invoiceNo,
                invoiceDate: bill.invoiceDate,
                partyInvNo: bill.partyInvNo,
                partyInvDate: bill.partyInvDate,
                description: bill.description,
                account: bill.account,
                invoiceAmount: Number(bill.invoiceAmount) || 0,
                allocated: Number(bill.allocated) || 0,
                amount: Number(bill.amount) || 0,
                balance: Number(bill.balance) || 0,
                vid: bill.vid,
                veid: bill.veid,
                accountID: bill.accountID,
                drCr: bill.drCr
              }));
            }

            return accountRow;
          });

          this.voucherCommonService.accountDetailsData.set(accountDetails);
          this.voucherCommonService.assignAccountRowIds();

          console.log('Journal Voucher loaded:', this.voucherCommonService.accountDetailsData());
        },
        error: (error) => {
          console.error('Error loading journal voucher:', error);
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
    console.log('Entering New mode for journal voucher');

    // Set page type to new/add mode
    this.SetPageType(1);

    // Clear selected voucher data
    this.selectedJournalVoucherId = 0;
    this.currentJournalVoucher = null;

    // Initialize grid and clear data
    this.voucherCommonService.initializeAccountDetails();

    // Enable form for new entry
    this.journalVoucherForm.enable();

    // Keep voucher name disabled
    this.journalVoucherForm.get('voucherName')?.disable({ emitEvent: false });

    // Reset form fields
    this.journalVoucherForm.patchValue({
      narration: '',
      costCentre: null,
      referenceNo: '',
    });

    // Refresh voucher data from API
    this.fetchCommonFillData();

    // Clear any left-grid selection in local state
    this.leftgridSelectedData = null;

    console.log('Form reset for new journal voucher');
  }

  // Switch to topmost voucher in View mode
  private viewTopVoucherFromLeftGrid(): void {
    const firstVoucher = Array.isArray(this.leftGrid.leftGridData) && this.leftGrid.leftGridData.length
      ? this.leftGrid.leftGridData[0]
      : null;

    if (!firstVoucher) {
      this.baseService.showCustomDialogue('No journal vouchers available to view.');
      return;
    }

    this.getDataById(firstVoucher);
  }

  override DeleteData(data: PVoucherModel) {
    console.log('Delete requested for journal voucher:', data);

    if (!data || !data.ID) {
      this.baseService.showCustomDialogue('Please select a valid journal voucher to delete.');
      return;
    }

    const voucherId = data.ID;
    const voucherNo = data.TransactionNo || 'Unknown';

    const confirmDelete = confirm(
      `Are you sure you want to delete Journal Voucher "${voucherNo}"?\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) {
      console.log('Delete cancelled by user');
      return;
    }

    this.deleteJournalVoucher(voucherId, voucherNo);
  }

  // Handle account selection in AccountCode dropdown
  onAccountSelect(args: any, data: any): void {
    console.log('onAccountSelect called - args:', args, 'data:', data);

    const selectedAccount = args.item || args.itemData?.item || args.itemData;

    if (!selectedAccount) {
      console.warn('No selected account found in event args');
      return;
    }

    console.log('Selected account:', selectedAccount);
    debugger;
    // Update account details
    Object.assign(data, {
      accountCode: selectedAccount.accountCode,
      accountName: selectedAccount.accountName,
      accountId: selectedAccount.id,
    });

    // CRITICAL: Auto-calculate balance ONLY for new rows
    if (this.isNewRow(data) && !data.manualOverride) {
      const autoBalance = this.calculateAutoBalance(data);
      if (autoBalance.debit > 0) {
        data.debit = autoBalance.debit;
        data.credit = 0;
        console.log(`Auto-calculated Debit: ${autoBalance.debit}`);
      } else if (autoBalance.credit > 0) {
        data.credit = autoBalance.credit;
        data.debit = 0;
        console.log(`Auto-calculated Credit: ${autoBalance.credit}`);
      }
    }

    this.voucherCommonService.updateAccountRow(data);
    this.voucherCommonService.ensureTrailingEmptyAccountRow();

    console.log(`✅ Account updated successfully: ${selectedAccount.accountCode} - ${selectedAccount.accountName}`, data);
  }

  // Track last key pressed on grid to distinguish Enter vs Tab in cellSave
  onGridKeyPressed(args: any): void {
    const key = args?.key || args?.code || args?.keyCode || args?.keyAction;
    this.lastKeyWasEnter = key === 'enter' || key === 'Enter' || key === 13;
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

  // Handle cellSave event in Account Details grid - CRITICAL: Dual PO allocation
  async onAccountDetailsCellSave(args: any): Promise<void> {
    const columnName = args.columnName;
    const rowData = args.rowData;
    const value = args.value;
    const evt = args?.event;
    const key = evt?.key ?? evt?.code ?? evt?.keyCode;
    const action = evt?.action;
    const isEnter = key === 'Enter' || key === 13 || action === 'enter';
    const isTab = key === 'Tab' || key === 9 || action === 'tab';
    const shouldOpenPopup = isEnter || this.lastKeyWasEnter;
    // reset flag after read so stale enter doesn't leak
    this.lastKeyWasEnter = false;

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

    // CRITICAL: Debit column handling
    if (columnName === 'debit') {
      const debitValue = value || 0;

      // Validate that account is selected
      if (!rowData.accountId || !rowData.accountCode) {
        this.baseService.showCustomDialogue('Please select an account first before entering debit amount.');
        return;
      }

      // Mark as manual override
      rowData.manualOverride = true;
      rowData.credit = 0; // Clear opposite column
      rowData.debit = debitValue; // Persist edited value immediately

      // Update row immediately
      this.voucherCommonService.updateAccountRow(rowData);

      // Only open allocation popup when user presses Enter on the debit cell
      if (shouldOpenPopup) {
        await this.fetchAndOpenPOPopup(rowData, debitValue, 'C', 'debit');
      }
    }

    // CRITICAL: Credit column handling
    if (columnName === 'credit') {
      const creditValue = value || 0;

      // Validate that account is selected
      if (!rowData.accountId || !rowData.accountCode) {
        this.baseService.showCustomDialogue('Please select an account first before entering credit amount.');
        return;
      }

      // Mark as manual override
      rowData.manualOverride = true;
      rowData.debit = 0; // Clear opposite column
      rowData.credit = creditValue; // Persist edited value immediately

      // Update row immediately
      this.voucherCommonService.updateAccountRow(rowData);

      // Only open allocation popup when user presses Enter on the credit cell
      if (shouldOpenPopup) {
        await this.fetchAndOpenPOPopup(rowData, creditValue, 'D', 'credit');
      }

      // If user is tabbing out of last column, let grid move to next row naturally (no popup)
      if (isTab) {
        return;
      }
    }
  }

  // Fetch unpaid POs and open PO allocation popup
  private async fetchAndOpenPOPopup(
    rowData: any,
    amount: number,
    drCr: 'C' | 'D',
    column: 'debit' | 'credit'
  ): Promise<void> {
    const accountId = rowData.accountId;

    // Fetch unpaid POs from API
    const url = `${EndpointConstant.FILLADVANCE}${accountId}&voucherId=17&drcr=${drCr}`;

    try {
      const response = await firstValueFrom(
        this.httpService
          .fetch<any>(url)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      const responseData = response?.data ?? [];
      const unpaidPOs = responseData.map((item: any) => ({
        selection: item.selection ?? false,
        invoiceNo: item.vNo ?? item.invoiceNo ?? '',
        invoiceDate: this.datePipe.transform(item.vDate, 'dd/MM/yyyy') ?? '',
        partyInvNo: item.partyInvNo ?? null,
        partyInvDate: item.partyInvDate
          ? this.datePipe.transform(item.partyInvDate, 'dd/MM/yyyy')
          : null,
        description: item.description ?? null,
        account: item.account ?? null,
        invoiceAmount: Number(item.billAmount ?? item.invoiceAmount ?? 0),
        allocated: Number(item.allocated ?? 0),
        amount: Number(item.amount ?? 0),
        balance: Number((item.billAmount ?? item.invoiceAmount ?? 0) - (item.allocated ?? 0)),
        vid: item.vid,
        veid: item.veid,
        accountID: item.accountID,
        drCr: item.drCr,
      }));

      if (unpaidPOs.length > 0) {
        // Store current row and column context
        this.currentRowData = rowData;
        this.currentAllocationColumn = column;

        // Set unpaid POs in service
        this.voucherService.unpaidPOsData.set(unpaidPOs);

        // Open popup
        setTimeout(() => {
          this.poAllocationPopup.open(amount);
        }, 100);

        console.log(`Fetched ${unpaidPOs.length} unpaid POs for ${column} column (drCr=${drCr})`);
      } else {
        console.log(`No unpaid POs for account ${rowData.accountCode} (drCr=${drCr}). Manual ${column} entry: ${amount}`);
      }
    } catch (error) {
      console.error('Error fetching unpaid POs:', error);
      this.voucherService.unpaidPOsData.set([]);
    }
  }

  // Event handler - called when popup emits allocationComplete event
  onAllocationComplete(result: POAllocationResult): void {
    // Update the appropriate column (debit or credit)
    if (this.currentAllocationColumn === 'debit') {
      this.currentRowData.debit = result.totalAllocatedAmount;
      this.currentRowData.credit = 0; // Clear opposite
    } else {
      this.currentRowData.credit = result.totalAllocatedAmount;
      this.currentRowData.debit = 0; // Clear opposite
    }

    // Store PO allocations with drCr flag
    this.currentRowData.poAllocations = result.allocations.map((alloc: any) => ({
      ...alloc,
      drCr: this.currentAllocationColumn === 'debit' ? 'D' : 'C'
    }));

    // Update reference field with invoice numbers
    const existingRef = this.journalVoucherForm.get('referenceNo')?.value || '';
    const newInvoices = result.invoiceNosString;
    const combined = existingRef
      ? `${existingRef}, ${newInvoices}`
      : newInvoices;
    this.journalVoucherForm.get('referenceNo')?.setValue(combined);

    // Update the row in service
    this.voucherCommonService.updateAccountRow(this.currentRowData);

    console.log(`✅ PO Allocation completed for ${this.currentAllocationColumn} column:`, result);
  }

  // Handle actionComplete event to detect manual edits and assign rowIds
  onGridActionComplete(args: any): void {
    console.log('Grid action complete:', args.requestType);

    // Assign rowIds when rows are added or modified
    if (args.requestType === 'add' || args.requestType === 'beginEdit' || args.requestType === 'save') {
      // Reassign all rowIds to ensure they're sequential
      this.voucherCommonService.assignAccountRowIds();
      console.log('Row IDs reassigned:', this.voucherCommonService.accountDetailsData());
    }

    if (args.requestType === 'save') {
      const rowData = args.data;

      // If user manually entered an amount, flag it
      if (rowData && (rowData.debit > 0 || rowData.credit > 0)) {
        rowData.manualOverride = true;
      }
    }
  }

  // Calculate auto-balance amount for a new row
  private calculateAutoBalance(currentRow: any): { debit: number; credit: number } {
    const allRows = this.voucherCommonService.accountDetailsData();

    // Calculate running totals EXCLUDING current row
    let totalDebit = 0;
    let totalCredit = 0;

    allRows.forEach((row: any) => {
      if (row.rowId !== currentRow.rowId) {
        totalDebit += Number(row.debit) || 0;
        totalCredit += Number(row.credit) || 0;
      }
    });

    // Calculate difference
    const difference = Math.abs(totalDebit - totalCredit);

    if (difference === 0) {
      return { debit: 0, credit: 0 }; // Already balanced
    }

    // Populate opposite of larger side
    if (totalDebit > totalCredit) {
      return { debit: 0, credit: difference };
    } else {
      return { debit: difference, credit: 0 };
    }
  }

  // Check if a row is new (no existing debit/credit values)
  private isNewRow(row: any): boolean {
    return (Number(row.debit) || 0) === 0 && (Number(row.credit) || 0) === 0;
  }

  // Calculate total debit
  calculateTotalDebit(): number {
    const rows = this.voucherCommonService.accountDetailsData();
    return rows.reduce((sum: number, r: any) => sum + (Number(r.debit) || 0), 0);
  }

  // Calculate total credit
  calculateTotalCredit(): number {
    const rows = this.voucherCommonService.accountDetailsData();
    return rows.reduce((sum: number, r: any) => sum + (Number(r.credit) || 0), 0);
  }

  // Calculate difference between debit and credit
  calculateDifference(): number {
    return Math.abs(this.calculateTotalDebit() - this.calculateTotalCredit());
  }

  // Check if debit and credit are balanced
  isBalanced(): boolean {
    return this.calculateDifference() < 0.01;
  }

  // Fetch common fill data
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
    debugger;
    // Extract cost centre dropdown
    this.costCentreData = this.commonFillData?.costCentre || [];

    this.setVoucherData();
  }

  private setVoucherData(): void {
    const formattedDate = this.formatDate(this.today);
    this.voucherName = this.commonFillData?.vNo?.code || 'JV';
    const voucherNo = this.commonFillData?.vNo?.result || '';

    this.journalVoucherForm.patchValue({
      voucherName: this.voucherName,
      voucherNo: voucherNo,
      voucherDate: formattedDate,
    });

    console.log('Voucher data set:', { voucherName: this.voucherName, voucherNo });
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private isVoucherBeyondEditablePeriod(): boolean {
    const voucherDate = this.getVoucherDateForEditCheck();
    if (!voucherDate) return false;

    const msInDay = 1000 * 60 * 60 * 24;
    const ageInDays = Math.floor((Date.now() - voucherDate.getTime()) / msInDay);
    return ageInDays > EDITABLE_PERIOD;
  }

  private getVoucherDateForEditCheck(): Date | null {
    const rawDate = this.currentJournalVoucher?.date || this.journalVoucherForm.get('voucherDate')?.value;
    if (!rawDate) return null;

    const iso = this.toISO(rawDate);
    if (!iso) return null;

    const parsed = new Date(iso);
    return isNaN(parsed.getTime()) ? null : parsed;
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

  private deleteJournalVoucher(voucherId: number, voucherNo: string): void {
    const deleteUrl = `${EndpointConstant.DELETEJOURNAL}${this.pageId}&TransId=${voucherId}`;

    console.log('Deleting journal voucher:', { voucherId, voucherNo, pageId: this.pageId, url: deleteUrl });

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
      console.error('Delete journal voucher returned error:', response);
      this.baseService.showCustomDialogue(`Delete failed:\n${details}`);
      return;
    }

    const successMsg = dataMsg || `Journal Voucher "${voucherNo}" deleted successfully.`;
    this.baseService.showCustomDialogue(successMsg);

    this.clearFormAfterDelete();
    this.LeftGridInit();
  }

  private handleDeleteError(error: any, voucherNo: string): void {
    const details = this.stringifyError(error);
    console.error('Delete journal voucher failed:', error);

    this.baseService.showCustomDialogue(
      `Failed to delete Journal Voucher "${voucherNo}":\n${details}`
    );
  }

  private clearFormAfterDelete(): void {
    this.selectedJournalVoucherId = 0;
    this.currentJournalVoucher = null;

    this.voucherCommonService.clearAllData();

    this.journalVoucherForm.reset();
    this.journalVoucherForm.disable();

    this.SetPageType(0);

    console.log('✅ Form cleared after deletion');
  }
}
