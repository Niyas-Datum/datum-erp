import {Component,inject,OnInit } from '@angular/core';
import { FormControl,FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { FinanceAppService } from '../../http/finance-app.service';
import { ALLFINANCIALYEAR, PFinancialYear } from '../../model/PFinancialYearModel';
import { DatePipe } from '@angular/common';
import { BaseService } from '@org/services';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-financial-Main',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './financialYear-component.html',
  styles: [],
})
export class FinancialYearComponent extends BaseComponent implements OnInit {
  private httpService = inject(FinanceAppService);
  private baseService = inject(BaseService);
  private datePipe = inject(DatePipe);
  financialYearForm = this.formUtil.thisForm;
  
  isLoading = false;
  selectedFinancialYearId = 0;
  firstFinancialYear = 0;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isActive: boolean = false;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isUpdate: boolean = false;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isEdit: boolean = true;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isDelete: boolean = true;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  isInputDisabled: boolean = true;
  currentFinancialYear = {} as PFinancialYear; 
      
  statusList:any = [
    {
      "value":"R",
      "name":"Current"
    },
    {
      "value":"C",
      "name":"Closed"
    },
    {
      "value":"O",
      "name":"Others"
    }
  ];

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.financialYearForm.disable();
    console.log("pageid",this.currentPageInfo?.menuText);
  }

  override FormInitialize() {
    this.financialYearForm = new FormGroup({
      financeyear: new FormControl({ value: '', disabled: false },Validators.required),
      startdate: new FormControl({ value: '', disabled: false },Validators.required),
      enddate: new FormControl({ value: '', disabled: false },Validators.required),
      locktilldate: new FormControl({ value: '', disabled: false }, Validators.required),
      status: new FormControl({ value: true, disabled: false }, Validators.required),
    });
    console.log('form init started');
  }

   override newbuttonClicked(): void {
    console.log('New button clicked');
    this.financialYearForm.enable();
    this.resetForm();
  }

   resetForm(): void {
    this.financialYearForm.reset();
    this.isActive = false;
  }

  convertToLocalDateString(selectedDate: Date | null): string | null {
    if (!selectedDate) {
      return null;
    }
  
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const seconds = selectedDate.getSeconds().toString().padStart(2, '0');
  
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  }

  override SaveFormData() {
   // console.log('data scving');
    console.log(this.financialYearForm.controls);
    this.saveFinancialYear();
  }

  private saveFinancialYear(){
     if (this.financialYearForm.invalid) {
      for (const field of Object.keys(this.financialYearForm.controls)) {
        const control: any = this.financialYearForm.get(field);
        if (control.invalid) {
          this.baseService.showCustomDialogue('Invalid field: ' + field);
          return;  // Stop after showing the first invalid field
        }
      }
      return;
    }
    
    const selectedsDate = this.financialYearForm.value.startdate;
    // Create a JavaScript Date object from the provided date components
    const sDateisoString = selectedsDate ? (this.convertToLocalDateString(new Date(selectedsDate))) : null;
   

    const selectedeDate = this.financialYearForm.value.enddate;
    // Create a JavaScript Date object from the provided date components
    const eDateisoString = selectedeDate ? (this.convertToLocalDateString(new Date(selectedeDate))) : null;
    
    const selectedlockDate = this.financialYearForm.value.locktilldate;
    // Create a JavaScript Date object from the provided date components
    const lockDateisoString = selectedlockDate ? (this.convertToLocalDateString(new Date(selectedlockDate))) : null;
    

    const payload = {
      "financeYear":this.financialYearForm.value.financeyear,
      "startDate": sDateisoString,
      "endDate": eDateisoString,
      "lockTillDate": lockDateisoString,
      "status": this.financialYearForm.value.status,
    }
    if(this.isUpdate){
      this.updateCallback(payload);
    } else{
      this.createCallback(payload);
    }

   }
   
  updateCallback(payload:any){
    this.httpService.patch(EndpointConstant.UPDATEFINANCIALYEAR+this.selectedFinancialYearId,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if(response.httpCode == 201){
            this.baseService.showCustomDialogue("Successfully saved Financial Year"); 
            this.selectedFinancialYearId = this.firstFinancialYear;
            this.fetchFinancialYearById();
            this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
            this.LeftGridInit();
          }
          if(response.httpCode == 500){
            this.baseService.showCustomDialogue(response.data as any);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.baseService.showCustomDialogue('Please try again');
        },
      });
  }

  createCallback(payload:any){
    this.httpService.post(EndpointConstant.SAVEFINANCIALYEAR,payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if(response.httpCode == 201){
            this.baseService.showCustomDialogue('Successfully saved Financial Year'); 
            this.selectedFinancialYearId = this.firstFinancialYear;
            this.fetchFinancialYearById();
             this.LeftGridInit();
             this.serviceBase.dataSharingService.setData({
              columns: this.leftGrid.leftGridColumns,
              data: this.leftGrid.leftGridData,
              pageheading: this.pageheading,
            });
          }
          if(response.httpCode == 500){
            this.baseService.showCustomDialogue(response.data as any);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving Financial Year', error);
        },
      });
  }


  override async LeftGridInit() {
    this.pageheading = 'Financial Year';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLFINANCIALYEAR)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      // handle data here after await completes
      this.leftGrid.leftGridData = res.data;
      console.log('Fetched data:', this.leftGrid.leftGridData);

      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Financial Year',
          columns: [
            {
              field: 'finYearCode',
              datacol: 'finYearCode',
              headerText: 'FinancialYear',
              textAlign: 'Left',
            },
            {
              field: 'startDate',
              datacol: 'startDate',
              headerText: 'StartDate',
              textAlign: 'Left',
            },
             {
              field: 'EndDate',
              datacol: 'EndDate',
              headerText: 'EndDate',
              textAlign: 'Left',
            },
            {
              field: 'status',
              datacol: 'status',
              headerText: 'Status',
              textAlign: 'Left',
            },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }

  override onEditClick(){
    console.log('we have entered in to edit mode ')
    this.isUpdate = true;
    this.financialYearForm.enable();
  }

  override getDataById(data: PFinancialYear) {
    console.log('data', data);
    this.selectedFinancialYearId = data.finYearID;
    this.fetchFinancialYearById();
  }

   private fetchFinancialYearById(): void {   
    this.httpService
    .fetch(EndpointConstant.FILLFINANCIALYEARBYID+this.selectedFinancialYearId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
       this.currentFinancialYear = (response?.data as any)[0];
        
      console.log("fetchbyid:",response.data);

        let startDate = null;
        let endDate = null;
        let lockTillDate = null;

        if(this.currentFinancialYear.startDate != null){
          startDate = this.datePipe.transform(new Date(this.currentFinancialYear.startDate), 'yyyy-MM-dd');
        }
        if(this.currentFinancialYear.endDate != null){
          endDate = this.datePipe.transform(new Date(this.currentFinancialYear.endDate), 'yyyy-MM-dd');
        }
        if(this.currentFinancialYear.lockTillDate != null){
          lockTillDate = this.datePipe.transform(new Date(this.currentFinancialYear.lockTillDate), 'yyyy-MM-dd');
        }
        this.financialYearForm.disable();

        this.financialYearForm.patchValue({
          financeyear: this.currentFinancialYear.finYearCode,
          startdate: startDate,
          enddate: endDate,
          locktilldate: lockTillDate,
          status:this.currentFinancialYear.status
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('An Error Occured', error);
      },
    });
  }

  override DeleteData(data: PFinancialYear) {
    console.log('deleted');
     if(!this.isDelete){
        this.baseService.showCustomDialogue('Permission Denied!');
        return false;
      }
      if(confirm("Are you sure you want to delete this details?")) {
        this.isLoading = true;
        this.httpService.delete(EndpointConstant.DELETECURRENCYMASTER+this.selectedFinancialYearId)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.baseService.showCustomDialogue(response.data as any);          
            this.selectedFinancialYearId = this.firstFinancialYear;
            this.LeftGridInit();
          },
          error: (error) => {
            this.isLoading = false;
            this.baseService.showCustomDialogue('Please try again');
          },
        });
      }
      return true;
  }

  override formValidationError(){
    console.log("form error found");
  }
}
