import { Type } from '@angular/core';

export const lazyFinancialPopupMap: Record<string, () => Promise<{ component: Type<any> }>> = {
  // reference: () =>
  //   import('../../transactions/popup/references-popup.component').then(
  //     (m) => ({
  //       component: m.ReferencePopupComponent
  //     })
  //   ),
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