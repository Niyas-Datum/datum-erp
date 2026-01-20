import { Component, OnInit, OnDestroy, inject, input, output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BaseService, DataSharingService } from '@org/services';
import { EndpointConstant } from '@org/constants';
import { TransactionService } from '../services/transaction.services';
import { CommonService } from '../services/common.services';
import { TabCommunicationService } from '../services/tab-communication.service';

@Component({
  selector: 'app-additional-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './additional-details.component.html',
  styleUrl: './additional-details.component.scss'
})
export class AdditionalDetailsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private baseService = inject(BaseService);
  private dataSharingService = inject(DataSharingService);
  private transactionService = inject(TransactionService);
  private commonService = inject(CommonService);
  private tabCommunicationService = inject(TabCommunicationService);
  
  private destroy$ = new Subject<void>();

  // Input signals
  isNewMode = input(false);
  isEditMode = input(false);
  
  // Output events
  additionalDetailsChanged = new EventEmitter<any>();
  barcodeClicked = new EventEmitter<void>();
  grossAmountEditChanged = new EventEmitter<boolean>();
  approveChanged = new EventEmitter<boolean>();
  tabChanged = new EventEmitter<number>(); // 1 = Item Details, 2 = Additional Details

  // Form groups
  additionalDetailsForm!: FormGroup;
  
  // State variables
  selectedTab = 1; // 1 = Item Details, 2 = Additional Details
  showAdditionalDetails = false;
  isGrossAmountEditable = false;
  isApproved = false;
  partyBalance = '0.0000';
  
  // Data arrays
  transportationTypeArr: any[] = [];
  salesmanAreaArr: any[] = [];
  vehicleNoData: any[] = [];
  deliveryLocationData: any[] = [];
  salesmanData: any[] = [];
  
  // Selected values
  selectedPartyId: number | null = null;
  updatedSalesman = '';
  updatedVehicleNo = '';
  updatedDeliveryLocation = '';

  constructor() {
    this.createForm();
  }

  ngOnInit(): void {
    this.setupDataSharing();
    this.fetchInitialData();
    this.subscribeToAdditionalDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToAdditionalDetails(): void {
    this.dataSharingService.additionalDetails$
      .pipe(takeUntil(this.destroy$))
      .subscribe((fillAdditionals: any) => {
        if (fillAdditionals) {
          this.bindAdditionalDetailsFromTransaction(fillAdditionals);
        }
      });
  }

  private createForm(): void {
    this.additionalDetailsForm = this.fb.group({
      // General section
      invoiceno: [''],
      invoicedate: [''],
      orderno: ['', Validators.required],
      orderdate: [''],
      partyname: [''],
      partyaddress: ['', Validators.required],
      expirydate: [''],
      transportationtype: [''],
      creditperiod: ['', Validators.required],
      
      // Sales section
      salesman: [''],
      salesarea: [''],
      staffincentive: [''],
      staffincentiveperc: [''],
      mobilenumber: [''],
      
      // Delivery Details section
      vehicleno: ['', Validators.required],
      attention: [''],
      deliverynote: [''],
      deliverydate: [''],
      dispatchno: [''],
      dispatchdate: [''],
      deliverypartyname: [''],
      addressline1: [''],
      addressline2: [''],
      addressline3: [''],
      deliverylocation: [''],
      
      // Terms section
      terms: ['']
    });
  }

  private setupDataSharing(): void {
    // Subscribe to party selection changes from common service
    // Get the selected party ID from the common service or item service
    // For now, we'll use the input signals isNewMode and isEditMode
    // The parent component will handle the party selection and pass it down
  }

  private updateFormControls(isEnabled: boolean): void {
    Object.keys(this.additionalDetailsForm.controls).forEach(key => {
      if (isEnabled) {
        this.additionalDetailsForm.get(key)?.enable();
      } else {
        this.additionalDetailsForm.get(key)?.disable();
      }
    });
  }

  private fetchInitialData(): void {
    this.fetchTransportationType();
    this.fetchSalesmanArea();
    this.fetchVehicleNo();
  }

  private fetchTransportationType(): void {
    this.transactionService.getDetails(EndpointConstant.FILLTRANSPORTATIONTYPE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.transportationTypeArr = response?.data || [];
        },
        error: (error) => {
          console.error('Error fetching transportation types:', error);
        }
      });
  }

  private fetchSalesmanArea(): void {
    this.transactionService.getDetails(EndpointConstant.FILLSALESMANAREA)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.salesmanAreaArr = response?.data || [];
        },
        error: (error) => {
          console.error('Error fetching salesman areas:', error);
        }
      });
  }

  private fetchVehicleNo(): void {
    this.transactionService.getDetails(EndpointConstant.FILLVEHICLENO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.vehicleNoData = response?.data?.map((item: any) => ({
            vehicleNo: item.vehicleNo,
            name: item.name,
            code: item.code,
            id: item.id
          })) || [];
        },
        error: (error) => {
          console.error('Error fetching vehicle numbers:', error);
        }
      });
  }

  private fetchDeliveryLocation(): void {
    if (this.selectedPartyId) {
      this.transactionService.getDetails(EndpointConstant.FILLDELIVERYLOCATION + this.selectedPartyId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.deliveryLocationData = response?.data?.map((item: any) => ({
              id: item.id,
              locationname: item.location,
              projectname: item.projectName,
              contactperson: item.contactPerson,
              contactno: item.contactNo,
              address: item.address
            })) || [];
          },
          error: (error) => {
            console.error('Error fetching delivery locations:', error);
          }
        });
    }
  }

  private fetchSalesman(accountId: number): void {
    this.transactionService.getDetails(EndpointConstant.FETCHSALESMAN + accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.salesmanData = response?.data || [];
          if (this.salesmanData.length > 0) {
            this.onSalesmanSelected(this.salesmanData[0].name);
          }
        },
        error: (error) => {
          console.error('Error fetching salesman:', error);
        }
      });
  }

  private fetchPartyBalance(): void {
    if (this.selectedPartyId) {
      this.transactionService.getDetails(EndpointConstant.FETCHPARTYBALANCE + this.selectedPartyId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const result = response?.data;
            if (result && result.length > 0) {
              this.partyBalance = this.baseService.formatInput(result[0].stock);
            }
          },
          error: (error) => {
            console.error('Error fetching party balance:', error);
          }
        });
    }
  }

  // Event handlers
  onAdditionalDetailsToggle(): void {
    this.showAdditionalDetails = !this.showAdditionalDetails;
  }

  onBarcodeClick(): void {
    if (this.selectedPartyId) {
      this.barcodeClicked.emit();
    }
  }

  onGrossAmountEditChange(event: any): void {
    this.isGrossAmountEditable = event.target.checked;
    this.grossAmountEditChanged.emit(this.isGrossAmountEditable);
  }

  onApproveChange(event: any): void {
    this.isApproved = event.target.checked;
    this.approveChanged.emit(this.isApproved);
  }

  onTabChange(tabIndex: number): void {
    this.selectedTab = tabIndex;
    
    // Use service for reliable communication
    this.tabCommunicationService.setSelectedTab(tabIndex);
    
    // Keep EventEmitter as backup
    this.tabChanged.emit(tabIndex);
  }

  onSalesmanSelected(event: any): void {
    const option = event.target.value;
    this.updatedSalesman = option;
    this.additionalDetailsForm.patchValue({ salesman: option });
    this.emitFormChanges();
  }

  onVehicleNoSelected(event: any): void {
    const option = event.target.value;
    this.updatedVehicleNo = option;
    this.additionalDetailsForm.patchValue({ vehicleno: option });
    this.emitFormChanges();
  }

  onDeliveryLocationSelected(event: any): void {
    const option = event.target.value;
    this.updatedDeliveryLocation = option;
    this.additionalDetailsForm.patchValue({ deliverylocation: option });
    this.emitFormChanges();
  }

  onFormFieldChange(): void {
    this.emitFormChanges();
  }

  private emitFormChanges(): void {
    this.additionalDetailsChanged.emit({
      formData: this.additionalDetailsForm.value,
      showAdditionalDetails: this.showAdditionalDetails,
      isGrossAmountEditable: this.isGrossAmountEditable,
      isApproved: this.isApproved,
      partyBalance: this.partyBalance
    });
  }

  // Public methods for external access
  getFormData(): any {
    return {
      formData: this.additionalDetailsForm.value,
      showAdditionalDetails: this.showAdditionalDetails,
      isGrossAmountEditable: this.isGrossAmountEditable,
      isApproved: this.isApproved,
      partyBalance: this.partyBalance
    };
  }

  setFormData(data: any): void {
    if (data.formData) {
      this.additionalDetailsForm.patchValue(data.formData);
    }
    this.showAdditionalDetails = data.showAdditionalDetails || false;
    this.isGrossAmountEditable = data.isGrossAmountEditable || false;
    this.isApproved = data.isApproved || false;
    this.partyBalance = data.partyBalance || '0.0000';
  }

  bindAdditionalDetailsFromTransaction(fillAdditionals: any): void {
    if (!fillAdditionals) return;

    const formData: any = {
      invoiceno: fillAdditionals.entryNo || '',
      invoicedate: fillAdditionals.entryDate ? new Date(fillAdditionals.entryDate) : null,
      orderno: fillAdditionals.referenceNo || '',
      orderdate: fillAdditionals.referenceDate ? new Date(fillAdditionals.referenceDate) : null,
      partyaddress: fillAdditionals.name || fillAdditionals.partyNameandAddress || '',
      expirydate: fillAdditionals.expiryDate ? new Date(fillAdditionals.expiryDate) : null,
      transportationtype: fillAdditionals.lcApplnTransID || fillAdditionals.transPortationType?.id || null,
      creditperiod: fillAdditionals.period || fillAdditionals.creditPeriod || '',
      salesman: fillAdditionals.accountName || fillAdditionals.salesMan?.name || '',
      salesarea: fillAdditionals.areaID || fillAdditionals.salesArea?.id || null,
      staffincentive: fillAdditionals.interestAmt || fillAdditionals.staffIncentives || '',
      staffincentiveperc: '',
      mobilenumber: fillAdditionals.lcNo || fillAdditionals.mobileNo || '',
      vehicleno: fillAdditionals.vehicleNo || fillAdditionals.vehicleID || '',
      attention: fillAdditionals.bankAddress || fillAdditionals.attention || '',
      deliverynote: fillAdditionals.passNo || fillAdditionals.deliveryNote || '',
      deliverydate: fillAdditionals.submitDate || fillAdditionals.deliveryDate ? new Date(fillAdditionals.deliveryDate) : null,
      dispatchno: fillAdditionals.documentNo || fillAdditionals.despatchNo || '',
      dispatchdate: fillAdditionals.documentDate || fillAdditionals.despatchDate ? new Date(fillAdditionals.despatchDate) : null,
      deliverypartyname: fillAdditionals.partyName || '',
      addressline1: fillAdditionals.address1 || fillAdditionals.addressLine1 || '',
      addressline2: fillAdditionals.address2 || fillAdditionals.addressLine2 || '',
      addressline3: fillAdditionals.addressLine3 || '',
      deliverylocation: fillAdditionals.recommendNote || fillAdditionals.delivaryLocation?.name || '',
      terms: fillAdditionals.address || fillAdditionals.termsOfDelivery || '',
    };

    this.additionalDetailsForm.patchValue(formData, { emitEvent: false });
    
    // Set dropdown selections
    if (fillAdditionals.accountName || fillAdditionals.salesMan?.name) {
      this.updatedSalesman = fillAdditionals.accountName || fillAdditionals.salesMan?.name;
    }
    if (fillAdditionals.vehicleNo || fillAdditionals.vehicleID) {
      this.updatedVehicleNo = fillAdditionals.vehicleNo || fillAdditionals.vehicleID;
    }
    if (fillAdditionals.recommendNote || fillAdditionals.delivaryLocation?.name) {
      this.updatedDeliveryLocation = fillAdditionals.recommendNote || fillAdditionals.delivaryLocation?.name;
    }
    
    console.log('✅ Additional details bound from transaction');
  }

  resetForm(): void {
    this.additionalDetailsForm.reset();
    this.showAdditionalDetails = false;
    this.isGrossAmountEditable = false;
    this.isApproved = false;
    this.partyBalance = '0.0000';
    this.updatedSalesman = '';
    this.updatedVehicleNo = '';
    this.updatedDeliveryLocation = '';
  }

  // NEW  PAGE DESIGN METHODS ***********************************************************************
     activeSection = 'general'; // default active tab

  setActive(section: string) {
    this.activeSection = section;
  }

  isActive(section: string): boolean {
    return this.activeSection === section;
  }

  ///END NEW PAGE DESIGN METHODS*****************************************************************************
}
