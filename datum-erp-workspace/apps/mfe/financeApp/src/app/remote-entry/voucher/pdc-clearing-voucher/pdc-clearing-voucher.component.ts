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
import { firstValueFrom } from 'rxjs';
import { PVoucherModel } from '../../model/PVoucherModel';
import { DatePipe } from '@angular/common';
import { DataSharingService, BaseService } from '@org/services';
import { GridComponent, SelectionSettingsModel } from '@syncfusion/ej2-angular-grids';
import { VoucherService } from '../common/services/voucher.service';

@Component({
  selector: 'app-pdc-clearing-voucher',
  standalone: false,
  templateUrl: './pdc-clearing-voucher.component.html',
  styles: [],
})
export class PdcClearingVoucherComponent extends BaseComponent implements OnInit {
  @ViewChild('chequeDetailsGrid') chequeDetailsGrid!: GridComponent;

  private httpService = inject(FinanceAppService);
  private datePipe = inject(DatePipe);
  private dataSharingService = inject(DataSharingService);
  private baseService = inject(BaseService);
  public voucherService = inject(VoucherService);

  pdcClearingForm = this.formUtil.thisForm;
  pageId = 74;
  readonly voucherId = 67; // PDC Clearing Voucher ID
  readonly today = new Date();

  // Cheque details grid data
  chequeDetailsData = signal<any[]>([]);

  selectedPdcClearingId!: number;
  currentPdcClearing: any = null;

  // Common fill data
  commonFillData: any = {};
  voucherName: string = '';

  // Grid configurations
  public chequeSelectionSettings: SelectionSettingsModel = {
    type: 'Multiple',
    mode: 'Row',
    checkboxOnly: true
  };

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();

    // Set pageId for PDC clearing voucher
    this.dataSharingService.setPageId(this.pageId);

    // Set to new/add mode on initialization
    this.SetPageType(1);

    // Initialize empty grid
    this.chequeDetailsData.set([]);

    // Fetch common fill data
    this.fetchCommonFillData();

    // Fetch bank details from service
    this.voucherService.fetchBankDetails();

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
    this.pdcClearingForm = new FormGroup({
      voucherName: new FormControl(
        { value: '', disabled: true },
        Validators.required
      ),
      voucherNo: new FormControl(
        { value: '', disabled: true },
        Validators.required
      ),
      voucherDate: new FormControl(
        { value: '', disabled: false },
        Validators.required
      ),
      bankName: new FormControl({ value: '', disabled: false }, Validators.required),
      narration: new FormControl({ value: '', disabled: false }),
      // Hidden fields with default values
      currency: new FormControl({ value: 'SAR', disabled: true }),
      exchangeRate: new FormControl({ value: 1, disabled: true }),
    });
    this.formUtil.thisForm = this.pdcClearingForm;
  }

  override SaveFormData() {
    try {
      const isUpdate = !!(this.selectedPdcClearingId && this.selectedPdcClearingId > 0);

      if (!this.pdcClearingForm || this.pdcClearingForm.invalid) {
        this.pdcClearingForm?.markAllAsTouched();
        this.formValidationError();
        return;
      }

      const formVals = this.pdcClearingForm.getRawValue();

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

      // Required: bankName
      if (!formVals.bankName) {
        this.baseService.showCustomDialogue('Bank Name is required.');
        return;
      }

      // Get selected cheques
      const gridSelected = this.chequeDetailsGrid?.getSelectedRecords?.() as any[] | undefined;
      const selectedCheques = Array.isArray(gridSelected) && gridSelected.length
        ? gridSelected
        : this.chequeDetailsData().filter(cheque => cheque.selection === true);

      if (selectedCheques.length === 0) {
        this.baseService.showCustomDialogue('Please select at least one cheque to clear.');
        return;
      }
      debugger;
      // Get bank object
      const bankList = this.voucherService.bankData();
      const selectedBank = bankList.find(b => b.id === formVals.bankName);
      let bankPayload: any = {};
      if (selectedBank) {
        bankPayload = {
          id: selectedBank.id || 0,
          name: selectedBank.accountname || selectedBank.name || '',
          alias: selectedBank.accountcode || selectedBank.alias || '',
        };
      }
      debugger;
      // Build cheque details payload
      const chequeDetails = selectedCheques.map((cheque: any) => ({
        selection: true,
        id: cheque.id || 0,
        veid: cheque.veid || 0,
        vid: cheque.vid || 0,
        posted: cheque.posted || 0,
        chequeNo: cheque.chequeNo || '',
        chequeDate: this.toISO(cheque.chequeDate) || new Date().toISOString(),
        vDate: this.toISO(cheque.vDate) || new Date().toISOString(),
        bankName: cheque.bankName || '',
        partyID: cheque.partyID || 0,
        entryID: cheque.entryID || 0,
        party: cheque.party || '',
        description: cheque.description || '',
        debit: Number(cheque.debit) || 0,
        credit: Number(cheque.credit) || 0,
        accountID: cheque.accountID || 0,
        accountCode: cheque.accountCode || '',
        accountName: cheque.accountName || '',
        status: cheque.status || 'Not Posted',
      }));
      debugger;
      // Build payload
      const payload: any = {
        id: this.selectedPdcClearingId || 0,
        voucherNo: voucherNo,
        voucherDate: voucherDateIso,
        narration: formVals.narration || '',
        bankName: bankPayload,
        chequeDetails,
      };

      // Endpoint with PageId and voucherId
      const url = isUpdate
        ? `${EndpointConstant.UPDATEPDCCLEARING}${this.pageId}&voucherId=${this.voucherId}`
        : `${EndpointConstant.SAVEPDCCLEARING}${this.pageId}&voucherId=${this.voucherId}`;

      console.log('============ PDC CLEARING VOUCHER SAVE ============');
      console.log('Operation:', isUpdate ? 'UPDATE' : 'CREATE');
      console.log('PDC Clearing ID:', this.selectedPdcClearingId);
      console.log('URL:', url);
      console.log('Selected Cheques count:', selectedCheques.length);

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
              console.error('Save PDC Clearing Voucher returned error payload:', response);
              this.baseService.showCustomDialogue(`Save failed:\n${details}`);
              return;
            }

            const msg = (response as any)?.data?.msg || 'PDC clearing voucher saved successfully';
            this.baseService.showCustomDialogue(msg);
            // After save, switch to view mode to disable Save button
            this.SetPageType(3);
            this.pdcClearingForm.disable({ emitEvent: false });
            this.LeftGridInit();
          },
          error: (error) => {
            const details = this.stringifyError(error);
            console.error('Save PDC Clearing Voucher failed:', error);
            this.baseService.showCustomDialogue(`Save failed:\n${details}`);
          },
        });
    } catch (err: any) {
      const details = this.stringifyError(err);
      console.error('Save PDC Clearing Voucher exception:', err);
      this.baseService.showCustomDialogue(`Save failed:\n${details}`);
    }
  }

  override async LeftGridInit() {
    this.pageheading = 'PDC Clearing';
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
          headerText: 'PDC Clearing List',
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
      console.error('Error fetching PDC clearing vouchers:', err);
    }
  }

  override getDataById(data: PVoucherModel) {
    console.log('data', data);
    this.selectedPdcClearingId = data.ID;

    this.SetPageType(3);
    this.pdcClearingForm.disable();
    this.fetchPdcClearingById();
  }

  override onEditClick() {
    const selectedId = this.selectedPdcClearingId || (this as any).leftgridSelectedData?.ID;
    if (!selectedId || Number(selectedId) <= 0) {
      this.baseService.showCustomDialogue('Please select a PDC clearing voucher from the list to edit.');
      return;
    }

    this.selectedPdcClearingId = Number(selectedId);
    this.SetPageType(2);
    this.pdcClearingForm.enable();
    this.pdcClearingForm.get('voucherName')?.disable({ emitEvent: false });
    this.pdcClearingForm.get('voucherNo')?.disable({ emitEvent: false });

    if (!this.currentPdcClearing || this.currentPdcClearing.id !== this.selectedPdcClearingId) {
      this.fetchPdcClearingById();
    }
  }

  override formValidationError() {
    const c = this.pdcClearingForm?.controls || {} as any;
    const errors: string[] = [];
    if (c['voucherNo']?.invalid) errors.push('Voucher No is required.');
    if (c['voucherDate']?.invalid) errors.push('Voucher Date is required.');
    if (c['bankName']?.invalid) errors.push('Bank Name is required.');
    if (errors.length === 0) {
      errors.push('Please fix the highlighted fields.');
    }
    this.baseService.showCustomDialogue(errors.join('\n'));
  }

  private fetchPdcClearingById(): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLPURCHASEBYID + this.selectedPdcClearingId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const transactionData = response?.data?.transaction?.fillTransactions;
          const chequeEntries = response?.data?.transaction?.chequeDetails || [];

          this.currentPdcClearing = transactionData ?? null;

          let formVoucherDate = null;
          if (this.currentPdcClearing?.date) {
            formVoucherDate = this.datePipe.transform(
              new Date(this.currentPdcClearing.date),
              'dd/MM/yyyy'
            );
          }

          // Extract bank ID
          const bankId = this.currentPdcClearing?.bankId || 0;

          this.pdcClearingForm.patchValue({
            voucherName: this.voucherName || 'PC',
            voucherNo: this.currentPdcClearing?.transactionNo,
            voucherDate: formVoucherDate,
            narration: this.currentPdcClearing?.commonNarration,
            bankName: bankId,
          });

          // Set cheque details
          const chequeDetails = chequeEntries.map((entry: any, index: number) => ({
            rowId: index + 1,
            selection: entry.selection ?? true,
            id: entry.id || 0,
            veid: entry.veid || 0,
            vid: entry.vid || 0,
            posted: entry.posted || 0,
            chequeNo: entry.chequeNo || '',
            chequeDate: entry.chequeDate ? this.datePipe.transform(new Date(entry.chequeDate), 'dd/MM/yyyy') : '',
            vDate: entry.vDate ? this.datePipe.transform(new Date(entry.vDate), 'dd/MM/yyyy') : '',
            bankName: entry.bankName || '',
            partyID: entry.partyID || 0,
            entryID: entry.entryID || 0,
            party: entry.party || '',
            description: entry.description || '',
            debit: Number(entry.debit) || 0,
            credit: Number(entry.credit) || 0,
            accountID: entry.accountID || 0,
            accountCode: entry.accountCode || '',
            accountName: entry.accountName || '',
            status: entry.status || 'Not Posted',
          }));

          this.chequeDetailsData.set(chequeDetails);

          console.log('PDC Clearing Voucher loaded:', this.chequeDetailsData());
        },
        error: (error) => {
          console.error('Error loading PDC clearing voucher:', error);
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
    console.log('Entering New mode for PDC clearing voucher');

    // Set page type to new/add mode
    this.SetPageType(1);

    // Clear selected voucher data
    this.selectedPdcClearingId = 0;
    this.currentPdcClearing = null;

    // Clear cheque details
    this.chequeDetailsData.set([]);

    // Enable form for new entry
    this.pdcClearingForm.enable();

    // Keep voucher name and number disabled
    this.pdcClearingForm.get('voucherName')?.disable({ emitEvent: false });
    this.pdcClearingForm.get('voucherNo')?.disable({ emitEvent: false });

    // Reset form fields
    this.pdcClearingForm.patchValue({
      bankName: null,
      narration: '',
    });

    // Refresh voucher data from API
    this.fetchCommonFillData();

    // Clear any left-grid selection in local state
    this.leftgridSelectedData = null;

    console.log('Form reset for new PDC clearing voucher');
  }

  // Switch to topmost voucher in View mode
  private viewTopVoucherFromLeftGrid(): void {
    const firstVoucher = Array.isArray(this.leftGrid.leftGridData) && this.leftGrid.leftGridData.length
      ? this.leftGrid.leftGridData[0]
      : null;

    if (!firstVoucher) {
      this.baseService.showCustomDialogue('No PDC clearing vouchers available to view.');
      return;
    }

    this.getDataById(firstVoucher);
  }

  override DeleteData(data: PVoucherModel) {
    console.log('Delete requested for PDC clearing voucher:', data);

    if (!data || !data.ID) {
      this.baseService.showCustomDialogue('Please select a valid PDC clearing voucher to delete.');
      return;
    }

    const voucherId = data.ID;
    const voucherNo = data.TransactionNo || 'Unknown';

    const confirmDelete = confirm(
      `Are you sure you want to delete PDC Clearing Voucher "${voucherNo}"?\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) {
      console.log('Delete cancelled by user');
      return;
    }

    this.deletePdcClearingVoucher(voucherId, voucherNo);
  }

  // Handle bank selection change
  onBankChange(args: any): void {
    const selectedBankId = args.value;

    if (!selectedBankId) {
      this.chequeDetailsData.set([]);
      return;
    }

    console.log('Bank selected:', selectedBankId);
    this.fetchNotPostedCheques(selectedBankId);
  }

  // Fetch not-posted cheques by bank
  private fetchNotPostedCheques(bankId: number): void {
    const url = `${EndpointConstant.FILLPDCCHEQUES}${bankId}`;

    this.httpService
      .fetch<any>(url)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const chequesData = response?.data || [];

          // Map API response to grid format
          const chequeDetails = chequesData.map((cheque: any, index: number) => ({
            rowId: index + 1,
            selection: cheque.selection ?? false,
            id: cheque.id || 0,
            veid: cheque.veid || 0,
            vid: cheque.vid || 0,
            posted: cheque.posted || 0,
            chequeNo: cheque.chequeNo || '',
            chequeDate: cheque.chequeDate ? this.datePipe.transform(new Date(cheque.chequeDate), 'dd/MM/yyyy') : '',
            vDate: cheque.vDate ? this.datePipe.transform(new Date(cheque.vDate), 'dd/MM/yyyy') : '',
            bankName: cheque.bankName || '',
            partyID: cheque.partyID || 0,
            entryID: cheque.entryID || 0,
            party: cheque.party || '',
            description: cheque.description || '',
            debit: Number(cheque.debit) || 0,
            credit: Number(cheque.credit) || 0,
            accountID: cheque.accountID || 0,
            accountCode: cheque.accountCode || '',
            accountName: cheque.accountName || '',
            status: cheque.status || 'Not Posted',
          }));

          this.chequeDetailsData.set(chequeDetails);
          console.log(`Fetched ${chequeDetails.length} not-posted cheques for bank ${bankId}`);
        },
        error: (error) => {
          console.error('Error fetching not-posted cheques:', error);
          this.chequeDetailsData.set([]);
          this.baseService.showCustomDialogue('Failed to fetch cheque details. Please try again.');
        },
      });
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
    this.voucherName = this.commonFillData?.vNo?.code || 'PC';
    const voucherNo = this.commonFillData?.vNo?.result || '';

    this.pdcClearingForm.patchValue({
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

  private deletePdcClearingVoucher(voucherId: number, voucherNo: string): void {
    const deleteUrl = `${EndpointConstant.DELETEJOURNAL}${this.pageId}&TransId=${voucherId}`;

    console.log('Deleting PDC clearing voucher:', { voucherId, voucherNo, pageId: this.pageId, url: deleteUrl });

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
      console.error('Delete PDC clearing voucher returned error:', response);
      this.baseService.showCustomDialogue(`Delete failed:\n${details}`);
      return;
    }

    const successMsg = dataMsg || `PDC Clearing Voucher "${voucherNo}" deleted successfully.`;
    this.baseService.showCustomDialogue(successMsg);

    this.clearFormAfterDelete();
    this.LeftGridInit();
  }

  private handleDeleteError(error: any, voucherNo: string): void {
    const details = this.stringifyError(error);
    console.error('Delete PDC clearing voucher failed:', error);

    this.baseService.showCustomDialogue(
      `Failed to delete PDC Clearing Voucher "${voucherNo}":\n${details}`
    );
  }

  private clearFormAfterDelete(): void {
    this.selectedPdcClearingId = 0;
    this.currentPdcClearing = null;

    this.chequeDetailsData.set([]);

    this.pdcClearingForm.reset();
    this.pdcClearingForm.disable();

    this.SetPageType(0);

    console.log('✅ Form cleared after deletion');
  }
}
