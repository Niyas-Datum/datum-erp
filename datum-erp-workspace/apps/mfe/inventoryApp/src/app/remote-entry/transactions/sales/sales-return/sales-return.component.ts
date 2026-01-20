/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @angular-eslint/prefer-inject */
import { Component, computed, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { EndpointConstant } from '@org/constants';
import { BaseService } from '@org/services';
import { BaseComponent } from '@org/architecture';
import { Subject, takeUntil, finalize } from 'rxjs';
import { InvoiceFooter } from '../../common/invoice-footer/invoice-footer';
import { InvoiceHeader } from '../../common/invoice-header/invoice-header';
import { ItemList } from '../../common/item-list/item-list';
import { AdditionalDetailsComponent } from '../../common/additional-details/additional-details.component';
import { CommonService } from '../../common/services/common.services';
import { ItemService } from '../../common/services/item.services';
import { SalesValidatorService } from '../../common/services/sales-validator.service';
import { TransactionService } from '../../common/services/transaction.services';
import { TabCommunicationService } from '../../common/services/tab-communication.service';
import { PdfGenerationService } from '../../common/services/pdfgeneration.service';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Type definitions for better type safety
interface SaveResponse {
  httpCode: number;
  data?: string;
  transactionId?: number;
}

type ComponentAction = 'new' | 'edit' | 'save' | 'delete' | 'print' | 'view';

@Component({
  selector: 'app-sales-return',
  templateUrl: './sales-return.component.html',
  styleUrl: './sales-return.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ItemList,
    InvoiceHeader,
    InvoiceFooter,
    AdditionalDetailsComponent,
  ],
})
export class SalesReturnComponent extends BaseComponent implements OnInit, OnDestroy {
  // Sales Return specific constants - CHANGE THESE VALUES
  private readonly SALES_RETURN_PAGE_ID = 150; // Change this to your sales return pageId
  private readonly SALES_RETURN_VOUCHER_ID = 24; // Change this to your sales return voucherId

  // Services
  private readonly transactionService = inject(TransactionService);
  private readonly baseService = inject(BaseService);
  private readonly itemService = inject(ItemService);
  private readonly commonService = inject(CommonService);
  private readonly salesValidator = inject(SalesValidatorService);
  private readonly pdfGenerationService = inject(PdfGenerationService);
  private readonly fb = inject(FormBuilder);
  private readonly tabCommunicationService = inject(TabCommunicationService);
  
  // Access BaseComponent services via serviceBase
  get dataSharingService() { return this.serviceBase.dataSharingService; }
  get alertService() { return this.serviceBase.alertService; }
  get formToolbarService() { return this.serviceBase.formToolbarService; }

  // View children
  @ViewChild(ItemList) itemList?: ItemList;
  @ViewChild(InvoiceHeader) invoiceHeader?: InvoiceHeader;
  @ViewChild(InvoiceFooter) invoiceFooter?: InvoiceFooter;
  @ViewChild('additionalDetailsRef') additionalDetailsRef?: AdditionalDetailsComponent;
  @ViewChild('dialogAlert') dialogTarget!: ElementRef;

  // State management
  private readonly destroySubscription = new Subject<void>();
  readonly isLoading = signal(false);
  readonly isNewMode = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedTransactionId = signal<number | null>(null);
  readonly selectedTab = signal(1); // 1 = Item Details, 2 = Additional Details
  
  // Sales data properties for modal workflow
  private lastSales: number = 0;
  private firstSales: number = 0;
  
  // Dynamic page info properties (using BaseComponent's currentPageInfo)
  private get currentPageId(): number | null {
    return this.currentPageInfo?.id ?? null;
  }
  private get currentVoucherId(): number | null {
    return this.currentPageInfo?.voucherID ?? null;
  }
  
  // Default cash settings for automatic cash assignment
  private isDefaultCash: boolean = false;
  private defaultCashAccount: any[] = [];

  // Form groups
  additionalDetailsForm!: FormGroup;

  // Initial form values for unsaved changes detection
  private initialHeaderValues: any = {};
  private initialFooterValues: any = {};

  // Computed properties for button states
  readonly isNewBtnDisabled = computed(() => this.isEditMode());
  readonly isEditBtnDisabled = computed(
    () => this.isNewMode() || !this.selectedTransactionId()
  );
  readonly isDeleteBtnDisabled = computed(
    () => this.isNewMode() || !this.selectedTransactionId()
  );
  readonly isSaveBtnDisabled = computed(() => !(this.isNewMode() || this.isEditMode()));
  readonly isPrintBtnDisabled = computed(() => this.isNewMode() || this.isEditMode());

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    
    // Additional initialization specific to SalesReturnComponent
    this.initializeComponent();
    this.subscribeToTransactionSelection();
    this.initializeServices();
    this.initializeAdditionalDetailsForm();
    this.subscribeToTabChanges();
  }

  ngOnDestroy(): void {
    this.destroySubscription.next();
    this.destroySubscription.complete();
  }

  // ========== LeftGrid Data Loading ==========

  /**
   * Override BaseComponent's LeftGridInit to load sales return data
   * This method fetches sales return transactions and configures the leftGrid display
   */
  override async LeftGridInit(): Promise<void> {
    this.pageheading = 'Sales Return Transactions';
    
    // Only proceed if we have valid pageId and voucherId from currentPageInfo
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }
    
    try {
      const response: any = await firstValueFrom(
        this.baseService.get(`${EndpointConstant.FILLALLPURCHASE}pageid=${this.currentPageId}&post=true`)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );
      
      const salesData = response?.data ?? [];
      
      // Configure leftGrid columns
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Sales Return Transactions',
          columns: [
                {
                  field: 'TransactionNo',
                  datacol: 'TransactionNo',
                  headerText: 'Voucher No',
                  textAlign: 'Left',
                  width: 120
                },
                {
                  field: 'Date',
                  datacol: 'Date',
                  headerText: 'Date',
                  textAlign: 'Center',
                  width: 120,
                  type: 'date',
                  format: 'dd/MM/yyyy'
                },
              ]
            }
          ];

      // Set leftGrid data
      this.leftGrid.leftGridData = salesData;

      // Store first and last sales IDs for auto-selection
      if (salesData.length > 0) {
        this.firstSales = parseInt(salesData[0]?.ID) || 0;
        this.lastSales = parseInt(salesData[salesData.length - 1]?.ID) || 0;
      }
    } catch (error: any) {
      console.error('Error fetching sales return data:', error);
      // Set empty data on error
      this.leftGrid.leftGridColumns = [];
      this.leftGrid.leftGridData = [];
    }
  }

  // ========== BaseComponent Method Overrides ==========

  /**
   * Override BaseComponent's newbuttonClicked to handle new button clicks
   */
  protected override newbuttonClicked(): void {
    this.onNewClick();
  }

  /**
   * Override BaseComponent's onEditClick to handle edit button clicks
   */
  protected override onEditClick(): void {
    this.onEditClickHandler();
  }

  /**
   * Override BaseComponent's SaveFormData to handle save operations
   */
  protected override SaveFormData(): void {
    this.onSaveClick();
  }

  /**
   * Override BaseComponent's DeleteData to handle delete operations
   */
  protected override DeleteData(data: any): void {
    if (data?.ID) {
      this.selectedTransactionId.set(data.ID);
      this.onDeleteClick();
    } else {
      this.onDeleteClick();
    }
  }

  /**
   * Override BaseComponent's getDataById to load transaction when selected from left grid
   */
  protected override getDataById(data: any): void {
    if (data?.ID) {
      this.selectedTransactionId.set(data.ID);
      this.loadTransactionDetails(data.ID);
    }
  }

  /**
   * Override BaseComponent's FormInitialize if needed
   */
  protected override FormInitialize(): void {
    // Form initialization is handled by child components (InvoiceHeader, ItemList, etc.)
    // This can be left empty or used for additional form setup if needed
  }

  // ========== Private Initialization Methods ==========

  private initializeComponent(): void {
    this.isNewMode.set(false);
      this.isEditMode.set(false);
    this.selectedTransactionId.set(null);
  }

  private initializeServices(): void {
    // Initialize services without triggering unwanted side effects
    this.commonService.initializeState();
    this.itemService.resetItemData();
    
    // Initialize default cash settings from invoice footer
    this.initializeDefaultCashSettings();
  }

  /**
   * Initialize default cash settings from invoice footer
   */
  private initializeDefaultCashSettings(): void {
    // Subscribe to invoice footer's default cash settings
    if (this.invoiceFooter) {
      this.isDefaultCash = this.invoiceFooter.isDefaultCash;
      this.defaultCashAccount = this.invoiceFooter.defaultCashAccount || [];
    }
  }

  // ========== Public Action Handlers ==========

  onNewClick(): void {
    if (this.isNewMode()) {
      // Check if there's unsaved data before exiting
      if (this.hasUnsavedData()) {
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
      } else {
        // No unsaved changes, just exit new mode
        this.exitNewMode();
      }
    } else {
      // Not in new mode, so enter it
      this.enterNewMode();
    }
  }

  private onEditClickHandler(): void {
    if (this.isEditMode()) {
      this.exitEditMode();
    } else {
      this.enterEditMode();
    }
  }

  onDeleteClick(): void {
    if (!this.selectedTransactionId()) {
      this.baseService.showCustomDialoguePopup('No transaction selected for deletion', 'WARN');
      return;
    }

    // Show confirmation dialog
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

onSaveClick(): void {
    if (!this.isNewMode() && !this.isEditMode()) return;

    const validationResult = this.validateTransaction();
    if (!validationResult.valid) {
      this.handleValidationError(validationResult);
    return;
  }

  // Check if paytype is cash and customer not paid amount and isdefault is true
  const footerForm = this.invoiceFooter?.salesForm?.value || {};
  const payType = footerForm.paytype;
  const balanceAmount = parseFloat(footerForm.balance) || 0;
  const cashAmount = parseFloat(footerForm.cash) || 0;

  if (payType && payType.name === 'Cash' && balanceAmount > 0 && cashAmount === 0) {
    if (!this.isDefaultCash) {
      if (confirm('Do you want to allocate the balance amount to default cash account?')) {
        this.settingCashAmountOnSave();
      } else {
        alert('Balance must be zero for cash type');
    return;
      }
    } else {
      this.settingCashAmountOnSave();
    }
  }

  const payload = this.collectTransactionData();
  this.performSave(payload);
}

  onPrintClick(): void {
    if (!this.selectedTransactionId()) {
      this.baseService.showCustomDialoguePopup('Please select a transaction to print', 'WARN');
      return;
    }

    // Show print confirmation dialog
    this.viewDialog(
      'Do you want to print this transaction?',
      'Print Confirmation',
      '400px',
      [
        { 
          click: this.confirmPrint.bind(this), 
          buttonModel: { content: 'Yes, Print', isPrimary: true } 
        },
        { 
          click: this.hideBtnClick.bind(this), 
          buttonModel: { content: 'Cancel' } 
        }
      ]
    );
  }

  // ========== Automatic Cash Assignment Methods ==========

  /**
   * Set cash amount on save - automatically assigns balance to default cash account
   */
  private settingCashAmountOnSave(): void {
    this.setDefaultAmounttoCash();
    
    // Update the footer form with the cash amount
    const footerForm = this.invoiceFooter?.salesForm;
    if (footerForm) {
      const balanceAmount = parseFloat(footerForm.get('balance')?.value) || 0;
      const cardAmount = parseFloat(footerForm.get('card')?.value) || 0;
      const chequeAmount = parseFloat(footerForm.get('cheque')?.value) || 0;
      const advanceAmount = parseFloat(footerForm.get('advance')?.value) || 0;
      
      // Calculate total paid amount
      const totalPaid = cardAmount + balanceAmount + chequeAmount + advanceAmount;
      const balance = Math.abs(parseFloat(footerForm.get('grandtotal')?.value) || 0 - totalPaid);
      
      // Update form values
      footerForm.patchValue({
        cash: balanceAmount,
        totalpaid: totalPaid,
        balance: balance
      });
      
      console.log('✅ Cash amount automatically assigned:', balanceAmount);
    }
  }

  /**
   * Set default amount to cash account
   */
  private setDefaultAmounttoCash(): void {
    if (this.defaultCashAccount && this.defaultCashAccount.length > 0) {
      const footerForm = this.invoiceFooter?.salesForm;
      if (footerForm) {
        const balanceAmount = parseFloat(footerForm.get('balance')?.value) || 0;
        
        // Push default cash account entry to cashSelected array
        const cashEntry = {
          id: this.defaultCashAccount[0].id,
          accountCode: {
            alias: this.defaultCashAccount[0].accountCode || this.defaultCashAccount[0].alias,
            name: this.defaultCashAccount[0].accountName || this.defaultCashAccount[0].name,
            id: this.defaultCashAccount[0].id
          },
          description: "",
          amount: balanceAmount.toString(),
          payableAccount: {}
        };
        
        // Update the invoice footer's cashSelected array
        if (this.invoiceFooter) {
          this.invoiceFooter.cashSelected = [cashEntry];
        }
        
        console.log('✅ Default cash account entry added:', cashEntry);
      }
    }
  }

  private subscribeToTransactionSelection(): void {
    this.dataSharingService.selectedSalesId$
      .pipe(takeUntil(this.destroySubscription))
      .subscribe((salesId) => {
        if (salesId && salesId !== this.selectedTransactionId()) {
    setTimeout(() => {
            this.selectedTransactionId.set(salesId);
            this.loadTransactionDetails(salesId);
    }, 0);
        }
      });
  }

  /**
   * Loads transaction details when a sales ID is selected from the left grid
   */
  private loadTransactionDetails(salesId: number): void {
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }

    this.isLoading.set(true);

    // Fetch transaction details by ID
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

  /**
   * Populates the form components with transaction data
   */
  private populateTransactionData(transactionData: any): void {
    
    // Reset to view mode
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    
    // Notify child components to load their data
    // The child components will subscribe to selectedSalesId$ and load their respective data
    this.dataSharingService.setSelectedSalesId(this.selectedTransactionId());
    
    // Additional data population can be added here if needed
    // For example, if you need to populate specific form fields directly
  }

  // ========== Mode Management Methods ==========

  private enterNewMode(): void {
    this.isNewMode.set(true);
    this.isEditMode.set(false);
    this.clearAllComponents(false);
    this.resetFormsForNewMode();
    this.commonService.newlyAddedRows.set([]);

    // Initialize grid for new mode
    setTimeout(() => {
      this.itemService.initializeGridForNewMode();
      // Capture initial values after forms are reset
      this.captureInitialValues();
    }, 100);
    
    this.notifyChildComponents('new');
  }

  private exitNewMode(): void {
    if (!this.confirmExitIfNewlyAddedRows('new mode')) return;

    this.itemService.clearNewlyAddedRows();
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    this.clearAllComponents(true);
    this.resetInitialValues();
    this.autoSelectLastTransaction();
    this.notifyChildComponents('view');
  }

  private enterEditMode(): void {
    if (!this.selectedTransactionId()) {
      return;
        }

    this.isEditMode.set(true);
        this.isNewMode.set(false);
    this.loadTransactionForEdit();
    this.notifyChildComponents('edit');
  }

  private exitEditMode(): void {
    if (!this.confirmExitIfNewlyAddedRows('edit mode')) return;

          this.itemService.clearNewlyAddedRows();
          this.isEditMode.set(false);
          this.isNewMode.set(false);
          this.clearAllComponents(true);
  }

  private confirmExitIfNewlyAddedRows(modeName: string): boolean {
    if (!this.itemService.hasNewlyAddedRows()) return true;

    const newlyAddedCount = this.itemService.getNewlyAddedRowsCount();
    const confirmMessage = `You have ${newlyAddedCount} newly added row(s) that will be deleted when exiting ${modeName}. Do you want to continue?`;

    return confirm(confirmMessage);
  }

  // ========== Component State Management ==========

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
    // Ensure we have sales data loaded
    setTimeout(() => {
      // Auto-select last sales using modal workflow
      this.dataSharingService.setSelectedSalesId(this.lastSales);
    }, 100); // Increased timeout to ensure grid is ready
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
    );
  }

  private handleValidationError(result: any): void {
    const message =
      result.firstError?.message ?? 'Validation failed. Please review the form.';

    this.baseService.showCustomDialoguePopup(message, 'WARN');
    console.warn('Validation errors:', result.errors);
  }

  // ========== Data Collection Methods ==========

  private collectTransactionData(): any {
    const headerForm = this.invoiceHeader?.salesForm?.value || {};
    const footerForm = this.invoiceFooter?.salesForm?.value || {};
    const itemDetails = this.commonService.tempItemFillDetails() || [];

    const payload = {
      id: this.selectedTransactionId() || 0,
      ...this.buildTransactionHeader(headerForm, footerForm),
      items: this.buildTransactionItems(itemDetails),
      transactionEntries: this.buildTransactionEntries(footerForm, itemDetails),
      cancelled: false,
    };
    
    return payload;
  }

  private buildTransactionHeader(headerForm: any, footerForm: any): any {
    return {
      voucherNo: headerForm.voucherno,
      date: this.convertToISODate(headerForm.purchasedate),
      reference: headerForm.reference || null,
      references: [],
      party: this.extractCustomerInfo(headerForm.customer),
      project: this.extractProjectInfo(headerForm.project),
      description: headerForm.description || null,
      currency: { id: 1, value: 'SAR' },
      exchangeRate: 1,
      grossAmountEdit: this.invoiceHeader?.isgrossAmountEditable || false,
      fiTransactionAdditional: this.buildAdditionalInfo(headerForm, footerForm),
    };
  }

  private buildAdditionalInfo(headerForm: any, footerForm: any): any {
    const additionalForm = this.additionalDetailsRef?.additionalDetailsForm?.value || {};
    
    return {
        transactionId: 0,
        terms: footerForm.terms || '',
        warehouse: this.extractWarehouseInfo(headerForm.warehouse),
        partyInvoiceNo: additionalForm.invoiceno || headerForm.partyinvoiceno || null,
        partyDate: this.convertToISODate(additionalForm.invoicedate || headerForm.partyinvoicedate),
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
        addressLine3: additionalForm.addressline3 || null,
        delivaryLocation: this.extractDeliveryLocationInfo(additionalForm.deliverylocation),
        termsOfDelivery: additionalForm.terms || null,
        payType: this.extractPayType(footerForm.paytype),
        approve: headerForm.approve || null,
        days: 0,
        closeVoucher: true,
        code: 'string',
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
    return {
        transactionId: this.isNewMode() ? 0 : (parseInt(String(item.transactionId || 0))),
        itemId: parseInt(String(item.itemId || item.id || 0)),
        itemCode: item.itemCode,
        itemName: item.itemName,
        location: item.location || '',
        batchNo: item.batchNo || '',
      unit: this.buildUnitInfo(item),
        qty: parseFloat(String(item.qty || 0)),
        focQty: parseInt(String(item.focQty || 0)),
        basicQty: parseInt(String(item.basicQty || 0)),
        additional: parseInt(String(item.additional || 0)),
        rate: parseFloat(String(item.rate || 0)),
        otherRate: parseFloat(String(item.otherRate || 0)),
        margin: parseFloat(String(item.margin || 0)),
        rateDisc: parseFloat(String(item.rateDisc || 0)),
      grossAmt: parseFloat(String(item.grossAmt || 0)),
      discount: parseFloat(String(item.discount || 0)),
        discountPerc: parseFloat(String(item.discountPerc || 0)),
      amount: parseFloat(String(item.amount || 0)),
      taxValue: parseFloat(String(item.taxValue || 0)),
        taxPerc: parseFloat(String(item.taxPerc || 0)),
        printedMRP: parseFloat(String(item.printedMRP || 0)),
        ptsRate: parseFloat(String(item.ptsRate || 0)),
        ptrRate: parseFloat(String(item.ptrRate || 0)),
        pcs: parseInt(String(item.pcs || 0)),
        stockItemId: parseInt(String(item.stockItemId || 0)),
      total: parseFloat(String(item.total || item.totalAmount || 0)),
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
        hsn: item.hsn || 'string',
        avgCost: parseFloat(String(item.avgCost || 0)),
        isReturn: Boolean(item.isReturn || true),
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
      uniqueItems: item.uniqueItems || [{ uniqueNumber: 'string' }],
        unitsPopup: [],
        stockItem: item.stockItem || '',
        batchNoPopup: [],
    };
  }

  private buildUnitInfo(item: any): any {
    if (item.unit && typeof item.unit === 'object') {
      return item.unit;
    }
    return {
      unit: item.unit || '',
      factor: 1,
      basicunit: item.unit || '',
    };
  }

  private buildTransactionEntries(footerForm: any, items: any[]): any {
    return {
      totalDisc: parseFloat(footerForm.discountamount) || 0,
      amt: parseFloat(this.calculateTotalGrossAmount(items)),
      roundoff: this.parseFloatOrZero(footerForm.roundoff),
      netAmount: parseFloat(footerForm.netamount) || 0,
      grandTotal: parseFloat(footerForm.grandtotal) || 0,
      payType: this.extractPayType(footerForm.paytype),
      dueDate: footerForm.duedate ? new Date(footerForm.duedate).toISOString() : null,
      totalPaid: parseFloat(footerForm.totalpaid) || 0,
      balance: parseFloat(footerForm.balance) || 0,
      advance: [],
      cash: (this.invoiceFooter?.cashSelected ?? []).map((entry: any) => ({
        id: parseInt(String(entry.id || entry.accountCode?.id || 61)),
          accountCode: entry.accountCode,
          description: entry.description || '',
        amount: parseFloat(String(entry.amount || 0)),
          payableAccount: entry.payableAccount || {}
      })),
      card: this.invoiceFooter?.cardSelected ?? [],
      cheque: this.invoiceFooter?.chequeSelected ?? [],
      tax: (this.invoiceFooter?.taxSelected ?? []).map((entry: any) => ({
        taxid: parseInt(String(entry.taxid || entry.accountCode?.id || 944)),
          accountCode: entry.accountCode,
          discription: entry.discription || entry.description || '',
        amount: parseFloat(String(entry.amount || 0)),
          payableAccount: entry.payableAccount || {}
      })),
      addCharges: this.invoiceFooter?.addChargesSelected ?? [],
    };
  }

  // ========== Data Extraction Helpers ==========

  private extractWarehouseInfo(warehouse: any): any {
    if (!warehouse) return {};

    if (typeof warehouse === 'number') {
      const matched = this.invoiceHeader?.warehouseData?.find(
        (w) => w.id === warehouse
      );
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

    if (typeof paytype === 'object') {
      return {
        id: paytype.id || null,
        value: paytype.value || paytype.name || null,
      };
    }

    return { id: null, value: paytype };
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

  private convertToISODate(dateStr: string | Date): string | null {
    if (!dateStr) return null;

    if (dateStr instanceof Date) {
      return dateStr.toISOString();
    }

    if (typeof dateStr === 'string') {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(`${year}-${month}-${day}`).toISOString();
      }
    }

    return null;
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

  // ========== Server Operations ==========

  private performSave(transactionData: any): void {
    // Use Sales Return specific pageId and voucherId
    const pageId = this.SALES_RETURN_PAGE_ID;
    const voucherId = this.SALES_RETURN_VOUCHER_ID;
    const endpoint = `${EndpointConstant.SAVESALES}${pageId}&voucherId=${voucherId}`;

    console.log('=== SAVE OPERATION DEBUG ===');
    console.log('Endpoint:', endpoint);
    console.log('PageId:', pageId, 'VoucherId:', voucherId);
    console.log('Transaction Data:', JSON.stringify(transactionData, null, 2));

    this.isLoading.set(true);

    this.transactionService
      .saveDetails(endpoint, transactionData)
      .pipe(
        takeUntil(this.destroySubscription),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: SaveResponse) => this.handleSaveSuccess(response),
        error: (err) => this.handleSaveError(err),
      });
  }

  private handleSaveSuccess(response: SaveResponse): void {
    if (response?.httpCode === 200) {
      // If we have a transactionId in the response, update our selected transaction ID
      if (response.transactionId && response.transactionId > 0) {
        this.selectedTransactionId.set(response.transactionId);
        this.dataSharingService.setSelectedSalesId(response.transactionId);
        
        // Load and display the saved transaction details
        setTimeout(() => {
          this.loadTransactionDetails(response.transactionId!);
        }, 500);
      }
      
      this.baseService.showCustomDialoguePopup(
        'Transaction saved successfully!',
        'SUCCESS'
      );
      
      // Reset form states but don't auto-select last transaction since we're loading the saved one
      this.isNewMode.set(false);
      this.isEditMode.set(false);
      this.commonService.newlyAddedRows.set([]);
    } else {
      this.baseService.showCustomDialoguePopup(
        response?.data || 'Save failed. Please try again.',
        'WARN'
      );
    }
  }

  private handleSaveError(err: any): void {
    console.error('Save failed', err);
    
    console.error('Error details:', {
      status: err?.status,
      statusText: err?.statusText,
      error: err?.error,
      message: err?.message,
      url: err?.url
    });
    
    if (err?.error?.data && err.error.data.includes('SqlException')) {
      console.error('SQL Exception detected:', err.error.data);
      
      this.baseService.showCustomDialoguePopup(
        `Database Error: ${err.error.data}. Please check the data being sent and try again.`,
        'Database Error',
        'ERROR'
      );
    } else {
      this.baseService.showCustomDialoguePopup(
        err?.error?.data || err?.message || 'Save failed. Please check console for details.',
        'Save Failed',
        'WARN'
      );
    }
  }

  /**
   * Confirms and executes delete operation
   */
  private confirmDelete(): void {
    this.alertService.hideDialog();
    
    if (!this.selectedTransactionId()) {
      console.error('Cannot delete: No transaction ID');
      return;
    }

    console.log('🗑️ Deleting transaction:', this.selectedTransactionId());
    this.performDelete();
  }

  /**
   * Performs the actual delete API call
   */
  private performDelete(): void {
    const transactionId = this.selectedTransactionId();
    const pageId = this.SALES_RETURN_PAGE_ID;
    const endpoint = `${EndpointConstant.DELETESALES}${transactionId}&pageId=${pageId}`;

    console.log('Delete API:', endpoint);

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
            
            console.log('✅ Transaction deleted successfully');
            
            // Reset state and return to initial view
            this.selectedTransactionId.set(null);
            this.isNewMode.set(false);
            this.isEditMode.set(false);
            
            // Refresh the sales list
            this.LeftGridInit();
            
            // Auto-select last transaction after deletion
            setTimeout(() => {
              this.autoSelectLastTransaction();
              this.notifyChildComponents('delete');
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

  private loadTransactionForEdit(): void {
    this.commonService.newlyAddedRows.set([]);
    
    if (!this.selectedTransactionId()) {
      console.warn('No transaction selected to load for edit');
      return;
    }

    // Trigger child components to load their data
    this.dataSharingService.setSelectedSalesId(this.selectedTransactionId());
    
    console.log('📝 Loading transaction for edit:', this.selectedTransactionId());
  }

  // ========== Component Communication ==========

  private notifyChildComponents(action: ComponentAction): void {
    // Add logic to notify children components
    console.log('Notifying children:', action);
  }

  handleInvoiceHeaderForm(formData: any): void {
    console.log('Invoice header form data:', formData);
  }

  handleSelectedItem(item: any): void {
    console.log('Selected item:', item);
    
    // Handle different types of events from the footer component
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
        default:
          console.log('Unknown event type:', item.type);
      }
    }
  }

  handleAdditionalDetailsChange(data: any): void {
    this.commonService.setAdditionalDetailsData(data);
  }

  handleBarcodeClick(): void {
    // Implement barcode scanning functionality
  }

  handleGrossAmountEditChange(isEditable: boolean): void {
    this.itemService.setGrossAmountEditable(isEditable);
  }

  handleApproveChange(isApproved: boolean): void {
    console.log('Approve changed:', isApproved);
    this.commonService.setApprovalStatus(isApproved);
  }

  // ========== Dialog and Confirmation Methods ==========

  /**
   * Checks if there are unsaved changes in the forms or items
   */
  private hasUnsavedData(): boolean {
    // Check if there are items in the grid (only count non-empty rows)
    const items = this.commonService.tempItemFillDetails();
    const nonEmptyItems = items.filter((item: any) => 
      item.itemCode && item.itemCode.trim() !== ''
    );
    
    if (nonEmptyItems && nonEmptyItems.length > 0) {
      console.log('Has unsaved data: items found', nonEmptyItems.length);
      return true;
    }

    // Check for newly added rows
    if (this.itemService.hasNewlyAddedRows()) {
      console.log('Has unsaved data: newly added rows');
      return true;
    }

    // Check header form changes
    if (this.invoiceHeader?.salesForm) {
      const currentHeader = this.invoiceHeader.salesForm.getRawValue();
      
      if (!this.initialHeaderValues || Object.keys(this.initialHeaderValues).length === 0) {
        return false;
      }
      
      const hasHeaderChanges = Object.keys(currentHeader).some(
        key => {
          const current = currentHeader[key];
          const initial = this.initialHeaderValues[key];
          
          if ((current === null || current === undefined || current === '') && 
              (initial === null || initial === undefined || initial === '')) {
            return false;
          }
          
          return current !== initial;
        }
      );
      
      if (hasHeaderChanges) {
        console.log('Has unsaved data: header form changes');
        return true;
      }
    }

    // Check footer form changes
    if (this.invoiceFooter?.salesForm) {
      const currentFooter = this.invoiceFooter.salesForm.getRawValue();
      
      if (!this.initialFooterValues || Object.keys(this.initialFooterValues).length === 0) {
        return false;
      }
      
      const hasFooterChanges = Object.keys(currentFooter).some(
        key => {
          const current = currentFooter[key];
          const initial = this.initialFooterValues[key];
          
          if ((current === null || current === undefined || current === '') && 
              (initial === null || initial === undefined || initial === '')) {
            return false;
          }
          
          return current !== initial;
        }
      );
      
      if (hasFooterChanges) {
        console.log('Has unsaved data: footer form changes');
        return true;
      }
    }

    console.log('No unsaved data detected');
    return false;
  }

  /**
   * Captures initial form values for comparison
   */
  private captureInitialValues(): void {
    setTimeout(() => {
      if (this.invoiceHeader?.salesForm) {
        this.initialHeaderValues = this.invoiceHeader.salesForm.getRawValue();
        console.log('Captured initial header values:', this.initialHeaderValues);
      }
      if (this.invoiceFooter?.salesForm) {
        this.initialFooterValues = this.invoiceFooter.salesForm.getRawValue();
        console.log('Captured initial footer values:', this.initialFooterValues);
      }
    }, 150);
  }

  /**
   * Resets initial form values
   */
  private resetInitialValues(): void {
    this.initialHeaderValues = {};
    this.initialFooterValues = {};
    console.log('Reset initial values');
  }

  /**
   * Opens a custom Syncfusion modal dialog
   */
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
      overlayClick: () => { /* block outside click */ },
    });
  }

  /**
   * Hides the current dialog
   */
  private hideBtnClick(): void {
    this.alertService.hideDialog();
  }

  /**
   * Confirms discarding changes and exits to view mode
   */
  private confirmDiscardAndExit(): void {
    this.alertService.hideDialog();
    
    console.log('🔄 Exiting new mode and returning to view mode...');
    
    this.itemService.clearNewlyAddedRows();
    this.commonService.newlyAddedRows.set([]);
    
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    
    this.clearAllComponents(true);
    this.resetInitialValues();
    
    setTimeout(() => {
      this.autoSelectLastTransaction();
      this.notifyChildComponents('view');
      console.log('✅ Returned to view mode - showing last transaction');
    }, 150);
  }

  /**
   * Confirms and executes print
   */
  private confirmPrint(): void {
    this.alertService.hideDialog();
    
    const transactionId = this.selectedTransactionId() ?? undefined;
    const pageId = this.SALES_RETURN_PAGE_ID;
    const address = this.invoiceHeader?.address;

    this.pdfGenerationService.generatePdf(
      transactionId,
      pageId,
      'print',
      address,
      false,
      false
    );
  }

  private initializeAdditionalDetailsForm(): void {
    this.additionalDetailsForm = this.fb.group({
      partyInvoiceNo: [''],
      partyInvoiceDate: [''],
      orderNo: [''],
      orderDate: [''],
      partyName: [''],
      partyAddress: [''],
      expiryDate: [''],
      transportationType: [''],
      creditPeriod: [''],
      salesman: [''],
      salesArea: [''],
      staffIncentive: [''],
      mobileNumber: [''],
      vehicleno: [''],
      attention: [''],
      deliveryNote: [''],
      dispatchDetails: [''],
      deliveryPartyName: [''],
      deliveryAddress1: [''],
      deliveryAddress2: [''],
      deliveryAddress3: [''],
      deliverylocation: [''],
      terms: ['']
    });
  }

  private subscribeToTabChanges(): void {
    this.tabCommunicationService.selectedTab$
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (tabIndex: number) => {
          this.selectedTab.set(tabIndex);
        },
        error: (error: any) => {
          console.error('Error in tab change subscription:', error);
        }
      });
  }

  onTabChanged(tabIndex: number): void {
    this.selectedTab.set(tabIndex);
  }

  // Wrapper methods for template event handling
  onTabChangedEvent(event: any): void {
    this.onTabChanged(event as number);
  }

  onGrossAmountEditChanged(event: any): void {
    this.handleGrossAmountEditChange(event as boolean);
  }

  onApproveChanged(event: any): void {
    this.handleApproveChange(event as boolean);
  }
}
