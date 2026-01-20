import { Injectable, signal, inject } from "@angular/core";
import { FillInvTransItems } from "../interface/transactions.interface";
import { DataSharingService } from "@org/services";

@Injectable({
    providedIn: 'root',
  })
  export class CommonService {
    private readonly dataSharingService = inject(DataSharingService);

    fillItemsData = signal<any[]>([]);
    invTransactions = signal<FillInvTransItems[]>([]);
    expireItemDetails = signal<any[]>([]);
    copyExpireItemDetails = signal<any[]>([]);
    itemDetails = signal<any[]>([]);
    itemDetailsObj = signal<any>({});
    noGridItem = signal<boolean>(false);
    currentItemTableIndex = signal<number>(0);
    isReferenceImported = signal<boolean>(false);

    importedReferenceList = signal<any[]>([]);
    itemTransactionData = signal<any>({});
    tempItemFillDetails = signal<any[]>([]);
    newlyAddedRows = signal<number[]>([]); // Track row IDs of newly added rows

    assignRowIds(): void {
        // Ensure all items have row IDs and index
        this.tempItemFillDetails.set(
          this.tempItemFillDetails().map((item: any, index: number) => ({
            ...item,
            rowId: index + 1,
            index: index,
          }))
        );
      }

    isEditMode(): boolean {
      return false; // Will be managed by component state
    }

    isNewMode(): boolean {
      return false; // Will be managed by component state
    }

    initializeState(): void {
      this.tempItemFillDetails.set([]);
      this.newlyAddedRows.set([]);
      this.fillItemsData.set([]);
      this.invTransactions.set([]);
      this.isReferenceImported.set(false);
    }

    // Additional details management
    private additionalDetailsData = signal<any>(null);
    private approvalStatus = signal<boolean>(false);

    setAdditionalDetailsData(data: any): void {
      this.additionalDetailsData.set(data);
    }

    getAdditionalDetailsData(): any {
      return this.additionalDetailsData();
    }

    setApprovalStatus(isApproved: boolean): void {
      this.approvalStatus.set(isApproved);
    }

    getApprovalStatus(): boolean {
      return this.approvalStatus();
    }

    clearAllData(): void {
      this.initializeState();
      this.expireItemDetails.set([]);
      this.copyExpireItemDetails.set([]);
      this.itemDetails.set([]);
      this.itemDetailsObj.set({});
      this.noGridItem.set(false);
      this.currentItemTableIndex.set(0);
      this.importedReferenceList.set([]);
      this.itemTransactionData.set({});
    }
  }