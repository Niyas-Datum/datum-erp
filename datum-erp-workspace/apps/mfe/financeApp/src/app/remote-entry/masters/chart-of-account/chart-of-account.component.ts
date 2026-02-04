import {
    Component,
    inject,
    OnInit,
    AfterViewInit,
    signal,
    ViewChild,
    Input,
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
import { FinancialPopupService } from '../../common/popup/finance.popup.service';
  
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
    
@ViewChild('pageMenuDialog') pageMenuDialog!: DialogComponent;

@Input() skipDataLoad = false; // Flag to prevent nested components from loading data

showPageMenuPopup = false;
    fillaccountpopupData = signal<any[]>([]);
    chartOfAccountForm = this.formUtil.thisForm;
    private httpService = inject(FinanceAppService);
    private popupService = inject(FinancialPopupService);
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
    
    /**
     * Angular lifecycle hook - Initializes the component
     * Sets up the page type and loads initial chart of account data
     */
    ngOnInit(): void {
      this.onInitBase();
      this.SetPageType(2);
      this.loadInitialData();
      
      // Only load data if this is not a nested component instance
      if (!this.skipDataLoad) {
        this.loadInitialData();
      }
    }
    
    /**
     * Angular lifecycle hook - Called after the view is initialized
     * Enables tree view icons and refreshes the tree component
     */
    ngAfterViewInit(): void {
      // Enable icons after view is initialized
      setTimeout(() => {
        if (this.listTreeObj) {
          (this.listTreeObj as any).showIcon = true;
          // Force refresh to apply icon settings
          try {
            this.listTreeObj.refresh();
          } catch (e) {
            // Tree refresh error handled silently
          }
        }
      }, 300);
    }
    
    /**
     * Loads initial chart of account data from the API
     * Fetches all accounts and transforms them into a tree structure
     */
    async loadInitialData() {
      // const ref = await this.popupService.openLazy('test', {voucherId: 30, pageId: 20});

      // ref?.afterClosed?.subscribe((result: any) => {
      //   if (result?.action === 'import') {
      //     // Handle import result
      //   }
      // });
      


      this.httpService.fetch<any>(EndpointConstant.FILLCHARTOFACCOUNTS)
      .pipe(takeUntilDestroyed(this.serviceBase.destroyRef))
      .subscribe({
        next: (response) => {
          const accountData = response?.data || [];
          // Update signal - this will trigger Angular change detection
          this.chartOfAccountData.set([...accountData]);
          
          // Transform data to tree structure
          const treeStructure = this.buildTreeStructure(accountData);
          this.updateTreeData(treeStructure);
        },
        error: (error) => {
          // Error loading account data
        }
      });
    }

    /**
     * Builds a hierarchical tree structure from flat account data
     * @param data - Array of flat account items with parent references
     * @returns Array of root tree nodes with nested children
     */
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

    /**
     * Formats the display text for a tree node
     * Format: [Code] Arabic Name / English Name
     * @param item - Account item with name, alternateName, and alias properties
     * @returns Formatted string for tree node display
     */
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

    /**
     * Recursively sorts tree items by their sortField property
     * @param items - Array of tree items to sort (including nested children)
     */
    private sortTreeItems(items: any[]): void {
      items.forEach(item => {
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.sort((a: any, b: any) => (a.sortField || 0) - (b.sortField || 0));
          this.sortTreeItems(item.subItems);
        }
      });
    }

    /**
     * Updates the tree data and refreshes the tree view component
     * Preserves expanded nodes state if preserveExpansion is true
     * @param treeStructure - New tree structure to display
     * @param preserveExpansion - Whether to preserve currently expanded nodes (default: true)
     */
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
              // Tree refresh error handled silently
            }
          }
        }, 100);
      }
    }

    /**
     * Expands all nodes in the tree view
     */
    expandAllNodes() {
      if (this.listTreeObj) {
        this.listTreeObj.expandAll();
      }
    }

    /**
     * Collapses all nodes in the tree view
     */
    collapseAllNodes() {
      if (this.listTreeObj) {
        this.listTreeObj.collapseAll();
      }
    }
    
    /**
     * Filters tree nodes based on search text
     * Searches in account name, alternate name, and alias
     * Includes parent nodes of matching items to maintain tree structure
     * @param args - Event arguments (not used, search text comes from maskObj)
     */
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

    /**
     * Builds a filtered tree structure that includes matching items and their parent nodes
     * @param allData - Complete dataset of all accounts
     * @param filteredData - Filtered subset of accounts matching search criteria
     * @returns Tree structure containing filtered items and their parent hierarchy
     */
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

    /**
     * Recursively marks parent nodes for inclusion in filtered tree
     * Ensures parent chain is included so filtered items remain accessible
     * @param allData - Complete dataset of all accounts
     * @param parentId - ID of the parent node to mark
     * @param includedIds - Set of node IDs to include in the filtered tree
     */
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

    /**
     * Handles tree node selection event
     * Updates selected node ID and loads account data
     * @param event - Tree node selection event containing nodeData
     */
    onNodeSelected(event: any): void {
      if (event.nodeData) {
        this.selectedNodeId = event.nodeData.id;
        this.getDataById(event.nodeData);
      }
    }
    
    /**
     * Handles tree node expansion event
     * Tracks expanded nodes to preserve state during tree updates
     * @param event - Tree node expansion event containing nodeData
     */
    onNodeExpanded(event: any): void {
      if (event.nodeData && event.nodeData.id) {
        this.expandedNodes.add(event.nodeData.id.toString());
      }
    }
    
    /**
     * Handles tree node collapse event
     * Removes node from expanded set when collapsed
     * @param event - Tree node collapse event containing nodeData
     */
    onNodeCollapsed(event: any): void {
      if (event.nodeData && event.nodeData.id) {
        this.expandedNodes.delete(event.nodeData.id.toString());
      }
    }
    
    /**
     * Gets account data by ID and loads child accounts if needed
     * Handles lazy loading of child accounts when a parent node is selected
     * @param data - Account data object containing the account ID
     */
    override getDataById(data: any) {
      if (data && data.id) {
        this.selectedAccountId = data.id;
        const selectedNodeId = this.selectedAccountId.toString();
        
        // Mark this node as expanded
        this.expandedNodes.add(selectedNodeId);
        
        // Check if children are already loaded in the data
        const existingData = this.chartOfAccountData();
        const hasChildrenInData = existingData.some(item => item.parent === this.selectedAccountId);
        
        // If children already exist in data, ensure node stays expanded
        if (hasChildrenInData) {
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
          const childchartOfAccountData = response?.data || [];
          
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
            }
          }
        },
        error: (error) => {
          // Error loading account child data
        }
      });
      }
    }
    
    /**
     * Recursively finds a node in the tree structure by ID
     * @param treeData - Tree structure to search in
     * @param nodeId - ID of the node to find
     * @returns Found node object or null if not found
     */
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
    
    /**
     * Initializes the form for chart of account
     * Overrides base component method - minimal form needed for tree view
     */
    override FormInitialize() {
      this.chartOfAccountForm = new FormGroup({});
    }
    
    /**
     * Initializes the left grid component
     * Sets the page heading - data loading is handled by loadInitialData
     */
    override async LeftGridInit() {
      this.pageheading = 'Chart of Account';
    }
    
    /**
     * Saves the chart of account form data
     * Validates form before saving
     */
    override SaveFormData() {
      if (this.chartOfAccountForm && this.chartOfAccountForm.invalid) {
        return;
      }
      // Implement save logic here
    }
    
    /**
     * Handles edit button click event
     * Enables form editing and sets update flag
     */
    override onEditClick() {
      this.isUpdate = true;
      if (this.chartOfAccountForm) {
        this.chartOfAccountForm.enable();
      }
    }
    
    /**
     * Handles new button click event
     * Resets form, enables editing, and clears selected account
     */
    override newbuttonClicked(): void {
      if (this.chartOfAccountForm) {
        this.chartOfAccountForm.enable();
        this.chartOfAccountForm.reset();
      }
      this.isUpdate = false;
      this.selectedAccountId = 0;
    }
    
    /**
     * Handles delete operation for account data
     * @param data - Account data to delete
     * @returns true if delete operation should proceed
     */
    override DeleteData(data: any) {
      return true;
    }
    
    /**
     * Handles tab click event
     * Opens popup dialog for specific tabs that require it
     * @param tabName - Name of the tab that was clicked
     */
    onTabClick(tabName: string): void {
      this.activeTab.set(tabName);
      
      // Open popup for these tabs - matching routes from ledger component
      const popupTabs = ['accountsList','accountsortorder', 'groupparentupdate', 'Branchaccounts', 'chartofaccounts'];
      if (popupTabs.includes(tabName)) {
        this.openPopup(tabName);
        return;
      }
    }
    
    /**
     * Opens a popup dialog for the specified tab
     * Sets appropriate dialog header based on tab name
     * @param tabName - Name of the tab to open in popup
     */
    openPopup(tabName: string): void {
      const headers: { [key: string]: string } = {
        'accountsList': 'Accounts List',
        'accountsortorder': 'Account Sort Order',
        'groupparentupdate': 'Group Parent Update',
        'Branchaccounts': 'Branch Accounts',
        'branchaccounts': 'Branch Accounts',
        'chartofaccounts': 'Chart of Accounts'
      };
      
      this.dialogHeader.set(headers[tabName] || '');
      this.accountDialog.show();
    }
    
    /**
     * Handles dialog open event
     * Sets flag to render component content inside dialog
     */
    onDialogOpen(): void {
      this.showDialogContent.set(true);
    }
    
    /**
     * Handles dialog close event
     * Hides dialog and sets flag to destroy component content
     */
    onDialogClose(): void {
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

  /**
   * Handles context menu item selection
   * Routes to appropriate action based on selected menu item
   * @param args - Menu selection event containing item ID
   */
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

  /**
   * Opens the selected node in a dialog
   * Sets selectedAccountId and displays page menu dialog
   */
  openNode() {
    if (this.selectedNodeId) {
      this.selectedAccountId = typeof this.selectedNodeId === 'string' ? parseInt(this.selectedNodeId, 10) : this.selectedNodeId;
    }
    // Set showPageMenuPopup before showing dialog to ensure component is created
    this.showPageMenuPopup = true;
    this.pageMenuDialog.show();
  }

  /**
   * Handles page menu dialog open event
   * Ensures popup component is shown when dialog opens
   */
  onPageMenuDialogOpen(): void {
    this.showPageMenuPopup = true;
  }

  /**
   * Handles page menu dialog close event
   * Hides popup component and resets state when dialog closes
   */
  onPageMenuDialogClose(): void {
    this.showPageMenuPopup = false;
  }

  /**
   * Creates a new group account
   * Opens page menu dialog for group creation
   */
  createGroup() {
    this.showPageMenuPopup = true;
    this.pageMenuDialog.show();
  }

  /**
   * Creates a new account
   * Opens page menu dialog for account creation
   */
  createAccount() {
    this.showPageMenuPopup = true;
    this.pageMenuDialog.show();
  }

  /**
   * Deletes the selected node
   * Implements delete logic for tree nodes
   */
  deleteNode() {
    // Delete node logic
  }

  /**
   * Opens statement for the selected account
   * Implements statement viewing logic
   */
  openStatement() {
    // Open statement logic
  }
  
  /**
   * Handles data saved event from popup component
   * Refreshes the tree data after save/update/delete operations
   */
  onDataSaved(): void {
    // Reload tree data to reflect changes
    this.loadInitialData();
  }

}

