import { Injectable } from '@angular/core';
import { Dialog, DialogModel } from '@syncfusion/ej2-popups';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  public dialogInstance: Dialog;
    public dialogObj: Dialog;
 
  constructor() { 
    this.dialogInstance = new Dialog();
    this.dialogObj = new Dialog();
  } 
   
  createDialog = (element: HTMLElement, model: DialogModel): Dialog => {
    if (!element.classList.contains('e-dialog')) {
      model.showCloseIcon = true;
      this.dialogObj = new Dialog(model, element);
    }
    return this.dialogObj
  };

  showDialog = (element: HTMLElement, model: DialogModel) => {
    this.dialogInstance = this.createDialog(element, model);
    this.dialogInstance.show();
  }

  hideDialog = () => {
    if (this.dialogInstance) {
      this.dialogInstance.hide();
    }
  
  }

} 