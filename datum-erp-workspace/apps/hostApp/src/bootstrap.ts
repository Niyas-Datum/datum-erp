import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';
import { registerLicense } from '@syncfusion/ej2-base';
import { APPLICATION_CONSTANT } from '@org/constants';
registerLicense(APPLICATION_CONSTANT.syncfusion.licenseKey);
const bootstrap = () =>
  platformBrowser()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));

if ((module as any).hot) {
  (module as any).hot.accept();
  console.log('HMR Enabled');
}

bootstrap();
