import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@org/architecture";
import { FinanceAppService } from "../../http/finance-app.service";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BranchDto } from "@org/models";
import { filter, firstValueFrom, take } from "rxjs";
import { LocalStorageService } from "@org/services";
import { USERSPOP } from "../model/accountstatement.model";
import { PdfGenerationService } from "../pdfgeneration.service";
import { GridComponent } from "@syncfusion/ej2-angular-grids";

@Component({
    selector: 'app-daybook',
    standalone: false,
    templateUrl: './daybook.component.html'
})
export class DaybookComponent extends BaseComponent implements OnInit {

    @ViewChild('grid') grid!: GridComponent;

    dayBookForm!: FormGroup;
    private httpService = inject(FinanceAppService);
    private localstorageService = inject(LocalStorageService);
    private pdfgenService = inject(PdfGenerationService);

    selectedBranch: any = null;

    //filters
    //vouchertype
    voucherTypes: any[] = [];

    voucherTypeFields = {
        text: 'name',   // display text
        value: 'id'     // stored value
    };

    //branch dropdown
    currentBranchID = signal<number>(1);
    currentBranch = signal<number>(1);
    branchFields = {
        text: 'company',
        value: 'id'
    };

    //user popup
    currentUser = signal<number>(1);
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

    constructor() {
        super();
        this.commonInit();
    }
    ngOnInit(): void {
        this.dayBookForm = new FormGroup({
            from: new FormControl(new Date(), Validators.required),
            to: new FormControl(new Date(), Validators.required),
            user: new FormControl(null),
            voucherType: new FormControl(null),
            branch: new FormControl(null),
            detailed: new FormControl(null),
            posted: new FormControl(null)

        });

        this.SetPageType(2);
        this.fetchVoucherTypes();
        this.fetchBranchDropdown();
        this.fetchUserPopup();
    }


    fetchVoucherTypes(): void {
        this.httpService
            .fetch(EndpointConstant.VOUCHERDROPDOWN)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            .subscribe({
                next: (res: any) => {
                    const apiData = Array.isArray(res?.data) ? res.data : [];

                    this.voucherTypes = [
                        { id: 0, name: 'All' },
                        ...apiData
                    ];

                    this.dayBookForm.patchValue({
                        voucherType: 0
                    });
                },
                error: (err) => console.error('Voucher type load failed', err)
            });
    }


    branchData = [] as Array<BranchDto>;
    branchOptions: any = [];
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
            this.dayBookForm.patchValue({
                branch: currentBranchId
            });

        } catch (error) {
            console.error('An error occurred while fetching branches:', error);
        }
    }

    // selectedBranch: any = null;

    onBranchChange(event: any) {
        const branchId = event.value;

        this.selectedBranch = this.branchData.find(
            b => b.id === branchId
        ) ?? null;
    }


    fetchUserPopup(): void {
        const userId = Number(
            this.localstorageService.getLocalStorageItem('current_user')
        );

        console.log("Current user:" + userId)

        this.httpService
            .fetch(EndpointConstant.USERPOPUP)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            .subscribe({
                next: (response) => {
                    this.users = Array.isArray(response?.data) ? response.data : [];
                    //console.log("user data:" + JSON.stringify(this.users, null, 2))                   
                    this.dayBookForm.patchValue({
                        user: userId
                    });

                },
                error: (error) => {
                    console.error('Error fetching users:', error);
                }
            });
    }

    //getting current pageid
    pageId = 0;

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

    buildPayload() {
        const formValue = this.dayBookForm.value;

        return {
            dateFrom: formValue.from?.toISOString(),
            dateUpto: formValue.to?.toISOString(),

            branch: formValue.branch
                ? {
                    id: formValue.branch,
                    value: ''
                }
                : null,

            account: {},

            user: formValue.user
                ? {
                    id: formValue.user.id ?? formValue.user,
                    name: formValue.user.username ?? '',
                    code: '',
                    description: ''
                }
                : null,

            voucherType:
                formValue.voucherType && formValue.voucherType !== 0
                    ? { id: formValue.voucherType }
                    : null,

            detailed: Boolean(formValue.detailed),
            posted: Boolean(formValue.posted)
        };
    }

    reportData: any[] = [];

    totalDebit = 0;
    totalCredit = 0;


    onClickGo(): void {
    this.getPageID();

    const payload = this.buildPayload();
    console.log('DayBook Payload:', JSON.stringify(payload, null, 2));

    const formatDate = (val: any) => {
        if (!val) return '';

        const str = String(val);
        const [datePart] = str.split(' ');
        const parts = datePart.split('-');

        if (parts.length !== 3) return '';

        const [day, month, year] = parts;
        return `${day}/${month}/${year}`;
    };

    this.httpService
        .post<any>(EndpointConstant.FILLDAYBOOK + this.pageId, payload)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
            next: (res) => {

                const rawData = Array.isArray(res?.data) ? res.data : [];

                // 🔍 1. RAW DATA
                console.log("RAW DATA:", rawData);

                this.reportData = rawData.map((x: any, index: number) => {

                    // 🔍 2. EACH ROW BEFORE
                    console.log(`Row ${index} BEFORE:`, x);

                    const formatted = {
                        ...x,
                        VDate: formatDate(x.VDate)
                    };

                    // 🔍 3. EACH ROW AFTER
                    console.log(`Row ${index} AFTER:`, formatted);

                    return formatted;
                });

                // 🔍 4. FINAL REPORT DATA
                console.log("FINAL REPORT DATA:", JSON.stringify(this.reportData,null,2));
            },

            error: (err) => {
                console.error('DayBook load failed', err);
                this.reportData = [];
            }
        });
}

    onClear(): void {
        // Reset entire form
        this.dayBookForm.reset();

        this.dayBookForm.patchValue({
            from: new Date()
        });
        this.dayBookForm.patchValue({
            to: new Date()
        });

    }

    //report

    onPreview(): void {
        this.pdfgenService.preview({
            companyName: this.selectedBranch?.company ?? '',
            address: '',
            pageName: 'Day Book',
            fromDate: "", //this.fromDate,
            toDate: "",// this.toDate,

            columns: [
                { header: 'Date', field: 'VDate', format: 'date', align: 'center' },
                { header: 'VNo', field: 'VNo' },
                { header: 'Type', field: 'VType' },
                { header: 'Particulars', field: 'Particulars' },
                { header: 'Debit', field: 'Debit', align: 'right', format: 'amount' },
                { header: 'Credit', field: 'Credit', align: 'right', format: 'amount' },
                { header: 'Balance', field: 'RBalance', align: 'right', format: 'amount' }
            ],

            rows: this.reportData,
            showTotals: true
        });
    }
}