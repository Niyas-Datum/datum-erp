import { AfterViewInit, Component, inject,OnInit, signal, ViewChild,} from '@angular/core';
import {FormControl,FormGroup, Validators } from '@angular/forms';
import { GeneralAppService } from '../../http/general-app.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EndpointConstant } from '@org/constants';
import { BaseComponent } from '@org/architecture';
import { firstValueFrom } from 'rxjs';
import { TreeViewComponent } from '@syncfusion/ej2-angular-navigations';
import { MaskedTextBoxComponent } from '@syncfusion/ej2-angular-inputs';
import { ActivatedRoute, Router } from '@angular/router';
import { MultiColumnComboBoxComponent } from '@syncfusion/ej2-angular-multicolumn-combobox';
import { DropDownList, DropDownListComponent } from '@syncfusion/ej2-angular-dropdowns';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';

@Component({
  selector: 'app-pagemenu-main',
  standalone: false,
  templateUrl: './pagemenu-component.html',
  styles: [],
})
 export class PageMenuComponent extends BaseComponent implements OnInit, AfterViewInit{
    // @ViewChild('accountCombo') accountCombo?: MultiColumnComboBoxComponent;
    //  @ViewChild('filterDropdown') filterDropdown!: DropDownList;
    // @ViewChild('treeviewObj', { static: false })
    // @ViewChild('pageMenuDialog') pageMenuDialog!: DialogComponent;
    @ViewChild('treeviewObj')
treeviewObj!: TreeViewComponent;

@ViewChild('maskObj')
maskObj?: MaskedTextBoxComponent;

@ViewChild('filterDropdown')
filterDropdown!: DropDownListComponent;

@ViewChild('accountCombo')
accountCombo?: MultiColumnComboBoxComponent;

@ViewChild('pageMenuDialog')
pageMenuDialog!: DialogComponent;
    
  showPopup = false;
  //  treeviewObj!: TreeViewComponent;
    fillaccountpopupData = signal<any[]>([]);
    chartOfAccountForm = this.formUtil.thisForm;
    private httpService = inject(GeneralAppService);
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
     pageMenuModules: any[] = [];
     pageMenuGroups: any[] = [];
    isLoading = signal<boolean>(false);
    editSettings = { allowEditing: false, allowAdding: false, allowDeleting: false };
    chartOfAccountData = signal<any[]>([]);
    treeData = signal<any[]>([]);
    selectedAccountId = 0;
    isUpdate = false;
    filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
  ];
    treeViewFields: any = {
      dataSource: [],
      id: 'id',
      text: 'text',
      child: 'subItems',
      iconCss: 'iconCss'
    };
    showIcon = true;
    activeTab = signal<string>('chartofaccounts');
   
    @ViewChild("treeviewObj") listTreeObj?: TreeViewComponent;
   // @ViewChild("maskObj") maskObj?: MaskedTextBoxComponent;
   
    constructor() {
        super();
        this.commonInit();
    }
   
    ngOnInit(): void {
      this.onInitBase();
      this.SetPageType(2);
      console.log("pageid",this.currentPageInfo?.menuText);
      this.loadInitialData();
    }
   
    ngAfterViewInit(): void {
      // Enable icons after view is initialized
      setTimeout(() => {
        if (this.listTreeObj) {
          (this.listTreeObj as any).showIcon = true;
          // Force refresh to apply icon settings
          try {
            this.listTreeObj.refresh();
          } catch (e) {
            console.log('Tree refresh in AfterViewInit:', e);
          }
        }
      }, 300);
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
  // Filter button click
  applyFilter() {
      const searchText = (this.maskObj?.element.value || '').trim();
    const filterType = this.filterDropdown?.value ?? 'all';

    const payload = {
      searchText,
      filterType
    };

    this.httpService.fetch(EndpointConstant.FILLALLPAGES).subscribe({
      next: (res: any) => {
        this.treeViewFields = {
          ...this.treeViewFields,
          dataSource: res.data
        };

        // Expand filtered result
        setTimeout(() => this.treeviewObj?.expandAll(), 100);
      },
      error: err => {
        console.error('Filter API error', err);
      }
    });
  }
 
    // private buildTreeStructure(data: any[]): any[] {
    //   if (!data || data.length === 0) {
    //     return [];
    //   }
 
    //   const itemMap = new Map<number, any>();
    //   const rootItems: any[] = [];
 
    //   // First pass: create map of all items with tree structure
    //   data.forEach(item => {
    //     // Format text as: [Code] Arabic Name / English Name
    //     const formattedText = this.formatTreeNodeText(item);
    //     // Set icon based on isGroup field - folder for groups, file for items
    //     const iconCss = item.isGroup === true ? 'tree-folder-icon' : 'tree-file-icon';
    //     const treeNode = {
    //       id: item.id,
    //       name: item.name,
    //       text: formattedText,
    //       alternateName: item.alternateName,
    //       alias: item.alias,
    //       iconCss: iconCss,
    //       isGroup: item.isGroup, // Preserve isGroup for reference
    //       subItems: [],
    //       ...item
    //     };
    //     // Debug: log icon assignment
    //     if (item.isGroup === true) {
    //       console.log('Folder icon assigned to:', item.name, 'iconCss:', iconCss);
    //     }
    //     itemMap.set(item.id, treeNode);
    //   });
 
    //   // Second pass: build tree structure based on parent field
    //   data.forEach(item => {
    //     const node = itemMap.get(item.id)!;
    //     const parentId = item.parent;
       
    //     if (parentId && parentId !== null && itemMap.has(parentId)) {
    //       // Has a parent, add to parent's subItems
    //       const parent = itemMap.get(parentId);
    //       if (parent) {
    //         if (!parent.subItems) {
    //           parent.subItems = [];
    //         }
    //         parent.subItems.push(node);
    //       }
    //     } else {
    //       // Root level item (parent is null)
    //       rootItems.push(node);
    //     }
    //   });
 
    //   // Sort root items by sortField if available
    //   rootItems.sort((a, b) => (a.sortField || 0) - (b.sortField || 0));
     
    //   // Sort subItems recursively
    //   this.sortTreeItems(rootItems);
 
    //   return rootItems;
    // }
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


    private formatTreeNodeText(item: any): string {
      const name = item.name || '';
      const alternateName = item.alternateName || '';
      const alias = item.alias || '';
     
      // Format: [Code] Arabic Name / English Name
      let formattedText = '';
     
      if (alias) {
        formattedText += `[${alias}] `;
      }
     
      if (alternateName) {
        formattedText += `${alternateName} / `;
      }
     
      formattedText += name;
     
      return formattedText;
    }
 
    private sortTreeItems(items: any[]): void {
      items.forEach(item => {
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.sort((a: any, b: any) => (a.sortField || 0) - (b.sortField || 0));
          this.sortTreeItems(item.subItems);
        }
      });
    }
 
    private updateTreeData(treeStructure: any[]): void {
      this.treeData.set(treeStructure);
     
      // Create new object reference to trigger change detection
      this.treeViewFields = {
        dataSource: [...treeStructure], // Create new array reference
        id: 'id',
        text: 'text',
        child: 'subItems',
        iconCss: 'iconCss'
      };
     
      // Update tree view component if available
      if (this.listTreeObj) {
        // Create new fields object to trigger change detection
        const newFields = {
          dataSource: [...treeStructure],
          id: 'id',
          text: 'text',
          child: 'subItems',
          iconCss: 'iconCss'
        };
       
        this.listTreeObj.fields = newFields as any;
       
        // Enable icons programmatically - set showIcon option
        const treeViewInstance = this.listTreeObj as any;
        if (treeViewInstance.showIcon !== undefined) {
          treeViewInstance.showIcon = true;
        }
       
        // Refresh the tree view after a short delay to ensure DOM is updated
        setTimeout(() => {
          if (this.listTreeObj) {
            try {
              this.listTreeObj.refresh();
              // Force enable icons after refresh
              const instance = this.listTreeObj as any;
              if (instance.showIcon !== undefined) {
                instance.showIcon = true;
              }
            } catch (e) {
              console.log('Tree refresh:', e);
            }
          }
        }, 100);
      }
    }
 
 
    //Filtering the TreeNodes
 searchNodes(): void {
  const searchText = this.maskObj?.element.value?.toLowerCase() || '';

  const modules = this.pageMenuModules ?? [];
  const groups  = this.pageMenuGroups ?? [];

  // 🔁 Reset tree
  if (!searchText) {
    const fullTree = this.buildTreeStructure(modules, groups);
    this.updateTreeData(fullTree);
    return;
  }

  // 🔍 Filter groups by search
  const filteredGroups = groups.filter(g =>
    (g.MenuText || '').toLowerCase().includes(searchText) ||
    (g.MenuValue || '').toLowerCase().includes(searchText)
  );

  // 🌳 Build tree ONLY from filtered groups
  const filteredTree = this.buildTreeStructure(modules, filteredGroups);
  this.updateTreeData(filteredTree);

  // ⬇ Expand all
  setTimeout(() => {
    this.treeviewObj?.expandAll();
  }, 100);
}

    private buildFilteredTree(allData: any[], filteredData: any[]): any[] {
      const itemMap = new Map<number, any>();
      const rootItems: any[] = [];
      const includedIds = new Set<number>();
 
      // Mark filtered items and their parents as included
      filteredData.forEach(item => {
        includedIds.add(item.id);
        this.markParents(allData, item.parent, includedIds);
      });
 
      // Build tree with included items only
      const includedData = allData.filter(item => includedIds.has(item.id));
     
      includedData.forEach(item => {
        const formattedText = this.formatTreeNodeText(item);
        // Set icon based on isGroup field - folder for groups, file for items
        const iconCss = item.isGroup === true ? 'tree-folder-icon' : 'tree-file-icon';
        const treeNode = {
          id: item.id,
          name: item.name,
          text: formattedText,
          alternateName: item.alternateName,
          alias: item.alias,
          iconCss: iconCss,
          subItems: [],
          ...item
        };
        itemMap.set(item.id, treeNode);
      });
 
      includedData.forEach(item => {
        const node = itemMap.get(item.id)!;
        const parentId = item.parent;
       
        if (parentId && parentId !== null && itemMap.has(parentId)) {
          const parent = itemMap.get(parentId);
          if (parent) {
            if (!parent.subItems) {
              parent.subItems = [];
            }
            parent.subItems.push(node);
          }
        } else {
          rootItems.push(node);
        }
      });
 
      rootItems.sort((a, b) => (a.sortField || 0) - (b.sortField || 0));
      this.sortTreeItems(rootItems);
 
      return rootItems;
    }
 
    private markParents(allData: any[], parentId: number | null, includedIds: Set<number>): void {
      if (!parentId || parentId === null) {
        return;
      }
     
      includedIds.add(parentId);
      const parent = allData.find(item => item.id === parentId);
      if (parent && parent.parent) {
        this.markParents(allData, parent.parent, includedIds);
      }
    }
 
    onNodeSelected(event: any): void {
      if (event.nodeData) {
        console.log('Selected node:', event.nodeData);
        this.getDataById(event.nodeData);
      }
    }
   
    onNodeExpanded(event: any): void {
      // Optional: Handle node expansion if needed
      console.log('Node expanded:', event.nodeData);
    }
   
    override getDataById(data: any) {
      console.log('Selected account data:', data);
      if (data && data.id) {
        this.selectedAccountId = data.id;
        console.log('selectedAccountId', this.selectedAccountId);
       
        // Check if children are already loaded in the data
        const existingData = this.chartOfAccountData();
        const hasChildrenInData = existingData.some(item => item.parent === this.selectedAccountId);
       
        // If children already exist in data, just expand the node
        if (hasChildrenInData) {
          console.log('Children already loaded for this node');
          // Rebuild tree to ensure it's up to date
         // const updatedTreeStructure = this.buildTreeStructure(existingData);
         // this.updateTreeData(updatedTreeStructure);
         
          // Expand the node
          setTimeout(() => {
            if (this.listTreeObj) {
              this.listTreeObj.expandAll([this.selectedAccountId.toString()]);
            }
          }, 100);
          return;
        }
       
        // Fetch children from API
      this.httpService.fetch<any>(EndpointConstant.FILLPAGEMENU+this.selectedAccountId+'&tree=true')
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Chart of Account child data response:', response?.data);
          const childchartOfAccountData = response?.data.groups || [];
          console.log('childchartOfAccountData', childchartOfAccountData);
         
          if (childchartOfAccountData.length > 0) {
            // Merge child data into existing data
            const currentData = this.chartOfAccountData();
            const existingIds = new Set(currentData.map(item => item.id));
           
            // Add only new items that don't already exist
            const newItems = childchartOfAccountData.filter((item: any) => !existingIds.has(item.id));
           
            if (newItems.length > 0) {
              // Update the data signal with merged data
              const mergedData = [...currentData, ...newItems];
              this.chartOfAccountData.set(mergedData);
             
              // Rebuild tree structure with new children
              // const updatedTreeStructure = this.buildTreeStructure(mergedData);
              // this.updateTreeData(updatedTreeStructure);
             
              // Expand the selected node to show children after tree updates
              setTimeout(() => {
                if (this.listTreeObj) {
                  // Expand the specific node
                  this.listTreeObj.expandAll([this.selectedAccountId.toString()]);
                }
              }, 300);
            } else {
              console.log('No new children to add');
            }
          } else {
            console.log('No children found for this account');
          }
        },
        error: (error) => {
          console.error('Error loading account child data:', error);
        }
      });
      }
    }
   
    private findNodeInTree(treeData: any[], nodeId: number): any | null {
      for (const node of treeData) {
        if (node.id === nodeId) {
          return node;
        }
        if (node.subItems && node.subItems.length > 0) {
          const found = this.findNodeInTree(node.subItems, nodeId);
          if (found) {
            return found;
          }
        }
      }
      return null;
    }
   
    override FormInitialize() {
      // Form initialization not needed for tree view
      this.chartOfAccountForm = new FormGroup({});
      console.log('Chart of Account form initialized');
    }
   
    override async LeftGridInit() {
      // Left grid initialization handled by loadInitialData
      this.pageheading = 'Chart of Account';
      console.log('Left grid initialized');
    }
   
    override SaveFormData() {
      console.log('Saving chart of account data');
      if (this.chartOfAccountForm && this.chartOfAccountForm.invalid) {
        console.log('Form is invalid');
        return;
      }
      // Implement save logic here
      console.log('Form data:', this.chartOfAccountForm?.value);
    }
   
    override onEditClick() {
      console.log('Edit button');
      this.isUpdate = true;
      if (this.chartOfAccountForm) {
        this.chartOfAccountForm.enable();
      }
    }
   
    override newbuttonClicked(): void {
      console.log('New button clicked');
      if (this.chartOfAccountForm) {
        this.chartOfAccountForm.enable();
        this.chartOfAccountForm.reset();
      }
      this.isUpdate = false;
      this.selectedAccountId = 0;
    }
   
    override DeleteData(data: any) {
      console.log('Delete requested for:', data);
      // Implement delete logic here
      return true;
    }
   
    onTabClick(tabName: string): void {
      this.activeTab.set(tabName);
      // Navigate to the corresponding route - routes are relative to /masters
      const routes: { [key: string]: string[] } = {
        'accountsList': ['accountslist'],
        'updateSortorder': ['accountsortorder'],
        'groupparentupdate': ['chartofaccounts'], // Current page
        'Branchaccounts': ['branchaccounts'],
        'chartofaccounts': ['chartofaccounts']
      };
     
      const route = routes[tabName];
      if (route) {
        // Navigate using relative path from current activated route
        this.router.navigate(route, { relativeTo: this.activatedRoute.parent || this.activatedRoute });
      }
    }

  openPageMenuPopup(): void {
    this.pageMenuDialog.show();
  }

  onDialogOpen(): void {
    this.showPopup = true;   // create child component
  }

  onDialogClose(): void {
    this.showPopup = false;  // destroy child component
  }

  closePageMenuPopup(): void {
    this.pageMenuDialog.hide();
  }
}