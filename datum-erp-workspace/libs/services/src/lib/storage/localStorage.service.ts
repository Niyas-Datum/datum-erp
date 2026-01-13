import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {
    setLocalStorageItem(feildName: string,feildValue: string):void{
        localStorage.setItem(feildName,feildValue);
    }

    getLocalStorageItem(feildName: string):string{
        return localStorage.getItem(feildName) ?? '';
    }
    clearLocalStorage():void{
        localStorage.clear();
    }
   setToken(token:string):void{
    sessionStorage.setItem('access_token',token);
   }
   getToken():string{
    return sessionStorage.getItem('access_token') ?? '';
   }
   clearToken():void{
    sessionStorage.removeItem('access_token');
   }
   isLoggedIn() {
       
    return !!this.getLocalStorageItem('access_token');
}
}