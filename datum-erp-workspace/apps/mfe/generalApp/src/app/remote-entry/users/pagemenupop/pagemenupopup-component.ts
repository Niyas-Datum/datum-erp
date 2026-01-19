import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { EndpointConstant } from '@org/constants';
import { TreeView } from '@syncfusion/ej2-angular-navigations';
import { GeneralAppService } from '../../http/general-app.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseComponent } from '@org/architecture';

@Component({
  selector: 'app-pagemenu-popoup',
  templateUrl: './pagemenupopup-component.html',
  standalone: false,
})
export class PageMenuPopUpComponent extends BaseComponent implements OnInit {

  @ViewChild('leftTree') leftTree!: TreeView;
  @ViewChild('rightTree') rightTree!: TreeView;
  private httpService = inject(GeneralAppService);

  originalLeftData: any[] = [];
  originalRightData: any[] = [];
   treeViewFields: any = {
      dataSource: [],
      id: 'id',
      text: 'text',
      child: 'subItems',
      iconCss: 'iconCss'
    };

  leftTreeFields = {
    dataSource: [],
    id: 'id',
    text: 'text',
    parentID: 'parentId',
    hasChildren: 'hasChildren'
  };

  rightTreeFields = { ...this.leftTreeFields };

  ngOnInit(): void {
   this.loadInitialData();
  }

    loadInitialData(): void {
     this.httpService.fetch<any>(EndpointConstant.FILLPAGEMENU)
    .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (res) => {
          const modules = res?.data?.modules ?? [];
          const groups = res?.data?.groups ?? [];
  
          const tree = this.buildTreeStructure(modules, groups);
  
          this.treeViewFields = {
            ...this.treeViewFields,
            dataSource: tree
          };
        },
        error: err => console.error(err)
      });
  }
   private buildTreeStructure(modules: any[], groups: any[]): any[] {
  if (!modules || !groups) {
    return [];
  }

  const moduleMap = new Map<string, any>();

  // 1️⃣ Create module root nodes
  modules.forEach(module => {
    moduleMap.set(module.name, {
      id: module.id,
      text: module.name,
      iconCss: 'tree-folder-icon',
      subItems: []
    });
  });

  // 2️⃣ Attach groups under correct module
  groups.forEach(group => {
    const parts = group.menuValue.split('-').map((x: string) => x.trim());
    if (parts.length !== 2) return;

    const groupName = parts[0];
    const moduleName = parts[1];

    const parent = moduleMap.get(moduleName);
    if (parent) {
      parent.subItems.push({
        id: group.id,
        text: groupName,
        iconCss: 'tree-file-icon'
      });
    }
  });

  // 3️⃣ Return only modules that have children
  return Array.from(moduleMap.values())
    .filter(m => m.subItems.length > 0);
}

  /* ---------------- SEARCH ---------------- */

  searchLeft(event: any): void {
   
  }

  searchRight(event: any): void {
   
  }

  /* ---------------- ACTIONS ---------------- */

  activateForms(): void {
  
  }

  markFrequentlyUsed(): void {
    
  }
}
