export interface GridSettingsModel {
    id: number;
    formName: string;
    gridName: string;
    columnName: string;
    originalCaption: string | null;
    newCaption: string | null;
    visible: boolean;
    pageId: number|null;
    page: string;
    arabicCaption: string | null;
  }

    export interface GridSettingsSaveModel {
    id: number;
    formName: {
      name: string;
    };
    gridName: string;
    columnName: string;
    originalCaption: string;
    newCaption: string;
    pageId: number;
    page: string;
    arabicCaption: string;
    visible: boolean;
  }