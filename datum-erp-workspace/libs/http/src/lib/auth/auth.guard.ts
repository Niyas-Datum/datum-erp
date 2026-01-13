import { Injectable,inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LocalStorageService } from '@org/services';

@Injectable({
    providedIn:'root'
})
export class AuthGuard implements CanActivate{
    private localStorageService: LocalStorageService = inject(LocalStorageService);

    private router = inject(Router);

    canActivate(): boolean {

        if ( this.localStorageService.isLoggedIn()) {
            return true;
        } else {
            this.router.navigate(['/auth']);
            return false;
        }
    }
    
}