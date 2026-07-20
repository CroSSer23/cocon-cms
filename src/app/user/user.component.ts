import { Component, OnInit, ViewChild } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import { ToastyService } from 'ng2-toasty';
import * as cloneDeep from "lodash/cloneDeep";
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { environment } from 'src/environments/environment';
import { TableService } from '../shared/services/table.service';
import { UserService } from '../shared/services/user.service';
import { API } from '../shared/enums/apiNames.enum';
import * as momentz from "moment-timezone";

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  animations: [
    trigger("slideIn", [
      state("*", style({ "overflow-y": "hidden" })),
      state("void", style({ "overflow-y": "hidden" })),
      transition("* => void", [
        style({ height: "*" }),
        animate(250, style({ height: 0 })),
      ]),
      transition("void => *", [
        style({ height: "0" }),
        animate(250, style({ height: "*" })),
      ]),
    ]),
    trigger("slideInRight", [
      state("*", style({ "overflow-x": "hidden" })),
      state("void", style({ "overflow-x": "hidden" })),
      transition("* => void", [
        style({ width: "*" }),
        animate(250, style({ width: "*" })),
      ]),
      transition("void => *", [
        style({ width: "0" }),
        animate(250, style({ width: 0 })),
      ]),
    ]),
    trigger("enterAnimation", [
      transition(":enter", [
        style({ transform: "translateX(100%)", opacity: 0 }),
        animate("500ms", style({ transform: "translateX(0)", opacity: 1 })),
      ]),
      transition(":leave", [
        style({ transform: "translateX(0)", opacity: 1 }),
        animate("500ms", style({ transform: "translateX(100%)", opacity: 0 })),
      ]),
    ]),
    trigger("topAnimation", [
      transition(":enter", [
        style({ transform: "translateY(100%)", opacity: 0 }),
        animate("300ms", style({ transform: "translateY(0)", opacity: 1 })),
      ]),
      transition(":leave", [
        style({ transform: "translateY(0)", opacity: 1 }),
        animate("300ms", style({ transform: "translateY(100%)", opacity: 0 })),
      ]),
    ]),
    trigger("fadeInOut", [
      transition(":enter", [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(":leave", [
        animate(500, style({ opacity: 0 })),
      ]),
    ]),
  ]
})
export class UserComponent implements OnInit {
  userData: any[];
  loadingFlag: boolean;
  userDataRaw: any[];
  sortName: string;
  sortValue: string;
  genderList = this.userService.genderList;
  providerList = this.userService.providerList;
  prefTherapistList = this.userService.prefTherapistList;
  userTypeList = this.userService.userTypeList;
  selectedType: number;
  exportModalVisible: boolean;
  exportType: string;
  exportErrMsg: string;
  userTablePageIndex: number;
  pageSize: number;
  isExporting: boolean;
  showAllData: boolean;
  showTablePagination: boolean;
  DEFAULT_PAGE_SIZE: number;
  userTablePageSizeOptions: number[];
  detailVisible: boolean;
  userDetail: any;
  loadingDetail: boolean;
  failedToLoadUserDetail: boolean;
  showUserAnalytics: boolean;
  loadingUserAnalytics: boolean;
  exportFilterIncluded: boolean;
  userDetailEditMode: boolean;
  userForm: FormGroup;
  @ViewChild("placesRef", { static: true }) laceDirective;
  options = {
    componentRestrictions: { country: 'NL' }
  }
  editUserDetail: any;
  isUserUpdating: boolean;
  centerData: any;
  serviceModalVisible: boolean;
  latitude: any;
  longitude: any;
  reachOutTime: number;
  showCoconNotesTextBox: boolean;
  savingCoconNotes: boolean;
  coconNotes: string;
  searchBoxValue: any;
  userTable: { sort: { key: string; value: string; }; activeFilters: any[]; pagination: { curPage: number; size: number; itemCount: number; }; pagesData: any[] };
  USER_LIST_FILTER = {
    GENDER: "Gender"
  }
  previousSearchValue: string;
  userListSubscription: any;
  CSNotes: any;
  showCSNotesTextBox: boolean;
  savingCSNotes: boolean;
  showTherapistNotesTextBox: boolean;
  TherapistNotes: any;
  savingTherapistNotes: boolean;

  public handleAddressChange(address) {
    let components = this.getAddressComponents(address.address_components);
    this.userForm.controls.Street.setValue(components.street);
    this.userForm.controls.City.setValue(components.city);
    this.userForm.controls.Zip.setValue(components.zipCode);
    this.latitude = address.geometry.location.lat();
    this.longitude = address.geometry.location.lng();
  }

  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private router: Router,
    private fb: FormBuilder,
    private tableService: TableService,
    private userService: UserService
  ) {
    this.DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    this.userData = [];
    this.userDataRaw = [];
    // this.DEFAULT_PAGE_SIZE = 10;
    this.showTablePagination = true;
    this.userTablePageIndex = 1;
    this.pageSize = this.DEFAULT_PAGE_SIZE;
    this.userTablePageSizeOptions = [10, 20, 50, 100];
    this.webapi.request(API.METADATA, {
      Metadata: ['PageSizeOptions', "Center"]
    }).subscribe(
      data => {
        this.userTablePageSizeOptions = data.body.Data.PageSizeOptions
        this.centerData = data.body.Data.Center[0];
      }
    )
    this.userTable = this.userService.userTable;
    this.getUserList({
      filters: [],
      pagination: {
        curPage: this.userTable.pagination.curPage,
        size: this.DEFAULT_PAGE_SIZE
      },
      sort: this.userTable.sort
    });
    this.selectedType = 2;
    this.userForm = this.fb.group({
      Name: [null, [Validators.required]],
      Gender: [null, [Validators.required]],
      Street: [null],
      Floor: [null],
      City: [null],
      Zip: [null],
      Elevator: [null],
      Therapist: [null],
      Notes: [null],
      CoconNotes: [null]
    });
  }

  ngOnInit() {
    this.previousSearchValue = "";
    this.userListSubscription = this.userService.userListChanges.subscribe(userChanges => {
      this.userTable.pagesData = cloneDeep(userChanges.pagesData);
      let selPage = this.userTable.pagesData.find(f => f.pageNum === userChanges.pageNum);
      if (selPage) {
        this.userData = cloneDeep(selPage.data);
      }
    });
  }

  ngOnDestroy() {
    this.userListSubscription.unsubscribe();
  }
  getUserList({
    sort,
    filters,
    pagination
  }): void {
    let pageExist = this.userTable.pagesData.find(f => f.pageNum === pagination.curPage);
    let currentIds = [];
    let lastUpdated = null;
    if (pageExist) {
      currentIds = pageExist.data.map(f => f.UserId);
      lastUpdated = pageExist.lastUpdated;
    } else {
      this.userTable.pagesData.push({
        pageNum: pagination.curPage,
        data: [],
        lastUpdated: null
      })
    }
    this.loadingFlag = true;
    this.webapi.request(API.USER, {
      Search: this.searchBoxValue,
      Sort: {
        Key: sort.key,
        Value: sort.value
      },
      Filters: filters.map(fil => {
        return {
          Key: fil.key,
          Values: fil.values
        }
      }),
      Pagination: {
        Number: pagination.curPage,
        Size: pagination.size
      },
      CurrentIds: currentIds,
      LastUpdated: lastUpdated
    }).subscribe(
      data => {
        this.userService.updatePagesData(data);
        this.loadingFlag = false;
        // this.userData = [...data.body.Data];
        // this.userData.forEach(element => {
        //   this.setUserConstraints(element);
        // });
        // this.userTable.pagination.curPage = data.body.Pagination.Number;
        // this.userTable.pagination.size = data.body.Pagination.Size;
        // this.userTable.pagination.itemCount = data.body.TotalItems;
        // let pageExist = this.userTable.pagesData.find(f => f.pageNum === this.userTable.pagination.curPage);
        // if (pageExist) {
        //   this.userData = this.tableService.setPageData(this.userData, pageExist.data, data.body.CurrentIds, "UserId");
        //   pageExist.data = cloneDeep(this.userData);
        //   pageExist.lastUpdated = data.body.LastUpdated;
        // } else {
        //   this.userTable.pagesData.push({
        //     pageNum: this.userTable.pagination.curPage,
        //     data: cloneDeep(this.userData),
        //     lastUpdated: data.body.LastUpdated
        //   })
        // }
        // this.userDataRaw = cloneDeep(this.userData);

      },
      error => {
        let msg = error.headers.get('message');
        this.toast.error({
          title: "Error",
          msg,
          theme: 'bootstrap',
          timeout: 3000
        })
      }
    )
  }

  changeView(event) {
    let appSignedFilter = this.userTable.activeFilters.find(f => f.key === "AppSignedUp");
    switch (event) {
      case 0:
      case 1: {
        appSignedFilter ? appSignedFilter.values = [event] : this.userTable.activeFilters.push({
          key: "AppSignedUp",
          values: [event]
        })
        break;
      }
      case 2:
        appSignedFilter ? this.userTable.activeFilters = this.userTable.activeFilters.filter(f => f.key !== "AppSignedUp") : true;
        break;
      default:
        break;
    }
    this.userTable.pagination.curPage = 1;
    this.getUserList({
      sort: this.userTable.sort,
      pagination: this.userTable.pagination,
      filters: this.userTable.activeFilters
    })
    // if (event === 0) {
    //   this.userData = this.userDataRaw.filter(f => {
    //     if (f.GoogleId || f.AppleId || f.FacebookId) {
    //       return true;
    //     } else {
    //       return false;
    //     }
    //   })
    // } else if (event === 1) {
    //   this.userData = this.userDataRaw.filter(f => {
    //     if (f.GoogleId || f.AppleId || f.FacebookId) {
    //       return false;
    //     } else {
    //       return true;
    //     }
    //   })
    // } else {
    //   this.userData = cloneDeep(this.userDataRaw);
    // }
  }

  onKeyUp(): void {
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchUsers("");
    }
  }

  resetSearch(): void {
    this.searchBoxValue = "";
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchUsers("");
    }
  }

  // Used to search for input value
  searchUsers(value: string): void {
    if (this.searchBoxValue === this.previousSearchValue) {
      return;
    }
    this.previousSearchValue = this.searchBoxValue;
    this.userTable.activeFilters = [];
    this.userTable.sort = {
      key: "",
      value: ""
    }
    this.userTable.pagination = {
      curPage: 1,
      itemCount: this.userTable.pagination.itemCount,
      size: this.userTable.pagination.size
    }
    let val: string;
    val = value.toLowerCase();
    this.getUserList({
      sort: this.userTable.sort,
      filters: this.userTable.activeFilters,
      pagination: this.userTable.pagination
    })
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    let { key, value } = sort;
    if (key) {
      // currentTab.activeFilters = [];
      this.userTable.sort = {
        key,
        value: value === "ascend" ? "ascending" : "descending",
      }
      if (value === null) {
        this.userTable.sort = {
          key: "",
          value: ""
        }
      }
      this.userTable.pagination.curPage = 1;
      this.userTable.pagination.itemCount = 0;
      this.getUserList({
        sort: this.userTable.sort,
        filters: this.userTable.activeFilters,
        pagination: this.userTable.pagination
      })
    }
  }

  changePageNumber(event) {
    this.loadingFlag = true;
    this.getUserList({
      sort: {
        key: this.userTable.sort.key,
        value: this.userTable.sort.value,
      },
      filters: this.userTable.activeFilters,
      pagination: {
        curPage: event,
        size: this.userTable.pagination.size
      }
    })
  }

  changePageSize(event) {
    this.userTable.pagination.curPage = 1;
    this.loadingFlag = true;
    this.getUserList({
      sort: {
        key: this.userTable.sort.key,
        value: this.userTable.sort.value,
      },
      filters: this.userTable.activeFilters,
      pagination: {
        curPage: this.userTable.pagination.curPage,
        size: event
      }
    })
  }


  changeGenderFilter(selectedFilter: any): void {
    // Check if filter is same as previous.
    let filterExist = this.userTable.activeFilters.find(f => f.key === this.USER_LIST_FILTER.GENDER);
    if (selectedFilter === null) {
      // filter reset or clicked outside without applying.
      if (!filterExist) {
        return;
      }
    } else {
      // filter applied - check if its same as existing.
      if (filterExist && filterExist.values.includes(selectedFilter)) {
        return;
      }
    }

    if (selectedFilter === null) {
      // filter reset
      let genderFilterExist = this.userTable.activeFilters.find(f => f.key === this.USER_LIST_FILTER.GENDER);
      if (genderFilterExist) {
        this.userTable.activeFilters = this.userTable.activeFilters.filter(f => f.key !== this.USER_LIST_FILTER.GENDER);
      }
    } else {
      // filter have some value
      let genderFilterExist = this.userTable.activeFilters.find(f => f.key === this.USER_LIST_FILTER.GENDER);
      if (!genderFilterExist) {
        this.userTable.activeFilters.push({
          key: this.USER_LIST_FILTER.GENDER,
          values: [selectedFilter]
        });
      } else {
        genderFilterExist.values = [selectedFilter]
      }
    }
    this.userTable.pagination.curPage = 1;
    this.userTable.pagination.itemCount = 0;
    this.getUserList({
      sort: this.userTable.sort,
      filters: this.userTable.activeFilters,
      pagination: this.userTable.pagination
    })
    // if (selectedFilters !== 0 && selectedFilters !== 1) {
    //   this.userData = [...this.userDataRaw];
    // } else {
    //   let data = this.userDataRaw.filter(f => f.Gender === selectedFilters);
    //   this.userData = [...data];
    // }
  }

  changeProviderFilter(selectedFilters: any): void {
    // console.log(selectedFilters);
    // if (selectedFilters.length <= 0) {
    //   this.userData = [...this.userDataRaw];
    // } else {
    //   let data = this.userDataRaw.filter(f => {
    //     if (selectedFilters.includes("GoogleId")) {
    //       if (f.GoogleId) {
    //         return true;
    //       }
    //     }
    //     if (selectedFilters.includes("AppleId")) {
    //       if (f.AppleId) {
    //         return true;
    //       }
    //     }
    //     if (selectedFilters.includes("FacebookId")) {
    //       if (f.FacebookId) {
    //         return true;
    //       }
    //     }
    //   })
    //   this.userData = [...data];
    // }
  }

  changeTherapistFilter(selectedFilters: any): void {
    // console.log(selectedFilters);
    // if (selectedFilters.length <= 0) {
    //   this.userData = [...this.userDataRaw];
    // } else {
    //   let data = this.userDataRaw.filter(f => {
    //     let found = selectedFilters.find(fi => f.Therapist === fi);
    //     if (found) {
    //       return true;
    //     } else {
    //       return false;
    //     }
    //   })
    //   this.userData = [...data];
    // }
  }

  chatWithUser(userId) {
    this.router.navigate(['/support'], {
      state: {
        userId
      }
    })
  }

  newBooking(userId) {
    this.router.navigate(['booking'], {
      state: {
        userId
      }
    })
  }

  toggleExport() {
    this.exportModalVisible = !this.exportModalVisible;
    this.exportType = "1";
    this.exportErrMsg = "";
    this.exportFilterIncluded = true;
  }

  exportUser() {
    let obj = {
      Type: null,
      AllUsers: true,
      UserId: [],
      Filter: 2
    }
    if (this.exportType === "0") {
      obj.Type = 0;
      obj.AllUsers = true;
      if (this.exportFilterIncluded) {
        obj.Filter = this.selectedType;
      }
    } else {
      obj.Type = 1;
      let start = (this.userTablePageIndex - 1) * this.pageSize;
      let end = this.userTablePageIndex * this.pageSize;
      for (let bInc = start; bInc < end; bInc++) {
        const user = this.userData[bInc];
        if (user) {
          obj.UserId.push(user.UserId);
        }
      }
    }
    this.isExporting = true;
    this.webapi.request(API.EXPORT_USER, obj)
      .subscribe(
        data => {
          let response = { ...data.body.Data };
          let byteCharacters = atob(response.File); //data.file there
          let byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            let slice = byteCharacters.slice(offset, offset + 512);

            let byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            let byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(blob, response.FileName);
          this.isExporting = false;
          this.toggleExport();
        },
        error => {
          this.isExporting = false;
          if (error.status === 404) {
            this.exportErrMsg = error.headers.get("message");
          } else {
            this.toast.error({
              title: "Error",
              msg: error.headers.get('message'),
              timeout: 3000,
              theme: "bootstrap"
            })
          }
        }
      )
  }

  openUserDetail(userId: number, showAnalytics = false, event: any = null) {
    if(!window.getSelection().toString()) {
    if (event) {
      let exemptTargets = ["IMG", "I"]
      if (exemptTargets.includes(event.target.nodeName)) {
        return;
      }
    }
    let obj = {
      UserId: userId
    }
    this.userDetail = this.userData.find(f => f.UserId === userId);
    if(this.userDetail.DeletedDate){
      this.userDetail.DeletedDateString= momentz.tz(this.userDetail.DeletedDate, environment.STAFF_ZONE).format("MMM DD YYYY, HH:mm z");
    }
    
    this.setUserConstraints(this.userDetail);
    this.failedToLoadUserDetail = false;
    this.detailVisible = true;
    this.showUserAnalytics = showAnalytics;
    this.userDetailEditMode = false;
    this.coconNotes = null;
    this.showCoconNotesTextBox = false;
    if (showAnalytics) {
      this.loadingUserAnalytics = true;
      this.webapi.request(API.USER_DETAIL, obj)
        .subscribe(
          data => {
            this.userDetail = { ...data.body.Data };
            if(this.userDetail.DeletedDate){
              this.userDetail.DeletedDateString= momentz.tz(this.userDetail.DeletedDate, environment.STAFF_ZONE).format("MMM DD YYYY, HH:mm z");
            }
            this.setUserConstraints(this.userDetail);
            this.loadingUserAnalytics = false;
          },
          error => {
            this.loadingUserAnalytics = false;
            this.toast.error({
              title: "Error",
              msg: error.headers.get("message"),
              timeout: 3000,
              theme: "bootstrap"
            })
          }
        )
    }
  }
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
   
  }

  closeDetail() {
    this.userDetail = null;
    this.loadingDetail = false;
    this.failedToLoadUserDetail = false;
    this.genderList.forEach(element => {
      element.byDefault = false;
    });
    if (this.userTable.activeFilters.length) {
      let genderFilterExist = this.userTable.activeFilters.find(f => f.key === this.USER_LIST_FILTER.GENDER);
      if (genderFilterExist) {
        let currentGenderFilter = this.genderList.find(f => f.value === genderFilterExist.values[0]);
        currentGenderFilter.byDefault = true;
      }
    }
    this.detailVisible = false;
  }

  openEditForm() {
    this.userDetailEditMode = true;
    this.editUserDetail = cloneDeep(this.userDetail);
    this.patchUserForm();
  }

  patchUserForm() {
    let userData = cloneDeep(this.editUserDetail);
    userData.Elevator === 1
      ? userData.Elevator = true
      : userData.Elevator = false;
    this.userForm.patchValue(userData);
  }

  closeUserEdit() {
    this.userDetailEditMode = false;
    this.editUserDetail = null;
  }

  getAddressComponents = addressComponent => {
    const getComponent = componentName => {
      let filteredData = addressComponent.filter(comp =>
        comp.types.includes(componentName),
      );
      filteredData = filteredData.map(data => data.long_name || '');
      return filteredData.length > 0
        ? filteredData.reduce((prev, curr) => [prev, ', ', curr])
        : '';
    };

    const street =
      getComponent('street_number') +
      ' ' +
      getComponent('route') +
      ' ' +
      getComponent('neighborhood') +
      ' ' +
      getComponent('sublocality');

    return {
      city: getComponent('locality'),
      street: street.trim(),
      floor: getComponent('floor'),
      zipCode: getComponent('postal_code'),
      route: getComponent('route'),
      country: getComponent('country')
    };
  };

  resetUserForm() {
    this.userForm.reset();
    this.patchUserForm();
  }

  updateUser() {
    let updateObj = null;
    let baseObj = {
      UserId: this.editUserDetail.UserId,
      Name: this.userForm.controls.Name.value,
      Gender: this.userForm.controls.Gender.value,
      Elevator: this.userForm.controls.Elevator.value === true ? 1 : 0,
      Therapist: this.userForm.controls.Therapist.value,
      Notes: this.userForm.controls.Notes.value,
      Floor: this.userForm.controls.Floor.value
    }
    this.setUserUpdating(true);
    if (this.userForm.controls.Street.value !== this.userDetail.Street) {
      updateObj = {
        ...baseObj,
        Floor: this.userForm.controls.Floor.value,
        Street: this.userForm.controls.Street.value,
        City: this.userForm.controls.City.value,
        Zip: this.userForm.controls.Zip.value,
        ReachOutTime: null,
        Latitude: null,
        Longitude: null,
      }
      // Calculate reach out time, lat long for given address, check reach out distance in service & show modal if out of service area.
      let newAddr = "";
      newAddr += this.userForm.controls.Street.value;
      if (this.userForm.controls.Zip.value) {
        newAddr += ", " + this.userForm.controls.Zip.value;
      }
      if (this.userForm.controls.City.value) {
        newAddr += " " + this.userForm.controls.City.value;
      }
      this.webapi.request(API.METADATA, {
        Metadata: ['Center'],
        Source: this.centerData.Address,
        Destination: newAddr
      }).subscribe(
        data => {
          const tempData = { ...data.body.Data };
          this.centerData = tempData.Center[0];
          const reachData = tempData.ReachOutData;
          if (reachData.rows[0].elements[0].status !== "OK") {
            this.toast.error({
              title: "Error",
              msg: "Sorry, we are not in selected location yet.",
              theme: "bootstrap",
              timeout: 3000
            });
            this.setUserUpdating(false);
            return;
          } else {
            this.reachOutTime = Math.round(reachData.rows[0].elements[0].duration.value / 60);
            let distance = reachData.rows[0].elements[0].distance.value / 1609;
            if (distance > this.centerData.ServiceArea) {
              this.serviceModalVisible = true;
            } else {
              updateObj.ReachOutTime = this.reachOutTime;
              updateObj.Latitude = this.latitude;
              updateObj.Longitude = this.longitude;
              this.submitUser(updateObj);
            }
          }
        },
        error => {
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            theme: "bootstrap",
            timeout: 3000
          });
          this.setUserUpdating(false);
        }
      );
    } else {
      updateObj = { ...baseObj }
      this.submitUser(updateObj);
    }
  }

  setUserUpdating(isUserUpdating: boolean) {
    this.isUserUpdating = isUserUpdating
  }

  cancelCurrentAddress() {
    this.serviceModalVisible = false;
    this.setUserUpdating(false);
  }

  continueUserAddress() {
    this.serviceModalVisible = false;
    let baseObj = {
      UserId: this.editUserDetail.UserId,
      Name: this.userForm.controls.Name.value,
      Gender: this.userForm.controls.Gender.value,
      Elevator: this.userForm.controls.Elevator.value === true ? 1 : 0,
      Therapist: this.userForm.controls.Therapist.value,
      Notes: this.userForm.controls.Notes.value,
      Street: this.userForm.controls.Street.value,
      Floor: this.userForm.controls.Floor.value,
      City: this.userForm.controls.City.value,
      Zip: this.userForm.controls.Zip.value,
      ReachOutTime: this.reachOutTime,
      Latitude: this.latitude,
      Longitude: this.longitude
    }
    this.submitUser(baseObj);
  }

  submitUser(userUpdateObj: any) {
    userUpdateObj.Latitude += "";
    userUpdateObj.Longitude += "";
    this.webapi.request(API.UPDATE_USER, userUpdateObj)
      .subscribe(
        data => {
          this.userDetail = { ...data.body.Data }
          this.setUserConstraints(this.userDetail);
          this.setUserUpdating(false);
          this.closeUserEdit();
          let userRawIndex = this.userDataRaw.findIndex(f => f.UserId === this.userDetail.UserId);
          this.userDataRaw[userRawIndex] = cloneDeep(this.userDetail);
          let userIndex = this.userData.findIndex(f => f.UserId === this.userDetail.UserId);
          this.userData[userIndex] = cloneDeep(this.userDetail);
        },
        error => {
          this.setUserUpdating(false);
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            theme: "bootstrap",
            timeout: 3000
          })
        }
      )
  }

  toggleCoconNotes(editMode = false) {
    this.showCoconNotesTextBox = !this.showCoconNotesTextBox;
    if (editMode) {
      this.coconNotes = this.userDetail.CoconNotes;
    }
  }

  updateCoconNotes() {
    if (this.coconNotes !== this.userDetail.CoconNotes) {
      this.savingCoconNotes = true;
      let obj = {
        UserId: this.userDetail.UserId,
        CoconNotes: this.coconNotes ? this.coconNotes : null
      }
      this.webapi.request(API.UPDATE_USER_EXTRA, obj)
        .subscribe(
          data => {
            this.userDetail.CoconNotes = this.coconNotes;
            this.savingCoconNotes = false;
            this.coconNotes = null;
            this.showCoconNotesTextBox = false;
          },
          error => {
            this.savingCoconNotes = false;
            this.toast.error({
              title: "Error",
              msg: error.headers.get("message"),
              timeout: 3000,
              theme: "bootstrap"
            })
          }
        )
    } else {
      this.showCoconNotesTextBox = false;
      this.coconNotes = null;
    }
  }

  clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    }
}
toggleCSNotes(editMode = false) {
  this.showCSNotesTextBox = !this.showCSNotesTextBox;
  if (editMode) {
    this.CSNotes = this.userDetail.CSNotes
  }
}
toggleTherapistNotes(editMode = false) {
  this.showTherapistNotesTextBox = !this.showTherapistNotesTextBox;
  if (editMode) {
    this.TherapistNotes = this.userDetail.TherapistNotes
  }
}
updateCSNotes() {
  this.savingCSNotes = true;
  let obj = {
    UserId: this.userDetail.UserId,
    CSNotes: this.CSNotes ? this.CSNotes : null,
    Type:"CSNotes"
  }
  this.webapi.request(API.UPDATE_USER_NOTES, obj)
    .subscribe(
      data => {
        this.userDetail.CSNotes=this.CSNotes
        this.savingCSNotes = false;
        this.showCSNotesTextBox=false;
        let index=this.userData.findIndex(f => f.UserId === this.userDetail.UserId);
        if(index!=-1){
          this.userData[index].CSNotes=this.CSNotes
          this.userService.setUserConstraints(this.userDetail);
        }
        this.toast.success({
          title: "Success",
          msg: "Notes saved successfully.",
          timeout: 3000,
          theme: "bootstrap"
        })
      },
      error => {
        this.savingCSNotes = false;
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )
}
updateTherapistNotes() {
  this.savingTherapistNotes = true;
  let obj = {
    UserId: this.userDetail.UserId,
    TherapistNotes: this.TherapistNotes ? this.TherapistNotes : null,
    Type:"TherapistNotes"
  }
  this.webapi.request(API.UPDATE_USER_NOTES, obj)
    .subscribe(
      data => {
        this.userDetail.TherapistNotes=this.TherapistNotes
        let index=this.userData.findIndex(f => f.UserId === this.userDetail.UserId);
        if(index!=-1){
          this.userData[index].TherapistNotes=this.TherapistNotes
          this.userService.setUserConstraints(this.userDetail);
        }
        this.savingTherapistNotes = false;
        this.showTherapistNotesTextBox=false;
        this.toast.success({
          title: "Success",
          msg: "Notes saved successfully.",
          timeout: 3000,
          theme: "bootstrap"
        })
      },
      error => {
        this.savingTherapistNotes = false;
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )
}
}