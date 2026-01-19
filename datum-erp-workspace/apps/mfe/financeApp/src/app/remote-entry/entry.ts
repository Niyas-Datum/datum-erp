import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { LeftGridDto } from '@org/models';
import { DataSharingService, FormToolbarService } from '@org/services';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-financeApp-entry',
  standalone: false,
    template: `
    <div class="container-fluid mt-3">
<div class="row">
        <!-- Left Grid -->
        <div class="col-md-2">
          <div class="row">
                  <div [ngSwitch]="pageType" class="col-md-2 col-sm-2" >
                         
                                        <div  *ngSwitchCase="1">
                                          <button (click)="toggleSidebar()" class="e-btn-sm">
                                            <span
                                              class="e-btn-icon e-icons  e-elaborate"
                                              style="color: $secondary; font-size: 1.8rem;"
                                            ></span>
                                          </button>
                                        </div>
                             
                    </div>
            <div class="col-md-
            9 col-sm-10">
              <div style="font-size: 1.3rem; font-weight: 500; color: #666666;">
                {{ pageheading }}
              </div>
            </div>
          </div>
        </div>
        <!-- col -2-d end -->
        <div class="col-md-9">
          <app-form-toolbar
            [isNewMode]="isNewMode"
            [isEditMode]="isEditMode"
            [isNewBtnDisabled]="isNewBtnDisabled"
            [isEditBtnDisabled]="isEditBtnDisabled"
            [isDeleteBtnDisabled]="isDeleteBtnDisabled"
            [isSaveBtnDisabled]="isSaveBtnDisabled"
            [isPrintBtnDisabled]="isPrintBtnDisabled"
            (new)="onNewClick()"
            (delete)="onDeleteClick()"
            (save)="onSaveClick()"
            (print)="onPrintClick()"
            (edit)="onEditClick()"
          >
          </app-form-toolbar>
        </div>
        <!-- col-9 end -->
      </div>
      
      <!-- row end -->


      <div [ngSwitch]="pageType">
         <div *ngSwitchDefault>

      <!-- SIDEBAR OUTSIDE OF THE ROW -->
      <!-- SIDEBAR -->
      <section class="leftgrid-section" >
        <ejs-sidebar
          id="sideTree"
          [(isOpen)]="isSidebarVisible"
          [width]="width"
          [target]="target"
          [mediaQuery]="mediaQuery"
          [type]="sidebarType"
          position="Left"
        >
          <div class="p-1">
            <!-- Replace with real component -->
            <app-left-grid
              (rowSelected)="onCostCategorySelected($event)"
              [columns]="leftgridchildData.columns"
            >
            </app-left-grid>
          </div>
        </ejs-sidebar>

        <!-- MAIN CONTENT WRAPPER -->
        <!-- pagetype 1 [leftgrid and page] -->
        <div class="main-content-wrapper container-fluid">
          <div class="row mt-2" style="min-height: 70vh;">
            <div
              [ngClass]="isSidebarVisible ? 'col-8' : 'col-12'"
              class="transition-col"
            >
              <div
                class="odoo-form-bg row"
                style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 24px 18px 18px 18px; margin-bottom: 18px;"
              >
                <router-outlet></router-outlet>
              </div>
            </div>
          </div>
        </div>
       

      </section>
       </div>
      <div *ngSwitchCase="2"                 style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 24px 18px 18px 18px; margin-bottom: 18px;"
>
          <router-outlet></router-outlet>

     </div>
     </div>
    </div>
    <!---  Container --->
    <div id="dialogContainer">
      <div id="alertDialog" #dialogAlert></div>
    </div>
  `,
})
export class RemoteEntry implements OnInit,AfterViewInit{
  public pageType=0 ;
  public pageheading = '';
    // Left side sectio hide and show
  // Sidebar config
  isSidebarVisible = true;
  sidebarType = 'Push'; // or 'Slide'
  width = '300px';
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

    ngOnInit() {
  
    this.sharedService.leftdata$.subscribe((data) => {
      this.leftgridchildData = data;
      this.pageheading = data.pageheading || '';
      console.log('58005', this.leftgridchildData.data);
    });
     this.formToolbarService.leftGridView$.subscribe((data)=>{
      
      this.pageType = this.formToolbarService.pagetype;   
      console.log(this.formToolbarService.pagetype);
    })
  }
    constructor() {
    this.pageheading = 'General ';
      this.pageType = 1;
    console.log('Constructor - Remote Entry Component');
  }
  ngAfterViewInit() {
    this.sharedService.leftdata$.subscribe((data) => {
      this.leftgridchildData = data;
      this.pageheading = data.pageheading || '';
      console.log('58005', this.leftgridchildData.data);
    });
  }
    onCostCategorySelected(event: any) {
    this.isSaveBtnDisabled = true;
    this.isEditBtnDisabled = false;
    this.isDeleteBtnDisabled = false;
    console.log('Cost Category selected in Remote Entry:', event);

    this.formToolbarService.emitLeftGridClicked(event);

    // TODO: Implement event handler logic
  }

  onLeftGridClicked(event: any) {
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
