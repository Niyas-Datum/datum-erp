import { inject, Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { APP_URL } from '@org/utils';
import { BaseService,LocalStorageService } from '@org/services';
import { Observable } from "rxjs";
import { CompanyDto,ApiResponseDto } from '@org/models';


@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private baseService = inject(BaseService);
  private localStorageService = inject(LocalStorageService);

  fetch<T>(endpoint: string):Observable<ApiResponseDto<T>> {
    console.log('LoginService: Fetching data from endpoint:', endpoint);
        return this.baseService.get(endpoint);

  }

  setDBConnection(endpoint: string): Observable<ApiResponseDto<any>> {
     return this.baseService.get(endpoint);
      // .pipe(takeUntilDestroyed(this.destroyRef))
      // .subscribe({
      //   next: () => this.getBranchList(),
      //   error: (err) => console.error('Error setting DB connection', err),
      // });
  }

  login<T>(endpoint: string, data: any): Observable<T> {
    return this.baseService.post(endpoint, data);
  }
  getUUID(): string {
        this.localStorageService.setLocalStorageItem('skey', this.generateUUID());
        return this.localStorageService.getLocalStorageItem('skey');
  }

   generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  setLocalStorageItem(key: string, value: any): void {
    this.localStorageService.setLocalStorageItem(key, value);
  }
}