import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from "@angular/core";
import { GeneralAppService } from "../../http/general-app.service";
import { BaseComponent } from "@org/architecture";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import { GridComponent, ToolbarItems } from "@syncfusion/ej2-angular-grids";
import { GridLabelDto, GridLabelSaveDto } from "../model/pgridlabel.model";



@Component({
  //eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-settings-Main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './formlabelsettings.component.html',
  //template: '<router-outlet></router-outlet>',
  styles: [],
})
export class FormlabelsettingsComponent extends BaseComponent implements OnInit  {
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
  public editForm!: FormGroup;

  // State variables
  gridLabels = signal<GridLabelDto[]>([]);
  isLoading = signal(false);
  selectedLabel = signal<GridLabelDto | null>(null);
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


  // Grid configuration
  gridColumns = [
    
    { field: 'formName', headerText: 'Form Name', width: '150' },
    { field: 'labelName', headerText: 'Label Name', width: '150' },
    { field: 'originalCaption', headerText: 'Original Caption', width: '200' },
    { field: 'newCaption', headerText: 'New Caption', width: '200' },
    { field: 'pageId', headerText: 'Page Id', width: '100', textAlign: 'Center' },
    
    { field: 'visible', headerText: 'Visible', width: '100', textAlign: 'Center' },
    {field:'enable', headerText: 'Enable', width: '100', textAlign: 'Center' },

    { field: 'arabicCaption', headerText: 'Arabic Caption', width: '150' }
  ];

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


  ngOnInit(): void {
     this.onInitBase();
      this.SetPageType(2);

    this.editForm = new FormGroup({
    formName: new FormControl(''),
    labelName: new FormControl(''),
    originalCaption: new FormControl(''),
    newCaption: new FormControl(''),
    pageId: new FormControl(''),
    visible: new FormControl(''),
    enable: new FormControl(''),
    arabicCaption: new FormControl(''),
    id: new FormControl(null)
  });    
    
    this.loadGridLabels();
    this.loadFormNamePopup();
    this.toolbar = ['Add', 'Edit', 'Delete', 'Update', 'Cancel'];
    

  }
   actionBegin(args: any): void {
     console.log('Action begin:', args);
     
     if (args.requestType === 'beginEdit' || args.requestType === 'add') {
       // Initialize form with row data
       if (args.rowData) {
         this.editForm.patchValue(args.rowData);
         console.log('Form populated with row data:', args.rowData);
       } else {
         this.editForm.reset();
       }
     }
     
     // Handle save operation
     if (args.requestType === 'save') {
       console.log('Save action begin - form data:', this.editForm.value);
       console.log('Save action begin - args data:', args.data);
       
       // Merge form data with the save data, but preserve existing data
       const formData = this.editForm.value;
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
       this.editForm.patchValue({
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
            labelName: '',
            originalCaption: '',
            newCaption: '',
            pageId: null,
            visible: true,
            enable: true,
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
        console.log(this.gridLabels());
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
        this.editForm.patchValue({ formName: event.value });
        
        // Also update the data object directly for immediate display
        data.formName = event.value;
        
        console.log('Updated formName to:', event.value);
        console.log('Form value after update:', this.editForm.value);
        console.log('Updated data:', data);
      }
    }
    


 

  /** -------------------- Data Fetching -------------------- **/
  loadGridLabels(): void {

    this.isLoading.set(true);
    
    this.httpService
      .fetch<GridLabelDto[]>(EndpointConstant.FILLLABELSETTINGS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.isValid && response?.httpCode === 200) {
            this.gridLabels.set(response.data || []);
            console.log('Grid labels loaded:', response.data);
          } else {
            console.error('Error loading grid labels:', response);
          }
        },
        error: (error) => {
          console.error('Error fetching grid labels:', error);
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
      this.selectedLabel.set(args.data);
      console.log('Selected label:', args.data);
      
      // Update form with selected row data
      this.editForm.patchValue(args.data);
      console.log('Form updated with selected row data:', this.editForm.value);
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
        labelName: '',
        originalCaption: '',
        newCaption: '',
        pageId: null,
        visible: true,
        enable: true,
        arabicCaption: ''
      };
    }
  }

  onActionComplete(args: any): void {
    console.log('Action complete:', args);
    
    if (args.requestType === 'save') {
      // Update the grid data source with the saved data
      const currentData = this.gridLabels();
      const updatedData = currentData.map(item => {
        if (item.id === args.data.id) {
          return { ...item, ...args.data };
        }
        return item;
      });
      this.gridLabels.set(updatedData);
      console.log('Grid data updated with saved row:', args.data);
      
      this.saveGridLabels();
    } else if (args.requestType === 'delete') {
      //this.saveGridLabels();
    }
    else if (args.requestType === 'update') {
      console.log('Update button clicked');
      this.saveGridLabels();
    }
  }

  /** -------------------- Data Operations -------------------- **/
  saveGridLabels(): void {
    // Prompt for password
    const password = prompt('Please enter password to save grid labels:');
    
    if (password === null) {
      // User cancelled the prompt
      console.log('Save operation cancelled by user');
      return;
    }
    
    if (!password || password.trim() === '') {
      alert('Password is required to save grid labels');
      return;
    }
    
    const currentData = this.gridLabels();
    console.log('Saving grid labels:', currentData);
    
    // Transform data to match API DTO structure
    const saveData: GridLabelSaveDto[] = currentData.map(item => ({
      id: item.id || 0,
      formName: {
        name: (item.formName || '').trim()  // Trim whitespace from formName
      },
      labelName: (item.labelName || '').trim(),
      originalCaption: (item.originalCaption || '').trim(),
      newCaption: (item.newCaption || '').trim(),
      pageId: item.pageId || 0,
      arabicCaption: (item.arabicCaption || '').trim(),
      visible: item.visible === true,  // Ensure boolean
      enable: item.enable === true     // Ensure boolean
    }));
    
    console.log('Transformed save data:', saveData);
    
    // Call the save API with user-provided password
    const endpointWithPassword = `${EndpointConstant.SAVELABELSETTINGS}${password.trim()}`;
    this.httpService.post(endpointWithPassword, saveData)
      .pipe(takeUntilDestroyed(this.destroyRef))
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
            console.log('Grid labels saved successfully');
            alert('✅ Grid labels saved successfully!');
            // Refresh data after successful save
            this.loadGridLabels();
          } else {
            console.error('Error saving grid labels:', response);
            alert('Error saving grid labels');
          }
        },
        error: (error) => {
          console.error('Error saving grid labels:', error);
          alert('Error saving grid labels');
        }
      });
  }

  refreshData(): void {
    this.loadGridLabels();
  }

  /** -------------------- Utility Methods -------------------- **/
  getVisibleLabels(): GridLabelDto[] {
    return this.gridLabels().filter(label => label.visible);
  }

  getLabelsByForm(formName: string): GridLabelDto[] {
    return this.gridLabels().filter(label => label.formName === formName);
  }

  toggleVisibility(label: GridLabelDto): void {
    const updatedLabels = this.gridLabels().map(l => 
      l.id === label.id ? { ...l, visible: !l.visible } : l
    );
    this.gridLabels.set(updatedLabels);
  }

  onFormNameSelect(formName: string): void {
    console.log('Form name selected:', formName);
    
    if (this.currentEditingRow !== null) {
      // Update the grid data
      const currentData = this.gridLabels();
      const updatedData = [...currentData];
      if (updatedData[this.currentEditingRow]) {
        updatedData[this.currentEditingRow] = {
          ...updatedData[this.currentEditingRow],
          formName: formName
        };
        this.gridLabels.set(updatedData);
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



    // @ViewChild('grid') public grid!: GridComponent;
    // mode = signal<'view' | 'new' | 'edit'>('view');
    // isNewMode = computed(() => this.mode() === 'new');
    // isEditMode = computed(() => this.mode() === 'edit');
    // isNewBtnDisabled    = computed(() => this.mode() === 'edit');
    // isEditBtnDisabled   = computed(() => this.mode() === 'new');
    // isDeleteBtnDisabled = computed(() => this.mode() !== 'view');
    // isSaveBtnDisabled   = computed(() => this.mode() === 'view');
    // isPrintBtnDisabled  = computed(() => this.mode() !== 'view');
  
    // Injected services
  //   private destroyRef = inject(DestroyRef);
    
  //   public editForm!: FormGroup;
  
  //   // State variables
  //   gridLabels = signal<GridLabelDto[]>([]);
  //   isLoading = signal(false);
  //   selectedLabel = signal<GridLabelDto | null>(null);
  //   formNames = signal<string[]>([]);
  //   public toolbar: ToolbarItems[] = ['Add', 'Edit', 'Delete', 'Update', 'Cancel'];
  //   formNameFormControl = new FormControl('');
  //   // Popup state
  //   showFormNamePopup = signal(false);
  //   selectedFormName = signal<string>('');
  //   currentEditingRow: any = null;
  
  //   // Multicolumn combobox configuration
  //   text = 'Select Form Name';
  //   fields = { text: 'formName', value: 'formName' };
  
  //   // Grid configuration
  //  gridColumns = [
    
  //   { field: 'formName', headerText: 'Form Name', width: '150' },
  //   { field: 'labelName', headerText: 'Label Name', width: '150' },
  //   { field: 'originalCaption', headerText: 'Original Caption', width: '200' },
  //   { field: 'newCaption', headerText: 'New Caption', width: '200' },
  //   { field: 'pageId', headerText: 'Page Id', width: '100', textAlign: 'Center' },
    
  //   { field: 'visible', headerText: 'Visible', width: '100', textAlign: 'Center' },
  //   {field:'enable', headerText: 'Enable', width: '100', textAlign: 'Center' },

  //   { field: 'arabicCaption', headerText: 'Arabic Caption', width: '150' }
  // ];
  //   editSettings = {
  //       allowEditing: true,
  //       allowAdding: true,
  //       allowDeleting: true,
  //       mode: 'Normal' as const,
  //       newRowPosition: 'Top' as const,  // New rows appear at the top
  //       showConfirmDialog: false,
  //       showDeleteConfirmDialog: false
  //     };
    
  //   // STATE PROPERTIES
  
  // isInputDisabled = true;
  // isActive: unknown;
  //   // TOOLBAR STATE PROPERTIES
  // isNewMode = signal(false);
  // isEditMode = signal(false);
  // isNewBtnDisabled = signal(false);
  // isEditBtnDisabled = signal(false);
  // isDeleteBtnDisabled = signal(false);
  // isSaveBtnDisabled = signal(false);
  // isPrintBtnDisabled = signal(false);
  //   private httpService = inject(GeneralAppService);
  //   formlabelsettingsForm = this.formUtil.thisForm;
  //   constructor() {
  //     super();
  //     this.commonInit();
  //   }
  
  //   async ngOnInit(): Promise<void> {
  //     await this.onInitBase();
  //     this.SetPageType(2);
  //     await this.loadGridLabels();
  //     await this.loadFormNamePopup();
  //     this.toolbar = ['Add', 'Edit', 'Delete', 'Update', 'Cancel'];
      
  //   }
  //   loadGridLabels(): void {

  //       this.isLoading.set(true);
        
  //       this.httpService
  //         .fetch<GridLabelDto[]>(EndpointConstant.FILLLABELSETTINGS)
  //         .pipe(takeUntilDestroyed(this.destroyRef))
  //         .subscribe({
  //           next: (response) => {
  //             if (response?.isValid && response?.httpCode === 200) {
  //               this.gridLabels.set(response.data || []);
  //               console.log('Grid labels loaded:', response.data);
  //             } else {
  //               console.error('Error loading grid labels:', response);
  //             }
  //           },
  //           error: (error) => {
  //             console.error('Error fetching grid labels:', error);
  //           },
  //           complete: () => {
  //             this.isLoading.set(false);
  //           }
  //         });
  //     }
  //     loadFormNamePopup(): void {
  //       console.log('we have entered in to the loadFormNamePopup function');
  //       this.httpService
  //         .fetch<string[]>(EndpointConstant.FILLFORMNAMEPOPUP)
  //         .pipe(takeUntilDestroyed(this.destroyRef))
  //         .subscribe({
  //           next: (response) => {
  //             if (response?.isValid && response?.httpCode === 200) {
  //               // Flatten and filter the response data
  //               const flattenedNames = (response.data || [])
  //                 .flat()  // Flatten any nested arrays
  //                 .filter((name): name is string => !!name && typeof name === 'string')  // Filter out null/undefined and ensure string type
  //                 .map(name => name.trim())  // Trim whitespace
  //                 .filter(name => name.length > 0);  // Remove empty strings
                
  //               this.formNames.set(flattenedNames);
  //               console.log('Form names loaded:', this.formNames());
  //               console.log('Total form names:', this.formNames().length);
  //             } else {
  //               console.error('Error loading form names:', response);
  //             }
  //           },
  //           error: (error) => {
  //             console.error('Error fetching form names:', error);
  //           }
  //         });
  //     }
      
  //     // Fallback method to try alternative endpoint
  //     private tryAlternativeFormNameEndpoint(): void {
  //       console.log('Trying alternative endpoint: api/v1/LabelGrid/formNamepopup');
  //       this.httpService
  //         .fetch<string[]>('api/v1/LabelGrid/formNamepopup')
  //         .pipe(takeUntilDestroyed(this.destroyRef))
  //         .subscribe({
  //           next: (response) => {
  //             console.log('Alternative endpoint response:', response);
  //             if (response?.isValid && response?.httpCode === 200) {
  //               // Process the response the same way
  //               let formNamesList: string[] = [];
  //               const responseData = response.data;
                
  //               if (Array.isArray(responseData)) {
  //                 if (responseData.length > 0 && typeof responseData[0] === 'string') {
  //                   formNamesList = responseData
  //                     .filter((name): name is string => !!name && typeof name === 'string')
  //                     .map(name => name.trim())
  //                     .filter(name => name.length > 0);
  //                 } else if (responseData.length > 0 && typeof responseData[0] === 'object') {
  //                   formNamesList = responseData
  //                     .map((item: any) => item?.formName || item?.FormName || item?.name || item?.Name || item?.value || item?.text || item)
  //                     .filter((name): name is string => !!name && typeof name === 'string')
  //                     .map((name: string) => name.trim())
  //                     .filter(name => name.length > 0);
  //                 }
  //               }
                
  //               formNamesList = [...new Set(formNamesList)];
  //               this.formNames.set(formNamesList);
  //               console.log('✅ Form names loaded from alternative endpoint:', this.formNames().length);
  //             }
  //           },
  //           error: (err) => {
  //             console.error('❌ Alternative endpoint also failed:', err);
  //           }
  //         });
  //     }
    
  //   override FormInitialize() {
        
  
  //       this.formlabelsettingsForm = new FormGroup({
  //           formName: new FormControl(''),
  //           labelName: new FormControl(''),
  //           originalCaption: new FormControl(''),
  //           newCaption: new FormControl(''),
  //           pageId: new FormControl(''),
  //           visible: new FormControl(''),
  //           enable: new FormControl(''),
  //           arabicCaption: new FormControl(''),
  //           id: new FormControl(null)
  //         });   
  //     console.log('form init started');
  //   }
  
  //   override SaveFormData() {
  //     console.log('data scving');
  //     console.log(this.formlabelsettingsForm.controls);
  //   }
  //   clickHandler(args: any): void {
  //       console.log('Toolbar click:', args.item.id);
        
  //       if (args.item.id === 'Grid_add') { // 'Grid_add' -> Grid component id + _ + toolbar item name
  //           args.cancel = true;
  //           const newRecord = {
  //               formName: '',
  //               labelName: '',
  //               originalCaption: '',
  //               newCaption: '',
  //               pageId: null,
  //               visible: true,
  //               enable: true,
  //               arabicCaption: '',
  //             };
  //             this.grid.addRecord(newRecord);
  //       } else if (args.item.id ==='Grid_edit') {
  //         console.log('Edit button clicked');
  //         console.log('ID:', args.data.id);
    
  //           // Handle edit button
  //           console.log('Edit button clicked');
  //       } else if (args.item.id === 'Grid_delete') {
          
  //           // Handle delete button
  //           console.log('Delete button clicked');
  //       } else if (args.item.id === 'Grid_update') {
    
  //           // Handle update button
  //           console.log('Update button clicked');
  //           console.log(this.gridLabels());
  //       } else if (args.item.id === 'Grid_cancel') {
  //           // Handle cancel button
  //           console.log('Cancel button clicked');
  //       }
  //     }
  //     onActionBegin(args: any): void {
  //       console.log('Action begin:', args);
        
  //       // Handle add operation
  //       if (args.requestType === 'add') 
  //         {
  //         // Set default values for new row
  //         args.data = {
  //           id: 0,
  //           formName: '',
  //           labelName: '',
  //           originalCaption: '',
  //           newCaption: '',
  //           pageId: null,
  //           visible: true,
  //           enable: true,
  //           arabicCaption: ''
  //         };
  //       }
  //     }
  //     actionBegin(args: any): void {
  //       console.log('Action begin:', args);
        
  //       if (args.requestType === 'beginEdit' || args.requestType === 'add') {
  //         // Initialize form with row data
  //         if (args.rowData) {
  //           this.editForm.patchValue(args.rowData);
  //           console.log('Form populated with row data:', args.rowData);
  //         } else {
  //           this.editForm.reset();
  //         }
  //       }
        
  //       // Handle save operation
  //       if (args.requestType === 'save') {
  //         console.log('we have entered in to the save function');
  //         console.log('Save action begin - form data:', this.editForm.value);
  //         console.log('Save action begin - args data (before merge):', args.data);
          
  //         // Merge form data with the save data, but preserve existing data
  //         const formData = this.editForm.value;
  //         // Start with args.data and merge form values
  //         const mergedData = { ...args.data };
          
  //         // Update all form fields that have values
  //         Object.keys(formData).forEach(key => {
  //           const formValue = formData[key];
  //           // Include the value if it's not undefined and not null
  //           if (formValue !== undefined && formValue !== null) {
  //             mergedData[key] = formValue;
  //           }
  //         });
          
  //         // Explicitly ensure formName is included if it exists in the form
  //         // This is critical because formName might be set via combobox change event
  //         if (formData.formName !== undefined && formData.formName !== null && formData.formName !== '') {
  //           mergedData.formName = formData.formName;
  //           console.log('✅ Explicitly setting formName from form:', formData.formName);
  //         }
          
  //         args.data = mergedData;
  //         console.log('Merged data for save (after merge):', args.data);
  //         console.log('FormName in merged data:', args.data.formName);
  //       }
  //     }
    
  //     onActionComplete(args: any): void {
  //       console.log('Action complete:', args);
        
  //       if (args.requestType === 'save') {
  //         // Update the grid data source with the saved data
  //         const currentData = this.gridLabels();
  //         const updatedData = currentData.map(item => {
  //           if (item.id === args.data.id) {
  //             return { ...item, ...args.data };
  //           }
  //           return item;
  //         });
  //         this.gridLabels.set(updatedData);
  //         console.log('Grid data updated with saved row:', args.data);
          
  //       //  this.saveGridLabels();
  //       } else if (args.requestType === 'delete') {
  //         //this.saveGridLabels();
  //       }
  //       else if (args.requestType === 'update') {
  //         console.log('Update button clicked');
  //         //this.saveGridLabels();
  //       }
  //     }
      // onCellClick(args: any): void {
      //   console.log('Cell clicked:', args);
      //   console.log('Column field:', args.column.field);
      // }
      // onFormNameChange(event: any, data: any): void {
      //   console.log('Form name changed event:', event);
      //   console.log('Row data from template:', data);
        
      //   // Extract the selected value from Syncfusion combobox event
      //   let selectedValue = '';
        
      //   if (event) {
      //     // Priority 1: Check event.itemData (for select event) - when dataSource is string array, itemData is the string
      //     if (event.itemData !== undefined && event.itemData !== null) {
      //       if (typeof event.itemData === 'string') {
      //         selectedValue = event.itemData;
      //       } else if (typeof event.itemData === 'object') {
      //         // If itemData is an object, extract the value
      //         selectedValue = event.itemData.value || event.itemData.formName || event.itemData.text || event.itemData.name || '';
      //       }
      //     }
          
      //     // Priority 2: Check event.value (for change event or as fallback)
      //     if (!selectedValue && event.value !== undefined && event.value !== null) {
      //       selectedValue = typeof event.value === 'string' ? event.value : String(event.value);
      //     }
      //   }
        
      //   console.log('Extracted selected value:', selectedValue);
        
      //   if (!selectedValue) {
      //     console.warn('⚠️ Could not extract value from event:', event);
      //     return;
      //   }
        
      //   // Update the form control
      //   if (this.editForm) {
      //     this.editForm.patchValue({ formName: selectedValue });
      //     console.log('✅ Updated editForm.formName to:', selectedValue);
      //   }
        
      //   // Update the data object if it exists (for immediate visual feedback)
      //   if (data) {
      //     data.formName = selectedValue;
      //     console.log('✅ Updated data.formName to:', selectedValue);
      //   }
        
      //   // Update the grid's data source using the grid API
      //   if (this.grid) {
      //     try {
      //       // Get the currently editing row index
      //       const editingRowIndex = this.grid.element.querySelector('.e-editedrow')?.getAttribute('aria-rowindex');
      //       const selectedRowIndexes = this.grid.getSelectedRowIndexes();
      //       let rowIndex = -1;
            
      //       // Try to get the editing row index
      //       if (editingRowIndex) {
      //         rowIndex = parseInt(editingRowIndex) - 1;
      //       } else if (selectedRowIndexes && selectedRowIndexes.length > 0) {
      //         rowIndex = selectedRowIndexes[0];
      //       }
            
      //       // If we have a valid row index, update the row data
      //       if (rowIndex >= 0) {
      //         const currentViewRecords = this.grid.getCurrentViewRecords();
      //         if (currentViewRecords && currentViewRecords[rowIndex]) {
      //           const rowData = currentViewRecords[rowIndex] as any;
      //           rowData.formName = selectedValue;
                
      //           // Update the grid data source
      //           const gridData = this.gridLabels();
      //           const dataSourceIndex = gridData.findIndex((item: any) => {
      //             // Match by id if available, otherwise by index
      //             if (rowData.id && item.id) {
      //               return item.id === rowData.id;
      //             }
      //             // For new rows, match by reference
      //             return item === rowData;
      //           });
                
      //           if (dataSourceIndex !== -1) {
      //             gridData[dataSourceIndex] = { ...gridData[dataSourceIndex], formName: selectedValue };
      //             this.gridLabels.set([...gridData]);
      //             console.log('✅ Grid data source updated at index:', dataSourceIndex);
      //           } else {
      //             // For completely new rows, the data might not be in the array yet
      //             // The grid will handle it when saving
      //             console.log('Row not in data source yet (new row), will be saved on update');
      //           }
      //         }
      //       } else {
      //         console.warn('⚠️ Could not determine row index for update');
      //       }
      //     } catch (err) {
      //       console.error('Error updating grid data:', err);
      //     }
      //   }
        
      //   console.log('✅ Form name updated successfully:', selectedValue);
      // }
      // onRowSelected(args: any): void {
      //   if (args.data) {
      //     this.selectedLabel.set(args.data);
      //     console.log('Selected label:', args.data);
          
      //     // Update form with selected row data
      //     this.editForm.patchValue(args.data);
      //     console.log('Form updated with selected row data:', this.editForm.value);
      //   }
      // }
    
    // override async LeftGridInit() {
    //   this.pageheading = 'Designation';
    //   try {
    //     const res = await firstValueFrom(
    //       this.httpService
    //         .fetch<any[]>(EndpointConstant.FILLALLDESIGNATIONS)
    //         .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            
    //     );
  
    //     // handle data here after await completes
    //     this.leftGrid.leftGridData = res.data;
    //     console.log('Fetched data:', this.leftGrid.leftGridData);
  
    //     this.leftGrid.leftGridColumns = [
    //       {
    //         headerText: 'Cost Category List',
    //         columns: [
    //           {
    //             field: 'Name',
    //             datacol: 'turbineName',
    //             headerText: 'Name',
    //             textAlign: 'Left',
    //           },
              
    //         ],
    //       },
    //     ];
    //   } catch (err) {
    //     console.error('Error fetching companies:', err);
    //   }
    // }
  
    // override getDataById(data: PDesignationModel) {
    //   console.log('data', data);
    //   console.log('DesignationComponent: Loading designation by ID:', data.id);
    //   this.httpService.fetch<PDesignationByIdModel>(EndpointConstant.FILLALLDESIGNATIONSBYID + data.id)
    //     .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    //     .subscribe({
    //       next: (res) => {
    //         console.log('Designation loaded:', res);
    //         const designation = Array.isArray(res.data) && res.data.length ? res.data[0] : res.data;
    //         console.log('designation', designation);
    //         console.log('designation.Name', designation.name);
    //         this.designationForm.patchValue({
    //           designationName: designation.name,
    //         });
    //         console.log('Form patched with:', designation.name);
    //         console.log('Form value after patch:', this.designationForm.value);
    //       },
    //     });
    // }
    
  
    // override DeleteData(data: PDesignationModel) {
    //   console.log('deleted');
    // }
  
 

  

