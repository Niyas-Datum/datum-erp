/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @nx/enforce-module-boundaries */
import { Component, EventEmitter, inject, OnInit, Output, Renderer2, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  additonalChargesPopup,
  bankPopup,
  cardPopup,
  cashPopup,
  chequePopup,
  PayType,
  taxPopup,
} from '../interface/transactions.interface';
import { TransactionService } from '../services/transaction.services';
import { finalize, Subject, takeUntil } from 'rxjs';
import { EndpointConstant } from '@org/constants';
import { LogLevel } from '@microsoft/signalr';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PaymentpopupComponent } from 'apps/mfe/inventoryApp/src/app/remote-entry/transactions/common/paymentpopup/paymentpopup.component';
import { BaseService, DataSharingService } from '@org/services';
import { ItemService } from '../services/item.services';
import { DatePickerModule } from '@syncfusion/ej2-angular-calendars';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { CommonService } from '../services/common.services';

@Component({
  selector: 'app-invoice-footer',
  imports: [
    CommonModule,
    PaymentpopupComponent,
    ReactiveFormsModule,
    DatePickerModule,
    TextBoxModule,
    DropDownListModule,
    ButtonModule,
  ],
  templateUrl: './invoice-footer.html',
  styleUrl: './invoice-footer.scss',
})
export class InvoiceFooter implements OnInit {
  popupData: any[] = [];
  bankData: any;
  isPopupVisible = false;
  pettyCashObj: any = [];
  defaultCashAccount: any = [];
  cashPopupObj = [] as Array<cashPopup>;
  transactionService = inject(TransactionService);
  destroySubscription = new Subject<void>();
  salesForm!: FormGroup;
  cardPopupObj = [] as Array<cardPopup>;
  chequePopupObj = [] as Array<chequePopup>;
  popupType!: 'cash' | 'card' | 'addcharge' | 'cheque' | 'tax';
  payTypeObj = [] as Array<PayType>;
  selectedPayType: string | undefined = '';
  selectedPayTypeObj: any = {};
  enableCreditOption = false;
  enableCashOption = false;
  isDefaultCash = false;
  taxPopupObj = [] as Array<taxPopup>;
  bankPopupObj = [] as Array<bankPopup>;
  itemDetails: any[] = [];
  itemService = inject(ItemService);
  paymentGridRows = [
    { id: 1, accountcode: '', accountname: '', description: '', amount: 0 },
  ];
  @Output() footerPopUpData = new EventEmitter<any>();
  //second popup
  showPopup = false;
  additonalChargesPopupObj = [] as Array<additonalChargesPopup>;
  private dataSharingService = inject(DataSharingService);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  selectedPartyId!: string;
  selectedSalesId: number | null | undefined;
  isLoading!: boolean;
  currentSales: any;
  pageId = 149;
  minDate = new Date(2020, 0, 1);
  maxDate = new Date(2100, 11, 31);
  gridSettings!: {
    allowEditing: boolean;
    allowAdding: boolean;
    allowDeleting: boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  currentPopupType: string = '';
  invTransactions: any = [];
  public commonService = inject(CommonService);
  public cashSelected: any[] = [];
  public cardSelected: any[] = [];
  public chequeSelected: any[] = [];
  public taxSelected: any[] = [];
  public addChargesSelected: any[] = [];
  public isChequeButtonEnabled = false;
  grossAmt = 0.0000;
  taxTotal=0.0000;
  grandtotal=0.0000;
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(private fb: FormBuilder, private baseService: BaseService) { }

  ngOnInit(): void {
    this.initForm();
    this.initData();
    this.salesForm.get('addcharges')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalculateGrandTotal());


  }

  private initForm(): void {
    this.salesForm = this.fb.group({
      terms: [''],
      totaldiscpercent: [''],
      discountamount: [''],
      discsellamt: [''],
      roundoff: [''],
      netamount: [''],
      tax: [''],
      addcharges: [''],
      grandtotal: [''],
      paytype: [null, Validators.required],
      advance: [''],
      totalpaid: [''],
      cash: [{ value: 0.0, disabled: true }],
      card: [{ value: 0.0, disabled: true }],
      balance: [''],
      cheque: [''],
      duedate: new FormControl<Date | null>(null, Validators.required),
      additemcharges: [''],
    });

    // Set a fallback default payment type if none is set after a timeout
    setTimeout(() => {
      if (!this.salesForm.get('paytype')?.value && this.payTypeObj.length > 0) {
        const fallbackPayType = this.payTypeObj.find((pt: any) => pt.name === 'Cash') || this.payTypeObj[0];
        if (fallbackPayType) {
          this.salesForm.patchValue({ paytype: fallbackPayType });
          this.selectedPayTypeObj = {
            id: fallbackPayType.id,
            value: fallbackPayType.name,
          };
          this.selectedPayType = fallbackPayType.name;
          this.enableCashOption = fallbackPayType.name === 'Cash';
          this.enableCreditOption = fallbackPayType.name === 'Credit';
          this.isChequeButtonEnabled = fallbackPayType.name === 'Credit';
          
          // If payment type is Cash, load default cash account
          if (fallbackPayType.name === 'Cash') {
            this.loadDefaultCashAccount();
          }
        }
      }
    }, 2000); // Wait 2 seconds for API call to complete
  }

  private initData(): void {
    this.fetchPayType();
    this.fetchBankDetails();

    this.dataSharingService.selectedSalesId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((salesId) => {
        this.selectedSalesId = salesId ?? null;
        if (this.selectedSalesId) {
          this.fetchPurchaseById();
        }
      });
    this.dataSharingService.triggerRecalculateTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalculateGrandTotal();
      });

    this.dataSharingService.triggerRTaxValueTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalculateTaxValue();
      });
    this.dataSharingService.triggerNetAmountTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalculateNetAmount();
      });
    this.dataSharingService.triggerGrossAmountTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalculateGrossAmtAmount();
      });
  }

  private fetchPurchaseById(): void {
    if (!this.selectedSalesId) return;

    this.isLoading = true;
    this.transactionService
      .getDetails(
        `${EndpointConstant.FILLPURCHASEBYID}${this.selectedSalesId}&pageId=${this.pageId}`
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck(); // Force change detection
        })
      )
      .subscribe({
        next: (response: any) => {
          this.currentSales = response?.data;

          if (this.currentSales?.transaction) {
            // Bind transaction data first (includes tax, addcharges, etc.)
            this.bindTransactionData(this.currentSales.transaction);
            
            // Emit fillAdditionals so additional details component can bind
            if (this.currentSales.transaction.fillAdditionals) {
              this.dataSharingService.setAdditionalDetails(this.currentSales.transaction.fillAdditionals);
            }
          }
          
          // Payment and cheque data from separate endpoints takes precedence for cash/card/cheque
          if (this.currentSales?.payment?.data && this.currentSales.payment.data.length > 0) {
            this.bindPaymentInformation(this.currentSales.payment.data);
          }
          
          // Bind cheque information if available
          if (this.currentSales?.cheque?.data && this.currentSales.cheque.data.length > 0) {
            this.bindChequeInformation(this.currentSales.cheque.data);
          }

          // Force a change detection cycle to ensure UI updates
          setTimeout(() => {
            this.cdr.markForCheck(); // Force change detection after data binding
          }, 100);
        },
        error: (error: any) => console.error('An Error Occurred', error),
      });
  }

  private bindTransactionData(transactionData: any): void {
    if (!transactionData) return;

    const fillItems = transactionData?.fillInvTransItems || [];
    this.invTransactions = fillItems;
    
    // 👉 UPDATE: Store items in commonService for item grid component
    this.commonService.invTransactions.set(fillItems);
    
    // 👉 UPDATE: Map items to grid format and update tempItemFillDetails
    const mappedItems = this.mapItemsToGridFormat(fillItems);
    this.commonService.tempItemFillDetails.set(mappedItems);
    
    
    // Force change detection to ensure grid updates
    this.cdr.markForCheck();

    const totalTax = fillItems.reduce((sum: number, item: any) => sum + this.toNum(item?.taxValue), 0);
    const netAmount = fillItems.reduce((sum: number, item: any) => sum + this.toNum(item?.amount), 0);
    const grandTotal = fillItems.reduce((sum: number, item: any) => sum + this.toNum(item?.totalAmount), 0);
    const grossAmount = fillItems.reduce((sum: number, item: any) => sum + this.toNum(item?.grossAmount), 0);
    const discountTotal = fillItems.reduce((sum: number, item: any) => sum + this.toNum(item?.discount), 0);
    const discountPerc = fillItems[0]?.discountPerc ?? 0;
    
    // Store calculated values
    this.grossAmt = grossAmount;
    this.taxTotal = totalTax;
    this.grandtotal = grandTotal;

    // Patch base amounts
    this.salesForm.patchValue({
      tax: totalTax.toFixed(4),
      netamount: netAmount.toFixed(4),
      discountamount: discountTotal.toFixed(4),
      totaldiscpercent: discountPerc,
      grandtotal: grandTotal.toFixed(4),
    }, { emitEvent: false });

    // === Bind PayType (from fillAdditionals.modeID) ===
    const modeId = transactionData?.fillAdditionals?.modeID;
    if (modeId) {
      const payType = this.payTypeObj.find(p => p.id === modeId);
      if (payType) {
        this.selectedPayTypeObj = payType;
        this.selectedPayType = payType.name;

        this.salesForm.patchValue({ paytype: payType }, { emitEvent: false });

        this.enableCashOption = payType.name === 'Cash';
        this.enableCreditOption = payType.name === 'Credit';

        this.applyPayTypeGate(payType.name);
      }
    }

    // Bind terms from fillAdditionals (it can be in 'terms' or 'address' field)
    const terms = transactionData?.fillAdditionals?.terms || transactionData?.fillAdditionals?.address || '';
    if (terms) {
      this.salesForm.patchValue({ terms: terms }, { emitEvent: false });
    }

    // === Bind Payment Entries (cash, card, cheque, tax, addcharges) ===
    const transactionEntries = transactionData?.fillTransactionEntries || [];

    // Map transaction entries to the proper structure for popup grids
    this.cashSelected = transactionEntries
      .filter((e: any) => e.tranType === 'Cash')
      .map((e: any) => ({
        id: e.id,
        accountCode: {
          alias: e.alias?.toString() || '',
          name: e.name || '',
          id: e.accountId || 0
        },
        description: e.description || '',
        amount: this.toNum(e.amount),
        payableAccount: {}
      }));

    this.cardSelected = transactionEntries
      .filter((e: any) => e.tranType === 'Card')
      .map((e: any) => ({
        id: e.id,
        accountCode: {
          alias: e.alias?.toString() || '',
          name: e.name || '',
          id: e.accountId || 0
        },
        description: e.description || '',
        amount: this.toNum(e.amount),
        payableAccount: {}
      }));

    this.chequeSelected = transactionEntries
      .filter((e: any) => e.tranType === 'Cheque')
      .map((e: any) => ({
        id: e.id,
        accountCode: {
          alias: e.alias?.toString() || '',
          name: e.name || '',
          id: e.accountId || 0
        },
        description: e.description || '',
        amount: this.toNum(e.amount),
        payableAccount: {}
      }));

    this.taxSelected = transactionEntries
      .filter((e: any) => e.tranType === 'Tax')
      .map((e: any) => ({
        taxid: e.accountId,
        accountCode: {
          alias: e.alias?.toString() || '',
          name: e.name || '',
          id: e.accountId || 0
        },
        discription: e.description || '',
        amount: this.toNum(e.amount),
        payableAccount: {}
      }));

    this.addChargesSelected = transactionEntries
      .filter((e: any) => e.tranType === 'AddCharge' || e.tranType === 'Expense')
      .map((e: any) => ({
        id: e.id,
        accountCode: {
          alias: e.alias?.toString() || '',
          name: e.name || '',
          id: e.accountId || 0
        },
        description: e.description || '',
        amount: this.toNum(e.amount),
        payableAccount: {}
      }));

    const roundOffEntry = transactionEntries.find((e: any) => e.tranType === 'RoundOff');
    if (roundOffEntry) {
      this.roundValue = this.toNum(roundOffEntry.amount);
      this.salesForm.patchValue({
        roundoff: this.roundValue.toFixed(4)
      }, { emitEvent: false });
    }

    // Total amounts per section
    const cashTotal = this.getTotalAmount(this.cashSelected);
    const cardTotal = this.getTotalAmount(this.cardSelected);
    const chequeTotal = this.getTotalAmount(this.chequeSelected);
    const taxTotal = this.getTotalAmount(this.taxSelected);
    const addChargesTotal = this.getTotalAmount(this.addChargesSelected);
    
    // Get advance amount from fillAdditionals or default to 0
    const advanceAmount = this.toNum(transactionData?.fillAdditionals?.advance) || 0;

    // Calculate total paid including advance
    const totalPaid = cashTotal + cardTotal + chequeTotal + advanceAmount;
    const balance = Math.abs(grandTotal - totalPaid);

    this.salesForm.patchValue({
      cash: cashTotal.toFixed(4),
      card: cardTotal.toFixed(4),
      cheque: chequeTotal.toFixed(4),
      advance: advanceAmount.toFixed(4),
      tax: taxTotal.toFixed(4),
      addcharges: addChargesTotal.toFixed(4),
      totalpaid: totalPaid.toFixed(4),
      balance: balance.toFixed(4),
    }, { emitEvent: false });

    const dueDate = transactionData?.fillAdditionals?.dueDate;
    if (dueDate) {
      this.salesForm.patchValue({ duedate: new Date(dueDate) });
    }

    // Emit if needed
    this.footerPopUpData.emit(transactionData);
  }

  private getTotalAmount(entries: any[]): number {
    if (!Array.isArray(entries)) return 0;
    return entries.reduce((sum, e) => sum + this.toNum(e.amount ?? e.Amount), 0);
  }

  private bindPaymentInformation(payment: any[]): void {
    if (!payment || !Array.isArray(payment)) return;

    // Clear existing payment data
    const tempCashSelected: any[] = [];
    const tempCardSelected: any[] = [];
    
    let cashAmount = 0;
    let cardAmount = 0;

    payment.forEach((paymentData: any) => {
      const accountData = {
        id: paymentData.ID || paymentData.id,
        accountCode: {
          alias: paymentData.Alias?.toString() || '',
          name: paymentData.Name || '',
          id: paymentData.AccountID || 0
        },
        description: paymentData.Description || '',
        amount: this.toNum(paymentData.Amount),
        payableAccount: {}
      };

      if (paymentData.TranType === 'Cash') {
        cashAmount += this.toNum(paymentData.Amount);
        tempCashSelected.push(accountData);
      } else if (paymentData.TranType === 'Card') {
        cardAmount += this.toNum(paymentData.Amount);
        tempCardSelected.push(accountData);
      }
    });

    // Update the arrays
    this.cashSelected = tempCashSelected;
    this.cardSelected = tempCardSelected;

    // Update form controls
    this.salesForm.patchValue({
      cash: cashAmount > 0 ? cashAmount.toFixed(4) : '0.0000',
      card: cardAmount > 0 ? cardAmount.toFixed(4) : '0.0000'
    }, { emitEvent: false });

    // Recalculate totals
    this.updateTotalPaid();
    this.updateBalance();
  }

  private bindChequeInformation(chequeInfo: any[]): void {
    if (!chequeInfo || !Array.isArray(chequeInfo) || chequeInfo.length === 0) return;

    let chequeAmount = 0;
    const tempChequeSelected: any[] = [];

    chequeInfo.forEach((chequeData: any) => {
      chequeAmount += this.toNum(chequeData.ChqAmount);
      
      // Find bank info
      let bankInfo: any = {};
      this.bankPopupObj.forEach((item: any) => {
        if (item.id === chequeData.BankID) {
          bankInfo = {
            alias: item.accountcode,
            name: item.accountname,
            id: item.id
          };
        }
      });

      // Find PDC payable info
      let pdcPayableInfo: any = {};
      this.chequePopupObj.forEach((pdc: any) => {
        if (pdc.id === chequeData.PDCAccountID) {
          pdcPayableInfo = {
            alias: pdc.accountcode,
            name: pdc.accountname,
            id: pdc.id
          };
        }
      });

      const chequeObj = {
        id: chequeData.VEID,
        pdcPayable: pdcPayableInfo,
        veid: chequeData.VEID,
        cardType: chequeData.CardType,
        commission: 0,
        chequeNo: chequeData.ChequeNo,
        chequeDate: new Date(chequeData.ChequeDate),
        clrDays: chequeData.ClrDays,
        bankID: chequeData.BankID,
        bankName: bankInfo,
        status: '',
        partyID: chequeData.PartyID,
        description: chequeData.Description,
        amount: this.toNum(chequeData.ChqAmount)
      };
      
      tempChequeSelected.push(chequeObj);
    });

    this.chequeSelected = tempChequeSelected;

    this.salesForm.patchValue({
      cheque: chequeAmount > 0 ? chequeAmount.toFixed(4) : '0.0000'
    }, { emitEvent: false });

    // Recalculate totals
    this.updateTotalPaid();
    this.updateBalance();
  }

  private mapTransactionToForm(transaction: any): any {
    const items = Array.isArray(transaction?.fillInvTransItems)
      ? transaction.fillInvTransItems
      : [];

    this.invTransactions = items;
    
    // 👉 UPDATE: Also bind items to commonService here
    this.commonService.invTransactions.set(items);
    const mappedItems = this.mapItemsToGridFormat(items);
    this.commonService.tempItemFillDetails.set(mappedItems);
    
    // Force change detection to ensure grid updates
    this.cdr.markForCheck();

    const totalTax = items.reduce(
      (sum: number, it: any) => sum + (Number(it?.taxValue) || 0),
      0
    );
    const netamount = items.reduce(
      (sum: number, it: any) => sum + (Number(it?.amount) || 0),
      0
    );

    const grandtotal = items.reduce(
      (sum: number, it: any) => sum + (Number(it?.totalAmount) || 0),
      0
    );
    const firstItemDiscountPerc = items[0]?.discountPerc ?? 0;

    return {
      tax: totalTax,
      netamount: netamount,
      discountPerc: firstItemDiscountPerc,
      grandtotal: grandtotal,
    };
  }

  fetchvalue() {
    const terms = this.salesForm.get('terms')?.value;
    this.salesForm.patchValue({
      terms: terms,
    });
  }

  openPopup(dataType: string) {
    this.currentPopupType = dataType;
    if (dataType === 'cash') {
      this.popupData = this.cashPopupObj;
      this.gridSettings = {
        allowEditing: true,
        allowAdding: true,
        allowDeleting: true,
      };
    }

    this.isPopupVisible = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  /**
   * Loads default cash account data (for use when cash popup is opened)
   * Does NOT auto-allocate - user must explicitly open popup and click OK
   */
  private loadDefaultCashAccount(): void {
    // If already loaded, return
    if (this.defaultCashAccount.length > 0 || this.pettyCashObj.length > 0) {
      return;
    }

    // Load cash accounts from API
    this.transactionService
      .getDetails(EndpointConstant.FILLCASHPOPUP)
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          this.cashPopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.defaultCashAccount = this.cashPopupObj; // Set default cash account from API
          this.pettyCashObj = this.cashPopupObj; // Also set pettyCashObj
          
          // Don't auto-allocate - user must open popup and click OK
        },
        error: (error) => {
          console.error('Error loading default cash account:', error);
        },
      });
  }

  fetchCashPopup() {
    // Don't auto-allocate - let user decide in the popup
    // Sales person will decide cash or credit and allocate amount when clicking OK

    this.popupType = 'cash';
    this.currentPopupType = 'cash';
    if (this.pettyCashObj.length > 0) {
      this.cashPopupObj = this.pettyCashObj;
      this.defaultCashAccount = this.pettyCashObj;
      this.popupData = this.cashPopupObj;
      this.showPopup = true;
    } else {
      this.transactionService
        .getDetails(EndpointConstant.FILLCASHPOPUP)
        .pipe(takeUntil(this.destroySubscription))
        .subscribe({
          next: (response) => {
            const responseData = response?.data;
            this.cashPopupObj = responseData.map((item: any) => ({
              accountcode: item.alias,
              accountname: item.name,
              id: item.id,
            }));
            this.defaultCashAccount = this.cashPopupObj;
            this.pettyCashObj = this.cashPopupObj;
            this.popupData = this.cashPopupObj;
            this.showPopup = true;
          },
          error: (error) => {
            console.error('An Error Occured', error);
          },
        });
    }
  }

  setDefaultAmounttoCash() {
    const balanceAmount = this.toNum(this.salesForm.get('balance')?.value);
    const grandTotal = this.toNum(this.salesForm.get('grandtotal')?.value);
    const totalPaid = this.toNum(this.salesForm.get('totalpaid')?.value);
    
    // Use grandTotal or totalPaid if balance is 0
    const cashAmount = balanceAmount > 0 ? balanceAmount : (totalPaid > 0 ? totalPaid : grandTotal);
    
    // Use pettyCashObj or defaultCashAccount (whichever is populated)
    const cashAccount = this.pettyCashObj.length > 0 ? this.pettyCashObj : this.defaultCashAccount;
    
    if (cashAccount && cashAccount.length > 0 && cashAmount > 0) {
      // Clear existing cash entries if any
      if (this.cashSelected.length > 0) {
        this.cashSelected = [];
      }
      
      const accountId = parseInt(String(cashAccount[0].id || 61));
      this.cashSelected.push({
        id: accountId,
        accountCode: {
          alias: cashAccount[0].accountcode || cashAccount[0].accountCode || '',
          name: cashAccount[0].accountname || cashAccount[0].accountName || '',
          id: accountId
        },
        description: '',
        amount: cashAmount,
        payableAccount: {}
      });

      // Update the cash form control with the cash amount
      this.salesForm.patchValue({ cash: cashAmount.toFixed(4) });
      
      // Update total paid and balance
      this.updateTotalPaid();
      this.updateBalance();
      
    }
  }

  /**
   * DEPRECATED: This method is no longer used.
   * Cash allocation should only happen when user explicitly opens cash popup and clicks OK.
   * Sales person needs to decide cash or credit, so no auto-allocation.
   */
  private autoSetCashIfNeeded(): void {
    // Method kept for backward compatibility but does nothing
    // Cash should only be allocated when user opens popup and clicks OK
    return;
  }

  onPopupItemSelected(selectedItem: any): void {
    const fieldMap: Record<string, string> = {
      cash: 'cash',
      card: 'card',
      cheque: 'cheque',
    };

    const formControlName = fieldMap[this.currentPopupType];


    if (formControlName) {
      // Assuming the selectedItem contains accountCode with alias, name, and id
      const accountCode = selectedItem.accountCode;

      // Bind accountCode properties to the corresponding form control
      this.salesForm.patchValue({
        [formControlName]: accountCode.name, // Display name in the input field
      });

      // If you need to store the full object for internal logic (for later use)
      this.salesForm.patchValue({
        [`${formControlName}Details`]: accountCode, // Store the full object, if needed
      });
    }

    this.closePopup();
  }

  fetchCardPopup() {
    this.popupType = 'card';
    this.currentPopupType = 'card';
    this.transactionService
      .getDetails(EndpointConstant.FILLCARDPOPUP)
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          this.cardPopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.popupData = this.cardPopupObj;
          this.showPopup = true;
          
          // Auto-select default card account after popup opens
          setTimeout(() => {
            this.autoLoadDefaultCardAccount();
          }, 100);
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  private autoLoadDefaultCardAccount(): void {
    // This will be handled in paymentpopup component via ngOnChanges
    // Just ensure popupData is set with default account
    if (this.cardPopupObj && this.cardPopupObj.length > 0) {
      // The paymentpopup component will handle auto-loading via ngOnChanges
    }
  }

  fetchChequePopup() {
    this.popupType = 'cheque';
    this.currentPopupType = 'cheque';
    this.transactionService
      .getDetails(EndpointConstant.FILLCHEQUEPOPUP)
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;

          this.chequePopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.popupData = this.chequePopupObj;
          this.showPopup = true;
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  fetchBankDetails() {
    this.transactionService
      .getDetails(EndpointConstant.FILLBANKPOPUP)
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          this.bankPopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.bankData = this.bankPopupObj;
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  private toNum(v: any): number {
    if (v === null || v === undefined || v === '') return 0;
    const s = typeof v === 'string' ? v.replace(/,/g, '') : v;
    const n = parseFloat(s as any);
    return isNaN(n) ? 0 : n;
  }

  private updateTotalPaid(): void {
    const raw = this.salesForm.getRawValue?.() ?? this.salesForm.value;
    const cash = this.toNum(raw?.cash);
    const card = this.toNum(raw?.card);
    const cheque = this.toNum(raw?.cheque);
    const advance = this.toNum(raw?.advance);
    const total = cash + card + cheque + advance;
    this.salesForm.patchValue({ totalpaid: total.toFixed(4) });
  }
  private updateBalance(): void {
    const raw = this.salesForm.getRawValue?.() ?? this.salesForm.value;
    const totalPaid = this.toNum(raw?.totalpaid);
    const grandTotal = this.toNum(raw?.grandtotal);
    const balance =  Math.abs(grandTotal - totalPaid);
    
    this.salesForm.patchValue(
      { balance: balance.toFixed(4) },
      { emitEvent: false }
    );
    
  }

  onItemSelected(selectedItem: any): void {
    const items = Array.isArray(selectedItem) ? selectedItem : [selectedItem];

    const totalAmount = items.reduce((sum, item) => {
      const val = parseFloat(item?.amount ?? 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const formattedAmount = totalAmount.toFixed(4);

    switch (this.popupType) {
      case 'cash':
        this.salesForm.patchValue({ cash: formattedAmount });
        this.cashSelected = items;
        break;

      case 'card':
        this.salesForm.patchValue({ card: formattedAmount });
        this.cardSelected = items;
        break;

      case 'cheque':
        this.salesForm.patchValue({ cheque: formattedAmount });
        this.chequeSelected = items;
        break;

      case 'addcharge':
        this.salesForm.patchValue({ addcharges: formattedAmount }, { emitEvent: false });
        this.addChargesSelected = items;
        this.recalculateGrandTotal();
        break;

      case 'tax':
        // if the popup ever allows editing the amount, reflect it back here
        this.salesForm.patchValue({ tax: formattedAmount }, { emitEvent: false });
        this.taxSelected = items;

        break;

      default:
        break;
    }

    this.updateTotalPaid();

    if (this.popupType !== 'addcharge') {
      this.updateBalance();
      
      // After cash payment, if there's a balance, enable card option for partial payment
      if (this.popupType === 'cash') {
        const balance = this.toNum(this.salesForm.get('balance')?.value);
        if (balance > 0) {
          // Enable card option to allow adding remaining balance
          const cardCtrl = this.salesForm.get('card');
          cardCtrl?.enable({ emitEvent: false });
        }
      }
    }

    this.footerPopUpData.emit(selectedItem);
  }



  onChangePayType(event?: { itemData?: PayType }) {
    const paytype: PayType = event?.itemData ?? this.salesForm.get('paytype')?.value;

    if (paytype) {
      if (event?.itemData) {
        this.salesForm.patchValue({ paytype }, { emitEvent: false });
      }
      this.selectedPayType = paytype.name;
      this.selectedPayTypeObj = paytype;

      this.enableCreditOption = paytype.name === 'Credit';
      this.enableCashOption = paytype.name === 'Cash';

      this.isChequeButtonEnabled = paytype.name === 'Credit';

      this.applyPayTypeGate(paytype.name);
      
      // Don't auto-allocate cash - let sales person decide when to open cash popup
      // Only load default cash account data for when popup is opened
      if (paytype.name === 'Cash') {
        this.loadDefaultCashAccount();
        // Remove auto-allocation - user must explicitly open cash popup and click OK
      }
    }
  }

  fetchPayType() {
    this.transactionService
      .getDetails(EndpointConstant.FILLPAYTYPE)
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          if (responseData) {
            this.payTypeObj = responseData.payType;
            this.isDefaultCash = responseData.defaultCash;

            let defaultPayType = null;
            
            if (this.isDefaultCash) {
              // If defaultCash is true, use Cash as default
              defaultPayType = this.payTypeObj.find(
                (pt: any) => pt.name === 'Cash'
              );
            } else {
              // If no defaultCash, use the first available payment type
              defaultPayType = this.payTypeObj && this.payTypeObj.length > 0 
                ? this.payTypeObj[0] 
                : null;
            }

            if (defaultPayType) {
              this.salesForm.patchValue({ paytype: defaultPayType });
              this.selectedPayTypeObj = {
                id: defaultPayType.id,
                value: defaultPayType.name,
              };
              this.selectedPayType = defaultPayType.name;
              
              // Enable appropriate options based on payment type
              this.enableCreditOption = defaultPayType.name === 'Credit';
              this.enableCashOption = defaultPayType.name === 'Cash';
              this.isChequeButtonEnabled = defaultPayType.name === 'Credit';
              
              this.applyPayTypeGate(defaultPayType.name);
              
            }
          }
        },
        error: (error) => {
          console.error('An Error Occurred', error);
        },
      });
  }


  fetchtax() {
    this.popupType = 'tax';
    this.currentPopupType = 'tax';
    this.transactionService
      .getDetails(EndpointConstant.FILLTAXACCOUNTDATA + 944)
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          this.taxPopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.popupData = this.taxPopupObj;
          this.showPopup = true;
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }


  fetchAdditionalChargesPopup() {
    this.popupType = 'addcharge';
    this.currentPopupType = 'addcharge';
    this.transactionService
      .getDetails(EndpointConstant.FILLADDITIONALCHARGESPOPUP)
      .pipe(takeUntil(this.destroySubscription))
      .subscribe({
        next: (response) => {
          const responseData = response?.data;
          this.additonalChargesPopupObj = responseData.map((item: any) => ({
            accountcode: item.alias,
            accountname: item.name,
            id: item.id,
          }));
          this.popupData = this.additonalChargesPopupObj;
          this.showPopup = true;
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }
  onDueDateChange(e: any) {
    const due: Date | null = this.salesForm.value.duedate;
    const dueIso = due ? new Date(due).toISOString() : null;
  }

  public resetFormForNewMode(): void {
    this.salesForm.reset();

    this.salesForm.patchValue({
      cash: 0.0,
      card: 0.0,
      cheque: 0.0,
      advance: 0.0,
      duedate: null,
      totalpaid: 0.0,
      balance: 0.0,
    });

    // Clear popup-related arrays if necessary
    this.cashPopupObj = [];
    this.cardPopupObj = [];
    this.chequePopupObj = [];
    this.taxPopupObj = [];
    this.bankPopupObj = [];
    this.additonalChargesPopupObj = [];
    
    // Clear selected payment items
    this.cashSelected = [];
    this.cardSelected = [];
    this.chequeSelected = [];
    this.taxSelected = [];
    this.addChargesSelected = [];

    this.enableCreditOption = false;
    this.enableCashOption = false;
    this.selectedPayType = '';
    this.selectedPayTypeObj = {};
    this.fetchPayType();

    setTimeout(() => {
      if (this.payTypeObj && this.payTypeObj.length > 0 && !this.salesForm.get('paytype')?.value) {
        const defaultPayType = this.payTypeObj.find((pt: any) => pt.name === 'Cash') || this.payTypeObj[0];
        if (defaultPayType) {
          this.salesForm.patchValue({ paytype: defaultPayType });
          this.selectedPayTypeObj = {
            id: defaultPayType.id,
            value: defaultPayType.name,
          };
          this.selectedPayType = defaultPayType.name;
          this.enableCashOption = defaultPayType.name === 'Cash';
          this.enableCreditOption = defaultPayType.name === 'Credit';
          this.isChequeButtonEnabled = defaultPayType.name === 'Credit';
        }
      }
    }, 1000); // Wait for fetchPayType to complete
    // Also emit empty pop-up data if needed
    this.footerPopUpData.emit(null);
  }

  public recalculateGrandTotal(): void {
    const items = this.commonService.tempItemFillDetails() || [];
    
    const itemsTotal = items.reduce(
      (sum: number, item: any) => {
        const itemTotal = this.toNum(item.totalAmount);
        return sum + itemTotal;
      },
      0
    );

    const addCharges = this.toNum(this.salesForm.get('addcharges')?.value);
    const grandTotal = itemsTotal + addCharges;

    this.grandtotal = grandTotal;
    this.salesForm.patchValue({ grandtotal: grandTotal.toFixed(4) }, { emitEvent: false });

    // Balance depends on grandtotal
    this.updateBalance();
    
    // Don't auto-allocate cash - user must explicitly open cash popup and click OK
    // Sales person needs to decide cash or credit
  }

  public recalculateTaxValue(): void {
    const items = this.commonService.tempItemFillDetails() || [];
    
    const taxTotal = items.reduce(
      (sum: number, item: any) => sum + this.toNum(item?.taxValue ?? 0),
      0
    );

    this.taxTotal = taxTotal;
    this.salesForm.patchValue({ tax: taxTotal.toFixed(4) }, { emitEvent: false });
  }

  public recalculateNetAmount(): void {
    const items = this.commonService.tempItemFillDetails() || [];
    
    const netamount = items.reduce(
      (sum: number, item: any) => sum + this.toNum(item?.amount ?? 0),
      0
    );
    
    this.salesForm.patchValue({ netamount: netamount.toFixed(4) }, { emitEvent: false });
  }

  public recalculateGrossAmtAmount(): void {
    const items = this.commonService.tempItemFillDetails() || [];
    
    this.grossAmt = items.reduce(
      (sum: number, item: any) => sum + this.toNum(item?.grossamount ?? 0),
      0
    );
  }

onClickRoundOff() {

  const roundoffControl = this.salesForm.get('roundoff');
  const grandTotalControl = this.salesForm.get('grandtotal');

  if (this.grandtotal != null && roundoffControl) {
    const roundedTotal = Math.round(this.grandtotal);
    const roundoffValue = Number((roundedTotal - this.grandtotal).toFixed(4));
    roundoffControl.patchValue(roundoffValue, { emitEvent: false });
    this.roundValue = roundoffValue;
    
    if (grandTotalControl) {
      grandTotalControl.patchValue(roundedTotal.toFixed(4), { emitEvent: false });
    }
    
    // Recalculate balance after updating grand total
    this.updateBalance();
  }
}



  autoroundoffEnabled = false;
  calculateAutoroundoff(oldgrandtotal: number): number {
    let value = Number(Math.round(oldgrandtotal) - oldgrandtotal);
    value = this.baseService.formatInput(value); // Format if needed
    this.roundValue = value;
    this.salesForm.patchValue({
      roundoff: value
    });
    return value; // <-- return the calculated value
  }
  roundValue = 0.0000;

  private applyPayTypeGate(paytypeName: string): void {
    const cashCtrl = this.salesForm.get('cash');
    const cardCtrl = this.salesForm.get('card');
    const chequeCtrl = this.salesForm.get('cheque');

    if (paytypeName === 'Credit') {
      // Enable only cheque
      chequeCtrl?.enable({ emitEvent: false });
      cashCtrl?.disable({ emitEvent: false });
      cardCtrl?.disable({ emitEvent: false });

      // Only reset if there's a value entered
      // if (cashCtrl?.value && Number(cashCtrl.value) !== 0) {
      //   cashCtrl.setValue('0.0000', { emitEvent: false });
      //   this.cashSelected = [];
      // }

      // if (cardCtrl?.value && Number(cardCtrl.value) !== 0) {
      //   cardCtrl.setValue('0.0000', { emitEvent: false });
      //   this.cardSelected = [];
      // }

      this.isChequeButtonEnabled = true;

    } else if (paytypeName === 'Cash') {
      cashCtrl?.enable({ emitEvent: false });
      cardCtrl?.disable({ emitEvent: false });
      chequeCtrl?.disable({ emitEvent: false });

      if (cardCtrl?.value && Number(cardCtrl.value) !== 0) {
        cardCtrl.setValue('0.0000', { emitEvent: false });
        this.cardSelected = [];
      }

      if (chequeCtrl?.value && Number(chequeCtrl.value) !== 0) {
        chequeCtrl.setValue('0.0000', { emitEvent: false });
        this.chequeSelected = [];
      }

      this.isChequeButtonEnabled = false;

    } else if (paytypeName === 'Card') {
      cardCtrl?.enable({ emitEvent: false });
      cashCtrl?.disable({ emitEvent: false });
      chequeCtrl?.disable({ emitEvent: false });

      if (cashCtrl?.value && Number(cashCtrl.value) !== 0) {
        cashCtrl.setValue('0.0000', { emitEvent: false });
        this.cashSelected = [];
      }

      if (chequeCtrl?.value && Number(chequeCtrl.value) !== 0) {
        chequeCtrl.setValue('0.0000', { emitEvent: false });
        this.chequeSelected = [];
      }

      this.isChequeButtonEnabled = false;

    } else {
      // Unknown/unsupported paytype
      this.isChequeButtonEnabled = false;
    }

    // Recompute totals
    this.updateTotalPaid();
    this.updateBalance();
  }

  //discount calculation
  commonDiscountPercent = 0.00;
  commonDiscountAmount = 0.00;
  onChangeCommonDiscountPercent(event: any): void {
  this.recalculateGrossAmtAmount(); // Ensure latest grossAmt is calculated

  const percentCtrl = this.salesForm.get('totaldiscpercent');
  const amountCtrl = this.salesForm.get('discountamount');

  const percent = Number(percentCtrl?.value || 0);
  const gross = this.grossAmt; // Already recalculated

  const discountAmount = (gross * percent) / 100;
  amountCtrl?.setValue(discountAmount.toFixed(4));
}

  /**
   * Maps transaction items from API format to grid display format
   */
  private mapItemsToGridFormat(fillItems: any[]): any[] {
    if (!fillItems || fillItems.length === 0) {
      return [];
    }

    return fillItems.map((item: any, index: number) => ({
      // Core item info
      rowId: index + 1, // ← Fix for NaN in first column
      index: index,
      transactionId: item.transactionId || 0,
      itemId: item.itemId || 0,
      itemCode: item.itemCode || '',
      itemName: item.itemName || '',
      location: item.location || '',
      
      // Batch and unit info
      batchNo: item.batchNo || '',
      unit: {
        unit: item.unit || '',
        basicUnit: item.unit || '',
        factor: 1
      },
      unitsPopup: [], // Will be populated on edit if needed
      
      // Quantities
      qty: this.toNum(item.qty),
      focQty: this.toNum(item.focQty),
      basicQty: this.toNum(item.basicQty),
      additional: this.toNum(item.additional),
      
      // Pricing
      rate: this.toNum(item.rate),
      otherRate: this.toNum(item.otherRate),
      margin: this.toNum(item.margin),
      rateDisc: this.toNum(item.rateDisc),
      
      // Amounts
      grossAmt: this.toNum(item.grossAmount),
      discount: this.toNum(item.discount),
      discountPerc: this.toNum(item.discountPerc),
      amount: this.toNum(item.amount),
      
      // Tax
      taxPerc: this.toNum(item.taxPerc),
      taxValue: this.toNum(item.taxValue),
      taxTypeId: item.taxTypeId || 0,
      taxAccountId: item.taxAccountId || 0,
      
      // Totals
      total: this.toNum(item.totalAmount),
      totalAmount: this.toNum(item.totalAmount), // ← Grid uses this field name
      
      // MRP and rates
      printedMRP: this.toNum(item.printedMrp),
      ptsRate: this.toNum(item.ptsRate),
      ptrRate: this.toNum(item.ptrRate),
      
      // Additional fields
      pcs: this.toNum(item.pcs),
      stockItemId: item.stockItemId || 0,
      stockItem: item.stockItem || '',
      expiryDate: item.expiryDate || null,
      manufactureDate: item.manufactureDate || null,
      description: item.description || null,
      
      // Dimensions
      lengthFt: this.toNum(item.lengthFt),
      lengthIn: this.toNum(item.lengthIn),
      lengthCm: this.toNum(item.lengthCm),
      girthFt: this.toNum(item.girthFt),
      girthIn: this.toNum(item.girthIn),
      girthCm: this.toNum(item.girthCm),
      thicknessFt: this.toNum(item.thicknessFt),
      thicknessIn: this.toNum(item.thicknessIn),
      thicknessCm: this.toNum(item.thicknessCm),
      
      // Other info
      remarks: item.remarks || '',
      costAccountId: item.costAccountId || 0,
      brandId: item.brandId || 0,
      profit: this.toNum(item.profit),
      repairsRequired: item.repairsRequired || '',
      finishDate: item.finishDate || null,
      updateDate: item.updateDate || null,
      replaceQty: this.toNum(item.replaceQty),
      printedRate: this.toNum(item.printedRate),
      hsn: item.hsn || '',
      avgCost: this.toNum(item.avgCost),
      isReturn: item.isReturn !== undefined ? item.isReturn : true,
      
      // Price category
      priceCategory: item.priceCategoryId ? {
        id: item.priceCategoryId,
        name: item.priceCategoryName || '',
        code: '',
        description: ''
      } : {
        id: null,
        name: '',
        code: '',
        description: ''
      },
      priceCategoryOptions: [], // Will be populated on edit if needed
      
      // Size master
      sizeMaster: item.sizeMasterName ? {
        id: item.sizeMasterId,
        name: item.sizeMasterName,
        code: '',
        description: ''
      } : {
        id: null,
        name: '',
        code: '',
        description: ''
      },
      
      // Unique items
      uniqueItems: item.uniqueItems || [{ uniqueNumber: 'string' }],
      batchNoPopup: []
    }));
  }

  setCommonDiscountPercent(commondiscountpercent: number) {
    // 1. Patch the discount percent to form
    this.salesForm.patchValue({
      totaldiscpercent: commondiscountpercent
    });

    // 2. Update discount percent for each item in the itemService list

    // items.forEach((item: any) => {
    //   if (item && item.itemId) {
    //     item.discountPerc = commondiscountpercent;
    //   }
    // });
  }



  onChangeDiscSellAmount(event: any) {
    const enteredValue = parseFloat(event.target.value);
  
    if (!isNaN(enteredValue)) {
      const previousNetAmount = this.toNum(this.salesForm.get('netamount')?.value);
      this.salesForm.patchValue({ grandtotal: enteredValue.toFixed(4) }, { emitEvent: false });
  
      // Calculate and round netamount to 2 decimal places
      const newNetAmount = (enteredValue * 100) / 115;
      const roundedNetAmount = parseFloat(newNetAmount.toFixed(2));
      const discAmountNew = parseFloat((previousNetAmount - roundedNetAmount).toFixed(2));
      
      this.salesForm.patchValue({ discountamount: discAmountNew.toFixed(4) }, { emitEvent: false });
      
      const discpercNew = (discAmountNew / previousNetAmount * 100).toFixed(2);
      this.salesForm.patchValue({ totaldiscpercent: discpercNew }, { emitEvent: false });
      
      const commondiscountpercent = Number(discpercNew);
      this.commonDiscountPercent = this.baseService.formatInput(commondiscountpercent);
      this.setCommonDiscountPercent(commondiscountpercent);
      
      this.salesForm.patchValue({ netamount: roundedNetAmount.toFixed(4) }, { emitEvent: false });
    } else {
      this.salesForm.patchValue({ grandtotal: '0.0000' }, { emitEvent: false });
      this.salesForm.patchValue({ netamount: '0.0000' }, { emitEvent: false });
    }
  }

  onChangeCommonDiscountAmount(event: any) {
    const discountAmount = this.toNum(event.target.value);
    this.setCommonDiscountAmount(discountAmount);
  }

  setCommonDiscountAmount(discountAmount: number) {
    this.salesForm.patchValue({
      discountamount: discountAmount.toFixed(4)
    }, { emitEvent: false });
    
    this.commonDiscountAmount = discountAmount;
    
    // Calculate discount percentage based on gross amount
    if (this.grossAmt > 0) {
      this.commonDiscountPercent = (discountAmount * 100) / this.grossAmt;
      this.commonDiscountPercent = this.baseService.formatInput(this.commonDiscountPercent);
      this.setCommonDiscountPercent(this.commonDiscountPercent);
    }
  }

  // Methods for mode detection
  isNewMode(): boolean {
    return this.commonService.isNewMode();
  }

  isEditMode(): boolean {
    return this.commonService.isEditMode();
  }

  /**
   * Gets grand total for popup component
   */
  getGrandTotalForPopup(): number {
    const formValue = this.salesForm.get('grandtotal')?.value;
    return this.toNum(formValue) || this.grandtotal || 0;
  }
}
