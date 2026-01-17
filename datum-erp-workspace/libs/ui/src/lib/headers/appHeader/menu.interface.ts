export interface MenuItem {
    id: number;
    menuText: string;
    menuValue: string;
    url: string;
    toolTipText: string;
  
    parentID: number;
    voucherID: number | null;
    shortcutKey: string | null;
  
    isPage: number;
    isView: boolean | null;
    isCreate: boolean | null;
    isCancel: boolean | null;
    isApprove: boolean | null;
    isEditApproved: boolean | null;
    isHigherApprove: boolean | null;
    isPrint: boolean | null;
    isEMail: boolean | null;
    isEdit: boolean | null;
    isDelete: boolean | null;
  
    submenu: MenuItem[];
  }
  
  export interface ShortcutMenuItem {
    id: number;
    menuText: string;
    url: string;
    voucherId: number | null;
  }