import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginService } from './login.service';
import { environment } from 'src/environments/environment';
import * as moment from "moment";
import CryptoJS from "crypto-js";
import { map, tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';

@Injectable()
export class WebService {
    private url = environment.API_BASE_URL;

    constructor(
        private http: HttpClient,
        private loginService: LoginService,
        private cookieService: CookieService,
    ) { }

    // Fetch data using anonymous token
    requestAnonymous(url, data): Observable<any> {
        var adminId = this.getCookie("adminId");
        if(data==null){
            data={}
        }
        data.AdminId= parseInt(adminId)
        data = this.setPayloadData(data);
        let AnonymousToken = this.loginService.getCookie("anonymousToken");
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
                'Authorization': 'Bearer ' + AnonymousToken,
                'platform': 'web',
                'api-version': '1.0',
                'device-id': 'web',
                'device-timestamp': moment().format(),
                'api-client': 'cocon-cms',
                'x-encrypted': "true"
            }),
            observe: "response" as "body",
            responseType: 'text' as "json"
        }
        return this.http.post(this.url + url, data, httpOptions)
        // .pipe(
        //     tap(result => {
        //         console.log(result);
        //         return result;
        //     })
        // )
    }

    // Request data from given url, return observable
    request(url, data): Observable<any> {

        var adminId = this.getCookie("adminId");
        if(data==null){
            data={}
        }
        data.AdminId=parseInt(adminId)

        data = this.setPayloadData(data);
        const appVersion = navigator.appVersion;
        const anonymousToken = this.loginService.getCookie("anonymousToken");
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
                'Authorization': 'Bearer ' + anonymousToken,
                'platform': 'web',
                'api-version': '1.0',
                'device-id': appVersion,
                'device-timestamp': moment().format(),
                'api-client': 'cocon-cms',
                'x-encrypted': "true"
            }),
            observe: "response" as "body",
            responseType: 'text' as "json"
        }
        return this.http.post(this.url + url, data, httpOptions)
            // .pipe(
            //     map(result => {
            //         console.log(result);
            //         return result;
            //     })
            // )
    }

    getPayloadData(encrypt: any): any {
        let rawData = CryptoJS.AES.decrypt(encrypt, environment.PAYLOAD_ENC_KEY);
        return JSON.parse(rawData.toString(CryptoJS.enc.Utf8));
    }

    setPayloadData(data: any): string {
        return CryptoJS.AES.encrypt(JSON.stringify(data), environment.PAYLOAD_ENC_KEY).toString();
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