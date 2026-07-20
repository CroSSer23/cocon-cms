import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { BehaviorSubject, Observable } from 'rxjs';
import { TableService } from './table.service';

import * as cloneDeep from "lodash/cloneDeep";
import * as moment from "moment";
import { environment } from 'src/environments/environment';

@Injectable()
export class LocationRequestService {
    DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    locationTable = {
        sort: {
            key: "",
            value: ""
        },
        activeFilters: [],
        pagination: {
            curPage: 1,
            size: this.DEFAULT_PAGE_SIZE,
            itemCount: this.DEFAULT_PAGE_SIZE
        },
        pagesData: [{
            pageNum: 1,
            data: [],
            lastUpdated: null
        }]
    }
    constructor(
        private fb: FormBuilder,
        private tableService: TableService
    ) { }

    private locationSub = new BehaviorSubject<any>(this.locationTable);
    locationListChanges: Observable<any> = this.locationSub.asObservable();

    updatePagesData(data) {
        let locationData = [...data.body.Data.LocationRequest];
        locationData.forEach(element => {
            element.CreatedShow = moment(element.Created).format("DD MMM YYYY")
        });
        this.locationTable.pagination.curPage = data.body.Pagination.Number;
        this.locationTable.pagination.size = data.body.Pagination.Size;
        this.locationTable.pagination.itemCount = data.body.TotalItems;
        let pageExist = this.locationTable.pagesData.find(f => f.pageNum === this.locationTable.pagination.curPage);
        if (pageExist) {
            locationData = this.tableService.setPageData(locationData, pageExist.data, data.body.CurrentIds, "LocationRequestId");
            pageExist.data = cloneDeep(locationData);
            pageExist.lastUpdated = data.body.LastUpdated;
        } else {
            this.locationTable.pagesData.push({
                pageNum: this.locationTable.pagination.curPage,
                data: cloneDeep(locationData),
                lastUpdated: data.body.LastUpdated
            })
        }
        this.locationSub.next({
            pagesData: this.locationTable.pagesData,
            pageNum: this.locationTable.pagination.curPage
        });
    }
}