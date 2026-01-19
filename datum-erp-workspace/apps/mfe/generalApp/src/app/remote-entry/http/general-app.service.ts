import { inject,  Injectable } from "@angular/core";
import { ApiResponseDto } from "@org/models";
import { BaseService } from "@org/services";
import { Observable } from "rxjs";

@Injectable()
export class GeneralAppService {

  baseservice = inject(BaseService); // http request

  constructor() { 
    console.log('GeneralAppService initialized');   
  }

          fetch<T>(endpoint: string):Observable<ApiResponseDto<T>> {

                  return this.baseservice.get(endpoint);
          }
          post<T>(endpoint: string, data: any):Observable<ApiResponseDto<T>> {
            return this.baseservice.post(endpoint, data);
          }
          patch<T>(endpoint: string, data: any):Observable<ApiResponseDto<T>> {
            return this.baseservice.patch(endpoint, data);
          }
          delete<T>(endpoint: string):Observable<ApiResponseDto<T>> {
            return this.baseservice.delete(endpoint);
          }

  
  }