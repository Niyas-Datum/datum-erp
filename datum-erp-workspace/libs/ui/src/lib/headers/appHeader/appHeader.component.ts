import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import {
  MenuModule,
  FieldSettingsModel,
  MenuComponent,
  BeforeOpenCloseMenuEventArgs,
  MenuItemModel,
  MenuAnimationSettingsModel,
  MenuEventArgs,
} from '@syncfusion/ej2-angular-navigations';
import { ListViewModule } from '@syncfusion/ej2-angular-lists';
import { ToolbarModule } from '@syncfusion/ej2-angular-navigations';
  import { MenuService } from './../menu.service';

import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { DropDownButtonModule } from '@syncfusion/ej2-angular-splitbuttons';
import { Router } from '@angular/router';
import { AppHeaderMobileView } from './app-Header-MobileView/app-Header-MobileView';
import { DataSharingService } from '@org/services';
// Extend MenuItemModel to include m_id
interface CustomMenuItemModel extends MenuItemModel {
  m_id?: number;
}



@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MenuModule,
    ButtonModule,
    DropDownButtonModule,
    ListViewModule,
    AppHeaderMobileView,
    ToolbarModule,
  ],
  templateUrl: './appHeader.component.html',
  styleUrls: ['./appHeader.component.scss'],
})
export class AppHeaderComponent implements OnInit {
  @ViewChild('menu')
  public menuObj!: MenuComponent;
  router = inject(Router);
  menuService = inject(MenuService);
  datasharingService = inject(DataSharingService);
  menuItems: any[] = [];
  shortCutMenuItems: any[] = [];
  userName = signal<string>('');

  ngOnInit() {
    this.menuItems = this.menuService.getMenuDataWithMId();

    this.shortCutMenuItems = this.menuService.getShortCutMenuItems();

    this.userName.set(localStorage.getItem('username') || '');
  }
  public animationSettings: MenuAnimationSettingsModel = {
    effect: 'FadeIn',
    duration: 600,

    // easing: 'ease-in-out'
  };
  public menuFields: FieldSettingsModel = {
    text: ['menuText'],
    children: ['submenu'],
  };
  onBeforeOpen(args: BeforeOpenCloseMenuEventArgs): void {
   
    const parentItem = args.parentItem as CustomMenuItemModel;

    // if (parentItem.m_id == 189) {
    //   (close(args.element, '.e-menu-wrapper') as HTMLElement).style.height =
    //     '600px';
   
    // }
  }
  onMenuSelect(args: MenuEventArgs) {
    args.event?.preventDefault();

    const item = args.item as any; // the menu model object
    const hasChildren = Array.isArray(item.submenu) && item.submenu.length > 0;

    if (hasChildren) {
      // stop anchor navigation for parent items — allow submenu expand
     // args.event?.preventDefault();
      return; // don't navigate
    }

    // Leaf node clicked — navigate (or let default anchor work)
    if (item.url) {
      this.router.navigateByUrl(item.url);
     

    }
   
  }

  onClicked(args: any) {
   

    // Check if this is a dropdown arrow click (not a toolbar item click)
    if (args.originalEvent) {
      const clickedElement = args.originalEvent.target;
      const isDropdownArrow =
        clickedElement.classList.contains('e-toolbar-popup') ||
        clickedElement.closest('.e-toolbar-popup') ||
        clickedElement.classList.contains('e-dropdown-btn') ||
        clickedElement.closest('.e-dropdown-btn');

      if (isDropdownArrow) {
       
        return; // Don't try to navigate for dropdown clicks
      }
    }

    // Handle different possible event structures for actual toolbar items
    let item = null;

    // Check if it's a Syncfusion toolbar event
    if (args.item) {
      item = args.item;
    } else if (args.originalEvent) {
      // Handle DOM click event
      const clickedElement = args.originalEvent.target;
      const toolbarItem = clickedElement.closest('.e-toolbar-item');
      if (toolbarItem) {
        const itemIndex = Array.from(toolbarItem.parentNode.children).indexOf(
          toolbarItem
        );
        if (itemIndex >= 0 && itemIndex < this.shortCutMenuItems.length) {
          item = this.shortCutMenuItems[itemIndex];
        }
      }
    } else if (args.target) {
      // Handle direct click on toolbar item
      const toolbarItem = args.target.closest('.e-toolbar-item');
      if (toolbarItem) {
        const itemIndex = Array.from(toolbarItem.parentNode.children).indexOf(
          toolbarItem
        );
        if (itemIndex >= 0 && itemIndex < this.shortCutMenuItems.length) {
          item = this.shortCutMenuItems[itemIndex];
        }
      }
    }

   
    if (item && item.url) {
      // Navigate using Angular router
      this.router.navigateByUrl(item.url);

    } else {
      console.log(
        
      );
      
    }
 
  }


  
  onDropdownItemSelect(args: any): void {
    if (args.item.id === 'logout') {
      this.menuService.onLogout();
    }
  }
  


  
}
