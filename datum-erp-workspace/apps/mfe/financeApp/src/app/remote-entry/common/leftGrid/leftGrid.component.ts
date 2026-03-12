import { Component, inject, OnDestroy, OnInit, signal, ChangeDetectionStrategy, DestroyRef, input, computed, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseService, DataSharingService } from '@org/services';
import { GridModule, SortService, GroupService, PageService, FilterService, VirtualScrollService } from '@syncfusion/ej2-angular-grids';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { BehaviorSubject } from 'rxjs';
import { LeftGridDto } from '@org/models';
;



@Component({
  selector: 'app-left-grid',
  imports: [CommonModule, GridModule, TextBoxModule],
  templateUrl: './leftGrid.component.html',
  styleUrl: './leftGrid.component.scss',
  providers: [SortService, GroupService, PageService, FilterService, VirtualScrollService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftGridComponent implements OnInit ,AfterViewInit{

  sharedService = inject(DataSharingService); 

    public columns$ = new BehaviorSubject<any[]>([]);
    public leftdata$ = new BehaviorSubject<any[]>([]);
    /** Filtered data for the grid (based on search). */
    public filteredData$ = new BehaviorSubject<any[]>([]);
    public data: any[] = [];
    /** Search text for filtering the left grid. */
    searchFilterText = signal('');
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

  

  /** Get list of field names to search from current column config. */
  private getSearchableFields(): string[] {
    const cols = this.columns ?? [];
    const fields: string[] = [];
    for (const col of cols) {
      if (col.columns) {
        for (const child of col.columns) {
          if (child.field) fields.push(child.field);
        }
      } else if (col.field) {
        fields.push(col.field);
      }
    }
    return fields;
  }

  /** Filter rows by search text across all column values. */
  private applyFilter(): void {
    const term = (this.searchFilterText() ?? '').trim().toLowerCase();
    const raw = this.leftdata$.value ?? [];
    if (!term) {
      this.filteredData$.next(raw);
      return;
    }
    const fields = this.getSearchableFields();
    const filtered = raw.filter((row: any) => {
      for (const field of fields) {
        const val = row[field];
        if (val != null && String(val).toLowerCase().includes(term)) return true;
      }
      return false;
    });
    this.filteredData$.next(filtered);
  }

  onSearchInput(event: any): void {
    const value = event?.target?.value ?? event?.value ?? '';
    this.searchFilterText.set(String(value));
    this.applyFilter();
  }

  loadColumns() {
       
        this.sharedService.leftdata$.subscribe(data => {
          this.pageheading = data.pageheading ?? '';
            this.leftdata$.next(data.data ?? []);
            this.data = this.leftdata$.value;
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


