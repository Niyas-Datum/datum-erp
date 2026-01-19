import { Component, inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@org/architecture";
import { ACCGROUP, AccountCategory, ACCOUNTSPOPUP } from "../model/accountstatement.model";
import { filter, firstValueFrom, take } from "rxjs";
import { FinanceAppService } from "../../http/finance-app.service";
import { EndpointConstant } from "@org/constants";
import { BranchDto } from "@org/models";
import { LocalStorageService } from "@org/services";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-billwisestatement',
    standalone: false,
    templateUrl: './billwisestatement.component.html',
    styles: [],
})

export class BillwiseStatementComponent extends BaseComponent implements OnInit {

    billwiseForm!: FormGroup;
    private httpService = inject(FinanceAppService);
    private localstorageService = inject(LocalStorageService);

    ngOnInit(): void {
        this.billwiseForm = new FormGroup({
            dateType: new FormControl('effectivedate'),
            from: new FormControl(null),
            to: new FormControl(null),
            daysFrom: new FormControl(null),
            daysUpto: new FormControl(null),
            account: new FormControl(null),
            billType: new FormControl(0),
            accountGroup: new FormControl(null),
            accountCategory: new FormControl(null),
            detailed: new FormControl(true),
            pendingbills: new FormControl(null),
            branch: new FormControl(null),

        });
        this.billwiseForm.patchValue({
            from: new Date()
        });
        this.billwiseForm.patchValue({
            to: new Date()
        });
        this.SetPageType(2);
        this.fetchAccountPopup();
        this.fetchAccGroupPopup();
        this.fetchAccountCategoryPopup();
        this.fetchBranchDropdown();
    }

    // Account popup

    allAccounts = [] as Array<ACCOUNTSPOPUP>;
    accountOptions: any = [];

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

            //console.log('Accounts:', JSON.stringify(this.allAccounts,null,2));

        } catch (error) {
            console.error('An error occurred while fetching accounts:', error);
        }
    }

    //bill type dropdown
    billTypes = [
        { id: 0, name: 'All' },
        { id: 1, name: 'Receivables' },
        { id: 2, name: 'Payables' }
    ];

    //Account group popup
    accountGroups: ACCGROUP[] = [];

    /* What is shown vs stored */
    accGroupFields = {
        text: 'accountName',   // shown in input
        value: 'accountID'     // stored in form control
    };

    /* Grid columns inside dropdown */
    accGroupColumns = [
        { field: 'accountID', header: 'ID', width: 80 },
        { field: 'accountCode', header: 'Alias', width: 120 },
        { field: 'accountName', header: 'Name', width: 200 }
    ];

    async fetchAccGroupPopup(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.httpService.fetch(EndpointConstant.FILLACCOUNTACCOUNTPOPUP)
            );

            this.accountGroups = Array.isArray(response?.data)
                ? response.data
                : [];

            console.log(
                'Account Groups:',
                JSON.stringify(this.accountGroups, null, 2)
            );

        } catch (error) {
            console.error('Error fetching account groups:', error);
        }
    }

    //Account category
    accountCategories = [] as Array<AccountCategory>;

    /* What shows in input vs stored value */
    accCategoryFields = {
        text: 'description', // visible text
        value: 'id'          // stored in form control
    };

    /* Popup columns */
    accCategoryColumns = [
        { field: 'id', header: 'ID', width: 80 },
        { field: 'description', header: 'Category', width: 200 }
    ];

    async fetchAccountCategoryPopup(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.httpService.fetch(EndpointConstant.FILLACCOUNTCATEGORY)
            );

            this.accountCategories = Array.isArray(response?.data)
                ? response.data
                : [];

            console.log(
                'Account Categories:',
                JSON.stringify(this.accountCategories, null, 2)
            );

        } catch (error) {
            console.error('Error fetching account categories:', error);
        }
    }

    //branch dropdown
    branchData = [] as Array<BranchDto>;
    branchOptions: any = [];
    branchFields = {
        text: 'company',
        value: 'id'
    };
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
            this.billwiseForm.patchValue({
                branch: currentBranchId
            });

        } catch (error) {
            console.error('An error occurred while fetching branches:', error);
        }
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
        const form = this.billwiseForm.value;

        const isEffectiveDate = form.dateType === 'effectivedate';
        const isVoucherDate = form.dateType === 'voucherdate';
        const selectedBillType =
            this.billTypes.find(b => b.id === form.billType) ?? this.billTypes[0];

        return {
            dateFrom: form.from ? form.from.toISOString() : null,
            dateUpto: form.to ? form.to.toISOString() : null,

            branch: form.branch
                ? {
                    id: form.branch,
                    value: ''
                }
                : null,

            account: form.account
                ? {
                    id: form.account,
                    name: '',
                    code: '',
                    description: ''
                }
                : null,

            user: null,          // ✅ explicitly null
            costCentre: null,    // ✅ explicitly null

            accountGroup: form.accountGroup
                ? {
                    id: form.accountGroup,
                    name: '',
                    code: '',
                    description: ''
                }
                : null,

            effectiveDate: isEffectiveDate,
            voucherDate: isVoucherDate,

            daysFrom: form.daysFrom ?? null,
            daysUpto: form.daysUpto ?? null,

            billType: {
                id: selectedBillType.id,
                value: selectedBillType.name ?? null
            },

            accGroup: form.accountGroup
                ? {
                    id: form.accountGroup,
                    name: '',
                    code: '',
                    description: ''
                }
                : null,

            accCategory: form.accountCategory
                ? {
                    id: form.accountCategory,
                    name: '',
                    code: '',
                    description: ''
                }
                : null,

            detailed: !!form.detailed,
            pendingBills: !!form.pendingbills
        };
    }

    reportData: any[] = [];
    onClickGo(): void {

        this.getPageID();        
        const payload = this.buildPayload();
        console.log('Billwise Payload:', JSON.stringify(payload, null, 2));
        this.httpService
            .post<any>(EndpointConstant.FILLBILLWISESTMT + this.pageId, payload)
            .subscribe({
                next: (res) => {
                    this.reportData = Array.isArray(res?.data) ? res.data : [];
                    console.log("Report:" + JSON.stringify(this.reportData, null, 2))
                },
                error: (err) => {
                    console.error('Billwise Statement load failed', err);
                }
            });
        if (this.billwiseForm.invalid) {
            this.billwiseForm.markAllAsTouched();
            return;
        }
    }

    onClear(): void {

        // Reset entire form
        this.billwiseForm.reset();

        this.billwiseForm.patchValue({
            from: new Date()
        });
        this.billwiseForm.patchValue({
            to: new Date()
        });
    }

}