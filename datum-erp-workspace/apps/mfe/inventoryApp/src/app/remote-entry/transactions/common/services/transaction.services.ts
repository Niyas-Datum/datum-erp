/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject, signal } from '@angular/core';
import { BaseService } from '@org/services';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { Purchase } from '../interface/transactions.interface';
import { CommonService } from './common.services';
import { EndpointConstant } from '@org/constants';

interface ItemFillApiResponse {
  data?: {
    items?: any[];
    // ...other props if your API returns more
  };
  // ...top-level props like status, message etc.
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private baseService = inject(BaseService);
  private commonService = inject(CommonService);

  // ======== DATA SHARE METHOD (BehaviorSubject) ========
  private _itemFill$ = new BehaviorSubject<any[]>([]);
  /** Subscribe anywhere: this.transactionService.itemFill$.subscribe(...) */
  readonly itemFill$ = this._itemFill$.asObservable();

  // Existing signals you already have
  currentSales = signal<Purchase>({} as Purchase);
  isNewMode = signal<boolean>(false);
  itemCodeValidation = signal<any[]>([]);

  /** Generic GET wrapper you already had */
  getDetails<T = any>(endpoint: string): Observable<T> {
    return this.baseService.get<T>(endpoint);
  }
  saveDetails(endpoint: string, data: any): Observable<any> {
    return this.baseService.post(endpoint, data);
  }
  patchDetails(endpoint: string, data: any): Observable<any> {
    return this.baseService.patch(endpoint, data);
  }
  deleteDetails(endpoint: string): Observable<any> {
    return this.baseService.delete(endpoint);
  }

  /**
   * Loads purchase item-fill data from API and shares it:
   * 1) via BehaviorSubject (itemFill$)
   * 2) via CommonService signals for your grid (invTransactions, tempItemFillDetails)
   */
  loadPurchaseItemFill(params: {
    pageId: number;
    locId: number;
    voucherId: number;
    partyId: number;
  }): Observable<any[]> {
    const { pageId, locId, voucherId, partyId } = params;

    const qs = `PageID=${pageId}&locId=${locId}&voucherId=${voucherId}&partyId=${partyId}`;
    const url = `${EndpointConstant.FILLPURCHASEITEMS}${qs}`;

    return this.getDetails<ItemFillApiResponse>(url).pipe(
      map(res => res?.data?.items ?? []),
      tap(items => {
        // ---- Data share (BehaviorSubject) ----
        this._itemFill$.next(items);

        // ---- Also share through your CommonService signals (for grids) ----
        this.commonService.invTransactions.set(items);
        this.commonService.tempItemFillDetails.set([...items]);
        this.commonService.assignRowIds();
      }),
      catchError(err => {
        // keep consumers safe
        this._itemFill$.next([]);
        // optionally clear grid signals too
        this.commonService.invTransactions.set([]);
        this.commonService.tempItemFillDetails.set([]);
        return throwError(() => err);
      })
    );
  }




  /**
   * Optional: if you sometimes already have the items (e.g., from another source)
   * and just want to push/share them without hitting the API.
   */
  shareItemFill(items: any[]): void {
    this._itemFill$.next(items);
    this.commonService.invTransactions.set(items);
    this.commonService.tempItemFillDetails.set([...items]);
    this.commonService.assignRowIds();
  }
}
