/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  @ViewChild('itemSearchFloating')
  itemSearchFloating?: ElementRef<HTMLElement>;

  /** Parent of the floating panel in the template; used to reparent back after opening on document.body. */
  private itemSearchFloatingAnchorParent: HTMLElement | null = null;

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
  private suppressItemSearchOpenUntil = 0;

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
    this.restoreItemSearchFloatingPanelToHost();
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
    // Hide until measured — avoids a flash in normal flow and avoids empty ngStyle (panel at page bottom).
    this.itemSearchPanelStyle = {
      position: 'fixed',
      top: '-9999px',
      left: '0',
      width: '280px',
      'max-height': '260px',
      visibility: 'hidden',
      'z-index': '10050',
      'pointer-events': 'none',
      'box-sizing': 'border-box',
    };
    this.schedulePositionItemSearchPanel(rowId, anchor ?? null);
    this.cdr.markForCheck();
  }

  /** Reparent to document.body so position:fixed uses the viewport (shell/MFE transforms break fixed inside host). */
  private ensureItemSearchFloatingOnBody(): void {
    if (this.activeItemSearchRowId == null) return;
    const el = this.itemSearchFloating?.nativeElement;
    if (!el || el.parentElement === document.body) return;
    if (!this.itemSearchFloatingAnchorParent) {
      this.itemSearchFloatingAnchorParent = el.parentElement;
    }
    document.body.appendChild(el);
  }

  private restoreItemSearchFloatingPanelToHost(): void {
    const el = this.itemSearchFloating?.nativeElement;
    if (!el || el.parentElement !== document.body) return;
    const p = this.itemSearchFloatingAnchorParent;
    if (p?.isConnected) {
      p.appendChild(el);
    } else {
      el.remove();
    }
  }

  private schedulePositionItemSearchPanel(
    rowId: number,
    anchor?: HTMLElement | null
  ): void {
    const run = () => {
      this.ensureItemSearchFloatingOnBody();
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
      if (this.activeItemSearchRowId != null) {
        this.itemSearchPanelStyle = {
          position: 'fixed',
          top: '-9999px',
          left: '0',
          width: '280px',
          'max-height': '260px',
          visibility: 'hidden',
          'z-index': '10050',
          'pointer-events': 'none',
          'box-sizing': 'border-box',
        };
      } else {
        this.itemSearchPanelStyle = {};
      }
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
      visibility: 'visible',
    };
  }

  closeItemSearchPopup(): void {
    if (this.itemSearchBlurTimer) {
      clearTimeout(this.itemSearchBlurTimer);
      this.itemSearchBlurTimer = null;
    }
    this.restoreItemSearchFloatingPanelToHost();
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
    if (Date.now() < this.suppressItemSearchOpenUntil) {
      return;
    }
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
    this.suppressItemSearchOpenUntil = Date.now() + 350;
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
    setTimeout(() => this.focusFieldInput(rowId, 'itemCode'), 80);
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
          unitsPopup: [],
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
        // New item — mirror legacy onItemCodeSelected: unitsPopup from master + unit object
        const unitsPopup = this.buildUnitsPopupForMasterItem(selectedItem);
        const unitObj = this.resolveUnitObjectForSelection(selectedItem, unitsPopup);
        Object.assign(data, {
          itemId: selectedItem.id,
          itemCode: selectedItem.itemCode,
          itemName: selectedItem.itemName,
          unitsPopup,
          unit: unitObj,
          qty: 1,
          rate: selectedItem.rate,
          taxPerc: selectedItem.taxPerc ?? 0,
          availableStock: this.parseStock(selectedItem.stock),
        });
        this.calculateRowTotals(data, selectedItem.taxPerc ?? 0);
        this.updateRowInGrid(data);

        // Legacy behavior: after committing an item on the last line, append a blank row for the next item.
        const rows = this.commonService.tempItemFillDetails();
        const rowIdx = rows.findIndex((r: any) => this.rowIdEquals(r.rowId, data.rowId));
        const isLastLine = rowIdx >= 0 && rowIdx === rows.length - 1;
        if (isLastLine) {
          this.itemService.addNewRow();
          this.refreshGridAfterRowChange();
        }

        // Move focus to Qty so user can Tab through Qty, Rate, etc.
        setTimeout(() => {
          this.moveToNextColumn(data.rowId, 'qty');
          this.focusFieldInput(data.rowId, 'qty');
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
      unitsPopup: [],
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
    const t = event?.target as HTMLInputElement | undefined;
    let qty: number;
    if (t && typeof t.value === 'string') {
      const v = t.value.trim();
      if (v === '') {
        qty = 0;
      } else {
        const n = parseFloat(v);
        qty = Number.isFinite(n) ? n : 0;
      }
    } else {
      const n = parseFloat(String(data?.qty ?? ''));
      qty = Number.isFinite(n) ? n : 0;
    }
    data.qty = qty < 0 ? 0 : qty;
    this.recalculateAndUpdateRow(data);
    this.warnRateZeroAfterQtyIfNeeded(data);
  }

  /**
   * Legacy sales-invoice behavior: after leaving Qty, warn if line has quantity but no rate
   * (matches old `onMouseLeaveQty`).
   */
  private warnRateZeroAfterQtyIfNeeded(data: any): void {
    const qty = parseFloat(String(data?.qty ?? '')) || 0;
    const rate = parseFloat(String(data?.rate ?? '')) || 0;
    const hasLine = !!(data?.itemCode ?? '').toString().trim();
    if (hasLine && qty > 0 && rate === 0) {
      this.baseService.showCustomDialoguePopup(
        'Rate is zero',
        'Check rate',
        'WARN'
      );
    }
  }

  /** Live stock warning while typing in Qty (totals recalc on blur). */
  onQtyInput(event: any, data: any): void {
    const raw = event?.target?.value;
    // Keep current value while user temporarily clears input; avoids reset-to-zero flicker.
    if (raw === '' || raw == null) {
      return;
    }
    const qty = parseFloat(String(raw)) || 0;
    data.qty = qty;
    this.patchRowQty(data);
    this.recalculateAndUpdateRow(data);
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
    const i = rows.findIndex((r: any) => this.rowIdEquals(r.rowId, data.rowId));
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

  /**
   * Legacy `unitsPopup` on the row, or resolved from master `unitPopup` (same as old searchable dropdown options).
   */
  getUnitsPopupForRow(data: any): { unit: string; basicunit: string; factor: number }[] {
    if (Array.isArray(data?.unitsPopup) && data.unitsPopup.length > 0) {
      return data.unitsPopup;
    }
    const options = this.itemService.fillItemDataOptions();
    const itemCode = (data?.itemCode ?? '').toString().trim();
    if (!itemCode || !options?.length) return [];
    const item = options.find(
      (i: any) =>
        (i.itemCode || '').toString().trim() === itemCode ||
        (i.itemName || '').toString().trim() === itemCode
    );
    return this.mapMasterUnitPopupToRow(item?.unitPopup);
  }

  /** Bound value for &lt;select&gt; (unit code). */
  unitSelectValue(data: any): string {
    const u = data?.unit;
    if (u && typeof u === 'object' && u.unit != null) return String(u.unit);
    if (typeof u === 'string') return u;
    return '';
  }

  onUnitSelect(event: Event, data: any): void {
    const el = event.target as HTMLSelectElement;
    const value = (el?.value ?? '').trim();
    this.applyUnitSelection(data, value);
  }

  private applyUnitSelection(data: any, value: string): void {
    if (!value) {
      data.unit = '';
      this.updateRowInGrid(data);
      return;
    }
    const units = this.getUnitsPopupForRow(data);
    const unitObj = units.find((u) => u.unit === value);
    if (!unitObj) {
      this.baseService.showCustomDialoguePopup(
        'Unit must be from item master. Please select a valid unit.',
        'Invalid Unit',
        'WARN'
      );
      return;
    }
    if (!data.unitsPopup?.length && units.length) {
      data.unitsPopup = [...units];
    }
    data.unit = { ...unitObj };
    this.updateRowInGrid(data);
  }

  private mapMasterUnitPopupToRow(
    popup: any[] | undefined
  ): { unit: string; basicunit: string; factor: number }[] {
    if (!Array.isArray(popup) || !popup.length) return [];
    return popup.map((u: any) => ({
      unit: (u.unit ?? '').toString(),
      basicunit: (u.basicUnit ?? u.basicunit ?? u.unit ?? '').toString(),
      factor: parseFloat(String(u.factor ?? 1)) || 1,
    }));
  }

  private buildUnitsPopupForMasterItem(selectedItem: any): {
    unit: string;
    basicunit: string;
    factor: number;
  }[] {
    const options = this.itemService.fillItemDataOptions();
    const code = (selectedItem.itemCode ?? '').toString().trim();
    const master = options.find(
      (i: any) =>
        (i.itemCode || '').toString().trim() === code ||
        (i.id != null && String(i.id) === String(selectedItem.id ?? selectedItem.itemId)) ||
        (i.itemId != null &&
          String(i.itemId) === String(selectedItem.itemId ?? selectedItem.id))
    );
    const mapped = this.mapMasterUnitPopupToRow(master?.unitPopup);
    if (mapped.length) return mapped;
    const u = (selectedItem.unitname ?? selectedItem.unit ?? 'PCS').toString().trim() || 'PCS';
    return [{ unit: u, basicunit: u, factor: 1 }];
  }

  private resolveUnitObjectForSelection(
    selectedItem: any,
    unitsPopup: { unit: string; basicunit: string; factor: number }[]
  ): { unit: string; basicunit: string; factor: number } {
    const wanted = (selectedItem.unitname ?? selectedItem.unit ?? '').toString().trim();
    const hit = wanted ? unitsPopup.find((x) => x.unit === wanted) : undefined;
    return hit ?? unitsPopup[0] ?? { unit: 'PCS', basicunit: 'PCS', factor: 1 };
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
    const index = rows.findIndex((row: any) =>
      this.rowIdEquals(row.rowId, rowData.rowId)
    );

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

  /** Syncfusion batch cells sometimes omit or stringify `rowId`; inputs still sit under `[data-item-row-id]`. */
  private rowIdEquals(a: unknown, b: unknown): boolean {
    const na = Number(a);
    const nb = Number(b);
    return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
  }

  /**
   * Legacy grid: Tab from Item Code skips to Qty when qty is still 0, or to Rate when qty is set but rate is 0
   * (otherwise next field is Unit). Aligns with old `onKeyDown` Tab handling on itemcode column.
   */
  private getNextFieldAfterItemCodeNavigate(row: any): 'unit' | 'qty' | 'rate' {
    const code = (row?.itemCode ?? '').toString().trim();
    if (!code) return 'unit';
    const qty = parseFloat(String(row?.qty ?? ''));
    const qtyInvalid = !Number.isFinite(qty) || qty <= 0;
    if (qtyInvalid) return 'qty';
    const rate = parseFloat(String(row?.rate ?? ''));
    const rateInvalid = !Number.isFinite(rate) || rate <= 0;
    if (rateInvalid) return 'rate';
    return 'unit';
  }

  private moveForwardFromItemCode(data: any, currentRowId: number): void {
    const rows = this.commonService.tempItemFillDetails();
    const row =
      rows.find((r: any) => this.rowIdEquals(r.rowId, currentRowId)) ?? data;
    const target = this.getNextFieldAfterItemCodeNavigate(row);
    setTimeout(() => this.moveToNextColumn(currentRowId, target), 0);
  }

  private resolveRowIdForGridNav(data: any): number {
    const raw = data?.rowId;
    const fromData =
      raw != null && raw !== '' ? Number(raw) : NaN;
    if (Number.isFinite(fromData) && fromData > 0) return fromData;
    const active = document.activeElement?.closest(
      '[data-item-row-id]'
    ) as HTMLElement | null;
    const fromDom = Number(active?.getAttribute('data-item-row-id') ?? NaN);
    if (Number.isFinite(fromDom) && fromDom > 0) return fromDom;
    const rows = this.commonService.tempItemFillDetails();
    if (rows.length === 1) {
      const only = Number(rows[0]?.rowId ?? NaN);
      if (Number.isFinite(only) && only > 0) return only;
    }
    return 0;
  }

  /**
   * Prefer the row id from the key event target (DOM) over `data.rowId`.
   * After `assignRowIds()` / grid refresh, template `data` can be stale while the focused
   * input still sits under the correct `[data-item-row-id]` — wrong id makes Tab jump to row 1.
   */
  private resolveRowIdFromKeyEvent(event: KeyboardEvent, data: any): number {
    const t = event.target as HTMLElement | null;
    const wrap = t?.closest?.('[data-item-row-id]') as HTMLElement | null;
    const attr = wrap?.getAttribute('data-item-row-id');
    const fromEvent =
      attr != null && attr !== '' ? Number(attr) : NaN;
    if (Number.isFinite(fromEvent) && fromEvent > 0) {
      return fromEvent;
    }
    return this.resolveRowIdForGridNav(data);
  }

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
          this.suppressItemSearchOpenUntil = Date.now() + 350;
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

  onKeyDown(event: KeyboardEvent, data: any, currentField: 'itemCode' | 'unit' | 'qty' | 'rate'): void {
    const fields = ['itemCode', 'unit', 'qty', 'rate'] as const;
    const currentIndex = fields.indexOf(currentField);
    const currentRowId = this.resolveRowIdFromKeyEvent(event, data);

    if (event.key === 'Tab') {
      event.preventDefault();
      if (currentField === 'itemCode') {
        this.closeItemSearchPopup();
      }
      this.commitActiveFieldFromEvent(event, data, currentField);
      this.grid.endEdit();
      if (!event.shiftKey && currentField === 'itemCode') {
        this.moveForwardFromItemCode(data, currentRowId);
        return;
      }
      const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < fields.length) {
        setTimeout(
          () => this.moveToNextColumn(currentRowId, fields[nextIndex]),
          0
        );
      } else if (!event.shiftKey && nextIndex >= fields.length) {
        setTimeout(() => this.handleRowNavigation(currentRowId), 0);
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
      this.commitActiveFieldFromEvent(event, data, currentField);
      this.grid.endEdit();
      if (currentField === 'itemCode') {
        this.moveForwardFromItemCode(data, currentRowId);
      } else {
        this.moveToNextColumn(currentRowId, fields[currentIndex + 1]);
      }
    } else {
      this.commitActiveFieldFromEvent(event, data, currentField);
      this.grid.endEdit();
      setTimeout(() => this.handleRowNavigation(currentRowId), 0);
    }
  }

  private commitActiveFieldFromEvent(
    event: KeyboardEvent,
    data: any,
    field: string
  ): void {
    const t = event.target;
    if (!t || !(t instanceof HTMLInputElement) && !(t instanceof HTMLSelectElement)) {
      return;
    }
    if (field === 'rate') this.onRateChange({ target: t }, data);
    if (field === 'qty') this.onQTYChange({ target: t }, data);
    if (field === 'unit' && t instanceof HTMLSelectElement) {
      this.applyUnitSelection(data, t.value?.trim() ?? '');
    }
    if (field === 'itemCode' && t instanceof HTMLInputElement) {
      data.itemCode = t.value ?? '';
      this.patchRowItemCode(data);
    }
  }

  /**
   * Focus item-code input on another row without `editCell` (batch grid often leaves focus on row 1).
   */
  private focusItemCodeOnRow(rowIndex: number, rowId: number): void {
    const focus = () => this.focusFieldInput(rowId, 'itemCode');
    const selectAndFocus = () => {
      try {
        const g = this.grid as any;
        if (g && rowIndex >= 0 && typeof g.selectRow === 'function') {
          g.selectRow(rowIndex);
        }
      } catch {
        /* Syncfusion batch may throw if grid is updating */
      }
      focus();
    };
    setTimeout(selectAndFocus, 0);
    setTimeout(focus, 120);
    setTimeout(focus, 300);
  }

  private handleRowNavigation(currentRowId: number): void {
    const rows = [...this.commonService.tempItemFillDetails()];
    let idx = rows.findIndex((row: any) =>
      this.rowIdEquals(row.rowId, currentRowId)
    );
    if (idx === -1 && rows.length === 1) {
      idx = 0;
    }
    if (idx === -1) return;

    for (let i = idx + 1; i < rows.length; i++) {
      const code = (rows[i]?.itemCode ?? '').toString().trim();
      if (!code) {
        const targetRowId = Number(rows[i].rowId ?? 0);
        if (targetRowId > 0) {
          this.focusItemCodeOnRow(i, targetRowId);
        }
        return;
      }
    }

    const lenBefore = this.commonService.tempItemFillDetails().length;
    this.itemService.addNewRow(true);
    let updated = this.commonService.tempItemFillDetails();
    if (updated.length <= lenBefore) {
      // Fallback: force add one more time in case of async state race.
      this.itemService.addNewRow(true);
      updated = this.commonService.tempItemFillDetails();
    }

    const newRow = updated[updated.length - 1];
    if (newRow) {
      const newIndex = updated.length - 1;
      this.refreshGridAfterRowChange();
      setTimeout(() => this.focusItemCodeOnRow(newIndex, newRow.rowId), 80);
    }
  }

  private moveToNextColumn(rowId: number, field: 'itemCode' | 'unit' | 'qty' | 'rate'): void {
    if (!this.grid || !this.grid.element?.isConnected) {
      this.focusFieldInput(rowId, field);
      return;
    }
    this.grid.endEdit();
    setTimeout(() => {
      const rowIndex = this.commonService.tempItemFillDetails().findIndex(
        (row: any) => this.rowIdEquals(row.rowId, rowId)
      );

      if (rowIndex === -1) return;
      const viewRows = (this.grid as any).currentViewData as any[] | undefined;
      if (Array.isArray(viewRows) && (rowIndex < 0 || rowIndex >= viewRows.length)) {
        this.focusFieldInput(rowId, field);
        return;
      }

      const gridAny = this.grid as any;
      try {
        if (typeof gridAny.editCell === 'function') {
          gridAny.editCell(rowIndex, field);
        } else {
          this.grid.selectRow(rowIndex);
          this.grid.startEdit();
        }
      } catch {
        // Syncfusion batch mode can throw if internal edit state isn't ready yet.
      }
      this.focusFieldInput(rowId, field);
    }, 50);
  }

  private focusFieldInput(rowId: number, field: 'itemCode' | 'qty' | 'rate' | 'unit'): void {
    setTimeout(() => {
      const gridRoot =
        this.grid?.element ?? document.getElementById('transactionGrid');
      if (!gridRoot) return;
      let selector = 'input.item-code-search-input';
      if (field === 'qty') selector = 'input.item-qty-input';
      if (field === 'rate') selector = 'input.item-rate-input';
      if (field === 'unit') selector = 'select.item-unit-select';
      const candidates = gridRoot.querySelectorAll(selector);
      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i] as HTMLInputElement;
        const wrap = el.closest('[data-item-row-id]');
        const attr = wrap?.getAttribute('data-item-row-id');
        if (attr != null && this.rowIdEquals(attr, rowId)) {
          el.focus();
          el.select?.();
          break;
        }
      }
    }, 80);
  }

  /** -------------------- Grid Actions -------------------- **/
  onActionBegin(args: any): void {
    if (!this.isNewMode() && !this.isEditMode()) {
      if (['beginEdit', 'add'].includes(args.requestType)) {
        args.cancel = true;
      }
      return;
    }

    // Batch save: Syncfusion merges `args.data` from its editor model. Custom templates + numericedit
    // can leave qty/rate as 0/undefined. Our signal (`tempItemFillDetails`) is updated by input/blur — keep it authoritative.
    if (args.requestType === 'save' && args.data) {
      this.mergeBatchSaveRowFromStore(args);
    }

    // Do not call onQTYChange here: batch `save`/`edit` fires for every column (rate, unit, …).
    // Passing that event into onQTYChange used the wrong `target`/`value` and overwrote qty with 0.
    // Qty is committed via (blur) and onQtyInput on the qty cell only.
  }

  /**
   * Before batch commit, overlay numeric/line fields from the store so the grid does not overwrite
   * user input with stale zeros (common with custom edit templates in Batch mode).
   */
  private mergeBatchSaveRowFromStore(args: any): void {
    const rows = this.commonService.tempItemFillDetails();
    if (!rows.length) return;

    let src: any | undefined;
    const rid = args.data?.rowId;
    if (rid != null && rid !== '') {
      src = rows.find((r: any) => this.rowIdEquals(r.rowId, rid));
    }
    const idx =
      typeof args.rowIndex === 'number' && !Number.isNaN(args.rowIndex)
        ? args.rowIndex
        : typeof args.data?.index === 'number'
          ? args.data.index
          : -1;
    if (!src && idx >= 0 && idx < rows.length) {
      src = rows[idx];
    }
    if (!src) return;

    args.data.qty = src.qty;
    args.data.rate = src.rate;
    args.data.unit = src.unit;
    args.data.unitsPopup = src.unitsPopup;
    args.data.amount = src.amount;
    args.data.taxValue = src.taxValue;
    args.data.totalAmount = src.totalAmount;
    args.data.grossAmt = src.grossAmt;
    args.data.discount = src.discount;
    args.data.discountPerc = src.discountPerc;
    args.data.taxPerc = src.taxPerc;
    args.data.itemCode = src.itemCode;
    args.data.itemName = src.itemName;
    args.data.itemId = src.itemId;
    args.data.availableStock = src.availableStock;
  }

  onActionComplete(args: any): void {
    // Reserved for future logic
  }

  
}
