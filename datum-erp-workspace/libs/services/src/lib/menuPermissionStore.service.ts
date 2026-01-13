import { Injectable, signal, computed } from '@angular/core';
import {
  MenuPermission,
  createMenuPermission,
  isMenuPermission,
  EMPTY_MENU_PERMISSION,
} from '@org/models';

@Injectable({
  providedIn: 'root',
})
export class MenuPermissionStoreService {
  private currentMenu = signal<MenuPermission>(EMPTY_MENU_PERMISSION);

  /** Signal access to full menu */
  readonly menu = this.currentMenu.asReadonly();

  // Computed permission signals
  readonly isView = computed(() => this.currentMenu().isView);
  readonly isCreate = computed(() => this.currentMenu().isCreate);
  readonly isEdit = computed(() => this.currentMenu().isEdit);
  readonly isDelete = computed(() => this.currentMenu().isDelete);
  readonly isCancel = computed(() => this.currentMenu().isCancel);
  readonly isEditApproved = computed(() => this.currentMenu().isEditApproved);
  readonly isHigherApproved = computed(() => this.currentMenu().isHigherApproved);

  /**
   * Set permission by menu ID from localStorage
   */
  setMenuById(menuId: number): void {
    const raw = localStorage.getItem('menuData');
    if (!raw) {
      this.currentMenu.set(EMPTY_MENU_PERMISSION);
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.currentMenu.set(EMPTY_MENU_PERMISSION);
      return;
    }

    const menus: MenuPermission[] = Array.isArray(parsed)
      ? parsed.map(createMenuPermission)
      : [];

    const found = this.findMenu(menus, menuId);
    this.currentMenu.set(isMenuPermission(found) ? found : EMPTY_MENU_PERMISSION);
  }

  /**
   * Clear current permission
   */
  clear(): void {
    this.currentMenu.set(EMPTY_MENU_PERMISSION);
  }

  /**
   * Recursively find a menu by ID
   */
  private findMenu(menus: MenuPermission[], id: number): MenuPermission | null {
    for (const item of menus) {
      if (item.id === id) return item;
      if (item.submenu?.length) {
        const result = this.findMenu(item.submenu, id);
        if (result) return result;
      }
    }
    return null;
  }
}
