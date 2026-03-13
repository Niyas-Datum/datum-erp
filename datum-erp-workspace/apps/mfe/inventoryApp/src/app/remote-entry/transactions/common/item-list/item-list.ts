/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  input,
  computed,
  ViewChild,
  ViewChildren,
  QueryList,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { BaseService, DataSharingService } from '@org/services';
import { EndpointConstant } from '@org/constants';
import { Purchase } from '../interface/transactions.interface';
import {
  GridModule,
  FilterService,
  VirtualScrollService,
  EditService,
  ToolbarService,
  GridComponent,
} from '@syncfusion/ej2-angular-grids';
import {
  MultiColumnComboBoxModule,
  MultiColumnComboBoxComponent,
} from '@syncfusion/ej2-angular-multicolumn-combobox';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';

import { TransactionService } from '../services/transaction.services';
import { TransactionsComponent } from '../../transactions-component';
import { ItemService } from '../services/item.services';
import { CommonService } from '../services/common.services';

@Component({
  selector: 'app-item-list',
  imports: [CommonModule, GridModule, MultiColumnComboBoxModule, FormsModule],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss',
  providers: [FilterService, VirtualScrollService, EditService, ToolbarService],
})
export class ItemList implements OnInit, OnDestroy {
  @ViewChild('grid') public grid!: GridComponent;
  @ViewChildren(MultiColumnComboBoxComponent) private itemCodeCombos!: QueryList<MultiColumnComboBoxComponent>;

  // Injected services
  private transactionService = inject(TransactionService);
  private transactionsComponent = inject(TransactionsComponent);
  private dataSharingService = inject(DataSharingService);
  private baseService = inject(BaseService);
public commonService = inject(CommonService);
public itemService = inject(ItemService);


  private destroy$ = new Subject<void>();

  // State variables
    invTransactions: any = [];
  selectedSalesId: number | null = null;
  currentSales = {} as Purchase;
  pageId = 0;
  
  // Dynamic page info properties
  private currentPageId: number | null = null;
  private currentVoucherId: number | null = null;

  /** Set true after we auto-focus Item Code on New Mode load so we don't refocus repeatedly. */
  private hasAutoFocusedItemCodeInNewMode = false;

  /** True while the Item Search (multicolumn combobox) dropdown list is open. Enter must select item, not create row. */
  private isItemSearchPopupOpen = false;

  /** Capture-phase handler: prevent form submit on Enter when popup is open; do not stopPropagation so combobox still receives Enter to select item. */
  private documentEnterHandler = (event: KeyboardEvent): void => {
    if (this.isItemSearchPopupOpen && event.key === 'Enter') {
      event.preventDefault();
    }
  };

  // Input signals
  isNewMode = input(false);
  isEditMode = input(false);

  // Computed signals
  currentMode = computed(() => {
    if (this.isNewMode()) return 'New Mode';
    if (this.isEditMode()) return 'Edit Mode';
    return 'View Mode';
  });

  editSettings = computed(() => ({
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

  constructor() {
    // Only add new row when explicitly entering edit mode (not on page load)
    effect(() => {
      if (this.isEditMode() && this.selectedSalesId) {
        setTimeout(() => this.itemService.addNewRow(), 100);
      }
    });

    // Listen for new mode changes to ensure grid has data
    effect(() => {
      if (this.isNewMode() && this.itemService.fillItemDataOptions().length > 0) {
        const currentData = this.commonService.tempItemFillDetails();
        if (currentData.length === 0) {
          this.itemService.addNewRow();
        }
      }
    });

    // When Sales page loads in New Mode with one row, auto-focus Item Code so user can type immediately (Item Search ready)
    effect(() => {
      if (!this.isNewMode()) {
        this.hasAutoFocusedItemCodeInNewMode = false;
        return;
      }
      const rows = this.commonService.tempItemFillDetails();
      if (rows.length !== 1 || this.hasAutoFocusedItemCodeInNewMode) return;
      this.hasAutoFocusedItemCodeInNewMode = true;
      const delay = 600;
      const t = setTimeout(() => {
        if (this.grid && this.commonService.tempItemFillDetails().length === 1) {
          const gridAny = this.grid as any;
          if (typeof gridAny.editCell === 'function') {
            gridAny.editCell(0, 'itemCode');
          } else {
            this.grid.selectRow(0);
            this.grid.startEdit();
          }
        }
      }, delay);
      return () => clearTimeout(t);
    });

    // Listen for imported items from reference popup (only when items exist)
    effect(() => {
      const importedItems = this.itemService.importedResponse();
      
      if (importedItems && importedItems.length > 0 && (this.isNewMode() || this.isEditMode())) {
        // Use setTimeout to ensure it runs after change detection
        setTimeout(() => {
          console.log('📥 Processing imported items in item-list effect:', importedItems.length);
          this.itemService.addImportedItems(importedItems);
          
          // Force grid refresh after items are added
          setTimeout(() => {
            if (this.grid) {
              try {
                this.grid.refresh();
                this.grid.dataSource = this.commonService.tempItemFillDetails();
                console.log('✅ Grid refreshed with imported items');
              } catch (error) {
                console.warn('Grid refresh error:', error);
              }
            }
          }, 200);
          
          // Clear imported items after a delay to ensure processing is complete
          setTimeout(() => {
            this.itemService.importedResponse.set([]);
          }, 500);
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    // Prevent Enter from submitting form / refreshing page when Item Search popup is open (capture = before form).
    document.addEventListener('keydown', this.documentEnterHandler, true);

    // Subscribe to currentPageInfo to get dynamic pageId and voucherId
    this.subscribeToCurrentPageInfo();


    // Listen for selected sales ID changes
    this.dataSharingService.selectedSalesId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((salesId) => {
        this.selectedSalesId = salesId;
        if (salesId) {
          this.fetchPurchaseById();
        } else {
          this.itemService.clearGridData();
          // If in new mode, add a row after clearing
          if (this.isNewMode()) {
            setTimeout(() => this.itemService.addNewRow(), 100);
          }
        }
      });
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.documentEnterHandler, true);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribes to currentPageInfo changes to get dynamic pageId and voucherId
   */
  private subscribeToCurrentPageInfo(): void {
    this.dataSharingService.currentPageInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((pageInfo) => {
        if (pageInfo) {
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            // Update dynamic properties
            this.currentPageId = pageInfo.id ?? null;
            this.currentVoucherId = pageInfo.voucherID ?? null;
            
          }, 0);
        }
      });
  }

  /** -------------------- Data Fetching -------------------- **/
  
  /**
   * Opens the item search popup when the Item Code field receives focus (click or Tab).
   * This restores the behavior where typing in Item Code shows the search list.
   */
  onItemCodeFocus(): void {
    setTimeout(() => {
      const list = this.itemCodeCombos?.toArray();
      const combo = list?.find((c) => c.element?.contains(document.activeElement)) ?? list?.[0];
      if (combo && typeof (combo as any).showPopup === 'function') {
        (combo as any).showPopup();
      }
    }, 0);
  }

  /**
   * Lazy loads items when user opens the item search dropdown and ensures popup is visible above header/tabs.
   * This improves initial page load performance by only loading items when needed.
   */
  onItemSearchOpen(args?: any): void {
    this.isItemSearchPopupOpen = true;

    // Ensure item search dropdown appears above header, tabs, and other content
    if (args?.popup) {
      args.popup.zIndex = 9999;
    }

    // Check if items are already loaded
    if (this.itemService.fillItemDataOptions().length > 0) {
      return;
    }

    // Only load if we have valid pageId and voucherId
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }

    // Lazy load items when user opens the search dropdown
    this.itemService.fetchItemsWithParams(this.currentPageId, 1, this.currentVoucherId, 12230);
  }

  /**
   * Called when the Item Search dropdown closes. Ensures Enter is not interpreted as "next row" while list is open.
   */
  public onItemSearchClose(): void {
    this.isItemSearchPopupOpen = false;
  }

  private fetchPurchaseById(): void {
    // Only proceed if we have valid pageId and voucherId from currentPageInfo
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }
    
  }

  private fillPurchaseDetails(): void {
    // Method kept for backward compatibility
  }

  /** -------------------- Grid Edit Handlers -------------------- **/
  onItemSelect(args: any, data: any): void {
    const value = (args?.value ?? args?.itemData?.itemCode ?? args?.itemData?.itemName ?? '').toString().trim();
    const options = this.itemService.fillItemDataOptions();
    // Resolve selected item from master only (so typed "test1" with no match shows invalid)
    let selectedItem: any = null;
    if (args?.itemData && typeof args.itemData === 'object' && (args.itemData.itemCode != null || args.itemData.itemName != null)) {
      const code = (args.itemData.itemCode ?? args.itemData.itemName ?? '').toString().trim();
      selectedItem = options.find((item: any) =>
        (item.itemCode || '') === code || (item.itemName || '') === code
      ) ?? null;
      if (selectedItem) selectedItem = this.normalizeSelectedItem({ ...selectedItem, ...args.itemData });
    }
    if (!selectedItem && value) {
      selectedItem = options.find((item: any) =>
        (item.itemCode || item.itemName || '') === value
      ) ?? null;
      if (selectedItem) selectedItem = this.normalizeSelectedItem(selectedItem);
    }

    if (selectedItem) {
      // Check if the same item already exists in the grid (same itemId and unit)
      const currentItems = this.commonService.tempItemFillDetails();
      const itemId = selectedItem.id || selectedItem.itemId;
      const unit = selectedItem.unitname || selectedItem.unit || '';
      
      // Find existing item with same itemId and unit
      const existingItem = currentItems.find((item: any) => {
        const existingItemId = item.itemId || item.itemCode;
        const existingUnit = item.unit?.unit || item.unit || '';
        return existingItemId === itemId && existingUnit === unit && item.rowId !== data.rowId;
      });

      if (existingItem) {
        // Item already exists - increase quantity instead of adding new row
        existingItem.qty = (existingItem.qty || 0) + 1;
        
        // Recalculate totals for existing item
        const taxPerc = selectedItem.taxPerc || existingItem.taxPerc || 0;
        this.calculateRowTotals(existingItem, taxPerc);
        this.updateRowInGrid(existingItem);
        
        // Clear the current row data since we're not using it
        Object.assign(data, {
          itemId: '',
          itemCode: '',
          itemName: '',
          unit: '',
          qty: 0,
          rate: 0,
          amount: 0,
          taxValue: 0,
          totalAmount: 0,
        });
        
        setTimeout(() => {
          this.grid.endEdit();
          // Remove the empty row
          const updatedItems = this.commonService.tempItemFillDetails().filter(
            (item: any) => item.rowId !== data.rowId || (item.itemCode && item.itemCode.trim() !== '')
          );
          this.commonService.tempItemFillDetails.set(updatedItems);
          this.commonService.assignRowIds();
          
          // Add a new empty row so user can continue adding items
          this.itemService.addNewRow();
          this.refreshGridAfterRowChange();
        }, 100);
      } else {
        // New item - bind to row (unit as object so grid display and save stay consistent)
        const unitStr = (selectedItem.unitname ?? selectedItem.unit ?? '').toString();
        const unitObj = { unit: unitStr, basicunit: unitStr, factor: 1 };
        Object.assign(data, {
          itemId: selectedItem.id,
          itemCode: selectedItem.itemCode,
          itemName: selectedItem.itemName,
          unit: unitObj,
          qty: 1,
          rate: selectedItem.rate,
          taxPerc: selectedItem.taxPerc ?? 0,
        });
        this.calculateRowTotals(data, selectedItem.taxPerc ?? 0);
        this.updateRowInGrid(data);

        // Move focus to Qty so user can Tab through Qty, Rate, etc.
        setTimeout(() => {
          this.moveToNextColumn(data.rowId, 'qty');
        }, 100);
      }
    } else {
      // Invalid entry: not in item master - show error and clear field
      if (value) {
        this.baseService.showCustomDialoguePopup(
          'Entered item is not in item master. Please select a valid item.',
          'Invalid Entry',
          'WARN'
        );
        Object.assign(data, {
          itemId: '',
          itemCode: '',
          itemName: '',
          unit: '',
          qty: 0,
          rate: 0,
          amount: 0,
          taxValue: 0,
          totalAmount: 0,
        });
        this.updateRowInGrid(data);
      }
      setTimeout(() => {
        this.grid.endEdit();
        this.itemService.addNewRow();
        this.refreshGridAfterRowChange();
      }, 100);
    }
  }

  /** Ensures the grid re-renders after tempItemFillDetails is updated (e.g. new row added). */
  private refreshGridAfterRowChange(): void {
    setTimeout(() => {
      if (this.grid) {
        const next = [...this.commonService.tempItemFillDetails()];
        this.grid.dataSource = next;
        this.grid.refresh();
      }
    }, 50);
  }

  private normalizeSelectedItem(eventItem: any): any {
    if (!eventItem || typeof eventItem !== 'object' || (eventItem.itemCode == null && eventItem.itemName == null)) return null;
    return {
      id: eventItem.id ?? eventItem.itemId,
      itemId: eventItem.itemId ?? eventItem.id,
      itemCode: eventItem.itemCode ?? '',
      itemName: eventItem.itemName ?? '',
      unitname: eventItem.unitname ?? eventItem.unit ?? '',
      rate: eventItem.rate ?? 0,
      taxPerc: eventItem.taxPerc ?? 0,
      ...eventItem,
    };
  }


  onQTYChange(event: any, data: any): void {
    const qty = event?.target?.value != null
      ? parseFloat(String(event.target.value)) || 0
      : (data?.qty != null ? parseFloat(String(data.qty)) : 0);
    data.qty = qty;
    this.recalculateAndUpdateRow(data);
  }

  onRateChange(event: any, data: any): void {
    const rate = event?.target?.value != null
      ? parseFloat(String(event.target.value)) || 0
      : (data?.rate != null ? parseFloat(String(data.rate)) : 0);
    data.rate = rate;
    this.recalculateAndUpdateRow(data);
  }

  /** Get allowed units for this row from item master (current item's unitPopup or distinct units). */
  getUnitsForRow(data: any): { unit: string }[] {
    const options = this.itemService.fillItemDataOptions();
    if (!options?.length) return [];
    const itemCode = (data?.itemCode ?? '').toString().trim();
    if (itemCode) {
      const item = options.find((i: any) => (i.itemCode || i.itemName) === itemCode);
      if (item?.unitPopup?.length) return item.unitPopup.map((u: any) => ({ unit: u.unit || u }));
      if (item?.unitname) return [{ unit: item.unitname }];
    }
    const distinct = new Set<string>();
    options.forEach((i: any) => {
      const u = (i.unitname || i.unit || '').toString().trim();
      if (u) distinct.add(u);
    });
    return Array.from(distinct).map((u) => ({ unit: u }));
  }

  onUnitChange(event: any, data: any): void {
    const raw = event?.value ?? event?.target?.value ?? event?.itemData?.unit ?? '';
    const value = (typeof raw === 'object' ? (raw?.unit ?? raw) : raw).toString().trim();
    const allowed = this.getUnitsForRow(data).map((x) => (x.unit || '').toString().trim());
    const valid = !value || (allowed.length ? allowed.includes(value) : false);
    if (value && !valid) {
      this.baseService.showCustomDialoguePopup(
        'Unit must be from item master. Please select a valid unit.',
        'Invalid Unit',
        'WARN'
      );
      data.unit = '';
      this.updateRowInGrid(data);
      return;
    }
    data.unit = value || '';
    this.updateRowInGrid(data);
  }

  private recalculateAndUpdateRow(data: any): void {
    const options = this.itemService.fillItemDataOptions();
    const itemCode = (data?.itemCode ?? '').toString().trim();
    const selectedItem = options.find((item: any) =>
      (item.itemCode || item.itemName || '') === itemCode ||
      (item.itemCode || '') === (data?.itemName ?? '')
    );
    const taxPerc = selectedItem?.taxPerc ?? data?.taxPerc ?? 0;
    this.calculateRowTotals(data, taxPerc);
    this.updateRowInGrid(data);
  }

  private calculateRowTotals(data: any, taxPerc: number): void {
    const qty = parseFloat(String(data.qty)) || 0;
    const rate = parseFloat(String(data.rate)) || 0;
    const discountPerc = parseFloat(String(data.discountPerc)) || 0;
    const flatDiscount = parseFloat(String(data.discount)) || 0;

    // Gross amount = qty × rate
    data.grossAmt = parseFloat((qty * rate).toFixed(4));

    // Discount: use flat amount if set; otherwise derive from discountPerc
    const discount = flatDiscount > 0
      ? flatDiscount
      : parseFloat((data.grossAmt * discountPerc / 100).toFixed(4));
    data.discount = discount;

    // Amount = gross - discount (taxable base)
    data.amount = parseFloat(Math.max(0, data.grossAmt - discount).toFixed(4));

    // Tax = amount × taxPerc / 100
    data.taxValue = parseFloat(((data.amount * (taxPerc || 0)) / 100).toFixed(4));

    // Total amount = amount + tax
    data.totalAmount = parseFloat((data.amount + data.taxValue).toFixed(4));
  }

  private updateRowInGrid(rowData: any): void {
    const rows = this.commonService.tempItemFillDetails();
    const index = rows.findIndex((row: any) => row.rowId === rowData.rowId);

    if (index !== -1) {
      // Preserve existing row identity and server fields (e.g. transactionId), overlay updated fields
      rows[index] = { ...rows[index], ...rowData };
      this.commonService.tempItemFillDetails.set([...rows]);

      this.dataSharingService.triggerRecalculateTotal$.next();
      this.dataSharingService.triggerRTaxValueTotal$.next();
      this.dataSharingService.triggerNetAmountTotal$.next();
      this.dataSharingService.triggerGrossAmountTotal$.next();
    }
  }


  /** -------------------- Keyboard Navigation -------------------- **/
  onKeyDown(event: KeyboardEvent, data: any, currentField: string): void {
    const fields = ['itemCode', 'unit', 'qty', 'rate'];
    const currentIndex = fields.indexOf(currentField);

    if (event.key === 'Tab') {
      event.preventDefault();
      const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < fields.length) {
        this.moveToNextColumn(data.rowId, fields[nextIndex]);
      } else if (!event.shiftKey && nextIndex >= fields.length) {
        this.handleRowNavigation(data);
      }
      return;
    }

    if (event.key !== 'Enter') return;

    // When Item Search popup is open: prevent form submit (page refresh) but let Syncfusion select the highlighted item.
    // We must preventDefault + stopPropagation so Enter does not submit the form; Syncfusion still handles selection.
    // (change) will then fire, onItemSelect will run and move focus to Qty.
    if (currentField === 'itemCode' && this.isItemSearchPopupOpen) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    if (currentIndex < fields.length - 1) {
      this.moveToNextColumn(data.rowId, fields[currentIndex + 1]);
    } else {
      this.handleRowNavigation(data);
    }
  }

  private handleRowNavigation(data: any): void {
    const rows = this.commonService.tempItemFillDetails();
    const currentRowIndex = rows.findIndex((row: any) => row.rowId === data.rowId);

    if (currentRowIndex < rows.length - 1) {
      this.moveToNextColumn(rows[currentRowIndex + 1].rowId, 'itemCode');
    } else {
      this.itemService.addNewRow();
      setTimeout(() => {
        const updated = this.commonService.tempItemFillDetails();
        const newRow = updated[updated.length - 1];
        if (newRow) this.moveToNextColumn(newRow.rowId, 'itemCode');
      }, 100);
    }
  }

  private moveToNextColumn(rowId: number, field: string): void {
    this.grid.endEdit();
    setTimeout(() => {
      const rowIndex = this.commonService.tempItemFillDetails().findIndex(
        (row: any) => row.rowId === rowId
      );

      if (rowIndex === -1) return;

      const gridAny = this.grid as any;
      if (typeof gridAny.editCell === 'function') {
        gridAny.editCell(rowIndex, field);
      } else {
        this.grid.selectRow(rowIndex);
        this.grid.startEdit();
      }
    }, 50);
  }

  /**
   * Adds a new row to the grid and starts editing the Item Code cell so the user can type and open Item Search.
   * Called when the user clicks the "New Item" button.
   */
  onAddNewItem(): void {
    this.itemService.addNewRow();
    this.refreshGridAfterRowChange();
    setTimeout(() => {
      const rows = this.commonService.tempItemFillDetails();
      const rowIndex = rows.length - 1;
      if (rowIndex >= 0 && this.grid) {
        const gridAny = this.grid as any;
        if (typeof gridAny.editCell === 'function') {
          gridAny.editCell(rowIndex, 'itemCode');
        } else {
          this.grid.selectRow(rowIndex);
          this.grid.startEdit();
        }
      }
    }, 150);
  }

  /** -------------------- Filtering -------------------- **/
  onFiltering(args: any): void {
    if (!args?.text) return;

    const query = args.text.toLowerCase();
    const data = this.itemService.fillItemDataOptions();
    
    const filtered = data?.filter((item: any) =>
      item?.itemCode?.toLowerCase().includes(query) ||
      item?.itemName?.toLowerCase().includes(query)
    ) || [];

    args.updateData(filtered.length ? filtered : data);
  }

  /** -------------------- Grid Actions -------------------- **/
  onActionBegin(args: any): void {
    if (!this.isNewMode() && !this.isEditMode()) {
      if (['beginEdit', 'add'].includes(args.requestType)) {
        args.cancel = true;
      }
      return;
    }

    if (args.requestType === 'save' && args.action === 'edit') {
      this.onQTYChange(args, args.data);
    }
  }

  onActionComplete(args: any): void {
    // Reserved for future logic
  }

  
}
