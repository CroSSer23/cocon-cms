import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { BehaviorSubject, Observable } from 'rxjs';
import { TableService } from './table.service';

import * as cloneDeep from "lodash/cloneDeep";
import * as momentz from "moment-timezone";
import { environment } from 'src/environments/environment';

@Injectable()
export class MessageService {
    DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    messageTable = {
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

    private messageSub = new BehaviorSubject<any>(this.messageTable);
    messageListChanges: Observable<any> = this.messageSub.asObservable();

    updatePagesData(data) {
        let messageData = [...data.body.Data];
        messageData.forEach(element => {
            element.DateShow = momentz.tz(element.Date, environment.STAFF_ZONE).format("MMM DD YYYY, HH:mm z");
        });
        // this.messageDataRaw = clonedeep(this.messageData);
        this.messageTable.pagination.curPage = data.body.Pagination.Number;
        this.messageTable.pagination.size = data.body.Pagination.Size;
        this.messageTable.pagination.itemCount = data.body.TotalItems;
        let pageExist = this.messageTable.pagesData.find(f => f.pageNum === this.messageTable.pagination.curPage);
        if (pageExist) {
            messageData = this.tableService.setPageData(messageData, pageExist.data, data.body.CurrentIds, "MessageId");
            pageExist.data = cloneDeep(messageData);
            pageExist.lastUpdated = data.body.LastUpdated;
        } else {
            this.messageTable.pagesData.push({
                pageNum: this.messageTable.pagination.curPage,
                data: cloneDeep(messageData),
                lastUpdated: data.body.LastUpdated
            })
        }
        this.messageSub.next({
            pagesData: this.messageTable.pagesData,
            pageNum: this.messageTable.pagination.curPage
        });
    }

}