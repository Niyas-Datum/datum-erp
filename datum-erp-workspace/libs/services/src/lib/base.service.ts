import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { LocalStorageService } from './storage/localStorage.service';
import { APP_URL } from '@org/utils';
//import { MatDialog } from '@angular/material/dialog';
//import { DialogTemplateComponent, ModalType } from './utils/dialog-template/dialog-template.component';
//import { CustomDialogueComponent } from './utils/custom-dialogue/custom-dialogue.component';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  private httpClient = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const skey = this.localStorageService.getLocalStorageItem('skey');
    if (skey) {
      headers = headers.set('skey', skey);
    }
    return headers;
  }

  setToken(token: string) {
    this.localStorageService.setLocalStorageItem('access_token', token);
  }

  getToken() {
    return this.localStorageService.getLocalStorageItem('access_token') || '';
  }

  setLocalStorageItem(fieldName: string, fieldValue: string) {
    this.localStorageService.setLocalStorageItem(fieldName, fieldValue);
  }

  getLocalStorageItem(fieldName: string) {
    return this.localStorageService.getLocalStorageItem(fieldName) || '';
  }

  clearLocalStorage() {
    localStorage.clear();
    console.log('[BaseService] LocalStorage cleared');
  }

  clearSessionStorage() {
    sessionStorage.clear();
  }

  clearAllStorage() {
    this.clearLocalStorage();
    this.clearSessionStorage();
  }

  get<T>(endpoint: string): Observable<T> {
    return this.httpClient
      .get<T>(`${APP_URL.API}${endpoint}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        })
      );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.httpClient
      .post<T>(`${APP_URL.API}${endpoint}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400) {
            return throwError(() => error.error);
          }
          return throwError(() => error);
        })
      );
  }

  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.httpClient
      .patch<T>(`${APP_URL.API}${endpoint}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400) {
            return throwError(() => error.error);
          }
          return throwError(() => error);
        })
      );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.httpClient
      .delete<T>(`${APP_URL.API}${endpoint}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400) {
            return throwError(() => error.error);
          }
          return throwError(() => error);
        })
      );
  }

  getMenuByUrl(url: string): any | null {
    let menuItems: any = localStorage.getItem('menuData');
    if (menuItems) {
      menuItems = JSON.parse(menuItems);
    } else {
      return null;
    }
    return this.findMenu(menuItems, url);
  }

  findMenu(items: any[], url: string): any | null {
    for (const item of items) {
      if (item.url === url) {
        return item;
      }
      if (item.subMenu && item.subMenu.length > 0) {
        const subMenu = this.findMenu(item.subMenu, url);
        if (subMenu !== null) {
          return subMenu;
        }
      }
    }
    return null;
  }

  formatInput(inputNumber: any) {
    const decimalPlaces = Number(
      this.localStorageService.getLocalStorageItem('numericFormat')
    );

    if (typeof inputNumber === 'number' && !isNaN(inputNumber)) {
      return inputNumber.toFixed(decimalPlaces);
    } else {
      return inputNumber;
    }
  }

  showCustomDialogue(
    message: string,
    title = '',
    inputKey = 'custom'
  ): Promise<boolean> {
    alert(`${message} title: ${title},
        key: ${inputKey}  `);
    return Promise.resolve(true);
    // const dialogRef = this.dialog.open(CustomDialogueComponent, {
    //   width: '300px',
    //   height: '200px',
    //   data: {
    //     message,
    //     title,
    //     key: inputKey,
    //   },
    // });

    // return dialogRef.afterClosed().toPromise();
  }

  showCustomDialoguePopup(
    message: string,
    title = 'Alert',
    type: any = 'INFO'
  ): void {
    alert(`${message} title: ${title},
        key: ${type}  `);
    // this.dialog.open(DialogTemplateComponent, {
    //   data: { title, message, type },
    //   width: '400px',
    //   disableClose: true
    // });
  }
}
