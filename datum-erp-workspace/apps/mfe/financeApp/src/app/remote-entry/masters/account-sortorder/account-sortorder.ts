import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { registerLicense } from '@syncfusion/ej2-base';
import { AlertDialogComponent } from '@org/ui';

import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { FinanceAppService } from '../../http/finance-app.service';
import { EditSettingsModel, GridComponent } from '@syncfusion/ej2-angular-grids';

@Component({
  //eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-account-sortorder-Main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './account-sortorder.html',
  styleUrls: ['./account-sortorder.css'],
})
export class AccountSortorderComponent extends BaseComponent implements OnInit {
  @ViewChild('grid') grid?: GridComponent;
  private httpService = inject(FinanceAppService);
  accountSortorderForm = this.formUtil.thisForm;
  accountSortorderData = signal<any[]>([]);
  editSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Normal' as any // cast because EditMode is not a runtime enum
  };
  isNewMode = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  constructor() {
    super();
    this.commonInit();
  }
  ngOnInit(): void {
    console.log('Account Sort Order Component - ngOnInit called');
    this.onInitBase();
    this.SetPageType(2);
    
    // Subscribe to currentPageInfo$ - BehaviorSubject will emit current value immediately
    this.serviceBase.dataSharingService.currentPageInfo$
      .pipe(
        filter(pageInfo => pageInfo && pageInfo.id !== undefined),
        take(1),
        takeUntilDestroyed(this.serviceBase.destroyRef)
      )
      .subscribe((pageInfo) => {
        this.currentPageInfo = pageInfo;
        console.log('Account Sort Order - PageInfo received:', this.currentPageInfo?.menuText, 'PageId:', this.currentPageInfo?.id);
        this.fetchAccountSortorder();
      });
    
    console.log('Account Sort Order Component - Subscribed to currentPageInfo$');
  }
  
  fetchAccountSortorder(): void {
    const pageId = this.currentPageInfo?.id;
    if (!pageId) {
      console.warn('Account Sort Order - pageId is missing in currentPageInfo:', this.currentPageInfo);
      console.warn('Account Sort Order - Component will render but data will not load until pageId is available');
      // Don't return - let the component render with empty data
      this.accountSortorderData.set([]);
      return;
    }
    console.log('Account Sort Order - Fetching data for pageId:', pageId);
    this.httpService.fetch<any>(EndpointConstant.FILLACCOUNTSORTORDER + pageId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          console.log('Account sortorder full response:', res);
          console.log('Account sortorder data:', res.data);
          
          // Check if res.data is an array
          if (Array.isArray(res.data)) {
            // Transform API data to match grid field names (convert to camelCase)
            const transformedData = res.data.map((item: any) => ({
              id: item.ID,
              accountCode: item.AccountCode,
              accountName: item.AccountName,
              Parent: item.Parent || '',
              GroupOrder: item.GroupOrder || '',
              NewOrder: item.NewOrder || '',
              IsGroup: item.IsGroup
            }));
            console.log('Transformed data:', transformedData);
            this.accountSortorderData.set(transformedData);
          } else {
            console.warn('Response data is not an array:', res.data);
            this.accountSortorderData.set([]);
          }
        },
        error: (error) => {
          console.error('Error fetching account sort order:', error);
          this.accountSortorderData.set([]);
        }
      });
  }
  onActionComplete(args: any): void {
    // Update signal when grid data changes (after edit, add, delete)
    if (args.requestType === 'save' || args.requestType === 'delete' || args.requestType === 'add') {
      if (this.grid) {
        const updatedData = (this.grid as any).dataSource;
        if (Array.isArray(updatedData)) {
          this.accountSortorderData.set([...updatedData]);
        }
      }
    }
  }

  override FormInitialize() {
    console.log('form init started');
  }

  onSaveClick(): void {
    const pageId = this.currentPageInfo?.id;
    if (!pageId) {
      alert('Page ID is missing. Cannot save.');
      return;
    }

    // Get the latest data from the grid if available, otherwise use signal data
    let gridData = this.accountSortorderData();

    if (this.grid) {
      // Try to get updated data from grid
      try {
        const gridDataSource = (this.grid as any).dataSource;
        if (gridDataSource && Array.isArray(gridDataSource)) {
          gridData = gridDataSource;
        }
      } catch (e) {
        console.warn('Could not get data from grid, using signal data');
      }
    }
    
    console.log('Saving account sort order data:', gridData);

    // Update signal with latest data
    this.accountSortorderData.set([...gridData]);
    
    // Construct payload with grid data
    // Transform grid data to match API expected format
    const payload ={
      pageId: pageId,
      id:  0,
      sortField: 0
    };

    console.log('Payload to save:', payload);

    this.httpService.patch(EndpointConstant.SAVEACCOUNTSORTORDER, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          console.log('Save response:', res);
          if (res.httpCode === 200 || res.httpCode === 201) {
            alert('Account sort order saved successfully');
            // Optionally refresh the data
            this.fetchAccountSortorder();
          } else {
            alert(res.data || 'Error saving account sort order');
          }
        },
        error: (error) => {
          console.error('Error saving account sort order:', error);
          const errorMessage = error?.error?.message || error?.message || 'Error saving account sort order';
          alert(errorMessage);
        }
      });
  }

  override getDataById(data: any) {
    console.log('data', data);
  }

  override DeleteData(data: any) {
    console.log('deleted');
  }

  override formValidationError() {
    console.log('form error found');
  }
}
