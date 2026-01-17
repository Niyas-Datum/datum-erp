import { environment } from '@org/utils';

import('./bootstrap').catch((err) => console.error(err));

// if (!environment.production) {
//   console.warn = (() => {
//     const originalWarn = console.warn;
//     return (...args: any[]) => {
//       if (typeof args[0] === 'string' && args[0].includes('DOMNodeInsertedIntoDocument')) {
//         return;
//       }
//       originalWarn.apply(console, args);
//     };
//   })();
// }
