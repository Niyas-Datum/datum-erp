import {

    Component,
    inject,
    OnInit,
    ViewChild,
    ChangeDetectorRef,
    signal,
    
  } from '@angular/core';
  import { BaseComponent } from '@org/architecture';
  import { FinanceAppService } from '../../http/finance-app.service';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { EndpointConstant } from '@org/constants';
  import { EditSettingsModel, GridComponent, EditService } from '@syncfusion/ej2-angular-grids';
import { FormControl, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { PFinanceRegister } from '../Model/pfinanceregister';
  
  @Component({
    //eslint-disable-next-line @angular-eslint/component-selector
    selector: 'app-finance-register',
    //eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    templateUrl: './finance-register.component.html',
    
    providers: [EditService],
  })
  export class FinanceRegisterComponent extends BaseComponent implements OnInit{
    financeRegisterForm = this.formUtil.thisForm;
    private httpService = inject(FinanceAppService);
    fillbasictypeData = signal<PFinanceRegister[]>([]);
    fillvouchertypeData=signal<any[]>([]);
    isLoading = signal<boolean>(false);
    financeRegisterData = signal<any[]>([]);
    editSettings = { allowEditing: false, allowAdding: false, allowDeleting: false };
    
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
    onRadioChange(event: any, value: string) {
      console.log('Radio button changed:', event, value);
      this.financeRegisterForm.get('viewby')?.setValue(value);
    }
    isVoucherValue() {
      return this.financeRegisterForm.get('viewby')?.value === 'true';
    }
    isAccountValue() {
      return this.financeRegisterForm.get('viewby')?.value === 'false';
    }
  
    override FormInitialize() {
      this.financeRegisterForm = new FormGroup({
        viewby:new FormControl({ value: '', disabled: false },Validators.required),
        from: new FormControl({ value: '', disabled: false },Validators.required),
        to: new FormControl({ value: '', disabled: false },Validators.required),
        basictype: new FormControl({ value: '', disabled: false },Validators.required),
        vouchertype: new FormControl({ value: '', disabled: false }, Validators.required),
        account: new FormControl({ value: '', disabled: false }, Validators.required),
        columnar: new FormControl({ value: false, disabled: false }),
        detailed: new FormControl({ value: false, disabled: false }),

      });
      console.log('form init started');
    }
    onSearchClick() {
      console.log('Search button clicked');
      // Clear form and data
      this.financeRegisterForm.reset();
      this.financeRegisterData.set([]);
    }
    
    onActionComplete(args: any) {
      // Handle grid actions if needed
      console.log('Grid action completed:', args);
    }
    loadInitData() {
      this.fillbasictype()
      this.fillvouchertype()
    }
    async fillbasictype() {
      this.httpService.fetch<{ data: PFinanceRegister[] }>(EndpointConstant.FILLBASICTYPE)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data?.data || [];
          console.log('Basic type data:', data);
          this.fillbasictypeData.set(data);
         // console.log('Basic type data signal:', this.fillbasictypeData());
          
        },
        error: (error) => {
          console.error('Error fetching basic type data:', error);
          this.fillbasictypeData.set([]);
        },
      }); 

    }
    async fillvouchertype() {
      this.httpService.fetch<{ data: any[] }>(EndpointConstant.FILLVOUCHERTYPE)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data?.data || [];
          console.log('Voucher type data:', data);
          this.fillvouchertypeData.set(data);
          //console.log('Voucher type data signal:', this.fillvouchertypeData());
        },
        error: (error) => {
          console.error('Error fetching voucher type data:', error);
          this.fillvouchertypeData.set([]);
        },
      });
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
      // Check if either Voucher or Account is selected
      const isVoucher = this.isVoucherValue();
      const isAccount = this.isAccountValue();
      
      if (!isVoucher && !isAccount) {
        console.log('Please select Voucher or Account to view data');
        return;
      }

      // Show loading
      this.isLoading.set(true);
      this.financeRegisterData.set([]);

      // Get values from form
      const fromDate = this.formatDate(this.financeRegisterForm.get('from')?.value);
      const toDate = this.formatDate(this.financeRegisterForm.get('to')?.value);
      const basicTypeId = this.financeRegisterForm.get('basictype')?.value || '';
      const detailed = this.financeRegisterForm.get('detailed')?.value || false;
      const columnar = this.financeRegisterForm.get('columnar')?.value || false;

      // Build URL with parameters
      let url = `${EndpointConstant.FILLFINANCEREGISTER}DateFrom=${fromDate}&DateUpto=${toDate}&BasicVTypeID=${basicTypeId}&Detailed=${detailed}&Inventory=false&Columnar=${columnar}&GroupItem=false`;
      
      // Add Criteria=Extract parameter when Account is selected
      if (isAccount) {
        url += '&Criteria=Extract';
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
            this.financeRegisterData.set(data);
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