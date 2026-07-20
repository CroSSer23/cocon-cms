import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild } from '@angular/router';
import { Router } from '@angular/router';


@Injectable()
export class LoginService implements CanActivate, CanActivateChild {

  constructor(
    private router: Router,
    // private webapi: WebService
    ) {
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
        this.router.navigate(['/dashboard']);
      }
      else {
        return true;
      }
    }
    else {
      return true;
    }
  }

  canActivateChild() {
    return true;
  }

}