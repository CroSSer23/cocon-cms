import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import CryptoJS from "crypto-js";
import { environment } from 'src/environments/environment';
import { filter, map } from 'rxjs/operators';


@Injectable()
export class RequestInterceptorService implements HttpInterceptor {

    constructor() { }

    intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // All HTTP requests are going to go through this method
        return next.handle(httpRequest).pipe(
            filter(event => event instanceof HttpResponse),
            map((event: HttpResponse<any>) =>
                event.clone({
                    body: event.body ? this.getPayloadData(event.body) : ""
                })
            )
        );
    }

    private getPayloadData(encrypt: any): any {
        let rawData = CryptoJS.AES.decrypt(encrypt, environment.PAYLOAD_ENC_KEY);
        let decStr = rawData.toString(CryptoJS.enc.Utf8);
        return decStr ? JSON.parse(decStr) : null;
    }

}