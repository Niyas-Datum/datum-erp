import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridModule } from '@syncfusion/ej2-angular-grids';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { of } from 'rxjs';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, GridModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css'],
})
export class PopupComponent implements OnChanges {
  changesMade: boolean = false;
  @Input() visible: boolean = false;
  @Input() popupData: any[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() dataSelected = new EventEmitter<any[]>();
  @Output() itemSelected = new EventEmitter<any>();
  @Input() gridSettings: { allowEditing: boolean; allowAdding: boolean; allowDeleting: boolean } = {
    allowEditing: false,
    allowAdding: false,
    allowDeleting: false,
  };

  selectionSettings = { type: 'Multiple', mode: 'Row' };
  selectedData: any[] = [];
  selectedRow: any;

  private cachedPopupGridData: any[] = [];

  ngOnChanges(changes: any): void {
    if (changes.popupData && changes.popupData.currentValue !== this.cachedPopupGridData) {
      // Debounce and prevent excessive recalculations
      of(this.popupData).pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(data => {
        this.cachedPopupGridData = this.transformPopupGridData(data);
      });
    }
  }

  get popupGridColumns() {
    if (this.popupData.length > 0) {
      return Object.keys(this.popupData[0]).map((key) => ({
        field: key,
        headerText: key.charAt(0).toUpperCase() + key.slice(1),
        width: 150,
      }));
    }
    return [];
  }

  get popupGridData() {
    return this.cachedPopupGridData;
  }

  private transformPopupGridData(popupData: any[]): any[] {
    return popupData.map((dataItem: any) => {
      return Object.keys(dataItem).reduce((mappedData: any, key: string) => {
        mappedData[key] = dataItem[key] || '';
        return mappedData;
      }, {});
    });
  }

  onRowClick(row: any): void {
    const selectedItem = {
      id: row.id ?? row.partyId ?? row.projectId ?? null,
      code: row.accountCode ?? row.projectcode ?? row.code ?? row.accountcode ??null,
      name: row.accountName ?? row.projectname ?? row.name ?? row.accountname ??null,
    };
    this.itemSelected.emit(selectedItem);
  }

  cancelItems(): void {
    this.closed.emit();
  }

  onOK(): void {
    this.dataSelected.emit(this.selectedData);
    this.closed.emit();
  }

  onClose(): void {
    this.closed.emit();
  }

  getTotalAmount(): number {
    return this.popupGridData.reduce((total, item) => total + (item.amount || 0), 0);
  }

  trackByColumnId(index: number, item: any): any {
    return item.field;
  }
}
