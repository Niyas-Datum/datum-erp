import { Component, inject, OnInit, signal } from "@angular/core";
import { GeneralAppService } from "../../http/general-app.service";
import { BaseComponent } from "@org/architecture";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseService, CustomValidationService, ValidationService, validCompanyName, validEmail, validPhoneNumber } from "@org/services";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import { Branch, Branches, BranchSaveDto, BranchType, ContactPerson, Country, PBranchByIdModel } from "../model/pbranch.model";

@Component({
  //eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-settings-Main',
  //eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  templateUrl: './branch.component.html',
  styles: [],
})
export class BranchComponent extends BaseComponent implements OnInit  {

  currentBranch = {} as Branch;
  // TOOLBAR STATE PROPERTIES
  isNewMode = signal(false);
  isEditMode = signal(false);
  isNewBtnDisabled = signal(false);
  isEditBtnDisabled = signal(false);
  isDeleteBtnDisabled = signal(false);
  isSaveBtnDisabled = signal(false);
  isPrintBtnDisabled = signal(false);

  // STATE PROPERTIES
  isLoading = false;
  isInputDisabled = true;
  isActive: unknown = true;
  showImageContainer = true;
  selectedFile: File | null = null;
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  selectedBranchId!: number;

  private httpService = inject(GeneralAppService);
  customValidationService = inject(CustomValidationService);
  private baseService = inject(BaseService);
  branchForm = this.formUtil.thisForm;

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.branchForm.disable();
    console.log(this.currentPageInfo?.menuText);
    this.fetchContactPerson();
    this.fetchCountries();
  }

  fetchContactPerson(): void {
    this.httpService.fetch<ContactPerson[]>(EndpointConstant.CONTACTPERSON)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.isValid && res.httpCode !== 200) {
            console.error('Error fetching contact persons:', res);
          } else {
            const flatContactperson = Array.isArray(res.data) && Array.isArray(res.data[0])
              ? res.data[0]
              : res.data;

            this.contactPersonList.set(flatContactperson);
            console.log('ContactpersonList loaded:', this.contactPersonList().length, 'items');
          }
        },
        error: (err) => console.error('Error fetching contact persons', err),
      });
  }

  // SIGNALS FOR REACTIVE DATA
  branches = signal<Branches[]>([]);
  countries = signal<Country[]>([]);
  imageData: string | ArrayBuffer | null = null;

  selectedCountry = signal<Country | null>(null);
  branchTypes = signal<BranchType[]>([]);
  // STATIC DATA
  branchType: BranchType[] = [
    { value: "HO", name: "Head Office" },
    { value: "BO", name: "Branch Office" }
  ];
  contactPersonList = signal<ContactPerson[]>([]);
  selectedContactPerson = signal<ContactPerson | null>(null);

  fetchCountries(): void {
    console.log('Fetching countries...');
    this.httpService.fetch<Country[]>(EndpointConstant.FILLCOUNTRY)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.isValid && res.httpCode !== 200) {
            console.log(JSON.stringify(res.data, null, 2));
          } else {
            const flatCountries = Array.isArray(res.data) && Array.isArray(res.data[0])
              ? res.data[0]
              : res.data;
            this.countries.set(flatCountries);
            console.log('Countries loaded:', this.countries().length);
          }
        },
        error: (err) => console.error('Error fetching countries', err),
      });
  }

  override FormInitialize() {
    this.branchForm = new FormGroup({
      companyname: new FormControl({ value: '', disabled: false }, [validCompanyName]),
      arabicname: new FormControl({ value: '', disabled: false }),
      branchtype: new FormControl({ value: '', disabled: false }, [Validators.required]),
      isactive: new FormControl({ value: true, disabled: false }),
      telephone: new FormControl({ value: '', disabled: false }),
      mobile: new FormControl({ value: '', disabled: false }, [validPhoneNumber]),
      faxno: new FormControl({ value: '', disabled: false }),
      country: new FormControl({ value: '', disabled: false }, [validCompanyName]),
      addresslineone: new FormControl({ value: '', disabled: false }, [Validators.required]),
      addresslinetwo: new FormControl({ value: '', disabled: false }),
      city: new FormControl({ value: '', disabled: false }),
      emailaddress: new FormControl({ value: '', disabled: false }, [validEmail]),
      pobox: new FormControl({ value: '', disabled: false }),
      district: new FormControl({ value: '', disabled: false }),
      buildingno: new FormControl({ value: '', disabled: false }),
      countrycode: new FormControl({ value: '', disabled: false }),
      province: new FormControl({ value: '', disabled: false }),
      vatno: new FormControl({ value: '', disabled: false }),
      centralsalestaxno: new FormControl({ value: '', disabled: false }),
      contactperson: new FormControl({ value: '', disabled: false }, [Validators.required]),
      remarks: new FormControl({ value: '', disabled: false }),
      dl1: new FormControl({ value: '', disabled: false }),
      dl2: new FormControl({ value: '', disabled: false }),
      uniqueid: new FormControl({ value: '', disabled: false }),
      reference: new FormControl({ value: '', disabled: false }),
      bankcode: new FormControl({ value: '', disabled: false }),
      hocompanyname: new FormControl({ value: '', disabled: false }, [Validators.required]),
      hoarabicname: new FormControl({ value: '', disabled: false }),

      // Existing fields retained (if still needed)
      branchName: new FormControl({ value: '', disabled: false }, Validators.required),
      description: new FormControl({ value: '', disabled: false }, Validators.required),
      systemSetting: new FormControl({ value: false, disabled: false })
    });
    console.log('form init started');
  }

  override SaveFormData() {
    console.log(this.branchForm.controls);
    this.onSaveClick();
  }

  onActiveChange(): void {
    console.log('Active status changed:', this.isActive);
  }

  override async LeftGridInit() {
    this.pageheading = 'Branch';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLBRANCH)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      this.leftGrid.leftGridData = res.data;
      console.log("leftgrid data loaded", res.data);
      this.leftGrid.leftGridColumns = [
        {
          headerText: 'Branch List',
          columns: [
            { field: 'Nature', datacol: 'Nature', headerText: 'Nature', textAlign: 'Left' },
            { field: 'Company', datacol: 'Company', headerText: 'Company', textAlign: 'Left' },
          ],
        },
      ];
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }

  /**
   * CONTACT PERSON selection handling (robust)
   * - event?: if called from (change) event, pass $event
   * - otherwise it reads the FormControl value
   * This supports both numeric id values and string names.
   */
onContactPersonSelect(event?: any): void {
  let selectedPerson: ContactPerson | null = null;

  if (event && event.itemData) {
    // value from dropdown click
    selectedPerson = event.itemData as ContactPerson;
  } else {
    // load from form during fetchById() patchValue
    const controlValue = Number(this.branchForm.get('contactperson')?.value);
    selectedPerson = this.contactPersonList().find(cp => cp.id === controlValue) ?? null;
  }

  this.selectedContactPerson.set(selectedPerson);
  console.log('Selected contact person:', selectedPerson);
}



  override onEditClick() {
    if (this.isEditMode()) {
      const confirmed = confirm('Do you want to cancel the edit mode?');
      if (!confirmed) {
        console.log('Cancel edit cancelled by user');
        return;
      }

      if (this.leftgridSelectedData) {
        this.getDataById(this.leftgridSelectedData);
      }

      this.isEditMode.set(false);
      this.isInputDisabled = true;
      this.branchForm.disable();

      this.isNewBtnDisabled.set(false);
      this.isEditBtnDisabled.set(false);
      this.isDeleteBtnDisabled.set(false);
      this.isSaveBtnDisabled.set(true);
      this.isPrintBtnDisabled.set(false);
      return;
    }

    const confirmed = confirm('Do you want to edit?');
    if (!confirmed) {
      console.log('Edit cancelled by user');
      return;
    }

    console.log('edit operation started');
    this.branchForm.enable();
    this.isInputDisabled = false;

    this.isEditMode.set(true);
    this.isNewMode.set(false);
    this.isNewBtnDisabled.set(true);
    this.isEditBtnDisabled.set(false);
    this.isDeleteBtnDisabled.set(true);
    this.isSaveBtnDisabled.set(false);
    this.isPrintBtnDisabled.set(true);
  }

  onBranchTypeSelect(): void {
    console.log('Branch Type selected');
  }


  onCountrySelect(event?: any): void {
    const controlVal = event?.value ?? this.branchForm.get('country')?.value;

    if (!controlVal && controlVal !== 0) {
      this.selectedCountry.set(null);
      console.log('Country cleared');
      return;
    }

    // controlVal is expected to be the country.value (string)
    const selectedCountryObj = this.countries().find(c => {
      // guard: if backend sometimes sends numeric id as country, handle that
      if (c.value === controlVal) return true;
      if (c.id != null && Number(controlVal) === c.id) return true;
      return false;
    }) || null;

    this.selectedCountry.set(selectedCountryObj);
    console.log('Selected country:', selectedCountryObj);
  }

  override getDataById(data: PBranchByIdModel) {
    this.selectedBranchId = data.id;
    this.fetchBranchById();
  }

  fetchBranchById() {
    this.httpService
      .fetch(EndpointConstant.FILLALLBRANCHBYID + this.selectedBranchId)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          this.currentBranch = response?.data as any;

          // Map country: your dropdown stores country.value (string).
          // Find the country record (if countries are already loaded).
          const countryObj = this.countries().find(c => {
            // sometimes currentBranch.country may already be name or id
            if (c.value === this.currentBranch.country) return true;
            if (c.id != null && Number(this.currentBranch.country) === c.id) return true;
            return false;
          });

          // patch form using the country.value (string) if found, else fallback to whatever backend returned
          this.branchForm.patchValue({
            hocompanyname: this.currentBranch.hoCompanyName,
            hoarabicname: this.currentBranch.hoCompanyNameArabic,
            branchtype: this.currentBranch.nature,
            companyname: this.currentBranch.company,
            isactive: this.currentBranch.activeFlag,
            arabicname: this.currentBranch.arabicName,
            telephone: this.currentBranch.telephoneNo,
            mobile: this.currentBranch.mobileNo,
            faxno: this.currentBranch.faxNo,
            country: countryObj?.value ?? this.currentBranch.country,
            addresslineone: this.currentBranch.addressLineOne,
            addresslinetwo: this.currentBranch.addressLineTwo,
            city: this.currentBranch.city,
            emailaddress: this.currentBranch.emailAddress,
            pobox: this.currentBranch.poBox,
            district: this.currentBranch.district,
            buildingno: this.currentBranch.bulidingNo,
            countrycode: this.currentBranch.countryCode,
            province: this.currentBranch.province,
            vatno: this.currentBranch.salesTaxNo,
            centralsalestaxno: this.currentBranch.centralSalesTaxNo,
            contactperson: this.currentBranch.contactPersonID,
            remarks: this.currentBranch.remarks,
            dl1: this.currentBranch.dL1,
            dl2: this.currentBranch.dL2,
            uniqueid: this.currentBranch.uniqueID,
            reference: this.currentBranch.reference,
            bankcode: this.currentBranch.bankCode
          });

          // Defer selection calls so UI binding finishes
          setTimeout(() => {
            // For contact person, branch type and country we call selection handlers to update signals
            this.onContactPersonSelect(); // reads form control
            this.onBranchTypeSelect();    // optional, you might not need to set signal
            this.onCountrySelect();       // reads form control (country.value string)
          }, 0);

        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  fillBranchForm(branchData: Branch): void {
    console.log('BranchComponent: Filling form with branch data:', branchData);
    this.currentBranch = branchData;

    this.branchForm.patchValue({
      companyname: branchData.company || '',
      arabicname: branchData.arabicName || '',
      branchtype: branchData.nature || '',
      isactive: branchData.activeFlag === 1,
      telephone: branchData.telephoneNo || '',
      mobile: branchData.mobileNo || '',
      faxno: branchData.faxNo || '',
      country: branchData.country || '',
      addresslineone: branchData.addressLineOne || '',
      addresslinetwo: branchData.addressLineTwo || '',
      city: branchData.city || '',
      emailaddress: branchData.emailAddress || '',
      pobox: branchData.poBox || '',
      district: branchData.district || '',
      buildingno: branchData.bulidingNo || '',
      countrycode: branchData.countryCode || '',
      province: branchData.province || '',
      vatno: branchData.salesTaxNo?.toString() || '',
      centralsalestaxno: branchData.centralSalesTaxNo || '',
      contactperson: branchData.contactPersonID || '',
      remarks: branchData.remarks || '',
      dl1: branchData.dL1 || '',
      dl2: branchData.dL2 || '',
      uniqueid: branchData.uniqueID || '',
      reference: branchData.reference || '',
      bankcode: branchData.bankCode || ''
    });

    this.isActive = branchData.activeFlag === 1;

    this.updateSelectedObjects(branchData);
    console.log('BranchComponent: Form filled successfully');
  }

  updateSelectedObjects(branchData: Branch): void {
    if (branchData.contactPersonID) {
      const contactPerson = this.contactPersonList().find(cp => cp.id === branchData.contactPersonID);
      this.selectedContactPerson.set(contactPerson || null);
    }

    if (branchData.country) {
      // branchData.country may be id or value; find by either
      const country = this.countries().find(c => c.value === branchData.country || c.id === Number(branchData.country));
      this.selectedCountry.set(country || null);
    }

    if (branchData.nature) {
      const branchType = this.branchType.find(bt => bt.value === branchData.nature);
      if (branchType) {
        console.log('Selected branch type:', branchType);
      }
    }
  }

  override DeleteData(data: PBranchByIdModel) {
    const confirmed = confirm('Are you sure you want to delete this branch?');
    if (!confirmed) {
      console.log('Deletion cancelled by user');
      return;
    }
    this.httpService.delete(EndpointConstant.DELETEBRANCH + data.id)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          console.log('Branch deleted:', res);
          alert('Branch deleted successfully');
          this.LeftGridInit();
        },
      });
    console.log('deleted');
  }

  override newbuttonClicked(): void {
    console.log('new operation started');
    this.branchForm.reset();
    this.branchForm.enable();
    this.selectedContactPerson.set(null);
    this.selectedCountry.set(null);
    this.isActive = true;
    this.isEditMode.set(false);
    this.isNewMode.set(true);
    this.isNewBtnDisabled.set(false);
    this.isEditBtnDisabled.set(true);
  }

  onImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (!this.allowedFormats.includes(file.type)) {
      this.baseService.showCustomDialogue("Invalid file format. Allowed formats: JPG, PNG, WebP");
      event.target.value = "";
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.baseService.showCustomDialogue("Max file size is 5 MB");
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.imageData = reader.result; };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedFile = null;
    this.imageData = null;
  }

  onSaveClick(): void {
    if (this.isEditMode()) {
      this.updateBranch();
    } else {
      this.saveNewBranch();
    }
  }

  updateBranch(): void {
    if (!this.currentBranch?.id) {
      this.baseService.showCustomDialogue('No branch selected to update');
      return;
    }

    const selectedContactPerson = this.selectedContactPerson();
    const selectedCountry = this.selectedCountry();
    const selectedBranchType = this.branchType.find(
      bt => bt.value === this.branchForm.get('branchtype')?.value
    );

    if (!selectedContactPerson) {
      this.baseService.showCustomDialogue('Please select contact person.');
      return;
    }
    if (!selectedCountry) {
      this.baseService.showCustomDialogue('Please select country.');
      return;
    }
    if (!selectedBranchType) {
      this.baseService.showCustomDialogue('Please select branch type.');
      return;
    }

    const payload = {
      hocompanyName: this.branchForm.value.hocompanyname,
      hocompanyNameArabic: this.branchForm.value.hoarabicname,
      branchType: { key: selectedBranchType.value, value: selectedBranchType.name },
      active: this.isActive ? 1 : 0,
      companyName: this.branchForm.value.companyname,
      arabicName: this.branchForm.value.arabicname,
      telephone: this.branchForm.value.telephone,
      mobile: this.branchForm.value.mobile,
      faxNo: this.branchForm.value.faxno,
      country: { id: selectedCountry.id, value: selectedCountry.value },
      addressLineOne: this.branchForm.value.addresslineone,
      addressLineTwo: this.branchForm.value.addresslinetwo,
      city: this.branchForm.value.city,
      emailAddress: this.branchForm.value.emailaddress,
      pObox: this.branchForm.value.pobox,
      district: this.branchForm.value.district,
      buildingNo: this.branchForm.value.buildingno,
      countryCode: this.branchForm.value.countrycode,
      province: this.branchForm.value.province,
      vatNo: this.branchForm.value.vatno,
      centralSalesTaxNo: this.branchForm.value.centralsalestaxno,
      contactPerson: { id: selectedContactPerson.id, name: selectedContactPerson.name },
      remarks: this.branchForm.value.remarks,
      dl1: this.branchForm.value.dl1,
      dl2: this.branchForm.value.dl2,
      uniqueId: this.branchForm.value.uniqueid,
      reference: this.branchForm.value.reference,
      bankCode: this.branchForm.value.bankcode
    };

    console.log("update payload:", payload);

    this.httpService
      .patch(EndpointConstant.UPDATEBRANCH + this.currentBranch.id, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (res) => {
          this.baseService.showCustomDialogue('Branch updated successfully');
          this.branchForm.disable();
          // Refresh the left grid and update the data sharing service
                await this.LeftGridInit();
                this.serviceBase.dataSharingService.setData({
                  columns: this.leftGrid.leftGridColumns,
                  data: this.leftGrid.leftGridData,
                  pageheading: this.pageheading,
                });
        },
        error: (err) => {
          this.baseService.showCustomDialogue('Update failed');
          console.error(err);
        }
      });
  }

  saveNewBranch(): void {
    const selectedContactPerson = this.selectedContactPerson();
    const selectedCountry = this.selectedCountry();
    const selectedBranchType = this.branchType.find(bt => bt.value === this.branchForm.get('branchtype')?.value);

    if (!selectedContactPerson) {
      alert('Please select a valid contact person.');
      return;
    }
    if (!selectedCountry) {
      alert('Please select a valid country.');
      return;
    }
    if (!selectedBranchType) {
      alert('Please select a valid branch type.');
      return;
    }

    const payload = {
      hocompanyName: this.branchForm.value.hocompanyname,
      hocompanyNameArabic: this.branchForm.value.hoarabicname,
      branchType: { key: selectedBranchType.value, value: selectedBranchType.name },
      active: this.branchForm.value.isactive ? 1 : 0,
      companyName: this.branchForm.value.companyname,
      arabicName: this.branchForm.value.arabicname,
      telephone: this.branchForm.value.telephone,
      mobile: this.branchForm.value.mobile,
      faxNo: this.branchForm.value.faxno,
      country: { id: selectedCountry.id, value: selectedCountry.value },
      addressLineOne: this.branchForm.value.addresslineone,
      addressLineTwo: this.branchForm.value.addresslinetwo,
      city: this.branchForm.value.city,
      emailAddress: this.branchForm.value.emailaddress,
      pObox: this.branchForm.value.pobox,
      district: this.branchForm.value.district,
      buildingNo: this.branchForm.value.buildingno,
      countryCode: this.branchForm.value.countrycode,
      province: this.branchForm.value.province,
      vatNo: this.branchForm.value.vatno,
      centralSalesTaxNo: this.branchForm.value.centralsalestaxno,
      contactPerson: { id: selectedContactPerson.id, name: selectedContactPerson.name },
      remarks: this.branchForm.value.remarks,
      dl1: this.branchForm.value.dl1,
      dl2: this.branchForm.value.dl2,
      uniqueId: this.branchForm.value.uniqueid,
      reference: this.branchForm.value.reference,
      bankCode: this.branchForm.value.bankcode,
    };

    console.log('Attempting to save branch data:', payload);
    this.httpService.post<BranchSaveDto>(EndpointConstant.SAVEBRANCH, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (res) => {
          if (!res.isValid && res.httpCode !== 200) {
            alert('Error saving branch:' + res);
            console.error('Error saving branch:', res);
          } else {
            console.log('Branch saved successfully:', res);
            alert('Branch saved successfully:' + res);
            this.branchForm.disable();
            // Refresh the left grid and update the data sharing service
                await this.LeftGridInit();
                this.serviceBase.dataSharingService.setData({
                  columns: this.leftGrid.leftGridColumns,
                  data: this.leftGrid.leftGridData,
                  pageheading: this.pageheading,
                });
          }
        },
        error: (err) => console.error('Error saving branch', err),
      });
  }
}
