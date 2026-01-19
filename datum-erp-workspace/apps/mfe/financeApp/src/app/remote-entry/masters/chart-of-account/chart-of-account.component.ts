import {
    Component,
    inject,
    OnInit,
    AfterViewInit,
    signal,
    ViewChild,
  } from '@angular/core';
  import { BaseComponent } from '@org/architecture';
  import { FinanceAppService } from '../../http/finance-app.service';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { EndpointConstant } from '@org/constants';
  import { EditService } from '@syncfusion/ej2-angular-grids';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MultiColumnComboBoxComponent } from '@syncfusion/ej2-angular-multicolumn-combobox';
import { TreeViewComponent } from '@syncfusion/ej2-angular-navigations';
import { MaskedTextBoxComponent } from "@syncfusion/ej2-angular-inputs";
import { Router, ActivatedRoute } from '@angular/router';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
  
  @Component({
    selector: 'app-chart-of-account',
    //eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false,
    templateUrl: './chart-of-account.component.html',
    styleUrls: ['./chart-of-account.component.css'],
    providers: [EditService],
  })
  export class ChartOfAccountComponent extends BaseComponent implements OnInit, AfterViewInit{
    @ViewChild('accountDialog') accountDialog!: DialogComponent;
    @ViewChild('accountCombo') accountCombo?: MultiColumnComboBoxComponent;
    fillaccountpopupData = signal<any[]>([]);
    chartOfAccountForm = this.formUtil.thisForm;
    private httpService = inject(FinanceAppService);
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    fillcategoryData = signal<any[]>([]);
    isLoading = signal<boolean>(false);
    editSettings = { allowEditing: false, allowAdding: false, allowDeleting: false };
    chartOfAccountData = signal<any[]>([]);
    treeData = signal<any[]>([]);
    selectedAccountId = 0;
    isUpdate = false;
    treeViewFields: any = {
      dataSource: [],
      id: 'id',
      text: 'text',
      child: 'subItems',
      iconCss: 'iconCss'
    };
    showIcon = true;
    activeTab = signal<string>('chartofaccounts');
    expandedNodes = new Set<string>(); // Track expanded nodes
    showDialogContent = signal<boolean>(false); // Control when to render component inside dialog
    dialogHeader = signal<string>(''); // Dynamic dialog header
    
    // Dialog buttons configuration - Close button on the right
    dialogButtons = [
      {
        click: () => this.onDialogClose(),
        buttonModel: { content: 'Close', cssClass: 'e-flat', isPrimary: false }
      }
    ];
    
    @ViewChild("treeviewObj") listTreeObj?: TreeViewComponent;
    @ViewChild("maskObj") maskObj?: MaskedTextBoxComponent;
    
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
    
   
    loadInitialData() {
      this.httpService.fetch<any>(EndpointConstant.FILLCHARTOFACCOUNTS)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Chart of Account data response:', response?.data);
          const accountData = response?.data || [];
          // Update signal - this will trigger Angular change detection
          this.chartOfAccountData.set([...accountData]);
          
          // Transform data to tree structure
          const treeStructure = this.buildTreeStructure(accountData);
          this.updateTreeData(treeStructure);
        },
        error: (error) => {
          console.error('Error loading account data:', error);
        }
      });
    }

    private buildTreeStructure(data: any[]): any[] {
      if (!data || data.length === 0) {
        return [];
      }

      const itemMap = new Map<number, any>();
      const rootItems: any[] = [];

      // First pass: create map of all items with tree structure
      data.forEach(item => {
        // Format text as: [Code] Arabic Name / English Name
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
          isGroup: item.isGroup, // Preserve isGroup for reference
          subItems: [],
          ...item
        };
        // Debug: log icon assignment
        if (item.isGroup === true) {
          console.log('Folder icon assigned to:', item.name, 'iconCss:', iconCss);
        }
        itemMap.set(item.id, treeNode);
      });

      // Second pass: build tree structure based on parent field
      data.forEach(item => {
        const node = itemMap.get(item.id)!;
        const parentId = item.parent;
        
        if (parentId && parentId !== null && itemMap.has(parentId)) {
          // Has a parent, add to parent's subItems
          const parent = itemMap.get(parentId);
          if (parent) {
            if (!parent.subItems) {
              parent.subItems = [];
            }
            parent.subItems.push(node);
          }
        } else {
          // Root level item (parent is null)
          rootItems.push(node);
        }
      });

      // Sort root items by sortField if available
      rootItems.sort((a, b) => (a.sortField || 0) - (b.sortField || 0));
      
      // Sort subItems recursively
      this.sortTreeItems(rootItems);

      return rootItems;
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

    private updateTreeData(treeStructure: any[], preserveExpansion = true): void {
      this.treeData.set(treeStructure);
      
      // Preserve expanded nodes before updating
      const nodesToExpand: string[] = [];
      if (preserveExpansion && this.listTreeObj) {
        // Get currently expanded nodes from the tree
        try {
          const expandedNodesList = this.listTreeObj.expandedNodes || [];
          nodesToExpand.push(...expandedNodesList);
          // Also add tracked expanded nodes
          this.expandedNodes.forEach(nodeId => {
            if (!nodesToExpand.includes(nodeId)) {
              nodesToExpand.push(nodeId);
            }
          });
        } catch (e) {
          // Fallback to tracked expanded nodes
          this.expandedNodes.forEach(nodeId => nodesToExpand.push(nodeId));
        }
      }
      
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
              
              // Restore expanded nodes after refresh
              if (preserveExpansion && nodesToExpand.length > 0) {
                setTimeout(() => {
                  if (this.listTreeObj) {
                    this.listTreeObj.expandAll(nodesToExpand);
                  }
                }, 50);
              }
            } catch (e) {
              console.log('Tree refresh:', e);
            }
          }
        }, 100);
      }
    }

    expandAllNodes() {
      if (this.listTreeObj) {
        this.listTreeObj.expandAll();
      }
    }

    collapseAllNodes() {
      if (this.listTreeObj) {
        this.listTreeObj.collapseAll();
      }
    }
    
    //Filtering the TreeNodes
    searchNodes(args: any) {
      const searchText = this.maskObj?.element.value || '';
      const allData = this.chartOfAccountData();
      
      if (!searchText || searchText.trim() === '') {
        // Reset to full tree
        const treeStructure = this.buildTreeStructure(allData);
        this.updateTreeData(treeStructure);
        return;
      }

      // Filter data based on search text
      const filteredData = allData.filter(item => {
        const name = (item.name || '').toLowerCase();
        const alternateName = (item.alternateName || '').toLowerCase();
        const alias = (item.alias || '').toLowerCase();
        const searchLower = searchText.toLowerCase();
        
        return name.includes(searchLower) || 
               alternateName.includes(searchLower) || 
               alias.includes(searchLower);
      });

      // Build tree structure with filtered data and include parents
      const filteredTree = this.buildFilteredTree(allData, filteredData);
      this.updateTreeData(filteredTree);
      
      // Expand all nodes after filtering
      setTimeout(() => {
        this.listTreeObj?.expandAll();
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
      // Track expanded nodes to preserve state during tree updates
      if (event.nodeData && event.nodeData.id) {
        this.expandedNodes.add(event.nodeData.id.toString());
        console.log('Node expanded:', event.nodeData);
      }
    }
    
    onNodeCollapsed(event: any): void {
      // Remove from expanded set when collapsed
      if (event.nodeData && event.nodeData.id) {
        this.expandedNodes.delete(event.nodeData.id.toString());
        console.log('Node collapsed:', event.nodeData);
      }
    }
    
    override getDataById(data: any) {
      console.log('Selected account data:', data);
      if (data && data.id) {
        this.selectedAccountId = data.id;
        const selectedNodeId = this.selectedAccountId.toString();
        console.log('selectedAccountId', this.selectedAccountId);
        
        // Mark this node as expanded
        this.expandedNodes.add(selectedNodeId);
        
        // Check if children are already loaded in the data
        const existingData = this.chartOfAccountData();
        const hasChildrenInData = existingData.some(item => item.parent === this.selectedAccountId);
        
        // If children already exist in data, ensure node stays expanded
        if (hasChildrenInData) {
          console.log('Children already loaded for this node');
          // Only rebuild if we need to preserve expansion - don't rebuild unnecessarily
          // Just ensure the node is expanded
          setTimeout(() => {
            if (this.listTreeObj) {
              // Check if node is already expanded, if not expand it
              try {
                const expandedNodes = this.listTreeObj.expandedNodes || [];
                if (!expandedNodes.includes(selectedNodeId)) {
                  this.listTreeObj.expandAll([selectedNodeId]);
                }
              } catch (e) {
                // Fallback: just expand it
                this.listTreeObj.expandAll([selectedNodeId]);
              }
            }
          }, 50);
          return;
        }
        
        // Fetch children from API
        this.httpService.fetch<any>(EndpointConstant.FILLCHARTOFACCOUNTBYID+this.selectedAccountId+'&tree=true')
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Chart of Account child data response:', response?.data);
          const childchartOfAccountData = response?.data || [];
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
              
              // Rebuild tree structure with new children, preserving expansion
              const updatedTreeStructure = this.buildTreeStructure(mergedData);
              this.updateTreeData(updatedTreeStructure, true);
              
              // Ensure selected node is expanded after tree updates
              setTimeout(() => {
                if (this.listTreeObj) {
                  // Expand the specific node and its parent chain
                  this.listTreeObj.expandAll([this.selectedAccountId.toString()]);
                }
              }, 350);
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
      
      // Open popup for these tabs - matching routes from ledger component
      const popupTabs = ['accountsList','accountsortorder', 'groupparentupdate', 'Branchaccounts', 'chartofaccounts'];
      if (popupTabs.includes(tabName)) {
        this.openPopup(tabName);
        return;
      }
    }
    
    openPopup(tabName: string): void {
      console.log('Opening popup for tab:', tabName);
      // Set dialog header based on tab - matching routes from ledger component
      const headers: { [key: string]: string } = {
        'accountsList': 'Accounts List',
        'accountsortorder': 'Account Sort Order',
        'groupparentupdate': 'Group Parent Update',
        'Branchaccounts': 'Branch Accounts',
        'branchaccounts': 'Branch Accounts',
        'chartofaccounts': 'Chart of Accounts'
      };
      
      this.dialogHeader.set(headers[tabName] || '');
      console.log('Dialog header set to:', this.dialogHeader());
      this.accountDialog.show();
    }
    
    onDialogOpen(): void {
      // Set flag to true when dialog opens - this will render the component
      console.log('Dialog opened, activeTab:', this.activeTab());
      console.log('showDialogContent BEFORE:', this.showDialogContent());
      this.showDialogContent.set(true);
      console.log('showDialogContent AFTER:', this.showDialogContent());
      console.log('activeTab value:', this.activeTab());
      console.log('Will render accountsortorder?', this.activeTab() === 'accountsortorder');
    }
    
    onDialogClose(): void {
      // Set flag to false when dialog closes - this will destroy the component
      this.showDialogContent.set(false);
      this.accountDialog.hide();
    }
    @ViewChild('treeviewObj') treeView!: TreeViewComponent;

  selectedNodeId: string | null = null;

  menuItems = [
    { text: 'Open', id: 'open' },
    { text: 'New Group', id: 'newGroup' },
    { text: 'New Account', id: 'newAccount' },
    { text: 'Delete', id: 'delete' },
    { text: 'Statement', id: 'statement' }
  ];

  // onNodeSelected(args: any) {
  //   this.selectedNodeId = args.nodeData.id;
  // }

  onMenuSelect(args: any) {
    switch (args.item.id) {
      case 'open':
        this.openNode();
        break;

      case 'newGroup':
        this.createGroup();
        break;

      case 'newAccount':
        this.createAccount();
        break;

      case 'delete':
        this.deleteNode();
        break;

      case 'statement':
        this.openStatement();
        break;
    }
  }

  openNode() {
    console.log('Open', this.selectedNodeId);
  }

  createGroup() {
    console.log('New Group under', this.selectedNodeId);
  }

  createAccount() {
    console.log('New Account under', this.selectedNodeId);
  }

  deleteNode() {
    console.log('Delete', this.selectedNodeId);
  }

  openStatement() {
    console.log('Statement for', this.selectedNodeId);
  }
}

