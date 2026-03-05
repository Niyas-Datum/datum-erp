import { ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
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

  /** Dialog host lives in parent (RemoteEntry); use ID lookup since this component is inside router-outlet. */
  private get dialogTargetElement(): HTMLElement | null {
    return document.getElementById('alertDialog');
  }

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

  constructor(private cd: ChangeDetectorRef) {
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
    console.log("Newmode:"+this.isNewMode())
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
      const data = res.data;
      const lastItem = data?.length ? data[data.length - 1] : null;
      if (lastItem) {
        this.currentBranch = lastItem;
        this.selectedBranchId = lastItem.id;
        this.fetchBranchById();
      }

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
    if (this.isNewMode() || this.isEditMode()) {
      this.viewDialog(
        'You have unsaved changes in the new branch form. Do you want to discard them and view the selected branch?',
        'Confirmation',
        '450px',
        [
          {
            click: () => {
              this.alertService.hideDialog();
              this.isNewMode.set(false);
              this.isNewBtnDisabled.set(false);
              this.isEditBtnDisabled.set(false);
              this.isDeleteBtnDisabled.set(false);
              this.isSaveBtnDisabled.set(true);
              this.isPrintBtnDisabled.set(false);
              this.isInputDisabled = true;
              this.branchForm.disable();
              this.selectedBranchId = data.id;
              this.loadBranchById();
            },
            buttonModel: { content: 'Yes', isPrimary: true }
          },
          {
            click: () => {
              this.alertService.hideDialog();
            },
            buttonModel: { content: 'No' }
          }
        ]
      );
      return;
    }
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
            this.imageData = `data:image/jpeg;base64,${response.data}`;
            console.log("Image getting:" + this.imageData)
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
          if (countryObj) {
            this.selectedCountry.set(countryObj);
          } else {
            this.selectedCountry.set(null);
          }
          const contactObj = this.contactPersonList().find(c => {
            if (c.id === this.currentBranch.contactPersonID) return true;
            if (c.id != null && Number(this.currentBranch.contactPersonID) === c.id) return true;
            return false;
          });

          if (contactObj) {
            this.selectedContactPerson.set(contactObj);
          } else {
            this.selectedContactPerson.set(null);
          }
          this.imageData = null;
          this.fetchImage();
        },
        error: (error) => {
          console.error('An Error Occured', error);
        },
      });
  }


  private loadBranchById() {

  this.httpService
    .fetch(EndpointConstant.FILLALLBRANCHBYID + this.selectedBranchId)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {

        this.currentBranch = response?.data as any;

        const countryObj = this.countries().find(c =>
          c.value === this.currentBranch.country ||
          (c.id != null && Number(this.currentBranch.country) === c.id)
        );

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

        this.selectedCountry.set(countryObj ?? null);

        const contactObj = this.contactPersonList().find(c =>
          c.id === this.currentBranch.contactPersonID ||
          (c.id != null && Number(this.currentBranch.contactPersonID) === c.id)
        );

        this.selectedContactPerson.set(contactObj ?? null);

        this.imageData = null;
        this.fetchImage();
      },
      error: (error) => {
        console.error('An Error Occured', error);
      },
    });
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
    this.imageData = null;
    this.branchForm.enable();
    this.selectedContactPerson.set(null);
    this.selectedCountry.set(null);
    this.isActive = true;
    this.isEditMode.set(false);
    this.isNewMode.set(true);
    this.isNewBtnDisabled.set(false);
    this.isEditBtnDisabled.set(true);
    this.isInputDisabled = false;
  }

  companyId = Number(localStorage.getItem('companyId'));

  onSaveClick(): void {
    console.log("saving...")
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

    // if (hasError) {
    //   return;
    // }
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
      contactPerson:
        selectedContactPerson
          ? { id: selectedContactPerson.id, name: selectedContactPerson.name }
          : null,

      remarks: this.branchForm.value.remarks,
      dl1: this.branchForm.value.dl1,
      dl2: this.branchForm.value.dl2,
      uniqueId: this.branchForm.value.uniqueid,
      reference: this.branchForm.value.reference,
      bankCode: this.branchForm.value.bankcode,
      branchImage: this.imageData
    };

    console.log("Payload:" + JSON.stringify(payload, null, 2))

    if (this.isEditMode()) {
      this.updateBranch(payload);
    } else {
      this.saveNewBranch(payload);
    }
  }

  //updating the branch
  updateBranch(payload: any): void {
    if (!this.currentBranch?.id) {
      this.toast.error('No branch selected to update');
      return;
    }

    this.httpService
      .patch(EndpointConstant.UPDATEBRANCH + this.currentBranch.id + '?companyId=' + this.companyId, payload)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: async (res) => {
          this.toast.success("Branch updated successfully");
          this.branchForm.disable();
          //this.removeImage();
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

  selectedImageFile: File | null = null;

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.toast.error('Only image files are allowed');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File size exceeds 5MB');
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imageData = reader.result as string;   // ✅ base64 ready  
      console.log("selected image:" + this.imageData)
      this.cd.detectChanges();                       // optional
    };

    reader.readAsDataURL(file);
  }
  removeImage(): void {
    this.imageData = null;

  }
  get alertService() {
    return this.serviceBase.alertService;
  }

  private viewDialog(content: string, header: string, width: string, buttons: any[]): void {
    const dialogHost = this.dialogTargetElement;
    if (!dialogHost) {
      console.error('Dialog target element not found');
      return;
    }

    this.alertService.showDialog(dialogHost, {
      content: content || 'This is a custom alert dialog!',
      header: header || 'Alert',
      width: width || '400px',
      isModal: true,
      closeOnEscape: false,
      allowDragging: false,
      showCloseIcon: true,
      zIndex: 10000,
      buttons: buttons,
      overlayClick: () => { },
    });
  }


}