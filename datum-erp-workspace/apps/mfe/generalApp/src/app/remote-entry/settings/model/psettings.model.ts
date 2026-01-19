
export interface PSystemSetting {
    id: number;
    key: string;
    value: string;
    description?: string;
    systemSetting?: boolean;
  }
  
  export interface PSettingsFormDataByIdModel {
    key: string;
    value: string;
    description: string;
    systemSetting: boolean;
  }
  