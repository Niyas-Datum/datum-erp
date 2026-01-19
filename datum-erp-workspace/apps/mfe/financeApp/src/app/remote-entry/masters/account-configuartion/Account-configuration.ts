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
    selector: 'app-account-configuration-Main',
    //eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    templateUrl: './Account-configuration.html',
    
  })
  export class AccountConfigurationComponent extends BaseComponent implements OnInit {
    @ViewChild('grid') grid?: GridComponent;
    private httpService = inject(FinanceAppService);
    accountConfigurationForm = this.formUtil.thisForm;
    accountConfigurationData = signal<any[]>([]);
    accountPopup = signal<any[]>([]);
    accountPopupLoaded = signal<boolean>(false);
    accountPopupLoading = signal<boolean>(false);
    editSettings: EditSettingsModel = {
      allowEditing: true,
      allowAdding: true,
      allowDeleting: true,
      mode: 'Normal' as any // cast because EditMode is not a runtime enum
    };
    isNewMode = signal<boolean>(false);
    isEditMode = signal<boolean>(false);

    payload: any[] = [];
    constructor() {
      super();
      this.commonInit();
    }
    ngOnInit(): void {
      this.onInitBase();
      this.SetPageType(2);
      
      // Subscribe to currentPageInfo$ to wait for it to be available
      this.serviceBase.dataSharingService.currentPageInfo$
        .pipe(
          filter(pageInfo => pageInfo && pageInfo.id !== undefined),
          take(1),
          takeUntilDestroyed(this.serviceBase.destroyRef)
        )
        .subscribe((pageInfo) => {
          this.currentPageInfo = pageInfo;
          console.log(this.currentPageInfo?.menuText);
          this.fetchAccountConfiguration();
          // Load account popup data after a small delay to avoid blocking initial render
          // Data will be ready when combobox opens
          setTimeout(() => {
            if (!this.accountPopupLoaded() && !this.accountPopupLoading()) {
              this.fetchAccountPopup();
            }
          }, 500);
        });
    }
    override onEditClick() {
      console.log('edit clicked');
      this.isEditMode.set(true);
    }
  
    fetchAccountConfiguration(): void {
      const pageId = this.currentPageInfo?.id;
      if (!pageId) {
        console.warn('pageId is missing in currentPageInfo:', this.currentPageInfo);
        return;
      }
      this.httpService.fetch<any>(EndpointConstant.FILLACCOUNTCONFIG)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (res) => {
            console.log('Account configuration full response:', res);
            console.log('Account configuration data:', res.data);
            
            // Check if res.data is an array
            if (Array.isArray(res.data)) {
              // Map API response data directly (already in camelCase format)
              const transformedData = res.data.map((item: any) => ({
                accID: item.accID,
                accountName: item.accountName || '',
                accountCode: item.accountCode || '',
                keyword: item.keyword || ''
              }));
              console.log('Transformed data:', transformedData);
              this.accountConfigurationData.set(transformedData);
            } else {
              console.warn('Response data is not an array:', res.data);
             // this.accountSortorderData.set([]);
            }
          },
          error: (error) => {
            console.error('Error fetching account sort order:', error);
           // this.accountSortorderData.set([]);
          }
        });
    }
    onActionComplete(args: any): void {
      // Update signal when grid data changes (after edit, add, delete)
      if (args.requestType === 'save' || args.requestType === 'delete' || args.requestType === 'add') {
        if (this.grid) {
          const updatedData = (this.grid as any).dataSource;
          if (Array.isArray(updatedData)) {
          //  this.accountSortorderData.set([...updatedData]);
          }
        }
      }
    }
    onAccountCodeChange(event: any, rowData: any): void {
      console.log('Account code changed:', event, rowData);
      console.log('Row data:', rowData);
      console.log('Event:', event);
      
      if (!event?.item) {
        console.warn('No item found in event');
        return;
      }
      
      // Create updated object with new account code and details
      const accountconfigurationdataobj = {
        accID: event.item.id || rowData.accID || null,
        accountName: event.item.accountName || rowData.accountName || '',
        accountCode: event.item.accountCode || '',
        keyword: rowData.keyword || ''
      };
      
      console.log('Account configuration data object:', accountconfigurationdataobj);
      
      // Update rowData directly (updates the grid automatically)
      Object.assign(rowData, accountconfigurationdataobj);
      
      // Update the grid data source signal by finding and replacing the matching row
      const currentData = this.accountConfigurationData();
      const updatedData = currentData.map((item: any) => {
        // Match by keyword to find the correct row
        if (item.keyword === rowData.keyword) {
          return accountconfigurationdataobj;
        }
        return item;
      });
      
      // Update the signal with the new data
      this.accountConfigurationData.set([...updatedData]);
      
      // Update payload for save - check if item already exists and update it, otherwise add new one
      const payloadItem = {
        keyword: rowData.keyword || '',
        account: {
          id: event.item.id || null,
          name: event.item.accountName || '',
          code: event.item.accountCode || '',
          description: event.item.description || ''
        }
      };
      
      // Find if payload already has an item with this keyword
      const existingIndex = this.payload.findIndex(
        (item: any) => item.keyword === rowData.keyword
      );
      
      if (existingIndex !== -1) {
        // Update existing item
        this.payload[existingIndex] = payloadItem;
      } else {
        // Add new item
        this.payload.push(payloadItem);
      }
      
      console.log('Updated grid data:', updatedData);
      console.log('Payload:', this.payload);
      
      // Refresh grid if needed
      if (this.grid) {
        setTimeout(() => {
          this.grid?.refresh();
        }, 0);
      }
    }
    fetchAccountPopup(): void {
      // Prevent multiple simultaneous loads
      if (this.accountPopupLoading()) {
        return;
      }
      
      // If already loaded, don't reload
      if (this.accountPopupLoaded()) {
        return;
      }

      const pageId = this.currentPageInfo?.id;
      if (!pageId) {
        console.warn('pageId is missing in currentPageInfo:', this.currentPageInfo);
        return;
      }

      this.accountPopupLoading.set(true);
      this.httpService.fetch<any>(EndpointConstant.FILLACCOUNTCONFIGPOPUP)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (res) => {
            console.log('Account popup response:', res);
            if (res.data && Array.isArray(res.data)) {
              this.accountPopup.set(res.data);
              this.accountPopupLoaded.set(true);
            } else {
              console.warn('Account popup data is not an array:', res.data);
              this.accountPopup.set([]);
            }
            this.accountPopupLoading.set(false);
          },
          error: (error) => {
            console.error('Error fetching account popup:', error);
            this.accountPopup.set([]);
            this.accountPopupLoading.set(false);
          }
        });
    }

    onAccountCodeComboOpen(): void {
      // Load data if not already loaded (fallback in case setTimeout didn't complete)
      if (!this.accountPopupLoaded() && !this.accountPopupLoading()) {
        if (this.currentPageInfo?.id) {
          this.fetchAccountPopup();
        }
      }
    }
    override FormInitialize() {
      console.log('form init started');
    }
  
    override SaveFormData(): void {
      console.log('Save clicked');
      const pageId = this.currentPageInfo?.id;
      if (!pageId) {
        alert('Page ID is missing. Cannot save.');
        return;
      }

      // Filter out invalid/null items from payload
      const validPayload = this.payload.filter((item: any) => {
        return item && 
               item.keyword && 
               item.account && 
               item.account.code && 
               item.account.id !== null &&
               item.account.id !== undefined;
      });

      console.log('Filtered payload to save:', validPayload);

      if (validPayload.length === 0) {
        alert('No valid data to save. Please ensure at least one row has a keyword and account.');
        return;
      }
  
      this.httpService.patch(EndpointConstant.UPDATEACCOUNTCONFIG, validPayload)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (res) => {
            console.log('Save response:', res);
            if (res.httpCode === 200 || res.httpCode === 201) {
              alert('Account configuration saved successfully');
              // Reset payload and refresh data
              this.payload = [];
              this.fetchAccountConfiguration();
              this.isEditMode.set(false);
            } else {
              alert(res.data || 'Error saving account configuration');
            }
          },
          error: (error) => {
            console.error('Error saving account configuration:', error);
            const errorMessage = error?.error?.message || error?.message || 'Error saving account configuration';
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
  