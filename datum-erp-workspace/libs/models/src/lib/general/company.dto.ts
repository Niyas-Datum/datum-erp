export interface CompanyDto {
    id: number;
    code: string;
    name: string;
    databaseName: string;
    serverName: string;
    serverIp: string;
    isRemote: boolean;
    active: boolean;
    isDefault: boolean;
    userCompanies: any[];
    companySchedules: any[];
  }

  