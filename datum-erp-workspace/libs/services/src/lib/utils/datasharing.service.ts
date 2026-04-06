import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Subject, tap } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';


import { LocalStorageService } from '../storage/localStorage.service';
import { MenuDataService } from './menudata.service';
import { COSTCATEGORIES, LeftGridDto, MenuItemDto } from '@org/models';

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  //NEW CHANGE : Octobar 2025
     localStorageService =  inject(LocalStorageService);
     menuDataService  = inject(MenuDataService)
    private currentPageInfoSubject = new BehaviorSubject<MenuItemDto>(new MenuItemDto([]));
    currentPageInfo$ = this.currentPageInfoSubject.asObservable();

    public currentPageId = new BehaviorSubject<string>('');
    public currentVoucherId = new BehaviorSubject<string>('');

    ///# Left Grid Data Sharing
              private dataSource = new BehaviorSubject<LeftGridDto>({columns: [], data: []});
              leftdata$ = this.dataSource.asObservable();
              setData(data: LeftGridDto) {
                  this.dataSource.next(data);
              }




  public sharedData: any;


  // current page information
  private currentPageUrls = new BehaviorSubject<string[]>([]);
  public currentPageUrls$ = this.currentPageUrls.asObservable();



  constructor(private router: Router) {

    // Listen to route changes and update currentPageId
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Clear left grid so it doesn't show previous page's data until the new page calls setData()
      this.dataSource.next({ columns: [], data: [], pageheading: '' });

      const menuRaw = this.localStorageService.getLocalStorageItem('menuData');
      let menuItemsArr: MenuItemDto[] = [];
      try {
        menuItemsArr = menuRaw ? JSON.parse(menuRaw) : [];
      } catch {
        menuItemsArr = [];
      }

      const normalizedCurrentUrl = this.normalizeUrl(this.router.url);
      const result = this.findMenuItemByUrlNormalized(menuItemsArr, normalizedCurrentUrl);

      // Always emit on navigation so subscribers don't keep stale page/voucher ids.
      this.currentPageInfoSubject.next(result ?? new MenuItemDto([]));

      
    //  this.updateCurrentPageIdFromUrl();
    });
    // Initial set
    //this.updateCurrentPageIdFromUrl();
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    // Remove query/hash and normalize slashes/case for reliable matching
    const noQueryOrHash = url.split('?')[0].split('#')[0];
    return noQueryOrHash
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }

  private findMenuItemByUrlNormalized(menuItems: MenuItemDto[], targetUrl: string): MenuItemDto | null {
    for (const item of menuItems ?? []) {
      const itemUrl = this.normalizeUrl((item as any)?.url ?? '');
      if (itemUrl && itemUrl === targetUrl) {
        return item;
      }
      if (item?.submenu && item.submenu.length > 0) {
        const found = this.findMenuItemByUrlNormalized(item.submenu as any, targetUrl);
        if (found) return found;
      }
    }
    return null;
  }
  //END NEW CHANGES

 // private updateCurrentPageIdFromUrl(): void {

    // // Parse the URL to extract 'vid' or last segment
    // const urlTree = this.router.parseUrl(this.router.url);
    // // Try to get 'vid' from query params first
    // const vidParam = urlTree.queryParams['vid'];
    // let vid = Number(vidParam);
    // if (!isNaN(vid) && vidParam !== undefined) {
    //   this.currentPageId = vid;
    //   return;
    // }

    // // Fallback: last path segment
    // const segments = urlTree.root.children['primary']?.segments || [];
    // const lastSegment = segments.length > 0 ? segments[segments.length - 1].path : '';
    // vid = Number(lastSegment);
    // if (!isNaN(vid)) {
    //   this.currentPageId = vid;
    // }
  //}

 



  private pageIdSubject = new BehaviorSubject<number>(0);
  public pageId$ = this.pageIdSubject.asObservable();

  private selectedSalesIdSubject = new BehaviorSubject<number | null>(null);
  public selectedSalesId$ = this.selectedSalesIdSubject.asObservable();

  private additionalDetailsSubject = new BehaviorSubject<any>(null);
  public additionalDetails$ = this.additionalDetailsSubject.asObservable();

  private selectedPartyIdSubject = new BehaviorSubject<number | string | null>(null);
  public selectedPartyId$ = this.selectedPartyIdSubject.asObservable();

  public triggerRecalculateTotal$ = new Subject<void>();
  public triggerRTaxValueTotal$ = new Subject<void>();
  public triggerNetAmountTotal$ = new Subject<void>();
  public triggerGrossAmountTotal$ = new Subject<void>();
  /** Emit to force footer (and item grid) to re-fetch current transaction without clearing header. */
  public reloadTransactionForEdit$ = new Subject<void>();
  

  private branchesSubject = new BehaviorSubject<COSTCATEGORIES[]>([]);
  public costCategories$ = this.branchesSubject.asObservable().pipe(
    tap(costCategories => {
      console.log('DataSharingService: branches$ observable emitted data:', costCategories);
      console.log('DataSharingService: Subscribers received branches count:', costCategories.length);
    })
  );

  setPageId(pageId: number): void {
    this.pageIdSubject.next(pageId);
  }

  getCurrentPageId(): number {
    return this.pageIdSubject.value;
  }

  setSelectedSalesId(salesId: number | null): void {
    console.log('DataSharingService: setSelectedSalesId called with data:', salesId);
    this.selectedSalesIdSubject.next(salesId);
  }

  getCurrentSelectedSalesId(): number | null {
    return this.selectedSalesIdSubject.value;
  }

  setBranches(costCategories: COSTCATEGORIES[]): void {
    console.log('DataSharingService: setBranches called with data:', costCategories);
    console.log('DataSharingService: Number of branches:', costCategories.length);
    this.branchesSubject.next(costCategories ?? []);
    console.log('DataSharingService: Data successfully set in BehaviorSubject');
  }

  getCurrentBranches(): COSTCATEGORIES[] {
    const currentBranches = this.branchesSubject.value;
    console.log('DataSharingService: getCurrentBranches called, returning:', currentBranches);
    console.log('DataSharingService: Current branches count:', currentBranches.length);
    return currentBranches;
  }

  setAdditionalDetails(additionalDetails: any): void {
    console.log('DataSharingService: setAdditionalDetails called with data:', additionalDetails);
    this.additionalDetailsSubject.next(additionalDetails);
  }

  getCurrentAdditionalDetails(): any {
    return this.additionalDetailsSubject.value;
  }

  setSelectedPartyId(partyId: number | string | null): void {
    this.selectedPartyIdSubject.next(partyId);
  }

  getCurrentSelectedPartyId(): number | string | null {
    return this.selectedPartyIdSubject.value;
  }

  /** Warehouse / location id from invoice header (for item fill APIs). */
  private selectedWarehouseLocIdSubject = new BehaviorSubject<number | string | null>(
    null
  );
  public selectedWarehouseLocId$ =
    this.selectedWarehouseLocIdSubject.asObservable();

  setSelectedWarehouseLocId(locId: number | string | null): void {
    this.selectedWarehouseLocIdSubject.next(locId);
  }

  getCurrentSelectedWarehouseLocId(): number | string | null {
    return this.selectedWarehouseLocIdSubject.value;
  }

  /** Invoice / voucher header date (e.g. sales invoice date) for APIs such as advance popup. */
  private voucherTransactionDateSubject = new BehaviorSubject<Date | null>(null);
  voucherTransactionDate$ = this.voucherTransactionDateSubject.asObservable();

  setVoucherTransactionDate(date: Date | null): void {
    this.voucherTransactionDateSubject.next(date);
  }

  getVoucherTransactionDate(): Date | null {
    return this.voucherTransactionDateSubject.value;
  }

  getCurrentPageInfo(): MenuItemDto {
    return this.currentPageInfoSubject.value;
  }

  /** Header-selected salesman name; keeps Additional Details tab in sync for save payload. */
  private headerSalesmanNameSubject = new BehaviorSubject<string>('');
  headerSalesmanName$ = this.headerSalesmanNameSubject.asObservable();

  setHeaderSalesmanName(name: string): void {
    this.headerSalesmanNameSubject.next(name != null ? String(name) : '');
  }

  getHeaderSalesmanName(): string {
    return this.headerSalesmanNameSubject.value;
  }
}
