export interface PDesignationByIdModel {
    
    id: number;
    name: string;
    createdBranchID: number;
    company: string;
    createdBy: number;
    createdOn: Date;
    activeFlag: number;
}

export interface PDesignationModel {
    id: number;
    name: string;
}
