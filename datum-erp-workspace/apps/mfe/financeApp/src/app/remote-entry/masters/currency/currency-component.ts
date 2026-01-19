import {Component,inject,OnInit } from '@angular/core';
import { FormControl,FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { FinanceAppService } from '../../http/finance-app.service';
import { Currency, CurrencyCodes, PCurrencyModel } from '../../model/PCurrencyModel';
import { BaseService } from '@org/services';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-currency-Main',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './currency-component.html',
  styles: [],
})
export class CurrencyComponent extends BaseComponent implements OnInit {
   
   isLoading = false;
  allCurrencyMaster = [] as Array<PCurrencyModel>;  
  currentCurrencyMaster = {} as Currency;   
  allcurrencycodes = [] as Array<CurrencyCodes>; 
  selectedCurrencyMasterId = 0;
  firsTCurrencyMaster = 0;
  isInputDisabled = true;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  exchangeRateValue: string = '';

  selectedCurrencyCodeId = 0;
  showCurrencyCodePopup = false;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isCodeUpdate: boolean = false;
  isActive: unknown;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isUpdate: boolean = false;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isEdit: boolean = true;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isDelete: boolean = true;
  
  private httpService = inject(FinanceAppService);
  private baseService = inject(BaseService);
  currencyMasterForm = this.formUtil.thisForm;
   currencyCodeForm = this.formUtil.thisForm;
  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.fetchCurrencyCode();
    this.currencyMasterForm.disable();
    console.log("pageid",this.currentPageInfo?.menuText);
  }
  override FormInitialize() {
    this.currencyMasterForm = new FormGroup({
      currencyname: new FormControl({ value: '', disabled: false },Validators.required),
      currencycode: new FormControl({ value: '', disabled: false },Validators.required),
      currencyrate: new FormControl({ value: '', disabled: false },Validators.required),
      symbol: new FormControl({ value: '', disabled: false },Validators.required),
      coin: new FormControl({ value:'', disabled: false }),
      isdefault: new FormControl({ value: '', disabled: false }),
    });
    this.currencyCodeForm = new FormGroup({      
      code:new FormControl({ value: '', disabled: false } ,Validators.required,) ,
      name: new FormControl({ value: '', disabled: false } ,Validators.required),
    });
    console.log('form init started');
  }

   onRowSelectCode(event: any) {
    const selected = event.data;
    this.currencyCodeForm.patchValue({
    code: selected.code,
    name: selected.name,
  });
}

//  editCurrencyCode(currencyID:any){    
//   console.log("edit currency code");
//     this.selectedCurrencyCodeId = currencyID;
//     this.isCodeUpdate = true;
//     console.log("selected:",this.selectedCurrencyCodeId);
//     this.httpService
//     .patch(EndpointConstant.UPDATECURRENCYCODE+this.selectedCurrencyCodeId,this.currencyCodeForm.value)
//     .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
//     .subscribe({
//       next: (response) => {
//         let currencyCodeData = (response as any)?.data[0];

//         this.currencyCodeForm.patchValue({
//           code: currencyCodeData.code,
//           name: currencyCodeData.name
//         });   
//         this.showCurrencyCodePopup = !this.showCurrencyCodePopup;     
//       },
//       error: (error) => {
//         this.isLoading = false;
//         console.error('An Error Occured', error);
//       },
//     });
//   }
   editCurrencyCode(currencyID:any){    
    this.selectedCurrencyCodeId = currencyID;
    this.isCodeUpdate = true;
    this.httpService
    .fetch(EndpointConstant.FILLCURRENCYCODEBYID+this.selectedCurrencyCodeId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        const currencyCodeData = (response as any)?.data[0];
        this.currencyCodeForm.patchValue({
          code: currencyCodeData.code,
          name: currencyCodeData.name
        });   
        this.showCurrencyCodePopup = !this.showCurrencyCodePopup;     
      },
      error: (error) => {
        this.isLoading = false;
        console.error('An Error Occured', error);
      },
    });
  }

  deleteCurrencyCode(currencyID:any){
    this.selectedCurrencyCodeId = currencyID;
    if(confirm("Are you sure you want to delete this details?")) {
      this.isLoading = true;
      this.httpService.delete(EndpointConstant.DELETECURRENCYCODE+this.selectedCurrencyCodeId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue(response.data as any);
          this.fetchCurrencyCode();
        },
        error: (error) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue('Please try again');
        },
      });
    }
  }

  saveCurrencyCode(){
    if (this.currencyCodeForm.invalid) {
      for (const field of Object.keys(this.currencyCodeForm.controls)) {
        const control: any = this.currencyCodeForm.get(field);
        if (control.invalid) {
          this.baseService.showCustomDialogue('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }
    
    const payload = {
      "code": this.currencyCodeForm.value.code,
      "name": this.currencyCodeForm.value.name
    };
    // save code here 
    if(this.isCodeUpdate){
      this.updateCodeCallback(payload);
    } else{
      this.createCodeCallback(payload);
    }
  }

  updateCodeCallback(payload:any){
    this.httpService.patch(EndpointConstant.UPDATECURRENCYCODE+this.selectedCurrencyCodeId,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if(response?.httpCode == 500){
            this.baseService.showCustomDialogue(response?.data as any);
          } else{
            this.baseService.showCustomDialogue("Successfully saved Currency Code"); 
            this.fetchCurrencyCode();
            this.togglePopup();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

  createCodeCallback(payload:any){
    this.httpService.post(EndpointConstant.SAVECURRENCYCODE,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue('Successfully saved Currency Code'); 
          this.fetchCurrencyCode();
          this.togglePopup();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving Currency Code', error);
        },
      });
  }

  override newbuttonClicked(): void {
    console.log('New button clicked');
    this.currencyMasterForm.enable();
    this.currencyCodeForm.enable();
     this.currencyMasterForm.reset();
  }

  togglePopup(){
    this.showCurrencyCodePopup = !this.showCurrencyCodePopup;
    this.currencyCodeForm.reset();
    this.isCodeUpdate = false;
    console.log("toggle")
  }

  private fetchCurrencyCode(){
    this.httpService
    .fetch(EndpointConstant.FILLCURRENCYCODE)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        this.allcurrencycodes = response?.data as CurrencyCodes[];
      },
      error: (error) => {
        console.error('An Error Occured', error);
      },
    });    
  }  

  override SaveFormData() {
   // console.log('data scving');
    console.log(this.currencyMasterForm.controls);
    this.saveCurrency();
  }

   private saveCurrency(){
     if (this.currencyMasterForm.invalid) {
      for (const field of Object.keys(this.currencyMasterForm.controls)) {
        const control: any = this.currencyMasterForm.get(field);
        if (control.invalid) {
          this.baseService.showCustomDialogue('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }

    // Validate symbol field before saving/updating
    const symbolValue = this.currencyMasterForm.value.symbol;
    if (!symbolValue || symbolValue === null || symbolValue === undefined || (typeof symbolValue === 'string' && symbolValue.trim() === '')) {
      this.baseService.showCustomDialogue('Symbol field cannot be null or empty. Please enter a symbol before saving.');
      return;
    }

    let currencyCodeObj = {};
    if(this.currencyMasterForm.value.currencycode){
      this.allcurrencycodes.forEach(element => {
        if(element.code == this.currencyMasterForm.value.currencycode){
          currencyCodeObj = {
            "id": element.id,
            "key": element.code,
            "value": element.name
          };
        }
      });
    }
    const payload = {
      "currencyName": this.currencyMasterForm.value.currencyname,
      "currencyCode": currencyCodeObj,
      "currencyRate": this.currencyMasterForm.value.currencyrate,
      "symbol" : this.currencyMasterForm.value.symbol,
      "isDefault": this.currentCurrencyMaster.defaultCurrency ? true : false,
      "coin": this.currencyMasterForm.value.coin
    };
    if(this.isUpdate){
      this.updateCallback(payload);
    } else{
      this.createCallback(payload);
    }
  }

  updateCallback(payload:any){
    this.httpService.patch(EndpointConstant.UPDATECURRENCYMASTER+this.selectedCurrencyMasterId,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue("Successfully saved Currency master"); 
          this.selectedCurrencyMasterId = this.firsTCurrencyMaster;
          this.fetchCurrencyMasterById();
          // Wait for grid data to be fetched before updating data sharing service
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
         this.currencyMasterForm.disable();
        },
        error: (error) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

  createCallback(payload:any){
    this.httpService.post(EndpointConstant.SAVECURRENCYMASTER,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue('Successfully saved Currency master'); 
          this.selectedCurrencyMasterId = this.firsTCurrencyMaster;
          this.fetchCurrencyMasterById();
          // Wait for grid data to be fetched before updating data sharing service
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
         this.currencyMasterForm.disable();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving Currency master', error);
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

    override onEditClick(){
    console.log('we have entered in to edit mode ')
    this.isUpdate = true;
    this.currencyMasterForm.enable();
  }

  override async LeftGridInit() {
    this.pageheading = 'Currency';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLCURRENCY)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      // handle data here after await completes
      this.leftGrid.leftGridData = res.data;
      console.log('Fetched data:', this.leftGrid.leftGridData);

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Currency List',
          columns: [
            {
              field: 'currency',
              datacol: 'currency',
              headerText: 'Currency',
              textAlign: 'Left',
            },
            {
              field: 'abbreviation',
              datacol: 'abbreviation',
              headerText: 'Abbreviation',
              textAlign: 'Left',
            },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }

  override getDataById(data: PCurrencyModel) {
    console.log('data', data);
    this.selectedCurrencyMasterId = data.currencyID;
    this.fetchCurrencyMasterById();
  }

  private  fetchCurrencyMasterById(): void {   
    this.httpService
    .fetch(EndpointConstant.FILLCURRENCYMASTERBYID+this.selectedCurrencyMasterId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
       this.currentCurrencyMaster = (response?.data as any[])[0];
        this.currencyMasterForm.patchValue({
          currencyname: this.currentCurrencyMaster.currency,
          currencyrate: this.currentCurrencyMaster.currencyRate,
          symbol:this.currentCurrencyMaster.symbol ? this.currentCurrencyMaster.symbol: null,
          currencycode: this.currentCurrencyMaster.abbreviation,
          coin:this.currentCurrencyMaster.coin,
          isdefault: this.currentCurrencyMaster.defaultCurrency
        });
        
      },
      error: (error) => {
        this.isLoading = false;
        console.error('An Error Occured', error);
      },
    });
  }

  override DeleteData(data: PCurrencyModel) {
    console.log('deleted');
     if(!this.isDelete){
      this.baseService.showCustomDialogue('Permission Denied!');
      return false;
    }
    if(confirm("Are you sure you want to delete this details?")) {
      this.isLoading = true;
      this.httpService.delete(EndpointConstant.DELETECURRENCYMASTER+this.selectedCurrencyMasterId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue(response.data as any);          
          this.selectedCurrencyMasterId = this.firsTCurrencyMaster;
          this.LeftGridInit();
        },
        error: (error) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue('Please try again');
        },
      });
    }
    return true;
  }

  override formValidationError(){
    console.log("form error found");
  }
}
