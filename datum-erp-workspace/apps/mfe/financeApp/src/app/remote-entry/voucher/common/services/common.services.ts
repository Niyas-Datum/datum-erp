import { Injectable, signal, inject } from "@angular/core";
import { DataSharingService } from "@org/services";

@Injectable({
    providedIn: 'root',
  })
  export class CommonService {
    private readonly dataSharingService = inject(DataSharingService);

    fillItemsData = signal<any[]>([]);
    tempItemFillDetails = signal<any[]>([]);
    newlyAddedRows = signal<number[]>([]);

    assignRowIds(): void {
        this.tempItemFillDetails.set(
          this.tempItemFillDetails().map((item: any, index: number) => ({
            ...item,
            rowId: index + 1,
            index: index,
          }))
        );
      }

    isEditMode(): boolean {
      return false;
    }

    isNewMode(): boolean {
      return false;
    }

    initializeState(): void {
      this.tempItemFillDetails.set([]);
      this.newlyAddedRows.set([]);
      this.fillItemsData.set([]);
    }

    clearAllData(): void {
      this.initializeState();
    }
  }
