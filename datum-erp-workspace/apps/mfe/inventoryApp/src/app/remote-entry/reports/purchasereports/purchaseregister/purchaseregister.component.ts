import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@org/architecture";
import { InventoryAppService } from "../../../http/inventory-app.service";
import { LocalStorageService } from "@org/services";
import { EndpointConstant } from "@org/constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AREA, BASICTYPE, BRANCHES, COUNTERS, CUSTOMERSUPPLIER, ITEMS, PAYMENTTYPE, STAFF, USERS, VOUCHERTYPE } from "../../model/generalregister.model";
import { PdfGenerationService } from "../../common/pdfgeneration.service";
import { PdfColumn, PdfReportData } from "../../model/pdfgeneration.model";
import { GridComponent,ExcelExportService } from "@syncfusion/ej2-angular-grids";

interface LeftSummaryRow {
    particulars: string;
    debit: number;
    credit: number;
}
@Component({
    selector: 'app-purchaseregister-Main',
    standalone: false,
    templateUrl: './purchaseregister.component.html',

})


export class PurchaseRegisterComponent extends BaseComponent implements OnInit {

 @ViewChild('grid') grid!: GridComponent;
    onSearch(event: any) {
        const searchText = event.target.value;

        if (this.grid) {
            this.grid.search(searchText);
        }
    }

    fromDate!: Date;
    toDate!: Date;
    purchaseRegisterForm!: FormGroup;
    private httpService = inject(InventoryAppService);
    private pdfService = inject(PdfGenerationService);

    isLoading = signal(false);
    isInputDisabled = true;
    isActive: unknown;
    currentid = signal(0);
    cashId: any = 0;
    creditId: any = 0;

    currentBranch = signal<number>(1);
    currentUser = signal<number>(1);
    private localstorageService = inject(LocalStorageService);

    basicTypesarr: BASICTYPE[] = [];

    voucherTypesarr = [] as Array<VOUCHERTYPE>;
    public selectedVoucherType: any = null;
    voucherTypeObj: any = null;

    allVoucherTypes: VOUCHERTYPE[] = [];
   allVoucherTypesarr: VOUCHERTYPE[] = [];
   baseTypeObj: any = null;

    public voucherTypeColumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'code', header: 'Code', width: 90 },
        { field: 'name', header: 'Name', width: 200 }
    ];

    customerSupplierArr = [] as Array<CUSTOMERSUPPLIER>;
    public selectedCustSupplType: any = null;
    customerSupplierObj: any = null;
    public customerSupplierTypeColumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'accountCode', header: 'Account Code', width: 90 },
        { field: 'accountName', header: 'Account Name', width: 200 }
    ];

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

    staffArr = [] as Array<STAFF>;
    public selectedStaff: any = null;
    staffObj: any = null;
    public staffColumns = [
        { field: 'id', header: 'ID', width: 70 },
        { field: 'code', header: 'Account Code', width: 90 },
        { field: 'name', header: 'Account Name', width: 90 }
    ];

    selectedStaffId: number | null = null;

    areaArr = [] as Array<AREA>;
    public selectedArea: any = null;
    areaObj: any = null;
    public areaColumns = [

        { field: 'code', header: 'Code', width: 100 },
        { field: 'name', header: 'Name', width: 200 }
    ];

    selectedAreaId: number | null = null;

    paymentTypes = [] as Array<PAYMENTTYPE>;
    selectedPayment: any = null;
    paymentTypeObj: any = null;

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

    branches: BRANCHES[] = [];

    selectedBranchId: number | null = null;
    branchObj: any = null;

    branchFields = {
        text: 'company',
        value: 'id'
    };

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
        { headerText: 'VDate', field: 'VDate', width: 200 },
        { headerText: 'Particulars', field: 'Particulars', width: 420 },

        { headerText: 'Debit', field: 'Debit', width: 160, textAlign: 'Right' },
        { headerText: 'Credit', field: 'Credit', width: 160, textAlign: 'Right' },

        { headerText: 'Added Date', field: 'AddedDate', width: 150 },
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

    leftGridDebitCash = 0;
    leftGridCreditCash = 0;
    leftGridDebitCredit = 0;
    leftGridCreditCredit = 0;
    leftGridDebitTotal = 0;
    leftGridCreditTotal = 0;
    leftSummaryData: LeftSummaryRow[] = [];

    ngOnInit(): void {
        this.purchaseRegisterForm = new FormGroup({
            from: new FormControl(null, Validators.required),
            to: new FormControl(null, Validators.required),
            selectedView: new FormControl('inventory'),
            basicType: new FormControl("Purchase"),

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
        this.purchaseRegisterForm.patchValue({
            from: new Date()
        });
        this.purchaseRegisterForm.patchValue({
            to: new Date()
        });
        this.SetPageType(3);
        this.fetchAllFilterMasterData();

    }

    setCashCreditID() {
        // Find IDs for "Cash" and "Credit" payment types
        console.log("payment types:" + JSON.stringify(this.paymentTypes, null, 2))
        this.cashId = this.paymentTypes.find(payment => payment.name === "Cash")?.id;
        this.creditId = this.paymentTypes.find(payment => payment.name === "Credit")?.id;

    }

    /*Getting data for filters*/
   fetchAllFilterMasterData(): void {
    this.httpService
        .fetch(EndpointConstant.FILLGENERALREGISTERMASTERFILTER)
        .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
        .subscribe({
            next: (response) => {
 
                let filterMasterData: any = response?.data;
 
                // Assign all master data
                this.basicTypesarr = filterMasterData.basicTypes || [];
                this.allVoucherTypesarr = filterMasterData.voucherTypes || []; 
                this.itemsArr = filterMasterData.items || [];
                this.staffArr = filterMasterData.staffs || [];
                this.customerSupplierArr = filterMasterData.customerSupplier || [];
                this.areaArr = filterMasterData.areas || [];
                this.paymentTypes = filterMasterData.paymentTypes || [];
                this.counters = filterMasterData.counters || [];
                this.users = filterMasterData.users || [];
                this.branches = filterMasterData.branches || [];
 
                //  Filter ONLY "Purchase" voucher types
                const purchaseBasicType = this.basicTypesarr.find(
                    b => b.name === 'Purchase'
                );
 
                if (purchaseBasicType) {
                    const basicTypeId = purchaseBasicType.id;
 
                    this.baseTypeObj = purchaseBasicType;
 
                    this.voucherTypesarr = this.allVoucherTypesarr.filter(
                        v => Number(v.primaryVoucherId) === Number(basicTypeId) // change if needed
                    );
                } else {
                    this.voucherTypesarr = [];
                }
 
                // Set form values
                const savedBranchId = Number(this.localstorageService.getLocalStorageItem('current_branch'));
                const userId = Number(this.localstorageService.getLocalStorageItem('current_user'));
 
                this.currentBranch.set(savedBranchId);
                this.currentUser.set(userId);
 
                this.purchaseRegisterForm.patchValue({
                    branch: savedBranchId,
                    user: userId,
                    basicType: 'Purchase' // since readonly textbox
                });
 
                //  Set selected objects
                this.branchObj = this.branches.find(b => b.id === savedBranchId) ?? null;
                this.userObj = this.users.find(u => u.id === userId) ?? null;
 
                //  Other setup
                this.setCashCreditID();
 
                // Debug (remove later)
                console.log('All Voucher Types:', this.allVoucherTypesarr);
                console.log('Filtered Purchase Voucher Types:', this.voucherTypesarr);
            },
            error: (error) => {
                console.error('An Error Occured', error);
            },
        });
}

    onVoucherTypeSelect(event: any) {
        this.voucherTypeObj = event.itemData;
    }
    onCustomerSelect(event: any) {
        this.customerSupplierObj = event.itemData;
    }
    onItemSelect(event: any) {
        this.itemObj = event.itemData;
    }
    onStaffSelect(event: any) {
        this.staffObj = event.itemData;
    }
    onAreaSelect(event: any) {
        this.areaObj = event.itemData;
    }
    onPaymentTypeChange(event: any) {
        const id = event.value;
        this.paymentTypeObj = this.paymentTypes.find(p => p.id === id) || null;
    }
    onCounterSelect(event: any) {
        this.counterObj = event.itemData;
    }
    onUserSelect(event: any) {
        this.userObj = event.itemData;
    }
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
        const fromDate = this.purchaseRegisterForm.get('from')?.value;
        const toDate = this.purchaseRegisterForm.get('to')?.value;

        // Reset entire form
        this.purchaseRegisterForm.reset();

        // Restore dates
        this.purchaseRegisterForm.patchValue({
            from: fromDate,
            to: toDate,
            selectedView: 'inventory'
        });

        // Clear selected objects
        // this.baseTypeObj = null;
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

        this.purchaseRegisterForm.patchValue({                   
                    basicType: 'Sales Invoice' // since readonly textbox
                });
    }

    safeObj(obj: any, controlValue: any) {
        return (controlValue && obj) ? this.cleanObj(obj) : this.cleanObj(null);
    }

    onClickGo() {
        const formValue = this.purchaseRegisterForm.value;

        const payload = {
            viewBy: formValue.selectedView === 'inventory',

            from: formValue.from,
            to: formValue.to,

            baseType: { id: 17 },
            voucherType: this.safeObj(this.voucherTypeObj, formValue.voucherType),
            customerSupplier: this.safeObj(this.customerSupplierObj, formValue.customerSupplier),
            item: this.safeObj(this.itemObj, formValue.item),
            staff: this.safeObj(this.staffObj, formValue.staff),
            area: this.safeObj(this.areaObj, formValue.area),
            paymentType: this.safeObj(this.paymentTypeObj, formValue.paymentType),
            counter: this.safeObj(this.counterObj, formValue.counter),
            user: this.safeObj(this.userObj, formValue.user),
            branch: this.safeObj(this.branchObj, formValue.branch),

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

                    //this.reportData = Array.isArray(response.data) ? response.data : [];
                    this.reportData = (Array.isArray(response.data) ? response.data : []).map((x: any) => {

                        const spaces = (x.particulars?.match(/^\s*/) || [''])[0].length;

                        const formatDate = (val: any) => {

                            if (!val) return '';

                            // 👇 split date & time
                            const [datePart] = val.split(' '); // "26-03-2026"

                            const [day, month, year] = datePart.split('-');

                            if (!day || !month || !year) return '';

                            return `${day}/${month}/${year}`; // dd/MM/yyyy
                        };

                        return {
                            ...x,
                             VDate: formatDate(x.VDate),
                            AddedDate: formatDate(x.AddedDate),
                            debit: Number(x.debit || 0),
                            credit: Number(x.credit || 0),
                            level: Math.floor(spaces / 3)   // hierarchy level
                        };

                    });

                    console.log("data:" + JSON.stringify(this.reportData, null, 2))
                    this.gridColumns =
                        formValue.selectedView === 'inventory'
                            ? this.inventoryColumns
                            : this.financeColumns;

                    this.setLeftSideData(this.reportData);
                    if (formValue.selectedView === 'inventory') {

                        const totalRow = {
                            VType: '',
                            VNo: '',
                            VDate: '',
                            Particulars: '',
                            Debit: this.totalDebit,
                            Credit: this.totalCredit
                        };

                        this.reportData = [...this.reportData, totalRow];
                    }
                },
                error: () => {
                    this.reportData = [];
                    this.leftSummaryData = [];
                }
            });

    }

    setLeftSideData(reportInfo: any[]) {
        console.log("cashId" + this.cashId);
        console.log("creditId" + this.creditId);
        this.leftSummaryData = [];

        if (!Array.isArray(reportInfo) || reportInfo.length === 0) {
            return;
        }

        const formValue = this.purchaseRegisterForm.value;
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

            this.totalDebit = totalDebit;
            this.totalCredit = totalCredit;

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

    //-------------------pdf generation--------------------
    onPreviewPdf(): void {

        if (!this.reportData.length) return;

        const isInventory = this.purchaseRegisterForm.value.selectedView === 'inventory';

        const pdfData: PdfReportData = {
            pageName: 'Purchase Register',
            companyName: this.branchObj?.company || '',
            address: this.branchObj?.address || '',
            fromDate: this.purchaseRegisterForm.value.from.toLocaleDateString('en-GB'),
            toDate: this.purchaseRegisterForm.value.to.toLocaleDateString('en-GB'),

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

    totalDebit = 0;
    totalCredit = 0;
    onRowBound(args: any) {

        if (args.data?.Particulars === '') {
            args.row.style.fontWeight = 'bold';
            args.row.style.background = '#f3f3f3';
        }
        if (args.data?.isGroup === true) {

            args.row.style.fontWeight = "bold";
            args.row.style.background = "#f5f5f5";

        }

    }
     //excel

    excelColumns: any[] = [];
    showExcelFields = false;

    openExcelFields() {
    this.excelColumns = this.gridColumns.map(col => ({
        field: col.field,
        headerText: col.headerText,
        checked: true
    }));

    this.showExcelFields = true;
}
cancelExcel() {
    this.showExcelFields = false;
    this.excelColumns = [];
}

   exportToExcel() {

    if (!this.grid || !this.grid.columns) return;

    const selectedFields = this.excelColumns
        .filter(c => c.checked)
        .map(c => c.field);

    if (!selectedFields.length) {
        alert("Please select at least one field");
        return;
    }

    const exportColumns = (this.grid.columns as any[])
        .filter(col => selectedFields.includes(col.field));

    this.grid.excelExport({
        columns: exportColumns,
        fileName: 'PurchaseRegister.xlsx'
    });

    this.showExcelFields = false;
}
onExcelClick() {
    this.showExcelFields = true;

    this.excelColumns = this.gridColumns.map(col => ({
        field: col.field,
        headerText: col.headerText,
        checked: true
    }));
}
onExcelCheckboxChange(event: any, col: any) {
    col.checked = event.target.checked;
}
}