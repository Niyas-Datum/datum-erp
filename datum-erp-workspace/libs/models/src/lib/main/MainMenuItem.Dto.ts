export class MainMenuItemDto {
  id: number;
  menuText: string;
  menuValue: string;
  url: string;
  parentID: number;
  isPage: number;
  voucherID: number | null;
  shortcutKey: string | null;
  toolTipText: string;
  isView: number | null;
  isCreate: number | null;
  isCancel: number | null;
  isApprove: number | null;
  isEditApproved: number | null;
  isHigherApprove: number | null;
  isPrint: number | null;
  isEMail: number | null;
  isEdit: number | null;
  isDelete: number | null;
  submenu: MainMenuItemDto[];

  constructor(data: Partial<MainMenuItemDto>) {
    this.id = data.id ?? 0;
    this.menuText = data.menuText ?? '';
    this.menuValue = data.menuValue ?? '';
    this.url = data.url ?? '';
    this.parentID = data.parentID ?? 0;
    this.isPage = data.isPage ?? 0;
    this.voucherID = data.voucherID ?? null;
    this.shortcutKey = data.shortcutKey ?? null;
    this.toolTipText = data.toolTipText ?? '';
    this.isView = data.isView ?? null;
    this.isCreate = data.isCreate ?? null;
    this.isCancel = data.isCancel ?? null;
    this.isApprove = data.isApprove ?? null;
    this.isEditApproved = data.isEditApproved ?? null;
    this.isHigherApprove = data.isHigherApprove ?? null;
    this.isPrint = data.isPrint ?? null;
    this.isEMail = data.isEMail ?? null;
    this.isEdit = data.isEdit ?? null;
    this.isDelete = data.isDelete ?? null;
    this.submenu = (data.submenu ?? []).map(item => new MainMenuItemDto(item));
  }
}