export class MenuItemDto {
  id: number;
  menuText: string;
  menuValue: string;
  url: string;
  parentID: number;
  isPage: number;
  voucherID?: number | null;
  shortcutKey?: string | null;
  toolTipText: string;
  isView?: number | null;
  isCreate?: number | null;
  isCancel?: number | null;
  isApprove?: number | null;
  isEditApproved?: number | null;
  isHigherApprove?: number | null;
  isPrint?: number | null;
  isEMail?: number | null;
  isEdit?: number | null;
  isDelete?: number | null;
  submenu: MenuItemDto[];

  constructor(data: any) {
    this.id = data.id;
    this.menuText = data.menuText;
    this.menuValue = data.menuValue;
    this.url = data.url;
    this.parentID = data.parentID;
    this.isPage = data.isPage;
    this.voucherID = data.voucherID;
    this.shortcutKey = data.shortcutKey;
    this.toolTipText = data.toolTipText;
    this.isView = data.isView;
    this.isCreate = data.isCreate;
    this.isCancel = data.isCancel;
    this.isApprove = data.isApprove;
    this.isEditApproved = data.isEditApproved;
    this.isHigherApprove = data.isHigherApprove;
    this.isPrint = data.isPrint;
    this.isEMail = data.isEMail;
    this.isEdit = data.isEdit;
    this.isDelete = data.isDelete;
    this.submenu = (data.submenu || []).map((item: any) => new MenuItemDto(item));
  }
}