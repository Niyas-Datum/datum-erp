import { Component, inject, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@org/architecture";
import { InventoryAppService } from "../../http/inventory-app.service";
import { LocalStorageService } from "@org/services";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AREA, BASICTYPE, BRANCHES, COUNTERS, CUSTOMERSUPPLIER, ITEMS, PAYMENTTYPE, STAFF, USERS, VOUCHERTYPE } from "../model/generalregister.model";
import { PdfGenerationService } from "../common/pdfgeneration.service";
import { PdfColumn, PdfReportData } from "../model/pdfgeneration.model";
//import { PdfGenerationService } from "../common/pdfgeneration.service";
//import { GeneralRegisterData, GeneralRegisterRow } from "../model/pdfgeneration.model";


interface LeftSummaryRow {
    particulars: string;
    debit: number;
    credit: number;
}
@Component({
    selector: 'app-generalregister-Main',
    standalone: false,
    templateUrl: './generalregister.component.html',

})

export class GeneralRegisterComponent extends BaseComponent implements OnInit {

    fromDate!: Date;
    toDate!: Date;
    generalRegisterForm!: FormGroup;
    private httpService = inject(InventoryAppService);
    private pdfService = inject(PdfGenerationService);

    isLoading = signal(false);
    isInputDisabled = true;
    isActive: unknown;
    currentid = signal(0);
    cashId: any = 0;
    creditId: any = 0;

    ngOnInit(): void {
        this.generalRegisterForm = new FormGroup({
            from: new FormControl(null, Validators.required),
            to: new FormControl(null, Validators.required),
            selectedView: new FormControl('inventory'),
            basicType: new FormControl("Sales Invoice"),

            voucherType: new FormControl(null),
            account: new FormControl(null),
            branch: new FormControl(null),
            user: new FormControl(null),
            batchNo: new FormControl(null),
            invoiceNo: new FormControl(null),
            columnar: new FormControl(null),
            detailed: new FormControl(null),
            inventory: new FormControl(null),
            groupItem: new FormControl(null),
            customerSupplier: new FormControl(null),
            area: new FormControl(null),
            staff: new FormControl(null),
            item: new FormControl(null),
            counter: new FormControl(null),
            paymentType: new FormControl(null)

        });
        this.generalRegisterForm.patchValue({
            from: new Date()
        });
        this.generalRegisterForm.patchValue({
            to: new Date()
        });
        this.SetPageType(2);
        this.fetchAllFilterMasterData();
    }

    setCashCreditID() {
        // Find IDs for "Cash" and "Credit" payment types
        console.log("payment types:" + JSON.stringify(this.paymentTypes, null, 2))
        this.cashId = this.paymentTypes.find(payment => payment.name === "Cash")?.id;
        this.creditId = this.paymentTypes.find(payment => payment.name === "Credit")?.id;

    }

    currentBranch = signal<number>(1);
    currentUser = signal<number>(1);
    private localstorageService = inject(LocalStorageService);

    fetchAllFilterMasterData(): void {

        this.httpService
            .fetch(EndpointConstant.FILLGENERALREGISTERMASTERFILTER)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            .subscribe({
                next: (response) => {

                    let filterMasterData: any = response?.data;
                    this.basicTypesarr = filterMasterData.basicTypes;
                    this.voucherTypesarr = filterMasterData.voucherTypes;
                    this.itemsArr = filterMasterData.items;
                    this.staffArr = filterMasterData.staffs;
                    this.customerSupplierArr = filterMasterData.customerSupplier;
                    this.areaArr = filterMasterData.areas;
                    this.paymentTypes = filterMasterData.paymentTypes;
                    this.counters = filterMasterData.counters;
                    this.users = filterMasterData.users;
                    this.branches = filterMasterData.branches;

                    //setting current branch by default
                    const savedBranchId = Number(this.localstorageService.getLocalStorageItem('current_branch'));
                    this.currentBranch.set(savedBranchId);

                    //setting current user by default
                    const userId = Number(
                        this.localstorageService.getLocalStorageItem('current_user')
                    );
                    this.currentUser.set(userId);

                    this.generalRegisterForm.patchValue({
                        branch: savedBranchId,
                        user: userId
                    });

                    this.branchObj = this.branches.find(b => b.id === savedBranchId) ?? null;
                    this.userObj = this.users.find(b => b.id === userId) ?? null;

                    this.setCashCreditID();
                    this.currentBranch.set(
                        Number(this.localstorageService.getLocalStorageItem('current_branch'))
                    );

                },
                error: (error) => {

                    console.error('An Error Occured', error);
                },
            });
    }

    //basic type
    basicTypesarr: BASICTYPE[] = [];
    selectedBasicType: any = null;
    baseTypeObj: any = null;

    public basicTypeColumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'name', header: 'Basic Type', width: 200 },

    ];
    onBasicTypeSelect(event: any) {
        this.baseTypeObj = event.itemData;
    }

    //vouchertype popup
    voucherTypesarr = [] as Array<VOUCHERTYPE>;
    public selectedVoucherType: any = null;
    voucherTypeObj: any = null;

    public voucherTypeColumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'code', header: 'Code', width: 90 },
        { field: 'name', header: 'Name', width: 200 }
    ];
    onVoucherTypeSelect(event: any) {
        this.voucherTypeObj = event.itemData;
    }

    //customer/supplier popup
    customerSupplierArr = [] as Array<CUSTOMERSUPPLIER>;
    public selectedCustSupplType: any = null;
    customerSupplierObj: any = null;
    public customerSupplierTypeColumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'accountCode', header: 'Account Code', width: 90 },
        { field: 'accountName', header: 'Account Name', width: 200 }
    ];
    onCustomerSelect(event: any) {
        this.customerSupplierObj = event.itemData;
    }

    //item popup
    itemsArr = [] as Array<ITEMS>;
    public selectedItem: any = null;
    itemObj: any = null;
    public itemcolumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'itemCode', header: 'Item Code', width: 90 },
        { field: 'itemName', header: 'Item Name', width: 200 },
        { field: 'unit', header: 'Unit', width: 80 }
    ];

    selectedItemId: number | null = null;

    onItemSelect(event: any) {
        this.itemObj = event.itemData;
    }

    //staff popup
    staffArr = [] as Array<STAFF>;
    public selectedStaff: any = null;
    staffObj: any = null;
    public staffColumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'code', header: 'Account Code', width: 90 },
        { field: 'name', header: 'Account Name', width: 90 }
    ];

    selectedStaffId: number | null = null;
    onStaffSelect(event: any) {
        this.staffObj = event.itemData;
    }

    //area popup
    areaArr = [] as Array<AREA>;
    public selectedArea: any = null;
    areaObj: any = null;
    public areaColumns = [

        { field: 'code', header: 'Code', width: 100 },
        { field: 'name', header: 'Name', width: 200 }
    ];

    selectedAreaId: number | null = null;
    onAreaSelect(event: any) {
        this.areaObj = event.itemData;
    }

    //payment type
    paymentTypes = [] as Array<PAYMENTTYPE>;
    selectedPayment: any = null;
    paymentTypeObj: any = null;
    onPaymentTypeChange(event: any) {
        const id = event.value;
        this.paymentTypeObj = this.paymentTypes.find(p => p.id === id) || null;
    }

    //counter popup
    counters = [] as Array<COUNTERS>;
    public selectedCounter: any = null;
    counterObj: any = null;
    public counterColumns = [
        { field: 'id', header: 'ID', width: 60 },
        { field: 'machineName', header: 'Machine Name', width: 160 },
        { field: 'counterCode', header: 'Counter Code', width: 130 },
        { field: 'counterName', header: 'Counter Name', width: 150 },
        { field: 'machineIp', header: 'Machine IP', width: 140 }
    ];
    onCounterSelect(event: any) {
        this.counterObj = event.itemData;
    }

    //user popup
    users = [] as Array<USERS>;
    public selectedUser: any = null;
    userObj: any = null;
    public userColumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'username', header: 'Username', width: 120 },
        { field: 'firstName', header: 'First Name', width: 140 },
        { field: 'lastName', header: 'Last Name', width: 140 },
        { field: 'emailId', header: 'Email', width: 180 },
        { field: 'mobileNumber', header: 'Mobile No', width: 150 }
    ];

    onUserSelect(event: any) {
        this.userObj = event.itemData;
    }

    //branch dropdown
    branches: BRANCHES[] = [];

    selectedBranchId: number | null = null;
    branchObj: any = null;

    branchFields = {
        text: 'company',
        value: 'id'
    };
    onBranchChange(event: any) {
        const branchId = event.value; // selected ID

        this.branchObj = this.branches.find(
            b => b.id === branchId
        ) ?? null;
    }

    cleanObj(obj: any) {
        if (!obj) {
            return {
                id: null,
                name: null,
                code: null,
                description: null
            };
        }

        return {
            id: obj.id,
            name: null,
            code: null,
            description: null
        };
    }

    onClickClear() {
        const fromDate = this.generalRegisterForm.get('from')?.value;
        const toDate = this.generalRegisterForm.get('to')?.value;

        // Reset entire form
        this.generalRegisterForm.reset();

        // Restore dates
        this.generalRegisterForm.patchValue({
            from: fromDate,
            to: toDate,
            selectedView: 'inventory' // optional: default view
        });

        // Clear selected objects
        this.baseTypeObj = null;
        this.voucherTypeObj = null;
        this.customerSupplierObj = null;
        this.itemObj = null;
        this.staffObj = null;
        this.areaObj = null;
        this.paymentTypeObj = null;
        this.counterObj = null;
        this.userObj = null;
        this.branchObj = null;

        // Clear grids
        this.reportData = [];
        this.leftSummaryData = [];
    }

    selectedView: string = "inventory";
    reportData: any[] = [];
    public gridColumns: any[] = [];

    financeColumns = [
        { headerText: 'Particulars', field: 'particulars', width: 350 },
        { headerText: 'Debit', field: 'debit', width: 150, textAlign: 'Right' },
        { headerText: 'Credit', field: 'credit', width: 150, textAlign: 'Right' }
    ];

    inventoryColumns = [
        { headerText: 'VType', field: 'VType', width: 140 },
        { headerText: 'VNo', field: 'VNo', width: 200 },
        { headerText: 'Particulars', field: 'Particulars', width: 490 },

        { headerText: 'Debit', field: 'Debit', width: 160, textAlign: 'Right' },
        { headerText: 'Credit', field: 'Credit', width: 160, textAlign: 'Right' },

        { headerText: 'Added Date', field: 'VDate', width: 150 },
        { headerText: 'Reference No', field: 'ReferenceNo', width: 170 },
        { headerText: 'Tax Form', field: 'TaxFormID', width: 150 },
        { headerText: 'Mode', field: 'ModeID', width: 130 },

        { headerText: 'Counter', field: 'CounterName', width: 180 },
        { headerText: 'Customer', field: 'Customer', width: 180 },
        { headerText: 'Phone', field: 'PhNo', width: 150 },
        { headerText: 'Staff', field: 'Staff', width: 180 },
        { headerText: 'Area', field: 'Area', width: 180 },
        { headerText: 'VAT No', field: 'VATNO', width: 180 },
        { headerText: 'Party Inv No', field: 'PartyInvNo', width: 200 }
    ];

    onClickGo() {
        const formValue = this.generalRegisterForm.value;

        const payload = {
            viewBy: formValue.selectedView === 'inventory' ? true : false,
            from: formValue.from,
            to: formValue.to,
            baseType: this.cleanObj(this.baseTypeObj),
            voucherType: this.cleanObj(this.voucherTypeObj),
            customerSupplier: this.cleanObj(this.customerSupplierObj),
            item: this.cleanObj(this.itemObj),
            staff: this.cleanObj(this.staffObj),
            area: this.cleanObj(this.areaObj),
            paymentType: this.cleanObj(this.paymentTypeObj),
            counter: this.cleanObj(this.counterObj),
            user: this.cleanObj(this.userObj),
            branch: this.cleanObj(this.branchObj),

            invoiceNo: formValue.invoiceNo,
            batchNo: formValue.batchNo,

            columnar: formValue.columnar,
            detailed: formValue.detailed,
            inventory: formValue.inventory,
            groupItem: formValue.groupItem
        };

        console.log("Payload:", JSON.stringify(payload, null, 2));

        this.httpService
            .post(EndpointConstant.FETCHPUREPORT, payload)
            .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
            .subscribe({
                next: (response: any) => {

                    this.reportData = Array.isArray(response.data) ? response.data : [];
                    console.log("data:" + JSON.stringify(this.reportData, null, 2))
                    this.gridColumns =
                        formValue.selectedView === 'inventory'
                            ? this.inventoryColumns
                            : this.financeColumns;

                    this.setLeftSideData(this.reportData);
                },
                error: () => {
                    this.reportData = [];
                    this.leftSummaryData = [];
                }
            });
    }

    /********summary grid******* */
    leftGridDebitCash = 0;
    leftGridCreditCash = 0;
    leftGridDebitCredit = 0;
    leftGridCreditCredit = 0;
    leftGridDebitTotal = 0;
    leftGridCreditTotal = 0;
    leftSummaryData: LeftSummaryRow[] = [];


    setLeftSideData(reportInfo: any[]) {
        console.log("cashId" + this.cashId);
        console.log("creditId" + this.creditId);
        this.leftSummaryData = [];

        if (!Array.isArray(reportInfo) || reportInfo.length === 0) {
            return;
        }

        const formValue = this.generalRegisterForm.value;
        const isInventory = formValue.selectedView === 'inventory';
        console.log("inventory:" + isInventory)

        // ---------------- INVENTORY VIEW ----------------
        if (isInventory) {

            let cashDebit = 0;
            let cashCredit = 0;
            let creditDebit = 0;
            let creditCredit = 0;
            let totalDebit = 0;
            let totalCredit = 0;

            reportInfo.forEach(item => {

                const modeId = Number(item.ModeID);
                const debit = Number(item.Debit || 0);
                const credit = Number(item.Credit || 0);

                totalDebit += debit;
                totalCredit += credit;

                if (modeId === Number(this.cashId)) {
                    cashDebit += debit;
                    cashCredit += credit;
                }

                if (modeId === Number(this.creditId)) {
                    creditDebit += debit;
                    creditCredit += credit;
                }
            });

            this.leftSummaryData = [
                { particulars: 'Cash', debit: cashDebit, credit: cashCredit },
                { particulars: 'Credit', debit: creditDebit, credit: creditCredit },
                { particulars: 'Total', debit: totalDebit, credit: totalCredit }
            ];
            //console.log("left summary"+JSON.stringify(this.leftSummaryData,null,2))
            return;
        }

        // ---------------- FINANCE VIEW ----------------


        const totalDebit = reportInfo.reduce(
            (a, b) => !b.isGroup ? a + Number(b.debit || 0) : a, 0
        );

        const totalCredit = reportInfo.reduce(
            (a, b) => !b.isGroup ? a + Number(b.credit || 0) : a, 0
        );

        this.leftSummaryData = [
            { particulars: 'Total', debit: totalDebit, credit: totalCredit }
        ];
        console.log("left summary" + JSON.stringify(this.leftSummaryData, null, 2))
    }

//-----------pdf generation----------------

    onPreviewPdf(): void {

        if (!this.reportData.length) return;

        const isInventory = this.generalRegisterForm.value.selectedView === 'inventory';

        const pdfData: PdfReportData = {
            pageName: 'General Register',
            companyName: this.branchObj?.company || '',
            address: this.branchObj?.address || '',
            fromDate: this.generalRegisterForm.value.from.toLocaleDateString('en-GB'),
            toDate: this.generalRegisterForm.value.to.toLocaleDateString('en-GB'),

            columns: isInventory ? this.inventoryPdfColumns() : this.financePdfColumns(),
            rows: this.reportData,

            showTotals: true
        };

        this.pdfService.preview(pdfData);
    }

    private inventoryPdfColumns(): PdfColumn[] {
        return [
            { header: 'VType', field: 'VType' },
            { header: 'VNo', field: 'VNo' },
            { header: 'VATNo', field: 'VATNO' },
            { header: 'Name', field: 'Particulars' },
            { header: 'Debit', field: 'Debit', align: 'right' },
            { header: 'Credit', field: 'Credit', align: 'right' }
            
        ];
    }


    private financePdfColumns(): PdfColumn[] {
        return [
            { header: 'Particulars', field: 'particulars' },
            { header: 'Debit', field: 'debit', align: 'right' },
            { header: 'Credit', field: 'credit', align: 'right' }
        ];
    }


}