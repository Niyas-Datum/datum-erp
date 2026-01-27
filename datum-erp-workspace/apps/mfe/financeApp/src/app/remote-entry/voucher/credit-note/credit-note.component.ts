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
  selector: 'app-credit-note',
  standalone: false,
  templateUrl: './credit-note.component.html',
  styles: [],
})
export class CreditNoteComponent extends BaseComponent implements OnInit {
  @ViewChild('poAllocationPopup') poAllocationPopup!: PoallocationpopupComponent;

  private httpService = inject(FinanceAppService);
  private datePipe = inject(DatePipe);
  private dataSharingService = inject(DataSharingService);
  private baseService = inject(BaseService);
  public voucherCommonService = inject(VoucherCommonService);
  public voucherService = inject(VoucherService);
  creditNoteForm = this.formUtil.thisForm;
  pageId = 251;

  // Dropdown data sources
  customerData: any[] = [];
  particularsData: any[] = [];

  selectedCreditNoteId!: number;
  currentCreditNote: any = null;
  selectedCustomerId: number = 0;

  // Store reference to current row being edited for PO allocation
  private currentRowData: any;

  // Store original billandRef data when loading for edit
  private originalBillAndRef: any[] = [];

  // Common fill data
  commonFillData: any = {};
  voucherName: string = '';
  readonly today = new Date();
  readonly voucherId = 77; // Credit Note VoucherId

  // Grid configurations
  public accountDetailsEditSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Batch'
  };
  public debitEditParams: IEditCell = {
    params: { format: 'N2', decimals: 2 , showSpinButton: false}
  };

  constructor() {
    super();
    this.commonInit();
  }

  private updateGridEditSettings(): void {
    const pageType = this.serviceBase.formToolbarService.pagetype;

    if (pageType === 3) {
      // View mode - disable editing
      this.accountDetailsEditSettings = {
        allowEditing: false,
        allowAdding: false,
        allowDeleting: false,
        mode: 'Batch'
      };
    } else {
      // New or Edit mode - enable editing
      this.accountDetailsEditSettings = {
        allowEditing: true,
        allowAdding: true,
        allowDeleting: true,
        mode: 'Batch'
      };
    }
  }

  ngOnInit(): void {
    this.onInitBase();

    // Set pageId for credit note
    this.dataSharingService.setPageId(this.pageId);

    // Set to new/add mode on initialization
    this.SetPageType(1);

    // Initialize grid
    this.voucherCommonService.initializeAccountDetails();

    // Fetch common fill data
    this.fetchCommonFillData();

    // Fetch customer dropdown
    this.fetchCustomerData();

    // Fetch particulars dropdown
    this.fetchParticularsData();

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
    this.creditNoteForm = new FormGroup({
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
      referenceNo: new FormControl({ value: '', disabled: false }),
      customerId: new FormControl({ value: 0, disabled: false }), // Hidden field
      customerName: new FormControl({ value: '', disabled: false }, Validators.required),
      particulars: new FormControl({ value: '', disabled: false }),
    });
    this.formUtil.thisForm = this.creditNoteForm;
  }

  override SaveFormData() {
    try {
      const isUpdate = !!(this.selectedCreditNoteId && this.selectedCreditNoteId > 0);

      if (!this.creditNoteForm || this.creditNoteForm.invalid) {
        this.creditNoteForm?.markAllAsTouched();
        this.formValidationError();
        return;
      }

      const formVals = this.creditNoteForm.getRawValue();

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

      // Required: Customer
      if (!this.selectedCustomerId || this.selectedCustomerId <= 0) {
        this.baseService.showCustomDialogue('Please select a customer.');
        return;
      }

      // Account details (debit only)
      const accRows = this.voucherCommonService.accountDetailsData() || [];
      if (!accRows.length) {
        this.showError('Add at least one account (debit) row');
        return;
      }

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
        this.showError('Please select a valid account for all debit rows');
        console.error('Invalid account rows:', invalidAccounts);
        return;
      }

      const accountDetails = accRows.map((r: any) => {
        const obj: any = {
          accountCode: {
            id: Number(r.accountId) || 0,
            name: r.accountName || '',
            code: r.accountCode || '',
            description: '',
          },
          debit: Number(r.debit) || 0,
          credit: 0,
        };
        if (r.description) obj.description = r.description;

        if (r.dueDate) {
          const dueIso = this.toISO(r.dueDate);
          if (dueIso) obj.dueDate = dueIso;
        } else {
          obj.dueDate = new Date().toISOString();
        }

        return obj;
      });

      const debitTotal = accountDetails.reduce((s: number, x: any) => s + (Number(x.debit) || 0), 0);
      if (debitTotal <= 0) {
        this.showError('Total debit must be greater than zero');
        return;
      }

      // Build billandRef from PO allocations
      let billandRef = this.buildBillAndRef(accRows, isUpdate);

      if (isUpdate && this.originalBillAndRef.length > 0 && (!billandRef || billandRef.length === 0)) {
        billandRef = this.normalizeBillAndRef(this.originalBillAndRef);
        console.log('Using normalized original billandRef for update:', billandRef);
      } else {
        console.log('Built new billandRef:', billandRef);
      }

      // Validate allocation sums per debit row
      for (const row of accRows) {
        if (Array.isArray(row.poAllocations) && row.poAllocations.length) {
          const sumAlloc = row.poAllocations.reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0);
          const rowDebit = Number(row.debit) || 0;

          if (Math.abs(sumAlloc - rowDebit) > 0.0001) {
            this.showError(`Allocation total (${sumAlloc.toFixed(2)}) does not match row debit (${rowDebit.toFixed(2)}) for account ${row.accountName || ''}`);
            return;
          }
        }
      }

      // Get customer object
      const selectedCustomer = this.customerData.find(c => c.id === this.selectedCustomerId);
      const partyPayload = selectedCustomer ? {
        id: selectedCustomer.id || 0,
        name: selectedCustomer.name || '',
        code: selectedCustomer.code || '',
        description: selectedCustomer.description || '',
      } : { id: 0, name: '', code: '', description: '' };

      // Get particulars object
      const selectedParticulars = this.particularsData.find(p => p.id === formVals.particulars);
      const particularsPayload = selectedParticulars ? {
        id: selectedParticulars.id || 0,
        value: selectedParticulars.name || '',
      } : {}


      // Build payload
      const payload: any = {
        id: this.selectedCreditNoteId || 0,
        voucherNo: voucherNo,
        voucherDate: voucherDateIso,
        reference: formVals.referenceNo || '',
        party: partyPayload,
        particulars: particularsPayload,
        narration: formVals.narration || '',
        accountDetails,
        billandRef,
      };

      // Endpoint with PageId and voucherId
      const url = isUpdate
        ? `${EndpointConstant.UPDATECREDITNOTE}${this.pageId}&voucherId=${this.voucherId}`
        : `${EndpointConstant.SAVECREDIT}${this.pageId}&voucherId=${this.voucherId}`;

      console.log('============ CREDIT NOTE SAVE ============');
      console.log('Operation:', isUpdate ? 'UPDATE' : 'CREATE');
      console.log('Credit Note ID:', this.selectedCreditNoteId);
      console.log('URL:', url);
      console.log('BillandRef count:', billandRef.length);
      console.log('Account Details count:', accountDetails.length);

      try {
        console.log('Full Payload:', JSON.stringify(payload, null, 2));
      } catch (e) {
        console.log('Full Payload (raw):', payload);
      }
      console.log('==============================================');

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
              console.error('Save Credit Note returned error payload:', response);
              this.baseService.showCustomDialogue(`Save failed:\n${details}`);
              return;
            }

            const msg = (response as any)?.data?.msg || 'Credit note saved successfully';
            this.baseService.showCustomDialogue(msg);
            // After save, switch to view mode to disable Save button
            this.SetPageType(3);
            this.updateGridEditSettings();
            this.creditNoteForm.disable({ emitEvent: false });
            this.LeftGridInit();
          },
          error: (error) => {
            const details = this.stringifyError(error);
            console.error('Save Credit Note failed:', error);
            this.baseService.showCustomDialogue(`Save failed:\n${details}`);
          },
        });
    } catch (err: any) {
      const details = this.stringifyError(err);
      console.error('Save Credit Note exception:', err);
      this.baseService.showCustomDialogue(`Save failed:\n${details}`);
    }
  }

  override async LeftGridInit() {
    this.pageheading = 'Credit Note';
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
          headerText: 'Credit Note List',
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
      console.error('Error fetching credit notes:', err);
    }
  }

  override getDataById(data: PVoucherModel) {
    console.log('data', data);
    this.selectedCreditNoteId = data.ID;

    this.SetPageType(3);
    this.updateGridEditSettings();
    this.creditNoteForm.disable();
    this.fetchCreditNoteById();
  }

  override onEditClick() {
    const selectedId = this.selectedCreditNoteId || (this as any).leftgridSelectedData?.ID;
    if (!selectedId || Number(selectedId) <= 0) {
      this.baseService.showCustomDialogue('Please select a credit note from the list to edit.');
      return;
    }

    if (this.isVoucherBeyondEditablePeriod()) {
      this.baseService.showCustomDialogue(`Editing disabled for vouchers older than ${EDITABLE_PERIOD} days.`);
      this.creditNoteForm.disable({ emitEvent: false });
      this.SetPageType(3);
      this.updateGridEditSettings();
      return;
    }

    this.selectedCreditNoteId = Number(selectedId);
    this.SetPageType(2);
    this.updateGridEditSettings();
    this.creditNoteForm.enable();
    this.creditNoteForm.get('voucherName')?.disable({ emitEvent: false });
    this.creditNoteForm.get('voucherNo')?.disable({ emitEvent: false });

    this.voucherService.fetchAccountMaster();

    if (!this.currentCreditNote || this.currentCreditNote.id !== this.selectedCreditNoteId) {
      this.fetchCreditNoteById();
    }
  }

  override formValidationError() {
    const c = this.creditNoteForm?.controls || {} as any;
    const errors: string[] = [];
    if (c['voucherNo']?.invalid) errors.push('Voucher No is required.');
    if (c['voucherDate']?.invalid) errors.push('Voucher Date is required.');
    if (c['customerName']?.invalid) errors.push('Customer is required.');
    if (errors.length === 0) {
      errors.push('Please fix the highlighted fields.');
    }
    this.baseService.showCustomDialogue(errors.join('\n'));
  }

  private fetchCreditNoteById(): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLPURCHASEBYID + this.selectedCreditNoteId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const transactionData = response?.data?.transaction?.fillTransactions;
          const additionalData = response?.data?.transaction?.fillAdditionals;
          const transactionEntries = response?.data?.transaction?.fillTransactionEntries || [];
          const billAndRefData = response?.data?.voucherAllocation?.data || [];

          this.originalBillAndRef = billAndRefData;
          this.currentCreditNote = transactionData ?? null;
          debugger;

          let formVoucherDate = null;
          if (this.currentCreditNote?.date) {
            formVoucherDate = this.datePipe.transform(
              new Date(this.currentCreditNote.date),
              'dd/MM/yyyy'
            );
          }

          // Extract customer and particulars
          const customerId = this.currentCreditNote.accountID || 0;
          const particularsId = additionalData?.typeID || 0;
          debugger;
          this.selectedCustomerId = customerId;

          this.creditNoteForm.patchValue({
            voucherName: this.voucherName || 'CN',
            voucherNo: this.currentCreditNote?.transactionNo,
            voucherDate: formVoucherDate,
            narration: this.currentCreditNote?.commonNarration,
            referenceNo: this.currentCreditNote?.referenceNo,
            customerId: customerId,
            customerName: customerId,
            particulars: particularsId,
          });

          // Fill Account Details Grid (Debit entries - DrCr = "D")
          const accountMasterData = this.voucherService.accountMasterData();
          const accountDetails = transactionEntries
            .filter((entry: any) => entry.drCr === 'D')
            .map((entry: any) => {
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
                originalDebit: entry.debit || 0,
                originalAccountId: accountId
              };

              // Restore PO allocations for this customer
              const poAllocationsForAccount = billAndRefData
                .filter((bill: any) => Number(bill.AccountID ?? bill.accountID) === Number(customerId))
                .map((bill: any) => {
                  const invoiceAmount = Number(bill.BillAmount || bill.invoiceAmount || 0);
                  const allocated = Number(bill.Allocated || bill.allocated || 0);
                  const amount = Number(bill.Amount || bill.amount || 0);
                  const balance = invoiceAmount - (allocated + amount);
                  debugger;
                  return {
                    selection: !!(bill.Selection || bill.selection),
                    invoiceNo: bill.VNo || bill.invoiceNo || '',
                    invoiceDate: bill.VDate || bill.invoiceDate || '',
                    partyInvNo: bill.partyInvNo || 0,
                    partyInvDate: bill.partyInvDate || '',
                    description: bill.Description || bill.description || '',
                    account: bill.account || '',
                    invoiceAmount,
                    allocated,
                    amount,
                    balance,
                    vid: bill.VID || bill.vid || 0,
                    veid: bill.VEID || bill.veid || 0,
                    accountID: bill.AccountID || bill.accountID || 0,
                    drCr: bill.drCr || 'C'
                  };
                });

              if (poAllocationsForAccount.length > 0) {
                accountRow.poAllocations = poAllocationsForAccount;
              }
              debugger;

              return accountRow;
            });

          this.voucherCommonService.accountDetailsData.set(accountDetails);
          this.voucherCommonService.assignAccountRowIds();

          console.log('Account Details loaded:', this.voucherCommonService.accountDetailsData());
        },
        error: (error) => {
          console.error('Error loading credit note:', error);
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
    console.log('Entering New mode for credit note');

    // Set page type to new/add mode
    this.SetPageType(1);
    this.updateGridEditSettings();

    // Clear selected voucher data
    this.selectedCreditNoteId = 0;
    this.currentCreditNote = null;
    this.selectedCustomerId = 0;
    this.originalBillAndRef = [];

    // Initialize grid and clear data
    this.voucherCommonService.initializeAccountDetails();

    // Enable form for new entry
    this.creditNoteForm.enable();

    // Keep voucher name disabled
    this.creditNoteForm.get('voucherName')?.disable({ emitEvent: false });

    // Reset form fields
    this.creditNoteForm.patchValue({
      narration: '',
      referenceNo: '',
      customerId: 0,
      customerName: null,
      particulars: null,
    });

    // Refresh voucher data from API
    this.fetchCommonFillData();

    // Clear any left-grid selection in local state
    this.leftgridSelectedData = null;

    console.log('Form reset for new credit note');
  }

  // Switch to topmost voucher in View mode
  private viewTopVoucherFromLeftGrid(): void {
    const firstVoucher = Array.isArray(this.leftGrid.leftGridData) && this.leftGrid.leftGridData.length
      ? this.leftGrid.leftGridData[0]
      : null;

    if (!firstVoucher) {
      this.baseService.showCustomDialogue('No credit notes available to view.');
      return;
    }

    this.getDataById(firstVoucher);
  }

  override DeleteData(data: PVoucherModel) {
    console.log('Delete requested for credit note:', data);

    if (!data || !data.ID) {
      this.baseService.showCustomDialogue('Please select a valid credit note to delete.');
      return;
    }

    const voucherId = data.ID;
    const voucherNo = data.TransactionNo || 'Unknown';

    const confirmDelete = confirm(
      `Are you sure you want to delete Credit Note "${voucherNo}"?\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) {
      console.log('Delete cancelled by user');
      return;
    }

    this.deleteCreditNote(voucherId, voucherNo);
  }

  // Customer dropdown selection handler
  onCustomerSelect(args: any): void {
    const selectedCustomer = args.itemData || args.item;

    if (!selectedCustomer) return;

    const previousCustomerId = this.selectedCustomerId;
    this.selectedCustomerId = selectedCustomer.id || 0;

    // If customer changed and there are existing allocations, warn and clear
    if (previousCustomerId && previousCustomerId !== this.selectedCustomerId) {
      this.clearAllPOAllocations();
      console.warn('Customer changed - all PO allocations cleared');
    }

    // Store customer ID in form
    this.creditNoteForm.patchValue({ customerId: this.selectedCustomerId });

    console.log('Customer selected:', selectedCustomer.name, 'ID:', this.selectedCustomerId);
  }

  // Handle filtering in Customer dropdown - search by both code and name
  onCustomerFiltering(args: any): void {
    if (!args?.text) return;

    const query = args.text.toLowerCase();
    const filtered = this.customerData.filter((customer: any) =>
      customer?.code?.toLowerCase().includes(query) ||
      customer?.name?.toLowerCase().includes(query)
    );

    args.updateData(filtered.length ? filtered : this.customerData);
  }

  // Clear all PO allocations when customer changes
  private clearAllPOAllocations(): void {
    const accountRows = this.voucherCommonService.accountDetailsData();
    accountRows.forEach((row: any) => {
      if (row.poAllocations && row.poAllocations.length > 0) {
        row.poAllocations = [];
      }
    });
    this.voucherCommonService.accountDetailsData.set([...accountRows]);
    this.creditNoteForm.patchValue({ referenceNo: '' });
    console.log('All PO allocations cleared due to customer change');
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
    this.setVoucherData();
  }

  private setVoucherData(): void {
    const formattedDate = this.formatDate(this.today);
    this.voucherName = this.commonFillData?.vNo?.code || 'CN';
    const voucherNo = this.commonFillData?.vNo?.result || '';

    this.creditNoteForm.patchValue({
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
    const rawDate = this.currentCreditNote?.date || this.creditNoteForm.get('voucherDate')?.value;
    if (!rawDate) return null;

    const iso = this.toISO(rawDate);
    if (!iso) return null;

    const parsed = new Date(iso);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Fetch customer data
  private fetchCustomerData(): void {
    const endpoint = `${EndpointConstant.FILLCUSTOMERCN}${this.voucherId}`;

    this.httpService
      .fetch<any>(endpoint)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const responseData = response?.data || [];
          this.customerData = responseData.map((item: any) => ({
            id: item.id || item.partyID || 0,
            name: item.accountName || item.name || '',
            code: item.accountCode || item.code || '',
            description: item.description || '',
            partyID: item.partyID || 0,
            address: item.address || '',
            mobileNo: item.mobileNo || '',
            vatNo: item.vatNo || '',
            accBalance: item.accBalance || 0,
          }));
          console.log('Customer Data loaded:', this.customerData);
        },
        error: (error) => {
          console.error('Error fetching customer data:', error);
        },
      });
  }

  // Fetch particulars data using FILLPARTICULAR endpoint with CreditnoteType
  private fetchParticularsData(): void {
    const endpoint = `${EndpointConstant.FILLPARTICULAR}CreditnoteType`;

    this.httpService
      .fetch<any>(endpoint)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          // Response data is nested array: [[{id, value}]]
          const responseData = Array.isArray(response?.data?.[0]) ? response.data[0] : [];
          this.particularsData = responseData.map((item: any) => ({
            id: item.id || 0,
            name: item.value || '',
          }));
          console.log('Particulars Data loaded:', this.particularsData);
        },
        error: (error) => {
          console.error('Error fetching particulars data:', error);
        },
      });
  }

  // Handle account selection in AccountCode dropdown
  onAccountSelect(args: any, data: any): void {
    const selectedAccount = args.item || args.itemData?.item;

    if (!selectedAccount) return;

    const isEditMode = this.serviceBase.formToolbarService.pagetype === 2;
    const previousAccountId = data.accountId;
    const hasExistingAllocations = Array.isArray(data.poAllocations) && data.poAllocations.length > 0;
    const accountChanged = previousAccountId && previousAccountId !== selectedAccount.id;

    if (isEditMode && accountChanged && hasExistingAllocations) {
      const allocCount = data.poAllocations.length;
      const totalAllocated = data.poAllocations.reduce((sum: number, a: any) =>
        sum + (Number(a.amount) || 0), 0);

      const warningMsg =
        `Account changed. Clearing ${allocCount} PO allocation(s) ` +
        `(Total: ${totalAllocated.toFixed(2)}) from previous account. ` +
        `Debit amount (${data.debit}) will be preserved.`;

      console.warn(warningMsg);
      this.clearAccountAllocations(data, previousAccountId);
    }

    Object.assign(data, {
      accountCode: selectedAccount.accountCode,
      accountName: selectedAccount.accountName,
      accountId: selectedAccount.id,
    });

    this.voucherCommonService.updateAccountRow(data);

    console.log(`✅ Account ${accountChanged ? 'changed' : 'selected'}: ${selectedAccount.accountCode} - ${selectedAccount.accountName}${accountChanged ? `, debit preserved: ${data.debit}` : ''}`);
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

  // Handle cellSave event in Account Details grid - CRITICAL: Opens PO popup on DEBIT column
  async onAccountDetailsCellSave(args: any): Promise<void> {
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

    // CRITICAL: Check if DEBIT column was edited (Credit Note uses Debit, not Credit)
    if (columnName === 'debit') {
      const debitValue = value || 0;

      // Validate that customer is selected first
      if (!this.selectedCustomerId || this.selectedCustomerId <= 0) {
        this.baseService.showCustomDialogue('Please select a customer first before entering debit amount.');
        return;
      }

      // Validate that account is selected
      if (!rowData.accountId || !rowData.accountCode) {
        this.baseService.showCustomDialogue('Please select an account first before entering debit amount.');
        return;
      }

      // In edit mode, prepare unpaid POs with current allocations
      const isEditMode = this.serviceBase.formToolbarService.pagetype === 2;
      debugger;
      if (isEditMode) {
        await this.prepareUnpaidPOsForEdit(rowData);
      } else {
        // In new mode, just fetch unpaid POs for the selected CUSTOMER
        await this.fetchUnpaidPOsForCustomer(this.selectedCustomerId);
      }

      // Check if customer has unpaid POs
      if (this.voucherService.unpaidPOsData().length > 0) {
        setTimeout(() => {
          this.openPOAllocationPopup(debitValue, rowData);
        }, 100);
      } else {
        console.log(`ℹ️ No unpaid POs for customer ID ${this.selectedCustomerId}. Manual debit entry: ${debitValue}`);
      }
    }
  }

  // Fetch unpaid POs for customer (CRITICAL: Uses customerId, not accountId)
  private async fetchUnpaidPOsForCustomer(customerId: number): Promise<void> {
    if (!customerId || customerId <= 0) {
      console.warn('Invalid customer ID for fetching unpaid POs');
      return;
    }

    // Fetch unpaid invoices using voucherId=17 (Invoice ID) and drcr=D
    const url = `${EndpointConstant.FILLADVANCE}${customerId}&voucherId=17&drcr=D`;

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
        balance: Number(
          (item.billAmount ?? item.invoiceAmount ?? 0) - (item.allocated ?? 0)
        ),
        vid: item.vid,
        veid: item.veid,
        accountID: item.accountID,
        drCr: item.drCr,
      }));

      this.voucherService.unpaidPOsData.set(unpaidPOs);
      console.log(`✅ Fetched ${unpaidPOs.length} unpaid POs for customer ID ${customerId}`);
    } catch (err) {
      console.error('Error fetching unpaid POs for customer:', err);
      this.voucherService.unpaidPOsData.set([]);
    }
  }

  // Prepare unpaid POs for edit mode - merge with existing allocations (similar to Debit Note)
  private async prepareUnpaidPOsForEdit(rowData: any): Promise<void> {
    if (!rowData) return;

    const customerId = this.selectedCustomerId;
    let unpaidPOs: any[] = [];

    // Fetch unpaid POs for this customer
    if (customerId) {
      const url = `${EndpointConstant.FILLADVANCE}${customerId}&voucherId=17&drcr=D`;

      try {
        const response = await firstValueFrom(
          this.httpService
            .fetch<any>(url)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        );

        const responseData = response?.data ?? [];
        debugger;
        // Transform API response to unpaid PO format
        unpaidPOs = responseData.map((item: any) => ({
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
          balance: Number(
            (item.billAmount ?? item.invoiceAmount ?? 0) - (item.allocated ?? 0)
          ),
          vid: item.vid,
          veid: item.veid,
          accountID: item.accountID,
          drCr: item.drCr,
        }));
      } catch (err) {
        console.error('Error fetching unpaid POs for edit mode:', err);
        unpaidPOs = [];
      }
    }

    // Get allocated POs from all rows (for credit note, all rows share same customer)
    const accountRows = this.voucherCommonService.accountDetailsData() || [];
    const allocatedPOs = accountRows
      .flatMap((row: any) => row.poAllocations || []);
      debugger;

    // Merge using invoice number as key: unpaid POs first, allocated POs override
    const byInvoice: Record<string, any> = {};

    // First, add all unpaid POs
    unpaidPOs.forEach(po => {
      const key = (po.invoiceNo || '').toString();
      if (key) byInvoice[key] = po;
    });

    // Then, replace with allocated POs (they take priority)
    allocatedPOs.forEach((po: any) => {
      const key = (po.invoiceNo || '').toString();
      if (key) byInvoice[key] = po;
    });

    const merged = Object.values(byInvoice);
    debugger;
    this.voucherService.unpaidPOsData.set(merged);

    console.log(`✅ Prepared ${merged.length} POs for edit mode (customer ID: ${customerId})`);
  }

  // Open PO Allocation popup
  openPOAllocationPopup(debitAmount: number, rowData: any): void {
    this.currentRowData = rowData;
    this.poAllocationPopup.open(debitAmount);
  }

  // Event handler - called when popup emits allocationComplete event
  onAllocationComplete(result: POAllocationResult): void {
    this.currentRowData.debit = result.totalAllocatedAmount;
    this.creditNoteForm.get('referenceNo')?.setValue(result.invoiceNosString);
    this.currentRowData.poAllocations = result.allocations;
    this.voucherCommonService.updateAccountRow(this.currentRowData);
    console.log('✅ PO Allocation completed:', result);
  }

  // Clear PO allocations when account changes
  private clearAccountAllocations(rowData: any, oldAccountId: number): void {
    const currentDebit = rowData.debit || 0;
    const clearedCount = rowData.poAllocations?.length || 0;
    rowData.poAllocations = [];
    rowData.debit = currentDebit;
    this.voucherService.unpaidPOsData.set([]);
    this.updateReferenceFieldOnAccountChange(rowData);
    console.log(`✅ Cleared ${clearedCount} allocation(s) for old account ID: ${oldAccountId}, kept debit: ${currentDebit}`);
  }

  private updateReferenceFieldOnAccountChange(clearedRow: any): void {
    const allRows = this.voucherCommonService.accountDetailsData();
    const remainingInvoiceNumbers: string[] = [];

    allRows.forEach(row => {
      if (row.rowId !== clearedRow.rowId && Array.isArray(row.poAllocations)) {
        row.poAllocations.forEach((alloc: any) => {
          if (alloc.invoiceNo) {
            remainingInvoiceNumbers.push(alloc.invoiceNo);
          }
        });
      }
    });

    const newReferenceNo = remainingInvoiceNumbers.join(', ');
    this.creditNoteForm.get('referenceNo')?.setValue(newReferenceNo);
    console.log(`📝 Updated reference field: "${newReferenceNo}"`);
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

  private buildBillAndRef(accRows: any[], isUpdate: boolean): any[] {
    const out: any[] = [];

    for (const r of accRows) {
      if (Array.isArray(r.poAllocations)) {
        for (const alloc of r.poAllocations) {
          const item: any = {
            selection: alloc.selection,
            vNo: alloc.invoiceNo,
            billAmount: parseFloat((Number(alloc.invoiceAmount) || 0).toFixed(2)),
            allocated: parseFloat((Number(alloc.allocated) || 0).toFixed(2)),
            amount: parseFloat((Number(alloc.amount) || 0).toFixed(2)),
            description: alloc.description || '',
            account: alloc.account || '',
            vid: Number(alloc.vid) || 0,
            veid: Number(alloc.veid) || 0,
            accountID: Number(alloc.AccountID || alloc.accountID) || 0,
            drCr: 'C', // Credit Note uses drCr='C'
          };
          {
            const iso = this.toISO(alloc.invoiceDate);
            item.vDate = iso || new Date().toISOString();
          }
          item.partyInvNo = Number(alloc.partyInvNo) || 0;
          {
            const iso2 = this.toISO(alloc.partyInvDate);
            item.partyInvDate = iso2 || new Date().toISOString();
          }
          out.push(item);
        }
      }
    }
    return out;
  }

  private normalizeBillAndRef(source: any[]): any[] {
    if (!Array.isArray(source)) return [];

    return source.map((item: any) => {
      const selection =
        item.selection === true ||
        item.Selection === true ||
        item.selection === 'true' ||
        item.Selection === 'true' ||
        item.selection === 1 ||
        item.Selection === 1 ||
        item.selection === '1' ||
        item.Selection === '1';

      const billAmount = Number(item.invoiceAmount ?? item.BillAmount ?? item.billAmount ?? 0);
      const allocated = Number(item.allocated ?? item.Allocated ?? 0);
      const amount = Number(item.amount ?? item.Amount ?? 0);
      const invoiceDateIso = this.toISO(item.invoiceDate ?? item.VDate);
      const partyInvDateIso = this.toISO(item.partyInvDate);

      return {
        selection,
        vNo: item.invoiceNo ?? item.VNo ?? '',
        allocated: parseFloat(allocated.toFixed(2)),
        amount: parseFloat(amount.toFixed(2)),
        billAmount: parseFloat(billAmount.toFixed(2)),
        description: item.description ?? item.Description ?? '',
        account: item.account ?? item.Account ?? '',
        vid: Number(item.vid ?? item.VID) || 0,
        veid: Number(item.veid ?? item.VEID) || 0,
        accountID: Number(item.AccountID ?? item.accountID) || 0,
        vDate: invoiceDateIso ?? new Date().toISOString(),
        partyInvNo: Number(item.partyInvNo) || 0,
        partyInvDate: partyInvDateIso ?? new Date().toISOString(),
        drCr: 'C',
      };
    });
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

  private deleteCreditNote(voucherId: number, voucherNo: string): void {
    const deleteUrl = `${EndpointConstant.DELETECREDITS}${this.pageId}&TransId=${voucherId}`;

    console.log('Deleting credit note:', { voucherId, voucherNo, pageId: this.pageId, url: deleteUrl });

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
      console.error('Delete credit note returned error:', response);
      this.baseService.showCustomDialogue(`Delete failed:\n${details}`);
      return;
    }

    const successMsg = dataMsg || `Credit Note "${voucherNo}" deleted successfully.`;
    this.baseService.showCustomDialogue(successMsg);

    this.clearFormAfterDelete();
    this.LeftGridInit();
  }

  private handleDeleteError(error: any, voucherNo: string): void {
    const details = this.stringifyError(error);
    console.error('Delete credit note failed:', error);

    this.baseService.showCustomDialogue(
      `Failed to delete Credit Note "${voucherNo}":\n${details}`
    );
  }

  private clearFormAfterDelete(): void {
    this.selectedCreditNoteId = 0;
    this.currentCreditNote = null;
    this.selectedCustomerId = 0;
    this.originalBillAndRef = [];

    this.voucherCommonService.clearAllData();

    this.creditNoteForm.reset();
    this.creditNoteForm.disable();

    this.SetPageType(0);

    console.log('✅ Form cleared after deletion');
  }
}



