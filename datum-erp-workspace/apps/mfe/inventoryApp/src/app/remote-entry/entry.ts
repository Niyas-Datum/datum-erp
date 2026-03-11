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
/* Fix the typo from container-fluidz to container-fluid */
.container-fluid {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Ensure the sidebar inner container fills height */
ejs-sidebar .p-2 {
  height: 100%;
  padding: 0 !important; /* Optional: remove padding if you want the grid flush */
}

/* IMPORTANT: Force the app-left-grid and its internal Syncfusion Grid to 100% */
app-left-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* This targets the Syncfusion Grid component inside app-left-grid */
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


  // Left side section - hide and show
  // Sidebar configuration
  isSidebarVisible = true;
  sidebarType = 'Push'; // or 'Slide'
  width = '258px';
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
    })
  }

  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngAfterViewInit() {
    this.sharedService.leftdata$.subscribe((data) => {
      this.leftgridchildData = data;
      this.pageheading = data.pageheading || '';
      console.log('58005', this.leftgridchildData.data);
    });


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

  onDeleteClick() {
    this.formToolbarService.emitDeleteClicked();
    this.isSaveBtnDisabled = true;
    this.isNewBtnDisabled = true;
  }
  onPrintClick() {
    /* TODO: Implement print click logic */
  }
  onEditClick() {
    this.isSaveBtnDisabled = false;
    this.formToolbarService.emitEditClicked();
  }

  onNewClick() {
    this.formToolbarService.emitNewClicked();
    this.isSaveBtnDisabled = false;
    this.isEditBtnDisabled = true;
    this.isDeleteBtnDisabled = true;
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
