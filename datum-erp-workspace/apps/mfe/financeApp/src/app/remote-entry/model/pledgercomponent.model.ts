export interface groupdataModel {
    id: number;
    name: string;
    
}
export class Subgroupdatamodel1 {
    id!: number;
    description!: string;
  }

    


    export class SubGroup {
        id!: number;
        description!: string;
      }
      
      export class subgroupdataModel {
        subgroup!: SubGroup[];
        nextCode!: string;
      }
