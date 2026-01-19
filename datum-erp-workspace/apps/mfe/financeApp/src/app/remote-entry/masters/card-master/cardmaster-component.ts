import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BaseComponent } from "@org/architecture";
import { EndpointConstant } from "@org/constants";
import { firstValueFrom, takeUntil } from "rxjs";
import { FinanceAppService } from "../../http/finance-app.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MultiColumnComboBoxComponent } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { ACCOUNTNAME } from "../../model/pcard-master.model";


@Component({
  //eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-cardmaster-Main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './cardmaster-component.html',
  styles: [],
})
export class CardComponent extends BaseComponent implements OnInit {
  @ViewChild('accountDropdown') accountDropdown?: MultiColumnComboBoxComponent;
  
  designationForm = this.formUtil.thisForm;
  accountnameData= [] as Array<ACCOUNTNAME>;
  isUpdate = signal(false);
  selectedCardMasterId = 0;
  firstCardMaster = 0;

    private httpService = inject(FinanceAppService);
    cardMasterForm = this.formUtil.thisForm;
    isInputDisabled = false;
    
    // Account dropdown properties
    accountOptions: any[] = [];
    selectedAccountName = "";
    selectedAccountId: number | null = null;
    accountReturnField = 'name';
    accountNameKeys = [
      { field: 'id', header: 'ID', width: 80 },
      { field: 'name', header: 'Name', width: 150 },
    ];
    isDelete = signal(false);
    constructor() {
      super();
      this.commonInit();
    }
    
      ngOnInit(): void {
        this.onInitBase();
        this.SetPageType(1);
        console.log("pageid",this.currentPageInfo?.menuText);
       this.fetchAccountNamePopup();
      }
    
      override FormInitialize() {
       this.cardMasterForm = new FormGroup({    
             description: new FormControl({ value: '', disabled: false },Validators.required),
             accountname: new FormControl({ value: null, disabled: false },Validators.required),
             commission:new FormControl({ value: '', disabled: false },Validators.required),
             default: new FormControl({ value: false, disabled: false }),
           });
      }
    
      override SaveFormData() {
       // console.log('data scving');
        console.log(this.cardMasterForm.controls);
        
              if (this.cardMasterForm.invalid) {
                for (const field of Object.keys(this.cardMasterForm.controls)) {
                  const control: any = this.cardMasterForm.get(field);
                  if (control.invalid) {
                    alert('Invalid field: ' + field);
                    return;  // Stop after showing the first invalid field
                  }
                }
                return;
              }
              //getting account name object..
              const accountId = this.cardMasterForm.value.accountname;
              let accountObj: any = {
                alias: "",
                name: "",
                id: 0
              };
              
              if (accountId) {
                // Convert to number if it's a string
                const accountIdNum = typeof accountId === 'string' ? parseInt(accountId, 10) : accountId;
                
                console.log('Searching for account ID:', accountIdNum);
                console.log('accountnameData:', this.accountnameData);
                console.log('accountnameData length:', this.accountnameData.length);
                
                const foundAccount = this.accountnameData.find((item: any) => {
                  const itemId = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
                  return itemId === accountIdNum;
                });
                
                if (foundAccount) {
                  accountObj = {
                    alias: foundAccount.alias || "",
                    name: foundAccount.name || "",
                    id: foundAccount.id || 0
                  };
                  console.log('Account found in accountnameData:', accountObj);
                } else {
                  console.warn('Account not found in accountnameData. ID:', accountIdNum);
                  // If not found, at least set the ID
                  accountObj.id = accountIdNum;
                }
              }
              
              console.log('Account ID from form:', accountId);
              console.log('Final account object:', accountObj);
         
              const payload = {
                "description": this.cardMasterForm.value.description,
                "accountName": accountObj,
                "commission": this.cardMasterForm.value.commission,
                "default": this.cardMasterForm.value.default,
              }
              if(this.isUpdate()){
                console.log(' updating payload', JSON.stringify(payload, null, 2));
                this.updateCallback(payload);
              } else{
                console.log(' saving payload', JSON.stringify(payload, null, 2));
                this.createCallback(payload);
              }
            }
        updateCallback(payload:any){
    this.httpService.patch<any[]>(EndpointConstant.UPDATECARDMASTER+this.selectedCardMasterId,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {
        
          if(response.httpCode == 200){
            alert("Successfully saved Card master"); 
            this.selectedCardMasterId = this.firstCardMaster;
            this.getDataById(this.selectedCardMasterId);
            // Wait for grid to refresh before updating data sharing service
            await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
           
          }
          if(response.httpCode == 500){
            alert(response.data);
          }
        },
        error: (error) => {
          alert('Please try again');
        },
      });
    }
 
  createCallback(payload:any){
    this.httpService.post<any[]>(EndpointConstant.SAVECARDMASTER,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response) => {

          if(response.httpCode == 201){
            alert('Successfully saved Card master'); 
            this.selectedCardMasterId = this.firstCardMaster;
            this.getDataById(this.selectedCardMasterId);
            // Wait for grid to refresh before updating data sharing service
            await this.LeftGridInit();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
          }
          if(response.httpCode == 500){
            alert(response.data);
          }
        },
        error: (error) => {
          alert('Please try again');
          console.error('Error saving Card master', error);
        },
      });
  }
    
      override async LeftGridInit() {
        this.pageheading = 'Card master';
        try {
          const res = await firstValueFrom(
            this.httpService
              .fetch<any[]>(EndpointConstant.FILLCARDMASTER)
              .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          );
    
          // handle data here after await completes
          this.leftGrid.leftGridData = res.data;
          console.log('Fetched data:', this.leftGrid.leftGridData);
    
          this.leftGrid.leftGridColumns = [
            {
              headerText: 'Card List',
              columns: [
              {
                  field: 'description',
                  datacol: 'description',
                  headerText: 'Description',
                  textAlign: 'Left',
                },{
                  field: 'accountName',
                  datacol: 'accountName',
                  headerText: 'AccountName',
                  textAlign: 'Left',
                }
              ],
            },
          ];
        } catch (err) {
          console.error('Error fetching companies:', err);
        }
      }
      fetchAccountNamePopup(): void{
            this.httpService
            .fetch<any[]>(EndpointConstant.FILLACCOUNTNAMEPOPUP)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            .subscribe({
              next: (response) => {
                this.accountnameData = response?.data || [];
                this.accountOptions = this.accountnameData.map((item: any) => ({
                  id:item.id,
                  name: item.name
                }));
                console.log('Account name data loaded:', this.accountnameData);
                console.log('Account options:', this.accountOptions);
              },
              error: (error) => {
                console.error('Error fetching account names:', error);
                this.accountnameData = [];
                this.accountOptions = [];
              },
            });    
          }  
      override getDataById(data: any) {
        console.log('data', data);
        this.selectedCardMasterId = data.id;
        this.isUpdate.set(false); // Reset update flag when loading data
        
        this.httpService
.fetch<any[]>(EndpointConstant.FILLCARDMASTERBYID+data.id)
.pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
.subscribe({
  next: (response) => {
    console.log('response', JSON.stringify(response.data[0], null, 2));
    this.cardMasterForm.patchValue({
      description: response.data[0].description,
      accountname: response.data[0].accountID,
      commission:response.data[0].commission,
      default: response.data[0].default
    });
    this.selectedAccountName = response.data[0].accountName;
    this.selectedAccountId = response.data[0].accountID;
    
    // Disable form in view mode
    this.cardMasterForm.disable();
  },
});
      }
    
      override DeleteData(data: any) {
        console.log('deleting data', data);
        console.log('data id', data.id);
        this.isDelete.set(true);
        if(!this.isDelete()){
                alert('Permission Denied!');
                return false;
              }
              if(confirm("Are you sure you want to delete this details?")) {
                
                this.httpService.delete<any[]>(EndpointConstant.DELETECARDMASTER+data.id)
                .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
                .subscribe({
                  next: (response) => {
                    
                    if(response.httpCode == 200){
                      alert('Card master successfully deleted'); 
                      this.isDelete.set(false);
                     // this.selectedCardMasterId = this.firstCardMaster;
                      this.LeftGridInit();
                      this.serviceBase.dataSharingService.setData({
                        columns: this.leftGrid.leftGridColumns,
                        data: this.leftGrid.leftGridData,
                        pageheading: this.pageheading,
                      });
                    } else{
                      alert('Some error occured');   
                    }
               
                  },
                  error: (error) => {
                    alert('Please try again');
                  },
                });
              }
              return true;
            }
       
    
      override formValidationError(){
        console.log("form error found");
      }
      override newbuttonClicked(): void {
        this.selectedAccountId = null;
        this.selectedAccountName = "";
        this.selectedCardMasterId = 0;
        this.isUpdate.set(false); // Reset update flag for new record
        
        // Reset form with explicit null values
        this.cardMasterForm.reset({
          description: '',
          accountname: '',
          commission: '',
          default: false
        });
        
        // Explicitly clear the multicolumncombobox if ViewChild is available
        if (this.accountDropdown) {
          this.accountDropdown.value = '';
          this.accountDropdown.dataBind();
        }
        
        // Mark form as pristine and untouched
        this.cardMasterForm.markAsPristine();
        this.cardMasterForm.markAsUntouched();
        this.cardMasterForm.enable();
        this.fetchAccountNamePopup();
      }
    
      onAccountNameSelected($event: any): void {
        const selectedId = $event?.itemData?.id ?? $event?.value ?? null;
        this.selectedAccountId = selectedId;
        
        if (selectedId) {
          const selectedAccount = this.accountOptions.find((item) => item.id === selectedId);
          if (selectedAccount) {
            this.selectedAccountName = selectedAccount.name ?? "";
            this.cardMasterForm.patchValue({
              accountname: selectedAccount.id,
            });
            console.log('Account selected:', this.selectedAccountName, 'ID:', selectedId);
          }
        } else {
          this.selectedAccountName = "";
          this.cardMasterForm.patchValue({
            accountname: null,
          });
        }
      }
      override onEditClick() {
        console.log('Edit button clicked');
        console.log('selectedCardMasterId before edit:', this.selectedCardMasterId);
        
        if (!this.selectedCardMasterId || this.selectedCardMasterId === 0) {
          alert('Please select a record to edit');
          return;
        }
        
        this.cardMasterForm.enable();
        this.isUpdate.set(true);
        this.isInputDisabled = false;
        
        console.log('isUpdate', this.isUpdate());
        console.log('selectedCardMasterId', this.selectedCardMasterId);
        console.log('Form enabled:', this.cardMasterForm.enabled);
      }
    }
    

