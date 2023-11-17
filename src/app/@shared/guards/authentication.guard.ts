import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationGuard {

  constructor(
    private router: Router,
    private tokenService: TokenStorageService,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // console.log(
    //   'this.tokenService.getToken() : ',
    //   this.tokenService.getToken()
    // );

    // if (this.tokenService.getToken()) {
    // }
    // this.router.navigate(['/login']);
    return true;

    // return false;
  }
}
