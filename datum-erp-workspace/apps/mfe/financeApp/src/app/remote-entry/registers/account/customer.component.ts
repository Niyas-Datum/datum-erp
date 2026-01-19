import {
    Component,
    inject,
    OnInit,
    signal,
    ViewChild,
    AfterViewInit,
  } from '@angular/core';
  import { BaseComponent } from '@org/architecture';
  import { FinanceAppService } from '../../http/finance-app.service';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { EndpointConstant } from '@org/constants';
  import { EditService } from '@syncfusion/ej2-angular-grids';
import { FormControl, FormGroup } from '@angular/forms';
import { MultiColumnComboBoxComponent } from '@syncfusion/ej2-angular-multicolumn-combobox';
  
  @Component({
    selector: 'app-cheque-register',
    //eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    templateUrl: './customer.component.html',
    providers: [EditService],
  })
  export class CustomerComponent extends BaseComponent implements OnInit,AfterViewInit{
    @ViewChild('accountCombo') accountCombo?: MultiColumnComboBoxComponent;
    fillaccountpopupData = signal<any[]>([]);
    customerForm = this.formUtil.thisForm;
    private httpService = inject(FinanceAppService);
    fillcategoryData = signal<any[]>([]);
    isLoading = signal<boolean>(false);
    editSettings = { allowEditing: false, allowAdding: false, allowDeleting: false };
    customerData = signal<any[]>([]);
    constructor() {
        super();
        this.commonInit();
    }
    ngOnInit(): void {
      this.onInitBase();
      this.SetPageType(2);
      this.loadInitData();
      
      console.log("pageid",this.currentPageInfo?.menuText);
    }

    ngAfterViewInit(): void {
      // Ensure account data is loaded after view initialization
      if (this.fillaccountpopupData().length === 0) {
        this.loadaccountData();
      }
    }
    
   
  
    override FormInitialize() {
      this.customerForm = new FormGroup({
        Account: new FormControl({ value: '', disabled: false }),
        category: new FormControl({ value: '', disabled: false }),
        address: new FormControl({ value: '', disabled: false }),
        city: new FormControl({ value: '', disabled: false }),
        
      });
      console.log('form init started');
    }
    onSearchClick() {
      console.log('Clear button clicked');
      this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERREGISTER)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Customer response:', response);
          const transformedData = this.transformDataToLowercase(response?.data || []);
          this.customerData.set(transformedData);
        },
        error: (error) => {
          console.error('Error fetching customer data:', error);
        }
      });

      // Clear form and data
      this.customerForm.reset();
      
      // Reload account data to ensure multicolumncombobox has data available
      this.loadaccountData();
   
    }
    
    onActionComplete(args: any) {
      // Handle grid actions if needed
      console.log('Grid action completed:', args);
    }
    
    loadInitData() {
      this.loadCategoryData();
      this.loadaccountData();
      
    }

    loadaccountData() {
      this.httpService.fetch<any>(EndpointConstant.FILLACCOUNTACCOUNTPOPUP)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Account data response:', response?.data);
          const accountData = response?.data || [];
          // Update signal - this will trigger Angular change detection
          this.fillaccountpopupData.set([...accountData]);
          
          // If component exists, ensure it has the updated data
          if (this.accountCombo) {
            setTimeout(() => {
              if (this.accountCombo && accountData.length > 0) {
                // Update dataSource directly to ensure component refreshes
                this.accountCombo.dataSource = accountData;
              }
            }, 100);
          }
        },
        error: (error) => {
          console.error('Error loading account data:', error);
        }
      });
    }

    // Handle account multicolumncombobox change event
    onAccountChange(event: any) {
      console.log('Account change event:', event);
      // If value is cleared and data is empty, reload account data
      if ((!event || !event.value || event.value === null || event.value === '') && 
          this.fillaccountpopupData().length === 0) {
        console.log('Account cleared and data empty, reloading account data...');
        this.loadaccountData();
      }
    }
    loadCategoryData() {
        this.httpService.fetch<any>(EndpointConstant.FILLCATEGORY)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            const flatcategory = Array.isArray(response.data) && Array.isArray(response.data[0])
            ? response.data[0]
            : response.data;
            console.log('Category response:', flatcategory);
            this.fillcategoryData.set(flatcategory);
          }
        });
      // TODO: Replace with actual endpoint for cheque type data
      // For now, setting empty array
      
    }
    

    // Helper function to transform API response keys to lowercase for grid compatibility
    private transformDataToLowercase(data: any[]): any[] {
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map(item => {
        const transformed: any = {};
        Object.keys(item).forEach(key => {
          // Convert PascalCase to all lowercase (e.g., AccountCode -> accountcode)
          const lowerKey = key.toLowerCase();
          transformed[lowerKey] = item[key];
        });
        return transformed;
      });
    }

    onClickGo() {
      // Show loading
      this.isLoading.set(true);

      // Get values from form
      const account = this.customerForm.get('Account')?.value || '';
      const category = this.customerForm.get('category')?.value || '';
      const address = this.customerForm.get('address')?.value || '';
      const city = this.customerForm.get('city')?.value || '';
      const pageId = this.currentPageInfo?.id || '';

      // Check if all form fields are empty
      const hasFormValues = account || category || (address && address.trim() !== '') || (city && city.trim() !== '');

      // If no form fields are filled, use the base endpoint
      if (!hasFormValues) {
        console.log('No form fields filled, using base endpoint');
        this.httpService.fetch<any>(EndpointConstant.FILLCUSTOMERREGISTER)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            console.log('Customer response:', response);
            const transformedData = this.transformDataToLowercase(response?.data || []);
            this.customerData.set(transformedData);
            console.log('Customer data:', this.customerData());
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error fetching customer data:', error);
            this.isLoading.set(false);
          }
        });
        return;
      }

      // Build query parameters only for non-empty values
      const queryParams: string[] = [];
      
      // Always include PartyType=c (base parameter)
      queryParams.push('PartyType=c');
      
      // Add pageId if available
      if (pageId) {
        queryParams.push(`pageId=${pageId}`);
      }
      
      // Add AccountID if account is not empty
      if (account) {
        queryParams.push(`AccountID=${account}`);
      }
      
      // Add PartyCategory if category is not empty
      if (category) {
        queryParams.push(`PartyCategory=${category}`);
      }
      
      // Add address if not empty
      if (address && address.trim() !== '') {
        queryParams.push(`address=${encodeURIComponent(address.trim())}`);
      }
      
      // Add city if not empty
      if (city && city.trim() !== '') {
        queryParams.push(`city=${encodeURIComponent(city.trim())}`);
      }

      // Build custom endpoint with all parameters
      const baseUrl = 'api/v1/fn/customerregister/Cureg';
      const endpoint = `${baseUrl}?${queryParams.join('&')}`;

      console.log('API Endpoint:', endpoint);

      // Call API
      this.httpService.fetch<any>(endpoint)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Customer response:', response);
          const transformedData = this.transformDataToLowercase(response?.data || []);
          this.customerData.set(transformedData);
          console.log('Customer data:', this.customerData());
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching customer data:', error);
          this.isLoading.set(false);
        }
      });
    }

    onPrint() {
      // TODO: Implement print functionality
      console.log('Print clicked');
    }

    onPreview() {
      // TODO: Implement preview functionality
      console.log('Preview clicked');
    }

    onExcel() {
      // TODO: Implement Excel export functionality
      console.log('Excel clicked');
    }

    onEmail() {
      // TODO: Implement email functionality
      console.log('Email clicked');
    }
  }