export interface MenuPermission {
    id: number;
    menuValue: string;
    url: string;
    isPage: boolean;
    isView: boolean;
    isCreate: boolean;
    isEdit: boolean;
    isDelete: boolean;
    isCancel: boolean;
    isEditApproved: boolean;
    isHigherApproved: boolean;
    submenu: MenuPermission[];
  }
  
  export const EMPTY_MENU_PERMISSION: MenuPermission = {
    id: -1,
    menuValue: '',
    url: '',
    isPage: false,
    isView: false,
    isCreate: false,
    isEdit: false,
    isDelete: false,
    isCancel: false,
    isEditApproved: false,
    isHigherApproved: false,
    submenu: [],
  };
  
  export function isMenuPermission(obj: any): obj is MenuPermission {
    return obj &&
      typeof obj.id === 'number' &&
      typeof obj.menuValue === 'string' &&
      typeof obj.url === 'string' &&
      typeof obj.isPage === 'boolean' &&
      typeof obj.isView === 'boolean' &&
      typeof obj.isCreate === 'boolean' &&
      typeof obj.isEdit === 'boolean' &&
      typeof obj.isDelete === 'boolean' &&
      typeof obj.isCancel === 'boolean' &&
      typeof obj.isEditApproved === 'boolean' &&
      typeof obj.isHigherApproved === 'boolean' &&
      Array.isArray(obj.submenu) &&
      obj.submenu.every(isMenuPermission);
  }
  
  export function createMenuPermission(obj: any): MenuPermission {
    return {
      id: obj?.id ?? -1,
      menuValue: obj?.menuValue ?? '',
      url: obj?.url ?? '',
      isPage: !!obj?.isPage,
      isView: !!obj?.isView,
      isCreate: !!obj?.isCreate,
      isEdit: !!obj?.isEdit,
      isDelete: !!obj?.isDelete,
      isCancel: !!obj?.isCancel,
      isEditApproved: !!obj?.isEditApproved,
      isHigherApproved: !!obj?.isHigherApproved,
      submenu: Array.isArray(obj?.submenu)
        ? obj.submenu.map(createMenuPermission)
        : [],
    };
  }
  