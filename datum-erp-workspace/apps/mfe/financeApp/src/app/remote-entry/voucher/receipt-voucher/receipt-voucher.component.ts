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
import { PVoucherModel, PaymentDetailsModel, AccountMasterModel, POAllocationResult } from '../../model/PVoucherModel';
import { DatePipe } from '@angular/common';
import { DataSharingService, BaseService } from '@org/services';
import { EditSettingsModel, GridComponent, IEditCell } from '@syncfusion/ej2-angular-grids';
import { VoucherCommonService } from '../common/services/voucher-common.service';
import { VoucherService } from '../common/services/voucher.service';
import { PoallocationpopupComponent } from '../common/poallocationpopup/poallocationpopup.component';

interface PaymentBreakdownResult {
  cash: any[];
  card: any[];
  epay: any[];
  cheque: any[];
  creditTotal: number;
}


@Component({
  selector: 'app-receipt-voucher',
  standalone: false,
  templateUrl: './receipt-voucher.component.html',
  styles: [],
})
export class ReceiptVoucherComponent extends BaseComponent implements OnInit {
  @ViewChild('paymentDetailsGrid') paymentDetailsGrid!: GridComponent;
  @ViewChild('poAllocationPopup') poAllocationPopup!: PoallocationpopupComponent;

  private httpService = inject(FinanceAppService);
  private datePipe = inject(DatePipe);
  private dataSharingService = inject(DataSharingService);
  private baseService = inject(BaseService);
  public voucherCommonService = inject(VoucherCommonService);
  public voucherService = inject(VoucherService);
  receiptVoucherForm = this.formUtil.thisForm;
  pageId = 70;

  // Dropdown data sources (local to this component)
  costCentreData: any[] = [];
  departmentData: any[] = [];
  // accountMasterData moved to voucherService.accountMasterData

  selectedReceiptVoucherId!: number;
  currentReceiptVoucher: any = null;
  selectedPaymentType: string = '';

  // Store reference to current row being edited for PO allocation
  private currentRowData: any;

  // Store original billandRef data when loading for edit
  private originalBillAndRef: any[] = [];

  // Common fill data
  commonFillData: any = {};
  voucherName: string = '';
  readonly today = new Date();
  readonly voucherId = 7; // Receipt Voucher ID

  // Grid data sources moved to voucherCommonService
  // accountDetailsData, paymentDetailsData

  // Payment popup data
  showPaymentPopup = false;
  popupType!: 'cash' | 'card' | 'cheque' | 'epay';
  popupData: any[] = [];
  // bankData moved to voucherService.bankData
  cashPopupObj: any[] = [];
  cardPopupObj: any[] = [];
  chequePopupObj: any[] = [];
  epayPopupObj: any[] = [];
  bankPopupObj: any[] = [];
  // For initializing popup amount = total debit - total payments
  paymentRemaining: number = 0;
  // Existing payment data to pass to popup in edit mode
  popupExistingData: any[] = [];

  // Selected payment items moved to voucherCommonService
  // cashSelected, cardSelected, chequeSelected

  // Grid configurations
  public accountDetailsEditSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Batch'
  };
  public creditEditParams: IEditCell = {
    params: { format: 'N2', decimals: 2, showSpinButton: false }
  };
  public paymentDetailsEditSettings: EditSettingsModel = {
    allowEditing: false,
    allowAdding: false,
    allowDeleting: false
  };

  constructor() {
    super();
    this.commonInit();
  }

  private updateGridEditSettings(): void {
    const pageType = this.serviceBase.formToolbarService.pagetype;

    if (pageType === 3) {
      this.accountDetailsEditSettings = {
        allowEditing: false,
        allowAdding: false,
        allowDeleting: false,
        mode: 'Batch'
      };
      this.paymentDetailsEditSettings = {
        allowEditing: false,
        allowAdding: false,
        allowDeleting: false
      };
    } else {
      this.accountDetailsEditSettings = {
        allowEditing: true,
        allowAdding: true,
        allowDeleting: true,
        mode: 'Batch'
      };
      this.paymentDetailsEditSettings = {
        allowEditing: false,
        allowAdding: false,
        allowDeleting: false
      };
    }
  }

  ngOnInit(): void {
    this.onInitBase();

    // Set pageId for receipt voucher
    this.dataSharingService.setPageId(this.pageId);

    this.fetchDepartmentData();

    // Fetch dropdown data from services
    this.voucherService.fetchAccountMaster();
    this.voucherService.fetchBankDetails();

    // Subscribe to pageId from DataSharingService
    this.dataSharingService.pageId$
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe((id) => {
        if (id !== this.pageId) {
          this.pageId = id;
          console.log('PageId updated to:', this.pageId);
          // Re-fetch data when pageId changes

          this.LeftGridInit();
        }
      });

    // Default to New mode on load with editable grids
    this.enterNewMode();
  }

  override FormInitialize() {
    this.receiptVoucherForm = new FormGroup({
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
      department: new FormControl({ value: '', disabled: false }),
      referenceNo: new FormControl({ value: '', disabled: false }),
    });
    // Ensure base Save flow validates this form
    this.formUtil.thisForm = this.receiptVoucherForm;
  }

  override SaveFormData() {
    try {
      // Determine if this is an update or create operation
      const isUpdate = !!(this.selectedReceiptVoucherId && this.selectedReceiptVoucherId > 0);

      // Block save when form is invalid and show specific errors
      if (!this.receiptVoucherForm || this.receiptVoucherForm.invalid) {
        this.receiptVoucherForm?.markAllAsTouched();
        this.formValidationError();
        return;
      }

      const formVals = this.receiptVoucherForm.getRawValue();

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

      // Credit side (account details)
      const accRows = this.voucherCommonService.accountDetailsData() || [];
      if (!accRows.length) {
        this.showError('Add at least one account (credit) row');
        return;
      }

      // Resolve accountId for rows that don't have it (lookup by accountCode)
      const accountMasterData = this.voucherService.accountMasterData();
      accRows.forEach((r: any) => {
        if (!r.accountId || Number(r.accountId) <= 0) {
          // Try to find accountId by matching accountCode
          const matchedAccount = accountMasterData.find((acc: any) =>
            acc.accountCode === r.accountCode || acc.accountName === r.accountName
          );
          if (matchedAccount) {
            r.accountId = matchedAccount.id;
            console.log(`Resolved accountId for ${r.accountCode}: ${r.accountId}`);
          }
        }
      });

      // Validate that all account rows have valid accountId after resolution
      const invalidAccounts = accRows.filter((r: any) => !r.accountId || Number(r.accountId) <= 0);
      if (invalidAccounts.length > 0) {
        this.showError('Please select a valid account for all credit rows');
        console.error('Invalid account rows (could not resolve accountId):', invalidAccounts);
        return;
      }
    
      const accountDetails = accRows.map((r: any) => {
        // Round to 2 decimal places to avoid floating-point precision errors
        const creditAmount = parseFloat((Number(r.credit) || 0).toFixed(2));

        const obj: any = {
          accountCode: {
            id: Number(r.accountId) || 0,
            name: r.accountName || '',
            code: r.accountCode || '',
            description: '',
          },
          amount: creditAmount,
          debit: 0,
          credit: creditAmount,
        };
        if (r.description) obj.description = r.description;

        // Handle dueDate - use provided date or default to today
        if (r.dueDate) {
          const dueIso = this.toISO(r.dueDate);
          if (dueIso) obj.dueDate = dueIso;
        } else {
          // If dueDate is empty, set to today's date
          obj.dueDate = new Date().toISOString();
        }

        return obj;
      });
      const creditTotal = parseFloat(accountDetails.reduce((s: number, x: any) => s + (Number(x.credit) || 0), 0).toFixed(2));
      if (creditTotal <= 0) {
        this.showError('Total credit must be greater than zero');
        return;
      }
      debugger;
      // Debit side (from selections)
      const payment = this.buildPaymentBreakdownFromSelections();
      debugger;
      const debitTotal = payment.creditTotal;
      if (debitTotal <= 0) {
        this.showError('Add at least one payment (cash/card/cheque/e-pay)');
        return;
      }
      if (Math.abs(creditTotal - debitTotal) > 0.0001) {
        this.showError(`Credit and Debit do not match. Credit: ${creditTotal.toFixed(2)}, Debit: ${debitTotal.toFixed(2)}`);
        return;
      }
    
      
      // Paydetails summary (optional description)
      const paydetails = this.buildPaydetailsSummary();

      // PO allocations - use original data when updating, or build from scratch for new vouchers
      let billandRef = this.buildBillAndRef(accRows, isUpdate);
      debugger;
      if (isUpdate && this.originalBillAndRef.length > 0 && (!billandRef || billandRef.length === 0)) {
        // When updating and original billandRef exists, normalize it to correct format
        billandRef = this.normalizeBillAndRef(this.originalBillAndRef);
        console.log('Using normalized original billandRef for update:', billandRef);
      } else {
        // Build billandRef from PO allocations (for new vouchers or when allocations changed)
        console.log('Built new billandRef:', billandRef);
      }

      

      // Validate allocation sums per credit row
      for (const row of accRows) {
        if (Array.isArray(row.poAllocations) && row.poAllocations.length) {
          const sumAlloc = row.poAllocations.reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0);
          const rowCredit = Number(row.credit) || 0;

          if (Math.abs(sumAlloc - rowCredit) > 0.0001) {
            this.showError(`Allocation total (${sumAlloc.toFixed(2)}) does not match row credit (${rowCredit.toFixed(2)}) for account ${row.accountName || ''}`);
            return;
          }
        }
      }

      

      // Prepare header fields with default values
      let costCentrePayload: any = {};
        
      if (formVals.costCentre) {
        const cc = this.findById(this.costCentreData, formVals.costCentre);
        if (cc) {
          costCentrePayload = {
            id: (cc.id ?? cc.ID ?? formVals.costCentre) || 0,
            name: cc.name || cc.Name || '',
            code: cc.code || cc.Code || '',
            description: cc.description || cc.Description || '',
          };
        }
      }

      let departmentPayload: any = {};
        
      if (formVals.department) {
        const dept = this.findById(this.departmentData, formVals.department);
        if (dept) {
          departmentPayload = {
            id: (dept.id ?? dept.ID ?? formVals.department) || 0,
            name: dept.name || dept.department || dept.Name || '',
            code: dept.code || dept.Code || '',
            description: dept.description || dept.Description || '',
          };
        }
      }

      // Filter out invalid rows; allow empty arrays in API payload
      const cardArray = (payment.card || []).filter((it: any) =>
        Number(it?.amount) > 0 && Number(it?.accountCode?.id) > 0
      );
      const epayArray = (payment.epay || []).filter((it: any) =>
        Number(it?.amount) > 0 && Number(it?.accountCode?.id) > 0
      );
      const chequeArray = (payment.cheque || []).filter((it: any) => {
        const hasBank = Number(it?.bankID) > 0 || Number(it?.bankName?.id) > 0;
        const hasPdc = Number(it?.pdcPayable?.id) > 0;
        return Number(it?.amount) > 0 && (hasPdc || hasBank);
      });

      // Build payload
      const payload: any = {
        id: this.selectedReceiptVoucherId || 0,
        voucherNo: voucherNo,
        voucherDate: voucherDateIso,
        narration: formVals.narration || '',
        costCentre: costCentrePayload,
        department: departmentPayload,
        referenceNo: formVals.referenceNo || '',
        currency: { id: 1, value: 'SAR' },
        exchangeRate: 1,
        accountDetails,
        paydetails,
        billandRef,
        cash: payment.cash,
        card: cardArray,
        epay: epayArray,
        cheque: chequeArray,
      };

      // Optional header fields
      if (formVals.narration) payload.narration = formVals.narration;
      
      if (formVals.referenceNo) payload.referenceNo = formVals.referenceNo;

      // Endpoint with voucherId
      const url = isUpdate
        ? `${EndpointConstant.UPDATERECEIPTVOUCHER}${this.pageId}&voucherId=${this.voucherId}`
        : `${EndpointConstant.SAVERECEIPTVOUCHER}${this.pageId}&voucherId=${this.voucherId}`;

      // Debug: log exact URL and payload being sent
      console.log('============ RECEIPT VOUCHER SAVE ============');
      console.log('Operation:', isUpdate ? 'UPDATE' : 'CREATE');
      console.log('Voucher ID:', this.selectedReceiptVoucherId);
      console.log('URL:', url);
      console.log('BillandRef count:', billandRef.length);
      console.log('Account Details count:', accountDetails.length);
      console.log('Payment breakdown:', {
        cash: payment.cash.length,
        card: cardArray.length,
        cheque: chequeArray.length,
        epay: epayArray.length
      });

      try {
        console.log('Full Payload:', JSON.stringify(payload, null, 2));
      } catch (e) {
        console.log('Full Payload (raw):', payload);
      }
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
            // Some backends return 200 OK with an error object inside the payload.
            const httpCode = (response as any)?.httpCode ?? (response as any)?.data?.httpCode;
            const isValid = (response as any)?.isValid ?? (response as any)?.data?.isValid;
            const dataMsg = (response as any)?.data?.msg || (response as any)?.message || (response as any)?.data;
            debugger;
          
            if ((typeof httpCode === 'number' && httpCode >= 400) || isValid === false) {
              const details = typeof dataMsg === 'string' ? dataMsg : this.stringifyError(response);
              console.error('Save Receipt Voucher returned error payload:', response);
              this.baseService.showCustomDialogue(`Save failed:\n${details}`);
              return;
            }

            // Get the saved voucher ID from response (response.data is the ID directly)
            const savedVoucherId = (response as any)?.data;
            if (savedVoucherId && typeof savedVoucherId === 'number') {
              this.selectedReceiptVoucherId = savedVoucherId;
            }

            const msg = 'Receipt voucher saved successfully';
            this.baseService.showCustomDialogue(msg);

            // After save, switch to view mode and disable Save button via pagetype
            this.SetPageType(3);
            this.updateGridEditSettings();
            this.receiptVoucherForm.disable({ emitEvent: false });
            this.LeftGridInit();
          },
          error: (error) => {
            const details = this.stringifyError(error);
            console.error('Save Receipt Voucher failed:', error);
            this.baseService.showCustomDialogue(`Save failed:\n${details}`);
          },
        });
    } catch (err: any) {
      const details = this.stringifyError(err);
      console.error('Save Receipt Voucher exception:', err);
      this.baseService.showCustomDialogue(`Save failed:\n${details}`);
    }
  }

  override async LeftGridInit() {
    this.pageheading = 'Receipt Voucher';
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
          headerText: 'Receipt Voucher List',
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

      // Push updated left grid data to the shell after refresh
      this.serviceBase.dataSharingService.setData({
        columns: this.leftGrid.leftGridColumns,
        data: this.leftGrid.leftGridData,
        pageheading: this.pageheading,
      });
    } catch (err) {
      console.error('Error fetching receipt vouchers:', err);
    }
  }

  override getDataById(data: PVoucherModel) {
    console.log('data', data);
    this.selectedReceiptVoucherId = data.ID;

    // Set page type to view mode
    this.SetPageType(3);
    this.updateGridEditSettings();

    // Disable form for viewing (will be enabled when edit is clicked)
    this.receiptVoucherForm.disable();

    this.fetchReceiptVoucherById();
  }

  // Enter edit mode for the selected voucher
  override onEditClick() {
    const selectedId = this.selectedReceiptVoucherId || (this as any).leftgridSelectedData?.ID;
    if (!selectedId || Number(selectedId) <= 0) {
      this.baseService.showCustomDialogue('Please select a voucher from the list to edit.');
      return;
    }

    if (this.isVoucherBeyondEditablePeriod()) {
      this.baseService.showCustomDialogue(`Editing disabled for vouchers older than ${EDITABLE_PERIOD} days.`);
      this.receiptVoucherForm.disable({ emitEvent: false });
      this.SetPageType(3);
      this.updateGridEditSettings();
      return;
    }

    this.selectedReceiptVoucherId = Number(selectedId);

    // Set page type to edit mode
    this.SetPageType(2);
    this.updateGridEditSettings();

    // Enable the form for editing
    this.receiptVoucherForm.enable();

    // Keep voucher name and voucher no disabled (read-only in edit mode)
    this.receiptVoucherForm.get('voucherName')?.disable({ emitEvent: false });
    this.receiptVoucherForm.get('voucherNo')?.disable({ emitEvent: false });

    // Ensure dropdown data is loaded for editors/popups
    this.voucherService.fetchAccountMaster();
    this.voucherService.fetchBankDetails();

    // Only fetch details if not already loaded
    if (!this.currentReceiptVoucher || this.currentReceiptVoucher.id !== this.selectedReceiptVoucherId) {
      this.fetchReceiptVoucherById();
    }
  }

  override formValidationError() {
    const c = this.receiptVoucherForm?.controls || {} as any;
    const errors: string[] = [];
    if (c['voucherNo']?.invalid) errors.push('Voucher No is required.');
    if (c['voucherDate']?.invalid) errors.push('Voucher Date is required.');
    if (errors.length === 0) {
      errors.push('Please fix the highlighted fields.');
    }
    this.baseService.showCustomDialogue(errors.join('\n'));
  }

  private fetchReceiptVoucherById(): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLPURCHASEBYID + this.selectedReceiptVoucherId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const transactionData = response?.data?.transaction?.fillTransactions;
          const additionalData = response?.data?.transaction?.fillAdditionals;
          const transactionEntries = response?.data?.transaction?.fillTransactionEntries || [];
          const billAndRefData = response?.data?.voucherAllocation?.data || [];
          debugger;
      

          // Store original billandRef data for use when saving updates
          this.originalBillAndRef = billAndRefData;

          this.currentReceiptVoucher = transactionData ?? null;

          // Format voucher date
          let formVoucherDate = null;
          if (this.currentReceiptVoucher?.date) {
            formVoucherDate = this.datePipe.transform(
              new Date(this.currentReceiptVoucher.date),
              'dd/MM/yyyy'
            );
          }

          // Fill form fields
          this.receiptVoucherForm.patchValue({
            voucherName: this.voucherName || 'PV', // Use voucher name from common fill data
            voucherNo: this.currentReceiptVoucher?.transactionNo,
            voucherDate: formVoucherDate,
            narration: this.currentReceiptVoucher?.commonNarration,
            costCentre: this.currentReceiptVoucher?.costCentreID,
            department: additionalData?.departmentID,
            referenceNo: this.currentReceiptVoucher?.referenceNo,
          });

          // Fill Account Details Grid (Credit entries - DrCr = "C")
          const accountMasterData = this.voucherService.accountMasterData();
          const accountDetails = transactionEntries
            .filter((entry: any) => entry.drCr === 'C')
            .map((entry: any) => {
              // Try to get accountId from entry, or lookup by accountCode
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
                credit: entry.credit || 0,
                originalCredit: entry.credit || 0,  // Store original credit for validation in edit mode
                originalAccountId: accountId  // Store original account ID for validation in edit mode
              };

              // Restore PO allocations for this account if available
              const poAllocationsForAccount = billAndRefData
                .filter((bill: any) => Number(bill.AccountID) === Number(entry.accountId))
                .map((bill: any) => {
                  const invoiceAmount = Number(bill.BillAmount || bill.invoiceAmount || 0);
                  const allocated = Number(bill.Allocated || bill.allocated || 0);
                  const amount = Number(bill.Amount || bill.amount || 0);
                  const balance = invoiceAmount - (allocated + amount);

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
                    drCr: bill.drCr || 'D'
                  };
                });

              if (poAllocationsForAccount.length > 0) {
                accountRow.poAllocations = poAllocationsForAccount;
              }
              
              return accountRow;
              
            });
          this.voucherCommonService.accountDetailsData.set(accountDetails);
          this.voucherCommonService.assignAccountRowIds();

          // Fill Payment Details Grid (Debit entries - DrCr = "D")
          const debitEntries = transactionEntries.filter((entry: any) => entry.drCr === 'D');
          const paymentDetails = debitEntries.map((entry: any) => ({
            AccountName: entry.name || '',
            Description: entry.description || '',
            Amount: entry.debit || entry.amount || 0,
            TranType: entry.tranType || ''
          }));
          this.voucherCommonService.paymentDetailsData.set(paymentDetails);

          // Restore payment selections from debit entries (needed for save)
          this.restorePaymentSelections(debitEntries);

          // Set selected payment type if available
          const paymentDetailsArray = this.voucherCommonService.paymentDetailsData();
          if (paymentDetailsArray.length > 0 && paymentDetailsArray[0].TranType) {
            this.selectedPaymentType = paymentDetailsArray[0].TranType;
          }

          console.log('Account Details:', this.voucherCommonService.accountDetailsData());
          console.log('Payment Details:', this.voucherCommonService.paymentDetailsData());
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






  override DeleteData(data: PVoucherModel) {
    console.log('Delete requested for receipt voucher:', data);

    // Validate data
    if (!data || !data.ID) {
      this.baseService.showCustomDialogue('Please select a valid receipt voucher to delete.');
      return;
    }

    const voucherId = data.ID;
    const voucherNo = data.TransactionNo || 'Unknown';

    // Show confirmation dialog
    const confirmDelete = confirm(
      `Are you sure you want to delete Receipt Voucher "${voucherNo}"?\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) {
      console.log('Delete cancelled by user');
      return;
    }

    // Call delete API
    this.deleteReceiptVoucher(voucherId, voucherNo);
  }

 

  onPaymentTypeClick(paymentType: string): void {
    this.selectedPaymentType = paymentType;
    console.log('Selected payment type:', paymentType);

    // Open appropriate popup based on payment type
    switch (paymentType.toLowerCase()) {
      case 'cash':
        this.fetchCashPopup();
        break;
      case 'card':
        this.fetchCardPopup();
        break;
      case 'cheque':
        this.fetchChequePopup();
        break;
      case 'epay':
        this.fetchEpayPopup();
        break;
      default:
        console.warn('Payment type not supported:', paymentType);
        break;
    }
  }

  // Fetch common fill data (cost centre, voucher number, etc.)
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

  // Handle common fill data response
  private handleCommonFillResponse(response: any): void {
    this.commonFillData = response?.data || {};

    // Map cost centre data
    this.costCentreData = this.commonFillData.costCentre || [];

    console.log('Common fill data loaded:', this.commonFillData);
    console.log('Cost Centre data mapped:', this.costCentreData);

    // Set voucher data (voucher name and number)
    this.setVoucherData();
  }

  // Set voucher name and number in form
  private setVoucherData(): void {
    const formattedDate = this.formatDate(this.today);
    this.voucherName = this.commonFillData?.vNo?.code || 'PV';
    const voucherNo = this.commonFillData?.vNo?.result || '';

    this.receiptVoucherForm.patchValue({
      voucherName: this.voucherName,
      voucherNo: voucherNo,
      voucherDate: formattedDate,
    });

    console.log('Voucher data set:', { voucherName: this.voucherName, voucherNo });
  }

  // Format date to dd/MM/yyyy
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
    const rawDate = this.currentReceiptVoucher?.date || this.receiptVoucherForm.get('voucherDate')?.value;
    if (!rawDate) return null;

    const iso = this.toISO(rawDate);
    if (!iso) return null;

    const parsed = new Date(iso);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Fetch department data for dropdown
  private fetchDepartmentData(): void {
    this.httpService
      .fetch<any[]>(EndpointConstant.DEPARTMENTPOPUP)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.departmentData = response?.data ?? [];
          console.log('Department Data:', this.departmentData);
        },
        error: (error) => {
          console.error('Error fetching department data:', error);
        },
      });
  }

  // Fetch account details from ACCOUNTCODEPOPUP endpoint
  // fetchAccountDetails removed - now using voucherService.fetchAccountMaster()

  // Fetch Cash popup data
  fetchCashPopup(): void {
    this.popupType = 'cash';

    // Check if in edit mode and get existing cash selections
    const isEditMode = this.serviceBase.formToolbarService.pagetype === 2;
    const existingData = isEditMode ? this.voucherCommonService.cashSelected() : [];

    // Calculate remaining amount (excludes current payment type)
    this.paymentRemaining = this.computePaymentRemaining();

    // In edit mode, clone and adjust existing data amount if remaining changed
    if (isEditMode && existingData.length > 0) {
      // Clone data to avoid mutating signal data before user confirms
      this.popupExistingData = JSON.parse(JSON.stringify(existingData));

      const existingTotal = this.popupExistingData.reduce((sum: number, item: any) =>
        sum + (Number(item.amount) || 0), 0);

      // If remaining amount differs from existing total, update first item amount and zero others
      // User can manually distribute among multiple items in popup
      if (Math.abs(existingTotal - this.paymentRemaining) > 0.01) {
        this.popupExistingData[0].amount = this.paymentRemaining;
        // Set other items to 0
        for (let i = 1; i < this.popupExistingData.length; i++) {
          this.popupExistingData[i].amount = 0;
        }
      }
    } else {
      this.popupExistingData = [];
    }

    console.log('Opening Cash popup:', {
      isEditMode,
      existingDataCount: this.popupExistingData.length,
      existingData: this.popupExistingData,
      paymentRemaining: this.paymentRemaining
    });

    if (this.cashPopupObj.length > 0) {
      this.popupData = this.cashPopupObj;
      this.showPaymentPopup = true;
    } else {
      this.httpService
        .fetch<any>(EndpointConstant.FILLCASHPOPUP)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            const responseData = response?.data;
            this.cashPopupObj = responseData.map((item: any) => ({
              accountcode: item.alias,
              accountname: item.name,
              id: item.id,
            }));
            this.popupData = this.cashPopupObj;
            console.log('Cash Popup Data:', this.popupData);
            this.showPaymentPopup = true;
          },
          error: (error) => {
            console.error('Error fetching cash popup:', error);
          },
        });
    }
  }

  // Fetch Card popup data
  fetchCardPopup(): void {
    this.popupType = 'card';

    // Check if in edit mode and get existing card selections
    const isEditMode = this.serviceBase.formToolbarService.pagetype === 2;
    const existingData = isEditMode ? this.voucherCommonService.cardSelected() : [];

    // Calculate remaining amount (excludes current payment type)
    this.paymentRemaining = this.computePaymentRemaining();

    // In edit mode, clone and adjust existing data amount if remaining changed
    if (isEditMode && existingData.length > 0) {
      // Clone data to avoid mutating signal data before user confirms
      this.popupExistingData = JSON.parse(JSON.stringify(existingData));

      const existingTotal = this.popupExistingData.reduce((sum: number, item: any) =>
        sum + (Number(item.amount) || 0), 0);

      // If remaining amount differs from existing total, update first item amount and zero others
      // User can manually distribute among multiple items in popup
      if (Math.abs(existingTotal - this.paymentRemaining) > 0.01) {
        this.popupExistingData[0].amount = this.paymentRemaining;
        // Set other items to 0
        for (let i = 1; i < this.popupExistingData.length; i++) {
          this.popupExistingData[i].amount = 0;
        }
      }
    } else {
      this.popupExistingData = [];
    }

    console.log('Opening Card popup:', {
      isEditMode,
      existingDataCount: this.popupExistingData.length,
      existingData: this.popupExistingData,
      paymentRemaining: this.paymentRemaining
    });

    this.httpService
      .fetch<any>(EndpointConstant.FILLCARDPOPUP)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          this.cardPopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.popupData = this.cardPopupObj;
          console.log('Card Popup Data:', this.popupData);
          this.showPaymentPopup = true;
        },
        error: (error) => {
          console.error('Error fetching card popup:', error);
        },
      });
  }

  // Fetch Cheque popup data
  fetchChequePopup(): void {
    this.popupType = 'cheque';

    // Check if in edit mode and get existing cheque selections
    const isEditMode = this.serviceBase.formToolbarService.pagetype === 2;
    const existingData = isEditMode ? this.voucherCommonService.chequeSelected() : [];

    // Calculate remaining amount (excludes current payment type)
    this.paymentRemaining = this.computePaymentRemaining();

    // In edit mode, clone and adjust existing data amount if remaining changed
    if (isEditMode && existingData.length > 0) {
      // Clone data to avoid mutating signal data before user confirms
      this.popupExistingData = JSON.parse(JSON.stringify(existingData));

      const existingTotal = this.popupExistingData.reduce((sum: number, item: any) =>
        sum + (Number(item.amount) || 0), 0);

      // If remaining amount differs from existing total, update first item amount and zero others
      // User can manually distribute among multiple items in popup
      if (Math.abs(existingTotal - this.paymentRemaining) > 0.01) {
        this.popupExistingData[0].amount = this.paymentRemaining;
        // Set other items to 0
        for (let i = 1; i < this.popupExistingData.length; i++) {
          this.popupExistingData[i].amount = 0;
        }
      }
    } else {
      this.popupExistingData = [];
    }

    console.log('Opening Cheque popup:', {
      isEditMode,
      existingDataCount: this.popupExistingData.length,
      existingData: this.popupExistingData,
      paymentRemaining: this.paymentRemaining
    });

    this.httpService
      .fetch<any>(EndpointConstant.FILLCHEQUEPOPUP)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          this.chequePopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.popupData = this.chequePopupObj;
          console.log('Cheque Popup Data:', this.popupData);
          this.showPaymentPopup = true;
        },
        error: (error) => {
          console.error('Error fetching cheque popup:', error);
        },
      });
  }

  // Fetch E-Pay popup data
  fetchEpayPopup(): void {
    this.popupType = 'epay';

    // Check if in edit mode and get existing epay selections
    const isEditMode = this.serviceBase.formToolbarService.pagetype === 2;
    const existingData = isEditMode ? this.voucherCommonService.epaySelected() : [];

    // Calculate remaining amount (excludes current payment type)
    this.paymentRemaining = this.computePaymentRemaining();

    // In edit mode, clone and adjust existing data amount if remaining changed
    if (isEditMode && existingData.length > 0) {
      // Clone data to avoid mutating signal data before user confirms
      this.popupExistingData = JSON.parse(JSON.stringify(existingData));

      const existingTotal = this.popupExistingData.reduce((sum: number, item: any) =>
        sum + (Number(item.amount) || 0), 0);

      // If remaining amount differs from existing total, update first item amount and zero others
      // User can manually distribute among multiple items in popup
      if (Math.abs(existingTotal - this.paymentRemaining) > 0.01) {
        this.popupExistingData[0].amount = this.paymentRemaining;
        // Set other items to 0
        for (let i = 1; i < this.popupExistingData.length; i++) {
          this.popupExistingData[i].amount = 0;
        }
      }
    } else {
      this.popupExistingData = [];
    }

    console.log('Opening E-Pay popup:', {
      isEditMode,
      existingDataCount: this.popupExistingData.length,
      existingData: this.popupExistingData,
      paymentRemaining: this.paymentRemaining
    });

    this.httpService
      .fetch<any>(EndpointConstant.FILLEPAYPOPUP)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          this.epayPopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.popupData = this.epayPopupObj;
          console.log('E-Pay Popup Data:', this.popupData);
          this.showPaymentPopup = true;
        },
        error: (error) => {
          console.error('Error fetching e-pay popup:', error);
        },
      });
  }

  // Compute remaining amount = sum(credit in Account Details) - sum(Amount in Payment Details excluding current type)
  private computePaymentRemaining(): number {
    const accountRows = this.voucherCommonService.accountDetailsData();
    const paymentRows = this.voucherCommonService.paymentDetailsData();
    const totalCredit = accountRows.reduce((s: number, r: any) => s + (Number(r?.credit) || 0), 0);

    // Exclude payments of the current popup type to get accurate remaining amount
    const currentType = this.popupType?.toLowerCase();
    const filteredPaymentRows = paymentRows.filter((r: any) => {
      const tranType = (r?.TranType || '').toLowerCase();
      return tranType !== currentType;
    });

    const totalPaid = filteredPaymentRows.reduce((s: number, r: any) => s + (Number(r?.Amount) || 0), 0);
    const remaining = totalCredit - totalPaid;
    return remaining > 0 ? parseFloat(remaining.toFixed(4)) : 0;
  }

  // Enter New mode with clean form and editable grids
  private enterNewMode(): void {
    console.log('Entering New mode for receipt voucher');

    this.SetPageType(1);
    this.updateGridEditSettings();

    this.selectedReceiptVoucherId = 0;
    this.currentReceiptVoucher = null;
    this.selectedPaymentType = '';
    this.originalBillAndRef = [];

    this.voucherCommonService.initializeAccountDetails();
    this.voucherCommonService.paymentDetailsData.set([]);
    this.voucherCommonService.cashSelected.set([]);
    this.voucherCommonService.cardSelected.set([]);
    this.voucherCommonService.chequeSelected.set([]);
    this.showPaymentPopup = false;

    this.receiptVoucherForm.enable();
    this.receiptVoucherForm.patchValue({
      narration: '',
      costCentre: null,
      department: null,
      referenceNo: ''
    });

    // Keep voucher name read-only; voucher number stays editable per form config
    this.receiptVoucherForm.get('voucherName')?.disable({ emitEvent: false });

    // Refresh voucher header info (voucher no/name/date) for a fresh entry
    this.fetchCommonFillData();

    // Clear any left-grid selection in local state
    this.leftgridSelectedData = null;

    console.log('Form reset for new receipt voucher');
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

  // Fetch Bank details for cheque popup
  // fetchBankDetails removed - now using voucherService.fetchBankDetails()

  // Close payment popup
  closePaymentPopup(): void {
    this.showPaymentPopup = false;
  }

  // Handle item selection from payment popup
  onItemSelected(selectedItem: any): void {
    const items = Array.isArray(selectedItem) ? selectedItem : [selectedItem];

    // No merge needed - popup already has correct amounts from auto-adjustment
    switch (this.popupType) {
      case 'cash':
        this.voucherCommonService.cashSelected.set(items);
        break;

      case 'card':
        this.voucherCommonService.cardSelected.set(items);
        break;

      case 'cheque':
        this.voucherCommonService.chequeSelected.set(items);
        break;

      case 'epay':
        this.voucherCommonService.epaySelected.set(items);
        break;

      default:
        console.warn('Unhandled popup type:', this.popupType);
        break;
    }

    // Update payment details grid with selected items
    this.updatePaymentDetailsGrid();

    this.closePaymentPopup();
  }

  // Update payment details grid with selected payment items
  private updatePaymentDetailsGrid(): void {
    // Use service method to update payment details grid
    // The service combines cash, card, and cheque selections into paymentDetailsData signal
    this.voucherCommonService.updatePaymentDetailsGrid();

    // Refresh grid to show updates (may not be needed with signals)
    if (this.paymentDetailsGrid) {
      this.paymentDetailsGrid.refresh();
    }
  }

  /** -------------------- Account Code Grid Handlers -------------------- **/

  // Handle account selection in AccountCode dropdown
  onAccountSelect(args: any, data: any): void {
    const selectedAccount = args.item || args.itemData?.item;

    if (!selectedAccount) return;

    const isEditMode = this.serviceBase.formToolbarService.pagetype === 2;
    const previousAccountId = data.accountId;
    const hasExistingAllocations = Array.isArray(data.poAllocations) && data.poAllocations.length > 0;
    const accountChanged = previousAccountId && previousAccountId !== selectedAccount.id;

    // Handle allocation clearing in edit mode when account changes
    if (isEditMode && accountChanged && hasExistingAllocations) {
      const allocCount = data.poAllocations.length;
      const totalAllocated = data.poAllocations.reduce((sum: number, a: any) =>
        sum + (Number(a.amount) || 0), 0);

      const warningMsg =
        `Account changed. Clearing ${allocCount} PO allocation(s) ` +
        `(Total: ${totalAllocated.toFixed(2)}) from previous account. ` +
        `Credit amount (${data.credit}) will be preserved.`;

      // Show warning (informational, not blocking)
      console.warn(warningMsg);

      // Clear old allocations but keep credit amount
      this.clearAccountAllocations(data, previousAccountId);
    }

    // Update accountCode, accountName, and accountId using Object.assign
    Object.assign(data, {
      accountCode: selectedAccount.accountCode,
      accountName: selectedAccount.accountName,
      accountId: selectedAccount.id,  // Store account ID for payload
    });

    // Update the row in grid using service (triggers signal change detection)
    this.voucherCommonService.updateAccountRow(data);

    // Fetch unpaid POs for this account (for PO allocation feature)
    this.voucherService.fetchUnpaidPOs(selectedAccount.id, 'D'); // 'D' for Debit (Receipt Voucher)

    console.log(`✅ Account ${accountChanged ? 'changed' : 'selected'}: ${selectedAccount.accountCode} - ${selectedAccount.accountName}${accountChanged ? `, credit preserved: ${data.credit}` : ''}`);
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

  /** -------------------- PO Allocation Handlers -------------------- **/

  // Handle cellSave event in Account Details grid to open PO Allocation popup
  async onAccountDetailsCellSave(args: any): Promise<void> {
    const columnName = args.columnName;
    const rowData = args.rowData; // Use args.rowData instead of args.data
    const value = args.value; // Get the newly edited value

    // Handle description and dueDate edits
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

    // Check if credit column was edited (Receipt Voucher uses Credit)
    if (columnName === 'credit') {
      const creditValue = value || 0; // Use the edited value, not rowData.credit

      // Validate that account is selected first
      if (!rowData.accountId || !rowData.accountCode) {
        this.baseService.showCustomDialogue('Please select an account first before entering credit amount.');
        return;
      }

      // In edit mode, load unpaid POs (if not already) and append saved allocations before opening popup
      if (this.serviceBase.formToolbarService.pagetype === 2) {
        await this.prepareUnpaidPOsForEdit(rowData);
      }

      // Check if account has unpaid POs
      if (this.voucherService.unpaidPOsData().length > 0) {
        // Open PO allocation popup after a short delay to ensure cell save completes
        setTimeout(() => {
          this.openPOAllocationPopup(creditValue, rowData);
        }, 100);
      } else {
        // No unpaid POs available - allow manual entry
        console.log(`ℹ️ No unpaid POs for account ${rowData.accountCode}. Manual credit entry: ${creditValue}`);
      }
    }
  }

  // Open PO Allocation popup
  openPOAllocationPopup(crdrAmount: number, rowData: any): void {
    // Store reference to current row
    this.currentRowData = rowData;

    // Open popup
    this.poAllocationPopup.open(crdrAmount);
  }

  // Event handler - called when popup emits allocationComplete event
  onAllocationComplete(result: POAllocationResult): void {
    // Update credit field in Account Details grid with total allocated amount
    this.currentRowData.credit = result.totalAllocatedAmount;

    // Update reference field in receipt voucher header with comma-separated invoice numbers
    // Assuming referenceNo is the form control name for reference field
    this.receiptVoucherForm.get('referenceNo')?.setValue(result.invoiceNosString);

    // Store individual PO allocations for final payload submission
    this.currentRowData.poAllocations = result.allocations;

    // Update the row in the service
    this.voucherCommonService.updateAccountRow(this.currentRowData);

    console.log('✅ PO Allocation completed:', result);
  }

  // -------------------- Private helpers --------------------

  /**
   * Clear PO allocations when account changes, but preserve credit amount
   * @param rowData The row data to clear allocations from
   * @param oldAccountId The previous account ID (for logging)
   */
  private clearAccountAllocations(rowData: any, oldAccountId: number): void {
    // Store current credit amount BEFORE clearing
    const currentCredit = rowData.credit || 0;

    // 1. Clear PO allocations array
    const clearedCount = rowData.poAllocations?.length || 0;
    rowData.poAllocations = [];

    // 2. PRESERVE credit amount (DO NOT clear it)
    rowData.credit = currentCredit;  // Keep the amount!

    // 3. Clear unpaid POs from service (old account's POs)
    this.voucherService.unpaidPOsData.set([]);

    // 4. Update reference field - remove invoice numbers for this row
    this.updateReferenceFieldOnAccountChange(rowData);

    // 5. Log the change
    console.log(`✅ Cleared ${clearedCount} allocation(s) for old account ID: ${oldAccountId}, kept credit: ${currentCredit}`);
  }

  /**
   * Update reference field after account change by removing cleared row's invoice numbers
   * @param clearedRow The row whose allocations were cleared
   */
  private updateReferenceFieldOnAccountChange(clearedRow: any): void {
    // Get all account rows
    const allRows = this.voucherCommonService.accountDetailsData();

    // Collect invoice numbers from OTHER rows (excluding the one with cleared allocations)
    const remainingInvoiceNumbers: string[] = [];

    allRows.forEach(row => {
      // Skip the cleared row (use unique identifier)
      if (row.rowId !== clearedRow.rowId && Array.isArray(row.poAllocations)) {
        row.poAllocations.forEach((alloc: any) => {
          if (alloc.invoiceNo) {
            remainingInvoiceNumbers.push(alloc.invoiceNo);
          }
        });
      }
    });

    // Update reference field with remaining invoice numbers
    const newReferenceNo = remainingInvoiceNumbers.join(', ');
    this.receiptVoucherForm.get('referenceNo')?.setValue(newReferenceNo);

    console.log(`📝 Updated reference field: "${newReferenceNo}"`);
  }

  private async prepareUnpaidPOsForEdit(rowData: any): Promise<void> {
    if (!rowData) return;

    const accountId = rowData.accountId ?? rowData.accountID ?? 0;
    let unpaidPOs: any[] = [];

    // Fetch unpaid POs for this account
    if (accountId) {
      const url = `${EndpointConstant.FILLADVANCE}${accountId}&voucherId=17&drcr=D`;
      try {
        const response = await firstValueFrom(
          this.httpService
            .fetch<any>(url)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        );
        const responseData = response?.data ?? [];
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
    debugger;
    // Get allocated POs only from rows with the SAME account (not other accounts)
    const accountRows = this.voucherCommonService.accountDetailsData() || [];
    const allocatedPOs = accountRows
      .filter((row: any) => Number(row.accountId || row.accountID) === Number(accountId))
      .flatMap((row: any) => row.poAllocations || []);

    // Merge: Replace unpaid POs with allocated POs where invoiceNo matches
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
    this.voucherService.unpaidPOsData.set(merged);
  }

  // Restore payment selections from loaded credit entries (for edit mode)
  private restorePaymentSelections(creditEntries: any[]): void {
    const cashItems: any[] = [];
    const cardItems: any[] = [];
    const chequeItems: any[] = [];
    const epayItems: any[] = [];

    console.log('Restoring payment selections from credit entries:', creditEntries);

    creditEntries.forEach((entry: any) => {
      const tranType = (entry.tranType || entry.TranType || '').toLowerCase();

      // Base item structure for Cash, Card, E-Pay
      const baseItem = {
        accountcode: entry.alias?.toString() || entry.accountCode || '',
        accountname: entry.name || entry.accountName || '',
        id: entry.accountID || entry.accountId || 0,
        amount: entry.credit || entry.amount || entry.Amount || 0,
        description: entry.description || entry.Description || ''
      };

      console.log(`Processing credit entry: tranType=${tranType}, amount=${baseItem.amount}, id=${baseItem.id}`);

      switch (tranType) {
        case 'cash':
          cashItems.push(baseItem);
          break;

        case 'card':
          cardItems.push(baseItem);
          break;

        case 'e-pay':
        case 'epay':
          epayItems.push(baseItem);
          break;

        case 'cheque':
          // Cheque requires additional fields
          const chequeItem = {
            ...baseItem,
            chequeno: entry.chequeNo || '',
            chequedate: entry.chequeDate || new Date().toISOString(),
            clearingdays: entry.clearingDays || 0,
            bankId: entry.bankID || 0,
            bankName: entry.bankName ? {
              accountcode: entry.bankName.alias || '',
              accountname: entry.bankName.name || '',
              id: entry.bankName.id || 0
            } : null,
            pdcpayable: entry.pdcPayable ? {
              accountcode: entry.pdcPayable.alias || '',
              accountname: entry.pdcPayable.name || '',
              id: entry.pdcPayable.id || 0
            } : { accountcode: '', accountname: '', id: 0 },
            veid: entry.veid || 0,
            cardType: entry.cardType || '',
            commission: entry.commission || 0,
            status: entry.status || '',
            partyID: entry.partyID || 0
          };
          chequeItems.push(chequeItem);
          break;

        default:
          console.warn('Unknown transaction type:', entry.tranType);
          break;
      }
    });

    // Set the restored selections in the service
    this.voucherCommonService.cashSelected.set(cashItems);
    this.voucherCommonService.cardSelected.set(cardItems);
    this.voucherCommonService.chequeSelected.set(chequeItems);
    this.voucherCommonService.epaySelected.set(epayItems);

    const totalRestored = cashItems.length + cardItems.length + chequeItems.length + epayItems.length;
    console.log('✅ Payment selections restored successfully:', {
      totalEntries: creditEntries.length,
      totalRestored: totalRestored,
      cash: { count: cashItems.length, items: cashItems },
      card: { count: cardItems.length, items: cardItems },
      cheque: { count: chequeItems.length, items: chequeItems },
      epay: { count: epayItems.length, items: epayItems }
    });

    if (totalRestored === 0 && creditEntries.length > 0) {
      console.error('⚠️ WARNING: No payment selections were restored from credit entries!');
      console.error('Credit entries that failed to restore:', creditEntries);
    }
  }

  private showError(msg: string): void {
    this.baseService.showCustomDialogue(msg);
  }

  /**
   * Merge payment items - additive in edit mode, replace in new mode
   * @param existingItems Current selected items
   * @param newItems Newly selected items from popup
   * @param isEditMode Whether we're in edit mode
   * @param isCheque Whether this is a cheque payment (special matching logic)
   * @returns Merged array of payment items
   */
  private mergePaymentItems(
    existingItems: any[],
    newItems: any[],
    isEditMode: boolean,
    isCheque: boolean = false
  ): any[] {
    // In new mode, just replace (current behavior)
    if (!isEditMode) {
      return newItems;
    }

    // In edit mode, merge amounts for matching accounts
    const merged = [...existingItems];

    for (const newItem of newItems) {
      if (isCheque) {
        // For cheques, match by PDC payable ID and cheque number
        const existingIndex = merged.findIndex(item =>
          item.pdcpayable?.id === newItem.pdcpayable?.id &&
          item.chequeno === newItem.chequeno
        );

        if (existingIndex !== -1) {
          // Add amounts for matching cheque
          merged[existingIndex].amount =
            (Number(merged[existingIndex].amount) || 0) +
            (Number(newItem.amount) || 0);
        } else {
          // New cheque entry
          merged.push(newItem);
        }
      } else {
        // For cash/card/epay, match by account ID
        // Get account IDs from both items (handle different field names)
        const newItemId = newItem.id || newItem.accountId || 0;
        const existingIndex = merged.findIndex(item => {
          const existingId = item.id || item.accountId || 0;
          return existingId > 0 && existingId === newItemId;
        });

        if (existingIndex !== -1) {
          // Add amounts for matching account
          merged[existingIndex].amount =
            (Number(merged[existingIndex].amount) || 0) +
            (Number(newItem.amount) || 0);
          // Update description if new one is provided
          if (newItem.description) {
            merged[existingIndex].description = newItem.description;
          }
        } else {
          // New account entry
          merged.push(newItem);
        }
      }
    }

    return merged;
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
        const p = new Date(input);
        if (!isNaN(p.getTime())) {
          return toUtcIso(p.getFullYear(), p.getMonth(), p.getDate());
        }
        return null;
      }
      return null;
    } catch {
      return null;
    }
  }
  private findById<T>(arr: T[], id: any): T | undefined {
    if (!Array.isArray(arr)) return undefined;
    const num = Number(id);
    return arr.find((x: any) => (x?.id ?? x?.ID) == num);
  }
  private buildPaymentBreakdownFromSelections(): PaymentBreakdownResult {
    const cashSel = this.voucherCommonService.cashSelected() || [];
    const cardSel = this.voucherCommonService.cardSelected() || [];
    const chequeSel = this.voucherCommonService.chequeSelected() || [];
    const epaySel = this.voucherCommonService.epaySelected() || [];

    console.log('Building payment breakdown from selections:', {
      cash: cashSel.length,
      card: cardSel.length,
      cheque: chequeSel.length,
      epay: epaySel.length
    });

    const mapSimple = (items: any[], transType: string) => items.map((it: any) => {
      // Round to 2 decimal places to avoid floating-point precision errors
      const roundedAmount = parseFloat((Number(it.amount) || 0).toFixed(2));

      const obj: any = {
        accountCode: {
          alias: it.accountcode || it.accountCode?.code || '',
          name: it.accountname || it.accountCode?.name || '',
          id: it.id || it.accountCode?.id || 0,
        },
        amount: roundedAmount,
        transType,
      };
      if (it.description) obj.description = it.description;
      return obj;
    });

    const cash = mapSimple(cashSel, 'Cash');
    const card = mapSimple(cardSel, 'Card');
    const epay = mapSimple(epaySel, 'E-Pay');

    const bankList = this.voucherService.bankData();
    const findBank = (id: any) => {
      const b = (bankList || []).find((x: any) => (x?.id) == id);
      return b ? { alias: b.accountcode || '', name: b.accountname || '', id: b.id || 0 } : { alias: '', name: '', id: 0 };
    };

    const cheque = (chequeSel || []).map((it: any) => {
      // Round to 2 decimal places to avoid floating-point precision errors
      const roundedAmount = parseFloat((Number(it.amount) || 0).toFixed(2));

      const bank = it.bankId ? findBank(it.bankId) : (it.bankName ? {
        alias: it.bankName?.accountcode || '',
        name: it.bankName?.accountname || '',
        id: it.bankName?.id || 0
      } : { alias: '', name: '', id: 0 });
      const obj: any = {
        pdcPayable: {
          alias: it.pdcpayable?.accountcode || '',
          name: it.pdcpayable?.accountname || '',
          id: it.pdcpayable?.id || 0,
        },
        chequeNo: it.chequeno || '',
        amount: roundedAmount,
        bankName: bank,
        clearingDays: Number(it.clearingdays) || 0,
        transType: 'Cheque',
      };
      if (it.description) obj.description = it.description;
      // Always provide chequeDate; if not provided or invalid, default to today's date
      {
        const iso = this.toISO(it.chequedate);
        obj.chequeDate = iso || new Date().toISOString();
      }
      obj.veid = Number(it.veid) || 0;
      obj.cardType = it.cardType || '';
      obj.commission = Number(it.commission) || 0;
      obj.bankID = Number(it.bankID || bank.id || 0);
      obj.status = it.status || '';
      obj.partyID = Number(it.partyID) || 0;
      return obj;
    });

    // Round total to 2 decimal places
    const creditTotal = parseFloat([...cash, ...card, ...epay, ...cheque].reduce((s, x: any) => s + (Number(x.amount) || 0), 0).toFixed(2));
    return { cash, card, epay, cheque, creditTotal };
  }
  private buildPaydetailsSummary(): any[] {
    const rows = this.voucherCommonService.paymentDetailsData() || [];
    return rows.map((r: any) => {
      const obj: any = {
        accountName: r.AccountName || '',
        amount: Number(r.Amount) || 0,
        transType: r.TranType || '',
      };
      if (r.Description) obj.description = r.Description;
      return obj;
    });
  }
  private buildBillAndRef(accRows: any[], isUpdate: boolean): any[] {
    const out: any[] = [];
    
    for (const r of accRows) {
      if (Array.isArray(r.poAllocations)) {
        for (const alloc of r.poAllocations) {
          const item: any = {
            selection: alloc.selection,
            invoiceNo: alloc.invoiceNo,
            invoiceAmount: parseFloat((Number(alloc.invoiceAmount) || 0).toFixed(2)),
            allocated: parseFloat((Number(alloc.allocated) || 0).toFixed(2)),
            amount: parseFloat((Number(alloc.amount) || 0).toFixed(2)),
            balance: parseFloat((Number(alloc.balance) || 0).toFixed(2)),
            description: alloc.description || '',
            account: alloc.account || '',
            vid: Number(alloc.vid) || 0,
            veid: Number(alloc.veid) || 0,
            accountID: Number(alloc.AccountID || alloc.accountID) || 0,
          };
          // Always include invoiceDate; fallback to current date if missing/invalid
          {
            const iso = this.toISO(alloc.invoiceDate);
            item.invoiceDate = iso || new Date().toISOString();
          }
          // Always include partyInvNo as a number (backend expects int)
          item.partyInvNo = Number(alloc.partyInvNo) || 0;
          // Always include partyInvDate; fallback to current date if missing/invalid
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

      const invoiceAmount = Number(item.invoiceAmount ?? item.BillAmount ?? item.billAmount ?? 0);
      const allocated = Number(item.allocated ?? item.Allocated ?? 0);
      const amount = Number(item.amount ?? item.Amount ?? 0);
      const balance = invoiceAmount - (allocated + amount);

      const invoiceDateIso = this.toISO(item.invoiceDate ?? item.VDate);
      const partyInvDateIso = this.toISO(item.partyInvDate);

      return {
        selection,
        invoiceNo: item.invoiceNo ?? item.VNo ?? '',
        invoiceAmount: parseFloat(invoiceAmount.toFixed(2)),
        allocated: parseFloat(allocated.toFixed(2)),
        amount: parseFloat(amount.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        description: item.description ?? item.Description ?? '',
        account: item.account ?? item.Account ?? '',
        vid: Number(item.vid ?? item.VID) || 0,
        veid: Number(item.veid ?? item.VEID) || 0,
        accountID: Number(item.AccountID ?? item.accountID) || 0,
        invoiceDate: invoiceDateIso ?? new Date().toISOString(),
        partyInvNo: Number(item.partyInvNo) || 0,
        partyInvDate: partyInvDateIso ?? new Date().toISOString(),
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

  /**
   * Delete receipt voucher by calling API
   * @param voucherId The transaction ID to delete
   * @param voucherNo The voucher number (for display)
   */
  private deleteReceiptVoucher(voucherId: number, voucherNo: string): void {
    // Build delete URL with PageId and TransId parameters
    const deleteUrl = `${EndpointConstant.DELETERECEIPTVOUCHER}${this.pageId}&TransId=${voucherId}`;

    console.log('Deleting receipt voucher:', { voucherId, voucherNo, pageId: this.pageId, url: deleteUrl });

    this.httpService
      .delete(deleteUrl)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          // Handle success response
          this.handleDeleteSuccess(response, voucherNo);
        },
        error: (error) => {
          // Handle error response
          this.handleDeleteError(error, voucherNo);
        }
      });
  }

  /**
   * Handle successful delete response
   * @param response API response
   * @param voucherNo Voucher number for display
   */
  private handleDeleteSuccess(response: any, voucherNo: string): void {
    console.log('Delete response:', response);

    // Check if backend returned error in success response
    const httpCode = (response as any)?.httpCode ?? (response as any)?.data?.httpCode;
    const isValid = (response as any)?.isValid ?? (response as any)?.data?.isValid;
    const dataMsg = (response as any)?.data?.msg || (response as any)?.message;

    if ((typeof httpCode === 'number' && httpCode >= 400) || isValid === false) {
      const details = typeof dataMsg === 'string' ? dataMsg : this.stringifyError(response);
      console.error('Delete receipt voucher returned error:', response);
      this.baseService.showCustomDialogue(`Delete failed:\n${details}`);
      return;
    }

    // Success - show message
    const successMsg = dataMsg || `Receipt Voucher "${voucherNo}" deleted successfully.`;
    this.baseService.showCustomDialogue(successMsg);

    // Clear form and reset state
    this.clearFormAfterDelete();

    // Refresh left grid to remove deleted voucher
    this.LeftGridInit();
  }

  /**
   * Handle delete error response
   * @param error Error object
   * @param voucherNo Voucher number for display
   */
  private handleDeleteError(error: any, voucherNo: string): void {
    const details = this.stringifyError(error);
    console.error('Delete receipt voucher failed:', error);

    this.baseService.showCustomDialogue(
      `Failed to delete Receipt Voucher "${voucherNo}":\n${details}`
    );
  }

  /**
   * Clear form and reset state after successful deletion
   */
  private clearFormAfterDelete(): void {
    // Reset selected voucher ID
    this.selectedReceiptVoucherId = 0;
    this.currentReceiptVoucher = null;
    this.selectedPaymentType = '';
    this.originalBillAndRef = [];

    // Clear all grid data using service method
    this.voucherCommonService.clearAllData();

    // Reset form
    this.receiptVoucherForm.reset();
    this.receiptVoucherForm.disable();

    // Set page type to view/list mode
    this.SetPageType(0);

    console.log('✅ Form cleared after deletion');
  }

}

// -------------------- Private helpers --------------------

