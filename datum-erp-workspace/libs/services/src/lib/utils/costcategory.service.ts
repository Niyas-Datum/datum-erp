import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '@org/services';

@Injectable({
  providedIn: 'root'
})

export class CostCategoryService {

  constructor(
    private baseService:BaseService
  ) { }

  
 /**
   * Get the details
   * @param endpoint api
  */
 getDetails(endpoint: string): Observable<any> {
   return this.baseService.get(endpoint);
  }
  
  /**
   * Save the details
   * @param endpoint api
   * @param data 
  */
 saveDetails(endpoint: string, data: any): Observable<any> {
   return this.baseService.post(endpoint, data);
  }

   /**
   * Update the details
   * @param endpoint api
   * @param data 
  */
  updateDetails(endpoint: string, data: any): Observable<any> {
    return this.baseService.patch(endpoint, data);
  }

  /**
   * Delete the details
   * @param endpoint api
   * @param data 
  */
  deleteDetails(endpoint: string): Observable<any> {
    return this.baseService.delete(endpoint);
  }
}