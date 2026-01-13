import { Injectable, inject } from '@angular/core';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CrudeService {
  baseService = inject(BaseService);

  getDetails(endpoint: string): Observable<any> {
    return this.baseService.get(endpoint);
  }

  saveDetails(endpoint: string, data: any): Observable<any> {
    return this.baseService.post(endpoint, data);
  }

  updateDetails(endpoint: string, data: any): Observable<any> {
    return this.baseService.patch(endpoint, data);
  }

  deleteDetails(endpoint: string): Observable<any> {
    return this.baseService.delete(endpoint);
  }
}
