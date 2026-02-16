import { Component, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { BaseService } from '@org/services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { EndpointConstant } from '@org/constants';
import { InvoiceHeader } from '../../common/invoice-header/invoice-header';
import { ItemList } from '../../common/item-list/item-list';
import { CommonModule } from '@angular/common';
import { TabModule } from '@syncfusion/ej2-angular-navigations';
import { AdditionalDetailsComponent } from '../../common/additional-details/additional-details.component';
import { InvoiceFooter } from '../../common/invoice-footer/invoice-footer';
import { CommonService } from '../../common/services/common.services';
import { ItemService } from '../../common/services/item.services';
import { TransactionService } from '../../common/services/transaction.services';
import { SalesValidatorService } from '../../common/services/sales-validator.service';
import { PdfGenerationService } from '../../common/services/pdfgeneration.service';
import { Subject, takeUntil, finalize } from 'rxjs';

interface SaveResponse {
  httpCode: number;
  data?: string;
  transactionId?: number;
}


@Component({
  selector: 'app-sales-invoice-component',
  standalone: true,
  templateUrl: './sales-invoice-component.html',
  styleUrl: './sales-invoice-component.css',
  imports: [
    CommonModule,
    InvoiceHeader,
    ItemList,
    TabModule,
    AdditionalDetailsComponent,
    InvoiceFooter
  ],
})
export class SalesInvoiceComponent extends BaseComponent implements OnInit, OnDestroy {

  // ========== Component State Signals ==========
  readonly isNewMode = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedTransactionId = signal<number | null>(null);
  readonly selectedTab = signal(1);
  readonly isLoading = signal(false);

  // ========== ViewChild References ==========
  @ViewChild(InvoiceHeader) invoiceHeader?: InvoiceHeader;
  @ViewChild(InvoiceFooter) invoiceFooter?: InvoiceFooter;
  @ViewChild(ItemList) itemList?: ItemList;
  @ViewChild('additionalDetailsRef') additionalDetailsRef?: AdditionalDetailsComponent;
  @ViewChild('dialogAlert') dialogTarget!: ElementRef;
  
  // ========== Injected Services ==========
  private readonly baseService = inject(BaseService);
  private readonly commonService = inject(CommonService);
  private readonly itemService = inject(ItemService);
  private readonly transactionService = inject(TransactionService);
  private readonly salesValidator = inject(SalesValidatorService);
  private readonly pdfGenerationService = inject(PdfGenerationService);
  private readonly destroySubscription = new Subject<void>();

  // ========== Form & Page Properties ==========
  costCategoryForm = this.formUtil.thisForm;
  pageId = 0;
  
  // ========== Transaction Data Properties ==========
  private lastSales: number = 0;
  private firstSales: number = 0;
  private isDefaultCash: boolean = false;
  private defaultCashAccount: any[] = [];
  
  // ========== Form State Tracking ==========
  private initialHeaderValues: any = {};
  private initialFooterValues: any = {};;

  // ========== UI State Properties ==========
  isGrossAmountEditable = false;
  isApproved = false;
  partyBalance = 0;

  // ========== Computed Properties ==========
  private get currentPageId(): number | null {
    return this.currentPageInfo?.id ?? null;
  }

  private get currentVoucherId(): number | null {
    return this.currentPageInfo?.voucherID ?? null;
  }
  
  get dataSharingService() {
    return this.serviceBase.dataSharingService;
  }

  get alertService() {
    return this.serviceBase.alertService;
  }

  get formToolbarService() {
    return this.serviceBase.formToolbarService;
  }

  // ========== Lifecycle Methods ==========
  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.initializeComponent();
    this.subscribeToTransactionSelection();
    this.subscribeToPageInfoAndLoadLeftGrid();
    this.initializeServices();
    
    // Check AutoNew setting and open in new mode if true, else open last invoice
    setTimeout(() => {
      this.checkAutoNewAndInitialize();
    }, 500);
  }

  private checkAutoNewAndInitialize(): void {
    // Page must open in New mode: Save enabled, fields editable, item grid ready
    this.enterNewMode();
  }

  ngOnDestroy(): void {
    this.destroySubscription.next();
    this.destroySubscription.complete();
  }

  // ========== BaseComponent Overrides ==========
  override async LeftGridInit(): Promise<void> {
    this.pageheading = 'Sales Invoice';
    
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }
    
    try {
      const response: any = await firstValueFrom(
        this.baseService.get(`${EndpointConstant.FILLALLPURCHASE}pageid=${this.currentPageId}&post=true`)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      const salesData = response?.data ?? [];

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Sales Invoice`s',
          columns: [
            {
              field: 'TransactionNo',
              datacol: 'TransactionNo',
              headerText: 'Invoice No',
              textAlign: 'Left',
              width: 120
            },
            {
              field: 'AccountName',
              datacol: 'AccountName',
              headerText: 'Customer',
              textAlign: 'Left',
              width: 150
            },
          ]
        }
      ];

      this.leftGrid.leftGridData = salesData;

      if (salesData.length > 0) {
        this.firstSales = parseInt(salesData[0]?.ID) || 0;
        this.lastSales = parseInt(salesData[salesData.length - 1]?.ID) || 0;
      }
    } catch (error: any) {
      console.error('Error fetching sales invoice data:', error);
      this.leftGrid.leftGridColumns = [];
      this.leftGrid.leftGridData = [];
    }
  }

  protected override newbuttonClicked(): void {
    this.onNewClick();
  }

  protected override onEditClick(): void {
    this.onEditClickHandler();
  }

  protected override FormInitialize(): void {
    this.syncFormsWithBaseComponent();
    this.captureInitialValues();

    if (this.invoiceHeader?.salesForm) {
      this.invoiceHeader.salesForm.markAsPristine();
    }

    if (this.invoiceFooter?.salesForm) {
      this.invoiceFooter.salesForm.markAsPristine();
    }
  }

  protected override SaveFormData(): void {
    this.syncFormsWithBaseComponent();
    this.onSaveClick();
  }

  protected override formValidationError(): void {
    this.baseService.showCustomDialoguePopup(
      'Please fill all required fields correctly.',
      'Validation Error',
      'WARN'
    );
  }

  protected override DeleteData(data: any): void {
    if (data?.ID) {
      this.selectedTransactionId.set(parseInt(String(data.ID || 0)));
    }
    this.onDeleteClick();
  }

  protected override getDataById(data: any): void {
    if (data?.ID) {
      this.selectedTransactionId.set(parseInt(String(data.ID || 0)));
      this.loadTransactionDetails(data.ID);
    }
  }

  // ========== Initialization Methods ==========
  private initializeComponent(): void {
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    this.selectedTransactionId.set(null);
  }

  private initializeServices(): void {
    this.commonService.initializeState();
    this.itemService.resetItemData();
    this.initializeDefaultCashSettings();
  }

  private initializeDefaultCashSettings(): void {
    setTimeout(() => {
      if (this.invoiceFooter) {
        this.isDefaultCash = this.invoiceFooter.isDefaultCash || false;
        this.defaultCashAccount = this.invoiceFooter.defaultCashAccount || [];
      }
    }, 200);
  }

  private subscribeToTransactionSelection(): void {
    this.dataSharingService.selectedSalesId$
      .pipe(takeUntil(this.destroySubscription))
      .subscribe((salesId) => {
        if (salesId && salesId !== this.selectedTransactionId()) {
          setTimeout(() => {
            this.selectedTransactionId.set(parseInt(String(salesId || 0)));
            this.loadTransactionDetails(salesId);
          }, 0);
        }
      });
  }

  /**
   * Load left grid when currentPageInfo becomes available (e.g. after NavigationEnd).
   * Fixes "no data load" when page loads before router has set page info.
   */
  private subscribeToPageInfoAndLoadLeftGrid(): void {
    this.dataSharingService.currentPageInfo$
      .pipe(takeUntil(this.destroySubscription))
      .subscribe((pageInfo) => {
        this.currentPageInfo = pageInfo;
        const pageId = pageInfo?.id;
        const voucherId = pageInfo?.voucherID;
        if (pageId != null && pageId !== 0 && voucherId != null && voucherId !== 0) {
          this.loadLeftGridAndRefresh();
        }
      });
  }

  private async loadLeftGridAndRefresh(): Promise<void> {
    await this.LeftGridInit();
    this.dataSharingService.setData({
      columns: this.leftGrid.leftGridColumns,
      data: this.leftGrid.leftGridData,
      pageheading: this.pageheading,
    });
    // Auto-select last invoice or enter new mode once data is loaded
    setTimeout(() => this.checkAutoNewAndInitialize(), 300);
  }

  /** Refresh left grid data only (e.g. when entering New mode). Does not run checkAutoNewAndInitialize. */
  private async refreshLeftGridOnly(): Promise<void> {
    if (!this.currentPageId || !this.currentVoucherId) return;
    await this.LeftGridInit();
    this.dataSharingService.setData({
      columns: this.leftGrid.leftGridColumns,
      data: this.leftGrid.leftGridData,
      pageheading: this.pageheading,
    });
  }

  // ========== Transaction Loading Methods ==========
  private loadTransactionDetails(salesId: number): void {
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }

    this.isLoading.set(true);
    const endpoint = `${EndpointConstant.FILLTRANSACTIONDETAILSBYID}${salesId}`;
    
    this.baseService.get(endpoint)
      .pipe(
        takeUntil(this.destroySubscription),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          if (response?.data) {
            this.populateTransactionData(response.data);
          }
        },
        error: (error: any) => {
          this.baseService.showCustomDialoguePopup(
            'Failed to load transaction details. Please try again.',
            'Load Error',
            'ERROR'
          );
        }
      });
  }

  private populateTransactionData(transactionData: any): void {
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    this.dataSharingService.setSelectedSalesId(this.selectedTransactionId());
    this.formToolbarService.setToolbarState({
      isNewMode: false,
      isEditMode: false,
      isSaveBtnDisabled: true,
      isEditBtnDisabled: false,
      isDeleteBtnDisabled: false,
    });
  }

  // ========== Mode Management Methods ==========
  onNewClick(): void {
    if (this.isNewMode()) {
      if (this.hasUnsavedData()) {
        this.showUnsavedChangesDialog();
      } else {
        this.exitNewMode();
      }
    } else {
      this.enterNewMode();
    }
  }

  private onEditClickHandler(): void {
    this.syncFormsWithBaseComponent();

    if (this.isEditMode()) {
      this.exitEditMode();
    } else {
      this.enterEditMode();
    }
  }

  private enterNewMode(): void {
    this.isNewMode.set(true);
    this.isEditMode.set(false);
    this.clearAllComponents(false);
    this.resetFormsForNewMode();
    this.commonService.newlyAddedRows.set([]);

    this.formToolbarService.setToolbarState({
      isNewMode: true,
      isEditMode: false,
      isSaveBtnDisabled: false,
      isEditBtnDisabled: true,
      isDeleteBtnDisabled: true,
    });

    // Refresh left grid so it shows latest invoice list when starting a new invoice
    setTimeout(() => this.refreshLeftGridOnly(), 150);

    setTimeout(() => {
      this.itemService.initializeGridForNewMode();
      // Ensure grid is editable immediately
      if (this.itemList?.grid) {
        this.itemList.grid.editSettings.allowEditing = true;
        this.itemList.grid.editSettings.allowAdding = true;
      }
      this.captureInitialValues();
    }, 100);
  }

  private exitNewMode(): void {
    if (!this.confirmExitIfNewlyAddedRows('new mode')) return;

    this.itemService.clearNewlyAddedRows();
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    this.clearAllComponents(true);
    this.resetInitialValues();
    this.formToolbarService.setToolbarState({
      isNewMode: false,
      isEditMode: false,
      isSaveBtnDisabled: true,
      isEditBtnDisabled: false,
      isDeleteBtnDisabled: false,
    });
    this.autoSelectLastTransaction();
  }

  private enterEditMode(): void {
    if (!this.selectedTransactionId()) {
      return;
    }

    this.isEditMode.set(true);
    this.isNewMode.set(false);
    this.loadTransactionForEdit();

    this.formToolbarService.setToolbarState({
      isNewMode: false,
      isEditMode: true,
      isSaveBtnDisabled: false,
      isEditBtnDisabled: true,
      isDeleteBtnDisabled: true,
    });
    
    // Ensure grid is editable; empty row for new items is added by invoice-footer when transaction data is bound
    setTimeout(() => {
      if (this.itemList?.grid) {
        this.itemList.grid.editSettings.allowEditing = true;
        this.itemList.grid.editSettings.allowAdding = true;
      }
    }, 400);
  }

  private exitEditMode(): void {
    if (!this.confirmExitIfNewlyAddedRows('edit mode')) return;

    this.itemService.clearNewlyAddedRows();
    this.isEditMode.set(false);
    this.isNewMode.set(false);
    this.clearAllComponents(true);
    this.formToolbarService.setToolbarState({
      isNewMode: false,
      isEditMode: false,
      isSaveBtnDisabled: true,
      isEditBtnDisabled: false,
      isDeleteBtnDisabled: false,
    });
  }

  private loadTransactionForEdit(): void {
    this.commonService.newlyAddedRows.set([]);
    if (!this.selectedTransactionId()) {
      return;
    }
    // Force footer to re-fetch current transaction (no clear of header/grid – avoids edit binding issues).
    this.dataSharingService.reloadTransactionForEdit$.next();
  }

  private confirmExitIfNewlyAddedRows(modeName: string): boolean {
    if (!this.itemService.hasNewlyAddedRows()) return true;

    const newlyAddedCount = this.itemService.getNewlyAddedRowsCount();
    const confirmMessage = `You have ${newlyAddedCount} newly added row(s) that will be deleted when exiting ${modeName}. Do you want to continue?`;
    return confirm(confirmMessage);
  }

  private clearAllComponents(isSwitchingToViewMode = false): void {
    if (this.itemList && !isSwitchingToViewMode) {
      this.dataSharingService.setSelectedSalesId(null);
    }

    if (isSwitchingToViewMode) {
      this.commonService.newlyAddedRows.set([]);
    }

    this.invoiceHeader?.salesForm?.reset();
    this.invoiceFooter?.salesForm?.reset();
  }

  private resetFormsForNewMode(): void {
    this.invoiceHeader?.resetFormForNewMode();
    this.invoiceFooter?.resetFormForNewMode();
  }

  private autoSelectLastTransaction(): void {
    setTimeout(() => {
      this.dataSharingService.setSelectedSalesId(this.lastSales);
    }, 100);
  }

  // ========== Form State Management ==========
  private syncFormsWithBaseComponent(): void {
    if (this.invoiceHeader?.salesForm && this.invoiceFooter?.salesForm) {
      this.formUtil.thisForm = this.invoiceHeader.salesForm;

      this.invoiceHeader.salesForm.statusChanges.subscribe(() => {
        if (this.invoiceHeader?.salesForm) {
          this.formUtil.thisForm = this.invoiceHeader.salesForm;
        }
      });
    }
  }

  hasUnsavedData(): boolean {
    const items = this.commonService.tempItemFillDetails();
    const nonEmptyItems = items.filter((item: any) =>
      item.itemCode && item.itemCode.trim() !== ''
    );

    if (nonEmptyItems && nonEmptyItems.length > 0) {
      return true;
    }

    if (this.itemService.hasNewlyAddedRows()) {
      return true;
    }

    if (this.invoiceHeader?.salesForm) {
      const currentHeader = this.invoiceHeader.salesForm.getRawValue();
      if (!this.initialHeaderValues || Object.keys(this.initialHeaderValues).length === 0) {
        return false;
      }

      const hasHeaderChanges = Object.keys(currentHeader).some(key => {
        const current = currentHeader[key];
        const initial = this.initialHeaderValues[key];
        if ((current === null || current === undefined || current === '') &&
          (initial === null || initial === undefined || initial === '')) {
          return false;
        }
        return current !== initial;
      });

      if (hasHeaderChanges) {
        return true;
      }
    }

    if (this.invoiceFooter?.salesForm) {
      const currentFooter = this.invoiceFooter.salesForm.getRawValue();
      if (!this.initialFooterValues || Object.keys(this.initialFooterValues).length === 0) {
        return false;
      }

      const hasFooterChanges = Object.keys(currentFooter).some(key => {
        const current = currentFooter[key];
        const initial = this.initialFooterValues[key];
        if ((current === null || current === undefined || current === '') &&
          (initial === null || initial === undefined || initial === '')) {
          return false;
        }
        return current !== initial;
      });

      if (hasFooterChanges) {
        return true;
      }
    }

    return false;
  }

  private captureInitialValues(): void {
    setTimeout(() => {
      if (this.invoiceHeader?.salesForm) {
        this.initialHeaderValues = this.invoiceHeader.salesForm.getRawValue();
      }
      if (this.invoiceFooter?.salesForm) {
        this.initialFooterValues = this.invoiceFooter.salesForm.getRawValue();
      }
    }, 150);
  }

  private resetInitialValues(): void {
    this.initialHeaderValues = {};
    this.initialFooterValues = {};
  }

  // ========== Validation Methods ==========
  private validateTransaction(): any {
    const headerForm = this.invoiceHeader?.salesForm ?? null;
    const footerForm = this.invoiceFooter?.salesForm ?? null;
    const additionalForm = this.invoiceHeader?.salesForm ?? null;
    const items = this.commonService.tempItemFillDetails();

    return this.salesValidator.validateBeforeSave(
      headerForm,
      footerForm,
      additionalForm,
      items
    ) as any;
  }

  private handleValidationError(result: any): void {
    const message = result.firstError?.message ?? 'Validation failed. Please review the form.';
    this.baseService.showCustomDialoguePopup(message, 'WARN');
  }

  // ========== Save Methods ==========
  onSaveClick(): void {
    if (!this.isNewMode() && !this.isEditMode()) {
      this.baseService.showCustomDialoguePopup(
        'Please enter New or Edit mode to save.',
        'Save Error',
        'WARN'
      );
      return;
    }

    this.syncFormsWithBaseComponent();

    if (this.formUtil.thisForm?.invalid) {
      this.formValidationError();
      return;
    }

    const validationResult = this.validateTransaction();
    if (!validationResult.valid) {
      this.handleValidationError(validationResult);
      return;
    }

    const footerForm = this.invoiceFooter?.salesForm?.value || {};
    const payType = footerForm.paytype;
    const grandTotal = parseFloat(footerForm.grandtotal) || 0;
    const balanceAmount = parseFloat(footerForm.balance) || 0;
    const totalPaid = parseFloat(footerForm.totalpaid) || 0;
    const cashSelectedLength = this.invoiceFooter?.cashSelected?.length || 0;
    const isCashPayment = payType && (payType.name === 'Cash' || payType.value === 'Cash');
    const isCreditPayment = payType && (payType.name === 'Credit' || payType.value === 'Credit');

    // Auto-change paytype logic from old code:
    // If Credit and balance is 0, change to Cash
    if (isCreditPayment && balanceAmount === 0 && totalPaid > 0) {
      const cashPayType = this.invoiceFooter?.payTypeObj?.find((p: any) => p.name === 'Cash');
      if (cashPayType) {
        this.invoiceFooter?.salesForm?.patchValue({ paytype: cashPayType.id });
        footerForm.paytype = { id: cashPayType.id, value: 'Cash', name: 'Cash' };
      }
    }

    // If Cash and balance > 0, ask to change to Credit
    if (isCashPayment && balanceAmount > 0 && totalPaid > 0) {
      this.viewDialog(
        'Do you want to update paytype as Credit?',
        'Payment Type',
        '450px',
        [
          {
            click: () => {
              this.alertService.hideDialog();
              const creditPayType = this.invoiceFooter?.payTypeObj?.find((p: any) => p.name === 'Credit');
              if (creditPayType) {
                this.invoiceFooter?.salesForm?.patchValue({ paytype: creditPayType.id });
              }
              this.runCashCheckAndSave();
            },
            buttonModel: { content: 'Yes', isPrimary: true },
          },
          {
            click: () => {
              this.alertService.hideDialog();
              this.runCashCheckAndSave();
            },
            buttonModel: { content: 'No' },
          },
        ]
      );
      return;
    }

    if (isCashPayment && grandTotal > 0 && cashSelectedLength === 0) {
      // Always show default payment confirmation popup when no cash entries are allocated
      setTimeout(() => {
        this.viewDialog(
          'Do you want to allocate the payment amount to default cash account?',
          'Default Cash',
          '450px',
          [
            {
              click: () => {
                this.alertService.hideDialog();
                this.settingCashAmountOnSave();
                if (this.invoiceFooter?.cashSelected?.length === 0) {
                  this.ensureCashEntriesForCashPayment(grandTotal);
                }
                this.continueSaveFlow();
              },
              buttonModel: { content: 'Yes', isPrimary: true },
            },
            {
              click: () => {
                this.alertService.hideDialog();
                this.baseService.showCustomDialoguePopup(
                  'Cash payment entries are required for cash transactions',
                  'WARN'
                );
              },
              buttonModel: { content: 'No' },
            },
          ]
        );
      }, 0);
      return;
    }

    this.continueSaveFlow();
  }

  private continueSaveFlow(): void {
    this.adjustRoundoffForDebitCreditBalance();
    const footerForm = this.invoiceFooter?.salesForm;
    if (footerForm && !this.isDebitCreditBalanced(footerForm)) {
      this.baseService.showCustomDialoguePopup(
        'Credit and debit are not equal. Please correct payment/round off before saving.',
        'Cannot Save',
        'WARN'
      );
      return;
    }
    const payload = this.collectTransactionData();
    this.performSave(payload);
  }

  /** Returns true if debit (grandTotal) equals credit (netAmount + tax + addCharges + roundoff) within tolerance. */
  private isDebitCreditBalanced(footerForm: any): boolean {
    const grandTotal = parseFloat(footerForm.get('grandtotal')?.value || 0);
    const netAmount = parseFloat(footerForm.get('netamount')?.value || 0);
    const taxTotal = parseFloat(footerForm.get('tax')?.value || 0);
    const addCharges = parseFloat(footerForm.get('addcharges')?.value || 0);
    const roundoff = parseFloat(footerForm.get('roundoff')?.value || 0);
    const credit = netAmount + taxTotal + addCharges + roundoff;
    return Math.abs(grandTotal - credit) <= 0.01;
  }

  /**
   * Runs the default-cash check and then save. Used after the Credit dialog so we don't duplicate onSaveClick.
   */
  private runCashCheckAndSave(): void {
    const footerForm = this.invoiceFooter?.salesForm?.value || {};
    const payType = footerForm.paytype;
    const grandTotal = parseFloat(footerForm.grandtotal) || 0;
    const cashSelectedLength = this.invoiceFooter?.cashSelected?.length || 0;
    const isCashPayment = payType && (payType.name === 'Cash' || payType.value === 'Cash');

    if (isCashPayment && grandTotal > 0 && cashSelectedLength === 0) {
      setTimeout(() => {
        this.viewDialog(
          'Do you want to allocate the payment amount to default cash account?',
          'Default Cash',
          '450px',
          [
            {
              click: () => {
                this.alertService.hideDialog();
                this.settingCashAmountOnSave();
                if (this.invoiceFooter?.cashSelected?.length === 0) {
                  this.ensureCashEntriesForCashPayment(grandTotal);
                }
                this.continueSaveFlow();
              },
              buttonModel: { content: 'Yes', isPrimary: true },
            },
            {
              click: () => {
                this.alertService.hideDialog();
                this.baseService.showCustomDialoguePopup(
                  'Cash payment entries are required for cash transactions',
                  'WARN'
                );
              },
              buttonModel: { content: 'No' },
            },
          ]
        );
      }, 0);
      return;
    }
    this.continueSaveFlow();
  }

  private collectTransactionData(): any {
    const headerForm = this.invoiceHeader?.salesForm?.value || {};
    const footerForm = this.invoiceFooter?.salesForm?.value || {};
    const itemDetails = this.commonService.tempItemFillDetails() || [];
    const transactionId = this.isNewMode() ? 0 : parseInt(String(this.selectedTransactionId() || 0));

    return {
      id: transactionId,
      ...this.buildTransactionHeader(headerForm, footerForm),
      items: this.buildTransactionItems(itemDetails),
      transactionEntries: this.buildTransactionEntries(footerForm, itemDetails),
      cancelled: false,
    };
  }

  private performSave(transactionData: any): void {
    const pageId = this.invoiceHeader?.pageId ?? this.currentPageId ?? 149;
    const voucherId = this.invoiceHeader?.voucherNo ?? this.currentVoucherId ?? 23;
    
    // Use UPDATE endpoint for edit mode, SAVE endpoint for new mode
    const isUpdate = !this.isNewMode() && transactionData.id > 0;
    const transactionId = transactionData?.id ?? this.selectedTransactionId();
    const endpoint = isUpdate
      ? `${EndpointConstant.UPDATESALES}${pageId}&voucherId=${voucherId}&transactionId=${transactionId}`
      : `${EndpointConstant.SAVESALES}${pageId}&voucherId=${voucherId}`;

    this.isLoading.set(true);

    // Backend [FromBody] binds the whole body to InventoryTransactionDto - send transaction object as root
    const saveOperation = isUpdate
      ? this.transactionService.patchDetails(endpoint, transactionData)
      : this.transactionService.saveDetails(endpoint, transactionData);

    saveOperation
      .pipe(
        takeUntil(this.destroySubscription),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: SaveResponse) => this.handleSaveSuccess(response),
        error: (err: any) => this.handleSaveError(err),
      });
  }

  private handleSaveSuccess(response: SaveResponse): void {
    if (response?.httpCode === 200) {
      if (response.transactionId && response.transactionId > 0) {
        const transactionId = parseInt(String(response.transactionId || 0));
        this.selectedTransactionId.set(transactionId);
        this.dataSharingService.setSelectedSalesId(transactionId);
      }

      this.isNewMode.set(false);
      this.isEditMode.set(false);
      this.commonService.newlyAddedRows.set([]);

      this.baseService.showCustomDialoguePopup(
        'Transaction saved successfully!',
        'SUCCESS'
      );

      // Refresh common fill data (next voucher number) before entering new mode so second save gets a fresh voucher
      const refresh$ = this.invoiceHeader?.refreshCommonFillDataForNewMode?.();
      if (refresh$) {
        refresh$.pipe(takeUntil(this.destroySubscription)).subscribe({
          next: () => setTimeout(() => this.enterNewMode(), 300),
          error: () => setTimeout(() => this.enterNewMode(), 300),
        });
      } else {
        setTimeout(() => this.enterNewMode(), 500);
      }
    } else {
      // Show server error message when httpCode is 500 or other non-success
      const errMsg = (response as any)?.exception ?? response?.data ?? 'Save failed. Please try again.';
      this.baseService.showCustomDialoguePopup(
        typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
        'WARN'
      );
    }
  }

  private handleSaveError(err: any): void {
    console.error('Save failed', err);
    this.baseService.showCustomDialoguePopup(
      err?.error?.data || err?.message || 'Save failed. Please check console for details.',
      'Save Failed',
      'WARN'
    );
  }

  // ========== Delete Methods ==========
  onDeleteClick(): void {
    if (!this.selectedTransactionId()) {
      this.baseService.showCustomDialoguePopup('No transaction selected for deletion', 'WARN');
      return;
    }

    this.viewDialog(
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      'Delete Confirmation',
      '450px',
      [
        {
          click: this.confirmDelete.bind(this),
          buttonModel: { content: 'Yes', isPrimary: true }
        },
        {
          click: this.hideBtnClick.bind(this),
          buttonModel: { content: 'No' }
        }
      ]
    );
  }

  private confirmDelete(): void {
    this.alertService.hideDialog();
    if (!this.selectedTransactionId()) {
      console.error('Cannot delete: No transaction ID');
      return;
    }
    this.performDelete();
  }

  private performDelete(): void {
    const transactionId = this.selectedTransactionId();
    const pageId = this.invoiceHeader?.pageId ?? this.currentPageId ?? 149;
    const endpoint = `${EndpointConstant.DELETESALES}${transactionId}&pageId=${pageId}`;

    this.isLoading.set(true);

    this.transactionService
      .deleteDetails(endpoint)
      .pipe(
        takeUntil(this.destroySubscription),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          if (response?.httpCode === 200) {
            this.baseService.showCustomDialoguePopup(
              response.data || 'Transaction deleted successfully!',
              'SUCCESS'
            );

            this.selectedTransactionId.set(null);
            this.isNewMode.set(false);
            this.isEditMode.set(false);

            this.LeftGridInit();

            setTimeout(() => {
              this.autoSelectLastTransaction();
            }, 300);
          } else {
            this.baseService.showCustomDialoguePopup(
              response.data || 'Failed to delete transaction',
              'ERROR'
            );
            console.error('Delete failed:', response);
          }
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.baseService.showCustomDialoguePopup(
            'An error occurred while deleting the transaction. Please try again.',
            'ERROR'
          );
        },
      });
  }

  // ========== Dialog Methods ==========
  private showUnsavedChangesDialog(): void {
    this.viewDialog(
      'You have unsaved changes. Do you want to discard them and exit new mode?',
      'Unsaved Changes',
      '450px',
      [
        {
          click: this.confirmDiscardAndExit.bind(this),
          buttonModel: { content: 'Yes', isPrimary: true }
        },
        {
          click: this.hideBtnClick.bind(this),
          buttonModel: { content: 'No' }
        }
      ]
    );
  }

  private confirmDiscardAndExit(): void {
    this.alertService.hideDialog();
    this.itemService.clearNewlyAddedRows();
    this.commonService.newlyAddedRows.set([]);
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    this.clearAllComponents(true);
    this.resetInitialValues();

    setTimeout(() => {
      this.autoSelectLastTransaction();
    }, 150);
  }

  private viewDialog(content: string, header: string, width: string, buttons: any[]): void {
    if (!this.dialogTarget) {
      console.error('Dialog target element not found');
      return;
    }

    this.alertService.showDialog(this.dialogTarget.nativeElement, {
      content: content || 'This is a custom alert dialog!',
      header: header || 'Alert',
      width: width || '400px',
      isModal: true,
      closeOnEscape: false,
      allowDragging: false,
      showCloseIcon: true,
      zIndex: 10000,
      buttons: buttons,
      overlayClick: () => { },
    });
  }

  private hideBtnClick(): void {
    this.alertService.hideDialog();
  }

  // ========== Event Handlers ==========
  handleInvoiceHeaderForm(event: any): any {
    const headerForm = event?.headerForm || event;
    const footerForm = event?.footerForm || {};
    return this.buildTransactionHeader(headerForm, footerForm);
  }

  handleSelectedItem(item: any): void {
    if (item && item.type) {
      switch (item.type) {
        case 'additionalDetails':
          this.handleAdditionalDetailsChange(item.data);
          break;
        case 'barcode':
          this.handleBarcodeClick();
          break;
        case 'grossAmountEdit':
          this.handleGrossAmountEditChange(item.data);
          break;
        case 'approve':
          this.handleApproveChange(item.data);
          break;
      }
    }
  }

  onTabChanged(tabIndex: number): void {
    this.selectedTab.set(tabIndex);
  }

  onGrossAmountEditChanged(event: any): void {
    if (typeof event === 'boolean') {
      this.handleGrossAmountEditChange(event);
    } else {
      const target = event?.target as HTMLInputElement;
      this.handleGrossAmountEditChange(target?.checked || false);
    }
  }

  onApproveChanged(event: any): void {
    if (typeof event === 'boolean') {
      this.handleApproveChange(event);
    } else {
      const target = event?.target as HTMLInputElement;
      this.handleApproveChange(target?.checked || false);
    }
  }

  onTabChangedEvent(event: any): void {
    if (typeof event === 'number') {
      this.onTabChanged(event);
    } else {
      this.onTabChanged(event?.selectedIndex ?? 1);
    }
  }

  onBarcodeClick(): void {
    // Barcode functionality placeholder
  }

  onGrossAmountEditChange(event: any): void {
    const target = event?.target as HTMLInputElement;
    this.isGrossAmountEditable = target?.checked || false;
  }

  onApproveChange(event: any): void {
    const target = event?.target as HTMLInputElement;
    this.isApproved = target?.checked || false;
  }

  handleAdditionalDetailsChange(data: any): void {
    // Additional details change handler
  }

  handleBarcodeClick(): void {
    // Open barcode scanner/input dialog
    const barcode = prompt('Enter or scan barcode:');
    if (barcode && barcode.trim()) {
      // Find item by barcode and add to grid
      this.addItemByBarcode(barcode.trim());
    }
  }

  private addItemByBarcode(barcode: string): void {
    const items = this.itemService.fillItemDataOptions();
    const item = items.find((i: any) => i.barCode === barcode);
    
    if (item) {
      // Add item to grid
      const currentData = this.commonService.tempItemFillDetails();
      const newItem = {
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        unit: item.unitname,
        qty: 1,
        rate: item.rate,
        amount: item.rate,
        taxValue: 0,
        totalAmount: item.rate,
        rowId: currentData.length + 1,
      };
      
      this.commonService.tempItemFillDetails.set([...currentData, newItem]);
      this.commonService.assignRowIds();
    } else {
      this.baseService.showCustomDialoguePopup(
        `Item with barcode "${barcode}" not found.`,
        'Barcode Not Found',
        'WARN'
      );
    }
  }

  handleGrossAmountEditChange(isEditable: boolean): void {
    this.isGrossAmountEditable = isEditable;
  }

  handleApproveChange(isApproved: boolean): void {
    this.isApproved = isApproved;
  }

  // ========== Payload Building Methods ==========
  private buildTransactionHeader(headerForm: any, footerForm: any): any {
    return {
      voucherNo: headerForm.voucherno,
      date: this.convertToISODate(headerForm.purchasedate),
      reference: headerForm.reference || null,
      references: [],
      party: this.extractCustomerInfo(headerForm.customer),
      currency: { id: 1, value: 'SAR' },
      exchangeRate: 1,
      project: this.extractProjectInfo(headerForm.project),
      description: headerForm.description || null,
      grossAmountEdit: this.invoiceHeader?.isgrossAmountEditable || false,
      fiTransactionAdditional: this.buildAdditionalInfo(headerForm, footerForm),
    };
  }

  private buildAdditionalInfo(headerForm: any, footerForm: any): any {
    const additionalForm = this.additionalDetailsRef?.additionalDetailsForm?.value || {};
    const transactionId = this.isNewMode() ? 0 : parseInt(String(this.selectedTransactionId() || 0));

    return {
      transactionId: transactionId,
      terms: footerForm.terms || null,
      warehouse: this.extractWarehouseInfo(headerForm.warehouse),
      partyInvoiceNo: this.coerceToString(additionalForm.partyInvoiceNo ?? additionalForm.invoiceno ?? headerForm.partyinvoiceno),
      partyDate: this.convertToISODate(additionalForm.partyInvoiceDate || additionalForm.invoicedate || headerForm.partyinvoicedate),
      orderDate: this.convertToISODate(additionalForm.orderdate),
      orderNo: additionalForm.orderno || null,
      partyNameandAddress: additionalForm.partyaddress || this.invoiceHeader?.address || null,
      expiryDate: this.convertToISODate(additionalForm.expirydate),
      transPortationType: this.extractIdValue(additionalForm.transportationtype),
      creditPeriod: additionalForm.creditperiod || null,
      salesMan: this.extractSalesmanInfo(additionalForm.salesman),
      salesArea: this.extractIdValue(additionalForm.salesarea),
      staffIncentives: additionalForm.staffincentive || null,
      mobileNo: additionalForm.mobilenumber || null,
      vehicleNo: this.extractVehicleInfo(additionalForm.vehicleno),
      attention: additionalForm.attention || null,
      despatchNo: additionalForm.dispatchno || null,
      despatchDate: this.convertToISODate(additionalForm.dispatchdate),
      deliveryDate: this.convertToISODate(additionalForm.deliverydate),
      deliveryNote: additionalForm.deliverynote || null,
      partyName: additionalForm.deliverypartyname || null,
      addressLine1: additionalForm.addressline1 || null,
      addressLine2: additionalForm.addressline2 || null,
      delivaryLocation: this.extractDeliveryLocationInfo(additionalForm.deliverylocation),
      termsOfDelivery: additionalForm.terms || null,
      payType: this.extractPayType(footerForm.paytype),
      approve: headerForm.approve || null,
      days: 0,
      closeVoucher: footerForm.closeVoucher ?? false,
      code: additionalForm.code || 'string',
      isHigherApproval: true,
      vatNo: headerForm.vatno || null,
    };
  }

  private buildTransactionItems(itemDetails: any[]): any[] {
    return itemDetails
      .filter((item) => item.itemCode?.trim())
      .map((item) => this.buildTransactionItem(item));
  }

  private buildTransactionItem(item: any): any {
    const mainTransactionId = parseInt(String(this.selectedTransactionId() || 0));
    
    // Determine transactionId for the item:
    // - New mode: always 0 (backend will assign transactionId after save)
    // - Edit mode:
    //   * Existing items: use item's transactionId (from database)
    //   * New items: use main transactionId (item added during edit)
    let itemTransactionId = 0;
    
    if (!this.isNewMode() && mainTransactionId > 0) {
      // Check if item has a valid transactionId (existing item from database)
      const existingTransactionId = item.transactionId;
      if (existingTransactionId !== null && 
          existingTransactionId !== undefined && 
          existingTransactionId !== '' && 
          existingTransactionId !== 0) {
        // Existing item - preserve its original transactionId
        itemTransactionId = parseInt(String(existingTransactionId));
      } else {
        // New item added in edit mode - assign main transactionId
        itemTransactionId = mainTransactionId;
      }
    }

    const unitInfo = this.buildUnitInfo(item);
    const qty = parseFloat(String(item.qty || 0));
    const rate = parseFloat(parseFloat(String(item.rate || 0)).toFixed(4));
    const discount = parseFloat(parseFloat(String(item.discount || 0)).toFixed(4));
    const taxPerc = parseFloat(String(item.taxPerc || 0));
    const grossAmt = parseFloat((qty * rate).toFixed(4));
    const amount = parseFloat((grossAmt - discount).toFixed(4));
    const taxValue = parseFloat(((amount * taxPerc) / 100).toFixed(4));
    const total = parseFloat((amount + taxValue).toFixed(4));
    const factor = unitInfo?.factor ?? 1;
    const basicQty = factor === 1 ? Math.round(qty) : parseInt(String(item.basicQty ?? item.qty ?? 0));

    return {
      transactionId: itemTransactionId,
      itemId: parseInt(String(item.itemId || item.id || 0)),
      itemCode: item.itemCode,
      itemName: item.itemName,
      location: item.location || '',
      batchNo: item.batchNo || '',
      unit: unitInfo,
      qty,
      focQty: parseInt(String(item.focQty || 0)),
      basicQty,
      additional: parseInt(String(item.additional || 0)),
      rate,
      otherRate: parseFloat(parseFloat(String(item.otherRate || 0)).toFixed(4)),
      margin: parseFloat(parseFloat(String(item.margin || 0)).toFixed(4)),
      rateDisc: parseFloat(parseFloat(String(item.rateDisc || 0)).toFixed(4)),
      grossAmt,
      discount,
      discountPerc: parseFloat(parseFloat(String(item.discountPerc || 0)).toFixed(4)),
      amount,
      taxValue,
      taxPerc,
      printedMRP: parseFloat(String(item.printedMRP || 0)),
      ptsRate: parseFloat(String(item.ptsRate || 0)),
      ptrRate: parseFloat(String(item.ptrRate || 0)),
      pcs: parseInt(String(item.pcs || 0)),
      stockItemId: parseInt(String(item.stockItemId || 0)),
      total,
      expiryDate: item.expiryDate || null,
      description: item.description || null,
      lengthFt: parseFloat(String(item.lengthFt || 0)),
      lengthIn: parseFloat(String(item.lengthIn || 0)),
      lengthCm: parseFloat(String(item.lengthCm || 0)),
      girthFt: parseFloat(String(item.girthFt || 0)),
      girthIn: parseFloat(String(item.girthIn || 0)),
      girthCm: parseFloat(String(item.girthCm || 0)),
      thicknessFt: parseFloat(String(item.thicknessFt || 0)),
      thicknessIn: parseFloat(String(item.thicknessIn || 0)),
      thicknessCm: parseFloat(String(item.thicknessCm || 0)),
      remarks: item.remarks || '',
      taxTypeId: parseInt(String(item.taxTypeId || 0)),
      taxAccountId: parseInt(String(item.taxAccountId || 0)),
      priceCategoryOptions: [],
      costAccountId: parseInt(String(item.costAccountId || 0)),
      brandId: parseInt(String(item.brandId || 0)),
      profit: parseFloat(String(item.profit || 0)),
      repairsRequired: item.repairsRequired || '',
      finishDate: item.finishDate || null,
      updateDate: item.updateDate || null,
      replaceQty: parseInt(String(item.replaceQty || 0)),
      printedRate: parseFloat(String(item.printedRate || 0)),
      hsn: item.hsn || '',
      avgCost: parseFloat(String(item.avgCost || 0)),
      isReturn: Boolean(item.isReturn ?? false),
      manufactureDate: item.manufactureDate || null,
      priceCategory: {
        id: item.priceCategory?.id ? parseInt(String(item.priceCategory.id)) : null,
        name: item.priceCategory?.name || '',
        code: item.priceCategory?.code || '',
        description: item.priceCategory?.description || '',
      },
      sizeMaster: {
        id: item.sizeMaster?.id ? parseInt(String(item.sizeMaster.id)) : null,
        name: item.sizeMaster?.name || '',
        code: item.sizeMaster?.code || '',
        description: item.sizeMaster?.description || '',
      },
      uniqueItems: this.buildUniqueItems(item.uniqueItems),
      unitsPopup: [],
      stockItem: item.stockItem || '',
      batchNoPopup: [],
    };
  }

  private buildTransactionEntries(footerForm: any, items: any[]): any {
    let taxEntries = (this.invoiceFooter?.taxSelected ?? []).map((entry: any) => ({
      taxid: parseInt(String(entry.taxid || entry.accountCode?.id || 944)),
      amount: parseFloat(String(entry.amount || 0)).toFixed(2),
      accountCode: entry.accountCode,
      discription: entry.discription || entry.description || '',
      payableAccount: entry.payableAccount || {}
    }));

    if (taxEntries.length === 0) {
      taxEntries = this.calculateTaxEntriesFromItems(items);
    }

    const formatAmount = (value: number): string => {
      return parseFloat(String(value || 0)).toFixed(2);
    };

    return {
      totalDisc: formatAmount(parseFloat(footerForm.discountamount) || 0),
      amt: formatAmount(parseFloat(this.calculateTotalGrossAmount(items))),
      roundoff: formatAmount(this.parseFloatOrZero(footerForm.roundoff)),
      netAmount: formatAmount(parseFloat(footerForm.netamount) || 0),
      grandTotal: formatAmount(parseFloat(footerForm.grandtotal) || 0),
      payType: this.extractPayType(footerForm.paytype),
      dueDate: footerForm.duedate ? new Date(footerForm.duedate).toISOString() : null,
      totalPaid: formatAmount(parseFloat(footerForm.totalpaid) || 0),
      balance: formatAmount(parseFloat(footerForm.balance) || 0),
      advance: [],
      cash: (this.invoiceFooter?.cashSelected ?? []).map((entry: any) => {
        // entry.id = transaction entry id (for updates); accountCode.id/accountId = account master id
        const accountMasterId = parseInt(String(entry.accountCode?.id ?? entry.accountId ?? 61));
        return {
          id: entry.id ?? 0,
          accountCode: {
            alias: entry.accountCode?.alias || '',
            name: entry.accountCode?.name || '',
            id: accountMasterId,
          },
        description: entry.description || '',
          amount: formatAmount(parseFloat(String(entry.amount || 0))),
        payableAccount: entry.payableAccount || {}
        };
      }),
      card: this.invoiceFooter?.cardSelected ?? [],
      cheque: this.invoiceFooter?.chequeSelected ?? [],
      tax: taxEntries,
      addCharges: this.invoiceFooter?.addChargesSelected ?? [],
    };
  }

  // ========== Data Extraction Helpers ==========
  private extractWarehouseInfo(warehouse: any): any {
    if (!warehouse) return {};

    if (typeof warehouse === 'number') {
      const matched = this.invoiceHeader?.warehouseData?.find((w) => w.id === warehouse);
      return matched
        ? { id: matched.id, value: matched.name || matched.value }
        : { id: warehouse, value: '' };
    }

    if (typeof warehouse === 'object') {
      return {
        id: warehouse.id,
        value: warehouse.value || warehouse.name,
      };
    }

    return {};
  }

  private extractCustomerInfo(customer: any): any {
    if (!customer) return {};

    if (typeof customer === 'object') {
      return {
        id: customer.id,
        name: customer.name || customer.accountName,
        code: customer.code || customer.accountCode,
        description: customer.description || ''
      };
    }

    const match = this.invoiceHeader?.customerData?.find(
      (c) => c.accountName === customer || c.id === customer
    );

    return match
      ? { id: match.id, name: match.accountName, code: match.accountCode, description: '' }
      : {};
  }

  private extractProjectInfo(project: any): any {
    if (!project) return {};

    if (typeof project === 'object') {
      return {
        id: project.id,
        name: project.name || project.projectcode,
        code: project.code || project.projectname,
        description: project.description || ''
      };
    }

    const match = this.invoiceHeader?.projectData?.find(
      (p) => p.projectname === project || p.id === project
    );

    return match
      ? { id: match.id, name: match.projectcode, code: match.projectname, description: '' }
      : {};
  }

  private extractPayType(paytype: any): any {
    if (!paytype) return null;

    // API expects payType.id as number and payType.value as string (e.g. "Credit" or "Cash")
    const rawValue = typeof paytype === 'object'
      ? (paytype.value ?? paytype.name ?? null)
      : paytype;
    const valueStr = rawValue != null ? String(rawValue) : null;

    // Resolve id: prefer paytype.id, or parse value when it looks like an id
    let id: number | null = typeof paytype === 'object' && paytype.id != null
      ? Number(paytype.id)
      : null;
    let value: string | null = valueStr;

    // If id is null but value looks like a numeric id, look up in payTypeObj for proper id + name
    const payTypeObj = this.invoiceFooter?.payTypeObj ?? [];
    if ((id == null || valueStr === String(id)) && payTypeObj.length > 0) {
      const numericVal = valueStr != null && /^\d+$/.test(valueStr) ? Number(valueStr) : NaN;
      const lookupId = Number.isFinite(id) ? id : (Number.isFinite(numericVal) ? numericVal : null);
      const matched = payTypeObj.find(
        (p: any) => p.id === lookupId || p.id == valueStr || String(p.id) === valueStr
      );
      if (matched) {
        id = Number(matched.id);
        value = matched.name ?? valueStr;
      } else if (Number.isFinite(numericVal)) {
        id = numericVal;
      }
    }

    return { id: Number.isFinite(id) ? id : null, value };
  }

  private extractIdValue(value: any): any {
    if (!value) return {};

    if (typeof value === 'object') {
      return {
        id: value.id || null,
        value: value.value || value.name || null,
      };
    }

    if (typeof value === 'number') {
      return { id: value, value: '' };
    }

    return {};
  }

  private extractSalesmanInfo(salesman: any): any {
    if (!salesman) return {};

    const additionalDetails = this.additionalDetailsRef;
    if (!additionalDetails) return {};

    const match = additionalDetails.salesmanData?.find(
      (s: any) => s.name === salesman || s.id === salesman
    );

    return match
      ? { id: match.id, name: match.name, code: match.code || '', description: '' }
      : {};
  }

  private extractVehicleInfo(vehicleNo: any): any {
    if (!vehicleNo) return {};

    const additionalDetails = this.additionalDetailsRef;
    if (!additionalDetails) return {};

    const match = additionalDetails.vehicleNoData?.find(
      (v: any) => v.vehicleNo === vehicleNo || v.id === vehicleNo
    );

    return match
      ? { id: match.id, name: match.name || '', code: match.vehicleNo || '', description: '' }
      : {};
  }

  private extractDeliveryLocationInfo(location: any): any {
    if (!location) return {};

    const additionalDetails = this.additionalDetailsRef;
    if (!additionalDetails) return {};

    const match = additionalDetails.deliveryLocationData?.find(
      (l: any) => l.locationname === location || l.id === location
    );

    return match
      ? { id: match.id, name: match.locationname || '', code: match.projectname || '', description: '' }
      : {};
  }

  // ========== Utility Methods ==========
  private coerceToString(value: any): string | null {
    if (value == null) return null;
    if (typeof value === 'object') return null;
    return String(value).trim() || null;
  }

  private convertToISODate(dateStr: string | Date | null | undefined): string | null {
    if (dateStr == null) return null;

    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? null : dateStr.toISOString();
    }

    if (typeof dateStr === 'string') {
      const s = dateStr.trim();
      if (!s) return null;
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toISOString();
      const parts = s.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const d2 = new Date(`${year}-${month}-${day}`);
        return isNaN(d2.getTime()) ? null : d2.toISOString();
      }
    }

    return null;
  }

  /** Normalize unit to { unit, basicunit, factor } - backend C# model expects lowercase "basicunit", not "basicUnit". */
  private buildUnitInfo(item: any): any {
    const u = item.unit;
    if (u && typeof u === 'object') {
      const unitStr = (u.unit ?? u).toString?.() ?? '';
      const basic = u.basicunit ?? u.basicUnit ?? unitStr;
      return {
        unit: unitStr,
        basicunit: typeof basic === 'string' ? basic : String(basic ?? ''),
        factor: u.factor != null ? parseFloat(String(u.factor)) : 1,
      };
    }
    const s = (u ?? '').toString();
    return { unit: s, basicunit: s, factor: 1 };
  }

  private buildUniqueItems(uniqueItems: any): any[] {
    if (!uniqueItems || !Array.isArray(uniqueItems) || uniqueItems.length === 0) {
      return [];
    }

    return uniqueItems.filter((entry: any) => {
      const uniqueNumber = entry?.uniqueNumber;
      return uniqueNumber &&
        typeof uniqueNumber === 'string' &&
        uniqueNumber.trim() !== '' &&
        uniqueNumber !== 'string';
    });
  }

  private calculateTaxEntriesFromItems(items: any[]): any[] {
    if (!items || items.length === 0) {
      return [];
    }

    const totalTax = items.reduce((sum, item) => sum + parseFloat(String(item.taxValue || 0)), 0);

    if (totalTax <= 0) {
      return [];
    }

    const taxMap = new Map<number, { taxAccountId: number; totalTax: number; taxTypeId: number }>();

    items.forEach((item) => {
      const taxValue = parseFloat(String(item.taxValue || 0));
      const taxAccountId = parseInt(String(item.taxAccountId || 0));
      const taxTypeId = parseInt(String(item.taxTypeId || 0));

      if (taxValue > 0) {
        const key = taxAccountId > 0 ? taxAccountId : 0;
        
        if (taxMap.has(key)) {
          const existing = taxMap.get(key)!;
          existing.totalTax += taxValue;
        } else {
          taxMap.set(key, {
            taxAccountId: taxAccountId > 0 ? taxAccountId : 944,
            totalTax: taxValue,
            taxTypeId,
          });
        }
      }
    });

    const taxEntries: any[] = [];
    taxMap.forEach((taxData) => {
      const accountId = taxData.taxAccountId > 0 ? taxData.taxAccountId : 944;
      taxEntries.push({
        taxid: accountId,
        accountCode: {
          alias: accountId === 944 ? '20099' : '',
          name: 'VAT Payable Account',
          id: accountId,
        },
        discription: '',
        amount: parseFloat(String(taxData.totalTax)).toFixed(2),
        payableAccount: {},
      });
    });

    return taxEntries;
  }

  private parseFloatOrZero(value: any): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private calculateTotalGrossAmount(items: any[]): string {
    return items
      .reduce((sum, item) => {
        const grossAmt = this.parseFloatOrZero(item.grossAmt);
        return sum + grossAmt;
      }, 0)
      .toFixed(4);
  }

  /**
   * Adjusts roundoff to ensure debit equals credit
   * This fixes cumulative rounding errors that occur during calculations
   * In accounting for sales invoice:
   * DEBIT side: Cash/Payment accounts = grandTotal
   * CREDIT side: Sales Account + Tax + Additional Charges + RoundOff
   */
  private adjustRoundoffForDebitCreditBalance(): void {
    const footerForm = this.invoiceFooter?.salesForm;
    if (!footerForm) return;

    const grandTotal = parseFloat(footerForm.get('grandtotal')?.value || 0);
    const netAmount = parseFloat(footerForm.get('netamount')?.value || 0);
    const taxTotal = parseFloat(footerForm.get('tax')?.value || 0);
    const addCharges = parseFloat(footerForm.get('addcharges')?.value || 0);
    const currentRoundoff = parseFloat(footerForm.get('roundoff')?.value || 0);

    // Calculate what the credit side would be WITHOUT roundoff
    const creditBeforeRoundoff = netAmount + taxTotal + addCharges;

    // The roundoff should be the difference to make debit = credit
    // grandTotal (Debit) = netAmount + taxTotal + addCharges + roundoff (Credit)
    // Therefore: roundoff = grandTotal - (netAmount + taxTotal + addCharges)
    const calculatedRoundoff = grandTotal - creditBeforeRoundoff;

    // Check if the calculated roundoff differs from current roundValue
    const difference = Math.abs(calculatedRoundoff - currentRoundoff);

    // Adjust roundoff to compensate for the discrepancy (only if difference is significant)
    if (difference > 0.0001) {
      const adjustedRoundoff = parseFloat(calculatedRoundoff.toFixed(4));
      footerForm.patchValue({ roundoff: adjustedRoundoff }, { emitEvent: false });
    }
  }

  // ========== Cash Assignment Methods ==========
  private settingCashAmountOnSave(): void {
    this.setDefaultAmounttoCash();
    
    const footerForm = this.invoiceFooter?.salesForm;
    if (footerForm) {
      const balanceAmount = parseFloat(footerForm.get('balance')?.value) || 0;
      const cardAmount = parseFloat(footerForm.get('card')?.value) || 0;
      const chequeAmount = parseFloat(footerForm.get('cheque')?.value) || 0;
      const advanceAmount = parseFloat(footerForm.get('advance')?.value) || 0;
      
      const totalPaid = cardAmount + balanceAmount + chequeAmount + advanceAmount;
      const balance = Math.abs(parseFloat(footerForm.get('grandtotal')?.value) || 0 - totalPaid);
      
      footerForm.patchValue({
        cash: balanceAmount,
        totalpaid: totalPaid,
        balance: balance
      }, { emitEvent: false });
    }
  }

  private setDefaultAmounttoCash(): void {
    if ((!this.defaultCashAccount || this.defaultCashAccount.length === 0) && this.invoiceFooter) {
      this.defaultCashAccount = this.invoiceFooter.defaultCashAccount || [];
    }

    if (this.defaultCashAccount && this.defaultCashAccount.length > 0) {
      const footerForm = this.invoiceFooter?.salesForm;
      if (footerForm) {
        const totalPaid = parseFloat(footerForm.get('totalpaid')?.value) || 0;
        const grandTotal = parseFloat(footerForm.get('grandtotal')?.value) || 0;
        const cashAmount = totalPaid > 0 ? totalPaid : grandTotal;
        
        if (cashAmount > 0) {
          const accountId = this.defaultCashAccount[0].id || 61;
          const cashEntry = {
            id: accountId,
            accountCode: {
              alias: this.defaultCashAccount[0].accountCode || this.defaultCashAccount[0].alias || '10004',
              name: this.defaultCashAccount[0].accountName || this.defaultCashAccount[0].name || 'Cash In Hand',
              id: accountId
            },
            description: "",
            amount: parseFloat(cashAmount.toFixed(4)),
            payableAccount: {}
          };
          
          if (this.invoiceFooter) {
            this.invoiceFooter.cashSelected = [cashEntry];
          }
        }
      }
    }
  }

  private ensureCashEntriesForCashPayment(grandTotal: number): void {
    const defaultCashAccount = this.invoiceFooter?.defaultCashAccount || this.defaultCashAccount || [];

    if (defaultCashAccount.length > 0 && grandTotal > 0) {
      const accountId = defaultCashAccount[0].id || 61;
      const cashEntry = {
        id: accountId,
        accountCode: {
          alias: defaultCashAccount[0].accountCode || defaultCashAccount[0].alias || '10004',
          name: defaultCashAccount[0].accountName || defaultCashAccount[0].name || 'Cash In Hand',
          id: accountId
        },
        description: "",
        amount: parseFloat(grandTotal.toFixed(4)),
        payableAccount: {}
      };

      if (this.invoiceFooter) {
        this.invoiceFooter.cashSelected = [cashEntry];
      }
    }
  }
}
