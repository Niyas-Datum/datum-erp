import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from "@angular/core";
import { BaseComponent } from "@org/architecture";
import { GeneralAppService } from "../../http/general-app.service";
import { FormControl, FormGroup } from "@angular/forms";
import { GridComponent, ToolbarItems } from "@syncfusion/ej2-angular-grids";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GridSettingsModel, GridSettingsSaveModel } from "../model/pgridsettings.model";

@Component({
  selector: 'app-grid-Main',
  standalone: false,
  templateUrl: './formgridsettings.component.html',
  styles: [],
})
export class FormGridSettingsComponent extends BaseComponent implements OnInit {
      @ViewChild('grid') public grid!: GridComponent;
      mode = signal<'view' | 'new' | 'edit'>('view');
      isNewMode = computed(() => this.mode() === 'new');
      isEditMode = computed(() => this.mode() === 'edit');
      isNewBtnDisabled    = computed(() => this.mode() === 'edit');
      isEditBtnDisabled   = computed(() => this.mode() === 'new');
      isDeleteBtnDisabled = computed(() => this.mode() !== 'view');
      isSaveBtnDisabled   = computed(() => this.mode() === 'view');
      isPrintBtnDisabled  = computed(() => this.mode() !== 'view');
    
      // Injected services
      private destroyRef = inject(DestroyRef);
      private httpService = inject(GeneralAppService);
      public gridForm!: FormGroup;

      // State variables
      gridSettings = signal<GridSettingsModel[]>([]);
      isLoading = signal(false);
      selectedgrid = signal<GridSettingsModel | null>(null);
      formNames = signal<string[]>([]);
      public toolbar: ToolbarItems[] = ['Add', 'Edit', 'Delete', 'Update', 'Cancel'];
      formNameFormControl = new FormControl('');
      // Popup state
      showFormNamePopup = signal(false);
      selectedFormName = signal<string>('');
      currentEditingRow: any = null;
    
      // Multicolumn combobox configuration
      text = 'Select Form Name';
      fields = { text: 'formName', value: 'formName' };
    
      // Edit settings
      editSettings = {
        allowEditing: true,
        allowAdding: true,
        allowDeleting: true,
        mode: 'Normal' as const,
        newRowPosition: 'Top' as const,  // New rows appear at the top
        showConfirmDialog: false,
        showDeleteConfirmDialog: false
      };
    
     constructor() {
       super();
       this.commonInit();
     }
   
     ngOnInit(): void {
       this.onInitBase();
       this.SetPageType(2);
       console.log(this.currentPageInfo?.menuText);
        this.gridForm = new FormGroup({
    formName: new FormControl(''),
    gridName: new FormControl(''),
    columnName: new FormControl(''),
    originalCaption: new FormControl(''),
    newCaption: new FormControl(''),
    pageId: new FormControl(''),
    page: new FormControl(''),
    visible: new FormControl(''),
    arabicCaption: new FormControl(''),
    id: new FormControl(null)
  });    
    this.loadGridsettings();
    this.loadFormNamePopup();
    this.toolbar = ['Add', 'Edit', 'Delete', 'Update', 'Cancel'];
     }

    actionBegin(args: any): void {
     console.log('Action begin:', args);
     
     if (args.requestType === 'beginEdit' || args.requestType === 'add') {
      
       // Initialize form with row data
       if (args.rowData) {
         this.gridForm.patchValue(args.rowData);
         console.log('Form populated with row data:', args.rowData);
       } else {
         this.gridForm.reset();
       }
     }
     
     // Handle save operation
     if (args.requestType === 'save') {
       console.log('Save action begin - form data:', this.gridForm.value);
       console.log('Save action begin - args data:', args.data);
       
       // Merge form data with the save data, but preserve existing data
       const formData = this.gridForm.value;
       // Only update fields that have values in the form, keep existing data for undefined fields
       const mergedData = { ...args.data };
       Object.keys(formData).forEach(key => {
         if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
           mergedData[key] = formData[key];
         }
       });
       args.data = mergedData;
       console.log('Merged data for save:', args.data);
     }
   }

   // Handle cell value changes to update form
   onCellValueChanged(args: any): void {
     console.log('Cell value changed:', args);
     if (args.column && args.column.field && args.data) {
       // Update the form control when cell value changes
       this.gridForm.patchValue({
         [args.column.field]: args.value
       });
       console.log('Form updated with cell change:', args.column.field, args.value);
     }
   }
  
  clickHandler(args: any): void {
    console.log('Toolbar click:', args.item.id);
    
    if (args.item.id === 'Grid_add') { // 'Grid_add' -> Grid component id + _ + toolbar item name
        args.cancel = true;
        const newRecord = {
            formName: '',
            gridName: '',
            columnName: '',
            originalCaption: '',
            newCaption: '',
            pageId: null,
            page: '',
            visible: true,
            arabicCaption: '',
          };
          this.grid.addRecord(newRecord);
    } else if (args.item.id ==='Grid_edit') {
      console.log('Edit button clicked');
      console.log('ID:', args.data.id);
        // Handle edit button
        console.log('Edit button clicked');
    } else if (args.item.id === 'Grid_delete') {
      
        // Handle delete button
        console.log('Delete button clicked');
    } else if (args.item.id === 'Grid_update') {

        // Handle update button
        console.log('Update button clicked');
        console.log(this.gridSettings());
    } else if (args.item.id === 'Grid_cancel') {
        // Handle cancel button
        console.log('Cancel button clicked');
    }
  }
  onCellClick(args: any): void {
    console.log('Cell clicked:', args);
    console.log('Column field:', args.column.field);
  }

  // Handle form name selection from combobox
 
    onFormNameChange(event: any, data: any): void {
      console.log('Form name changed:', event);
      console.log('Data:', data);
      console.log('Data ID:', data.id);
    
      if (event && event.value) {
        // Update only the formName field in the form, preserve other fields
        this.gridForm.patchValue({ formName: event.value });
        
        // Also update the data object directly for immediate display
        data.formName = event.value;
        
        console.log('Updated formName to:', event.value);
        console.log('Form value after update:', this.gridForm.value);
        console.log('Updated data:', data);
      }
    }

    
      /** -------------------- Data Fetching -------------------- **/
      loadGridsettings(): void {
        this.isLoading.set(true);
        this.httpService
          .fetch<GridSettingsModel[]>(EndpointConstant.FILLGRIDSETTINGS)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              if (response?.isValid && response?.httpCode === 200) {
                this.gridSettings.set(response.data || []);
                console.log('Grid settings loaded:', response.data);
              } else {
                console.error('Error loading grid settings:', response);
              }
            },
            error: (error) => {
              console.error('Error fetching grid settings:', error);
            },
            complete: () => {
              this.isLoading.set(false);
            }
          });
      }
    
      loadFormNamePopup(): void {
        this.httpService
          .fetch<string[]>(EndpointConstant.FILLFORMNAMEPOPUP)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              if (response?.isValid && response?.httpCode === 200) {
                // Flatten and filter the response data
                const flattenedNames = (response.data || [])
                  .flat()  // Flatten any nested arrays
                  .filter((name): name is string => !!name && typeof name === 'string')  // Filter out null/undefined and ensure string type
                  .map(name => name.trim())  // Trim whitespace
                  .filter(name => name.length > 0);  // Remove empty strings
                
                this.formNames.set(flattenedNames);
                console.log('Form names loaded:', this.formNames());
                console.log('Total form names:', this.formNames().length);
              } else {
                console.error('Error loading form names:', response);
              }
            },
            error: (error) => {
              console.error('Error fetching form names:', error);
            }
          });
      }
    
      /** -------------------- Grid Event Handlers -------------------- **/
      onRowSelected(args: any): void {
        if (args.data) {
          this.selectedgrid.set(args.data);
          console.log('Selected grid:', args.data);
          
          // Update form with selected row data
          this.gridForm.patchValue(args.data);
          console.log('Form updated with selected row data:', this.gridForm.value);
        }
      }
    
    
    
      onActionBegin(args: any): void {
        console.log('Action begin:', args);
        
        // Handle add operation
        if (args.requestType === 'add') 
          {
            
          // Set default values for new row
          args.data = {
            id: 0,
            formName: '',
            gridName: '',
            columnName: '',
            originalCaption: '',
            newCaption: '',
            pageId: null,
            page: '',
            visible: true,
            arabicCaption: ''
          };
        }
      }
    
      onActionComplete(args: any): void {
        console.log('Action complete:', args);
        
        if (args.requestType === 'save') {
          // Update the grid data source with the saved data
          const currentData = this.gridSettings();
          const updatedData = currentData.map(item => {
            if (item.id === args.data.id) {
              return { ...item, ...args.data };
            }
            return item;
          });
          this.gridSettings.set(updatedData);
          console.log('Grid data updated with saved row:', args.data);
          
          this.saveGridSettings();
        } else if (args.requestType === 'delete') {
          //this.saveGridSettings();
        }
        else if (args.requestType === 'update') {
          console.log('Update button clicked');
          this.saveGridSettings();
        }
      }
    
      /** -------------------- Data Operations -------------------- **/
      saveGridSettings(): void {
        // Prompt for password
        const password = prompt('Please enter password to save grid Settings:');
        
        if (password === null) {
          // User cancelled the prompt
          console.log('Save operation cancelled by user');
          return;
        }
        
        if (!password || password.trim() === '') {
          alert('Password is required to save grid Settings');
          return;
        }
        
        const currentData = this.gridSettings();
        console.log('Saving grid Settings:', currentData);
        
        // Transform data to match API DTO structure
        const saveData: GridSettingsSaveModel[] = currentData.map(item => ({
          id: item.id || 0,
          formName: {
            name: (item.formName || '').trim()  // Trim whitespace from formName
          },
          gridName: (item.gridName || '').trim(),
          columnName: (item.columnName || '').trim(),
          originalCaption: (item.originalCaption || '').trim(),
          newCaption: (item.newCaption || '').trim(),
          pageId: item.pageId || 0,
          page: (item.page || '').trim(),
          arabicCaption: (item.arabicCaption || '').trim(),
          visible: item.visible === true,  // Ensure boolean
        }));
        
        console.log('Transformed save data:', saveData);
        
        // Call the save API with user-provided password
        const endpointWithPassword = `${EndpointConstant.SAVEGRIDSETTINGS}${password.trim()}`;
        this.httpService.post(endpointWithPassword, saveData)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
          .subscribe({
            next: (response) => {
              console.log('Save response:', response);
              
              // Check for invalid password
              if (response?.data === 'Invalid password') {
                console.error('Invalid password');
                alert('❌ Invalid password. Please try again.');
                return;
              }
              
              // Check for server errors (500)
              if (response?.httpCode === 500) {
                console.error('Server error:', response?.data);
                alert(`❌ Server Error:\n${response?.data || 'Unknown server error'}\n\nPlease check the data and try again.`);
                return;
              }
              
              // Check for successful save
              if (response?.isValid && response?.httpCode === 200) {
                console.log('Grid settings saved successfully');
                alert('✅ Grid settings saved successfully!');
                // Refresh data after successful save
                this.loadGridsettings();
              } else {
                console.error('Error saving grid settings:', response);
                alert('Error saving grid settings');
              }
            },
            error: (error) => {
              console.error('Error saving grid settings:', error);
              alert('Error saving grid settings');
            }
          });
      }
    
      refreshData(): void {
        this.loadGridsettings();
      }
    
      /** -------------------- Utility Methods -------------------- **/
      getVisibleSettings(): GridSettingsModel[] {
        return this.gridSettings().filter(label => label.visible);
      }
    
      getLabelsByForm(formName: string): GridSettingsModel[] {
        return this.gridSettings().filter(label => label.formName === formName);
      }
    
      toggleVisibility(grids: GridSettingsModel): void {
        const updatedgrids = this.gridSettings().map(l => 
          l.id === grids.id ? { ...l, visible: !l.visible } : l
        );
        this.gridSettings.set(updatedgrids);
      }
    
      onFormNameSelect(formName: string): void {
        console.log('Form name selected:', formName);
        
        if (this.currentEditingRow !== null) {
          // Update the grid data
          const currentData = this.gridSettings();
          const updatedData = [...currentData];
          if (updatedData[this.currentEditingRow]) {
            updatedData[this.currentEditingRow] = {
              ...updatedData[this.currentEditingRow],
              formName: formName
            };
            this.gridSettings.set(updatedData);
            console.log('Updated formName field with:', formName);
          }
        }
        
        // Close the popup
        this.showFormNamePopup.set(false);
        this.currentEditingRow = null;
      }
    
      onFormNamePopupClose(): void {
        this.showFormNamePopup.set(false);
        this.currentEditingRow = null;
        this.selectedFormName.set('');
      }
    
      onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
          this.onFormNamePopupClose();
        }
      }
      
}