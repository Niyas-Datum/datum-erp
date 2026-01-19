import { Component, Input, Output, Renderer2,EventEmitter, inject, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import { PageMenu, UserRoles } from '../model/puser.model';
import { BaseService } from '@org/services';
import { GeneralAppService } from '../../http/general-app.service';
import { BaseComponent } from '@org/architecture';
import { EndpointConstant } from '@org/constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';

@Component({
  selector: 'app-userrole-popup',
  standalone: false,
  templateUrl: './userrole-popup.component.html',
  styleUrls: [],
})
export class UserrolepopupComponent extends BaseComponent implements OnInit{  
    @ViewChild('roles') roles: any;
  @Input() maRoleId:number = 1;
  @Input() userRights:any = [];
  @Output() selectedUserRights = new EventEmitter<any>();

  showPopup = true;
  isLoading = false;
  allPageMenus = [] as Array<PageMenu>; 
  filteredContent = [] as Array<PageMenu>; 
  allUserRoles = [] as Array<UserRoles>;  
  destroySubscription: Subject<void> = new Subject<void>();
  searchTerm: string = '';
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

userRoleForm!: FormGroup;
roleMenus: any[] = [];


    private httpService = inject(GeneralAppService);
    private baseService = inject(BaseService);
    private renderer = inject(Renderer2);
    private datePipe = inject(DatePipe);
    private cdr = inject (ChangeDetectorRef);

ngOnInit() {
  this.FormInitialize();
  console.log("Popup opened with maRoleId:", this.maRoleId);
  this.fetchUserRoles();
}

override FormInitialize() { 
    this.userRoleForm = new FormGroup({
      userrole: new FormControl({ value: '', disabled: false },Validators.required),
    });
    if(this.userRights){
       this.allPageMenus = this.userRights.map((item:any) => Object.assign({}, item));
       this.filteredContent = this.allPageMenus;
     }
    console.log('form init started');
  }

fetchUserRoles(): void {
  this.isLoading = true;
  this.httpService
    .fetch(EndpointConstant.FILLROLEDROPDOWN)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        this.isLoading = false;
        this.allUserRoles = response?.data ?? [] as any;

        console.log("Loaded roles:", this.allUserRoles);

        this.cdr.detectChanges();
        if (this.roles) {
          this.roles.dataBind();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('An Error Occured', error);
      },
    });
}

  fetchUserRoleById(roleid:number): void {
    this.isLoading = true;
    this.httpService
    .fetch(EndpointConstant.FILLROLEBYID+roleid)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        this.isLoading = false;
        this.allPageMenus = response?.data as any;
        this.filteredContent = this.allPageMenus;  
         // ✅ bind to grid
        this.roleMenus = this.filteredContent;    
      },
      error: (error) => {
        this.isLoading = false;
        console.error('An Error Occured', error);
        this.roleMenus = [];
      },
    });
  }

  updateFilter(event: any) {
    const inputVal = event.target.value.toLowerCase();
    this.searchTerm = inputVal;
    // Custom filter function to search based on two columns
    this.filterUserRights(inputVal);
    
  }

  filterUserRights(inputVal:string){
    this.filteredContent = this.allPageMenus.filter(row => {
      return (row.pageName.toLowerCase().includes(inputVal) || row.moduleType.toLowerCase().includes(inputVal));
    });
  }

 onClickOk() {
    this.renderer.setStyle(document.body, 'overflow', 'auto');
   
    const OutputObject = {
      "maRoleId":this.maRoleId,
      "pageMenus":this.allPageMenus
    }
    this.selectedUserRights.emit(OutputObject);
    this.showPopup = false;  
  }

  onClickCancel(){    
    this.renderer.setStyle(document.body, 'overflow', 'auto');
    this.allPageMenus = [];
    this.filteredContent = []
    this.showPopup = false; 

    this.selectedUserRights.emit(null);
  }

// onUserRoleSelect(event: any) {
//   const selectedRoleId = event.value;

//   if (this.maRoleId && this.maRoleId !== selectedRoleId) {
//     if (!window.confirm('Role information will be cleared')) {
//       return;
//     }
//   }

//   this.maRoleId = selectedRoleId;
//   this.fetchUserRoleById(this.maRoleId);
// }
onUserRoleSelect(event: Event) {
  const selectedRoleId = Number((event.target as HTMLSelectElement).value);

  if (this.maRoleId && this.maRoleId !== selectedRoleId) {
    if (!window.confirm('Role information will be cleared')) {
      // revert select to previous value if needed
      (event.target as HTMLSelectElement).value = String(this.maRoleId);
      return;
    }
  }

  this.maRoleId = selectedRoleId;
  this.fetchUserRoleById(this.maRoleId);
}

  getRowHeight(row: any) {
    return 50; // Example height (adjust as needed)
  }

  selectAllCheckboxes(columnname: string) {
    let checkedStatus = this.switchCheckbox(columnname);
  
    if (columnname === 'all') {
      this.allPageMenus.forEach((row: any) => {
        row.isView = checkedStatus; 
        row.isCreate = checkedStatus; 
        row.isEdit = checkedStatus; 
        row.isCancel = checkedStatus; 
        row.isDelete = checkedStatus; 
        row.isApprove = checkedStatus; 
        row.isEditApproved = checkedStatus; 
        row.isHigherApprove = checkedStatus; 
        row.isPrint = checkedStatus; 
        row.isEmail = checkedStatus; 
        row.frequentlyUsed = checkedStatus; 
        row.isPage = checkedStatus; 
      });
    } else{
      this.allPageMenus.forEach((row: any) => row[columnname] = checkedStatus);
    }
    this.filterUserRights(this.searchTerm);
    //this.filteredContent = this.allPageMenus;
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
      case 'isEmail':
        return this.selectAllIsEmailChecked = !this.selectAllIsEmailChecked;
      case 'isFrequentlyUsed':
        return this.selectAllIsFrequentlyUsedChecked = !this.selectAllIsFrequentlyUsedChecked;
      case 'isPage':
        return this.selectAllIsPageChecked = !this.selectAllIsPageChecked;
      case 'all':
        return this.selectAllChecked = !this.selectAllChecked;
      default:
        return false;
    }
  }

  selectRow(event: any, rowIndex: number) {   
    const isChecked = event.target.checked;
    this.allPageMenus[rowIndex]['isView'] = isChecked;
    this.allPageMenus[rowIndex]['isCreate'] = isChecked;
    this.allPageMenus[rowIndex]['isEdit'] = isChecked;
    this.allPageMenus[rowIndex]['isCancel'] = isChecked;
    this.allPageMenus[rowIndex]['isDelete'] = isChecked;
    this.allPageMenus[rowIndex]['isApprove'] = isChecked;
    this.allPageMenus[rowIndex]['isEditApproved'] = isChecked;
    this.allPageMenus[rowIndex]['isHigherApprove'] = isChecked;
    this.allPageMenus[rowIndex]['isPrint'] = isChecked;
    this.allPageMenus[rowIndex]['isEmail'] = isChecked;
    this.allPageMenus[rowIndex]['frequentlyUsed'] = isChecked;
    this.allPageMenus[rowIndex]['isPage'] = isChecked;
    this.filterUserRights(this.searchTerm);
    //this.filteredContent = this.allPageMenus;
  }

  onChangeSingleRight(event: any, fieldName: string, rowIndex: number) {   
    const isChecked = event.target.checked;
    this.allPageMenus[rowIndex][fieldName] = isChecked;
    this.filterUserRights(this.searchTerm);
    //this.filteredContent = this.allPageMenus; 
  }
  
}
