import { inject, Injectable } from "@angular/core";
import { ApiResponseDto } from "@org/models";
import { BackgroundHttpService, BaseService } from "@org/services";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class InventoryAppService {
  fetchCountryOfOrigin$(): any {
    throw new Error('Method not implemented.');
  }
  fetchCountryOfOrigin(): any {
    throw new Error('Method not implemented.');
  }
  fetchItemBrands(): any {
    throw new Error('Method not implemented.');
  }
  fetchItemColors(): any {
    throw new Error('Method not implemented.');
  }
  fetchParentItems(): any {
    throw new Error('Method not implemented.');
  }
  fetchCategories(): any {
    throw new Error('Method not implemented.');
  }
  fetchItemQuality(): any {
    throw new Error('Method not implemented.');
  }
  fetchTaxTypes(): any {
    throw new Error('Method not implemented.');
  }
  fetchUnits(): any {
    throw new Error('Method not implemented.');
  }
  fetchBranches(): any {
    throw new Error('Method not implemented.');
  }

  baseservice = inject(BaseService); // http request
  backgroundHttpService = inject(BackgroundHttpService);
  constructor() {
    console.log('InventoryAppService initialized');
  }

  fetch<T>(endpoint: string, background: boolean = false, key: string | null = null): Observable<ApiResponseDto<T>> {
    if (background) {
      return this.backgroundHttpService.fetch<ApiResponseDto<T>>(endpoint, key, true);
    }

    return this.baseservice.get(endpoint);
  }
  post<T>(endpoint: string, data: any): Observable<ApiResponseDto<T>> {

    return this.baseservice.post(endpoint, data);

  }
  patch<T>(endpoint: string, data: any): Observable<ApiResponseDto<T>> {

    return this.baseservice.patch(endpoint, data);

  }
  delete<T>(endpoint: string): Observable<ApiResponseDto<T>> {

    return this.baseservice.delete(endpoint);

  }




}