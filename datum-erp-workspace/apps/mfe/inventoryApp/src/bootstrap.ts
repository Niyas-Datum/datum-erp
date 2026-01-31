import { platformBrowser } from '@angular/platform-browser';
import { registerLicense } from '@syncfusion/ej2-base';
import { APPLICATION_CONSTANT } from '@org/constants';
import { AppModule } from './app/app-module';

// Register Syncfusion license so trial message does not appear when MFE loads
registerLicense(APPLICATION_CONSTANT.syncfusion.licenseKey);

platformBrowser()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
