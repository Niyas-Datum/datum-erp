import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MenuItemDto } from '@org/models';

@Injectable({
  providedIn: 'root'
})

export class MenuDataService {


  // NEW CHANGES : Octobar  2025
     findMenuItemByUrl(menuItems: MenuItemDto[], targetUrl: string): MenuItemDto | null {
          for (const item of menuItems) {
            if (item.url === targetUrl) {
              return item;
            }
            if (item.submenu && item.submenu.length > 0) {
                const found = this.findMenuItemByUrl(item.submenu, targetUrl);
                if (found) {
                  return found;
                }
            }
          }
          return null;
        }



// END CHNAGE

  
  findMenu(items: any[], menuId: string): any | null {
    for (const item of items) {
      if (item.id === menuId) {
        return item;
      }
      if (item.submenu && item.submenu.length > 0) {
        const found = this.findMenu(item.submenu, menuId);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  }

  menuData: any;

  constructor(private httpClient: HttpClient) {}

  checkIsViewPermission(menuId:any){
    this.menuData = this.getMenuDataFromStorage(menuId);
    console.log(this.menuData['isView']);
    if(this.menuData && this.menuData['isView']){
      return true;
    } else{
      return false;
    }
  }
  getMenuDataFromStorage(menuId:any){
    let menuItems:any = localStorage.getItem('menuData');
    if(menuItems){
      menuItems = JSON.parse(menuItems);
    } else{
      return null;
    }

    return this.findMenu(menuItems, menuId);
  }


  

  
}