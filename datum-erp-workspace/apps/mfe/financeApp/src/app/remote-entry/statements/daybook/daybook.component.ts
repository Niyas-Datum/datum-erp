import { Component, inject, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@org/architecture";
import { FinanceAppService } from "../../http/finance-app.service";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BranchDto } from "@org/models";
import { filter, firstValueFrom, take } from "rxjs";
import { LocalStorageService } from "@org/services";
import { USERSPOP } from "../model/accountstatement.model";

@Component({
    selector: 'app-daybook',
    standalone: false,
    templateUrl: './daybook.component.html'
})
export class DaybookComponent extends BaseComponent implements OnInit {

    dayBookForm!: FormGroup;
    private httpService = inject(FinanceAppService);
    private localstorageService = inject(LocalStorageService);

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

    /** Load voucher types */
    // fetchVoucherTypes(): void {
    //     this.httpService
    //         .fetch(EndpointConstant.VOUCHERDROPDOWN)
    //         .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
    //         .subscribe({
    //             next: (res: any) => {
    //                 this.voucherTypes = Array.isArray(res?.data) ? res.data : [];

    //             },
    //             error: (err) => console.error('Voucher type load failed', err)
    //         });
    // }

    fetchVoucherTypes(): void {
        this.httpService
            .fetch(EndpointConstant.VOUCHERDROPDOWN)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            .subscribe({
                next: (res: any) => {
                    const apiData = Array.isArray(res?.data) ? res.data : [];

                    this.voucherTypes = [
                        { id: -1, name: 'All' },
                        ...apiData
                    ];

                    this.dayBookForm.patchValue({
                        voucherType: -1
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


    onClickGo(): void {
        this.getPageID();
        const payload = this.buildPayload();

        console.log('DayBook Payload:', JSON.stringify(payload, null, 2));

        this.httpService
            .post<any>(EndpointConstant.FILLDAYBOOK + this.pageId, payload)
            .subscribe({
                next: (res) => {
                    this.reportData = Array.isArray(res?.data) ? res.data : [];
                    console.log("Report:" + JSON.stringify(this.reportData, null, 2))
                },
                error: (err) => {
                    console.error('DayBook load failed', err);
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
}