import {

    Component,
    inject,
    OnInit,
    ViewChild,
    ChangeDetectorRef,
    
  } from '@angular/core';
  import { BaseComponent } from '@org/architecture';
  import { FinanceAppService } from '../../http/finance-app.service';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { EndpointConstant } from '@org/constants';
  import { EditSettingsModel, GridComponent, EditService } from '@syncfusion/ej2-angular-grids';
  
  @Component({
    //eslint-disable-next-line @angular-eslint/component-selector
    selector: 'app-vouchers-Main',
    //eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    templateUrl: './vouchers-component.html',
    styleUrls: ['./vouchers-component.css'],
    providers: [EditService],
  })
  export class VouchersComponent extends BaseComponent implements OnInit{
    @ViewChild('voucherGrid') voucherGrid?: GridComponent;
    private httpService = inject(FinanceAppService);
    private cdr = inject(ChangeDetectorRef);
    isEdit = true;
    isInputDisabled = true;
    payload={
              id: 0,
              name: '',
              alias: '',
              primaryVoucherId: 0,
              type: '',
              active: true,
              code: '',
              devCode: 0,
              documentTypeId: 0,
              numbering: 0,
              financeUpdate: true,
              rateUpdate: true,
              rowType: 0,
              approvalRequired: true,
              workflowDays: 0,
              approvalDays: 0,
              inventoryUpdate: true,
              moduleType: 0,
              reportPath: '',
              nature: ''
            
          
    }
  
    vouchersData: any[] = [];
    originalData: any[] = []; // Store original data for comparison
    
    editSettings: EditSettingsModel = {
      allowEditing: false,
      allowAdding: false,
      allowDeleting: false,
      mode: 'Normal' as any,
    };
  
    ngOnInit(): void {
      this.onInitBase();
      this.SetPageType(2);
      this.fetchVouchers();
    }
 

    fetchVouchers(): void {
      this.httpService
        .fetch<any>(EndpointConstant.FILLVOUCHERS)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
           
            this.vouchersData = response.data;
            this.cdr.detectChanges();
            
        //     // Handle different response formats
        //     let data: any[] = [];
        //     if (Array.isArray(response)) {
        //       // Response is directly an array
        //       data = response;
        //     } else if (response?.data && Array.isArray(response.data)) {
        //       // Response has data property with array
        //       data = response.data;
        //     } 
           
            
        //     // Filter out any empty or null rows
        //     this.vouchersData = data.filter(item => item && item.id != null);
        //     console.log('Vouchers loaded:', this.vouchersData.length, 'items');
        //     this.isLoading = false;
            
        //     // Force change detection and refresh grid
        //     this.cdr.detectChanges();
            
        //     // Refresh grid after data is loaded and change detection completes
        //     setTimeout(() => {
        //       if (this.voucherGrid) {
        //         this.voucherGrid.dataSource = this.vouchersData;
        //         this.voucherGrid.refresh();
        //       }
        //     }, 100);
        //   },
        //   error: (error) => {
        //     console.error('Error fetching vouchers:', error);
        //     this.vouchersData = [];
        //     this.isLoading = false;
        //     this.cdr.detectChanges();
          },
        });
    }
    onClickEditAccountList(): boolean {
      if (!this.isEdit) {
        alert('Permission Denied!');
        return false;
      }
      // Enable edit mode
      this.isInputDisabled = false;
      this.editSettings.allowEditing = true;
      // Store original data for comparison
      this.originalData = JSON.parse(JSON.stringify(this.vouchersData));
      this.cdr.detectChanges();
      // Refresh grid to apply edit settings
      setTimeout(() => {
        if (this.voucherGrid) {
          this.voucherGrid.refresh();
        }
      }, 0);
      return true;
    }
  
    onClickSaveAccountList(): void {
      if (this.isInputDisabled) {
        return;
      }
  
      // Prepare payload with only changed data
      const payload = this.prepareUpdatePayload();
      
      if (payload.length === 0) {
        alert('No changes to save');
        return;
      }

      // Print payload before saving
      console.log('=== PAYLOAD BEFORE SAVING ===');
      console.log('Payload (formatted):', JSON.stringify(payload, null, 2));
      console.log('Payload (object):', payload);
      console.log('Number of rows to update:', payload.length);
      console.log('================================');
      
      // TODO: Call API to save changes
      this.httpService.patch(EndpointConstant.UPDATEVOUCHERS, payload)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            console.log('Vouchers updated successfully:', response);
            this.isInputDisabled = true;
            this.editSettings.allowEditing = false;
            this.fetchVouchers(); // Refresh data
          },
          error: (error) => {
            console.error('Error updating vouchers:', error);
            alert('Error saving changes');
          },
        });
    }
  
    prepareUpdatePayload(): any[] {
      const payload: any[] = [];
      
      console.log('=== CHECKING FOR CHANGES ===');
      console.log('Current data count:', this.vouchersData.length);
      console.log('Original data count:', this.originalData.length);
      
      this.vouchersData.forEach((current, index) => {
        const original = this.originalData[index];
        if (!original) {
          console.log(`Row ${index}: No original data found`);
          return;
        }

        // Normalize values for comparison (handle string vs number)
        const normalizeValue = (val: any) => {
          if (val === null || val === undefined) return '';
          if (typeof val === 'string') {
            const num = parseInt(val, 10);
            return isNaN(num) ? val : num;
          }
          return val;
        };

        // Check if any editable field has changed
        const hasChanges = 
          normalizeValue(current.numbering) !== normalizeValue(original.numbering) ||
          normalizeValue(current.approvalDays) !== normalizeValue(original.approvalDays) ||
          normalizeValue(current.workflowDays) !== normalizeValue(original.workflowDays) ||
          current.active !== original.active ||
          current.approvalRequired !== original.approvalRequired ||
          (current.reportPath || '') !== (original.reportPath || '');

        if (hasChanges) {
          console.log(`Row ${index} (ID: ${current.id}) has changes:`, {
            numbering: { current: current.numbering, original: original.numbering },
            approvalDays: { current: current.approvalDays, original: original.approvalDays },
            workflowDays: { current: current.workflowDays, original: original.workflowDays },
            active: { current: current.active, original: original.active },
            approvalRequired: { current: current.approvalRequired, original: original.approvalRequired },
            reportPath: { current: current.reportPath, original: original.reportPath }
          });
          payload.push({
            id: current.id || 0,
            name: current.name || '',
            alias: current.alias || '',
            primaryVoucherId: current.primaryVoucherID || current.primaryVoucherId || 0,
            type: current.type || '',
            active: current.active !== undefined ? current.active : true,
            code: current.code || '',
            devCode: current.devCode || 0,
            documentTypeId: current.documentType || current.documentTypeId || 0,
            numbering: current.numbering || 0,
            financeUpdate: current.financeUpdate !== undefined ? current.financeUpdate : true,
            rateUpdate: current.rateUpdate !== undefined ? current.rateUpdate : true,
            rowType: current.rowType || 0,
            approvalRequired: current.approvalRequired !== undefined ? current.approvalRequired : true,
            workflowDays: current.workflowDays || 0,
            approvalDays: current.approvalDays || 0,
            inventoryUpdate: current.inventoryUpdate !== undefined ? current.inventoryUpdate : true,
            moduleType: current.moduleType || 0,
            reportPath: current.reportPath || '',
            nature: current.nature || '',
          });
        }
      });

      console.log('Total rows with changes:', payload.length);
      console.log('=== END CHANGE CHECK ===');
      return payload;
    }

    onGridActionComplete(args: any): void {
      if (args.requestType === 'save') {
        // Handle save action if needed
        this.cdr.detectChanges();
      }
    }

    onDataBound(args: any): void {
      console.log('Grid data bound. Row count:', this.voucherGrid?.getRows().length);
    }

    onNumberingChange(event: any, data: any): void {
      if (event && event.value !== undefined && event.value !== null) {
        // Convert to number if it's a string
        const value = typeof event.value === 'string' ? parseInt(event.value, 10) || 0 : event.value;
        // Find and update the actual row in vouchersData array
        const rowIndex = this.vouchersData.findIndex(row => row.id === data.id);
        if (rowIndex !== -1) {
          this.vouchersData[rowIndex].numbering = value;
          console.log('Numbering changed:', value, 'for row ID:', data.id, 'at index:', rowIndex);
        } else {
          // Fallback: update the data object directly
          data.numbering = value;
          console.log('Numbering changed (fallback):', value, 'for row ID:', data.id);
        }
      }
    }

    onApprovalRequiredChange(event: any, data: any): void {
      if (event && event.checked !== undefined) {
        // Find and update the actual row in vouchersData array
        const rowIndex = this.vouchersData.findIndex(row => row.id === data.id);
        if (rowIndex !== -1) {
          this.vouchersData[rowIndex].approvalRequired = event.checked;
        } else {
          data.approvalRequired = event.checked;
        }
      }
    }

    onActiveChange(event: any, data: any): void {
      if (event && event.checked !== undefined) {
        // Find and update the actual row in vouchersData array
        const rowIndex = this.vouchersData.findIndex(row => row.id === data.id);
        if (rowIndex !== -1) {
          this.vouchersData[rowIndex].active = event.checked;
        } else {
          data.active = event.checked;
        }
      }
    }

    onWorkflowDaysChange(event: any, data: any): void {
      if (event && event.value !== undefined && event.value !== null) {
        // Convert to number if it's a string
        const value = typeof event.value === 'string' ? parseInt(event.value, 10) || 0 : event.value;
        // Find and update the actual row in vouchersData array
        const rowIndex = this.vouchersData.findIndex(row => row.id === data.id);
        if (rowIndex !== -1) {
          this.vouchersData[rowIndex].workflowDays = value;
          console.log('WorkflowDays changed:', value, 'for row ID:', data.id, 'at index:', rowIndex);
        } else {
          // Fallback: update the data object directly
          data.workflowDays = value;
          console.log('WorkflowDays changed (fallback):', value, 'for row ID:', data.id);
        }
      }
    }

    onApprovalDaysChange(event: any, data: any): void {
      if (event && event.value !== undefined && event.value !== null) {
        // Convert to number if it's a string
        const value = typeof event.value === 'string' ? parseInt(event.value, 10) || 0 : event.value;
        // Find and update the actual row in vouchersData array
        const rowIndex = this.vouchersData.findIndex(row => row.id === data.id);
        if (rowIndex !== -1) {
          this.vouchersData[rowIndex].approvalDays = value;
          console.log('ApprovalDays changed:', value, 'for row ID:', data.id, 'at index:', rowIndex);
        } else {
          // Fallback: update the data object directly
          data.approvalDays = value;
          console.log('ApprovalDays changed (fallback):', value, 'for row ID:', data.id);
        }
      }
    }

    onReportPathChange(event: any, data: any): void {
      if (event && event.value !== undefined) {
        const value = event.value || '';
        // Find and update the actual row in vouchersData array
        const rowIndex = this.vouchersData.findIndex(row => row.id === data.id);
        if (rowIndex !== -1) {
          this.vouchersData[rowIndex].reportPath = value;
          console.log('ReportPath changed:', value, 'for row ID:', data.id, 'at index:', rowIndex);
        } else {
          // Fallback: update the data object directly
          data.reportPath = value;
          console.log('ReportPath changed (fallback):', value, 'for row ID:', data.id);
        }
      }
    }
  }
  
