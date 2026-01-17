import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RemoteEntry } from './entry';
import { NxWelcome } from './nx-welcome';
import { remoteRoutes } from './entry.routes';
import { HeaderComponent } from '@org/ui';

@NgModule({
  declarations: [RemoteEntry, NxWelcome],
  imports: [CommonModule, RouterModule.forChild(remoteRoutes), HeaderComponent],
  providers: [],
})
export class RemoteEntryModule {}
