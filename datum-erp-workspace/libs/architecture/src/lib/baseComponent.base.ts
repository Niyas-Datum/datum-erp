import { ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { SeviceInjectBase } from './SeviceInject.base';
import { formUtilBase } from './form-utils.base';
import { LeftGridBase } from './leftGrid.base';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { MenuItemDto } from '@org/models';
import { ToastService } from '@org/ui';
export abstract class BaseComponent {
  protected serviceBase = new SeviceInjectBase();
  protected formUtil = new formUtilBase();
  protected leftGrid = new LeftGridBase();
  protected pageheading!: string;
  protected leftgridSelectedData: any;
  protected currentPageInfo?: MenuItemDto;
  protected toast = inject(ToastService); // <-- use DI service


  

  commonInit() {
    console.log('init');
  }

  onInitBase() {

      this.serviceBase.dataSharingService.currentPageInfo$.subscribe(info => {
           this.currentPageInfo = info;
           console.log('Current page info:', this.currentPageInfo.url);
      });

    //
    this.FormInitialize();
    this.runProcess();
    this.serviceBase.formToolbarService.leftGridClicked$.subscribe(() => {
      this.leftgridSelectedData = this.serviceBase.formToolbarService.leftgridselectedData;
      this.getDataById(this.leftgridSelectedData);
    });

    // console.log(this.leftGrid.leftGridColumns);
    //                           this.serviceBase.dataSharingService.setData({
    //                                       columns:  this.leftGrid.leftGridColumns,
    //                                       data:  this.leftGrid.leftGridData,
    //                                       pageheading: this.pageheading
    //                                     });
    //           });

    this.serviceBase.formToolbarService.newClicked$.subscribe(() => {

         if(!this.currentPageInfo?.isCreate || this.currentPageInfo?.isCreate===0){
          this.toast.warning('You do not have permission to create new records.');
          return;
         }

      console.log('New button clicked - Cost Category Component');
      // this.costCategoryForm.enable();

     this.newbuttonClicked();

    });

    //edit  click
    this.serviceBase.formToolbarService.editClicked$.subscribe(() => {
       if(!this.currentPageInfo?.isEdit || this.currentPageInfo?.isEdit===0){
          this.toast.warning('You do not have permission to edit records.');
          return;
         }
      console.log('edit clicked - Cost Category Component');
      this.onEditClick();
      // this.costCategoryForm.enable();
      // this.initializeForm();
    });
    this.serviceBase.formToolbarService.deleteClicked$.subscribe(() => {
       if(!this.currentPageInfo?.isDelete || this.currentPageInfo?.isDelete===0){
          this.toast.warning('You do not have permission to delete records.');
          return;
         }
      this.DeleteData(this.leftgridSelectedData);
    });
    this.serviceBase.formToolbarService.saveClicked$.subscribe(() => {

       if(!this.currentPageInfo?.isCreate || this.currentPageInfo?.isCreate===0 || !this.currentPageInfo?.isEdit || this.currentPageInfo?.isEdit===0){
          this.toast.warning('You do not have permission to save new records.');
          return;
         }
      if (this.formUtil.thisForm.invalid) {
        for (const field of Object.keys(this.formUtil.thisForm.controls)) {
          const control: any = this.formUtil.thisForm.get(field);
          if (control.invalid) {
            this.formValidationError();

            // this.baseService.showCustomDialogue('Invalid field: ' + field);
            return; // Stop after showing the first invalid field
          }
        }
      
        return;
      }
        this.SaveFormData();
    });
  }

  SetPageType=(status:number)=>{
    this.serviceBase.formToolbarService.emitLeftGridViewSatus(status);

  }


  // new button clicked 
  protected newbuttonClicked() {

    console.log(this.currentPageInfo?.isHigherApprove)

    console.log('new button clicked - base component');
  
  }

  protected FormInitialize() {
    console.log('form initialization missing');
  }
// protected onEditClick(){
//   console.log("edit operation");
// }
  protected SaveFormData() {
    console.log('save opertion not started');
  }
  protected onEditClick() {
    console.log('edit opertion not started');
  }
  protected DeleteData(data: any) {
    console.log('save opertion not started');
  }

  protected formValidationError() {
    console.log('save opertion not started');
  }
  protected getDataById(data: any) {
    console.log('save opertion not started');
  }

  protected async LeftGridInit() {
    console.log('Data fetched');
  }

  protected async runProcess() {
    console.log('Start process');
    const result = await this.LeftGridInit(); // Wait until fetchData() completes
    console.log(result);
    this.serviceBase.dataSharingService.setData({
      columns: this.leftGrid.leftGridColumns,
      data: this.leftGrid.leftGridData,
      pageheading: this.pageheading,
    });
    console.log('Continue after fetchData');
  }
}
