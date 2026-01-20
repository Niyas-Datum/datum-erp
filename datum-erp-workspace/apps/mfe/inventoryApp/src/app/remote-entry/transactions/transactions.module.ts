import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { transactionsRoutes } from './transactions-routing.module';
import { TransactionsComponent } from './transactions-component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(transactionsRoutes),
    TransactionsComponent
  ]
})
export class TransactionsModule { }
