import { Component, inject, OnInit } from '@angular/core';
import { MenuService } from '../../menu.service';
import { FieldSettingsModel, MenuAnimationSettingsModel,  MenuEventArgs,  MenuModule, } from '@syncfusion/ej2-angular-navigations';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-header-mobile-view',
  imports: [MenuModule],
  templateUrl: './app-Header-MobileView.html',
  styleUrl: './app-Header-MobileView.scss',
})
export class AppHeaderMobileView implements OnInit {
  menuItems: any[] = [];
  private menuService = inject(MenuService);
  private router = inject(Router);
  ngOnInit(): void {
    this.menuItems = this.menuService.getMenuDataWithMId();
  }
  public menuFields: FieldSettingsModel = {
    text: ['menuText'],
    children: ['submenu'],
  };
  public animationSettings: MenuAnimationSettingsModel = {
    effect: 'FadeIn',
    duration:600,  
    // easing: 'ease-in-out'
  };
  onMenuSelect(args: MenuEventArgs) {
    const item = args.item as any;            // the menu model object
    const hasChildren = Array.isArray(item.submenu) && item.submenu.length > 0;
  
    if (hasChildren) {
      // stop anchor navigation for parent items — allow submenu expand
      args.event?.preventDefault();
      return; // don't navigate
    }
  
    // Leaf node clicked — navigate (or let default anchor work)
    if (item.url) {
      // prefer router for SPA apps
      this.router.navigateByUrl(item.url);
      // optionally close hamburger menu here if needed
      // (no built-in collapse API; you can toggle a wrapper or CSS to hide)
    }
  }
}
