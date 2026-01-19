import { Component, computed, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { GeneralAppService } from "../../http/general-app.service";
import { BaseComponent } from "@org/architecture";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import { PSettingsFormDataByIdModel } from "../model/psettings.model";
type Mode = 'view' | 'new' | 'edit';

@Component({
  //eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-settings-Main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './settings-component.html',
  styles: [],
})
export class SettingsComponentMain extends BaseComponent implements OnInit  {
  showMobileList = signal(false);
  allSettings = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  passwordValue = signal<string>('');
  isDeleteMode = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  deletePassword = signal<string>('');
  storedPassword = signal<string>('');
  isPasswordEntered = signal<boolean>(false);
  showPasswordModal = signal<boolean>(false);
  
   // single source of truth for UI state
  mode = signal<Mode>('view');
  currentSetting = signal<any | null>(null);
  isDelete = false;
  firstSetting!:number;
  selectedSettingsId!: number;
   displayPasswordField = false;
  
  isTrueValue = computed(() => {
    const currentValue = this.formValueSignal();
    if (typeof currentValue === 'boolean') return currentValue === true;
    if (typeof currentValue === 'string') {
      return currentValue.toLowerCase() === 'true';
    }
    return false;
  });
  
  
  confirmDelete(): void {
    if (!confirm('Are you sure you want to delete this setting? This action cannot be undone.')) {
      this.cancelDelete();
      return;
    }
    this.httpService
      .delete(EndpointConstant.DELETESETTING + this.currentSetting()?.id + '&password=' + this.storedPassword())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res?.isValid && res?.httpCode !== 200) {
            console.error('Error deleting setting:', res);
            alert('Error deleting setting');
            return;
          }
          alert('Setting deleted successfully');
          this.LeftGridInit();
          this.applyMode('view');
          this.cancelDelete();
        },
        error: (err) => {
          console.error('Error deleting setting', err);
          alert('Error deleting setting');
        },
      });
  }
  cancelDelete(): void {
    this.isDeleteMode.set(false);
  }

  private formValueSignal = signal<string | boolean>('');
  isFalseValue = computed(() => {
    const currentValue = this.formValueSignal();
    if (typeof currentValue === 'boolean') return currentValue === false;
    if (typeof currentValue === 'string') {
      return currentValue.toLowerCase() === 'false';
    }
    return false;
  });
 
  onRadioChange(event: any, value: string) {
    this.settingsForm.patchValue({ value: value });
    this.formValueSignal.set(value);
  }

  // Store password when entered and automatically save
  onPasswordEntered(): void {
    if (this.passwordValue().trim()) {
      this.storedPassword.set(this.passwordValue());
      this.isPasswordEntered.set(true);
      this.showPasswordModal.set(false);
      
      // Automatically save after password is entered
      this.SaveFormData();
    }
  }

  // Show password modal when needed
  showPasswordModalIfNeeded(): void {
    if (!this.isPasswordEntered()) {
      this.showPasswordModal.set(true);
      this.passwordValue.set('');
    }
  }

  // Cancel password entry
  cancelPassword(): void {
    this.showPasswordModal.set(false);
    this.passwordValue.set('');
  }
  
  isRadioDisabled = computed(() => {
    // Disable radio buttons in 'view' mode, enable in 'edit' or 'new' mode
    const isDisabled = this.mode() === 'view';
   
    return isDisabled;
  });
  isRadioDisbled = computed(() => { const isEnabled = this.mode() === 'edit';

  return isEnabled;
});
  
  
  isBooleanValue = computed(() => {
    const currentValue = this.currentSetting()?.value;
    if (typeof currentValue === 'boolean') return true;
    if (typeof currentValue === 'string') {

      const lowerValue = currentValue.toLowerCase();
      return lowerValue === 'true' || lowerValue === 'false';
    }
    return false;
  });

    private httpService = inject(GeneralAppService);
    settingsForm = this.formUtil.thisForm;
    constructor() {
      super();
      this.commonInit();
    }
  
    ngOnInit(): void {
      console.log("from settings")
      this.onInitBase();
      this.SetPageType(1);
      this.newbuttonClicked();
      this.settingsForm.disable();
    }
    override FormInitialize() {
      this.settingsForm = new FormGroup({
        key: new FormControl(
          { key: '', disabled: false },
          Validators.required
        ),
        value: new FormControl(
          { value: '', disabled: false },
          Validators.required
        ),
        description: new FormControl(
            { description: '', disabled: false }
          ),
        systemSetting: new FormControl(
            { systemSetting: false, disabled: false },
          ),
     
      });
     
    }
  
    override SaveFormData() {

  if (this.settingsForm.invalid) {
    this.settingsForm.markAllAsTouched();
    alert('Invalid form');
    return;
  }

  // Check if password is needed
  if (!this.isPasswordEntered()) {
    this.showPasswordModalIfNeeded();
    return;
  }

  const payload = this.buildPayload();

  if (this.mode() === 'edit') {
   this.updateCallback(payload);
  } else if (this.mode() === 'new') {
    this.savesettings(payload);
  }
   }
   private buildPayload() {
    const v = this.settingsForm.value;
    return {
   
      key: (v.key?? '').toString().trim(),
    value: (v.value?? '').toString().trim(),
    description: (v.description ?? '').toString().trim(),
    systemSetting:!!v.systemSetting
    };
  }
  savesettings(payLoad:any):void{
    const password = this.storedPassword();
    this.httpService.post<PSettingsFormDataByIdModel>(EndpointConstant.SAVESETTING+password, payLoad)
    .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:async (res)=>{   
        if (res?.httpCode === 200 && res?.isValid) {
          await this.LeftGridInit();
          this.toast.success('Settings saved successfully');

          // Reset form after successful save (keep stored password)
          this.settingsForm.reset();
          this.applyMode('view'); // Use applyMode to ensure form is disabled
          this.LeftGridInit(); 
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
        
          // Refresh the list
        } else {
          console.error('Error saving settings:', res);
          this.toast.error('save failed:'+ (res || ''));
          return;
        }
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.toast.error('save failed:'+ (error || ''));
      }
    });
  }
  updateCallback(payLoad:any):void{
    const id = this.currentSetting()?.id;
    if (!id) return;
    this.httpService.patch<PSettingsFormDataByIdModel>(EndpointConstant.UPDATESETTING+id+'&password='+this.storedPassword(), payLoad)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next:async (res)=>{
        if (res?.httpCode === 200 && res?.isValid) {
         this.toast.success('Settings updated successfully');
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
        
          this.applyMode('view');
          this.patchFormFromCurrent();
          this.makePristine();
          // Keep stored password for future operations
        } else {
          console.error('Error updating settings:', res);
          this.toast.error('Error updating settings');
        }
      },
      error: (error) => {
        console.error('Error updating settings:', error);
        this.toast.error('Error updating settings');
      }
    })
  }
  private applyMode(next: Mode): void {
    this.mode.set(next);
    if (next === 'view') {
      this.settingsForm.disable({ emitEvent: false });
    } else {
      this.settingsForm.enable({ emitEvent: false });
    }
  }
    override async LeftGridInit() {
      this.pageheading = 'Settings';
      try {
        const res = await firstValueFrom(
          this.httpService
            .fetch<any[]>(EndpointConstant.FILLALLSETTINGS)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef)) 
        );
        // handle data here after await completes
        this.leftGrid.leftGridData = res.data;
        this.leftGrid.leftGridColumns = [
          {
            headerText: 'Settings List',
            columns: [
              {
                field: 'key',
                datacol: 'key',
                headerText: 'Key',
                textAlign: 'Left',
              },
              {
                field: 'value',
                datacol: 'value',
                headerText: 'Value',
                textAlign: 'Left',
              },
            ],
          },
        ];
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    }
  
    override getDataById(data: PSettingsFormDataByIdModel) {
      this.settingsForm.disable();

      this.currentSetting.set(data);
      this.applyMode('view'); // Set mode to 'view' to disable radio buttons
      this.patchFormFromCurrent();
      this.makePristine();
    }
    private patchFormFromCurrent(): void {
      const cur = this.currentSetting();

      this.httpService.fetch<PSettingsFormDataByIdModel>(EndpointConstant.FILLSETTINGSBYID+cur.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {

          const settings = Array.isArray(res.data) && res.data.length ? res.data[0] : res.data;
          this.settingsForm.patchValue({
            key: settings.key ?? '',
            value: settings.value ?? '',
            description: settings.description ?? '',
            systemSetting: settings.systemSetting ?? false,
          }, { emitEvent: false });
          
          // Update the signal to trigger radio button updates
          this.formValueSignal.set(settings.value ?? '');
        },
      });
      if (!cur) return;
      
    }
      //for cleaning the form 
  private makePristine() {
    this.settingsForm.markAsPristine();
    this.settingsForm.markAsUntouched();
  }
  override newbuttonClicked(): void {
    this.applyMode('new'); // Use applyMode to ensure form is enabled

    this.settingsForm.reset();
    this.settingsForm.enable();
    this.formValueSignal.set('');
    this.currentSetting.set(null);
    this.makePristine();
  }
  override  onEditClick()  {
    if (!this.currentSetting()) return;
  
    if (this.mode() === 'edit') {
      if (!( this.confirmDiscardIfDirty('Cancel edit'))) return; 
      const confirmed = confirm('Do you want to cancel the edit mode?');
      this.settingsForm.enable();
      if (!confirmed) {
        return;
      }

      // Cancel edit mode - reload original data and disable form
      this.patchFormFromCurrent();
      this.applyMode('view'); // Disable form by setting mode to 'view'
      this.makePristine();
      return; // Exit - don't continue to enter edit mode
    } else {
      // Ask for confirmation before entering edit mode
      const confirmed = confirm('Do you want to edit?');
      if (!confirmed) {
        return;
      }
      
      if (!( this.confirmDiscardIfDirty('Enter edit mode'))) return;
      this.applyMode('edit');
      // form already shows current values; keep pristine until user types
      this.makePristine();
    }
  }
  private async confirmDiscardIfDirty(reason: string): Promise<boolean> {
    if (this.mode() === 'view' || !this.settingsForm?.dirty) return true;
    return confirm(`You have unsaved changes.\n${reason}\nDiscard changes?`);
  }
  
    override DeleteData(data: PSettingsFormDataByIdModel) {
      if(!this.isDelete){
      alert('Permission Denied!');
      return false;
    }
    if(confirm("Are you sure you want to delete this details?")) {
      let password = "" ;
      
      if(this.settingsForm.value.password){
        password = this.settingsForm.value.password;
      } 
      this.httpService.delete(EndpointConstant.DELETESETTING+this.selectedSettingsId+'&password='+password)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          if(response.httpCode == 500){
            alert(response.data);
          }
          if(response.httpCode == 200){
            alert(response.data);          
            this.selectedSettingsId = this.firstSetting;
            this.LeftGridInit();
            this.displayPasswordField = false;
          }          
        },
        error: (errormsg) => {
          if(errormsg.status == 400 && errormsg.error){
            if(errormsg.error?.errors.password){
              alert('Please provide a valid password and press save button');    
              this.displayPasswordField = true;
            }
          }
        },
      });
    }
    return true;
    }
    onSaveClick(){

      if (this.settingsForm.invalid) {
        this.settingsForm.markAllAsTouched();
        return;
      }
    
      // Check if password is needed
      // if (!this.isPasswordEntered()) {
      //   this.showPasswordModalIfNeeded();
      //   return;
      // }
    
      // const payload = this.buildPayload();
    
      // if (this.mode() === 'edit') {
      //  this.updateCallback(payload);
      // } else if (this.mode() === 'new') {
      //   this.savesettings(payload);
      // }
      // Add save logic here
    }
  }
  
  

