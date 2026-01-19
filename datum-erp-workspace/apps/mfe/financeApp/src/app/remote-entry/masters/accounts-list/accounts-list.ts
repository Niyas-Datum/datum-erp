import {
    Component,
    DestroyRef,
    ElementRef,
    inject,
    OnInit,
    signal,
    ViewChild,
    ChangeDetectorRef,
    HostListener,
  } from '@angular/core';
  import {
    FormBuilder,
    FormControl,
    FormGroup,
    Validators,
  } from '@angular/forms';
  import { FinanceAppService } from '../../http/finance-app.service';
  
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { EndpointConstant } from '@org/constants';
  import { registerLicense } from '@syncfusion/ej2-base';
  import { AlertDialogComponent } from '@org/ui';
  
  import { BaseComponent } from '@org/architecture';
  import { firstValueFrom } from 'rxjs';
  import { filter, take, takeUntil } from 'rxjs/operators';

  import { EditSettingsModel, GridComponent } from '@syncfusion/ej2-angular-grids';
import { ACCOUNTLIST, ACCOUNTPOPUP } from '../../model/paccountlistcomponent.model';
  
  
  @Component({
    //eslint-disable-next-line @angular-eslint/component-selector
    selector: 'app-accounts-list-Main',
    //eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    templateUrl: './accounts-list.html',
  //  styleUrls: ['./branch-accounts.css'],
  })
  export class AccountsListComponent extends BaseComponent implements OnInit {
    @ViewChild('accountGrid') accountGrid?: GridComponent;
    private httpService = inject(FinanceAppService);
    private cdr = inject(ChangeDetectorRef);
    private formBuilder = inject(FormBuilder);
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
    @ViewChild('dataTable', { static: false }) table!: ElementRef;
 
  @ViewChild('overlay') overlayElement!: ElementRef;

  token$: any;
  destroySubscription = takeUntilDestroyed(this.serviceBase.destroyRef);
  accountListForm!: FormGroup;
  isInputDisabled = true;

  isLoading = false;
  

  listDropdown = [] as Array<ACCOUNTLIST>;
  accountPopup = [] as Array<ACCOUNTPOPUP>;

  accountListData: any[] = [];
  accountPopupField = "alias";
  accountPopupKeys = ["Alias", "Name", "ID"];

  selected: any = [];

  
  pageId = 0;
  isEdit = true;
  isEditApproved = true;
  isHigherApproved = true;



  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(2);
    
    // Initialize form
    this.accountListForm = this.formBuilder.group({
      list: ["", Validators.required]
    });
    
    this.fetchListDropdown();
    this.fetchAccountDropdown();
  }



  fetchMenuDataPermissions(){
    // //let menuData = this.menudataService.getMenuDataFromStorage(Number(this.pageId));
    // this.isEdit = menuData.isEdit;
    // this.isEditApproved = menuData.isEditApproved;
    // this.isHigherApproved = menuData.isHigherApproved;
  }

  fetchListDropdown(): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLLISTDROPDOWN)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.listDropdown = response?.data;
         // console.log('List Dropdown',JSON.stringify(this.listDropdown,null,2));
        },
        error: (error) => {
          this.isLoading = false;
          console.error('An Error Occured', error);
        },
      });
  }

  fetchAccountDropdown(): void {
    this.httpService
      .fetch<any>(EndpointConstant.FILLLISTACCOUNTPOPUP)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.accountPopup = response?.data;
         // console.log('Account Popup',JSON.stringify(this.accountPopup,null,2));
        },
        error: (error) => {
          this.isLoading = false;
          console.error('An Error Occured', error);
        },
      });
  }

  onChangeList(event: any): void {
    console.log('we are in on change list function');
    console.log('Event', event);

    // Get value from event or form control (event.value is more reliable)
    const selectedListId = event?.value;
    console.log('Selected List Id', selectedListId);
    this.accountListData = [];
    this.httpService
      .fetch<any>(EndpointConstant.FILLACCOUNTSBYLISTID + selectedListId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const accountListResponse = response?.data;
          console.log('Account List Response',JSON.stringify(accountListResponse,null,2));
          accountListResponse.forEach((element: any) => {
            // Use accountID instead of id - id is the list-account relationship ID,
            // but we need the actual account ID for saving
            this.accountListData.push({
              "alias": element.alias,
              "name": element.name,
              "id": element.accountID || element.id  // Prefer accountID, fallback to id
            })
          });
          console.log('Account List Data',JSON.stringify(this.accountListData,null,2));

          this.accountListData = [...this.accountListData];
          if (accountListResponse.length > 0) {
            //this.isUpdate = true;
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('An Error Occured', error);
        },
      });
  }

  onClickEditAccountList(): boolean {
    if(!this.isEdit){
      alert('Permission Denied!');
      return false;
    }
    // Enable edit mode
    this.isInputDisabled = false;
    return true;
  }

  onClickSaveAccountList() {
    if (this.accountListForm.invalid) {
      for (const field of Object.keys(this.accountListForm.controls)) {
        const control: any = this.accountListForm.get(field);
        if (control.invalid) {
          alert('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }

    // Commit any pending edits in the grid before getting data
    if (this.accountGrid) {
      try {
        // Save any pending cell edit
        this.accountGrid.saveCell();
      } catch (e) {
        // Ignore if no cell is being edited
      }
    }

    // Use accountListData as the source of truth
    // Make a deep copy to avoid any reference issues
     const currentGridData = this.accountListData.map((item: any) => ({ ...item }));

    console.log('Account List Data length:', this.accountListData.length);
    console.log('Account List Data before filter', JSON.stringify(this.accountListData, null, 2));

    // Filter out any empty/invalid rows
    const validData = currentGridData.filter((item: any) => {
      // Keep rows that have a valid id (not 0) and a non-empty alias
      const isValid = item && 
                     item.id !== 0 && 
                     item.id !== null && 
                     item.id !== undefined &&
                     item.alias && 
                     item.alias.trim() !== '';
      return isValid;
    });

    console.log('Valid Data to Save (count:', validData.length, ')', JSON.stringify(validData, null, 2));

    if (validData.length === 0) {
      alert('No valid accounts to save');
      return false;
    }

    if (this.findDuplicateIds(validData)) {
      alert('Duplicate accounts exist');
      return false;
    }
    
    let listObj = {};
    if (this.accountListForm.value.list) {
      this.listDropdown.forEach(element => {
        if (element.id == this.accountListForm.value.list) {
          listObj = element;
        }
      });
    }
    console.log('List Object', JSON.stringify(listObj, null, 2));
    const payload = {
      "id": 1,
      "list": listObj,
      "accounts": validData
    };
    console.log('Payload', JSON.stringify(payload, null, 2));
    this.createCallback(payload);
    return true;
  }

  findDuplicateIds(accounts: any) {
    const seenIds = new Set();
    const duplicates = accounts.filter((account: any) => {
      if (seenIds.has(account.id)) {
        return true;
      } else {
        seenIds.add(account.id);
        return false;
      }
    });

    if (duplicates.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  createCallback(payload: any) {
    console.log('we are in create callback function');
    console.log('Payload', JSON.stringify(payload, null, 2));
    this.httpService.post(EndpointConstant.SAVEACCOUNTLIST, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Successfully saved Account list', response);
          // Disable edit mode after successful save
          this.isInputDisabled = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error saving Account list', error);
        },
      });
  }

  deleteAccount(accountId: any): void {
    console.log('we are in delete account function');
    console.log('Account Id', accountId);
    console.log('Account List Data',JSON.stringify(this.accountListData,null,2));
    if (!this.isInputDisabled) {
      if (confirm("Are you sure you want to delete this details?")) {
        const index = this.accountListData.findIndex(account => account.id === accountId);
        if (index !== -1) {
          this.accountListData.splice(index, 1);
          this.accountListData = [...this.accountListData];
          
          // Refresh grid
          if (this.accountGrid) {
            setTimeout(() => {
              this.accountGrid?.refresh();
            }, 0);
          }
        }
      }
    }
  }

  containsAccount(accountId: number): boolean {
    return this.accountListData.some(account => account.id === accountId);
  }
  onAccountPopupSelected(option: string, rowIndex: number): any {
    console.log('we are in on account popup selected function');
    console.log('Option', option);
    console.log('Row Index', rowIndex);
    console.log('Account List Data',JSON.stringify(this.accountListData,null,2));
    let selectedAccount = {
      "alias": "",
      "name": "",
      "id": 0
    };
    
    if (option) {
      this.accountPopup.forEach(item => {
        if (item.alias === option) {
          selectedAccount = {
            "alias": item.alias,
            "name": item.name,
            "id": item.id
          };
        }
      });
    }
    
    // If adding new row (rowIndex equals length), push new item
    if (rowIndex === this.accountListData.length) {
      this.accountListData.push(selectedAccount);
    } else {
      // Otherwise update existing row
      this.accountListData[rowIndex] = selectedAccount;
    }
    
    this.accountListData = [...this.accountListData];
    
    // Refresh grid
    if (this.accountGrid) {
      setTimeout(() => {
        this.accountGrid?.refresh();
      }, 0);
    }
  }

  onAccountAliasChange(event: any, rowData: any): void {
    console.log('we are in on account alias change function');
    console.log('Event', event);
    console.log('Row Data', rowData);
    if (!event?.item) {
      return;
    }
    
    // Get the selected account from event.item (it already has the data we need)
    const selectedAccount = event.item;
    
    // Find the row in accountListData array
    // Try to find by reference first, then by matching properties for new rows
    let rowIndex = this.accountListData.findIndex((item: any) => item === rowData);
    
    // If not found by reference, try to find by matching empty new row properties
    if (rowIndex === -1) {
      rowIndex = this.accountListData.findIndex((item: any) => {
        // Match new rows (id: 0, empty alias) or match by current rowData properties
        return (item.id === 0 && item.alias === '' && item.name === '') ||
               (item.id === rowData.id && item.alias === rowData.alias && item.name === rowData.name);
      });
    }
    
    // If still not found, it's likely the last added row (new row)
    if (rowIndex === -1 && this.accountListData.length > 0) {
      // Check if the last item is a new empty row
      const lastItem = this.accountListData[this.accountListData.length - 1];
      if (lastItem.id === 0 && lastItem.alias === '' && lastItem.name === '') {
        rowIndex = this.accountListData.length - 1;
      }
    }
    
    // Update the array item directly
    if (rowIndex !== -1) {
      // Update the item in the array
      this.accountListData[rowIndex] = {
        alias: selectedAccount.alias,
        name: selectedAccount.name,
        id: selectedAccount.id
      };
      
      // Also update rowData for grid display
      rowData.alias = selectedAccount.alias;
      rowData.name = selectedAccount.name;
      rowData.id = selectedAccount.id;
    } else {
      // If not found, add as new row
      this.accountListData.push({
        alias: selectedAccount.alias,
        name: selectedAccount.name,
        id: selectedAccount.id
      });
      rowIndex = this.accountListData.length - 1;
    }
    
    // Create a new array reference to trigger Angular change detection
    this.accountListData = [...this.accountListData];
    console.log('Account List Data after update', JSON.stringify(this.accountListData, null, 2));
    console.log('Row Index', rowIndex);
    
    // Update the grid
    if (this.accountGrid && rowIndex !== -1) {
      setTimeout(() => {
        // Use updateRow to update the specific row in the grid
        const updatedRow = this.accountListData[rowIndex];
        this.accountGrid?.updateRow(rowIndex, updatedRow);
        // Also trigger change detection
        this.cdr.detectChanges();
      }, 0);
    } else if (this.accountGrid) {
      // Fallback: refresh the entire grid
      setTimeout(() => {
        this.accountGrid?.refresh();
        this.cdr.detectChanges();
      }, 0);
    }
  }

  onGridActionComplete(args: any): void {
    // Handle grid action complete if needed
    if (args.requestType === 'save') {
      // Data has been saved in the grid
      this.accountListData = [...this.accountListData];
    }
  }

  onAddRow(): void {
    if (this.isInputDisabled) {
      return; // Don't add row if not in edit mode
    }

    // Add a new empty row
    const newRow = {
      alias: '',
      name: '',
      id: 0
    };

    this.accountListData.push(newRow);
    this.accountListData = [...this.accountListData];

    // Refresh grid
    if (this.accountGrid) {
      setTimeout(() => {
        this.accountGrid?.refresh();
      }, 0);
    }
  }

            @HostListener('document:keydown', ['$event'])
            handleKeyboardEvent(event: KeyboardEvent) {
                if (event.key === 'Delete' && this.selected.length > 0) {
                //this.deleteAccount(this.selected[0].id);
                }
            }



 



 


    // Destroy DataTables when the component is destroyed
    // if ($.fn.DataTable.isDataTable(this.table?.nativeElement)) {
    //   $(this.table.nativeElement).DataTable().destroy();
    // }
  
}
