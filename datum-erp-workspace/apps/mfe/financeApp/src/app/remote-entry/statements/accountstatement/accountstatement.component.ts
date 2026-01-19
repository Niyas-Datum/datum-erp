import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@org/architecture";
import { BaseService, LocalStorageService } from "@org/services";
import { FinanceAppService } from "../../http/finance-app.service";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MultiColumnComboBoxComponent } from "@org/ui";
import { filter, firstValueFrom, take } from "rxjs";
import { ACCOUNTPOPUP } from "../../model/paccountlistcomponent.model";
import { BranchDto } from "@org/models";
import { ACCOUNTSPOPUP, AccountStatementRow, REPORTDATA, USERSPOP } from "../model/accountstatement.model";


@Component({
    selector: 'app-accountstatement',
    standalone: false,
    templateUrl: './accountstatement.component.html',
    styles: [],
})

export class AccountStatementComponent extends BaseComponent implements OnInit {

    private httpService = inject(FinanceAppService);

    //allBranches = signal<BranchDto[]>([]);
    private localstorageService = inject(LocalStorageService);
    private baseService = inject(BaseService);
    currentBranchID = signal<number>(1);
    currentBranch = signal<number>(1);

   // users = [] as Array<USERSPOP>;
  //branches = [] as Array<BRANCHES>;
    accounts: any[] = [];
    //reportData: any[] = [];

    fromDate!: Date;
    toDate!: Date;
    branchFields = {
        text: 'company',
        value: 'id'
    };

    constructor() {
        super();
        this.commonInit();
    }
    accountStatementForm!: FormGroup;

    ngOnInit(): void {
        this.accountStatementForm = new FormGroup({
            from: new FormControl(null, Validators.required),
            to: new FormControl(null, Validators.required),
            account: new FormControl(null),
            branch: new FormControl(null),
            user: new FormControl(null)
        });
        this.accountStatementForm.patchValue({
            from: new Date()
        });
        this.accountStatementForm.patchValue({
            to: new Date()
        });

        this.SetPageType(2);
        this.fetchBranchDropdown();
        this.fetchAccountPopup();
       this.fetchUserPopup();
    }



    // accountStatementForm = this.formUtil.thisForm;

    // override FormInitialize() {
    //     this.accountStatementForm = new FormGroup({
    //         from: new FormControl('', Validators.required),
    //         to: new FormControl('', Validators.required),
    //         account: new FormControl('', Validators.required),
    //         branch: new FormControl(null), // ✅ ADD THIS
    //     });
    // }

allAccounts = [] as Array<ACCOUNTSPOPUP>;
accountOptions:any = [];  

accountColumns = [
  { field: 'accountCode', header: 'Code', width: 120 },
  { field: 'accountName', header: 'Name', width: 180 },
  { field: 'details', header: 'Details', width: 250 }
];

accountFields = {
  text: 'accountName', // shown in input box
  value: 'id'           // stored in formControl
};


async fetchAccountPopup(): Promise<void> {
  try {
    const response = await firstValueFrom(
      this.httpService.fetch(EndpointConstant.FILLACCOUNTDATA)
    );

    // ✅ data is already an array
    this.allAccounts = response.data as any[];

    console.log('Accounts:', JSON.stringify(this.allAccounts,null,2));

  } catch (error) {
    console.error('An error occurred while fetching accounts:', error);
  }
}
  
branchData = [] as Array<BranchDto>;
branchOptions:any = [];
async fetchBranchDropdown(): Promise<void> {
  try {
    const response = await firstValueFrom(
      this.httpService.fetch(EndpointConstant.FILLALLBRANCH)
    );

    this.branchData = response?.data as any;
    this.branchOptions = this.branchData.map((item: any) => ({
      company: item.company,
      id: item.id
    }));

    const currentBranchId = Number(
      this.localstorageService.getLocalStorageItem('current_branch')
    );

    // ✅ SET DEFAULT SELECTION
    this.accountStatementForm.patchValue({
      branch: currentBranchId
    });

  } catch (error) {
    console.error('An error occurred while fetching branches:', error);
  }
}

onBranchChange(event: any): void {
  console.log('Branch ID:', event.value);
  console.log('Branch Object:', event.itemData);
}


//user popup
//users: any[] = [];
users = [] as Array<USERSPOP>;

userFields = {
  text: 'username',   // what shows in input box
  value: 'id'         // value stored in form control
};

userColumns = [
  { field: 'username', header: 'Username', width: 150 },
  { field: 'firstName', header: 'First Name', width: 150 },
  { field: 'lastName', header: 'Last Name', width: 150 },
  { field: 'emailId', header: 'Email', width: 220 },
  { field: 'mobileNumber', header: 'Mobile', width: 130 }
];

fetchUserPopup(): void {
  this.httpService
    .fetch(EndpointConstant.USERPOPUP)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        this.users = Array.isArray(response?.data) ? response.data : [];

        if (this.users.length > 0) {
          // ✅ Default select first user
          this.accountStatementForm.patchValue({
            user: this.users[0].id
          });
        }

        console.log('Users:', this.users);
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      }
    });


    //account popup
    // FILLACCOUNTDATA
    // this.fetchAccountPopup
}





onPrint() {
    console.log('Print clicked');
}

onPreview() {
    console.log('Preview clicked');
}

onExcel() {
    console.log('Excel clicked');
}

onEmail() {
    console.log('Email clicked');
}



//getting current pageid
pageId=0;

getPageID(): void {
    this.serviceBase.dataSharingService.currentPageInfo$
      .pipe(
        filter((pageInfo) => pageInfo && pageInfo.id !== undefined),
        take(1),
        takeUntilDestroyed(this.serviceBase.destroyRef)
      )
      .subscribe((pageInfo) => {
        this.currentPageInfo = pageInfo;
        this.pageId = this.currentPageInfo?.id ?? 0;
      });
  }

//grid
//reportData = [] as Array<REPORTDATA>
reportData: any[] = [];
loading = false;

onClickGo(): void {

    this.getPageID();
  if (this.accountStatementForm.invalid) {
    this.accountStatementForm.markAllAsTouched();
    return;
  }

  const formValue = this.accountStatementForm.value;

  const payload = {
    dateFrom: formValue.from,
    dateUpto: formValue.to,

    branch: formValue.branch
      ? {
          id: formValue.branch,
          value: ''
        }
      : null,

    account: formValue.account
      ? {
          id: formValue.account.id ?? formValue.account,
          name: formValue.account.name ?? '',
          code: formValue.account.code ?? '',
          description: formValue.account.description ?? ''
        }
      : null,

    user: formValue.user
      ? {
          id: formValue.user.id ?? formValue.user,
          name: formValue.user.username ?? '',
          code: '',
          description: ''
        }
      : null,

    accountGroup: {
        id:null
    },    
    
    costCentre: {id:null}
  };

  console.log("Paeid:"+this.pageId)
  console.log('Account Statement Payload:', JSON.stringify(payload,null,2));

  this.fetchAccountStatement(payload);
  this.showSummary() ;
  
}

fetchAccountStatement(payload: any): void {
  this.loading = true;

  this.httpService
    .post(EndpointConstant.FILLACCOUNTSTATEMENT+this.pageId,payload)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    .subscribe({
      next: (response) => {
        if (Array.isArray(response.data)) {
          this.reportData = response.data;
          console.log("report:"+JSON.stringify(this.reportData,null,2))
        } else {
          this.reportData = [];
          console.warn('No data received');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching account statement:', error);
        this.loading = false;
      }
    });
}


//summary


isSummary: boolean = true;

showSummary() {
  this.isSummary = true;
  this.buildSummary();
}

showDetailed() {
  this.isSummary = false;
  this.generateDetailData();
}

summaryGridData: { head: string; value: number }[] = [];


buildSummary() {
  const map = new Map<
    string,
    { debit: number; credit: number }
  >();

  this.reportData.forEach(row => {
    if (!row.vDate) return;

    const d = new Date(row.vDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;

    if (!map.has(key)) {
      map.set(key, { debit: 0, credit: 0 });
    }

    const obj = map.get(key)!;
    obj.debit += Number(row.debit || 0);
    obj.credit += Number(row.credit || 0);
  });

  this.summaryGridData = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month);

      return {
        head: date.toLocaleString('en-US', {
          month: 'long',
          year: 'numeric'
        }),
        value: value.debit - value.credit
      };
    });
}


//detailed grid
detailedGridData: any[] = [];
generateDetailData(): void {
  const monthWiseDetails: {
    [key: string]: { debit: number; credit: number; head: string };
  } = {};

  this.reportData.forEach(row => {
    if (row?.vDate) {
      const monthYear = new Date(row.vDate).toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });

      if (!monthWiseDetails[monthYear]) {
        monthWiseDetails[monthYear] = {
          head: monthYear,
          debit: 0,
          credit: 0
        };
      }

      monthWiseDetails[monthYear].debit += Number(row.debit || 0);
      monthWiseDetails[monthYear].credit += Number(row.credit || 0);
    }
  });

  this.detailedGridData = Object.keys(monthWiseDetails).map(key => {
    const data = monthWiseDetails[key];
    return {
      head: data.head,
      debit: data.debit,
      credit: data.credit
    };
  });

  // Sort by month-year
  this.detailedGridData.sort(
    (a, b) => new Date(a.head).getTime() - new Date(b.head).getTime()
  );
}

onClear() {
  this.accountStatementForm.reset();

         this.accountStatementForm.patchValue({
            from: new Date()
        });
        this.accountStatementForm.patchValue({
            to: new Date()
        });
 }
}