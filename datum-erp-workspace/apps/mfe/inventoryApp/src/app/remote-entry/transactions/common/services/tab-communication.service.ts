import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TabCommunicationService {
  private selectedTabSubject = new BehaviorSubject<number>(1);
  public selectedTab$ = this.selectedTabSubject.asObservable();

  setSelectedTab(tabIndex: number): void {
    this.selectedTabSubject.next(tabIndex);
  }

  getSelectedTab(): number {
    return this.selectedTabSubject.value;
  }
}
