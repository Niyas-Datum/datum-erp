/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  input,
  computed,
  ViewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

import { TransactionService } from '../services/transaction.services';
import { TransactionsComponent } from '../../transactions-component';
import { ItemService } from '../services/item.services';
import { CommonService } from '../services/common.services';

@Component({
  selector: 'app-item-list',
  imports: [CommonModule, GridModule, FormsModule],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss',
  providers: [FilterService, VirtualScrollService, EditService, ToolbarService],
})
export class ItemList implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('grid') public grid!: GridComponent;

  // Injected services
  private transactionService = inject(TransactionService);
  private transactionsComponent = inject(TransactionsComponent);
  private dataSharingService = inject(DataSharingService);
  private baseService = inject(BaseService);
  private readonly cdr = inject(ChangeDetectorRef);
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
  private itemMasterPreloaded = false;

  /** Set true after we auto-focus Item Code on New Mode load so we don't refocus repeatedly. */
  private hasAutoFocusedItemCodeInNewMode = false;

  /** True while the item search suggestion panel is open (textbox + popup). */
  private isItemSearchPopupOpen = false;

  /** Row currently showing the item search popup (Item Code textbox). */
  activeItemSearchRowId: number | null = null;
  itemSearchQuery = '';
  itemSearchHighlightIndex = 0;
  private itemSearchBlurTimer: ReturnType<typeof setTimeout> | null = null;
  private itemSearchSelecting = false;

  private readonly itemSearchMaxResults = 150;

  /** Fixed-position panel (rendered outside the grid to avoid transform/containing-block issues). */
  itemSearchPanelStyle: Record<string, string> = {};

  /** Input that opened the popup — used for positioning (avoids wrong querySelector when DOM has duplicates). */
  private itemSearchAnchorEl: HTMLElement | null = null;

  private readonly documentScrollReposition = (): void => {
    if (this.activeItemSearchRowId != null) {
      this.schedulePositionItemSearchPanel(this.activeItemSearchRowId);
    }
  };

  private gridScrollHandler = (): void => {
    if (this.activeItemSearchRowId != null) {
      this.schedulePositionItemSearchPanel(this.activeItemSearchRowId);
    }
  };

  /** Capture-phase: prevent form submit on Enter while choosing from item popup. */
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
      if (this.isEditMode()) {
        // First ensure right after switching to Edit mode.
        setTimeout(() => this.ensureEntryRowInEditMode(true), 180);
        // Re-ensure after async transaction/grid refreshes.
        setTimeout(() => this.ensureEntryRowInEditMode(false), 700);
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
    document.addEventListener('scroll', this.documentScrollReposition, true);

    // Subscribe to currentPageInfo to get dynamic pageId and voucherId
    this.subscribeToCurrentPageInfo();


    // Listen for selected sales ID changes
    this.dataSharingService.selectedSalesId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((salesId) => {
        this.selectedSalesId = salesId;
        if (salesId) {
          this.fetchPurchaseById();
          // When editing an existing transaction, row data may refresh asynchronously.
          // Re-ensure entry row after selection settles.
          if (this.isEditMode()) {
            setTimeout(() => this.ensureEntryRowInEditMode(false), 700);
          }
        } else {
          if (this.isEditMode()) {
            // Ignore transient null selection during edit transitions.
            setTimeout(() => this.ensureEntryRowInEditMode(false), 400);
            return;
          }
          this.itemService.clearGridData();
          // If in new mode, add a row after clearing
          if (this.isNewMode()) {
            setTimeout(() => this.itemService.addNewRow(), 100);
          }
        }
      });
  }

  private ensureEntryRowInEditMode(focus: boolean): void {
    if (!this.isEditMode()) return;
    const rows = this.commonService.tempItemFillDetails();
    const hasEmptyRow = rows.some((r: any) => !(r?.itemCode ?? '').toString().trim());
    if (!hasEmptyRow) {
      this.itemService.addNewRow();
      this.refreshGridAfterRowChange();
    }
    if (!focus) return;
    setTimeout(() => {
      const updatedRows = this.commonService.tempItemFillDetails();
      const emptyRow = updatedRows.find((r: any) => !(r?.itemCode ?? '').toString().trim());
      if (emptyRow) {
        this.moveToNextColumn(emptyRow.rowId, 'itemCode');
        setTimeout(() => this.focusItemCodeInput(emptyRow.rowId), 160);
      }
    }, 120);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.attachGridScrollReposition(), 0);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.documentEnterHandler, true);
    document.removeEventListener('scroll', this.documentScrollReposition, true);
    this.detachGridScrollReposition();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.activeItemSearchRowId != null) {
      this.schedulePositionItemSearchPanel(this.activeItemSearchRowId);
    }
  }

  private attachGridScrollReposition(): void {
    const root = this.grid?.element as HTMLElement | undefined;
    root
      ?.querySelector('.e-content')
      ?.addEventListener('scroll', this.gridScrollHandler, { passive: true });
  }

  private detachGridScrollReposition(): void {
    const root = this.grid?.element as HTMLElement | undefined;
    root
      ?.querySelector('.e-content')
      ?.removeEventListener('scroll', this.gridScrollHandler);
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
            this.preloadItemMasterData();
          }, 0);
        }
      });
  }

  /**
   * Preload item master when page/voucher + header customer/warehouse are available.
   * Avoids hardcoded party/loc overwriting the header-driven item list.
   */
  private preloadItemMasterData(): void {
    if (this.itemService.fillItemDataOptions().length > 0) {
      this.itemMasterPreloaded = true;
      return;
    }
    if (!this.currentPageId || !this.currentVoucherId) return;
    const p = this.resolveItemFetchParams();
    if (!p) return;
    if (this.itemMasterPreloaded) return;
    this.itemMasterPreloaded = true;
    setTimeout(() => {
      this.itemService.fetchItemsWithParams(
        p.pageId,
        p.locId,
        p.voucherId,
        p.partyId
      );
    }, 200);
  }

  private resolveItemFetchParams(): {
    pageId: number;
    locId: number;
    voucherId: number;
    partyId: number;
  } | null {
    if (this.currentPageId == null || this.currentVoucherId == null) return null;
    const pageId = Number(this.currentPageId);
    const voucherId = Number(this.currentVoucherId);
    const partyRaw = this.dataSharingService.getCurrentSelectedPartyId();
    const locRaw = this.dataSharingService.getCurrentSelectedWarehouseLocId();
    const partyId = Number(partyRaw);
    const locId = Number(locRaw);
    if (
      partyRaw == null ||
      partyRaw === '' ||
      Number.isNaN(partyId) ||
      partyId <= 0
    ) {
      return null;
    }
    if (
      locRaw == null ||
      locRaw === '' ||
      Number.isNaN(locId) ||
      locId <= 0
    ) {
      return null;
    }
    return { pageId, locId, voucherId, partyId };
  }

  /** -------------------- Data Fetching -------------------- **/

  isItemSearchOpenForRow(rowId: number): boolean {
    return this.activeItemSearchRowId === rowId;
  }

  itemSearchFilteredList(): any[] {
    return this.filterItemsByQuery(this.itemSearchQuery).slice(
      0,
      this.itemSearchMaxResults
    );
  }

  private filterItemsByQuery(query: string): any[] {
    const q = query.toLowerCase().trim();
    const data = this.itemService.fillItemDataOptions();
    if (!data?.length) return [];
    if (!q) return [...data].slice(0, this.itemSearchMaxResults);
    return (
      data.filter(
        (item: any) =>
          item?.itemCode?.toLowerCase().includes(q) ||
          item?.itemName?.toLowerCase().includes(q) ||
          item?.barCode?.toLowerCase().includes(q) ||
          String(item?.stock ?? '')
            .toLowerCase()
            .includes(q)
      ) || []
    );
  }

  private ensureItemsLoadedForSearch(): void {
    if (this.itemService.fillItemDataOptions().length > 0) return;
    const p = this.resolveItemFetchParams();
    if (!p) return;
    this.itemService.fetchItemsWithParams(
      p.pageId,
      p.locId,
      p.voucherId,
      p.partyId
    );
  }

  itemSearchEmptyHint(): string {
    if (!this.resolveItemFetchParams()) {
      return 'Select customer and warehouse in the header to load items.';
    }
    if (!this.itemService.fillItemDataOptions().length) {
      return 'Loading items…';
    }
    return 'No matching items. Keep typing to filter.';
  }

  /** Row object for the active item search (popup is rendered outside the cell). */
  getActiveItemSearchRowData(): any | null {
    const id = this.activeItemSearchRowId;
    if (id == null) return null;
    return (
      this.commonService
        .tempItemFillDetails()
        .find((r: any) => r.rowId === id) ?? null
    );
  }

  private openItemSearchForRow(
    rowId: number,
    query: string,
    anchor?: HTMLElement | null
  ): void {
    this.ensureItemsLoadedForSearch();
    if (anchor) {
      this.itemSearchAnchorEl = anchor;
    }
    this.activeItemSearchRowId = rowId;
    this.itemSearchQuery = query;
    this.itemSearchHighlightIndex = 0;
    this.isItemSearchPopupOpen = true;
    this.schedulePositionItemSearchPanel(rowId, anchor ?? null);
    this.cdr.markForCheck();
  }

  private schedulePositionItemSearchPanel(
    rowId: number,
    anchor?: HTMLElement | null
  ): void {
    const run = () => {
      const el =
        anchor ??
        this.itemSearchAnchorEl ??
        (document.querySelector(
          `[data-item-row-id="${rowId}"] .item-code-search-input`
        ) as HTMLElement | null);
      this.positionItemSearchPanel(el);
      this.cdr.markForCheck();
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
  }

  private positionItemSearchPanel(anchor: HTMLElement | null): void {
    if (!anchor || !anchor.isConnected) {
      this.itemSearchPanelStyle = {};
      return;
    }
    const r = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 6;
    const preferredMaxH = 260;
    const minW = 280;

    let panelW = Math.max(r.width, minW);
    panelW = Math.min(panelW, vw - 16);

    let left = r.left;
    left = Math.min(Math.max(margin, left), vw - panelW - margin);

    const spaceBelow = vh - r.bottom - margin;
    const spaceAbove = r.top - margin;
    let top: number;
    let maxH: number;

    if (spaceBelow >= 100 || spaceBelow >= spaceAbove) {
      top = Math.round(r.bottom + margin);
      maxH = Math.min(preferredMaxH, Math.max(80, spaceBelow - margin));
    } else {
      maxH = Math.min(preferredMaxH, Math.max(80, spaceAbove - margin));
      top = Math.round(Math.max(margin, r.top - maxH - margin));
    }

    this.itemSearchPanelStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${Math.round(left)}px`,
      width: `${Math.round(panelW)}px`,
      'max-height': `${Math.round(maxH)}px`,
      'z-index': '10050',
      overflow: 'hidden',
      'box-sizing': 'border-box',
    };
  }

  closeItemSearchPopup(): void {
    if (this.itemSearchBlurTimer) {
      clearTimeout(this.itemSearchBlurTimer);
      this.itemSearchBlurTimer = null;
    }
    this.activeItemSearchRowId = null;
    this.itemSearchQuery = '';
    this.itemSearchHighlightIndex = 0;
    this.isItemSearchPopupOpen = false;
    this.itemSearchPanelStyle = {};
    this.itemSearchAnchorEl = null;
  }

  onItemCodeInput(event: Event, data: any): void {
    const input = event.target as HTMLInputElement;
    const v = input?.value ?? '';
    data.itemCode = v;
    this.patchRowItemCode(data);
    this.openItemSearchForRow(data.rowId, v, input);
  }

  onItemCodeFieldFocus(event: FocusEvent, data: any): void {
    if (this.itemSearchBlurTimer) {
      clearTimeout(this.itemSearchBlurTimer);
      this.itemSearchBlurTimer = null;
    }
    const input = event.target as HTMLInputElement;
    const v = (input?.value ?? data.itemCode ?? '').toString();
    this.openItemSearchForRow(data.rowId, v, input);
  }

  onItemCodeFieldBlur(event: FocusEvent, data: any): void {
    if (this.itemSearchBlurTimer) clearTimeout(this.itemSearchBlurTimer);
    this.itemSearchBlurTimer = setTimeout(() => {
      this.itemSearchBlurTimer = null;
      if (this.itemSearchSelecting) {
        this.itemSearchSelecting = false;
        return;
      }
      this.closeItemSearchPopup();
      const input = event.target as HTMLInputElement;
      const text = (input?.value ?? data.itemCode ?? '').toString().trim();
      data.itemCode = text;
      this.patchRowItemCode(data);
      if (!text) return;
      if (!this.itemService.fillItemDataOptions().length) return;
      const exact = this.findExactMasterItem(text);
      if (exact) {
        this.applyItemMasterSelection(this.normalizeSelectedItem(exact), data);
      } else {
        this.clearRowAsInvalidItem(data);
      }
    }, 200);
  }

  selectItemFromSearchPopup(item: any, ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    const data = this.getActiveItemSearchRowData();
    if (!data) return;
    this.itemSearchSelecting = true;
    const normalized = this.normalizeSelectedItem({ ...item });
    this.applyItemMasterSelection(normalized, data);
    this.closeItemSearchPopup();
  }

  private findExactMasterItem(text: string): any | null {
    const t = text.trim();
    if (!t) return null;
    const options = this.itemService.fillItemDataOptions();
    return (
      options.find(
        (item: any) =>
          (item.itemCode || '').toString().trim() === t ||
          (item.itemName || '').toString().trim() === t
      ) ?? null
    );
  }

  private patchRowItemCode(data: any): void {
    const rows = [...this.commonService.tempItemFillDetails()];
    const i = rows.findIndex((r: any) => r.rowId === data.rowId);
    if (i === -1) return;
    rows[i] = { ...rows[i], itemCode: data.itemCode };
    this.commonService.tempItemFillDetails.set(rows);
  }

  focusItemCodeInput(rowId: number): void {
    setTimeout(() => {
      const wrap = document.querySelector(`[data-item-row-id="${rowId}"]`);
      const input = wrap?.querySelector(
        'input.item-code-search-input'
      ) as HTMLInputElement | null;
      input?.focus();
      input?.select?.();
    }, 160);
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
  /**
   * Applies a resolved item-master row to the grid line (popup click, Enter, or exact blur match).
   */
  applyItemMasterSelection(selectedItem: any, data: any): void {
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
        if (existingItem.availableStock == null) {
          existingItem.availableStock = this.parseStock(selectedItem.stock);
        }
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
          availableStock: null,
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
          availableStock: this.parseStock(selectedItem.stock),
        });
        this.calculateRowTotals(data, selectedItem.taxPerc ?? 0);
        this.updateRowInGrid(data);

        // Move focus to Qty so user can Tab through Qty, Rate, etc.
        setTimeout(() => {
          this.moveToNextColumn(data.rowId, 'qty');
        }, 100);
      }
    }
  }

  private clearRowAsInvalidItem(data: any): void {
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
      availableStock: null,
    });
    this.updateRowInGrid(data);
    setTimeout(() => {
      this.grid.endEdit();
      this.itemService.addNewRow();
      this.refreshGridAfterRowChange();
    }, 100);
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

  /** Live stock warning while typing in Qty (totals recalc on blur). */
  onQtyInput(event: any, data: any): void {
    const raw = event?.target?.value;
    const qty =
      raw === '' || raw == null ? 0 : parseFloat(String(raw)) || 0;
    data.qty = qty;
    this.patchRowQty(data);
  }

  /** Shown under Qty when master/row has stock and qty is higher. */
  stockQtyWarning(data: any): string {
    const avail = this.getAvailableStockForRow(data);
    const qty = parseFloat(String(data?.qty)) || 0;
    if (avail == null) return '';
    if (qty > avail) {
      return `Qty exceeds available stock (${avail}).`;
    }
    return '';
  }

  removeRow(data: any, $event?: Event): void {
    $event?.stopPropagation();
    if (!this.isNewMode() && !this.isEditMode()) return;

    const rows = this.commonService.tempItemFillDetails();
    const next = rows.filter((r: any) => r.rowId !== data.rowId);
    this.commonService.newlyAddedRows.update((ids) =>
      ids.filter((id) => id !== data.rowId)
    );

    if (next.length === 0) {
      this.commonService.tempItemFillDetails.set([]);
      this.itemService.addNewRow();
    } else {
      this.commonService.tempItemFillDetails.set(next);
      this.commonService.assignRowIds();
    }

    this.dataSharingService.triggerRecalculateTotal$.next();
    this.dataSharingService.triggerRTaxValueTotal$.next();
    this.dataSharingService.triggerNetAmountTotal$.next();
    this.dataSharingService.triggerGrossAmountTotal$.next();
    this.refreshGridAfterRowChange();
  }

  private parseStock(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = parseFloat(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  /** Resolves available quantity from row snapshot or current item master. */
  private getAvailableStockForRow(data: any): number | null {
    const rowVal = data?.availableStock;
    if (rowVal != null && rowVal !== '' && Number.isFinite(Number(rowVal))) {
      return Number(rowVal);
    }
    const code = (data?.itemCode ?? '').toString().trim();
    if (!code) return null;
    const m = this.itemService
      .fillItemDataOptions()
      .find(
        (i: any) =>
          (i.itemCode || '').toString().trim() === code ||
          (i.itemName || '').toString().trim() === code
      );
    return m ? this.parseStock(m.stock) : null;
  }

  private patchRowQty(data: any): void {
    const rows = [...this.commonService.tempItemFillDetails()];
    const i = rows.findIndex((r: any) => r.rowId === data.rowId);
    if (i === -1) return;
    rows[i] = { ...rows[i], qty: data.qty };
    this.commonService.tempItemFillDetails.set(rows);
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
    if (data.availableStock == null && selectedItem) {
      data.availableStock = this.parseStock(selectedItem.stock);
    }
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
  onItemCodeKeyDown(event: KeyboardEvent, data: any): void {
    const list =
      this.activeItemSearchRowId === data.rowId
        ? this.itemSearchFilteredList()
        : [];
    if (this.activeItemSearchRowId === data.rowId && list.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.itemSearchHighlightIndex = Math.min(
          this.itemSearchHighlightIndex + 1,
          list.length - 1
        );
        this.cdr.markForCheck();
        this.schedulePositionItemSearchPanel(data.rowId);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.itemSearchHighlightIndex = Math.max(
          this.itemSearchHighlightIndex - 1,
          0
        );
        this.cdr.markForCheck();
        this.schedulePositionItemSearchPanel(data.rowId);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const item = list[this.itemSearchHighlightIndex];
        if (item) {
          this.itemSearchSelecting = true;
          this.applyItemMasterSelection(
            this.normalizeSelectedItem({ ...item }),
            data
          );
          this.closeItemSearchPopup();
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeItemSearchPopup();
        return;
      }
    }
    this.onKeyDown(event, data, 'itemCode');
  }

  onKeyDown(event: KeyboardEvent, data: any, currentField: string): void {
    const fields = ['itemCode', 'unit', 'qty', 'rate'];
    const currentIndex = fields.indexOf(currentField);

    if (event.key === 'Tab') {
      event.preventDefault();
      if (currentField === 'itemCode') {
        this.closeItemSearchPopup();
      }
      this.commitActiveFieldFromEvent(event, data, currentField);
      this.grid.endEdit();
      const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < fields.length) {
        setTimeout(
          () => this.moveToNextColumn(data.rowId, fields[nextIndex]),
          0
        );
      } else if (!event.shiftKey && nextIndex >= fields.length) {
        setTimeout(() => this.handleRowNavigation(data), 0);
      }
      return;
    }

    if (event.key !== 'Enter') return;

    if (
      currentField === 'itemCode' &&
      this.isItemSearchPopupOpen &&
      this.itemSearchFilteredList().length > 0
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    if (currentIndex < fields.length - 1) {
      this.moveToNextColumn(data.rowId, fields[currentIndex + 1]);
    } else {
      this.commitActiveFieldFromEvent(event, data, currentField);
      this.grid.endEdit();
      setTimeout(() => this.handleRowNavigation(data), 0);
    }
  }

  private commitActiveFieldFromEvent(
    event: KeyboardEvent,
    data: any,
    field: string
  ): void {
    const t = event.target as HTMLInputElement;
    if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'SELECT')) return;
    if (field === 'rate') this.onRateChange({ target: t }, data);
    if (field === 'qty') this.onQTYChange({ target: t }, data);
    if (field === 'unit') this.onUnitChange({ target: t }, data);
    if (field === 'itemCode') {
      data.itemCode = t.value ?? '';
      this.patchRowItemCode(data);
    }
  }

  private handleRowNavigation(data: any): void {
    const rows = [...this.commonService.tempItemFillDetails()];
    const idx = rows.findIndex((row: any) => row.rowId === data.rowId);
    if (idx === -1) return;

    for (let i = idx + 1; i < rows.length; i++) {
      const code = (rows[i]?.itemCode ?? '').toString().trim();
      if (!code) {
        this.moveToNextColumn(rows[i].rowId, 'itemCode');
        setTimeout(() => this.focusItemCodeInput(rows[i].rowId), 180);
        return;
      }
    }

    const lenBefore = this.commonService.tempItemFillDetails().length;
    this.itemService.addNewRow();
    let updated = this.commonService.tempItemFillDetails();
    if (updated.length === lenBefore) {
      this.itemService.addNewRow(true);
      updated = this.commonService.tempItemFillDetails();
    }

    const newRow = updated[updated.length - 1];
    if (newRow) {
      this.refreshGridAfterRowChange();
      this.moveToNextColumn(newRow.rowId, 'itemCode');
      setTimeout(() => this.focusItemCodeInput(newRow.rowId), 180);
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
