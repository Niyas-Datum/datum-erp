export interface Branches {
    isSelected: unknown;
    id: number;
    company: string;
    nature: string;
}

export interface PDepartmentModel {
    id: number;
    department: string;
}

export interface Department {
    id: number;
    departmentTypeID: number;
    departmentType: string;
    companyID: number;
    company: string;
    createdBy: number;
    createdOn: string;
    activeFlag:number;
}

export interface DepartmentPopup {
    id: number;
    name: string;
}
