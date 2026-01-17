import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

const bootstrap = () =>
  platformBrowser()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));

if ((module as any).hot) {
  (module as any).hot.accept();
  console.log('HMR Enabled');
}

bootstrap();
