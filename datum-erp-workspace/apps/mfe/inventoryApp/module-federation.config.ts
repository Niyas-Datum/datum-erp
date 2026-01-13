import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'inventoryApp',
  exposes: {
    './Module': 'apps/mfe/inventoryApp/src/app/remote-entry/entry-module.ts',
   // './popupModule/lazy-inventory-popup-map': 'apps/mfe/inventoryApp/src/app/remote-entry/common/popupModule/lazy-inventory-popup-map.ts',
  },
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
