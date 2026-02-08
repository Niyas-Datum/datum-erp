import { Component, inject, OnDestroy, OnInit, signal, ChangeDetectionStrategy, DestroyRef, input, computed, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseService, DataSharingService } from '@org/services';
import { GridModule, SortService, GroupService, PageService, FilterService, VirtualScrollService } from '@syncfusion/ej2-angular-grids';
import { BehaviorSubject } from 'rxjs';
import { LeftGridDto } from '@org/models';
;



@Component({
  selector: 'app-left-grid',
  imports: [CommonModule, GridModule, FormsModule],
  templateUrl: './leftGrid.component.html',
  styleUrl: './leftGrid.component.scss',
  providers: [SortService, GroupService, PageService, FilterService, VirtualScrollService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftGridComponent {

  sharedService = inject(DataSharingService);

  public columns$ = new BehaviorSubject<any[]>([]);
  public leftdata$ = new BehaviorSubject<any[]>([]);
  /** Filtered data for grid (live search by invoice no, customer, vat, id). */
  public filteredData$ = new BehaviorSubject<any[]>([]);
  public data: any[] = [];
  private rawData: any[] = [];
  searchText = signal('');
  // Input properties

      public pageheading = '';
      @Input() columns: any[] = [];


  //local init
  public leftGridData: any[] = [];

  @Output() rowSelected = new EventEmitter<any>(); // output event


   //public datas: any[] = [];
 public configureEditSettings: object = {};
  public filterOptions: object = {};

  // public colum
  baseService = inject(BaseService); // http request     
  isInputDisabled = signal(true);

  isNewMode = input(false);
  isEditMode = input(false);

  isSelectionDisabled = computed(() => this.isNewMode() || this.isEditMode());

  public selectionOptions = computed(() => ({
    type: 'Single',
    persistSelection: true,
    enableSimpleMultiRowSelection: false,
    enableSelection: !this.isSelectionDisabled()
  }));



  ngOnInit(): void { 
   
    console.log('LeftGridComponent initialized with data:', this.data);
    

   this.configureEditSettings = {
      allowEditing: true,
      allowAdding: true,
      allowDeleting: true,
    };
    this.filterOptions = { type: 'Menu' };
 
  }
   ngAfterViewInit(): void { 
    setTimeout(() => {
      this.loadColumns();
    },100);
   }
              constructor() {
                //this.loadColumns();
              
              }
                          onRowSelect(event: any) {
                            const selected = event.data; // Or event.rowData depending on your grid setup
                            console.log("Selected unit in LeftGrid:", selected);
                            this.rowSelected.emit(selected);
                          }

  

  /** Apply live filter by invoice no, customer name, vat no, id. */
  private applyFilter(): void {
    const q = (this.searchText() || '').trim().toLowerCase();
    if (!q) {
      this.filteredData$.next([...this.rawData]);
      return;
    }
    const filtered = this.rawData.filter((row: any) => {
      const invoiceNo = (row.TransactionNo ?? row.transactionNo ?? row.VoucherNo ?? row.voucherNo ?? '').toString().toLowerCase();
      const customer = (row.AccountName ?? row.accountName ?? row.PartyName ?? row.partyName ?? '').toString().toLowerCase();
      const vat = (row.VatNo ?? row.vatNo ?? row.VATNo ?? '').toString().toLowerCase();
      const id = (row.ID ?? row.Id ?? row.id ?? '').toString().toLowerCase();
      return invoiceNo.includes(q) || customer.includes(q) || vat.includes(q) || id.includes(q);
    });
    this.filteredData$.next(filtered);
  }

  onSearchChange(value: string): void {
    this.searchText.set(value || '');
    this.applyFilter();
  }

  loadColumns() {
    this.sharedService.leftdata$.subscribe(data => {
      this.pageheading = data.pageheading ?? '';
      const list = data.data ?? [];
      this.leftdata$.next(list);
      this.data = list;
      this.rawData = list;
      this.applyFilter();
    });
         
         
          
        const dynamicColumns = this.columns.map(col => {
              if (col.columns) {
                return { headerText: col.headerText, columns: col.columns };
              } else {
                return col;
              }
            });
              this.columns$.next(dynamicColumns);
        
          
               
  }
}


