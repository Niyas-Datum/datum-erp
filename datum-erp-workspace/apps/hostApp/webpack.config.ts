import { withModuleFederation } from '@nx/module-federation/angular';
import config from './module-federation.config';

/**
 * DTS Plugin is disabled in Nx Workspaces as Nx already provides Typing support for Module Federation
 * The DTS Plugin can be enabled by setting dts: true
 * Learn more about the DTS Plugin here: https://module-federation.io/configure/dts.html
 */
const webpackConfig = withModuleFederation(config, { dts: false });
module.exports = {
  devServer: {
    hot: true
  }
};

export  default async (cfg: any) => {
  const wcfg = (await webpackConfig)(cfg);
  wcfg.devServer = {
    ...wcfg.devServer,
    hot: true,
    liveReload: true,
  };
  return wcfg;
};
