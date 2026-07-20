import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

@Injectable()
export class AgentService implements CanActivate {
    constructor(private router: Router, private cookieService: CookieService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (document.cookie.length !== 0) {
            var type = this.getCookie("type");
            if (type === "0") {
                return true;
            } else if (type === "1") {
                if(state.url=='/faq'||state.url=='/message'||state.url=='/support'){
                    return true
                }else{
                    this.router.navigate(['/support']);
                    return false;
                }
                    
            } 
            else if (type === "2") {
                if(state.url=='/checkavailability' ||state.url=='/orgbooking' || state.url=='/faq'){
                    return true
                }else{
                    this.router.navigate(['/checkavailability']);
                    return false;
                }
                    
            }else {
                this.cookieService.deleteAll();
                this.router.navigate(['/login']);
                return false;
            }
        }
        else {
            this.cookieService.deleteAll();
            this.router.navigate(['/login']);
            return false;
        }
    }

    getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
}