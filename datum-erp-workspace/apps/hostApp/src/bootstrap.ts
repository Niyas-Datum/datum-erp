import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';
import { registerLicense } from '@syncfusion/ej2-base';
import { APPLICATION_CONSTANT } from '@org/constants';

const bootstrap = () =>
  platformBrowser()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));

if ((module as any).hot) {
  (module as any).hot.accept();
  console.log('HMR Enabled');
}
console.log('Current Syncfusion License Key:', APPLICATION_CONSTANT.syncfusion.licenseKey);
registerLicense(APPLICATION_CONSTANT.syncfusion.licenseKey);
// Replace 'YOUR_VALID_KEY_STRING' with the key generated from the Syncfusion dashboard
bootstrap();
