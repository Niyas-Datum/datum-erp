/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PopupService } from '@org/ui';
import { TransactionService } from '../services/transaction.services';
import { EndpointConstant } from '@org/constants';
import { ItemService } from '../services/item.services';

import {
  Customer,
  Projects,
  Salesman,
  Warehouse,
  Reference,
  VoucherType,
  Supplier,
} from '../interface/transactions.interface';
import { DataSharingService, BaseService } from '@org/services';

import { TransactionsComponent } from '../../transactions-component';
import { CommonService } from '../services/common.services';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { BasetransactionComponent } from '../../architecture/transactionComponent.base';
import { InventoryPopupService } from '../../../common/popupModule/inventory.popup.service';

// Type definitions
interface GridSettings {
  allowEditing: boolean;
  allowAdding: boolean;
  allowDeleting: boolean;
}

interface CommonFillData {
  costCentre?: any[];
  wareHouse?: any[];
  vNo?: {
    code: string;
    result: string;
  };
}

interface CustomerResponse {
  data?: {
    customerData: any[];
    prevPayType?: any;
  };
}

type PopupType = 'customer' | 'project' | 'salesman';

@Component({
  selector: 'app-invoice-header',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextBoxModule,
    DropDownListModule,
    DatePickerModule,
    ButtonModule,
  ],
  templateUrl: './invoice-header.html',
  styleUrls: ['./invoice-header.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InvoiceHeader extends BasetransactionComponent implements OnInit, OnDestroy {
  // Services
  private readonly transactionService = inject(TransactionService);
  private readonly transactionsComponent = inject(TransactionsComponent);
  private readonly dataSharingService = inject(DataSharingService);
  private readonly baseService = inject(BaseService);
  public readonly commonService = inject(CommonService);
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);
  private readonly popupService = inject(InventoryPopupService);

  // Outputs
  @Output() formSubmitted = new EventEmitter<any>();
  @Output() popupSelect = new EventEmitter<any>();

  // Input signals
  readonly isNewMode = input(false);
  readonly isEditMode = input(false);

  // Form
  salesForm!: FormGroup;

  // State Management
  private readonly destroy$ = new Subject<void>();
  readonly today = new Date();

  // Popup State
  isPopuprefVisible = false;
  currentPopupType: PopupType | '' = '';
  popuprefData: any = {};
  gridSettings: GridSettings = {
    allowEditing: false,
    allowAdding: false,
    allowDeleting: false,
  };
  private isComponentInitialized = false;
  private isUserInteraction = false;
  private isSettingDefaultValues = false;
  
  // Reference Data
  importedReferenceList: any[] = [];
  referenceListarray: any[] = [];
  isReferenceImported = false;

  // Data Collections
  projectData: Projects[] = [];
  customerData: Customer[] = [];
  warehouseData: Warehouse[] = [];
  salesmanData: Salesman[] = [];
  partyData: Supplier[] = [];
  referenceFillData: Reference[] = [];
  voucherTypeData: VoucherType[] = [];
  commonFillData: CommonFillData = {};

  // Transaction State
  selectedSalesId: number | null = null;
  currentSales: any;
  selectedPartyId: string | number = 12230;
  defaultCustomer = 0;
  updatedCustomer = '';
  selectedCustomerObj: any = {};

  // UI State
  address = '';
  partyBalance = '';
  voucherName = '';
  formVoucherNo: any = 0;
  isInputDisabled = false;
  isMobile = false;
  isFormDirty = false;
  grossAmountEditSettings = false;
  isgrossAmountEditable = false;
  prevPayType: any;

  // Constants
  readonly partyId: string | number = 12230;
  readonly locId = 1;
  readonly voucherNo = 23;
  readonly pageId = 149;

  // Computed signals
  readonly currentMode = computed(() => {
    if (this.isNewMode()) return 'New Mode';
    if (this.isEditMode()) return 'Edit Mode';
    return 'View Mode';
  });

  readonly editSettings = computed(() => ({
    allowEditing: this.isNewMode() || this.isEditMode(),
    allowAdding: this.isNewMode() || this.isEditMode(),
    allowDeleting: this.isNewMode() || this.isEditMode(),
    mode: 'Batch' as const,
    newRowPosition: 'bottom' as const,
    showEdit: false,
    showDeleteConfirmDialog: false,
    showAddConfirmDialog: false,
    showSaveConfirmDialog: false,
    showConfirmDialog: false,
  }));

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== Initialization Methods ==========

  private initializeComponent(): void {
    this.initForm();
    this.setupFormValueChanges();
    this.subscribeToTransactionSelection();
    this.loadInitialData();
    // Mark component as initialized after a delay to prevent popup on load
    setTimeout(() => {
      this.isComponentInitialized = true;
    }, 1000);
    
    // Track user interactions to distinguish from programmatic focus
    document.addEventListener('click', () => {
      this.isUserInteraction = true;
    }, { once: true, capture: true });
    
    document.addEventListener('keydown', () => {
      this.isUserInteraction = true;
    }, { once: true, capture: true });
  }

  private initForm(): void {
    this.salesForm = this.fb.group({
      vouchername: [''],
      voucherno: [''],
      partyinvoiceno: [''],
      partyinvoicedate: [''],
      purchasedate: [''],
      reference: [''],
      warehouse: [''],
      vatno: [''],
      description: [''],
      project: [''],
      customer: [''],
      salesman: [''],
    });
  }

  private setupFormValueChanges(): void {
    
    this.salesForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const transformedValue = this.transformFormValue(value);
        this.formSubmitted.emit(transformedValue);
      });
  }

  private subscribeToTransactionSelection(): void {
    this.dataSharingService.selectedSalesId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((salesId) => {
        this.selectedSalesId = salesId ?? null;
        if (this.selectedSalesId) {
          this.fetchTransactionById();
        } else {
          this.clearForm();
        }
      });
  }

  private loadInitialData(): void {
    this.fetchCommonFillData();
    this.fetchCustomer();
    this.fetchVoucherType();
    this.fetchReferenceData();
    this.fetchParty();
  }

  // ========== Data Fetching Methods ==========

  private fetchCustomer(): void {
    const endpoint = this.buildCustomerEndpoint();

    this.transactionService
      .getDetails(endpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CustomerResponse) => this.handleCustomerResponse(response),
        error: (error) => this.handleError('Error loading customers', error),
      });
  }

  private fetchCommonFillData(): void {
    const endpoint = `${EndpointConstant.FILLCOMMONPURCHASEDATA}${this.pageId}&voucherId=${this.voucherNo}`;

    this.transactionService
      .getDetails(endpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleCommonFillResponse(response),
        error: (error) => this.handleError('Error loading common fill data', error),
      });
  }

  private fetchTransactionById(): void {
    if (!this.selectedSalesId) return;

    this.transactionService
      .getDetails(
        `${EndpointConstant.FILLPURCHASEBYID}${this.selectedSalesId}&pageId=${this.pageId}`
      )
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.currentSales = response?.data;
          const transactionData = response?.data?.transaction?.fillTransactions;
          
          if (transactionData) {
            this.bindTransactionData(transactionData);
          }
        },
        error: (error) => this.handleError('Error loading header transaction data', error),
      });
  }

  private fetchReferenceData(): void {
    this.transactionService
      .getDetails(`${EndpointConstant.FILLREFERENCEDATA}${this.voucherNo}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.referenceFillData = response?.data || [];
        },
        error: (error) => this.handleError('Error loading reference data', error),
      });
  }

  fetchVoucherType(): void {
    this.transactionService
      .getDetails(`${EndpointConstant.FILLPURCHASEVOUCHERTYPE}${this.voucherNo}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.voucherTypeData = response?.data || [];
        },
        error: (error) => this.handleError('Error loading voucher type', error),
      });
  }

  fetchParty(): void {
    const endpoint = `${EndpointConstant.FILLPURCHASEPARTY}&voucherId=${this.voucherNo}&pageId=${this.pageId}`;

    this.transactionService
      .getDetails(endpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.partyData = this.mapPartyData(response?.data?.customerData || []);
          this.fetchDefaultCustomer();
        },
        error: (error) => this.handleError('Error loading party data', error),
      });
  }

  fetchDefaultCustomer(): void {
    this.transactionService
      .getDetails(EndpointConstant.FETCHDEFAULTCUSTOMER)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          if (Array.isArray(responseData) && responseData.length > 0) {
            this.defaultCustomer = responseData[0].accountID;
            this.onCustomerSelected(responseData[0].accountID, false);
          }
        },
        error: (error) => this.handleError('Error loading default customer', error),
      });
  }

  fetchPartyBalance(): void {
    if (!this.selectedPartyId) return;

    const endpoint = `${EndpointConstant.FETCHPARTYBALANCE}${this.selectedPartyId}`;

    this.transactionService
      .getDetails(endpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const result = response?.data;
          this.partyBalance =
            result && result.length > 0
              ? this.baseService.formatInput(result[0].stock)
              : '';
        },
        error: (error) => {
          this.handleError('Error fetching party balance', error);
          this.partyBalance = '';
        },
      });
  }

  // ========== Response Handlers ==========

  private handleCustomerResponse(response: CustomerResponse): void {
    const responseData = response?.data?.customerData;

    if (!responseData) {
      return;
    }

    this.customerData = this.mapCustomerData(responseData);
    this.setDefaultCustomer();
    this.setDefaultSalesman(responseData);
    this.prevPayType = response?.data?.prevPayType;

    if (!this.isMobile && responseData.length > 0) {
      this.address = responseData[0]?.address || '';
    }
  }

  private handleCommonFillResponse(response: any): void {
    this.commonFillData = response?.data || {};

    this.projectData = this.mapProjectData(this.commonFillData.costCentre || []);
    this.warehouseData = this.mapWarehouseData(this.commonFillData.wareHouse || []);


    // Set default warehouse after data is mapped
    this.setDefaultWarehouse();
    this.setVoucherData();
    
    // If we have a selected transaction, ensure warehouse is properly bound
    if (this.selectedSalesId) {
      setTimeout(() => {
        this.ensureWarehouseBinding();
      }, 200);
    }
  }

  // ========== Data Mapping Methods ==========

  private mapCustomerData(data: any[]): Customer[] {
    return data.map((item: any) => ({
        accountCode: item.accountCode,
        accountName: item.accountName,
        id: item.id,
        address: item.address || '',
        mobileNo: item.mobileNo || null,
        vatNo: item.vatNo || '',
        partyId: item.partyID || '',
      partyID: item.partyID || '',
      salesManID: item.salesManID || null,
      accBalance: item.accBalance || 0,
    }));
  }

  private mapProjectData(data: any[]): Projects[] {
    return data.map((item: any) => ({
      projectcode: item.code,
      projectname: item.description,
      id: item.id,
    }));
  }

  private mapWarehouseData(data: any[]): Warehouse[] {
    const mappedData = data.map((item: any) => ({
      id: item.id,
      value: item.name,
      name: item.name,
      isDefault: item.isDefault || false,
    }));
    
    
    return mappedData;
  }

  private mapPartyData(data: any[]): Supplier[] {
    return data.map((item: any) => ({
      accountCode: item.accountCode,
      accountName: item.accountName,
      address: item.address,
      id: item.id,
      mobileNo: item.mobileNo,
      vatNo: item.vatNo,
      partyID: item.partyID || '',
      accBalance: item.accBalance || 0,
    }));
  }

  // ========== Default Value Setters ==========

  private setDefaultCustomer(): void {
      const cashCustomer = this.customerData.find(
        (c) => c.accountName === 'Cash Customer'
      );

      if (cashCustomer) {
        this.isSettingDefaultValues = true;
        this.salesForm.patchValue({ customer: cashCustomer.accountName });
        // Reset flag after a short delay to allow form to update
        setTimeout(() => {
          this.isSettingDefaultValues = false;
        }, 100);
    }
      }

  private setDefaultSalesman(responseData: any[]): void {
    if (responseData.length > 0) {
        const salesmanName = responseData[0].salesman;
        this.salesForm.patchValue({ salesman: salesmanName });
    }
  }

  private setDefaultWarehouse(): void {
    // Use setTimeout to ensure form and dropdown components are ready
    setTimeout(() => {
      this.bindDefaultWarehouse();
    }, 200);
  }

  private ensureWarehouseBinding(): void {
    // Ensure warehouse is bound even if transaction data doesn't have it
    const currentWarehouse = this.salesForm.get('warehouse')?.value;
    if (!currentWarehouse && this.warehouseData.length > 0) {
      this.bindDefaultWarehouse();
    }
  }

  private setVoucherData(): void {
    const formattedDate = this.formatDate(this.today);
    this.voucherName = this.commonFillData?.vNo?.code || '';
    const voucherNo = this.commonFillData?.vNo?.result || '';

    this.salesForm.patchValue({
      vouchername: this.voucherName,
      voucherno: voucherNo,
      purchasedate: formattedDate,
    });

    this.formVoucherNo = voucherNo;
  }

  // ========== Transaction Data Binding ==========

  private clearForm(): void {
    if (this.salesForm) {
      this.salesForm.reset();
      this.selectedPartyId = 12230;
    }
  }

  private bindTransactionData(transactionData: any): void {
    if (!transactionData) return;

    // Get additional data from the transaction
    const additionals = this.currentSales?.transaction?.fillAdditionals;
    
    const formValues = this.mapTransactionToForm(transactionData, additionals);
    
    // Use setTimeout to ensure form and data are ready
    setTimeout(() => {
      this.isSettingDefaultValues = true;
      this.salesForm.patchValue(formValues, { emitEvent: false });
      
      if (transactionData.accountID) {
        this.selectedPartyId = transactionData.accountID;
        this.onCustomerSelected(transactionData.accountID, false);
      }
      
      // Ensure warehouse binding after transaction data is loaded
      this.ensureWarehouseBinding();
      
      // Reset flag after form is updated
      setTimeout(() => {
        this.isSettingDefaultValues = false;
      }, 100);
      
    }, 100);
  }

  private mapTransactionToForm(transaction: any, additionals?: any): any {
    const formValues: any = {};

    if (transaction.transactionNo) {
      formValues.voucherno = transaction.transactionNo;
    }

    if (transaction.date) {
      formValues.purchasedate = this.formatDate(new Date(transaction.date));
    }

    if (transaction.accountName) {
      formValues.customer = transaction.accountName;
    }

    if (transaction.referenceNo) {
      formValues.reference = transaction.referenceNo;
    }

    if (transaction.description) {
      formValues.description = transaction.description;
    }

    // Map warehouse from additionals data
    if (additionals) {
      // Warehouse mapping from fillAdditionals - try both outLocID and fromLocationID
      const warehouseId = additionals.outLocID || additionals.fromLocationID || additionals.inLocID;
      if (warehouseId && this.warehouseData.length > 0) {
        const warehouseData = this.warehouseData.find(w => w.id === warehouseId);
        if (warehouseData) {
          formValues.warehouse = warehouseData.id;
        }
      }

      if (additionals.address) {
        formValues.description = additionals.address;
      }
      
      if (additionals.vatNo) {
        formValues.vatno = additionals.vatNo;
      }
    }

    // Project mapping - Check both transaction and additionals for costCentreID
    // Based on API response, costCentreID is in fillTransactions, not fillAdditionals
    const costCentreID = transaction?.costCentreID || additionals?.costCentreID;
    if (costCentreID && this.projectData.length > 0) {
      const projectData = this.projectData.find(p => p.id === costCentreID);
      if (projectData) {
        formValues.project = projectData.projectname;
      } else {
        // If not found by ID, try to find by projectCode or projectName from transaction
        if (transaction?.projectCode || transaction?.projectName) {
          const projectByName = this.projectData.find(p => 
            p.projectcode === transaction.projectCode || 
            p.projectname === transaction.projectName ||
            p.projectname === transaction.projectCode ||
            p.projectcode === transaction.projectName
          );
          if (projectByName) {
            formValues.project = projectByName.projectname;
          } 
        } 
      }
    } else if (transaction?.projectCode || transaction?.projectName) {
      // Try to find project by code/name even if costCentreID is not available
      const projectByName = this.projectData.find(p => 
        p.projectcode === transaction.projectCode || 
        p.projectname === transaction.projectName ||
        p.projectname === transaction.projectCode ||
        p.projectcode === transaction.projectName
      );
      if (projectByName) {
        formValues.project = projectByName.projectname;
      } else {
        // If project not found in projectData, use the projectName directly from transaction
        if (transaction.projectName) {
          formValues.project = transaction.projectName;
        }
      }
    }

    return formValues;
  }

  // ========== Form Value Transformation ==========

  private transformFormValue(value: any): any {
    const transformedValue = { ...value };

    this.transformProject(value, transformedValue);
    this.transformCustomer(value, transformedValue);
    this.transformWarehouse(value, transformedValue);

    return transformedValue;
  }

  private transformProject(value: any, modifiedValue: any): void {
    if (!value.project || !this.projectData?.length) return;

    const matchedProject = this.projectData.find(
      (p: any) => p.projectname === value.project
    );

    if (matchedProject) {
      modifiedValue.project = {
        id: matchedProject.id,
        name: matchedProject.projectcode,
        code: matchedProject.projectname,
        description: '',
      };
    }
  }

  private transformCustomer(value: any, modifiedValue: any): void {
    if (!value.customer || !this.customerData?.length) return;

    const matchedCustomer = this.customerData.find(
      (c: any) => c.accountName === value.customer
    );

    if (matchedCustomer) {
      modifiedValue.customer = {
        id: matchedCustomer.id,
        name: matchedCustomer.accountName,
        code: matchedCustomer.accountCode,
        description: '',
      };
    }
  }

  private transformWarehouse(value: any, modifiedValue: any): void {
    if (!value.warehouse || !this.warehouseData?.length) return;

    let warehouseObj = value.warehouse;

    if (typeof warehouseObj === 'number') {
      const matched = this.warehouseData.find((w) => w.id === warehouseObj);
      if (matched) {
        warehouseObj = { id: matched.id, value: matched.name };
      }
    } else if (warehouseObj?.id && warehouseObj?.name) {
      warehouseObj = { id: warehouseObj.id, value: warehouseObj.name };
    }

    modifiedValue.warehouse = warehouseObj;
  }

  // ========== Popup Management ==========

  openCustomerPopup(): void {
    // Prevent popup during initialization, when setting default values, or if no user interaction
    if (!this.isComponentInitialized || !this.isUserInteraction || this.isSettingDefaultValues) {
      return;
    }
    // Only open if we have customer data loaded
    if (!this.customerData || this.customerData.length === 0) {
      return;
    }
    this.openPopup('customer', this.customerData, {
      allowEditing: true,
      allowAdding: true,
      allowDeleting: false,
    });
  }

  openProjectPopup(): void {
    this.openPopup('project', this.projectData, {
      allowEditing: false,
      allowAdding: true,
      allowDeleting: false,
    });
  }

  openSalesmanPopup(): void {
    this.openPopup('salesman', this.salesmanData, {
      allowEditing: false,
      allowAdding: false,
      allowDeleting: false,
    });
  }

  openReferencePopup(): void {
    this.isPopuprefVisible = true;
  }

  private async openPopup(type: PopupType, data: any[], gridSettings: GridSettings): Promise<void> {
    this.currentPopupType = type;
    
    try {
      const ref = await this.popupService.openLazy('generic', {
        popupData: data,
        gridSettings: gridSettings,
        popupType: type
      });

      ref?.afterClosed?.subscribe((result: any) => {
        if (result?.action === 'select' && result?.item) {
          this.onPopupItemSelected(result.item, result.popupType);
        }
      });
    } catch (error) {
      console.error('Error opening popup:', error);
    }
  }

  closePopup(): void {
    this.popupService.close();
  }

  closeReferencePopup(): void {
    this.popupService.close();
  }

  onPopupItemSelected(selectedItem: any, popupType?: PopupType): void {
    const type = popupType || this.currentPopupType;
    const fieldMap: Record<PopupType, string> = {
      customer: 'customer',
      project: 'project',
      salesman: 'salesman',
    };

    const formControlName = fieldMap[type as PopupType];

    if (formControlName) {
      const value =
          selectedItem.name ||
          selectedItem.accountName ||
        selectedItem.projectname;

      this.salesForm.patchValue({ [formControlName]: value });
    }
  }

  // ========== Event Handlers ==========

  onCustomerSelected(option: any, userInput = true): void {
    if (userInput && option !== '') {
      this.isFormDirty = true;
    }

    this.selectedPartyId = option;
    this.fetchPartyBalance();

    const customer = this.customerData.find((item) => item.id === option);

    if (customer) {
      if (!userInput) {
        this.isSettingDefaultValues = true;
      }
      this.salesForm.patchValue({
        customer: customer.accountName,
        vatno: customer.vatNo,
      });
      // Reset flag after a short delay
      if (!userInput) {
        setTimeout(() => {
          this.isSettingDefaultValues = false;
        }, 100);
      }

      this.address = customer.address;
      this.updatedCustomer = customer.accountName;
      this.selectedCustomerObj = {
        id: customer.id,
        name: customer.accountName,
        code: customer.accountCode,
          description: '',
        };

      
      // ✅ Fetch items if both customer and warehouse are selected
      const warehouseId = this.salesForm.get('warehouse')?.value;
      if (warehouseId && this.selectedPartyId && (this.isNewMode() || this.isEditMode())) {
        this.itemService.fetchItemsWithParams(this.pageId, Number(warehouseId), this.voucherNo, Number(this.selectedPartyId));
      }
    }
  }

  onChangeWarehouse(event: any): void {
    const warehouseId = this.salesForm.get('warehouse')?.value;
    const customerId = this.selectedPartyId;

    // ✅ Only fetch items when both warehouse AND customer are selected
    // This prevents unnecessary API calls on page load
    if (warehouseId && customerId && (this.isNewMode() || this.isEditMode())) {
      // Trigger item fetch through itemService
      this.itemService.fetchItemsWithParams(this.pageId, Number(warehouseId), this.voucherNo, Number(customerId));
    }
  }

  onChangePartyInvDate(event: any): void {
    const partyinvDate = event.target?.value || event;
    
    // Patch the header form
    this.salesForm.patchValue({
      partyinvoicedate: partyinvDate
    }, { emitEvent: false });
    
    // Emit to parent so it can update additional details component if needed
    const transformedValue = this.transformFormValue(this.salesForm.value);
    this.formSubmitted.emit(transformedValue);
    
  }

  onChangePartyInvNo(event: any): void {
    const partyinvNo = event.target?.value || event;
    
    // Patch the header form
    this.salesForm.patchValue({
      partyinvoiceno: partyinvNo
    }, { emitEvent: false });
    
    // Emit to parent so it can update additional details component if needed
    const transformedValue = this.transformFormValue(this.salesForm.value);
    this.formSubmitted.emit(transformedValue);
    
  }

  /**
   * Handles keyboard navigation in form fields
   * Press Enter to move to next field or item grid
   */
  onFormKeyDown(event: KeyboardEvent, tabIndex: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      if (tabIndex === -1) {
        // Move focus to item grid
        this.moveFocusToItemGrid();
      } else {
        // Move to next tab index
        this.focusOnTabIndex(tabIndex);
      }
    }
  }

  /**
   * Move focus to the item grid (first cell)
   */
  private moveFocusToItemGrid(): void {
    // Emit event or use a service to notify item grid to focus
    // For now, we'll use a DOM query as a simple solution
    setTimeout(() => {
      const firstGridCell = document.querySelector('.e-grid .e-row:first-child .e-rowcell:first-child') as HTMLElement;
      if (firstGridCell) {
        firstGridCell.click();
        firstGridCell.focus();
      } 
    }, 100);
  }

  /**
   * Move focus to element with specific tabindex
   */
  private focusOnTabIndex(tabIndex: number): void {
    const element = document.querySelector(`[tabindex="${tabIndex}"]`) as HTMLElement;
    if (element) {
      element.focus();
    } 
  }

  // ========== Public Methods ==========

  public resetFormForNewMode(): void {
    const formattedDate = this.formatDate(this.today);

    // Clear the form
    this.salesForm.reset({}, { emitEvent: false });

    this.importedReferenceList = [];
    this.referenceListarray = [];
    this.isReferenceImported = false;

    this.voucherName = this.commonFillData?.vNo?.code || '';
    const voucherNo = this.commonFillData?.vNo?.result || '';
    this.formVoucherNo = voucherNo;

    const patchData: any = {
      vouchername: this.voucherName,
      voucherno: voucherNo,
      purchasedate: formattedDate,
    };

    // Bind default customer: "Cash Customer"
    const cashCustomer = this.customerData.find(
      (c) => c.accountName === 'Cash Customer'
    );

    if (cashCustomer) {
      patchData.customer = cashCustomer.accountName;
      this.address = cashCustomer.address || '';
    }

    this.salesForm.patchValue(patchData, { emitEvent: false });

    this.bindDefaultWarehouse();
  }

  /**
   * Binds the default warehouse to the form
   * Finds warehouse with isDefault=true, otherwise uses the first warehouse
   */
  private bindDefaultWarehouse(): void {
    if (this.warehouseData.length === 0) {
      return;
    }

    // Find warehouse marked as default, or fallback to first warehouse
    const defaultWarehouse = this.warehouseData.find((w) => w.isDefault === true);
    const warehouseToSet = defaultWarehouse || this.warehouseData[0];
    
    
    // Set the value on the form control
    const warehouseControl = this.salesForm.get('warehouse');
    if (warehouseControl) {
      warehouseControl.setValue(warehouseToSet.id, { emitEvent: false });
      warehouseControl.updateValueAndValidity();
      
      // Enable/disable based on mobile mode
      if (this.isMobile) {
        warehouseControl.disable();
      } else {
        warehouseControl.enable();
      }
      
    } else {
      console.error('Warehouse form control not found');
    }
  }

  FillReferenceData(): void {
    this.fetchReferenceData();
  }

  scrollToTop(): void {
    const element = document.getElementById('scrollContainer');
    if (element) {
      element.scrollTop = 0;
    }
  }

  // ========== Reference Popup Methods ==========

  async openImportReferencePopup(): Promise<void> {
    this.importedReferenceList = [];
    this.isReferenceImported = false;
    
    try {
      const ref = await this.popupService.openLazy('reference', {
        referenceData: this.referenceFillData,
        voucherTypes: this.voucherTypeData,
        partyData: this.partyData,
        customerData: this.customerData,
        voucherNo: this.voucherNo,
        pageId: this.pageId,
        partyId: this.partyId,
        locId: this.locId
      });

      ref?.afterClosed.subscribe((result: any) => {
        if (result?.action === 'import') {
          this.saveReferenceData(result);
        }
      });
    } catch (error) {
      console.error('Error opening reference popup:', error);
    }
  }

  saveReferenceData(response: any): void {
    
    // Store reference list for later use
    this.referenceListarray = response?.referenceList || [];
    
    if (Object.keys(response).length > 0) {
      // Update reference field with voucher numbers
      if (response?.referenceVNoList?.length > 0) {
        const refText = response.referenceVNoList.join(', ');
        this.salesForm.patchValue({
          reference: refText
        });
      }

      if (response?.itemListArray?.length > 0) {
        this.importedReferenceList = response.itemListArray;
        
        this.setItemDetailsFromImportReference();
        
        // Emit the complete data including items
        const formData = this.transformFormValue(this.salesForm.value);
        formData.importedItems = this.importedReferenceList;
        formData.referenceList = this.referenceListarray;
        
        this.formSubmitted.emit(formData);
      }
    }
  }

  private setItemDetailsFromImportReference(): void {
    // This method will be used to populate grid items from reference
    if (this.importedReferenceList.length > 0 && !this.isReferenceImported) {
      this.isReferenceImported = true;
      
      // Also update commonService for consistency
      this.commonService.importedReferenceList.set(this.importedReferenceList);
      
      // Emit the imported items through the service
      this.itemService.importedResponse.set(this.importedReferenceList);
      
      // Force processing if in new or edit mode
      setTimeout(() => {
        if (this.itemService.importedResponse().length > 0) {
          this.itemService.addImportedItems(this.importedReferenceList);
        }
      }, 100);
    }
  }

  // ========== Utility Methods ==========

  private buildCustomerEndpoint(): string {
    return this.isMobile
      ? EndpointConstant.FETCHCUSTOMERMOBILE
      : `${EndpointConstant.FILLSALESCUSTOMER}&voucherId=${this.voucherNo}&pageId=${this.pageId}`;
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
  }
}
