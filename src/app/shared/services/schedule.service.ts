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
export class ScheduleService {
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
 

    scheduleTable = {
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
        staffData:[],
        pagesData: [{
            pageNum: 1,
            data: [],
            lastUpdated: null
        }],
        lastUpdated: null
    }
    dateFormat = "dd/MM/yyyy";
    FORMAT_DD_MM_YYYY = "DD/MM/YYYY";
    TIME_FORMAT_HH_MM = "HH:mm";
    TIME_FORMAT_HH_MM_SS = "HH:mm:ss";
    COLUMN_NAME_FORMAT = "ddd DD MMM";

    constructor(
        private fb: FormBuilder,
        private tableService: TableService
    ) { }

    private scheduleSub = new BehaviorSubject<any>(this.scheduleTable);
    scheduleListChanges: Observable<any> = this.scheduleSub.asObservable();

   

    updatePagesData(oldData,data) {
        let dataNew= [...data.body.Data];
        // let scheduleData = oldData.concat(dataNew)
        // console.log(scheduleData)
        dataNew.forEach(newSch => {
          const index = oldData.findIndex(oldSch => oldSch.StaffId === newSch.StaffId);
          if (index !== -1) {
            // Object found in array2, update with data from array1
            oldData[index] = { ...oldData[index], ...newSch };
          } else {
            // Object not found in array2, add a new one
            oldData.push({ ...newSch });
          }
        })
        
        let scheduleData = [...oldData]
        scheduleData.forEach((sch, index) => {
          const indexFound = data.body.AllStaffIds.findIndex(allSch => allSch === sch.StaffId);
          if(indexFound==-1){
            scheduleData.splice(index, 1);
          }
        })
        
        // let allIds=[]
        // scheduleData.forEach(sch => {
        //   allIds.push(sch.StaffId)
        // })
        this.scheduleTable.pagination.curPage = data.body.Pagination.Number;
        this.scheduleTable.pagination.size = data.body.Pagination.Size;
        this.scheduleTable.pagination.itemCount = data.body.TotalItems;
        this.scheduleTable.lastUpdated = data.body.LastUpdated;
        this.setTimeFormat(scheduleData);
        this.scheduleTable.staffData = scheduleData
        let pageExist = this.scheduleTable.pagesData.find(f => f.pageNum === this.scheduleTable.pagination.curPage);
        if (pageExist) {
            scheduleData = this.tableService.setPageData(scheduleData, pageExist.data, [], "StaffId");
            pageExist.data = cloneDeep(scheduleData);
            pageExist.lastUpdated = data.body.LastUpdated;
        } else {
            this.scheduleTable.pagesData.push({
                pageNum: this.scheduleTable.pagination.curPage,
                data: cloneDeep(scheduleData),
                lastUpdated: data.body.LastUpdated,
                
            })
        }
        
        this.scheduleSub.next({
            pagesData: this.scheduleTable.pagesData,
            pageNum: this.scheduleTable.pagination.curPage
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
    setTimeFormat(scheduleData) {
        scheduleData.forEach(staff => {
          staff.GeneralOfferHours = 0;
          staff.InstantConfirmationHours = 0;
          let schedule = staff.Schedule;
          Object.keys(schedule).forEach(f => {
            if (schedule[f].IsWorking) {
              // General Offer
              if (schedule[f].GeneralOffer.DayStart) {
                let start = moment(schedule[f].GeneralOffer.DayStart, "HH:mm:ss");
                let end = moment(schedule[f].GeneralOffer.DayEnd, "HH:mm:ss");
                staff.GeneralOfferHours += end.diff(start, "hour");
                schedule[f].GeneralOffer.DayStart = start.format("HH:mm");
                schedule[f].GeneralOffer.DayEnd = end.format("HH:mm");
                if (!schedule[f].GeneralOffer.CurrentScheduleEnd) {
                  schedule[f].GeneralOffer.ongDay = true;
                } else if (schedule[f].GeneralOffer.CurrentScheduleEnd) {
                  let schEnd = moment(schedule[f].GeneralOffer.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
                  if (schEnd.isSame(moment(schedule[f].Date, this.FORMAT_DD_MM_YYYY))) {
                    if (schEnd.isSame(moment(schedule[f].GeneralOffer.CurrentSchedular, this.FORMAT_DD_MM_YYYY))) {
                      schedule[f].GeneralOffer.singleDay = true;
                    } else {
                      schedule[f].GeneralOffer.specDay = true;
                    }
                  } else {
                    schedule[f].GeneralOffer.specDay = true;
                  }
                }
              }
    
              // Instant Confirmation
              if (schedule[f].InstantConfirmation.DayStart) {
                let start = moment(schedule[f].InstantConfirmation.DayStart, "HH:mm:ss");
                let end = moment(schedule[f].InstantConfirmation.DayEnd, "HH:mm:ss");
                staff.InstantConfirmationHours += end.diff(start, "hour");
                schedule[f].InstantConfirmation.DayStart = start.format("HH:mm");
                schedule[f].InstantConfirmation.DayEnd = end.format("HH:mm");
                if (!schedule[f].InstantConfirmation.CurrentScheduleEnd) {
                  schedule[f].InstantConfirmation.ongDay = true;
                } else if (schedule[f].InstantConfirmation.CurrentScheduleEnd) {
                  let schEnd = moment(schedule[f].InstantConfirmation.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
                  if (schEnd.isSame(moment(schedule[f].Date, this.FORMAT_DD_MM_YYYY))) {
                    if (schEnd.isSame(moment(schedule[f].InstantConfirmation.CurrentSchedular, this.FORMAT_DD_MM_YYYY))) {
                      schedule[f].InstantConfirmation.singleDay = true;
                    } else {
                      schedule[f].InstantConfirmation.specDay = true;
                    }
                  } else {
                    schedule[f].InstantConfirmation.specDay = true;
                  }
                }
              }
    
              // Block times
              if (schedule[f].BlockTime.CurrentSchedular) {
                if (!schedule[f].BlockTime.CurrentScheduleEnd) {
                  schedule[f].BlockTime.ongDay = true;
                } else if (schedule[f].BlockTime.CurrentScheduleEnd) {
                  let schEnd = moment(schedule[f].BlockTime.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
                  if (schEnd.isSame(moment(schedule[f].Date, this.FORMAT_DD_MM_YYYY))) {
                    if (schEnd.isSame(moment(schedule[f].BlockTime.CurrentSchedular, this.FORMAT_DD_MM_YYYY))) {
                      schedule[f].BlockTime.singleDay = true;
                    } else {
                      schedule[f].BlockTime.specDay = true;
                    }
                  } else {
                    schedule[f].BlockTime.specDay = true;
                  }
                }
              }
            }
          })
        })
      }
}