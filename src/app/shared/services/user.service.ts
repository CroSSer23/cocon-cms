import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { BehaviorSubject, Observable } from 'rxjs';
import { TableService } from './table.service';

import * as cloneDeep from "lodash/cloneDeep";
import { WebService } from './web.service';
import { API } from '../enums/apiNames.enum';

@Injectable()
export class UserService {
    DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    userTable = {
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
    genderList = [
        {
            text: "Male",
            value: 0,
            byDefault: false
        },
        {
            text: "Female",
            value: 1,
            byDefault: false
        }
    ];
    providerList = [
        {
            text: "Google",
            value: "GoogleId",
            byDefault: false
        },
        {
            text: "Facebook",
            value: "FacebookId",
            byDefault: false
        },
        {
            text: "Apple",
            value: "AppleId",
            byDefault: false
        }
    ];
    prefTherapistList = [
        {
            text: "Male",
            value: 0,
            byDefault: false,
        },
        {
            text: "Female",
            value: 1,
            byDefault: false,
        },
        {
            text: "Either",
            value: 2,
            byDefault: false,
        }
    ];
    userTypeList = [
        {
            type: 0,
            name: 'Only Signed up users'
        },
        {
            type: 1,
            name: 'Only CMS users'
        },
        {
            type: 2,
            name: 'Both'
        }
    ]

    constructor(
        private fb: FormBuilder,
        private tableService: TableService,
        private webapi: WebService
    ) { }

    private userSub = new BehaviorSubject<any>(this.userTable);
    userListChanges: Observable<any> = this.userSub.asObservable();

    updatePagesData(data) {
        let userData = [...data.body.Data];
        console.log(userData)
        userData.forEach(element => {
            this.setUserConstraints(element);
        });
        this.userTable.pagination.curPage = data.body.Pagination.Number;
        this.userTable.pagination.size = data.body.Pagination.Size;
        this.userTable.pagination.itemCount = data.body.TotalItems;
        let pageExist = this.userTable.pagesData.find(f => f.pageNum === this.userTable.pagination.curPage);
        if (pageExist) {
            userData = this.tableService.setPageData(userData, pageExist.data, data.body.CurrentIds, "UserId");
            pageExist.data = cloneDeep(userData);
            pageExist.lastUpdated = data.body.LastUpdated;
        } else {
            this.userTable.pagesData.push({
                pageNum: this.userTable.pagination.curPage,
                data: cloneDeep(userData),
                lastUpdated: data.body.LastUpdated
            })
        }
        this.userSub.next({
            pagesData: this.userTable.pagesData,
            pageNum: this.userTable.pagination.curPage
        });
    }

    setUserConstraints(userData) {
        userData.Address = "";
        if (userData.Floor) {
            userData.Address += userData.Floor + ", ";
        }
        if (userData.Street) {
            userData.Address += userData.Street;
        }
        if (userData.HouseNumber) {
            userData.Address += " "+userData.HouseNumber;
        }
        if (userData.Zip) {
            userData.Address += ", " + userData.Zip;
        }
        if (userData.City) {
            userData.Address += " " + userData.City;
        }
        if (userData.Address && userData.Address.length > 55) {
            userData.AddressShow = userData.Address.substr(0, 55) + "...";
            userData.AddressExtra = true;
        } else {
            userData.AddressShow = userData.Address;
            userData.AddressExtra = false;
        }
        if (userData.Notes && userData.Notes.length > 15) {
            userData.NotesShow = userData.Notes.substr(0, 15) + "...";
            userData.NotesExtra = true;
        } else {
            userData.NotesShow = userData.Notes;
            userData.NotesExtra = false;
        }

        if (userData.CSNotes && userData.CSNotes.length > 15) {
            userData.CSNotesShow = userData.CSNotes.substr(0, 15) + "...";
            userData.CSNotesExtra = true;
          } else {
            userData.CSNotesShow = userData.CSNotes;
            userData.CSNotesExtra = false;
          }
          if (userData.TherapistNotes && userData.TherapistNotes.length > 15) {
            userData.TherapistNotesShow = userData.TherapistNotes.substr(0, 15) + "...";
            userData.TherapistNotesExtra = true;
          } else {
            userData.TherapistNotesShow = userData.TherapistNotes;
            userData.TherapistNotesExtra = false;
          }
    }
     adminLogout(){
    let obj={}
    console.log(obj)
    this.webapi.request(API.ADMIN_LOGOUT,obj )
      .subscribe(
        data => {
          console.log("logout")
        },
        error => {
          console.log(error)
        }
      )
  }
}