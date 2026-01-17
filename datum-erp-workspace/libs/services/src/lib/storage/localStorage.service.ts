import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {
    setLocalStorageItem(feildName: string, feildValue: string): void {
        localStorage.setItem(feildName, feildValue);
    }

    getLocalStorageItem(feildName: string): string {
        return localStorage.getItem(feildName) ?? '';
    }

    clearLocalStorage(): void {
        localStorage.clear();
    }

    setToken(token: string): void {
        // Save to both localStorage and sessionStorage for compatibility
        localStorage.setItem('access_token', token);
        sessionStorage.setItem('access_token', token);
    }

    getToken(): string {
        // Check localStorage first, then sessionStorage
        return localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
    }

    clearToken(): void {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
    }

    isLoggedIn(): boolean {
        const token = this.getLocalStorageItem('access_token') || sessionStorage.getItem('access_token') || '';
        console.log('[LocalStorageService] Checking login status:', !!token);
        return !!token;
    }
}