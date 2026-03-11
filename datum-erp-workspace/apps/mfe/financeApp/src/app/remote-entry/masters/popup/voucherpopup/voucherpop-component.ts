import { Component, inject, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, signal } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { EndpointConstant } from "@org/constants";
import { BaseService } from "@org/services";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface NumberingRecord {
  id?: number;
  startingNumber?: number;
  maximumDegits?: number;
  prefillwithzero?: boolean;
  prefix?: number;
  prefixValue?: string | null;
  suffix?: number;
  suffixValue?: string | null;
  editable?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-voucher-popup',
  templateUrl: './vouchercomponent.html',
  styleUrls: ['./vouchercomponent.css'],
  standalone: false,
})
export class VoucherPopupComponent extends BaseComponent implements OnInit, OnChanges {
  private baseService = inject(BaseService);
  private cdr = inject(ChangeDetectorRef);
 isEditable = signal<boolean>(false);
 isNewMode = signal<boolean>(false);

  @Input() numbering: any;

  isInputDisabled = true;
  numberingData: NumberingRecord[] = [];
  currentIndex = 0;
  currentIndexDisplay = 1;
  currentRecord: NumberingRecord = {};

  get totalRecords(): number {
    return this.numberingData.length || 0;
  }

  ngOnInit(): void {
    this.commonInit();
    this.SetPageType(2);
    console.log('numbering is',this.numbering);
    this.fetchNumbering();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['numbering'] && !changes['numbering'].firstChange) {
      this.fetchNumbering();
    }
  }

  private normalizeRecord(record: any): NumberingRecord {
    return {
      ...record,
      id: record.id ?? record.ID,
      startingNumber: record.startingNumber ?? record.startingNo ?? 0,
      maximumDegits: record.maximumDegits ?? record.maxDigits ?? record.maxDigit ?? 9,
    };
  }

  private updateCurrentRecord(): void {
    if (this.numberingData.length > 0 && this.currentIndex >= 0 && this.currentIndex < this.numberingData.length) {
      this.currentRecord = { ...this.normalizeRecord(this.numberingData[this.currentIndex]) };
      this.currentIndexDisplay = this.currentIndex + 1;
    } else {
      this.currentRecord = {};
      this.currentIndexDisplay = 0;
    }
    this.cdr.detectChanges();
  }

  fetchNumbering(): void {
    if (!this.numbering) {
      this.numberingData = [];
      this.currentIndex = 0;
      this.currentRecord = {};
      this.currentIndexDisplay = 0;
      this.cdr.detectChanges();
      return;
    }
    console.log('fetchNumbering',this.numbering);
    this.baseService
      .get<any>(EndpointConstant.FILLVOUCHERNUMBERING + this.numbering)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const isSuccess = response?.httpCode === 200 || response?.isValid === true;
          if (!isSuccess || !response?.data) {
            this.numberingData = [];
            this.currentIndex = 0;
            this.currentRecord = {};
            this.currentIndexDisplay = 0;
            this.cdr.detectChanges();
            return;
          }
          let data: any[] = [];
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (typeof response.data === 'object') {
            data = [response.data];
          }
          this.numberingData = data.map((r) => this.normalizeRecord(r));
          this.currentIndex = 0;
          this.updateCurrentRecord();
        },
        error: () => {
          this.numberingData = [];
          this.currentIndex = 0;
          this.currentRecord = {};
          this.currentIndexDisplay = 0;
          this.cdr.detectChanges();
        },
      });
  }

  private saveCurrentToData(): void {
    if (this.numberingData.length > 0 && this.currentIndex >= 0 && this.currentIndex < this.numberingData.length) {
      this.numberingData[this.currentIndex] = { ...this.currentRecord };
    }
  }

  goFirst(): void {
    if (this.numberingData.length > 0) {
      this.saveCurrentToData();
      this.currentIndex = 0;
      this.updateCurrentRecord();
    }
  }

  goPrevious(): void {
    if (this.currentIndex > 0) {
      this.saveCurrentToData();
      this.currentIndex--;
      this.updateCurrentRecord();
    }
  }

  goNext(): void {
    if (this.currentIndex < this.numberingData.length - 1) {
      this.saveCurrentToData();
      this.currentIndex++;
      this.updateCurrentRecord();
    }
  }

  goLast(): void {
    if (this.numberingData.length > 0) {
      this.saveCurrentToData();
      this.currentIndex = this.numberingData.length - 1;
      this.updateCurrentRecord();
    }
  }

  onRecordIndexChange(event: any): void {
    const val = event?.value ?? this.currentIndexDisplay;
    const idx = Math.max(1, Math.min(Math.floor(Number(val) || 1), this.numberingData.length));
    this.currentIndex = idx - 1;
    this.updateCurrentRecord();
  }

  onNew(): void {
    this.isNewMode.set(true);
    this.isEditable.set(false);
    const newRecord: NumberingRecord = { startingNumber: 0, maximumDegits: 0 };
    this.numberingData = [...this.numberingData, newRecord];
    this.currentIndex = this.numberingData.length - 1;
    this.isInputDisabled = false;
    this.updateCurrentRecord();
  }

  onEdit(): void {
    this.isInputDisabled = false;
    this.isEditable.set(true);
    this.cdr.detectChanges();
  }

  onSave(): void {
    const updatepayload={
      startingNumber: this.currentRecord.startingNumber,
      maximumDegits: this.currentRecord.maximumDegits,
    }
   
  if(this.isEditable()){
 
          this.baseService.patch<any>(EndpointConstant.UPDATEVOUCHERNUMBERING+this.numbering,updatepayload).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          .subscribe({
            next: async (response) => {
              if(response.httpCode == 200 || response?.isValid === true){
                this.toast.success("Numbering updated successfully");
              }else{
                this.toast.error("Numbering updated failed");
              }
              this.baseService.showCustomDialogue("Numbering updated successfully");
            
              this.isEditable.set(false);
              this.isNewMode.set(false);
             
              
             
            },
            error: (error) => {
              this.toast.error("Numbering updated failed");
            },
          });



  }
  else{
    this.baseService.post<any>(EndpointConstant.SAVEVOUCHERNUMBERING,updatepayload).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: async (response) => {
        if(response.httpCode == 200 || response?.isValid === true){
          this.numbering = response.data.id;
          console.log('numbering is',this.numbering);

        
          this.toast.success("Numbering saved successfully");
        }else{
          this.toast.error("Numbering saved failed");
        }
        this.baseService.showCustomDialogue("Numbering saved successfully");
      
        
        this.isNewMode.set(false);
       
        
       
      },
      error: (error) => {
        this.toast.error("Numbering updated failed");
      },
    });

  }
    this.isEditable.set(false);
    this.isInputDisabled = true;
    this.saveCurrentToData();
    this.cdr.detectChanges();
  
    // TODO: Call API to save numbering
    this.cdr.detectChanges();
  }
//delete facing issue methode not allowed error in the api
  onDelete(): void {
    this.baseService.delete<any>(EndpointConstant.DELETEVOUCHERNUMBERING+this.numbering).pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe(
      (response: any) => {
        if (response?.httpCode === 200 || response?.isValid === true) {
          this.toast.success("Numbering deleted successfully");
        } else {
          this.toast.error("Numbering deleted failed");
        }
      },
      () => {
        this.toast.error("Numbering deleted failed");
      }
    );
  }


  onApply(): void {
    this.onSave();
    // Emit close or notify parent - popupClose if available
    if (typeof (this as any).popupClose === 'function') {
      (this as any).popupClose();
    }
  }
}
