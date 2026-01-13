import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { remoteRoutes } from './entry.routes';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//import { DialogTemplateComponent } from  '@datum/services' 

@NgModule({
  declarations: [
],
imports: [
  CommonModule,
  RouterModule.forChild(remoteRoutes),
  FormsModule,
  ReactiveFormsModule,

  //DialogTemplateComponent  // ? Import standalone component here
],

//  providers: [LoginService],
})
export class RemoteEntryModule {}
