
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable @angular-eslint/prefer-inject */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TransactionService } from '../../../../transactions/common/services/transaction.services';
import { EndpointConstant } from '@org/constants';
import { GridModule } from '@syncfusion/ej2-angular-grids';
import { MultiColumnComboBoxModule } from '@syncfusion/ej2-angular-multicolumn-combobox';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { CommonService } from '../../../../transactions/common/services/common.services';
import { ItemService } from '../../../../transactions/common/services/item.services';

@Component({
  selector: 'reference-popup',
  standalone: true,
  imports: [
    CommonModule,
    GridModule,
    MultiColumnComboBoxModule,
    DatePickerModule,
    TextBoxModule,
    DropDownListModule,
    ReactiveFormsModule,
  ],
  templateUrl: './Pinventory.reference.component.html',
})

export class PinventoryReferencePopupComponent implements OnInit {
  // Inputs from popup service (will be assigned via Object.assign)
  referenceData: any[] = [];
  voucherTypes: any[] = [];
  partyData: any[] = [];
  customerData: any[] = [];
  voucherNo: number = 0;
  pageId: number = 0;
  partyId: number = 0;
  locId: number = 0;

  // Popup close function (injected by popup service)
  popupClose?: (result?: any) => void;

  @ViewChild('okbutton') okButton!: ElementRef;
  @ViewChild('cancelbutton') cancelbutton!: ElementRef;
  
  transactionService = inject(TransactionService);
  commonService = inject(CommonService);
  itemService = inject(ItemService);
  private formBuilder = inject(FormBuilder);
  private renderer = inject(Renderer2);
  
  referenceSearchForm!: FormGroup;
  filteredData: any = [];
  itemListArray: any = [];
  selectedReferenceArray: any = [];
  referenceItemList = [] as Array<any>;
  referenceWithItemsArr: any = [];
  referenceVNoArray: any = [];
  modifiedArray: any = [];
  isOverwriteVoucher = true;
  selectedPartyId = 0;
  transactionId: number = 0;
  destroySubscription: Subject<void> = new Subject<void>();
  voucherTypesWithAll: any[] = [];

  ngOnInit(): void {
    this.modifiedArray = JSON.parse(JSON.stringify(this.referenceData || []));
    this.resetSelectionState();
    
    // Add "All" option to voucher types
    this.voucherTypesWithAll = [{ name: 'all' }, ...(this.voucherTypes || [])];
    
    this.referenceSearchForm = this.formBuilder.group({
      vouchertype: ['all'],
      voucherno: [''],
      voucherdate: [''],
      party: [''],
    });
    this.setReferenceData();
  }

  private resetSelectionState(): void {
    this.selectedReferenceArray = [];
    this.referenceWithItemsArr = [];
    this.itemListArray = [];
    this.referenceVNoArray = [];
  }

  setReferenceData() {
    const { vouchertype, voucherno, voucherdate, party } =
      this.referenceSearchForm.value ?? {};

    const vtFilter = (vouchertype ?? '').toString().trim();
    const vnFilter = (voucherno ?? '').toString().trim().toLowerCase();
    const pdFilter = voucherdate ?? null;
    const partyFilter = (party ?? '').toString().trim().toLowerCase();

    const hasFilters = !!(vtFilter || vnFilter || pdFilter || partyFilter);
    if (!hasFilters) {
      this.filteredData = [...this.modifiedArray];
      return;
    }

    const formattedDateFilter = pdFilter ? this.formatDate(pdFilter) : null;

    this.filteredData = this.modifiedArray.filter((item: any) => {
      const itemVoucherType = (item.voucherType ?? '').toString().toLowerCase();
      const itemVNo = (item.vNo ?? '').toString().toLowerCase();
      const itemVDate = (item.vDate ?? '').toString();
      const itemAccountName = (item.accountName ?? '').toString().toLowerCase();

      let matches = true;

      if (vtFilter && vtFilter.toLowerCase() !== 'all') {
        matches = matches && itemVoucherType.includes(vtFilter.toLowerCase());
      }

      if (vnFilter) {
        matches = matches && itemVNo.includes(vnFilter);
      }

      if (formattedDateFilter) {
        matches = matches && itemVDate.includes(formattedDateFilter);
      }

      if (partyFilter) {
        matches = matches && itemAccountName.includes(partyFilter);
      }

      return matches;
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const day = ('0' + dateObj.getDate()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  onChangeSelection(event: Event, data: any): void {
    const input = event.target as HTMLInputElement;
    data.sel = input.checked;
    data.addItem = input.checked;
    if (input.checked) {
      this.selectedReferenceArray.push(data);
      this.fetchReferenceItemList(data.id);
    } else {
      this.selectedReferenceArray = this.selectedReferenceArray.filter(
        (item: { id: number }) => item.id !== data.id
      );
      delete this.referenceWithItemsArr[data.id];
    }
  }

  fetchReferenceItemList(transactionId: number): void {
    this.transactionId = transactionId;
    this.transactionService
      .saveDetails(
        `${EndpointConstant.FILLREFERENCEITEMLIST}${transactionId}&voucherId=${this.voucherNo}`,
        {}
      )
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (response: any) => {
          this.referenceItemList = response?.data || [];
          this.referenceItemList.forEach((item: any) => (item.selected = true));
          this.referenceWithItemsArr[transactionId] = this.referenceItemList;
        },
        error: (error: any) => {
          console.error('Error fetching reference items:', error);
        },
      });
  }

  onChangeOverwriteOption(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.isOverwriteVoucher = input.checked;
  }

  importItems(): void {
    this.itemListArray = [];
    this.referenceVNoArray = [];
    
    Object.keys(this.referenceWithItemsArr).forEach((refID: string) => {
      const itemsArr = this.referenceWithItemsArr[refID] as any[];
      const referItemArr = itemsArr.filter((element: any) => element?.selected);
      this.itemListArray.push(...referItemArr);

      this.selectedReferenceArray = this.selectedReferenceArray.map(
        (item: any) => {
          if (item.id === Number(refID)) {
            item.refItems = referItemArr;
            if (!this.referenceVNoArray.includes(item.vNo)) {
              this.referenceVNoArray.push(item.vNo);
            }
          }
          return item;
        }
      );
    });

    const importData = {
      action: 'import',
      referenceList: this.selectedReferenceArray,
      referenceVNoList: this.referenceVNoArray,
      itemListArray: this.itemListArray,
      isOverwriteVoucher: this.isOverwriteVoucher,
    };
    
    this.itemService.importedResponse.set(this.itemListArray);
    
    if (typeof this.popupClose === 'function') {
      this.popupClose(importData);
    }
  }

  cancelItems(): void {
    if (typeof this.popupClose === 'function') {
      this.popupClose();
    }
  }

  handleOkbuttonkeydown(event: KeyboardEvent): void {
    if (
      event.key === 'Enter' &&
      document.activeElement === this.okButton.nativeElement
    ) {
      this.importItems();
    } else if (event.key === 'ArrowRight') {
      this.cancelbutton?.nativeElement.focus();
    }
  }

  handleCancelbuttonkeydown(event: KeyboardEvent): void {
    if (
      event.key === 'Enter' &&
      document.activeElement === this.cancelbutton.nativeElement
    ) {
      this.cancelItems();
    } else if (event.key === 'ArrowLeft') {
      this.okButton?.nativeElement.focus();
    }
  }

}