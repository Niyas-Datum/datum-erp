import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { GeneralAppService } from "../../http/general-app.service";
import { Branches, Department, PDepartmentModel } from "../model/pDepartment.model";
import { firstValueFrom } from "rxjs";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { GridComponent } from "@syncfusion/ej2-angular-grids";

interface BranchRow {
  id?: number;
  companyID?: number;
  company?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-department',
  standalone: false,
  templateUrl: './department-component.html',
  styles: [],
})

export class DepartmentComponent extends BaseComponent implements OnInit {
  @ViewChild('grid') grid!: GridComponent;
  private httpService = inject(GeneralAppService);
  private cd = inject(ChangeDetectorRef);
  selectAllCompanyChecked = false;

  //variable initialization
  allBranches = [] as Array<Branches>;//getting branch dropdown data
  selectedBranches: any[] = [];
  selectedDepartmentId: number = 0;
  selectedCompanyId: number = 0;
  selectedId: number = 0;
  firstDepartment!: number;

  //// TOOLBAR STATE PROPERTIES
  isDelete: boolean = true;
  isUpdate: boolean = false;
  isLoading = false;
  savedBranches: any[] = [];
  isGridEnabled: boolean = false;
  departmentForm = this.formUtil.thisForm;

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.departmentForm.disable();
    this.isGridEnabled = false;
    this.fetchAllBranches();
  }

  //get branch dropdown data
  private fetchAllBranches(): void {
    this.httpService
      .fetch(EndpointConstant.FILLALLBRANCH)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.allBranches = response?.data as any;
          //  After loading branches, now load department data if editing
          if (this.selectedId > 0) {
            setTimeout(() => this.fetchDepartmentById(this.selectedId), 200);
          }
        },
        error: (error) => {
          this.toast.error('An Error Occured', error);
        },
      });
  }

  override newbuttonClicked(): void {
    this.departmentForm.enable();
    this.isGridEnabled = true;
    this.departmentForm.reset();
  }

  override FormInitialize() {
    this.departmentForm = new FormGroup({
      department: new FormControl({ value: '', disabled: false }, Validators.required),
      company: new FormControl({ value: '', disabled: false }, Validators.required),
    });
  }

  onBranchSelectionConfirmed(event: any) {
    const selectedIds: number[] = event.value || []; // MultiSelect returns an array of selected IDs
    // Find all branches matching the selected IDs
    const selectedBranches = this.allBranches.filter(branch =>
      selectedIds.includes(branch.id)
    );
    this.selectedBranches = selectedBranches;
  }

  override SaveFormData() {
    this.saveDepartment();
  }

  //saves department
  private saveDepartment() {
    if (this.departmentForm.invalid) {
      for (const field of Object.keys(this.departmentForm.controls)) {
        const control: any = this.departmentForm.get(field);
        if (control.invalid) {
          this.toast.error('Invalid field: ' + field);
          return;
        }
      }
      return;
    }
    const selected = this.grid.getSelectedRecords() || [];
    this.selectedBranches = selected.map((x: any) => ({
      id: x.id,
      company: x.company
    }));

    const matchedBranches = this.selectedBranches.map(x => ({
      id: x.id,
      branchName: x.company
    }));

    if (matchedBranches.length === 0) {
      this.toast.warning('Please select atleast one company');
      return;
    }

    this.isLoading = true;
    const payload = {
      depId: this.selectedId,
      department: this.departmentForm.value.department,
      branch: matchedBranches
    };
       this.saveCallback(payload);
    return true;
  }

  //api call for save department
  async saveCallback(payload: any) {
    this.httpService.post(EndpointConstant.SAVEDEPARTMENT, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (response: any) => {
          this.isLoading = false;
          const message = response?.data?.msg ?? "Successfully saved!";
          this.toast.success(message);
          // Refresh grid AFTER successful save
          await this.LeftGridInit();
          // Update shared data after refresh
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });

          // Reset state
          this.departmentForm.disable();
          this.isGridEnabled = false;

        },
        error: (error) => {
          this.isLoading = false;
          this.toast.error('Please try again');
        },
      });
  }


  override async LeftGridInit() {
    this.pageheading = 'Department';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLDEPARTMENTS)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      // handle data here after await completes
      this.leftGrid.leftGridData = res.data;
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Department List',
          columns: [
            {
              field: 'department',
              datacol: 'department',
              headerText: 'Department',
              textAlign: 'Left',
            },

          ],
        },
      ];
    } catch (err) {
      this.toast.error('Error fetching companies:' + err);
    }
  }

  override onEditClick() {
     this.isUpdate = true;
    this.departmentForm.enable();
    this.isGridEnabled = true;
  }

  preselectCompanies() {
    if (!this.selectedBranches?.length) return;

    const selectedIds = this.selectedBranches.map(x => x.id);
    const rowIndexes = this.allBranches
      .map((x, i) => (selectedIds.includes(x.id) ? i : -1))
      .filter(i => i !== -1);

    this.grid.selectRows(rowIndexes);
  }

  onRowSelected(event: any) {
    if (!this.isGridEnabled) {
      event.cancel = true;
      return;
    }
    const selectedRecords = this.grid.getSelectedRecords();
    this.selectedBranches = selectedRecords.map((x: any) => ({ id: x.id, company: x.company }));

    // FIX: sync form control
    this.departmentForm.get('company')?.setValue(this.selectedBranches.length > 0 ? 'selected' : '');
    this.departmentForm.get('company')?.updateValueAndValidity();
  }

  override getDataById(data: Department) {
    this.selectedId = data.id;

    // Branches may not be loaded yet
    if (this.allBranches.length > 0) {
      this.fetchDepartmentById(this.selectedId);
    }
  }

  fetchDepartmentById(id: number) {    
     this.isGridEnabled = true;
    // Ensure allBranches loaded first
    if (!this.allBranches || this.allBranches.length === 0) {
      setTimeout(() => this.fetchDepartmentById(id), 100);
      return;
    }

    this.httpService.fetch(`${EndpointConstant.FILLALLDEPARTMENTBYID}${id}`)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe((res: any) => {
        const data = Array.isArray(res.data) ? res.data : [];
        if (!data.length) return;

        this.departmentForm.patchValue({ department: data[0].departmentType });
        this.savedBranches = data.map((x: any) => x.companyID);

        this.cd.detectChanges(); // ensure grid updates

        const waitForGrid = () => {
          const gridData = this.grid?.getCurrentViewRecords() || [];
          if (gridData.length > 0) {
            this.selectSavedCompanies();
          } else {
            setTimeout(waitForGrid, 50);
          }
        };
        waitForGrid();
      });
  }

  private selectSavedCompanies() {
    if (!this.savedBranches || this.savedBranches.length === 0) return;

    const gridData = (this.grid.getCurrentViewRecords() || []) as BranchRow[];
    const rowIndexes: number[] = [];

    gridData.forEach((row: BranchRow, index: number) => {
      const rowId = row.id ?? row.companyID;
      if (rowId && this.savedBranches.includes(rowId)) {
        rowIndexes.push(index);
      }
    });

    if (rowIndexes.length > 0) {
      this.grid.clearSelection();
      this.grid.selectRows(rowIndexes);

      // Update selectedBranches for saving
      this.selectedBranches = rowIndexes.map(idx => ({
        id: gridData[idx].id ?? gridData[idx].companyID,
        company: gridData[idx].company
      }));

      // Fix "Invalid company" error on edit
      const companyControl = this.departmentForm.get('company');
      if (companyControl) {
        companyControl.setValue('selected');
        companyControl.updateValueAndValidity();
      }
    }
  }

  override DeleteData(data: PDepartmentModel) {
    if (!this.isDelete) {
      this.toast.warning('Permission Denied!');
      return false;
    }
    if (confirm("Are you sure you want to delete this details?")) {
      this.isLoading = true;
      this.httpService.delete(EndpointConstant.DELETEDEPARTMENT + this.selectedId)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toast.success(response.data as any);
            this.LeftGridInit();
            this.selectedId = this.firstDepartment;            
          },
          error: (error) => {
            this.isLoading = false;
            this.toast.error('Please try again');
          },
        });
    }
    return true;
  }


}