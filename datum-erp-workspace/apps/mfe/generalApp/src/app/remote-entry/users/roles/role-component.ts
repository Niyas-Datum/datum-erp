import { Component, inject,OnInit, ViewChild,} from '@angular/core';
import {FormControl,FormGroup, Validators } from '@angular/forms';
import { GeneralAppService } from '../../http/general-app.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { registerLicense } from '@syncfusion/ej2-base';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { FILLROLEDATA, Role, ROLERIGHTS } from '../model/puserrole.model';
import { BaseService } from '@org/services';
import { GridComponent } from '@syncfusion/ej2-angular-grids';

@Component({
  selector: 'app-role-Main',
  standalone: false,
  templateUrl: './role-component.html',
  styles: [],
})
export class RoleComponent extends BaseComponent implements OnInit {
  @ViewChild('userRightsGrid', { static: true }) 
  public userRightsGrid: GridComponent | undefined;
  
  private httpService = inject(GeneralAppService);
  private baseService = inject(BaseService);
  userRoleForm = this.formUtil.thisForm;

  selectedUserRoleId!: number;
  firstUserRole!:number;
  currentUserRole = {} as FILLROLEDATA;
  allUserRights:any = [] as Array<ROLERIGHTS>;
  isUpdate=false;
  isDelete=false;
  isInputDisabled: boolean = true;
  initialUserRights:any = [] as Array<ROLERIGHTS>;

  
  selectAllIsViewChecked = false;
  selectAllIsCreateChecked = false;  
  selectAllIsEditChecked = false;
  selectAllIsCancelChecked = false;
  selectAllIsDeleteChecked = false;
  selectAllIsApproveChecked = false;
  selectAllisEditApprovedChecked = false;
  selectAllIsHigherApproveChecked = false;
  selectAllIsPrintChecked = false;
  selectAllIsEmailChecked = false;
  selectAllIsFrequentlyUsedChecked = false;
  selectAllIsPageChecked = false;
  selectAllChecked = false;
  
  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    console.log(this.currentPageInfo?.menuText);
    this.userRoleForm.disable();
    this.fetchuserrights();
  }
  override FormInitialize() {
    this.userRoleForm = new FormGroup({
      role: new FormControl({ value: '', disabled: false },Validators.required),
      active: new FormControl({ value: 'true', disabled: false }),
      value: new FormControl({ value: '', disabled: false }),
      description: new FormControl({ value: '', disabled: false }),
    });
    console.log('form init started');
  }

fetchuserrights(): void {
  this.httpService.fetch(EndpointConstant.FILLUSERROLEBYID + '0')
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        const data = response?.data as { fillRoleRights: any[] };
        this.allUserRights = (data.fillRoleRights || []).map((item: any, index: number) => ({
          ...item,
          // ✅ Convert number|null → boolean
          isView: !!item.isView,
          isCreate: !!item.isCreate,
          isEdit: !!item.isEdit,
          isCancel: !!item.isCancel,
          isDelete: !!item.isDelete,
          isApprove: !!item.isApprove,
          isEditApproved: !!item.isEditApproved,
          isHigherApprove: !!item.isHigherApprove,
          isPrint: !!item.isPrint,
          isEmail: !!item.isEmail,
          rowIndex: index  // ✅ Fix rowIndex
        }));
        this.initialUserRights = [...this.allUserRights];
      }
    });
}
    updateHeaderState(columnname: string): boolean {
    const allChecked = this.allUserRights.every((row: any) => row[columnname]);
    switch(columnname) {
      case 'isView': this.selectAllIsViewChecked = allChecked; break;
      case 'isCreate': this.selectAllIsCreateChecked = allChecked; break;
      case 'isEdit': this.selectAllIsEditChecked = allChecked; break;
      case 'isCancel': this.selectAllIsCancelChecked = allChecked; break;
      case 'isDelete': this.selectAllIsDeleteChecked = allChecked; break;
      case 'isApprove': this.selectAllIsApproveChecked = allChecked; break;
      case 'isEditApproved': this.selectAllisEditApprovedChecked = allChecked; break;
      case 'isHigherApprove': this.selectAllIsHigherApproveChecked = allChecked; break;
      case 'isPrint': this.selectAllIsPrintChecked = allChecked; break;
    }
    return allChecked;
  }

  override newbuttonClicked(): void {
    console.log('New button clicked');
    this.userRoleForm.enable();
    this.isInputDisabled = false;
     this.userRoleForm.reset();
     this.allUserRights = this.initialUserRights;
  }

  override onEditClick(){
    console.log('we have entered in to edit mode ')
    this.isUpdate = true;
    this.userRoleForm.enable();
    this.isInputDisabled = false;
  }

  override SaveFormData() {
    console.log(this.userRoleForm.controls);
    this.saveUserRole();
  }
  private  saveUserRole() {
    if (this.userRoleForm.invalid) {
      for (const field of Object.keys(this.userRoleForm.controls)) {
        const control: any = this.userRoleForm.get(field);
        if (control.invalid) {
          this.baseService.showCustomDialogue('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }
   const rolerightArray = this.allUserRights.map((item: ROLERIGHTS) => ({
  roleId: item.roleId || 0,
  pageMenuId: item.pageMenuId,
  isView: Boolean(item.isView),
  isCreate: Boolean(item.isCreate),
  isEdit: Boolean(item.isEdit),
  isCancel: Boolean(item.isCancel),
  isDelete: Boolean(item.isDelete),
  isApprove: Boolean(item.isApprove),
  isEditApproved: Boolean(item.isEditApproved),
  isHigherApprove: Boolean(item.isHigherApprove),
  isPrint: Boolean(item.isPrint),
  isEmail: Boolean(item.isEmail || false)
}));

  const payload = {
    id: this.isUpdate ? this.selectedUserRoleId : 0,
    role: this.userRoleForm.value.role || '',
    active: Boolean(this.userRoleForm.value.active),
    rolerightDto: rolerightArray
  };

  console.log('Final payload:', JSON.stringify(payload, null, 2)); // Debug

    if(this.isUpdate){
      this.updateCallback(payload);
    } else{
      this.createCallback(payload);
    }
  }

  updateCallback(payload:any){
    this.httpService.patch(EndpointConstant.UPDATEUSERROLE,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          if(response.httpCode == 500){
            this.baseService.showCustomDialogue(response.data as any);
          }
          if(response.httpCode == 201){
            this.baseService.showCustomDialogue('Successfully updated user role');          
            this.selectedUserRoleId = this.firstUserRole;
            this.LeftGridInit();
           
          }          
        },
        error: (errormsg) => {
          console.log(errormsg);
        },
      });
  }

  createCallback(payload:any){    
    this.httpService.post(EndpointConstant.SAVEUSERROLE,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          if(response.httpCode == 500){
            this.baseService.showCustomDialogue(response.data as any);
          }
          if(response.httpCode == 200){
            this.baseService.showCustomDialogue('Successfully saved user role'); 
            this.selectedUserRoleId = this.firstUserRole;
            this.LeftGridInit();
          }     
        },
        error: (errormsg) => {
          console.log(errormsg);
        },
      });
  }

onChangeSingleRight(event: any, fieldName: string, rowIndex: number) {
  const isChecked = event.target.checked;
  this.allUserRights[rowIndex][fieldName] = isChecked;
  
  // ✅ Sync header state
  this.updateHeaderState(fieldName);
  
  // ✅ Refresh grid
  this.userRightsGrid?.refreshColumns();
  
  console.log(`Row ${rowIndex}, ${fieldName}: ${isChecked}`);
}

  selectAllCheckboxes(columnname: string) {
  const checkedStatus = this.switchCheckbox(columnname);
  
  // ✅ Update ALL rows
  this.allUserRights.forEach((row: any) => {
    row[columnname] = checkedStatus;
  });
  
  // ✅ CRITICAL: Refresh Grid (WAS MISSING)
  setTimeout(() => {
    this.userRightsGrid?.dataBind();
    this.userRightsGrid?.refreshColumns();
  }, 0);
  
  console.log(`✅ ${columnname} column: ${checkedStatus ? 'SELECTED' : 'DESELECTED'}`);
}
    switchCheckbox(columnname: string) {
    switch (columnname) {
      case 'isView':
        return this.selectAllIsViewChecked = !this.selectAllIsViewChecked;
      case 'isCreate':
        return this.selectAllIsCreateChecked = !this.selectAllIsCreateChecked;
      case 'isEdit':
        return this.selectAllIsEditChecked = !this.selectAllIsEditChecked;
        case 'isCancel':
        return this.selectAllIsCancelChecked = !this.selectAllIsCancelChecked;
      case 'isDelete':
        return this.selectAllIsDeleteChecked = !this.selectAllIsDeleteChecked;
      case 'isApprove':
        return this.selectAllIsApproveChecked = !this.selectAllIsApproveChecked;
      case 'isEditApproved':
        return this.selectAllisEditApprovedChecked = !this.selectAllisEditApprovedChecked;
      case 'isHigherApprove':
        return this.selectAllIsHigherApproveChecked = !this.selectAllIsHigherApproveChecked;
      case 'isPrint':
        return this.selectAllIsPrintChecked = !this.selectAllIsPrintChecked;
      default:
        return false;
    }
  }

  override async LeftGridInit() {
    this.pageheading = 'User Role';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLUSERROLES)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      // handle data here after await completes
      this.leftGrid.leftGridData = res.data;
      console.log('Fetched data:', this.leftGrid.leftGridData);

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'User Role List',
          columns: [
            {
              field: 'createdOn',
              datacol: 'createdOn',
              headerText: 'CreatedOn',
              textAlign: 'Left',
            },
            {
              field: 'active',
              datacol: 'active',
              headerText: 'Active',
              textAlign: 'Left',
            },
            {
              field: 'role',
              datacol: 'role',
              headerText: 'Role',
              textAlign: 'Left',
            },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }

  override getDataById(data: Role) {
    console.log('data', data);
    this.selectedUserRoleId = data.id;
    console.log(this.selectedUserRoleId);
      this.fetchUserRoleById();
  }

 fetchUserRoleById(): void {
  this.httpService.fetch(EndpointConstant.FILLUSERROLEBYID + this.selectedUserRoleId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        this.currentUserRole = response?.data as any;
        const userrole = this.currentUserRole.fillRole;

        // ✅ Convert API numbers → booleans + add rowIndex
        this.allUserRights = (this.currentUserRole.fillRoleRights || []).map((item: any, index: number) => ({
          ...item,
          isView: !!item.isView,
          isCreate: !!item.isCreate,
          // ... all other fields
          isEdit: !!item.isEdit,
          isCancel: !!item.isCancel,
          isDelete: !!item.isDelete,
          isApprove: !!item.isApprove,
          isEditApproved: !!item.isEditApproved,
          isHigherApprove: !!item.isHigherApprove,
          isPrint: !!item.isPrint,
          isEmail: !!item.isEmail,
          rowIndex: index
        }));
        this.initialUserRights = [...this.allUserRights];

        this.userRoleForm.patchValue({
          role: userrole.role,
          active: userrole.active,
        });
      }
    });
}

  override DeleteData(data: FILLROLEDATA) {
    console.log('deleted');
     if(!this.isDelete){
      this.baseService.showCustomDialogue('Permission Denied!');
      return false;
    }
    if(confirm("Are you sure you want to delete this details?")) {
      this.httpService.delete(EndpointConstant.DELETEUSERROLE+this.selectedUserRoleId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          if(response.httpCode == 500){
            this.baseService.showCustomDialogue(response.data as any);
          }
          if(response.httpCode == 200){
            this.baseService.showCustomDialogue(response.data as any);          
            this.selectedUserRoleId = this.firstUserRole;
            this.LeftGridInit();
          }          
        },
        error: (errormsg) => {
          console.log(errormsg);
        },
      });
    }
    return true;
  }

  override formValidationError(){
    console.log("form error found");
  }

}
