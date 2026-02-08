import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface ToolbarState {
  isNewMode?: boolean;
  isEditMode?: boolean;
  isNewBtnDisabled?: boolean;
  isEditBtnDisabled?: boolean;
  isDeleteBtnDisabled?: boolean;
  isSaveBtnDisabled?: boolean;
  isPrintBtnDisabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FormToolbarService {

  pageId?:number;
  voucherId?:number;
  leftgridselectedData:any;
  pagetype:number ;
  constructor(){this.pagetype = 1}

  /** Toolbar state pushed by child (e.g. sales-invoice) so entry can show New + Save on initial load */
  private toolbarState$ = new BehaviorSubject<ToolbarState>({});
  getToolbarState$ = () => this.toolbarState$.asObservable();

  setToolbarState(state: Partial<ToolbarState>): void {
    this.toolbarState$.next(state);
  }

  private newClickedSource = new Subject<void>();
  newClicked$ = this.newClickedSource.asObservable();

  private saveClickedSource = new Subject<void>();
  saveClicked$ = this.saveClickedSource.asObservable();

  private editClickedSource = new Subject<void>();
  editClicked$ = this.editClickedSource.asObservable();

   private deleteClickedSource = new Subject<void>();
      deleteClicked$ = this.deleteClickedSource.asObservable();

      private leftGridClickedSource = new Subject<void>();
      leftGridClicked$ = this.leftGridClickedSource.asObservable();

       private leftGridViewSource = new Subject<void>();
      leftGridView$ = this.leftGridViewSource.asObservable();



  emitNewClicked() {
    this.newClickedSource.next();
  }

  emitSaveClicked() {
    this.saveClickedSource.next();
  }
   emitEditClicked() {
    this.editClickedSource.next();
  }

     emitDeleteClicked() {
    this.deleteClickedSource.next();
  }
       emitLeftGridClicked(event:any) {
        this.leftgridselectedData = event;
        this.leftGridClickedSource.next();
  }

  emitLeftGridViewSatus(event:number){
    console.log("emitLeftGridViewSatus");
        this.pagetype = event;
        this.leftGridViewSource.next();

  }
}