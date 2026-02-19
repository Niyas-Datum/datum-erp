import { Component, inject, Input, OnInit, AfterViewInit, OnChanges, OnDestroy, SimpleChanges, signal, Output, EventEmitter } from '@angular/core';
import { BaseComponent } from '@org/architecture';
import { FinanceAppService } from '../../http/finance-app.service';
import { FormControl, FormGroup } from '@angular/forms';
import { groupdataModel, subgroupdataModel, Subgroupdatamodel1 } from '../../model/pledgercomponent.model';
import { EndpointConstant } from '@org/constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseService } from '@org/services';
 
@Component({
  selector: 'app-pagemenu-popup',
  templateUrl: './popup.component.html',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
export class PopupComponent extends BaseComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private baseService = inject(BaseService);
  isEditMode = signal<boolean>(false);
  isNewMode = signal<boolean>(false);
  accountCategoryData = signal<Subgroupdatamodel1[]>([]);
  selectedAccountCategoryId: number | null = null;
  isSubGroupEnabled = signal<boolean>(false);
  selectedSubGroupId = 0;
  selectedGroupName = '';
     selectedSubGroupName = '';
     selectedAccountCategoryName = '';
     selectedGroupId = 0;
  groupdata = signal<groupdataModel[]>([]);
subGroupData = signal<subgroupdataModel[]>([]);
  @Input() nodeId: string | null = null;
  @Output() dataSaved = new EventEmitter<void>();
  @Input() isGroup: boolean = false;
  @Input() isCreate: boolean = false;
  isCreateSignal = signal<boolean>(false);
  private httpService = inject(FinanceAppService);
  
  accountForm!: FormGroup;

  constructor() {
    super();
    this.commonInit();
    this.SetPageType(2);
    this.fetchGroupPopup();
    this.fillAccountCategory();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodeId'] && !changes['nodeId'].firstChange) {
      // Reset form and state when nodeId changes
      this.resetForm();
      // Load new data after a short delay to ensure view is ready
      if (this.nodeId) {
        setTimeout(() => {
          if (this.nodeId) {
            this.loadAccountData(this.nodeId);
          }
        }, 150);
      }
    }
    
    // Update isGroup form control when isGroup input changes
    if (changes['isGroup'] && this.accountForm) {
      this.accountForm.get('isGroup')?.setValue(this.isGroup ?? false);
    }
  }

  ngAfterViewInit(): void {
    // Wait for view to initialize, then load data
    if (this.nodeId) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (this.nodeId) {
          this.loadAccountData(this.nodeId);
        }
      }, 100);
    }
  }

  private resetForm(): void {
    this.accountForm.reset();
    this.accountForm.disable();
    this.isEditMode.set(false);
    this.isNewMode.set(false);
    this.selectedGroupId = 0;
    this.selectedGroupName = '';
    this.selectedSubGroupId = 0;
    this.selectedSubGroupName = '';
    this.selectedAccountCategoryId = null;
    this.selectedAccountCategoryName = '';
    this.subGroupData.set([]);
    this.isSubGroupEnabled.set(false);
  }
  fetchGroupPopup(): void {
    this.httpService.fetch<groupdataModel[]>(EndpointConstant.FILLACCOUNTGROUPPOPUP).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        this.groupdata.set(response.data);
      },
      error: (error) => {
        // Error fetching group data
      },
    });
    // Fetch group data - implement based on your endpoint

  }
  initializeForm(): void {
    this.accountForm = new FormGroup({
      accountCode: new FormControl(''),
      accountName: new FormControl(''),
      group: new FormControl({ value: null, disabled: true }),
      SubGroup: new FormControl({ value: null, disabled: true }),
      accountCategory: new FormControl({ value: null, disabled: true }),
      preventExtraPay: new FormControl(false),
      maintainCostCenter: new FormControl(false),
      maintainBillWise: new FormControl(false),
      maintainItemWise: new FormControl(false),
      trackCollection: new FormControl(false),
      isGroup: new FormControl(this.isGroup),
      active: new FormControl(true),
      narration: new FormControl(''),
      alternateName: new FormControl('')
    });
  }
//load data for the account
  
  loadAccountData(nodeId: string): void {
    this.httpService
          .fetch<any[]>(EndpointConstant.FILLTAXACCOUNTDATA+nodeId)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          // API returns array with one object, extract the first element
          const apiData =  response.data[0] 
          
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
            group: apiData.accountGroup || null, // Set ID value, not object
            accountCode: apiData.alias || '',
            accountName: apiData.name || '',
            alternateName: apiData.alternateName || '',
            accountCategory: apiData.accountCategory || null,
            active: apiData.active ?? true,
            isGroup: apiData.isGroup ?? false,
            maintainBillWise: apiData.isBillWise ?? true,
            preventExtraPay: apiData.preventExtraPay ?? false,
            trackCollection: true,
            maintainCostCenter: true,
            maintainItemWise: true,
            narration: apiData.narration || ''
          };
          
          // First patch the form without SubGroup
          this.accountForm.patchValue(formData);
          
          // Load subgroup data if Group exists, then set SubGroup
          if (apiData.accountGroup) {
            this.httpService.fetch<any>(EndpointConstant.FILLSUBGROUPPOPUP + apiData.accountGroup)
              .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
              .subscribe({
                next: (subGroupResponse) => {
                  const subgroupArray = subGroupResponse.data?.subgroup || [];
                  if(this.isCreate){
                    console.log("isCreate",this.isCreate);
                    this.isCreateSignal.set(true);
                    
                    
                    console.log("subGroupResponse",subGroupResponse);
                    this.accountForm.get('accountcategory')?.enable();
                    this.accountForm.get('accountCode')?.setValue(subGroupResponse.data?.nextCode);
                    this.accountForm.get('accountName')?.setValue('');
                    this.accountForm.get('preventExtraPay')?.setValue(false);
                    this.accountForm.get('maintainCostCenter')?.setValue(false);
                    this.accountForm.get('maintainBillWise')?.setValue(false);
                    this.accountForm.get('maintainItemWise')?.setValue(false);
                    this.accountForm.get('trackCollection')?.setValue(false);
                    this.accountForm.get('isGroup')?.setValue(this.isGroup?true:false);
                    this.accountForm.get('active')?.setValue(true);
                    this.accountForm.get('narration')?.setValue('');
                    this.accountForm.get('alternateName')?.setValue('');


                  }
                  this.subGroupData.set(subgroupArray);
                  
                  if (subgroupArray.length > 0) {
                    this.isSubGroupEnabled.set(true);
                    this.accountForm.get('SubGroup')?.enable();
                    
                    // Find SubGroup object and update selected values
                    if (apiData.subGroup) {
                      const subGroupObj = subgroupArray.find((item: any) => item.id === apiData.subGroup);
                      if (subGroupObj) {
                        this.selectedSubGroupId = subGroupObj.id;
                        this.selectedSubGroupName = subGroupObj.description;
                        this.accountForm.patchValue({ SubGroup: apiData.subGroup });
                      }
                    } else {
                      this.selectedSubGroupId = 0;
                      this.selectedSubGroupName = '';
                      this.accountForm.patchValue({ SubGroup: null });
                    }
                    
                    // Refresh all dropdowns after a delay to ensure they're rendered
                    setTimeout(() => {
                      // Refresh Group dropdown
                      this.refreshGroupDropdown(apiData.accountGroup, 0);
                      
                      // Refresh SubGroup dropdown
                      const subGroupElement = document.getElementById('SubGroup') as any;
                      if (subGroupElement?.ej2_instances?.[0]) {
                        subGroupElement.ej2_instances[0].value = apiData.subGroup || null;
                        subGroupElement.ej2_instances[0].dataBind();
                      }
                      
                      // Refresh Account Category dropdown
                      const accountCategoryElement = document.getElementById('accountCategory') as any;
                      if (accountCategoryElement?.ej2_instances?.[0]) {
                        accountCategoryElement.ej2_instances[0].value = apiData.accountCategory || null;
                        accountCategoryElement.ej2_instances[0].dataBind();
                      }
                    }, 200);
                  } else {
                    this.isSubGroupEnabled.set(false);
                    this.accountForm.get('SubGroup')?.disable();
                  }
                },
                error: (error) => {
                  // Error loading subgroup
                }
              });
           } else {
             // Refresh dropdowns even if no Group
             this.refreshGroupDropdown(null, 0);
             
             const accountCategoryElement = document.getElementById('accountCategory') as any;
             if (accountCategoryElement?.ej2_instances?.[0]) {
               accountCategoryElement.ej2_instances[0].dataBind();
             }
           }
        },
        error: (error) => {
          // Error loading account data
        },
      });

  }

  private refreshGroupDropdown(groupId: number | null, attempt: number): void {
    if (attempt > 10) {
      return;
    }
    
    setTimeout(() => {
      const groupElement = document.getElementById('group') as any;
      
      if (groupElement?.ej2_instances?.[0]) {
        const dropdownInstance = groupElement.ej2_instances[0];
        
        // Set value directly and refresh
        dropdownInstance.value = groupId;
        dropdownInstance.dataBind();
      } else {
        this.refreshGroupDropdown(groupId, attempt + 1);
      }
    }, 300 * (attempt + 1)); // Increasing delay: 300ms, 600ms, 900ms, etc.
  }

  onNew(): void {
    this.isEditMode.set(false);
    this.isNewMode.set(true);
    this.accountForm.reset();
    this.accountForm.enable();
    // Enable dropdown fields
    this.accountForm.get('group')?.enable();
    this.accountForm.get('SubGroup')?.enable();
    this.accountForm.get('accountCategory')?.enable();
    // Reset selected values
    this.selectedGroupId = 0;
    this.selectedGroupName = '';
    this.selectedSubGroupId = 0;
    this.selectedSubGroupName = '';
    this.selectedAccountCategoryId = null;
    this.selectedAccountCategoryName = '';
    this.subGroupData.set([]);
    this.isSubGroupEnabled.set(false);
    this.accountForm.patchValue({
      active: true,
      isGroup: this.isGroup ?? false // Set isGroup based on input value
    });
  }

  onSave(): void {
    if (this.accountForm.valid) {
      const formData = this.accountForm.value;
     const payload:any={
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
        accountName: formData.accountName,
        accountCode: formData.accountCode,
        narration: formData.narration,
        maintainBillwise: formData.maintainBillwise,
        active: formData.active,
        preventExtraPay: formData.preventExtraPay,
        maintainIteamWise: formData.maintainIteamWise,
        trackCollection: formData.trackCollection,
        maintainCostCentre: formData.maintainCostCentre,
        alternateName: formData.alternateName,
        isGroup: formData.isGroup
      }
      // TODO: Implement save logic
    } else {
      // Form is invalid
    }
    {
      
      const payload:any={
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
        accountName: this.accountForm.get('accountName')?.value,
        accountCode: this.accountForm.get('accountCode')?.value,
        narration: this.accountForm.get('narration')?.value,
        maintainBillwise: this.accountForm.get('maintainBillwise')?.value,
        active: this.accountForm.get('active')?.value,
        preventExtraPay: this.accountForm.get('preventExtraPay')?.value,
        maintainIteamWise: this.accountForm.get('maintainIteamWise')?.value,
        trackCollection: this.accountForm.get('trackCollection')?.value,
        maintainCostCentre: this.accountForm.get('maintainCostCentre')?.value,
        alternateName: this.accountForm.get('alternateName')?.value,
        isGroup: this.accountForm.get('isGroup')?.value
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
          accountName: this.accountForm.get('accountName')?.value,
          accountCode: this.accountForm.get('accountCode')?.value,
          narration: this.accountForm.get('narration')?.value,
          maintainBillwise: this.accountForm.get('maintainBillwise')?.value,
          active: true,
          preventExtraPay: this.accountForm.get('preventExtraPay')?.value,
          maintainIteamWise: this.accountForm.get('maintainIteamWise')?.value,
          trackCollection: this.accountForm.get('trackCollection')?.value,
          maintainCostCentre: this.accountForm.get('maintainCostCentre')?.value,
          alternateName: this.accountForm.get('alternateName')?.value,
          isGroup: true
        };
        
        
        if(this.isEditMode() && this.nodeId){
          console.log('update ledger');
          console.log("update payload",payload);
          this.httpService.patch<any[]>(EndpointConstant.UPDATELEDGER+this.nodeId,payload).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          .subscribe({
            next: async (response) => {
              if(response.httpCode == 201){
                this.toast.success("Ledger updated successfully");
              }else{
                this.toast.error("Ledger updated failed");
              }
              this.baseService.showCustomDialogue("Ledger updated successfully");
            
              this.isEditMode.set(false);
              this.isNewMode.set(false);
              this.accountForm.reset();
              this.accountForm.disable();
              
              // Wait for grid data to refresh before updating
              await this.LeftGridInit();
              
              // Update data sharing service with fresh data after grid is refreshed
              this.serviceBase.dataSharingService.setData({
                  columns: this.leftGrid.leftGridColumns,
                  data: this.leftGrid.leftGridData,
                  pageheading: this.pageheading,
                });
              
              // Emit event to notify parent component to refresh tree
              this.dataSaved.emit();
            },
            error: (error) => {
              // Error updating ledger
            },
          });
        } else {
          console.log("create payload",savepayload);
          this.httpService.post<any[]>(EndpointConstant.SAVELEDGER,savepayload).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          .subscribe({
            next: async (response) => {
              if(response.httpCode == 201){
                this.toast.success("Ledger created successfully");

              this.baseService.showCustomDialogue("Ledger created successfully");
                
                // Wait for grid data to refresh before updating
                await this.LeftGridInit();
                
              
                
                this.accountForm.reset();
                this.accountForm.disable();
                this.isNewMode.set(false);
                
                // Emit event to notify parent component to refresh tree
                this.dataSaved.emit();
              }
              
            },
            error: (error) => {
              // Error saving ledger
            },
          });
        }
      }
  }

  onEdit(): void {
    this.isEditMode.set(true);
    this.isNewMode.set(false);
    this.accountForm.enable();
    // Enable dropdown fields
    this.accountForm.get('group')?.enable();
    this.accountForm.get('SubGroup')?.enable();
    this.accountForm.get('accountCategory')?.enable();
  }

  onDelete(): void {
    this.httpService.delete<any[]>(EndpointConstant.DELETELEDGER+this.nodeId).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        if(response.httpCode == 200){
          this.toast.success("Ledger deleted successfully");
          // Emit event to notify parent component to refresh tree
          this.dataSaved.emit();
        }else{
          this.toast.error("Ledger deleted failed");
        }
      },
    // TODO: Implement delete logic
    error: (error) => {
      this.toast.error("Ledger deleted failed");
    },
  });
  }

  onPrint(): void {
    // TODO: Implement print logic
  }

  onPreview(): void {
    // TODO: Implement preview logic
  }
  onGroupChange(event: any): void {
  this.selectedGroupId = event?.itemData?.id || 0;
  this.selectedGroupName = event?.itemData?.name || '';
  
  
  // Reset SubGroup when Group changes
  this.accountForm.get('SubGroup')?.setValue(null);
  this.subGroupData.set([]);
  //this.isSubGroupEnabled.set(false);
  
  this.httpService.fetch<any>(EndpointConstant.FILLSUBGROUPPOPUP+this.selectedGroupId).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
  .subscribe({
    next: (response) => {
      // API returns { data: { subgroup: [...], nextCode: "..." } }
      const subgroupArray = response.data?.subgroup || [];
      this.accountForm.get('accountCode')?.setValue(response.data?.nextCode);
      this.subGroupData.set(subgroupArray);
      
      // Enable SubGroup dropdown if data is available
      if (subgroupArray.length > 0) {
        this.isSubGroupEnabled.set(true);
        this.accountForm.get('SubGroup')?.enable();
        
        // Force change detection and refresh dropdown
        setTimeout(() => {
          const subGroupElement = document.getElementById('SubGroup') as any;
          if (subGroupElement && subGroupElement.ej2_instances) {
            subGroupElement.ej2_instances[0].dataBind();
          }
        }, 100);
      } else {
        this.isSubGroupEnabled.set(false);
        this.accountForm.get('SubGroup')?.disable();
      }
    },
    error: (error) => {
      this.isSubGroupEnabled.set(false);
      this.accountForm.get('SubGroup')?.disable();
    },
  });
}

onSubGroupChange(event: any) {
  this.selectedSubGroupId = event.itemData.id;
  this.selectedSubGroupName = event.itemData.description;
}
fillAccountCategory(): void {
  this.httpService.fetch<Subgroupdatamodel1[]>(EndpointConstant.FILLACCOUNTCATEGORY).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
  .subscribe({
    next: (response) => {
      this.accountCategoryData.set(response.data);
    },
    error: (error) => {
      // Error fetching account category data
    },
  });
  // Fetch group data - implement based on your endpoint

}
onAccountCategoryChange(event: any) {
  this.selectedAccountCategoryId = event.itemData.id;
  this.selectedAccountCategoryName = event.itemData.description;

}
ngOnDestroy(): void {
  this.nodeId = null;
  this.accountForm.reset();
  this.accountForm.disable();
  this.isEditMode.set(false);
  this.isNewMode.set(false);
  this.selectedGroupId = 0;
  this.selectedGroupName = '';
  this.selectedSubGroupId = 0;
  this.selectedSubGroupName = '';
  this.selectedAccountCategoryId = null;
  this.selectedAccountCategoryName = '';
  this.groupdata.set([]);
  this.subGroupData.set([]);
  this.accountCategoryData.set([]);
  this.isSubGroupEnabled.set(false);
  this.accountForm.get('SubGroup')?.disable();
  this.accountForm.get('accountCategory')?.disable();
  this.accountForm.get('group')?.disable();
  this.accountForm.get('accountCode')?.disable();}
}
