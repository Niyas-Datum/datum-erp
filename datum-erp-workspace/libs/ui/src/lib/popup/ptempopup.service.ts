import { ComponentRef, Injectable, Type } from '@angular/core';
/*import { lazyGeneralPopupMap } from 'generalApp/popup';
import { lazyFinancialPopupMap } from 'financeApp/popup';
import { lazyInventoryPopupMap } from 'inventoryApp/popup';*/
import { Subject } from 'rxjs';
import { PopupContainerComponent } from './popup-container.component';

@Injectable({ providedIn: 'root' })
export class tmepPopupService {
  private container?: PopupContainerComponent;
  private pending: { component: Type<any>; inputs?: any } | null = null;

  registerContainer(container?: PopupContainerComponent) {
    this.container = container;
    if (this.container && this.pending) {
      // open any pending popup
      this.openComponent(this.pending.component, this.pending.inputs).catch(() => {});
      this.pending = null;
    }
  }

  private async openComponent(component: Type<any>, inputs?: any) {
    if (!this.container) throw new Error('Popup container not available');
   //console.log('PopupService: opening component',inputs);
    // wait for container to create the component
    const compRef: ComponentRef<any> = await this.container.open(component, inputs) as ComponentRef<any>;
    const afterClosed$ = new Subject<any>();

    // inject unique close function to avoid clashing with @Output close
    if (compRef?.instance) {
      (compRef.instance as any).popupClose = (result?: any) => {
        try {
          afterClosed$.next(result);
          afterClosed$.complete();
        } finally {
          this.container?.close();
        }
      };
    }

    return { compRef, afterClosed$ };
  }

  async openLazy(key: string, inputs?: any) {
    // const Inventoryloader = lazyInventoryPopupMap[key as keyof typeof lazyInventoryPopupMap];
    //     const Generalloader = lazyGeneralPopupMap[key as keyof typeof lazyGeneralPopupMap];
    // const Financialloader = lazyFinancialPopupMap[key as keyof typeof lazyFinancialPopupMap];

    // if (!Inventoryloader && !Generalloader && !Financialloader) {
    //   console.error(`Popup key "${key}" not found`);
    //   return;
    // }

    // let popupComponent: Type<any>;
    //   const moduleObj = await Inventoryloader();
    //  popupComponent= moduleObj.component;
    // if (Generalloader) {
    //   const moduleObj = await Generalloader();
    //    popupComponent= moduleObj.component;
    // }else if (Financialloader) {
    //   const moduleObj = await Financialloader();
    //    popupComponent= moduleObj.component;
    // }else if (Inventoryloader) {  
    // const moduleObj = await Inventoryloader();
    //  popupComponent= moduleObj.component;
    // }

    // if (this.container) {
    //   const { compRef, afterClosed$ } = await this.openComponent(popupComponent, inputs);
    //   return { compRef, afterClosed: afterClosed$.asObservable() };
    // } else {
    //   console.warn('Popup container not registered yet — queuing');
    //   this.pending = { component: popupComponent, inputs };
    //   const fallback$ = new Subject<any>();
    //   return { compRef: undefined, afterClosed: fallback$.asObservable() };
    // }
  }

  close() {
    this.container?.close();
  }
}
