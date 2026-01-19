import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { VoucherRoutingModule } from './voucher-routing.module';
import { PaymentVoucherComponent } from './payment-voucher/payment-voucher.component';

// Syncfusion imports
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { GridAllModule } from '@syncfusion/ej2-angular-grids';
import { MultiColumnComboBoxModule } from '@syncfusion/ej2-angular-multicolumn-combobox';

// Payment popup component
import { PaymentpopupComponent } from './common/paymentpopup/paymentpopup.component';

// PO Allocation popup component
import { PoallocationpopupComponent } from './common/poallocationpopup/poallocationpopup.component';

// Services
import { FinanceAppService } from '../http/finance-app.service';
import { VoucherService } from './common/services/voucher.service';
import { VoucherCommonService } from './common/services/voucher-common.service';

@NgModule({
  declarations: [PaymentVoucherComponent],
  imports: [
    CommonModule,
    VoucherRoutingModule,
    ReactiveFormsModule,
    TextBoxModule,
    DatePickerModule,
    DropDownListModule,
    GridAllModule,
    MultiColumnComboBoxModule,
    PaymentpopupComponent,
    PoallocationpopupComponent
  ],
  providers: [DatePipe, FinanceAppService, VoucherService, VoucherCommonService]
})
export class VoucherModule {}
