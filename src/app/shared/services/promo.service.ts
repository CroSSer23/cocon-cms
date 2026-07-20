import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { BehaviorSubject, Observable } from 'rxjs';
import { TableService } from './table.service';
import { WebService } from './web.service';

import * as cloneDeep from "lodash/cloneDeep";
import * as moment from "moment";
import * as momentz from "moment-timezone";
import { environment } from 'src/environments/environment';
import { API } from '../enums/apiNames.enum';

@Injectable()
export class PromoService {
    DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    countList = [
        {
            Label: "Unlimited",
            Value: "Unlimited"
        },
        {
            Label: 5,
            Value: 5
        },
        {
            Label: 10,
            Value: 10
        },
        {
            Label: 15,
            Value: 15
        },
        {
            Label: 20,
            Value: 20
        },
        {
            Label: 30,
            Value: 30
        },
    ];
    promoForm = this.fb.group({
        Code: [null, [Validators.required]],
        Type: [null, [Validators.required]],
        Mode: [null, [Validators.required]],
        StartDate: [null, [Validators.required]],
        EndDate: [null, [Validators.required]],
        Value: [null, [Validators.required]],
        MinPurchaseAmount: [null, [Validators.required]],
        MaxAmount: [null, [Validators.required]],
        RedeemCount: [null, [Validators.required]],
        Categories: [],
    });

    promoTable = {
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
    modeList = [
        {
            text: "Percentage",
            value: 0,
            byDefault: false
        },
        {
            text: "Discount",
            value: 1,
            byDefault: false
        }
    ];
    typeList = [
        {
            text: "Booking",
            value: 0,
            byDefault: false
        },
        {
            text: "Category",
            value: 1,
            byDefault: false
        }
    ];
    classList = [
        {
            text: "CMS generated",
            value: 0,
            byDefault: false
        },
        {
            text: "Auto generated",
            value: 1,
            byDefault: false
        }
    ]


    constructor(
        private fb: FormBuilder,
        private tableService: TableService
    ) { }

    private promoCodeSub = new BehaviorSubject<any>(this.promoTable);
    promoListChanges: Observable<any> = this.promoCodeSub.asObservable();

    createPromoForm() {
        return this.promoForm;
    }

    updatePagesData(data, categoryList) {
        let promoData = [...data.body.Data];
        this.setConstraints(promoData, categoryList);
        this.promoTable.pagination.curPage = data.body.Pagination.Number;
        this.promoTable.pagination.size = data.body.Pagination.Size;
        this.promoTable.pagination.itemCount = data.body.TotalItems;
        let pageExist = this.promoTable.pagesData.find(f => f.pageNum === this.promoTable.pagination.curPage);
        if (pageExist) {
            promoData = this.tableService.setPageData(promoData, pageExist.data, data.body.CurrentIds, "PromoCodeId");
            pageExist.data = cloneDeep(promoData);
            pageExist.lastUpdated = data.body.LastUpdated;
        } else {
            this.promoTable.pagesData.push({
                pageNum: this.promoTable.pagination.curPage,
                data: cloneDeep(promoData),
                lastUpdated: data.body.LastUpdated
            })
        }
        this.promoCodeSub.next({
            pagesData: this.promoTable.pagesData,
            pageNum: this.promoTable.pagination.curPage
        });

    }

    setConstraints(promoData, categoryList): void {
        promoData.forEach(promo => {
            let startTime = momentz.tz(promo.StartDate, environment.STAFF_ZONE).toDate();
            let endTime = momentz.tz(promo.EndDate, environment.STAFF_ZONE).toDate();
            promo.StartTime = startTime.getTime();
            promo.EndTime = endTime.getTime();
            promo.ShowStart = momentz.tz(promo.StartDate, environment.STAFF_ZONE).format('MMM DD YYYY, HH:mm z');
            promo.ShowEnd = momentz.tz(promo.EndDate, environment.STAFF_ZONE).format('MMM DD YYYY, HH:mm z');
            if (promo.Type === 1) {
                promo.CategoryNames = "";
                promo.Categories.forEach((promoCat, index) => {
                    let found = categoryList.find(f => f.CategoryId === promoCat);
                    if (index === (promo.Categories.length - 1)) {
                        promo.CategoryNames += found.Name
                    } else {
                        promo.CategoryNames += found.Name + ", "
                    }
                });
            }
        });
    }
}