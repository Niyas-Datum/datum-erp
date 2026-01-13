import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RemoteEntry } from './entry';

import { remoteRoutes } from './entry.routes';
import { NxWelcome } from './nx-welcome';

@NgModule({
  declarations: [RemoteEntry, NxWelcome],
  imports: [CommonModule, RouterModule.forChild(remoteRoutes)],
  providers: [],
})
export class RemoteEntryModule {}
