/* eslint-disable @angular-eslint/component-selector */
import { AfterViewInit, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { LeftGridDto } from '@org/models';
import { DataSharingService, FormToolbarService } from '@org/services';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-inventoryApp-entry',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  styles: [`

.container-fluid{
  height:100vh;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
ejs-sidebar .p-2 {
  height: 100%;
  padding: 0 !important;
}

app-left-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:host ::ng-deep .e-grid {
  height: 100% !important;
}

`]
  ,
  templateUrl: './entry.html',
})
export class RemoteEntry {
  public pageType: number;
  public pageheading: string;

  /** Button click counts
   * Tracks the number of times each button is clicked
   */
  private  newbuttonClick:number=0;
  private  editbuttonClick:number=0;


  // Left side section - hide and show
  // Sidebar configuration
  isSidebarVisible = true;
  sidebarType = 'Push'; // or 'Slide'
  width = '260px';
  target = '.main-content-wrapper';
  mediaQuery = '(min-width: 768px)';

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }


  /// Service registration
  private formToolbarService = inject(FormToolbarService);

  private sharedService = inject(DataSharingService);

  /// NgOnInit to subscribe data
  public leftgridchildData: LeftGridDto = new BehaviorSubject<LeftGridDto>({
    columns: [],
    data: [],
  }).value;
  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngOnInit() {

    this.sharedService.leftdata$.subscribe((data) => {
      this.leftgridchildData = data;
      this.pageheading = data.pageheading || '';
      console.log('58005', this.leftgridchildData.data);
    });
    this.formToolbarService.leftGridView$.subscribe((data) => {

      this.pageType = this.formToolbarService.pagetype;
      console.log(this.formToolbarService.pagetype);
    });

    // Apply toolbar state from child (e.g. Sales Invoice) so Save is enabled when in New Mode
    this.formToolbarService.getToolbarState$().subscribe((state) => {
      if (state.isSaveBtnDisabled !== undefined) this.isSaveBtnDisabled = state.isSaveBtnDisabled;
      if (state.isNewMode !== undefined) this.isNewMode = state.isNewMode;
      if (state.isEditMode !== undefined) this.isEditMode = state.isEditMode;
      if (state.isEditBtnDisabled !== undefined) this.isEditBtnDisabled = state.isEditBtnDisabled;
      if (state.isDeleteBtnDisabled !== undefined) this.isDeleteBtnDisabled = state.isDeleteBtnDisabled;
      if (state.isNewBtnDisabled !== undefined) this.isNewBtnDisabled = state.isNewBtnDisabled;
      if (state.isPrintBtnDisabled !== undefined) this.isPrintBtnDisabled = state.isPrintBtnDisabled;
    });
  }

  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngAfterViewInit() {
    this.sharedService.leftdata$.subscribe((data) => {
      this.leftgridchildData = data;
      this.pageheading = data.pageheading || '';
      console.log('58005', this.leftgridchildData.data);
    });
      /// new updates
      /**
       * @author Niyas
       * @description On form load, left grid should be disabled and New, Save buttons should be enabled. Once user clicks on New or selects a record from left grid, left grid should be enabled.
       * First Form Load "
       * Buttons -enable : New, Save
       * Left Grid - disable
       */

      this.isLeftGridDisabled = true;
      this.isNewBtnDisabled = false;
      this.isSaveBtnDisabled = false;

 console.log("onload - make leftgrid disabled" )
  }
  constructor() {
    this.pageheading = 'General ';
    this.pageType = 1;
    console.log('Constructor - Remote Entry Component');
  }

  // allCostCategories  = [ {
  //   id: 1,
  //   turbineName: 'Elspec',
  //   controlMode: "admin",
  //   hasVisibilitySensor: true,
  //   isRimTurbine: false,
  //   intensityLevelLow: 0,
  //   intensityLevelMedium: 1,
  //   intensityLevelHigh: 2,
  // }]; // TODO: Replace with actual data
  // leftGridColumns = [
  //   {
  //     headerText: 'Personal Info',
  //     columns: [
  //       { field: 'turbineName', datacol:'turbineName', headerText: 'Admin', width: 120, textAlign: 'Left' },
  //       { field: 'controlMode', datacol:'controlMode', headerText: 'User', width: 120, textAlign: 'Left' }
  //     ]
  //   },

  // ]; // Updated column definitions

  onCostCategorySelected(event: any) {
    this.isSaveBtnDisabled = true;
    this.isEditBtnDisabled = false;
    this.isDeleteBtnDisabled = false;
    console.log('Cost Category selected in Remote Entry:', event);

    this.formToolbarService.emitLeftGridClicked(event);

    // TODO: Implement event handler logic
  }

  // Add the missing properties and methods
  isNewMode = false;
  isEditMode = false;
  isNewBtnDisabled = false;
  isEditBtnDisabled = true;
  isDeleteBtnDisabled = true;
  isSaveBtnDisabled = true;
  isPrintBtnDisabled = true;
  isLeftGridDisabled = true;


  onDeleteClick() {
    this.formToolbarService.emitDeleteClicked();
    this.isSaveBtnDisabled = true;
    this.isNewBtnDisabled = true;
  }
  onPrintClick() {
    /* TODO: Implement print click logic */
  }
  onEditClick() {
       this.editbuttonClick++;
       /**
        * @description On first click of Edit,
        *  New and Save buttons should be disabled and left grid should be disabled. 
        * On second click of Edit, New button should be enabled, 
        * Save button should be disabled and left grid should be disabled.
        **/
    if(this.editbuttonClick === 1){
          this.isNewBtnDisabled = true;
          this.isEditBtnDisabled = false;
          this.isDeleteBtnDisabled = true;
          this.isLeftGridDisabled = true;
          this.isSaveBtnDisabled = false;
    }else if(this.editbuttonClick === 2){
           this.isNewBtnDisabled = false;
          this.isEditBtnDisabled = false;
          this.isDeleteBtnDisabled = false;
          this.isLeftGridDisabled = false;
          this.isSaveBtnDisabled = true;
          this.editbuttonClick = 0;
    }
    this.formToolbarService.emitEditClicked( this.editbuttonClick);
  }

  /// New button clicked\
  /// Button Visible:  new edit delete
  onNewClick() {
    this.newbuttonClick++;
    if(this.newbuttonClick === 1){
          this.isNewBtnDisabled = false;
          this.isEditBtnDisabled = false;
          this.isDeleteBtnDisabled = false;
          this.isLeftGridDisabled = false;
          this.isSaveBtnDisabled = true;
    }else if(this.newbuttonClick === 2){
           this.isNewBtnDisabled = false;
          this.isEditBtnDisabled = true;
          this.isDeleteBtnDisabled = true;
          this.isLeftGridDisabled = true;
          this.isSaveBtnDisabled = false;
          this.newbuttonClick = 0;
    }
    // Emit the new clicked event
    this.formToolbarService.emitNewClicked(this.newbuttonClick);
  }

  onSaveClick() {
    this.formToolbarService.emitSaveClicked();
    // The actual form data will be sent from the child via the service (see below)
  }

  leftGridView() {
    // this.isSidebarVisible = !this.isSidebarVisible;
    // console.log('Left Grid View clicked');
  }
}
