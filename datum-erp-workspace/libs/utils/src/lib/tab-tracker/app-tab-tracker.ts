export class TabTrackerService {
  private readonly tabId = `${Date.now()}_${Math.random()}`;

  constructor() {

    console.log(`TabTrackerService initialized with tabId: ${this.tabId}  `);
    this.markTabAsActive();
    this.setupUnloadListener();
  }

  initTracker(): void {
    console.log('TabTrackerService initialized.');
    this.markTabAsActive();
    this.setupUnloadListener();
  }
  private markTabAsActive(): void {
    localStorage.setItem(this.tabId, 'active');
  }

  private setupUnloadListener(): void {
    window.addEventListener('unload', () => {
      localStorage.removeItem(this.tabId);

      // Give time for all unload events to complete
      setTimeout(() => {
        const activeTabs = Object.keys(localStorage).filter((key) =>
          key.match(/^\d+_\d+\.\d+$/)
        );

        if (activeTabs.length === 0) {
        
          sessionStorage.clear();
          // Or: this.logoutService.logout(); <-- integrate logout logic here
        }
      }, 100);
    });
  }
}