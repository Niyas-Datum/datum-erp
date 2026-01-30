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
  selector: 'app-settings-Main',
  standalone: false,
  templateUrl: './branch.component.html',
  styleUrls: ['./branch-component.css']
})
export class BranchComponent extends BaseComponent implements OnInit {

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

  //for image selection
  imageData: string | null = null;   // for preview (base64)
  imageBase64: string | null = null; // for payload
  showImageContainer = true;
  selectedFile: File | null = null;
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  //stores the selected branch id
  selectedBranchId!: number;

  // SIGNALS FOR REACTIVE DATA
  branches = signal<Branches[]>([]);
  countries = signal<Country[]>([]);
  selectedCountry = signal<Country | null>(null);
  branchTypes = signal<BranchType[]>([]);
  contactPersonList = signal<ContactPerson[]>([]);
  selectedContactPerson = signal<ContactPerson | null>(null);

  // STATIC DATA
  branchType: BranchType[] = [
    { value: "HO", name: "Head Office" },
    { value: "BO", name: "Branch Office" }
  ];


  private httpService = inject(GeneralAppService);// Injects GeneralAppService
  customValidationService = inject(CustomValidationService);// Injects CustomValidationService
  private baseService = inject(BaseService);// Injects BaseService
  branchForm = this.formUtil.thisForm;// Assigns the form instance 

  constructor() {
    super();
    this.commonInit();
  }

  ngOnInit(): void {
    this.onInitBase();
    this.SetPageType(1);
    this.branchForm.disable();
    this.fetchContactPerson();
    this.fetchCountries();
    const companyId = Number(localStorage.getItem('companyId'));
  }

  //for getting contact person dropdown
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
          }
        },
        error: (err) => console.error('Error fetching contact persons', err),
      });
  }

  // SIGNALS FOR REACTIVE DATA

  //imageData: string | ArrayBuffer | null = null;

  //for getting country dropdown
  fetchCountries(): void {
    this.httpService.fetch<Country[]>(EndpointConstant.FILLCOUNTRY)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.isValid && res.httpCode !== 200) {
          } else {
            const flatCountries = Array.isArray(res.data) && Array.isArray(res.data[0])
              ? res.data[0]
              : res.data;
            this.countries.set(flatCountries);
          }
        },
        error: (err) => console.error('Error fetching countries', err),
      });
  }

  override FormInitialize() {
    this.branchForm = new FormGroup({

      // ===== REQUIRED FIELDS =====
      hocompanyname: new FormControl('', Validators.required),
      // companyname: new FormControl('', Validators.required),
      companyname: new FormControl('', [Validators.required, validCompanyName]),

      branchtype: new FormControl('', Validators.required),
      country: new FormControl('', Validators.required),
      addresslineone: new FormControl('', Validators.required),
      contactperson: new FormControl('', Validators.required),

      // ===== OPTIONAL FIELDS =====
      hoarabicname: new FormControl(''),
      arabicname: new FormControl(''),
      isactive: new FormControl(true),
      telephone: new FormControl(''),
      mobile: new FormControl('', validPhoneNumber),
      faxno: new FormControl(''),
      addresslinetwo: new FormControl(''),
      city: new FormControl(''),
      emailaddress: new FormControl('', validEmail),
      pobox: new FormControl(''),
      district: new FormControl(''),
      buildingno: new FormControl(''),
      countrycode: new FormControl(''),
      province: new FormControl(''),
      vatno: new FormControl(''),
      centralsalestaxno: new FormControl(''),
      // contactperson: new FormControl(''),
      remarks: new FormControl(''),
      dl1: new FormControl(''),
      dl2: new FormControl(''),
      uniqueid: new FormControl(''),
      reference: new FormControl(''),
      bankcode: new FormControl('')
    });
  }

  override SaveFormData() {
    this.onSaveClick();
  }

  //fills left grid data
  override async LeftGridInit() {
    this.pageheading = 'Branch';
    try {
      const res = await firstValueFrom(
        this.httpService
          .fetch<any[]>(EndpointConstant.FILLALLBRANCH)
          .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      );

      this.leftGrid.leftGridData = res.data;
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
      selectedPerson = event.itemData as ContactPerson;
    } else {
      const controlValue = Number(this.branchForm.get('contactperson')?.value);
      selectedPerson = this.contactPersonList().find(cp => cp.id === controlValue) ?? null;
    }

    this.selectedContactPerson.set(selectedPerson);
  }


  override onEditClick() {
    if (this.isEditMode()) {
      const confirmed = confirm('Do you want to cancel the edit mode?');
      if (!confirmed) {
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
      return;
    }
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

  onCountrySelect(event?: any): void {
    const controlVal = event?.value ?? this.branchForm.get('country')?.value;

    if (!controlVal && controlVal !== 0) {
      this.selectedCountry.set(null);
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
  }

  override getDataById(data: PBranchByIdModel) {
    this.selectedBranchId = data.id;
    this.fetchBranchById();

  }

  //fetch image 

  imageGetData: string | null = null; // bind this to <img [src]>

  fetchImage() {
    const companyId = Number(localStorage.getItem('companyId'));

    this.httpService
      .fetch(
        EndpointConstant.GETBRANCHIMG +
        companyId +
        '&branchName=' +
        this.currentBranch.company
      )
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response) {
            // ✅ API returns PURE base64 → add prefix
            this.imageData = `data:image/jpeg;base64,${response.data}`;            
          } else {
            this.imageData = null;
          }
        },
        error: () => {
          this.imageData = null;
        }
      });
  }

  //fill by id
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
          this.fetchImage();

        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }

  fillBranchForm(branchData: Branch): void {
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
    }
  }

  //for deleting the branch
  override DeleteData(data: PBranchByIdModel) {
    const confirmed = confirm('Are you sure you want to delete this branch?');
    if (!confirmed) {
      return;
    }
    this.httpService.delete(EndpointConstant.DELETEBRANCH + data.id)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          alert('Branch deleted successfully');
          this.LeftGridInit();
        },
      });
  }

  override newbuttonClicked(): void {
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

  companyId = Number(localStorage.getItem('companyId'));
  onSaveClick(): void {
    const companyId = Number(localStorage.getItem('companyId'));
    //for validation-mandatory fields
    const requiredControls = [
      'companyname',
      'branchtype',
      'country',
      'addresslineone',
      'hocompanyname',
      'contactperson'
    ];

    let hasError = false;

    requiredControls.forEach(name => {
      const control = this.branchForm.get(name);
      if (control?.invalid) {
        control.markAsTouched();
        hasError = true;
      }
    });

    if (hasError) {
      return;
    }
    const selectedContactPerson = this.selectedContactPerson();
    const selectedCountry = this.selectedCountry();
    const selectedBranchType = this.branchType.find(bt => bt.value === this.branchForm.get('branchtype')?.value);

    if (!selectedBranchType) {
      this.toast.warning('Please select a valid branch type.');
      return;
    }
    if (!selectedCountry) {
      this.toast.warning('Please select a valid country.');
      return;
    }
    if (!selectedContactPerson) {
      this.toast.warning('Please select a valid Contact Person.');
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
      contactPerson: selectedContactPerson
        ? { id: selectedContactPerson.id, name: selectedContactPerson.name }
        : null,

      remarks: this.branchForm.value.remarks,
      dl1: this.branchForm.value.dl1,
      dl2: this.branchForm.value.dl2,
      uniqueId: this.branchForm.value.uniqueid,
      reference: this.branchForm.value.reference,
      bankCode: this.branchForm.value.bankcode,
      branchImage: this.imageBase64
    };

    if (this.isEditMode()) {
      this.updateBranch(payload);
    } else {
      this.saveNewBranch(payload);
    }
  }

  //updating the branch
  updateBranch(payload: any): void {
    if (!this.currentBranch?.id) {
      this.baseService.showCustomDialogue('No branch selected to update');
      return;
    }

    this.httpService
      .patch(EndpointConstant.UPDATEBRANCH + this.currentBranch.id + '?companyId=' + this.companyId, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (res) => {
          this.toast.success("Branch updated successfully");
          this.branchForm.disable();
          this.removeImage();
          this.branchForm.reset();
          // Refresh the left grid and update the data sharing service
          await this.LeftGridInit();
          this.serviceBase.dataSharingService.setData({
            columns: this.leftGrid.leftGridColumns,
            data: this.leftGrid.leftGridData,
            pageheading: this.pageheading,
          });
        },
        error: (err) => {
          this.toast.error("Branch update failed");
        }
      });
  }

  //saving the new branch
  saveNewBranch(payload: any): void {
    this.httpService.post<BranchSaveDto>(EndpointConstant.SAVEBRANCH + '?companyId=' + this.companyId, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (res) => {
          if (!res.isValid && res.httpCode !== 200) {
            this.toast.error("Error Saving Branch");
          } else {
            this.toast.success("Branch saved successfully");
            this.branchForm.disable();
            this.removeImage();
            this.branchForm.reset();
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
  onActiveChange() { }

  //for image selection
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      const fullBase64 = reader.result as string;
      this.imageData = fullBase64;
      // ✅ For payload (REMOVE data:image/...;base64,)
      this.imageBase64 = fullBase64.split(',')[1];
      console.log("base64 data:" + this.imageBase64)
    };
    reader.readAsDataURL(file);
  }


  removeImage(): void {
    this.imageData = null;
    this.imageBase64 = null;
  }

}
