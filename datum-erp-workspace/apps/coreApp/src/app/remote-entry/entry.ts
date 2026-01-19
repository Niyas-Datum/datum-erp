import { Component, inject, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { MenuItemDto, ShortcutMenuDto } from '@org/models';
import { AppHeaderComponent, HeaderComponent } from '@org/ui';
import { DataSharingService, LocalStorageService } from '@org/services'; 
import { CoreService } from '../../services/core.service';
import { firstValueFrom } from 'rxjs';
import { EndpointConstant } from '@org/constants';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-coreApp-entry',
  standalone: false,
  
  template: `
  <div class="app-shell">
  <app-header class="app-header"></app-header>
  <main class="app-content" >

     <router-outlet></router-outlet> 
    
    </main>
     </div>


`,
})
export class RemoteEntry  { 

  localStorageService = inject(LocalStorageService);
  coreservice = inject(CoreService);

    private menuItems = [] as MenuItemDto[];
          private datasharingService = inject(DataSharingService);
              private route = inject(ActivatedRoute);


  constructor() {
    if (this.datasharingService.sharedData && this.datasharingService.sharedData.length > 0) {
      this.localStorageService.setLocalStorageItem('menuItems', this.datasharingService.sharedData);
    } else {
      // Do not clear menuItems if sharedData is empty or undefined
    //  console.log(this.localStorageService.getItem('menuItems'));
    }
    if(this.localStorageService.getLocalStorageItem('shortcutMenu')){
      this.menuItems = JSON.parse(this.localStorageService.getLocalStorageItem('shortcutMenu') || '[]');
    } else {  
            this.fetchSecondaryMenu();
    }

     
  }

 
    async fetchSecondaryMenu() {
    try {
       await this.coreservice.fetch<ShortcutMenuDto>(EndpointConstant.FILLSHORTCUTMENU).subscribe({
          next: (data) =>{ 
            this.localStorageService.setLocalStorageItem('shortcutMenu', JSON.stringify(data.data));
            console.log('Secondary menu data:', data); },
          error: (err) => {
            console.error('Error fetching secondary menu', err);
          },
          complete: () => {
            console.log('Secondary menu fetched successfully');
          }
        })
     

     
    } catch (err) {
      console.error('Error fetching secondary menu', err);
    }
   
  }
}
