import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';

@Injectable()
export class AuthService implements CanActivate {

    constructor(private router: Router) {
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

    canActivate() {
        if (document.cookie.length !== 0) {
            var logincookie = this.getCookie("loginStatus");
            if (logincookie === "1") {
                return true;
            }
            else {
                this.router.navigate(['/login']);
                return false;
            }
        }
        else {
            this.router.navigate(['/login']);
            return false;
        }
    }

    canActivateChild() {
        return true;
    }

}
