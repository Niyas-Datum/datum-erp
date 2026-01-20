import { inject, Injectable, signal } from '@angular/core';
import { MenuItem, ShortcutMenuItem } from './appHeader/menu.interface';
import { firstValueFrom } from 'rxjs';
import { LocalStorageService } from '@org/services';
import { BaseService } from '@org/services';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private baseService = inject(BaseService);
  private localStore = inject(LocalStorageService);
  private router = inject(Router);
  rawMenu = signal<MenuItem[]>([]);
  shortcutMenuItems = signal<ShortcutMenuItem[]>([]);

  getMenuData(): MenuItem[] {
    const stored =
      localStorage.getItem('menuData') || localStorage.getItem('menuItems');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.rawMenu.set(parsed);
        }
      } catch {
        console.error('Error parsing menu data');
      }
    }

    return this.rawMenu();
  }
  getSHortCutMenu(): ShortcutMenuItem[] {
    const sMenu = localStorage.getItem('shortcutMenu');
   

    if (sMenu) {
          
      try {
        const parsed = JSON.parse(sMenu);
        console.log('sMenu parsed1', parsed.result);
      
        if (Array.isArray(parsed.result)) {
          this.shortcutMenuItems.set(parsed.result);
          
        }
      } catch {
        console.error('Error parsing shortcut menu data');
      }
      return this.shortcutMenuItems();
    }
    return [];
  }

  // Function to change id property to m_id in menu data
  changeIdToMId(menuItems: any[]): any[] {
    return menuItems.map((item) => {
      const { id, ...rest } = item;
      return {
        m_id: id,
        ...rest,
        submenu: item.submenu ? this.changeIdToMId(item.submenu) : [],
      };
    });
  }
  getMenuDataWithMId(): any[] {
    return this.changeIdToMId(this.getMenuData());
  }

  getShortCutMenuItems() {

    return this.getSHortCutMenu().map((sc) => ({
      m_id: sc.id,
      text: sc.menuText,
      tooltipText: sc.menuText,

      url: sc.url,
      voucherId: sc.voucherId,
    }));
  }
  async onLogout(): Promise<void> {
    this.localStore.clearLocalStorage();
    this.localStore.clearToken();
    await this.router.navigate(['/auth']);
    console.log('logout');
  }
  public userDropdown = [
    { text: 'Profile', url: '/profile' },
    { text: 'Settings', url: '/settings' },
    { text: 'Logout', id: 'logout' },
  ];
}
