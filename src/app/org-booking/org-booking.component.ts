import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastyService } from 'ng2-toasty';
import * as cloneDeep from "lodash/cloneDeep";
import * as lodash from 'lodash';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver';
import * as moment from "moment";
import * as momentz from "moment-timezone";
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from "@angular/animations";

import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { GooglePlaceDirective } from "node_modules/ngx-google-places-autocomplete/ngx-google-places-autocomplete.directive";
import { CookieService } from 'ngx-cookie-service';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { ZoneService } from '../shared/services/zone.service';
import { timingSafeEqual } from 'crypto';
import { TableService } from '../shared/services/table.service';
import { BookingService } from '../shared/services/booking.service';
import { CalendarService } from '../shared/services/calendar.service';
import { API } from '../shared/enums/apiNames.enum';
@Component({
  selector: 'app-org-booking',
  templateUrl: './org-booking.component.html',
  styleUrls: ['./org-booking.component.css']
})
export class OrgBookingComponent implements OnInit {
  searchBox1Value: any;
  DEFAULT_PAGE_SIZE = 10;s1
  BOOKING_LIST_FILTER = {
    BOOKING_META: "BookingMeta",
    BOOKING_STATUS: "BookingStatus",
    BOOKING_DATE: "BookingDate"
  }
  BOOKING_STATUS = {
    NEW: 0,
    COMPLETED: 1,
    CANCELLED: 2,
    ON_GOING: 3,
    CONFIRMED: 4,
    LAPSED: 5,
    UPDATED_TO_NEW: 6,
    CANCELLED_MANUALLY: 7,
    INCONCLUSIVE: 8,
    DRAFT:9,
    CANCELLED_DRAFT:10
}
  BOOKINGS_TO_CONSIDER_FOR_ORGANISATION = [
    this.BOOKING_STATUS.COMPLETED,
    this.BOOKING_STATUS.ON_GOING,
    this.BOOKING_STATUS.CANCELLED,
    this.BOOKING_STATUS.CONFIRMED,
    this.BOOKING_STATUS.LAPSED,
    this.BOOKING_STATUS.CANCELLED_MANUALLY,
    this.BOOKING_STATUS.INCONCLUSIVE
  ]
  bookinglist: any=[];
  isLoading: boolean;
  isSpinning: boolean;
  detailVisible: boolean;
  visibleBooking:boolean
 
  bookingDetail: any;
  loadingFlag: boolean;
  bookingProviders: { text: string; value: number; byDefault: boolean; }[];
  previousSearchValue: string;
 
  activeFilters: any[]=[]
  selectedFilters: any;
  sort: {
    key: string,
    value: string
  }
  pagination: {
    curPage: number,
    size: number,
    itemCount: number
  }
  dateRange:any[]=[];
  dateRangeCalled:any[]=[];
  showDropDown:boolean=false;
  closeDropdown: boolean;
  bookingTablePageSizeOptions: number[];
  showInstructions:boolean=false
  InstructionsData: string;
  cancelReasonList =[{
    "Value":0,
    "Label":"No-show"
  },
  {
    "Value":1,
    "Label":"Free cancellation"
  },
  {
    "Value":2,
    "Label":"Late cancellation"
  },
  
  {
    "Value":4,
    "Label":"Not confirmed"
  },
  {
    "Value":5,
    "Label":"No therapist available"
  },{
    "Value":3,
    "Label":"Others"
  }
  ]

  constructor(
    private webapi: WebService,

    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private route: ActivatedRoute,
    private bookingService:BookingService,
    private router: Router,
    private cookieService: CookieService,

  ) {
    
   }

  ngOnInit() {
    this.bookingTablePageSizeOptions = [10, 20, 50, 100];
    this.pagination= {
      curPage: 1,
      size: this.DEFAULT_PAGE_SIZE,
      itemCount: 0
    }
    this.sort= {
      key: "",
      value: "",
    }
    this.getBookingList({
      bookingTab: null,
      sort: {
        key: "",
        value: "",
      },
      filters: [],
      pagination: {
        curPage: 1,
        size: this.DEFAULT_PAGE_SIZE
      }
    })
    this.getInstructionsData()
  }
  setInitialData() {
    this.previousSearchValue = "";
    // this.bookingListCategories = this.bookingService.bookingListCategories;
    this.bookingProviders = this.bookingService.bookingProviders;
    // this.userForm = this.bookingService.getUserForm();
    // this.addressForm = this.bookingService.getAddressForm();
    // this.guestForm = this.bookingService.getGuestForm();
    // this.globalDispatchForm = this.bookingService.getGlobalDispatchForm();
    // this.prefTherList = this.bookingService.getPrefTherList();
    // this.genderList = this.bookingService.getGenderList();
    // this.timings = this.bookingService.getTimings();
    // this.basket = [];
    // this.bookingListTabIndex = 0;
    // this.THERAPIST_PREFERENCE = this.bookingService.THERAPIST_PREFERENCE;
    // this.prefLanguage = this.bookingService.getPrefLanguage();
    // this.clientSource = this.bookingService.getClientSource();
  }

  getBookingList({
    bookingTab,
    sort,
    filters,
    pagination
  }, callbackFn: any = null): void {

    this.isLoading = true
    this.webapi.request(API.BOOKING, {
      BookingTab: bookingTab,
      Search: this.searchBox1Value ? this.searchBox1Value.trim() : "",
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
      CurrentIds: [],
      LastUpdated: '',
      OrganisationLocationId: parseInt(this.cookieService.get("organisationlocationId"))
    }).subscribe(
      data => {
        // console.log(data)
        this.bookinglist = [...data.body.Data]
        console.log(this.bookinglist)
        this.isLoading = false
        this.updatePagesData(data)
        // this.setConstraints({
        //   bookings: [...data.body.Data],
        // });
      },
      error => {
        this.isLoading = false
        const msg = error.headers.get('message');
        this.toast.error({
          title: "Error",
          msg,
          theme: 'bootstrap',
          timeout: 3000
        })
      }
    )

  }

  setConstraints({
    bookings
  }) {
    // let maxId = 0;
    bookings.forEach(booking => {
      // if (booking.BookingId > maxId) {
      //   maxId = booking.BookingId;
      // }
      booking.BookingIdShow = "#" + booking.BookingId;
      // booking.address = (booking.Floor ? booking.Floor + ", " : "") + booking.Street + (booking.HouseNumber ? ", " + booking.HouseNumber : "")+(booking.City ? ", " + booking.City : "") + (booking.Zip ? ", " + booking.Zip : "");

      let userNameToShow = "";
      let productToShow = "";
      if (booking.Products.length === 0) {
        productToShow = '-'
      } else {
        booking.Products.length === 1
          ? productToShow = booking.Products[0].Product
          : productToShow = booking.Products[0].Product + " +" + (booking.Products.length - 1);
      }

      let userList = [];
      if (booking.Myself && booking.Guests.length === 0) {
        userNameToShow = "Myself";
        userList.push("Myself");
      } else if (booking.Myself && booking.Guests.length > 0) {
        userNameToShow = "Myself +" + booking.Guests.length;
        userList.push("Myself", ...booking.Guests);
      } else {
        userList.push(...booking.Guests);
        if (booking.Guests.length === 1) {
          userNameToShow = booking.Guests[0];
        } else {
          booking.Guests.forEach((guest, index) => {
            if (index === booking.Guests.length - 1) {
              userNameToShow += guest;
            } else {
              userNameToShow += guest + ", ";
            }
          });
        }
      }
      booking.dateString = momentz.tz(booking.DateTime, environment.STAFF_ZONE).format("ddd, MMM DD YYYY, HH:mm z");
      booking.userList = userList;
      booking.productToShow = productToShow;
      booking.userNameToShow = userNameToShow;
      let foundReason = this.cancelReasonList.find(f => f.Value === booking.CancelBookingReason);
            if(foundReason){
                booking.CancelBookingReasonString=foundReason.Label
            }else{
                booking.CancelBookingReasonString=null
            }
      console.log(booking.Status)
      switch (booking.Status) {
       
        case this.BOOKING_STATUS.ON_GOING:
        case this.BOOKING_STATUS.CONFIRMED:
        case this.BOOKING_STATUS.LAPSED:
        case this.BOOKING_STATUS.INCONCLUSIVE:
          booking.statusToShow = "Confirmed";
          booking.style = {
            background: '#92f0b1 !important'
          };
          let staffAssigned = 0
          booking.Products.forEach(prod => {
            if (prod.StaffId != null) {
              staffAssigned += 1
            }
          })
          if (staffAssigned == booking.Products.length) {
            booking.statusToShow = "Confirmed";
            booking.style = {
              background: '#92f0b1 !important'
            };
          } else if (staffAssigned == 0) {
            booking.statusToShow = "Unfilled - No Therapist";
            booking.style = {
              background: '#f7ce87 !important'
            };
          } else {
            booking.statusToShow = "Partially Filled";
            booking.style = {
              background: '#f7ce87 !important'
            };
          }
          break;
        case this.BOOKING_STATUS.CANCELLED_MANUALLY:
        case this.BOOKING_STATUS.CANCELLED:
          booking.statusToShow = "Cancelled";
          console.log("here")
          console.log("booking.CancelBookingNotes",booking.CancelBookingNotes)
          console.log("booking.CancelBookingNotes",booking.CancelBookingNotes)
          if(booking.CancelBookingNotes){
            booking.statusStringToShow = booking.CancelBookingReasonString+' ('+booking.CancelBookingNotes+')';
          }else{
            booking.statusStringToShow = booking.CancelBookingReasonString;
          }
          if (booking.statusStringToShow && booking.statusStringToShow.length > 55) {
            booking.statusStringToShowFull = cloneDeep(booking.statusStringToShow)
            booking.statusStringToShow = booking.statusStringToShow.substr(0, 55) + "...";
            
        } else {
          booking.statusStringToShow = booking.statusStringToShow
          booking.statusStringToShowFull = booking.statusStringToShow
        }
         
          booking.style = {
            background: '#f78787 !important'
          };
          break
        case this.BOOKING_STATUS.COMPLETED:
          booking.statusToShow = "Completed";
          booking.style = {
            background: '#045c14 !important'
          };
          break
      }
      booking.TherapistString = "";
            let thers = [];
            booking.Products.forEach(element => {
              if(element.StaffId){
                thers.push(element.StaffName);
              }
              
            });
            booking.TherapistString = thers.join(", ");
            // filledBookings.Bookings.push(booking);

console.log(bookings)
    });

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


  openDetailView(bookingId: number, fromDetail: boolean = false, event: any = null): void {
    if (!window.getSelection().toString()) {
      if (event) {
        let exemptTargets = ["IMG", "I"]
        if (exemptTargets.includes(event.target.nodeName)) {
          return;
        }
      }
      this.isSpinning = true;
      // if (!this.detailVisible) {
      //   this.bookingData = cloneDeep(this.bookingDataRaw);
      // }
      this.detailVisible = true;
      let detailsExist = this.bookinglist.find(f => f.BookingId === bookingId);
      if (detailsExist) {
        this.bookingDetail = { ...detailsExist };
        
        this.webapi.request(API.BOOKING_DETAIL, {
          BookingId: bookingId,
          LastUpdated: ""
        })
          .subscribe(
            data => {
              if (data.body.Data && data.body.Data.length) {
                this.isSpinning = false;
                this.bookingDetail = { ...data.body.Data[0] };
                this.setBookingDetailData();
                console.log(this.bookingDetail)
                let replaceExistDetail = this.bookinglist.find(f => f.BookingId === bookingId);
                replaceExistDetail = null;
                replaceExistDetail = { ...this.bookingDetail };
                console.log("detail updated in background");
              }
            },
            error => {
              fromDetail ? this.detailVisible = true : this.detailVisible = false;
              this.isSpinning = false;
              const msg = error.headers.get('message');
              this.toast.error({
                title: "Error",
                msg,
                theme: 'bootstrap',
                timeout: 3000
              })
            }
          )
      } else {
        this.webapi.request(API.BOOKING_DETAIL, {
          BookingId: bookingId
        })
          .subscribe(
            data => {
              this.isSpinning = false;
              this.bookingDetail = { ...data.body.Data[0] };
              this.setBookingDetailData();
              console.log(this.bookingDetail)
            },
            error => {
              fromDetail ? this.detailVisible = true : this.detailVisible = false;
              this.isSpinning = false;
              const msg = error.headers.get('message');
              this.toast.error({
                title: "Error",
                msg,
                theme: 'bootstrap',
                timeout: 3000
              })
            }
          )
      }
    }
  }
  setBookingDetailData() {
    this.bookingDetail.dateString = momentz.tz(this.bookingDetail.DateTime, environment.STAFF_ZONE).format("ddd, MMM DD YYYY, HH:mm z");
    let foundReason = this.cancelReasonList.find(f => f.Value === this.bookingDetail.CancelBookingReason);
    if(foundReason){
      this.bookingDetail.CancelBookingReasonString=foundReason.Label
    }else{
      this.bookingDetail.CancelBookingReasonString=null
    }
console.log(this.bookingDetail.Status)
switch (this.bookingDetail.Status) {

case this.BOOKING_STATUS.ON_GOING:
case this.BOOKING_STATUS.CONFIRMED:
case this.BOOKING_STATUS.LAPSED:
case this.BOOKING_STATUS.INCONCLUSIVE:
  this.bookingDetail.statusToShow = "Confirmed";
  this.bookingDetail.style = {
    background: '#92f0b1 !important'
  };
  let staffAssigned = 0
  this.bookingDetail.Products.forEach(prod => {
    if (prod.StaffId != null) {
      staffAssigned += 1
    }
  })
  if (staffAssigned == this.bookingDetail.Products.length) {
    this.bookingDetail.statusToShow = "Confirmed";
    this.bookingDetail.style = {
      background: '#92f0b1 !important'
    };
  } else if (staffAssigned == 0) {
    this.bookingDetail.statusToShow = "Unfilled - No Therapist";
    this.bookingDetail.style = {
      background: '#f7ce87 !important'
    };
  } else {
    this.bookingDetail.statusToShow = "Partially Filled";
    this.bookingDetail.style = {
      background: '#f7ce87 !important'
    };
  }
  break;
case this.BOOKING_STATUS.CANCELLED_MANUALLY:
case this.BOOKING_STATUS.CANCELLED:
  this.bookingDetail.statusToShow = "Cancelled";
  console.log("here")
  console.log("booking.CancelBookingNotes",this.bookingDetail.CancelBookingNotes)
  console.log("booking.CancelBookingNotes",this.bookingDetail.CancelBookingNotes)
  if(this.bookingDetail.CancelBookingNotes){
    this.bookingDetail.statusStringToShow = this.bookingDetail.CancelBookingReasonString+' ('+this.bookingDetail.CancelBookingNotes+')';
  }else{
    this.bookingDetail.statusStringToShow = this.bookingDetail.CancelBookingReasonString;
  }
  
  this.bookingDetail.style = {
    background: '#f78787 !important'
  };
  break
case this.BOOKING_STATUS.COMPLETED:
  this.bookingDetail.statusToShow = "Completed";
  this.bookingDetail.style = {
    background: '#045c14 !important'
  };
  break
}
    
    this.bookingDetail.Products.forEach(product => {
      let startTime = momentz.tz(product.StartTime, environment.STAFF_ZONE);
      let endTime = startTime.clone();
      let addOnDuration = 0;
      product.AddOns.forEach(element => {
        if (element.ExtraAddOn) {
          if (element.RequestStatus === 1) {
            addOnDuration += element.Duration;
          }
        } else {
          addOnDuration += element.Duration;
        }
      });
      endTime.add(product.Duration + addOnDuration, "minute")
      product.timeString = startTime.format("HH:mm") + " - " + endTime.format("HH:mm");
      if (product.Extras && product.Extras.length > 0) {
        product.ExtrasShow = product.Extras.join(", ");
      } else {
        product.ExtrasShow = null;
      }
    });
   
    
  }
  closeDetail(): void {
    // this.setDefaultFilters();
    this.detailVisible = false;
    this.loadingFlag = false;
    this.isSpinning = false;
    this.getBookingList({
      bookingTab: null,
      sort: {
        key: "",
        value: "",
      },
      filters: [],
      pagination: {
        curPage: 1,
        size: this.DEFAULT_PAGE_SIZE
      }
    })
  }


  changeDateFilter(selectedFilter) {
    this.closeDropdown=true;
    // let currentTab = this.bookingListCategories[this.bookingListTabIndex];
    this.dateRangeCalled=selectedFilter
    // Check if filter is same as previous.
    let filterExist = this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_DATE);
    if (selectedFilter === null || selectedFilter.length<1) {
      // filter reset or clicked outside without applying.
      if (!filterExist) {
        return;
      }
    } else {
      // filter applied - check if its same as existing.
      if (filterExist && filterExist.values[0]==selectedFilter[0]&&filterExist.values[1]==selectedFilter[1]) {
        return;
      }
    }
  
    if (selectedFilter === null || selectedFilter.length<1) {
      // filter reset
      let bookingDateFilterExist = this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_DATE);
      if (bookingDateFilterExist) {
        this.activeFilters = this.activeFilters.filter(f => f.key !== this.BOOKING_LIST_FILTER.BOOKING_DATE);
      }
    } else {
      // filter have some value
      let bookingDateFilterExist = this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_DATE);
      if (!bookingDateFilterExist) {
        this.activeFilters.push({
          key: this.BOOKING_LIST_FILTER.BOOKING_DATE,
          values: selectedFilter
        });
      } else {
        bookingDateFilterExist.values = selectedFilter
      }
    }
    this.pagination.curPage = 1;
    this.pagination.itemCount = 0;
    this.getBookingList({
      bookingTab: null,
      sort: this.sort,
      filters: this.activeFilters,
      pagination: this.pagination
    })
  
  
    // if (selectedFilter !== null) {
    //   if (selectedFilter === 2) {
    //     currentTab.Bookings = currentTab.BookingsRaw.filter(f => f.StaffVacConflict);
    //   } else {
    //     currentTab.Bookings = currentTab.BookingsRaw.filter(f => f.BookingProvider === selectedFilter);
    //   }
    // } else {
    //   currentTab.Bookings = cloneDeep(currentTab.BookingsRaw);
    // }
  }

   // Sort the table according to given key.
   sortTable(sort: { key: string; value: string }): void {
    
    let { key, value } = sort;
    if (key) {
      // currentTab.activeFilters = [];
      this.sort = {
        key,
        value: value === "ascend" ? "ascending" : "descending",
      }
      if (value === null) {
        this.sort = {
          key: "",
          value: ""
        }
      }
      this.pagination.curPage = 1;
      this.pagination.itemCount = 0;
      this.getBookingList({
        bookingTab: null,
        sort: this.sort,
        filters: this.activeFilters,
        pagination: this.pagination
      })
    }
  }
   // Used to search for input value
   onKeyUp(): void {
    if (this.searchBox1Value !== this.previousSearchValue) {
      this.searchBooking("");
    }
  }
  searchBooking(value: string) {
    if (this.searchBox1Value === this.previousSearchValue) {
      return;
    }
    this.previousSearchValue = this.searchBox1Value;
    // let currentTab = this.bookingListCategories[this.bookingListTabIndex];
    this.activeFilters = [];
    this.sort = {
      key: "",
      value: ""
    }
    this.pagination = {
      curPage: 1,
      itemCount: this.pagination.itemCount,
      size: this.pagination.size
    }
    this.getBookingList({
      bookingTab: null,
      sort: this.sort,
      filters: this.activeFilters,
      pagination: this.pagination
    })
  }
  
  resetSearch(): void {
    this.searchBox1Value = "";
    if (this.searchBox1Value !== this.previousSearchValue) {
      this.searchBooking("");
    }
    this.previousSearchValue = this.searchBox1Value;
    // let currentTab = this.bookingListCategories[this.bookingListTabIndex];
    this.activeFilters = [];
    this.sort = {
      key: "",
      value: ""
    }
    this.pagination = {
      curPage: 1,
      itemCount: this.pagination.itemCount,
      size: this.pagination.size
    }
    this.getBookingList({
      bookingTab: null,
      sort: this.sort,
      filters: this.activeFilters,
      pagination: this.pagination
    })
  }

  setStatusFilter() {
   
    let filterExist = this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_STATUS);
    if (!this.selectedFilters.length) {
      // filter reset or clicked outside without applying.
      if (!filterExist) {
        return;
      }
    } else {
      // filter applied - check if its same as existing.
      if (filterExist) {
        if (JSON.stringify(filterExist.values.sort()) === JSON.stringify(this.selectedFilters.sort())) {
          return;
        }
      }
    }


    if (this.selectedFilters.length === 0) {
      let statusFilter = this.activeFilters.length ? this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_STATUS) : null;
      if (statusFilter) {
        this.activeFilters = this.activeFilters.filter(f => f.key !== this.BOOKING_LIST_FILTER.BOOKING_STATUS);
      }
    } else {
      let statusFilter = this.activeFilters.length ? this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_STATUS) : null;
      if (statusFilter) {
        statusFilter.values = this.selectedFilters;
      } else {
        this.activeFilters.push({
          key: this.BOOKING_LIST_FILTER.BOOKING_STATUS,
          values: this.selectedFilters
        })
      }
    }
    this.pagination.curPage = 1;
    this.pagination.itemCount = 0;
    this.getBookingList({
      bookingTab: null,
      sort: this.sort,
      filters: this.activeFilters,
      pagination: this.pagination
    })
  }
  updatePagesData(data) {
    // let selectedTab = this.bookingListCategories.find(f => f.BookingTab === bookingTab);
    this.pagination.curPage = data.body.Pagination.Number;
    this.pagination.size = data.body.Pagination.Size;
    this.pagination.itemCount = data.body.TotalItems;
    // this.Bookings = [];
    this.setConstraints({
        bookings: [...data.body.Data]
    });
    // let pageExist = selectedTab.pagesData.find(f => f.pageNum === selectedTab.pagination.curPage);
    // if (pageExist) {
    //     selectedTab.Bookings = this.tableService.setPageData(selectedTab.Bookings, pageExist.data, data.body.CurrentIds, "BookingId");
    //     pageExist.data = cloneDeep(selectedTab.Bookings);
    //     pageExist.lastUpdated = data.body.LastUpdated;
    // } else {
    //     selectedTab.pagesData.push({
    //         pageNum: selectedTab.pagination.curPage,
    //         data: cloneDeep(selectedTab.Bookings),
    //         lastUpdated: data.body.LastUpdated
    //     })
    // }
    // this.bookingCatsActived.next(selectedTab);
}

changePageSize(event) {
  // let selectedTab = this.bookingListCategories.find(f => f.BookingTab === bookingTab);
  // if (selectedTab) {
    this.pagination.curPage = 1;
    this.isLoading = true;
    this.getBookingList({
      bookingTab:null,
      sort: {
        key: this.sort.key,
        value: this.sort.value,
      },
      filters: this.activeFilters,
      pagination: {
        curPage: this.pagination.curPage,
        size: event
      }
    })
  // }
}

changePageNumber(event) {
  // let selectedTab = this.bookingListCategories.find(f => f.BookingTab === bookingTab);
  // if (selectedTab) {
    this.isLoading = true;
    this.getBookingList({
      bookingTab:null,
      sort: {
        key: this.sort.key,
        value: this.sort.value,
      },
      filters: this.activeFilters,
      pagination: {
        curPage: event,
        size: this.pagination.size
      }
    })
  // }
}

  changeProvFilter(selectedFilter) {
   
    // Check if filter is same as previous.
    let filterExist = this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_META);
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
      let bookingMetaFilterExist = this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_META);
      if (bookingMetaFilterExist) {
        this.activeFilters = this.activeFilters.filter(f => f.key !== this.BOOKING_LIST_FILTER.BOOKING_META);
      }this
    } else {
      // filter have some value
      let bookingMetaFilterExist = this.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_META);
      if (!bookingMetaFilterExist) {
        this.activeFilters.push({
          key: this.BOOKING_LIST_FILTER.BOOKING_META,
          values: [selectedFilter]
        });
      } else {
        bookingMetaFilterExist.values = [selectedFilter]
      }
    }
    this.pagination.curPage = 1;
    this.pagination.itemCount = 0;
    this.getBookingList({
      bookingTab: null,
      sort: this.sort,
      filters: this.activeFilters,
      pagination: this.pagination
    })


    // if (selectedFilter !== null) {
    //   if (selectedFilter === 2) {
    //     currentTab.Bookings = currentTab.BookingsRaw.filter(f => f.StaffVacConflict);
    //   } else {
    //     currentTab.Bookings = currentTab.BookingsRaw.filter(f => f.BookingProvider === selectedFilter);
    //   }
    // } else {
    //   currentTab.Bookings = cloneDeep(currentTab.BookingsRaw);
    // }
  }
  resetDate(){
    this.dateRange=[];
    this.dateRangeCalled=[];
    this.closeDropdown=true;
  }
  cancelModal(){
    this.showInstructions=false;
  }
  getInstructionsData(){
    this.InstructionsData='';
    if(this.InstructionsData==''){
      this.webapi.request(API.GET_BOOKING_INSTRUCTIONS,{Type:'BOOKING'})
      .subscribe(
        data => {
          let InstructionsRawData = { ...data.body.Data };
          this.InstructionsData = InstructionsRawData.Text
          console.log(this.InstructionsData)
        },
        error => {
          console.log(error)
        }
      )
    }
   
  }
}
