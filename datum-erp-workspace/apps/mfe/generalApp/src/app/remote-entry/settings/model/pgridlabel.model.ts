export interface GridLabelDto {
    id: number;
    formName: string;
    labelName: string;
    originalCaption: string | null;
    newCaption: string | null;
    visible: boolean;
    enable: boolean|null;
    pageId: number|null;
    arabicCaption: string | null;
  }
  export interface GridLabelDto1 {
              id: number;
              formName: string;
              pageID: number;
              labelName: string;
              originalCaption: string|null;
               newCaption: string|null;
              visible: boolean;
              arabicCaption: string|null;
              enable: boolean|null;
  }
  
  
  
  export interface GridLabelCreateDto {
    formName: string;
    labelName: string;
    originalCaption: string;
    newCaption: string;
    enable: boolean|null;
    pageId: number|null;
    visible: boolean;
    arabicCaption?: string;
  }
  
  export interface GridLabelUpdateDto {
    id: number;
    formName?: string;
    labelName?: string;
    originalCaption?: string;
    newCaption?: string;
    enable?: boolean|null;
    pageId?: number|null;
    visible?: boolean;
    arabicCaption?: string;
  }
  
  export interface GridLabelFilterDto {
    formName?: string;
    labelName?: string;
    visible?: boolean;
    searchTerm?: string;
  }
  
  export interface GridLabelSaveDto {
    id: number;
    formName: {
      name: string;
    };
    labelName: string;
    originalCaption: string;
    newCaption: string;
    pageId: number;
    arabicCaption: string;
    visible: boolean;
    enable: boolean;
  }