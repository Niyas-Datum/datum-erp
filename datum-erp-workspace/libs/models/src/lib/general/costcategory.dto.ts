  export interface COSTCATEGORIES {
      id: number;
      name: string;
      description: string;
  }

  export interface COSTCATEGORY {
    id: number;
    name: string;
    description: string;
    allocateRevenue: boolean;
    allocateNonRevenue: boolean;
    active: boolean;
}

