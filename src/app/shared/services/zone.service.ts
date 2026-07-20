import { Injectable } from '@angular/core';
import * as momentz from "moment-timezone";
import { environment } from 'src/environments/environment';

@Injectable()
export class ZoneService {
    constructor() {
    }

    getStaffZone(dateTime: any): string {
        if (dateTime) {
            return momentz(dateTime).tz(environment.STAFF_ZONE).format("Z");
        } else {
            return momentz().tz(environment.STAFF_ZONE).format("Z");
        }
    }
}