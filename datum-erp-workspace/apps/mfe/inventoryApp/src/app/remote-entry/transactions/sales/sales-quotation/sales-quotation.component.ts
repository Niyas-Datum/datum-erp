import { Component, inject, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from '@org/architecture';
import { InventoryAppService } from '../../../http/inventory-app.service';
import { firstValueFrom } from 'rxjs';
import { Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { InvoiceHeader } from '../../common/invoice-header/invoice-header';
import { ItemList } from '../../common/item-list/item-list';
import { TabModule } from '@syncfusion/ej2-angular-navigations';
import { AdditionalDetailsComponent } from '../../common/additional-details/additional-details.component';
import { InvoiceFooter } from '../../common/invoice-footer/invoice-footer';

@Component({
  selector: 'app-sales-quotation',
  standalone: true,
  imports: [
    CommonModule,
    InvoiceHeader,
    ItemList,
    TabModule,
    AdditionalDetailsComponent,
    InvoiceFooter
  ],
  templateUrl: './sales-quotation.component.html',
  styleUrl: './sales-quotation.component.scss',
})
export class SalesQuotationComponent extends BaseComponent implements OnInit, OnDestroy {
  // Local variables
  readonly isNewMode = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedTab = signal(1); // 1 = Item Details, 2 = Additional Details

  @ViewChild(InvoiceHeader) invoiceHeader?: InvoiceHeader;
  @ViewChild(InvoiceFooter) invoiceFooter?: InvoiceFooter;
  @ViewChild(ItemList) itemList?: ItemList;
  @ViewChild('additionalDetailsRef') additionalDetailsRef?: AdditionalDetailsComponent;

  // ARCH DESIGN SECTION
  private httpService = inject(InventoryAppService); // service inject
  private readonly destroySubscription = new Subject<void>();
  private lastSales = 0;
  private firstSales = 0;
  costCategoryForm = this.formUtil.thisForm;  // form creation method
  pageId = 233;

  get dataSharingService() { return this.serviceBase.dataSharingService; }
  private get currentPageId(): number | null { return this.currentPageInfo?.id ?? null; }
  private get currentVoucherId(): number | null { return this.currentPageInfo?.voucherID ?? null; }

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.subscribeToPageInfoAndLoadLeftGrid();
  }

  ngOnDestroy(): void {
    this.destroySubscription.next();
    this.destroySubscription.complete();
  }

  override async LeftGridInit(): Promise<void> {
    this.pageheading = 'Sales Quotation';
    if (!this.currentPageId || !this.currentVoucherId) {
      return;
    }
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(`${EndpointConstant.FILLALLPURCHASE}pageid=${this.currentPageInfo?.id}&post=true`)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      // handle data here after await completes
      const salesData = res.data ?? [];
      this.leftGrid.leftGridData = salesData;
      if (salesData.length > 0) {
        this.firstSales = parseInt(salesData[0]?.ID, 10) || 0;
        this.lastSales = parseInt(salesData[salesData.length - 1]?.ID, 10) || 0;
      }
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Sales Quotation',
          columns: [
            {
              field: 'TransactionNo',
              datacol: 'TransactionNo',
              headerText: 'Quotation No',
              textAlign: 'Left',
            },
            {
              field: 'AccountName',
              datacol: 'AccountName',
              headerText: 'Customer',
              textAlign: 'Left',
            },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching sales quotation data:', err);
      this.leftGrid.leftGridColumns = [];
      this.leftGrid.leftGridData = [];
    }
  }

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
    setTimeout(() => this.autoSelectLastTransaction(), 300);
  }

  private autoSelectLastTransaction(): void {
    setTimeout(() => {
      this.dataSharingService.setSelectedSalesId(this.lastSales);
    }, 100);
  }

  //.. END ARCH DESIGN SECTION

  /**
   * Override BaseComponent's FormInitialize if needed
   */
  protected override FormInitialize(): void {
    // Form initialization is handled by child components (InvoiceHeader, ItemList, etc.)
    // This can be left empty or used for additional form setup if needed
  }

  /**
   * Override BaseComponent's SaveFormData to handle save operations
   */
  protected override SaveFormData(): void {
    // Implement save logic for sales quotation
    console.log('Save sales quotation');
  }

  /**
   * Override BaseComponent's getDataById to load quotation when selected from left grid
   */
  protected override getDataById(data: any): void {
    if (data?.ID) {
      // Load quotation details
      console.log('Load quotation:', data.ID);
    }
  }
}
