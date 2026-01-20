import { Component, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseService } from '@org/services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BaseComponent } from '@org/architecture';
import { InventoryAppService } from '../../../http/inventory-app.service';
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
import { Subject, takeUntil, finalize } from 'rxjs';

interface SaveResponse {
  httpCode: number;
  data?: string;
  transactionId?: number;
}

type ComponentAction = 'new' | 'edit' | 'save' | 'delete' | 'print' | 'view';

@Component({
  selector: 'app-purchase-enquiry-component',
  standalone: true,
  templateUrl: './purchase-enquiry-component.html',
  styleUrl: './purchase-enquiry-component.css',
  imports: [CommonModule, InvoiceHeader, ItemList,
    TabModule,
    AdditionalDetailsComponent,
    InvoiceFooter
  ],
})

export class PurchaseEnquiryComponent extends BaseComponent implements OnInit, OnDestroy {

  // local variables
  readonly isNewMode = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedTransactionId = signal<number | null>(null);
  readonly selectedTab = signal(1); // 1 = Item Details, 2 = Additional Details
  readonly isLoading = signal(false);

  @ViewChild(InvoiceHeader) invoiceHeader?: InvoiceHeader;
  @ViewChild(InvoiceFooter) invoiceFooter?: InvoiceFooter;
  @ViewChild(ItemList) itemList?: ItemList;
  @ViewChild('additionalDetailsRef') additionalDetailsRef?: AdditionalDetailsComponent;
  @ViewChild('dialogAlert') dialogTarget!: ElementRef;
  
  // ARCH DESIGN SECTION
  private httpService = inject(InventoryAppService); // service inject
  private baseService = inject(BaseService);
  private commonService = inject(CommonService);
  private itemService = inject(ItemService);
  private transactionService = inject(TransactionService);
  private salesValidator = inject(SalesValidatorService);
  private readonly destroySubscription = new Subject<void>();
  costCategoryForm = this.formUtil.thisForm;  // form creation method
  pageId = 0;
  route = inject(ActivatedRoute);
  
  // Purchase data properties for modal workflow
  private lastPurchase: number = 0;
  private firstPurchase: number = 0;
  
  // Dynamic page info properties (using BaseComponent's currentPageInfo)
  // pageId and voucherId are automatically retrieved from currentPageInfo
  private get currentPageId(): number | null {
    return this.currentPageInfo?.id ?? null;
  }
  private get currentVoucherId(): number | null {
    return this.currentPageInfo?.voucherID ?? null;
  }
  
  // Access BaseComponent services via serviceBase
  get dataSharingService() { return this.serviceBase.dataSharingService; }
  get alertService() { return this.serviceBase.alertService; }
  get formToolbarService() { return this.serviceBase.formToolbarService; }
  
  // Initial form values for unsaved changes detection
  private initialHeaderValues: any = {};
  private initialFooterValues: any = {};
  
  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.initializeComponent();
    this.subscribeToTransactionSelection();
    this.initializeServices();
  }

  ngOnDestroy(): void {
    this.destroySubscription.next();
    this.destroySubscription.complete();
  }

  override async LeftGridInit(): Promise<void> {
    this.pageheading = 'Purchase Enquiry';
    
    // Only proceed if we have valid pageId and voucherId from currentPageInfo
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }
    
    try {
      const response: any = await firstValueFrom(
        this.baseService.get(`${EndpointConstant.FILLALLPURCHASE}pageid=${this.currentPageId}&post=true`)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      const purchaseData = response?.data ?? [];

      // Configure leftGrid columns
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Purchase Enquiry`s',
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
              headerText: 'Supplier',
              textAlign: 'Left',
              width: 150
            },
          ]
        }
      ];

      // Set leftGrid data
      this.leftGrid.leftGridData = purchaseData;

      // Store first and last purchase IDs for auto-selection
      if (purchaseData.length > 0) {
        this.firstPurchase = parseInt(purchaseData[0]?.ID) || 0;
        this.lastPurchase = parseInt(purchaseData[purchaseData.length - 1]?.ID) || 0;
      }
    } catch (error: any) {
      console.error('Error fetching Purchase Enquiry data:', error);
      // Set empty data on error
      this.leftGrid.leftGridColumns = [];
      this.leftGrid.leftGridData = [];
    }
  }

  // Copy all other methods from SalesInvoiceComponent - they are the same
  // For brevity, I'll reference the sales-invoice component for implementation details
  // All methods below are identical except references to 'sales' are changed to 'purchase'

  handleInvoiceHeaderForm(event: any): any {
    const headerForm = event?.headerForm || event;
    const footerForm = event?.footerForm || {};
    
    return this.buildTransactionHeader(headerForm, footerForm);
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

  handleBarcodeClick(): void {
    // Implement barcode scanning functionality
  }

  handleGrossAmountEditChange(isEditable: boolean): void {
    // Update the item list to allow/disallow gross amount editing
  }

  handleApproveChange(isApproved: boolean): void {
    console.log('Approve changed:', isApproved);
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

  handleAdditionalDetailsChange(data: any): void {
    // Store additional details data for saving
  }

  onBarcodeClick(): void {
    console.log('Barcode button clicked');
  }
  
  isGrossAmountEditable = false;
  onGrossAmountEditChange(event: any): void {
    const target = event?.target as HTMLInputElement;
    this.isGrossAmountEditable = target?.checked || false;
  }
  
  isApproved = false;
  partyBalance = 0;

  onApproveChange(event: any): void {
    const target = event?.target as HTMLInputElement;
    this.isApproved = target?.checked || false;
  }

  handleSelectedItem(item: any): void {
    console.log('Selected item:', item);

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
        return true;
      }
    }

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
        return true;
      }
    }

    return false;
  }

  captureInitialValues(): void {
    setTimeout(() => {
      if (this.invoiceHeader?.salesForm) {
        this.initialHeaderValues = this.invoiceHeader.salesForm.getRawValue();
      }
      if (this.invoiceFooter?.salesForm) {
        this.initialFooterValues = this.invoiceFooter.salesForm.getRawValue();
      }
    }, 150);
  }

  resetInitialValues(): void {
    this.initialHeaderValues = {};
    this.initialFooterValues = {};
  }

  private initializeComponent(): void {
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    this.selectedTransactionId.set(null);
  }

  private initializeServices(): void {
    this.commonService.initializeState();
    this.itemService.resetItemData();
  }

  private subscribeToTransactionSelection(): void {
    this.dataSharingService.selectedSalesId$
      .pipe(takeUntil(this.destroySubscription))
      .subscribe((purchaseId) => {
        if (purchaseId && purchaseId !== this.selectedTransactionId()) {
          setTimeout(() => {
            this.selectedTransactionId.set(purchaseId);
            this.loadTransactionDetails(purchaseId);
          }, 0);
        }
      });
  }

  private loadTransactionDetails(purchaseId: number): void {
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }

    this.isLoading.set(true);

    const endpoint = `${EndpointConstant.FILLTRANSACTIONDETAILSBYID}${purchaseId}`;
    
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
  }

  private enterNewMode(): void {
    this.isNewMode.set(true);
    this.isEditMode.set(false);
    this.clearAllComponents(false);
    this.resetFormsForNewMode();
    this.commonService.newlyAddedRows.set([]);

    setTimeout(() => {
      this.itemService.initializeGridForNewMode();
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
      this.dataSharingService.setSelectedSalesId(this.lastPurchase);
    }, 100);
  }

  private loadTransactionForEdit(): void {
    this.commonService.newlyAddedRows.set([]);
    
    if (!this.selectedTransactionId()) {
      return;
    }

    this.dataSharingService.setSelectedSalesId(this.selectedTransactionId());
  }

  private notifyChildComponents(action: ComponentAction): void {
    console.log('Notifying children:', action);
  }

  protected override newbuttonClicked(): void {
    this.onNewClick();
  }

  protected override onEditClick(): void {
    this.onEditClickHandler();
  }

  protected override FormInitialize(): void {
    this.captureInitialValues();
    
    if (this.invoiceHeader?.salesForm) {
      this.invoiceHeader.salesForm.markAsPristine();
    }
    
    if (this.invoiceFooter?.salesForm) {
      this.invoiceFooter.salesForm.markAsPristine();
    }
    
    console.log('FormInitialize completed for PurchaseEnquiryComponent');
  }

  protected override SaveFormData(): void {
    this.onSaveClick();
  }

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
  }

  onSaveClick(): void {
    if (!this.isNewMode() && !this.isEditMode()) return;

    const validationResult = this.validateTransaction();
    if (!validationResult.valid) {
      this.handleValidationError(validationResult);
      return;
    }

    const payload = this.collectTransactionData();
    this.performSave(payload);
  }

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
      isReturn: Boolean(item.isReturn || false),
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

  private performSave(transactionData: any): void {
    // Use dynamic pageId and voucherId from currentPageInfo
    const pageId = this.currentPageId ?? this.invoiceHeader?.pageId ?? 149;
    const voucherId = this.currentVoucherId ?? this.invoiceHeader?.voucherNo ?? 23;
    const endpoint = `${EndpointConstant.SAVESALES}${pageId}&voucherId=${voucherId}`;

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
      if (response.transactionId && response.transactionId > 0) {
        this.selectedTransactionId.set(response.transactionId);
        this.dataSharingService.setSelectedSalesId(response.transactionId);
        
        setTimeout(() => {
          this.loadTransactionDetails(response.transactionId!);
        }, 500);
      }
      
      this.baseService.showCustomDialoguePopup(
        'Transaction saved successfully!',
        'SUCCESS'
      );
      
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
    this.baseService.showCustomDialoguePopup(
      err?.error?.data || err?.message || 'Save failed. Please check console for details.',
      'Save Failed',
      'WARN'
    );
  }

  protected override DeleteData(data: any): void {
    if (data?.ID) {
      this.selectedTransactionId.set(data.ID);
      this.onDeleteClick();
    } else {
      this.onDeleteClick();
    }
  }

  protected override getDataById(data: any): void {
    if (data?.ID) {
      this.selectedTransactionId.set(data.ID);
      this.loadTransactionDetails(data.ID);
    }
  }

  onNewClick(): void {
    if (this.isNewMode()) {
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
        this.exitNewMode();
      }
    } else {
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
      return;
    }

    this.performDelete();
  }

  private performDelete(): void {
    const transactionId = this.selectedTransactionId();
    const pageId = this.currentPageId ?? this.invoiceHeader?.pageId ?? 149;
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
              this.notifyChildComponents('delete');
            }, 300);
          } else {
            this.baseService.showCustomDialoguePopup(
              response.data || 'Failed to delete transaction',
              'ERROR'
            );
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
      this.notifyChildComponents('view');
    }, 150);
  }

  private viewDialog(content: string, header: string, width: string, buttons: any[]): void {
    if (!this.dialogTarget) {
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

  private hideBtnClick(): void {
    this.alertService.hideDialog();
  }

}

