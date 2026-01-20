import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'financeApp',
  exposes: {
    './Module': 'apps/mfe/financeApp/src/app/remote-entry/entry-module.ts',
    './popup': 'apps/mfe/financeApp/src/app/remote-entry/common/popup/lazy-financial-popup-map.ts',
  },
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
