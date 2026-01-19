import {
    Component,
    inject,
    OnInit,
    signal,
  } from '@angular/core';
  import { BaseComponent } from '@org/architecture';
  import { FinanceAppService } from '../../http/finance-app.service';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { EndpointConstant } from '@org/constants';
  import { EditService } from '@syncfusion/ej2-angular-grids';
import { FormControl, FormGroup } from '@angular/forms';
  
  @Component({
    selector: 'app-cheque-register',
    //eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    templateUrl: './cheque-register.component.html',
    providers: [EditService],
  })
  export class ChequeRegisterComponent extends BaseComponent implements OnInit{
    chequeRegisterForm = this.formUtil.thisForm;
    private httpService = inject(FinanceAppService);
    filltypeData = signal<any[]>([]);
    fillstatusData = signal<any[]>([]);
    isLoading = signal<boolean>(false);
    chequeRegisterData = signal<any[]>([]);
    editSettings = { allowEditing: false, allowAdding: false, allowDeleting: false };
    statusDefaultValue: any = null;
    
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
    
    isChequeDateValue() {
      return this.chequeRegisterForm.get('dateType')?.value === 'chequeDate' || 
             (this.chequeRegisterForm.get('dateType')?.value === '' && true);
    }
    
    isVoucherDateValue() {
      return this.chequeRegisterForm.get('dateType')?.value === 'voucherDate';
    }
    
    onChequeDateChange(_event: unknown) {
      this.chequeRegisterForm.get('dateType')?.setValue('chequeDate');
    }
    
    onVoucherDateChange(_event: unknown) {
      this.chequeRegisterForm.get('dateType')?.setValue('voucherDate');
    }
  
    override FormInitialize() {
      this.chequeRegisterForm = new FormGroup({
        dateType: new FormControl({ value: 'chequeDate', disabled: false }),
        from: new FormControl({ value: '', disabled: false }),
        to: new FormControl({ value: '', disabled: false }),
        bank: new FormControl({ value: '', disabled: false }),
        chequeNo: new FormControl({ value: '', disabled: false }),
        type: new FormControl({ value: '', disabled: false }),
        status: new FormControl({ value: '', disabled: false }),
        autoId: new FormControl({ value: '', disabled: false }),
        statusOn: new FormControl({ value: '', disabled: false }),
      });
      console.log('form init started');
    }
    onSearchClick() {
      console.log('Clear button clicked');
      // Clear form and data
      this.chequeRegisterForm.reset();
      this.chequeRegisterForm.get('dateType')?.setValue('chequeDate');
      this.chequeRegisterForm.get('status')?.setValue('all');
      this.chequeRegisterData.set([]);
    }
    
    onActionComplete(args: any) {
      // Handle grid actions if needed
      console.log('Grid action completed:', args);
    }
    
    loadInitData() {
      this.loadTypeData();
      this.loadStatusData();
    }
    
    loadTypeData() {
      // TODO: Replace with actual endpoint for cheque type data
      // For now, setting empty array
      this.filltypeData.set([]);
    }
    
    loadStatusData() {
      // Set default status options with "All" as default
      const statusOptions = [
        { id: 'all', name: 'All' },
        { id: 'pending', name: 'Pending' },
        { id: 'cleared', name: 'Cleared' },
        { id: 'bounced', name: 'Bounced' }
      ];
      this.fillstatusData.set(statusOptions);
      // Set default value to "All"
      this.statusDefaultValue = 'all';
      // Set default value after form is initialized
      setTimeout(() => {
        if (this.chequeRegisterForm.get('status')) {
          this.chequeRegisterForm.get('status')?.setValue('all');
        }
      }, 0);
    }
    // Simple function to format date to YYYY-MM-DD
    formatDate(date: any): string {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    onClickGo() {
      // Validate required fields
      const fromDate = this.chequeRegisterForm.get('from')?.value;
      const toDate = this.chequeRegisterForm.get('to')?.value;
      
      if (!fromDate || !toDate) {
        alert('Please select From and To dates');
        return;
      }

      // Show loading
      this.isLoading.set(true);
      this.chequeRegisterData.set([]);

      // Get values from form
      const formattedFromDate = this.formatDate(fromDate);
      const formattedToDate = this.formatDate(toDate);
      const dateType = this.chequeRegisterForm.get('dateType')?.value || 'chequeDate';
      const bank = this.chequeRegisterForm.get('bank')?.value || '';
      const chequeNo = this.chequeRegisterForm.get('chequeNo')?.value || '';
      const type = this.chequeRegisterForm.get('type')?.value || '';
      const status = this.chequeRegisterForm.get('status')?.value || '';
      const autoId = this.chequeRegisterForm.get('autoId')?.value || '';
      const statusOn = this.chequeRegisterForm.get('statusOn')?.value ? this.formatDate(this.chequeRegisterForm.get('statusOn')?.value) : '';

      // Build URL with parameters
      // TODO: Replace with actual cheque register endpoint
      let url = `${EndpointConstant.FILLFINANCEREGISTER}DateFrom=${formattedFromDate}&DateUpto=${formattedToDate}`;
      
      if (dateType) {
        url += `&DateType=${dateType}`;
      }
      if (bank) {
        url += `&Bank=${bank}`;
      }
      if (chequeNo) {
        url += `&ChequeNo=${chequeNo}`;
      }
      if (type) {
        url += `&Type=${type}`;
      }
      if (status && status !== 'all') {
        url += `&Status=${status}`;
      }
      if (autoId) {
        url += `&AutoID=${autoId}`;
      }
      if (statusOn) {
        url += `&StatusOn=${statusOn}`;
      }

      // Call API
      this.httpService.fetch<any>(url)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            this.isLoading.set(false);
            // Get data from response - it might be in response.data.data or response.data
            let data = [];
            if (Array.isArray(response?.data?.data)) {
              data = response.data.data;
            } else if (Array.isArray(response?.data)) {
              data = response.data;
            }
            this.chequeRegisterData.set(data);
            console.log('Data received:', data.length, 'records');
          },
          error: (error) => {
            this.isLoading.set(false);
            // Handle timeout or other errors
            let errorMessage = 'Error loading data';
            if (error?.error?.data) {
              errorMessage = error.error.data;
            } else if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.message) {
              errorMessage = error.message;
            }
            console.error('Error:', errorMessage);
            alert('Error: ' + errorMessage);
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