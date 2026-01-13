

export interface BasicUnitDto {
    id: number;
    unit: string;
    factor: number;
  }

   export interface UnitMAstersDto {
    unit: string;
    description: string;    
  }

    export interface UnitMasterByIdDto{
    unit: string;
    description: string;
    factor: number;
    isComplex: boolean;
    basicUnit: string;
    allowDelete: boolean;
    precision: number;
    active: boolean;
    arabicName: string;    
  }