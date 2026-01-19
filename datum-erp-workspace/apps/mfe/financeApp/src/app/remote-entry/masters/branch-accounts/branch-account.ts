import {
    Component,
    DestroyRef,
    ElementRef,
    inject,
    OnInit,
    signal,
    ViewChild,
    ChangeDetectorRef,
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
    selector: 'app-branch-accounts-Main',
    //eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    templateUrl: './branch-accounts.html',
    styleUrls: ['./branch-accounts.css'],
  })
  export class BranchAccounts extends BaseComponent implements OnInit {
    @ViewChild('grid') grid?: GridComponent;
    private httpService = inject(FinanceAppService);
    private cdr = inject(ChangeDetectorRef);
    BranchAccountForm = this.formUtil.thisForm;
    branchAccountsData = signal<any[]>([]);
    originalData = signal<any[]>([]); // Store original data to track changes
    branchNames = signal<string[]>([]);
    searchTerm = signal<string>('');
    filteredData = signal<any[]>([]);
    editSettings: EditSettingsModel = {
      allowEditing: true,
      allowAdding: false,
      allowDeleting: false,
      mode: 'Normal' as any // cast because EditMode is not a runtime enum
    };
    isNewMode = signal<boolean>(false);
    isEditMode = signal<boolean>(false);
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
          this.fetchBranchAccounts();
        });
    }
    
    fetchBranchAccounts(): void {
      const pageId = this.currentPageInfo?.id;
      if (!pageId) {
        console.warn('pageId is missing in currentPageInfo:', this.currentPageInfo);
        return;
      }
      this.httpService.fetch<any>(EndpointConstant.FILLBRANCHACCOUNTS)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (res) => {
            console.log('Branch accounts full response:', res);
            console.log('Branch accounts data:', res.data);
            
            // Check if res.data is an array
            if (Array.isArray(res.data) && res.data.length > 0) {
              // Extract branch names from first item (fields with "True"/"False" values, excluding ID fields)
              const firstItem = res.data[0];
              const branchNamesList: string[] = [];
              
              Object.keys(firstItem).forEach(key => {
                // Include fields that have "True"/"False" string values and exclude ID fields
                if (key !== 'ID' && key !== 'IsGroup' && key !== 'AccountCode' && key !== 'AccountName' && 
                    !key.endsWith('ID') && (firstItem[key] === 'True' || firstItem[key] === 'False')) {
                  branchNamesList.push(key);
                }
              });
              
              this.branchNames.set(branchNamesList);
              console.log('Branch names:', branchNamesList);
              
              // Transform API data: convert "True"/"False" strings to booleans, keep ID mappings
              const transformedData = res.data.map((item: any) => {
                const transformed: any = {
                  id: item.ID,
                  accountCode: item.AccountCode,
                  accountName: item.AccountName,
                  isGroup: item.IsGroup === '1' || item.IsGroup === 1
                };
                
                // Add branch checkboxes (convert "True"/"False" to boolean)
                branchNamesList.forEach(branchName => {
                  transformed[branchName] = item[branchName] === 'True' || item[branchName] === true;
                  // Store the ID for this branch (for saving later)
                  const branchIdKey = branchName + 'ID';
                  if (item[branchIdKey]) {
                    transformed[branchIdKey] = item[branchIdKey];
                  }
                });
                
                return transformed;
              });
              
              console.log('Transformed data:', transformedData);
              this.branchAccountsData.set(transformedData);
              // Store original data for change tracking
              this.originalData.set(JSON.parse(JSON.stringify(transformedData)));
              this.filteredData.set(transformedData);
            } else {
              console.warn('Response data is not an array or is empty:', res.data);
              this.branchAccountsData.set([]);
              this.filteredData.set([]);
              this.branchNames.set([]);
            }
          },
          error: (error) => {
            console.error('Error fetching branch accounts:', error);
            this.branchAccountsData.set([]);
            this.filteredData.set([]);
            this.branchNames.set([]);
          }
        });
    }


    
    updateFilter(event: any): void {
      const searchValue = event.target.value.toLowerCase();
      this.searchTerm.set(searchValue);
      
      if (!searchValue) {
        this.filteredData.set(this.branchAccountsData());
        return;
      }
      
      const filtered = this.branchAccountsData().filter(item => 
        item.accountCode?.toLowerCase().includes(searchValue) ||
        item.accountName?.toLowerCase().includes(searchValue)
      );
      
      this.filteredData.set(filtered);
    }
    onActionComplete(args: any): void {
      // Update signal when grid data changes (after checkbox changes)
      if (args.requestType === 'save') {
        if (this.grid) {
          const updatedData = (this.grid as any).dataSource;
          if (Array.isArray(updatedData)) {
            this.branchAccountsData.set([...updatedData]);
            // Reapply filter if search is active
            if (this.searchTerm()) {
              this.updateFilter({ target: { value: this.searchTerm() } });
            } else {
              this.filteredData.set([...updatedData]);
            }
          }
        }
      }
    }
    
    onBranchCheckboxChange(branchName: string, rowData: any, event: any): void {
      const checked = event.checked;
      
      // Update data directly - mutate in place for better performance
      // Update in branchAccountsData (source of truth)
      const currentData = this.branchAccountsData();
      const index = currentData.findIndex(item => item.id === rowData.id);
      if (index !== -1) {
        currentData[index][branchName] = checked;
      }
      
      // Update filtered data (what grid displays) - mutate in place
      const filtered = this.filteredData();
      const filteredIndex = filtered.findIndex(item => item.id === rowData.id);
      if (filteredIndex !== -1) {
        // Update the data directly
        filtered[filteredIndex][branchName] = checked;
        
        // Update grid dataSource directly (same reference) - this is the key optimization
        // The grid uses the same data reference, so no full re-render needed
        if (this.grid) {
          const gridDataSource = (this.grid as any).dataSource;
          if (Array.isArray(gridDataSource) && gridDataSource === filtered) {
            // DataSource is already the same reference, just update the value
            // No need to update signal or refresh grid
            return; // Exit early - data is already updated
          } else if (Array.isArray(gridDataSource)) {
            const gridRowIndex = gridDataSource.findIndex((item: any) => item.id === rowData.id);
            if (gridRowIndex !== -1) {
              gridDataSource[gridRowIndex][branchName] = checked;
            }
          }
        }
        
        // Only update signal if grid dataSource is different reference
        // This minimizes re-renders
        this.filteredData.set(filtered);
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
      let gridData = this.branchAccountsData();

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
      
      console.log('Saving branch accounts data:', gridData);
      console.log('Original data:', this.originalData());

      // Find accounts that have been modified (checkbox changes)
      const branchNamesList = this.branchNames();
      const originalData = this.originalData();
      const modifiedAccounts = new Set<number>(); // Track account IDs that have changes
      
      // Compare current data with original data to find changes
      gridData.forEach((currentItem: any) => {
        const accountID = parseInt(currentItem.id, 10) || 0;
        const originalItem = originalData.find((orig: any) => orig.id === currentItem.id);
        
        if (!originalItem) {
          // New item, mark as modified
          modifiedAccounts.add(accountID);
        } else {
          // Check if any branch checkbox has changed
          let hasChanges = false;
          branchNamesList.forEach((branchName: string) => {
            const currentValue = currentItem[branchName] || false;
            const originalValue = originalItem[branchName] || false;
            
            if (currentValue !== originalValue) {
              hasChanges = true;
              modifiedAccounts.add(accountID);
            }
          });
        }
      });
      
      console.log('Modified account IDs:', Array.from(modifiedAccounts));
      console.log('Total modified accounts:', modifiedAccounts.size);

      // Transform only modified accounts to API format
      const payload: { accountID: number; branchID: number[]; isBit: number }[] = [];

      // Only process accounts that have been modified
      gridData.forEach((accountItem: any) => {
        const accountID = parseInt(accountItem.id, 10) || 0;
        
        // Skip if this account hasn't been modified
        if (!modifiedAccounts.has(accountID)) {
          return;
        }
        
        const checkedBranchIDs: number[] = [];
        
        // Collect all checked branch IDs for this modified account
        // Only send branches that are currently checked
        branchNamesList.forEach((branchName: string) => {
          const branchIdKey = branchName + 'ID';
          const branchId = accountItem[branchIdKey];
          
          // Only include checked branches (isBit = 1)
          if (branchId && accountItem[branchName] === true) {
            checkedBranchIDs.push(parseInt(branchId, 10) || 0);
          }
        });
        
        // Create payload item for modified account with all checked branches
        // Note: Backend should handle unchecking branches that are not in the list
        if (checkedBranchIDs.length > 0) {
          const payloadItem = {
            "accountID": accountID,
            "branchID": checkedBranchIDs,
            "isBit": 1
          };
          
          payload.push(payloadItem);
        } else {
          // If no branches are checked, send empty array to clear all branches for this account
          const payloadItem = {
            "accountID": accountID,
            "branchID": [],
            "isBit": 1
          };
          
          payload.push(payloadItem);
        }
      });

      // Print payload in readable format matching your structure
      console.log('=== Payload Before Update ===');
      console.log('Total modified accounts to update:', payload.length);
      if (payload.length === 0) {
        console.log('No changes detected. Nothing to update.');
        alert('No changes detected. Nothing to update.');
        return;
      }
      console.log('\n--- Payload Array (JSON Format) ---');
      console.log(JSON.stringify(payload, null, 2));
      
      console.log('\n--- Payload Items (Individual Structure) ---');
      payload.forEach((item, index) => {
        console.log(`\nAccount ${index + 1}:`);
        console.log(JSON.stringify(item, null, 2));
        console.log(`  accountID: ${item.accountID}`);
        console.log(`  branchID: [${item.branchID.join(', ')}] (${item.branchID.length} branches)`);
        console.log(`  isBit: ${item.isBit}`);
      });
      
      console.log('\n=== End of Payload ===');

      // API expects array directly, not wrapped in object
      // Based on Postman testing: sending array directly works
      console.log('Request payload (array):', JSON.stringify(payload, null, 2));
      console.log('Endpoint:', EndpointConstant.SAVEBRANCHACCOUNTS);
      console.log('Sending', payload.length, 'account(s) for update');

      this.httpService.patch<any>(EndpointConstant.SAVEBRANCHACCOUNTS, payload)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (res) => {
            console.log('=== Save Response ===');
            console.log('Full response:', JSON.stringify(res, null, 2));
            console.log('HTTP Code:', res?.httpCode);
            console.log('Response data:', res?.data);
            console.log('Is Valid:', res?.isValid);
            
            if (res && (res.httpCode === 200 || res.httpCode === 201)) {
              console.log('Update successful! Refreshing data from server...');
              
              // Update original data to current data after successful save
              // This ensures change detection works correctly
              const updatedOriginalData = JSON.parse(JSON.stringify(gridData));
              this.originalData.set(updatedOriginalData);
              
              // Refresh the data from server to ensure UI matches database
              // Using a small delay to ensure database transaction is committed
              setTimeout(() => {
                console.log('Fetching updated data from server...');
                this.fetchBranchAccounts();
              }, 300);
              
              alert('Branch accounts saved successfully');
            } else {
              const errorMsg = res?.data || res?.exception || 'Error saving branch accounts';
              console.error('Save failed:', errorMsg);
              alert(errorMsg);
            }
          },
          error: (error) => {
            console.error('Error saving branch accounts:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            console.error('Validation errors:', error?.error?.errors);
            
            // Extract validation error messages
            let errorMessage = 'Error saving branch accounts';
            if (error?.error?.errors) {
              const errors = error.error.errors;
              const errorMessages: string[] = [];
              
              // Check for branchAccountsDto errors
              if (errors.branchAccountsDto && Array.isArray(errors.branchAccountsDto)) {
                errorMessages.push(...errors.branchAccountsDto);
              }
              
              // Check for $ errors (root level)
              if (errors.$ && Array.isArray(errors.$)) {
                errorMessages.push(...errors.$);
              }
              
              if (errorMessages.length > 0) {
                errorMessage = errorMessages.join('\n');
              } else {
                errorMessage = error?.error?.title || error?.error?.message || errorMessage;
              }
            } else if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.message) {
              errorMessage = error.message;
            }
            
            alert(errorMessage);
          }
        });
    }
    
    onCloseClick(): void {
      // Close or navigate back - implement based on your routing
      console.log('Close clicked');
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
  