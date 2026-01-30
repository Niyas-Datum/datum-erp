import { withModuleFederation } from '@nx/module-federation/angular';
import config from './module-federation.config';

/**
 * DTS Plugin is disabled in Nx Workspaces as Nx already provides Typing support for Module Federation
 * The DTS Plugin can be enabled by setting dts: true
 * Learn more about the DTS Plugin here: https://module-federation.io/configure/dts.html
 */
export default async (cfg: any) => {
  const wcfg = (await withModuleFederation(
    {
      ...config,
      //prodcution URL
      // remotes: [
      //   ['AuthApp', 'http://erpdemo.datuminnovation.com/AuthApp/remoteEntry.mjs'],
      //   ['coreApp', 'http://erpdemo.datuminnovation.com/coreApp/remoteEntry.mjs'],
      // ],

       remotes: [
        ['AuthApp', 'http://localhost:4906/remoteEntry.mjs'],
        ['coreApp', 'http://localhost:4902/remoteEntry.mjs'],
      ],
    },
    { dts: false }
  ))(cfg);
  if (wcfg.devServer) {
    wcfg.devServer.hot = true;
    wcfg.devServer.liveReload = true;
  }

  return wcfg;
};
