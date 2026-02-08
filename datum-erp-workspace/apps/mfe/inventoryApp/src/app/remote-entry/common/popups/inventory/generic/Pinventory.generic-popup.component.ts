/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GridModule } from '@syncfusion/ej2-angular-grids';

@Component({
  selector: 'generic-popup',
  standalone: true,
  imports: [CommonModule, GridModule, FormsModule],
  template: `
    <div class="popup-search" style="margin-bottom: 8px;">
      <input type="text" class="form-control" placeholder="Search..."
        [ngModel]="searchText"
        (ngModelChange)="onSearchChange($event)" />
    </div>
    <!-- Syncfusion Grid Implementation -->
    <ejs-grid
      #grid
      [dataSource]="filteredGridData"
      [allowPaging]="false"
      [enableVirtualization]="true"
      [editSettings]="editSettings"
      height="250"
      width="100%"
      [enableHover]="true"
      [gridLines]="'Both'"
      [selectionSettings]="selectionSettings"
      (rowSelected)="onRowClick($event.data)"
      [pageSettings]="{ pageSize: 100 }">
      <e-columns>
        <e-column
          *ngFor="let column of popupGridColumns; trackBy: trackByColumnId"
          [field]="column.field"
          [headerText]="column.headerText"
          [width]="column.width">
        </e-column>
      </e-columns>
    </ejs-grid>

    <div style="text-align: right; margin-top: 10px">
      <button class="btn btn-primary" (click)="onOK()">OK</button>
      <button class="btn btn-secondary" style="margin-left: 10px" (click)="onClose()">Close</button>
    </div>
  `
})
export class PinventoryGenericPopupComponent implements OnInit {
  // Inputs from popup service (will be assigned via Object.assign)
  popupData: any[] = [];
  /** Pre-fill search when opening (e.g. current customer name). */
  initialSearchText = '';
  gridSettings: { allowEditing: boolean; allowAdding: boolean; allowDeleting: boolean } = {
    allowEditing: false,
    allowAdding: false,
    allowDeleting: false,
  };
  popupType: 'customer' | 'project' | 'salesman' = 'customer';

  // Popup close function (injected by popup service)
  popupClose?: (result?: any) => void;

  selectionSettings = { type: 'Multiple', mode: 'Row' };
  private cachedPopupGridData: any[] = [];
  searchText = '';

  ngOnInit(): void {
    if (this.popupData && this.popupData.length > 0) {
      this.cachedPopupGridData = this.transformPopupGridData(this.popupData);
    }
    if (this.initialSearchText != null && this.initialSearchText !== '') {
      this.searchText = String(this.initialSearchText).trim();
    }
  }

  get popupGridColumns() {
    if (this.popupData.length > 0) {
      return Object.keys(this.popupData[0]).map((key) => ({
        field: key,
        headerText: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        width: 150,
      }));
    }
    return [];
  }

  onSearchChange(value: string): void {
    this.searchText = (value || '').trim();
  }

  /** Filter by search: cumulative (each keystroke filters current list). */
  get filteredGridData(): any[] {
    const q = this.searchText.toLowerCase();
    if (!q) return this.cachedPopupGridData;
    return this.cachedPopupGridData.filter((row: any) => {
      return Object.values(row).some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      );
    });
  }

  get editSettings() {
    return {
      allowEditing: this.gridSettings.allowEditing,
      allowAdding: this.gridSettings.allowAdding,
      allowDeleting: this.gridSettings.allowDeleting,
      mode: 'Normal'
    };
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
      code: row.accountCode ?? row.projectcode ?? row.code ?? row.accountcode ?? null,
      name: row.accountName ?? row.projectname ?? row.name ?? row.accountname ?? null,
    };
    
    if (typeof this.popupClose === 'function') {
      this.popupClose({ action: 'select', item: selectedItem, popupType: this.popupType });
    }
  }

  onOK(): void {
    // OK button can be used for additional actions if needed
    if (typeof this.popupClose === 'function') {
      this.popupClose({ action: 'ok' });
    }
  }

  onClose(): void {
    if (typeof this.popupClose === 'function') {
      this.popupClose();
    }
  }

  trackByColumnId(index: number, item: any): any {
    return item.field;
  }
}

