import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BaseComponent } from "@org/architecture";
import { EndpointConstant } from "@org/constants";
import { firstValueFrom, takeUntil } from "rxjs";
import { FinanceAppService } from "../../http/finance-app.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MultiColumnComboBoxComponent } from "@syncfusion/ej2-angular-multicolumn-combobox";
import { ACCOUNTNAME } from "../../model/pcard-master.model";
import { Group } from "@syncfusion/ej2-grids";
import { groupdataModel, subgroupdataModel, Subgroupdatamodel1 } from "../../model/pledgercomponent.model";
import { BaseService } from "@org/services";
import { Router, ActivatedRoute } from '@angular/router';


@Component({
  //eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-ledger-Main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './ledger-component.html',
  styles: [],
})
export class LedgerComponent extends BaseComponent implements OnInit {
     selecteddataidforupdate = 0;
     groupdata = signal<groupdataModel[]>([]);
     selectedGroupName = '';
     selectedSubGroupName = '';
     selectedAccountCategoryName = '';
     selectedGroupId = 0;
     isEdit = signal<boolean>(false);
     private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
     
     selectedSubGroupId = 0;
     subGroupData = signal<subgroupdataModel[]>([]);
     isSubGroupEnabled = signal<boolean>(false);
     accountCategoryData = signal<Subgroupdatamodel1[]>([]);
    ledgerForm = this.formUtil.thisForm;
    private httpService = inject(FinanceAppService);
    private baseService = inject(BaseService);
    cardMasterForm = this.formUtil.thisForm;
    isInputDisabled = false;
    
    // Account dropdown properties
    accountOptions: any[] = [];
    selectedAccountCategoryId: number | null = null;
    accountReturnField = 'name';
    accountNameKeys = [
      { field: 'id', header: 'ID', width: 80 },
      { field: 'name', header: 'Name', width: 150 },
    ];
    isDelete = signal(false);
    activeTab = signal<string>('accountsList');
    
    // Dropdown data sourcesgroupData = signal<any[]>([]);

    
    
    constructor() {
      super();
      this.commonInit();
    }
    
      ngOnInit(): void {
        this.onInitBase();
        this.SetPageType(1);
        console.log("pageid",this.currentPageInfo?.menuText);
        this.fetchGroupPopup();
        this.fillAccountCategory();
      }
      
      fetchGroupPopup(): void {
        this.httpService.fetch<groupdataModel[]>(EndpointConstant.FILLACCOUNTGROUPPOPUP).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            this.groupdata.set(response.data);

            console.log("groupdata",this.groupdata());
           
            console.log("ledgerForm",this.ledgerForm.get('AccountCode')?.value);
          },
          error: (error) => {
            console.error("error",error);
          },
        });
        // Fetch group data - implement based on your endpoint
    
      }
      fillAccountCategory(): void {
        this.httpService.fetch<Subgroupdatamodel1[]>(EndpointConstant.FILLACCOUNTCATEGORY).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            this.accountCategoryData.set(response.data);
            console.log("accountCategoryData",this.accountCategoryData());
          },
          error: (error) => {
            console.error("error",error);
          },
        });
        // Fetch group data - implement based on your endpoint
    
      }
      onAccountCategoryChange(event: any) {
        console.log("account category changed",event);
        this.selectedAccountCategoryId = event.itemData.id;
        this.selectedAccountCategoryName = event.itemData.description;

      }
      
      fetchsubgroupPopup(): void {
        // Fetch subgroup data - implement based on your endpoint
        this.subGroupData.set([]);
      }
      
     
    
      override FormInitialize() {
       this.ledgerForm = new FormGroup({    
             Group: new FormControl({ value: '', disabled: true }),
             SubGroup: new FormControl({ value: null, disabled: true }),
             AccountCode: new FormControl({ value: '', disabled: false }),
             AccountName: new FormControl({ value: '', disabled: false }, Validators.required),
             AlternateName: new FormControl({ value: '', disabled: false }),
             AccountCategory: new FormControl({ value: '', disabled: false }),
             active: new FormControl({ value: true, disabled: false }),
             isGroup: new FormControl({ value: false, disabled: false }),
             MaintainBillWise: new FormControl({ value: true, disabled: false }),
             PreventExtraPay: new FormControl({ value: false, disabled: false }),
             Trackcollection: new FormControl({ value: true, disabled: false }),
             Maintaincostcenter: new FormControl({ value: true, disabled: false }),
             maintainitemwise: new FormControl({ value: true, disabled: false }),
             narration: new FormControl({ value: '', disabled: false }),
           });
      }
      override async LeftGridInit() {
        this.pageheading = 'Ledger';
        try {
          const res = await firstValueFrom(
            this.httpService
              .fetch<any[]>(EndpointConstant.LEFTSIDEFILLLEDGER)
              .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          );
    
          // handle data here after await completes
          this.leftGrid.leftGridData = res.data;
          console.log('Fetched data:', this.leftGrid.leftGridData);
    
          this.leftGrid.leftGridColumns = [
            {
              headerText: 'Ledger',
              columns: [
                {
                  field: 'name',
                  datacol: 'name',
                  headerText: 'Name',
                  textAlign: 'Left',
                },
                {
                  field: 'alias',
                  datacol: 'alias',
                  headerText: 'Alias',
                  textAlign: 'Left',
                },
                 
              ],
            },
          ];
        } catch (err) {
          console.error('Error fetching companies:', err);
        }
      }
      protected override getDataById(data: any): void {
        console.log("data",data);
        this.selecteddataidforupdate = data.id;

        this.httpService
              .fetch<any[]>(EndpointConstant.FILLTAXACCOUNTDATA+data.id)
              .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          .subscribe({
            next: (response) => {
              console.log("response",response);
              // API returns array with one object, extract the first element
              const apiData =  response.data[0] 
            
              console.log("apiData",apiData);
              
              // Find Group object and update selected values
              if (apiData.accountGroup) {
                const groupObj = this.groupdata().find(item => item.id === apiData.accountGroup);
                if (groupObj) {
                  this.selectedGroupId = groupObj.id;
                  this.selectedGroupName = groupObj.name;
                } else {
                  this.selectedGroupId = apiData.accountGroup;
                  this.selectedGroupName = '';
                }
              } else {
                this.selectedGroupId = 0;
                this.selectedGroupName = '';
              }
              
              // Find Account Category object and update selected values
              if (apiData.accountCategory) {
                const accountCategoryObj = this.accountCategoryData().find(
                  item => item.id === apiData.accountCategory
                );
                if (accountCategoryObj) {
                  this.selectedAccountCategoryId = accountCategoryObj.id;
                  this.selectedAccountCategoryName = accountCategoryObj.description;
                }
              } else {
                this.selectedAccountCategoryId = null;
                this.selectedAccountCategoryName = '';
              }
              
              // Map API response fields to form fields
              const formData: any = {
                Group: apiData.accountGroup || null,
                AccountCode: apiData.alias || '',
                AccountName: apiData.name || '',
                AlternateName: apiData.alternateName || '',
                AccountCategory: apiData.accountCategory || null,
                active: apiData.active ?? true,
                isGroup: apiData.isGroup ?? false,
                MaintainBillWise: apiData.isBillWise ?? true,
                PreventExtraPay: apiData.preventExtraPay ?? false,
                Trackcollection: true,
                Maintaincostcenter: true,
                maintainitemwise: true,
                narration: apiData.narration || ''
              };
              
              // First patch the form without SubGroup
              this.ledgerForm.patchValue(formData);
              
              // Load subgroup data if Group exists, then set SubGroup
              if (apiData.accountGroup) {
                this.httpService.fetch<any>(EndpointConstant.FILLSUBGROUPPOPUP + apiData.accountGroup)
                  .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
                  .subscribe({
                    next: (subGroupResponse) => {
                      const subgroupArray = subGroupResponse.data?.subgroup || [];
                      this.subGroupData.set(subgroupArray);
                      
                      if (subgroupArray.length > 0) {
                        this.isSubGroupEnabled.set(true);
                        this.ledgerForm.get('SubGroup')?.enable();
                        
                        // Find SubGroup object and update selected values
                        if (apiData.subGroup) {
                          const subGroupObj = subgroupArray.find((item: any) => item.id === apiData.subGroup);
                          if (subGroupObj) {
                            this.selectedSubGroupId = subGroupObj.id;
                            this.selectedSubGroupName = subGroupObj.description;
                            this.ledgerForm.patchValue({ SubGroup: apiData.subGroup });
                          }
                        } else {
                          this.selectedSubGroupId = 0;
                          this.selectedSubGroupName = '';
                          this.ledgerForm.patchValue({ SubGroup: null });
                        }
                        
                        // Refresh all dropdowns
                        setTimeout(() => {
                          const groupElement = document.getElementById('Group') as any;
                          if (groupElement?.ej2_instances?.[0]) {
                            groupElement.ej2_instances[0].dataBind();
                          }
                          
                          const subGroupElement = document.getElementById('SubGroup') as any;
                          if (subGroupElement?.ej2_instances?.[0]) {
                            subGroupElement.ej2_instances[0].dataBind();
                          }
                          
                          const accountCategoryElement = document.getElementById('AccountCategory') as any;
                          if (accountCategoryElement?.ej2_instances?.[0]) {
                            accountCategoryElement.ej2_instances[0].dataBind();
                          }
                        }, 100);
                      } else {
                        this.isSubGroupEnabled.set(false);
                        this.ledgerForm.get('SubGroup')?.disable();
                      }
                    },
                    error: (error) => {
                      console.error("Error loading subgroup:", error);
                    }
                  });
              } else {
                // Refresh dropdowns even if no Group
                setTimeout(() => {
                  const groupElement = document.getElementById('Group') as any;
                  if (groupElement?.ej2_instances?.[0]) {
                    groupElement.ej2_instances[0].dataBind();
                  }
                  
                  const accountCategoryElement = document.getElementById('AccountCategory') as any;
                  if (accountCategoryElement?.ej2_instances?.[0]) {
                    accountCategoryElement.ej2_instances[0].dataBind();
                  }
                }, 100);
              }
            },
            error: (error) => {
              console.error("error",error);
            },
          });

      }

      onSubGroupChange(event: any) {
        console.log("sub group changed",event);
        this.selectedSubGroupId = event.itemData.id;
        this.selectedSubGroupName = event.itemData.description;
      }
      override SaveFormData() {
      
        console.log("selectedAccountCategoryId",this.selectedAccountCategoryId);
        console.log("selectedSubGroupId",this.selectedSubGroupId);
        console.log("selectedGroupId",this.selectedGroupId);
        console.log("ledgerForm",this.ledgerForm.value);
        const payload:any={
            group: {
              "id": this.selectedGroupId,
              "name": this.selectedGroupName
            },
            subGroup: {
              "id": this.selectedSubGroupId,
              "name": this.selectedSubGroupName
            },
            accountCategory: {
              "id": this.selectedAccountCategoryId,
              "name": this.selectedAccountCategoryName
            },
            accountName: this.ledgerForm.get('AccountName')?.value,
            accountCode: this.ledgerForm.get('AccountCode')?.value,
            narration: this.ledgerForm.get('narration')?.value,
            maintainBillwise: this.ledgerForm.get('MaintainBillWise')?.value,
            active: this.ledgerForm.get('active')?.value,
            preventExtraPay: this.ledgerForm.get('PreventExtraPay')?.value,
            maintainIteamWise: this.ledgerForm.get('maintainitemwise')?.value,
            trackCollection: this.ledgerForm.get('Trackcollection')?.value,
            maintainCostCentre: this.ledgerForm.get('Maintaincostcenter')?.value,
            alternateName: this.ledgerForm.get('AlternateName')?.value,
            isGroup: this.ledgerForm.get('isGroup')?.value
          }
          const savepayload = {
            group: {
              id: this.selectedGroupId,
              name: this.selectedGroupName
            },
            subGroup: {
              id: this.selectedSubGroupId,
              name: this.selectedSubGroupName
            },
            accountCategory: {
              id: this.selectedAccountCategoryId,
              name: this.selectedAccountCategoryName
            },
            accountName: this.ledgerForm.get('AccountName')?.value,
            accountCode: this.ledgerForm.get('AccountCode')?.value,
            narration: this.ledgerForm.get('narration')?.value,
            maintainBillwise: true,
            active: true,
            preventExtraPay: true,
            maintainIteamWise: true,
            trackCollection: true,
            maintainCostCentre: true,
            alternateName: this.ledgerForm.get('AlternateName')?.value,
            isGroup: true
          };
          
          
          console.log("payload",payload);
          if(this.isEdit()){
            this.httpService.patch<any[]>(EndpointConstant.UPDATELEDGER+this.selecteddataidforupdate,payload).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            .subscribe({
              next: async (response) => {
                console.log("response",response);
                if(response.httpCode == 201){
                  this.toast.success("Ledger updated successfully");
                }else{
                  this.toast.error("Ledger updated failed");
                }
                this.baseService.showCustomDialogue("Ledger updated successfully");
              
                this.isEdit.set(false);
                this.ledgerForm.reset();
                this.ledgerForm.enable();
                
                // Wait for grid data to refresh before updating
                await this.LeftGridInit();
                
                // Update data sharing service with fresh data after grid is refreshed
                this.serviceBase.dataSharingService.setData({
                    columns: this.leftGrid.leftGridColumns,
                    data: this.leftGrid.leftGridData,
                    pageheading: this.pageheading,
                  });
              },
              error: (error) => {
                console.error("error",error);
              },
            });
          } else {
            this.httpService.post<any[]>(EndpointConstant.SAVELEDGER,savepayload).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            .subscribe({
              next: async (response) => {
                console.log("response",response);
                if(response.httpCode == 201){
                  console.log("response",response.httpCode);
                  this.toast.success("Ledger created successfully");

                this.baseService.showCustomDialogue("Ledger created successfully");
                  
                  // Wait for grid data to refresh before updating
                  await this.LeftGridInit();
                  
                  // Update data sharing service with fresh data after grid is refreshed
                  this.serviceBase.dataSharingService.setData({
                    columns: this.leftGrid.leftGridColumns,
                    data: this.leftGrid.leftGridData,
                    pageheading: this.pageheading,
                  });
                  
                  this.ledgerForm.reset();
                  this.ledgerForm.enable();
                }
                
              },
              error: (error) => {
                console.error("error",error);
              },
            });
          }
        }
      
override DeleteData(data: any): void {
  console.log("delete data",data);
  console.log("selected data id",this.selecteddataidforupdate);
  if(confirm("Are you sure you want to delete this details?")){
    this.httpService.delete<any[]>(EndpointConstant.DELETELEDGER+data.id).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        console.log("response",response);
        if(response.httpCode == 200){
          this.toast.success("Ledger deleted successfully");
        }else{
          this.toast.error("Ledger deleted failed");
        }
        this.baseService.showCustomDialogue("Ledger deleted successfully");
        this.LeftGridInit();
        this.serviceBase.dataSharingService.setData({
          columns: this.leftGrid.leftGridColumns,
          data: this.leftGrid.leftGridData,
          pageheading: this.pageheading,
        });
      },
    });
  }

      
      }
      
      override formValidationError() {
        console.log("form error found");
      }
      override newbuttonClicked() {
        console.log("new button clicked");
        this.ledgerForm.reset();
        this.ledgerForm.enable();
      }
      onGroupChange(event: any) {
        console.log("group changed",event);
        this.selectedGroupId = event.itemData.id;
        this.selectedGroupName = event.itemData.name;
        
        
        // Reset SubGroup when Group changes
        this.ledgerForm.get('SubGroup')?.setValue(null);
        this.subGroupData.set([]);
        this.isSubGroupEnabled.set(false);
        
        this.httpService.fetch<any>(EndpointConstant.FILLSUBGROUPPOPUP+this.selectedGroupId).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            // API returns { data: { subgroup: [...], nextCode: "..." } }
            const subgroupArray = response.data?.subgroup || [];
            this.ledgerForm.get('AccountCode')?.setValue(response.data?.nextCode);
            this.subGroupData.set(subgroupArray);
            console.log("subGroupData",this.subGroupData());
            
            // Enable SubGroup dropdown if data is available
            if (subgroupArray.length > 0) {
              this.isSubGroupEnabled.set(true);
              this.ledgerForm.get('SubGroup')?.enable();
              
              // Force change detection and refresh dropdown
              setTimeout(() => {
                const subGroupElement = document.getElementById('SubGroup') as any;
                if (subGroupElement && subGroupElement.ej2_instances) {
                  subGroupElement.ej2_instances[0].dataBind();
                }
              }, 100);
            } else {
              this.isSubGroupEnabled.set(false);
              this.ledgerForm.get('SubGroup')?.disable();
            }
          },
          error: (error) => {
            console.error("error",error);
            this.isSubGroupEnabled.set(false);
            this.ledgerForm.get('SubGroup')?.disable();
          },
        });
      }
      override onEditClick() {
        console.log("on edit click");
        this.isEdit.set(true);
        this.ledgerForm.enable();
      }
      onTabClick(tabName: string): void {
        this.activeTab.set(tabName);
        // Navigate to the corresponding route - routes are relative to /masters
        const routes: { [key: string]: string[] } = {
          'accountsList': ['accountslist'],
          'updateSortorder': ['accountsortorder'],
          'groupparentupdate': ['chartofaccounts'], // Current page
          'Branchaccounts': ['branchaccounts'],
          'chartofaccounts': ['chartofaccounts']
        };
        
        const route = routes[tabName];
        if (route) {
          // Navigate using relative path from current activated route
          this.router.navigate(route, { relativeTo: this.activatedRoute.parent || this.activatedRoute });
        }
      }
    }