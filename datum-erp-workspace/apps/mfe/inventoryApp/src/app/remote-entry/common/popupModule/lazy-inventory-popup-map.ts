import { Type } from '@angular/core';

export const lazyInventoryPopupMap: Record<string, () => Promise<{ component: Type<any> }>> = {
  reference: () =>
    import('../popups/inventory/refernece/Pinventory.reference.component').then(
      (m) => ({
        component: m.PinventoryReferencePopupComponent
      })
    ),

  generic: () =>
    import('../popups/inventory/generic/Pinventory.generic-popup.component').then(
      (m) => ({
        component: m.PinventoryGenericPopupComponent
      })
    ),

  // payment: () =>
  //   import('../../transactions/common/reference-popup/reference-popup.component').then(
  //     (m) => ({
  //       component: m.ReferencePopupComponent
  //     })
  //   ),
//  country: () =>
//     import('../../transactions/popup/country-popup.component').then(
//       (m) => ({
//         component: m.CountryPopupComponent
//       })
//     ),

};