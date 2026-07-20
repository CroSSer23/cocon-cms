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
export class StaffService {
    DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    staffTable = {
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
        pagesData: []
    }
    staffForm = this.fb.group({
        Name: [null, [Validators.required]],
        Address: [null],
        GoogleEmail: [null, [Validators.required, CustomValidators.email]],
        Contact: [null, [Validators.required]],
        Products: [null, [Validators.required]],
        Gender: [null, [Validators.required]],
        StaffGroupId: [null, [Validators.required]],
        Rank: [5, [Validators.required]],
        City: [null],
        Zip: [null],
        COCONRating: [null, [Validators.required]]
    });
    weekForm = this.fb.group({
        DayCode: [null, [Validators.required]],
        DayStart: [null, [Validators.required]],
        DayEnd: [null, [Validators.required]],
        BlockTime: this.fb.array([])
    });
    blockTimeForm = this.fb.group({
        DayCode: [null, [Validators.required]],
        Name: [null, [Validators.required]],
        StartTime: [null, [Validators.required]],
        EndTime: [null, [Validators.required]]
    })
    regCodeForm = this.fb.group({
        Email: [null],
        Phone: [null]
    })
    constructor(
        private fb: FormBuilder,
        private tableService: TableService
    ) { }

    private staffSub = new BehaviorSubject<any>(this.staffTable);
    staffListChanges: Observable<any> = this.staffSub.asObservable();

    updatePagesData(data, products, groups) {
        let staffData = [...data.body.Data];
        console.log(staffData)
        this.setConstraints(staffData, products, groups);
        this.staffTable.pagination.curPage = data.body.Pagination.Number;
        this.staffTable.pagination.size = data.body.Pagination.Size;
        this.staffTable.pagination.itemCount = data.body.TotalItems;
        let pageExist = this.staffTable.pagesData.find(f => f.pageNum === this.staffTable.pagination.curPage);
        if (pageExist) {
            staffData = this.tableService.setPageData(staffData, pageExist.data, data.body.CurrentIds, "StaffId");
            pageExist.data = cloneDeep(staffData);
            pageExist.lastUpdated = data.body.LastUpdated;
        } else {
            this.staffTable.pagesData.push({
                pageNum: this.staffTable.pagination.curPage,
                data: cloneDeep(staffData),
                lastUpdated: data.body.LastUpdated
            })
        }
        this.staffSub.next({
            pagesData: this.staffTable.pagesData,
            pageNum: this.staffTable.pagination.curPage
        });
    }

    setConstraints(staffData: any[], products, groups): void {
        staffData.forEach(staff => {
            console.log(staff)
          staff.expand = false;
          const categoryNames = [];
          staff.Categories.forEach(element => {
            categoryNames.push(element.CategoryName);
            element.Products.forEach(product => {
              let prodData = products.find(f => f.ProductId === product.ProductId);
              if (prodData) {
                product.Name = prodData.Name;
              }
            });
          });
          staff.CategoryName = categoryNames.toString();
          if (staff.StaffGroupId) {
            let staffGroup = groups.find(f => f.StaffGroupId === staff.StaffGroupId);
            if (staffGroup) {
              staff.StaffGroupName = staffGroup.Name;
            }
          }
          staff.OrganisationString = '-'
          if (staff.Organisations.length) {

            let orgNameArray = cloneDeep(staff.OrganisationsNames)
            console.log(orgNameArray)
            const indexName = orgNameArray.findIndex(obj => obj === null);
            if (indexName !== -1) {
              orgNameArray.splice(indexName, 1); // Remove the object from the array
            }
            console.log(orgNameArray)
            if (orgNameArray.length) {
              if (orgNameArray.length == 1) {
                staff.OrganisationString = orgNameArray[0]
              } else {


                staff.OrganisationString = orgNameArray[0] + " +" + (orgNameArray.length - 1)
              }
            }

          } else {
            staff.OrganisationString = '-'
          }
        })
      }
}