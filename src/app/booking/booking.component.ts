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
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
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
        animate("500ms", style({ transform: "translateY(0)", opacity: 1 })),
      ]),
      transition(":leave", [
        style({ transform: "translateY(0)", opacity: 1 }),
        animate("500ms", style({ transform: "translateY(100%)", opacity: 0 })),
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
  ],
  // host: {
  //   '(window:popstate)': 'onBackButtonPressed($event)'
  // },
})
export class BookingComponent implements OnInit {
  bookingData: any[];
  bookingDataRaw: any[];
  bookingDetail: any;
  detailVisible: boolean;
  showStaffModal: boolean;
  isSpinning: boolean;
  loadingFlag: boolean;
  sortName: string;
  sortValue: string;
  visibleBooking: boolean;
  categoryData: any[];
  categoryDataRaw: any[];
  visibleUserForm: boolean;
  userGuest: any[];
  userForm: FormGroup;
  guestForm: FormGroup;
  userDetail: any;
  guestFormVisible: boolean;
  prefTherList: { pref: number; Name: string; }[];
  genderList: { Id: number; Name: string; }[];
  basket: any[];
  basketVisible: boolean;
  timeModalVisible: boolean;
  timings: { Name: string; Value: number; selected: boolean }[];
  productUpdateMode: boolean;
  categoryIndex: number;
  catProductIndex: number;
  metadata: any;
  centerData: any;
  reachOutTime: number;
  beforeSlots: boolean;
  inSlots: boolean;
  availableTimeSlots: any[];
  data: { list: string[]; }[];
  bookingDrawerTitle: string;
  slotSpin: boolean;
  isCustomSlot: boolean;
  finalBasket: any[];
  staffList: any[];
  BOOKING_SUMMARY = "BOOKING SUMMARY";
  SCHEDULE_BOOKING = "SCHEDULE BOOKING";
  inFinalReview: boolean;
  FINALIZE_BOOKING = "FINALIZE BOOKING";
  selectedBookingDate: any;
  selectedSlot: string;
  rootUser: any;
  bookingAddress: any;
  bookingProviders: { text: string; value: number; byDefault: boolean; }[];
  searchBox1Value: string;
  customSlot: boolean;
  isLoadingCats: boolean;
  basketUpdateMode: boolean;
  treatmentNum: number;
  isUserLoading: boolean;
  editBookingDetail: any;
  bookingEditMode: boolean;
  bookingAddEditMode: boolean;
  isLoadingAddr: boolean;
  scheduleButtonTitle: string;
  addressForm: FormGroup;
  bookingStatus: { text: string; value: number; byDefault: boolean; }[];
  staffList0: any[];
  staffList1: any[];
  currentSelectedUser: any;
  calnSelDate: Date;
  isStaffChecking: boolean;
  bookingConfirmModalVisible: boolean;
  sendPushInUpdate: boolean;
  googlePlacesURL: string;
  dateRange:any;
  closeDropdown:boolean;
  hover:boolean;

  isLoadingData:boolean
  TimeSlotInterval: any;
  selectedOrganisation:any
 

 static calselectedDate:any


  @Input() adressType: string;
  @Output() setAddress: EventEmitter<any> = new EventEmitter();
  @ViewChild("placesRef", { static: true }) placesRef: GooglePlaceDirective;
  @ViewChild("placesRef1", { static: true }) placesRef1: GooglePlaceDirective;
  options = {
    componentRestrictions: { country: 'NL' }
  }
  serviceModalVisible: boolean;
  bookingNotAllowedToCancel: any[];
  routerState: any;
  registerNewUser: boolean;
  appUserList: any[];
  appUser: any;
  appUserDetail: any;
  userAddressEditMode: boolean;
  userEmailMessage: any;
  exportModalVisible: boolean;
  exportType: any;
  bookingTablePageIndex: number;
  pageSize: number;
  selExportStartDate: Date;
  selExportEndDate: Date;
  isExporting: boolean;
  exportErrMsg: string;
  bookingTablePageSizeOptions: number[];
  selectedFilters: any[];
  exportFilterIncluded: boolean;
  showAdminNotesTextBox: boolean;
  adminNotes: string;
  savingAdminNotes: boolean;
  isFetchingUser: boolean;
  showCategoryNotFoundAlert: boolean;
  globalDispatchSettings: any;
  showGlobalDispatchSettingsModal: boolean;
  globalDispatchString: string;
  globalDispatchForm: FormGroup;
  staffGroupList: any[];
  rawGlobalSettingsFormData: { GlobalDispatchDefault: string; InstantConfirmation: boolean; IsFilterApplied: boolean; IsPriorityActive: boolean; StaffGroups: any[]; Ranking: boolean; Availability: boolean; };
  activeStaffGroupList: any[];
  bookingListCategories: {
    BookingCategoryId: number,
    Name: string,
    Bookings: any[],
    pagesData: any[],
    BookingsRaw: any[],
    BookingTab: number,
    isLoading: boolean,
    sort: {
      key: string,
      value: string
    },
    activeFilters: any[],
    pagination: {
      curPage: number,
      size: number,
      itemCount: number
    },
    tableId: string,
    bookingProviders: { text: string; value: number; byDefault: boolean; }[]
    dateRange:any[];
    dateRangeCalled:any[];
    showDropDown:boolean;
  }[];

  DISPATCH_FILTER_ID = {
    GROUP: 1,
    RANK: 2,
    AVAILABILITY: 3
  }
  BOOKING_STATUS = this.bookingService.BOOKING_STATUS;
  PRODUCT_DISPATCH_TYPE = this.bookingService.PRODUCT_DISPATCH_TYPE;
  bookingListTabIndex: number;
  showBookingDispatchSettingsModal: boolean;
  dispatchSetBookingDetail: any;
  loadingGlobalDispatch: boolean;
  STAFF_ASSIGNMENT_TYPE = {
    Dispatch: "0",
    Assign: "1"
  }
  THERAPIST_PREFERENCE: { MALE: number; FEMALE: number; EITHER: number; };
  finalSelectedDate: string;
  previousSearchValue: string;
  allBookingDetails: any[] = [];
  bookingListSubs: any;
  catalogLastUpdated: any;

  prefLanguage: any;
  clientSource: any;
  SpecialRequestData: any=[];
  BookingChannelData: any;
  treatmentDetail: any[];
  filterStaffList: any;
  isloadingStaffFilterList: boolean;
  timeSlots: any[];
  isTimeSlotLoading: boolean;
  orgFilterList: any[]=[];
  onBacksendDate: any='';
  cancelReason: boolean;
  cancelReasonList:any[]
  cancelBookingForm: FormGroup;
  bookingToCancel: boolean;
 
  public handleAddressChange(address) {
    let components = this.getAddressComponents(address.address_components);
    // this.userForm.controls.Street.setValue(address.formatted_address);
    // this.userForm.controls.Street.setValue(components.street + " " + components.city);
    let showName = address.name + ", " + components.route + ", " + components.city + ", " + components.country;
    this.userForm.controls.Street.setValue(showName);
    this.userForm.controls.Zip.setValue(components.zipCode);
  }

  public handleEditAddressChange(address) {
    let components = this.getAddressComponents(address.address_components);
    let showName = address.name + ", " + components.route + ", " + components.city + ", " + components.country;
    this.addressForm.controls.Street.setValue(showName);
    this.addressForm.controls.Zip.setValue(components.zipCode);
  }

  BOOKING_LIST_TAB = this.bookingService.BOOKING_LIST_TAB;

  DEFAULT_PAGE_SIZE = 10;
  BOOKING_LIST_FILTER = {
    BOOKING_META: "BookingMeta",
    BOOKING_STATUS: "BookingStatus",
    BOOKING_DATE: "BookingDate",
    BOOKING_ORGANISATION: "OrganisationLocationId"
  }

  constructor(
    private webapi: WebService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private cookieService: CookieService,
    private zone: ZoneService,
    private tableService: TableService,
    private bookingService: BookingService,
    private calendarService: CalendarService
  ) {
    this.setInitialData();
    this.bookingTablePageIndex = 1;
    this.pageSize = 10;
    this.bookingStatus = [];
    this.selectedFilters = [];
    this.bookingTablePageSizeOptions = [10, 20, 50, 100];
    let currentNavigation = this.router.getCurrentNavigation();
    this.routerState = currentNavigation.extras.state;
    this.cancelReasonList =[{
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

  this.cancelBookingForm = this.fb.group({
    CancelBookingReason: [null,[Validators.required]],
    CancelBookingNotes: [null]
});
  }

  ngOnInit() {
    this.catalogLastUpdated = null;
    this.closeDropdown=true;
    this.DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize ? this.tableService.getDefaultPageSize() : this.DEFAULT_PAGE_SIZE;
    this.webapi.request(API.METADATA, {
      Metadata: ['Center', "Staff", "BookingStatus", "BookingStatusMisc", "BookingNotAllowedToCancel", "PageSizeOptions", "Product", "GlobalDispatchSettings", "StaffGroup","SpecialRequest","BookingChannel","Category","TimeSlotInterval"]
      
    }).subscribe(
      data => {
        this.metadata = { ...data.body.Data };
        console.log("metadatacalled")
        console.log(this.metadata.Product)
        this.centerData = this.metadata.Center[0];
        this.staffList = this.metadata.Staff;
        this.bookingTablePageSizeOptions = this.metadata.PageSizeOptions;
        this.bookingStatus = [];
        this.metadata.BookingStatus.forEach((status: { name: string; code: number; }) => {
          this.bookingStatus.push({
            text: status.name,
            value: status.code,
            byDefault: true
          });
          this.selectedFilters.push(status.code)
        });
        this.metadata.BookingStatusMisc.forEach((status: { name: string; code: number; }) => {
          this.bookingStatus.push({
            text: status.name,
            value: status.code,
            byDefault: false
          })
        });
        this.bookingNotAllowedToCancel = [...this.metadata.BookingNotAllowedToCancel];
        if (this.metadata.SpecialRequest) {
          this.SpecialRequestData = this.metadata.SpecialRequest;
        }
        if (this.metadata.BookingChannelData) {
          this.BookingChannelData = this.metadata.BookingChannelData;
        }
        if (this.metadata.TimeSlotInterval) {
          this.TimeSlotInterval = this.metadata.TimeSlotInterval;
        }else{
          this.TimeSlotInterval=5;
        }
        this.getCMSTimeSlots()
        this.setDispatchMeta();
        if (this.routerState && this.routerState.bookingId) {
          if(this.routerState.selectedDate){
           
            
            this.onBacksendDate=this.routerState.selectedDate
           
          }
          this.openDetailView(this.routerState.bookingId);
        } else if (this.routerState && this.routerState.userId) {
          this.openBooking();
        } else {
          // get not filled first
          let unfilledLoader = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.UNFILLED);
          unfilledLoader.isLoading = true;
          this.getBookingList({
            bookingTab: this.BOOKING_LIST_TAB.UNFILLED,
            sort: {
              key: "",
              value: "",
            },
            filters: [],
            pagination: {
              curPage: 1,
              size: this.DEFAULT_PAGE_SIZE
            }
          }, (bookingIds) => { this.fetchUnfilledBookingDetails(bookingIds) })
          setTimeout(() => {
            let filledLoader = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.FILLED);
            filledLoader.isLoading = true;
            this.getBookingList({
              bookingTab: this.BOOKING_LIST_TAB.FILLED,
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
          }, 2000);
        }
      }
    );
    this.webapi.request(API.CATEGORY_PRODUCT, {
      LanguageId: 1,
      LastUpdated: this.catalogLastUpdated
    })
      .subscribe(
        data => {
          this.categoryData = [...data.body.Data];
          this.categoryDataRaw = cloneDeep(this.categoryData);
          this.catalogLastUpdated = data.body.LastUpdated ? data.body.LastUpdated : null;
        },
        error => {
          const msg = error.headers.get('message');
          this.toast.error({
            title: "Error",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
    this.bookingListSubs = this.bookingService.bookingListChanges.subscribe(tabData => {
      let foundTab = this.bookingListCategories.find(f => f.BookingTab === tabData.BookingTab);
      if (foundTab) {
        foundTab.Bookings = cloneDeep(tabData.Bookings);
        foundTab.pagesData = cloneDeep(tabData.pagesData);
      }
    });
    this.bookingListCategories.forEach(element => {
      element.dateRange=[];
      element.dateRangeCalled=[];
  });
  console.log("calledtreat")
  this.getTreatments();
  this.getOrganisationList();
  if (this.routerState && this.routerState.toast){
    if(this.routerState.toast.title=="Warning"){
      setTimeout(() => {
        this.toast.warning({...this.routerState.toast})
      }, 100);
    }else{
      if(this.routerState.invoiceUrl){
        navigator.clipboard.writeText(this.routerState.invoiceUrl).catch(() => {
          console.error("Unable to copy text");
        });
        setTimeout(() => {
          this.toast.success({...this.routerState.toast})
        }, 200);
      }else{
        setTimeout(() => {
          this.toast.success({...this.routerState.toast})
        }, 100);
      }
      
    }
    this.loadBookingList()
    this.onBackButtonPressed()
  }
  }

  setInitialData() {
    this.previousSearchValue = "";
    this.bookingListCategories = this.bookingService.bookingListCategories;
    this.bookingProviders = this.bookingService.bookingProviders;
    this.userForm = this.bookingService.getUserForm();
    this.addressForm = this.bookingService.getAddressForm();
    this.guestForm = this.bookingService.getGuestForm();
    this.globalDispatchForm = this.bookingService.getGlobalDispatchForm();
    this.prefTherList = this.bookingService.getPrefTherList();
    this.genderList = this.bookingService.getGenderList();
    this.timings = this.bookingService.getTimings();
    this.basket = [];
    this.bookingListTabIndex = 0;
    this.THERAPIST_PREFERENCE = this.bookingService.THERAPIST_PREFERENCE;
    this.prefLanguage = this.bookingService.getPrefLanguage();
    this.clientSource = this.bookingService.getClientSource();
  }

  ngOnDestroy() {
    this.bookingListCategories = [];
    this.bookingProviders = [];
    this.prefTherList = [];
    this.genderList = [];
    this.timings = [];
    this.basket = [];
    this.bookingListTabIndex = 0;
    this.THERAPIST_PREFERENCE = null;
    this.userForm.reset();
    this.addressForm.reset();
    this.guestForm.reset();
    this.globalDispatchForm.reset();
    this.bookingListSubs.unsubscribe();
  }



  // ngOnDestroy() {
  //   this.bookingListCategories = [];
  // }



  setDispatchMeta(): void {
    this.globalDispatchSettings = this.metadata.GlobalDispatchSettings;
    this.staffGroupList = [];
    this.metadata.StaffGroup.forEach(element => {
      let isActive = this.globalDispatchSettings.activeStaffGroups.find(f => f.StaffGroupId === element.StaffGroupId);
      this.staffGroupList.push({
        ...element,
        IsActive: isActive ? true : false,
        text: element.Name,
        value: element.StaffGroupId,
        byDefault: false
      })
    });
    this.generateDispatchString();
  }

  getBookingList({
    bookingTab,
    sort,
    filters,
    pagination,
    OrganisationLocationId=null,
    FromAdmin=null
  }, callbackFn: any = null): void {
    let selTab = this.bookingListCategories.find(f => f.BookingTab === bookingTab);
    selTab.isLoading = true;
    let pageExist = selTab.pagesData.find(f => f.pageNum === pagination.curPage);
    console.log(pagination)
    console.log(pageExist)
    let curExistIds = [];
    let lastUpdated = null;
    if (pageExist) {
      curExistIds = pageExist.data.map(f => f.BookingId);
      lastUpdated = pageExist.lastUpdated;
    } else {
      selTab.pagesData.push({
        pageNum: pagination.curPage,
        data: [],
        lastUpdated: null
      })
    }
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
      CurrentIds: curExistIds,
      LastUpdated: lastUpdated,
      OrganisationLocationId:OrganisationLocationId,
      FromAdmin:FromAdmin      
    }).subscribe(
      data => {
        
        this.bookingService.updatePagesData(data, bookingTab);
        // let selectedTab = this.bookingListCategories.find(f => f.BookingTab === bookingTab);
        // selectedTab.pagination.curPage = data.body.Pagination.Number;
        // selectedTab.pagination.size = data.body.Pagination.Size;
        // selectedTab.pagination.itemCount = data.body.TotalItems;
        // selectedTab.Bookings = [];
        // this.setConstraints({
        //   bookings: [...data.body.Data],
        //   bookingTab,
        // });
        // let pageExist = selectedTab.pagesData.find(f => f.pageNum === selectedTab.pagination.curPage);
        // if (pageExist) {
        //   selectedTab.Bookings = this.tableService.setPageData(selectedTab.Bookings, pageExist.data, data.body.CurrentIds, "BookingId");
        //   pageExist.data = cloneDeep(selectedTab.Bookings);
        //   pageExist.lastUpdated = data.body.LastUpdated;
        // } else {
        //   selectedTab.pagesData.push({
        //     pageNum: selectedTab.pagination.curPage,
        //     data: cloneDeep(selectedTab.Bookings),
        //     lastUpdated: data.body.LastUpdated
        //   })
        // }
        if (callbackFn) {
          let bookingIds = data.body.Data.map(f => f.BookingId);
          callbackFn(bookingIds);
        }
        // if (this.routerState && this.routerState.bookingId) {
        //   this.openDetailView(this.routerState.bookingId);
        // }
        // if (this.routerState && this.routerState.userId) {
        //   this.openBooking();
        // }
        console.log("here")
        console.log(this.bookingListCategories)
        this.cookieService.set('lastBookingCheck', moment().utc().format(), null, "/");
        this.cookieService.set('bookCount', "0", null, "/");
        console.log(this.bookingListCategories)
      },
      error => {
        this.loadingFlag = false;
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

  fetchUnfilledBookingDetails(bookingIds: any[]) {
    if (bookingIds && bookingIds.length) {
      this.webapi.request(API.BOOKING_DETAIL, {
        BookingId: bookingIds
      })
        .subscribe(
          data => {
            data.body.Data.forEach(element => {
              element.dateString = momentz.tz(element.DateTime, environment.STAFF_ZONE).format("ddd, MMM DD YYYY, HH:mm z");
              element.addressString = (element.Floor ? element.Floor+ ", " : "") + (element.Street ? element.Street : "")  + (element.HouseNumber ? ", " + element.HouseNumber : "") +(element.City ? ", " + element.City : "") + (element.Zip ? ", " + element.Zip : "")
              if (element.Ratings) {
                const ratings = element.Ratings;
                element.Ratings.average = (
                  ratings.EaseOfBooking +
                  ratings.Professionalism +
                  ratings.Experience +
                  ratings.Quality +
                  ratings.Value) / 5
                  ;
                element.Ratings.average = Math.round(element.Ratings.average)
              }
              element.Products.forEach(product => {
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
              this.allBookingDetails.push(element);
            });
          },
          error => {
            console.warn(error);
          }
        )
    }
  }

  setStatusFilter(bookingTab=null) {
    let bookingTabToFind=(bookingTab)?bookingTab:this.BOOKING_LIST_TAB.OTHERS
    let othersTab = this.bookingListCategories.find(f => f.BookingTab === bookingTabToFind);
    let filterExist = othersTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_STATUS);
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
      let statusFilter = othersTab.activeFilters.length ? othersTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_STATUS) : null;
      if (statusFilter) {
        othersTab.activeFilters = othersTab.activeFilters.filter(f => f.key !== this.BOOKING_LIST_FILTER.BOOKING_STATUS);
      }
    } else {
      let statusFilter = othersTab.activeFilters.length ? othersTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_STATUS) : null;
      if (statusFilter) {
        statusFilter.values = this.selectedFilters;
      } else {
        othersTab.activeFilters.push({
          key: this.BOOKING_LIST_FILTER.BOOKING_STATUS,
          values: this.selectedFilters
        })
      }
    }
    othersTab.pagination.curPage = 1;
    othersTab.pagination.itemCount = 0;
   
    if(this.selectedOrganisation){
      this.getBookingList({
        bookingTab: othersTab.BookingTab,
        sort: othersTab.sort,
        filters: othersTab.activeFilters,
        pagination: othersTab.pagination,
        OrganisationLocationId:this.selectedOrganisation,
        FromAdmin:1
      })
     }else{
      this.getBookingList({
        bookingTab: othersTab.BookingTab,
        sort: othersTab.sort,
        filters: othersTab.activeFilters,
        pagination: othersTab.pagination
      })
     }
  }

  // Used to search for input value
  onKeyUp(): void {
    if (this.searchBox1Value !== this.previousSearchValue) {
      this.searchBooking("");
    }
  }

  resetSearch(): void {
    this.searchBox1Value = "";
    if (this.searchBox1Value !== this.previousSearchValue) {
      this.searchBooking("");
    }
    this.previousSearchValue = this.searchBox1Value;
    let currentTab = this.bookingListCategories[this.bookingListTabIndex];
    currentTab.activeFilters = [];
    currentTab.sort = {
      key: "",
      value: ""
    }
    currentTab.pagination = {
      curPage: 1,
      itemCount: currentTab.pagination.itemCount,
      size: currentTab.pagination.size
    }
    if(this.selectedOrganisation){
      this.getBookingList({
        bookingTab: currentTab.BookingTab,
        sort: currentTab.sort,
        filters: currentTab.activeFilters,
        pagination: currentTab.pagination,
        OrganisationLocationId:this.selectedOrganisation,
        FromAdmin:1
      })
     }else{
      this.getBookingList({
        bookingTab: currentTab.BookingTab,
        sort: currentTab.sort,
        filters: currentTab.activeFilters,
        pagination: currentTab.pagination
      })
     }
    
  }

  searchBooking(value: string) {
    if (this.searchBox1Value === this.previousSearchValue) {
      return;
    }
    this.previousSearchValue = this.searchBox1Value;
    let currentTab = this.bookingListCategories[this.bookingListTabIndex];
    currentTab.activeFilters = [];
    currentTab.sort = {
      key: "",
      value: ""
    }
    currentTab.pagination = {
      curPage: 1,
      itemCount: currentTab.pagination.itemCount,
      size: currentTab.pagination.size
    }
    if(this.selectedOrganisation){
      this.getBookingList({
        bookingTab: currentTab.BookingTab,
        sort: currentTab.sort,
        filters: currentTab.activeFilters,
        pagination: currentTab.pagination,
        OrganisationLocationId:this.selectedOrganisation,
        FromAdmin:1
      })
     }else{
      this.getBookingList({
        bookingTab: currentTab.BookingTab,
        sort: currentTab.sort,
        filters: currentTab.activeFilters,
        pagination: currentTab.pagination
      })
     }
   
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    let currentTab = this.bookingListCategories[this.bookingListTabIndex];
    let { key, value } = sort;
    if (key) {
      // currentTab.activeFilters = [];
      currentTab.sort = {
        key,
        value: value === "ascend" ? "ascending" : "descending",
      }
      if (value === null) {
        currentTab.sort = {
          key: "",
          value: ""
        }
      }
      currentTab.pagination.curPage = 1;
      currentTab.pagination.itemCount = 0;
      if(this.selectedOrganisation){
        this.getBookingList({
          bookingTab: currentTab.BookingTab,
          sort: currentTab.sort,
          filters: currentTab.activeFilters,
          pagination: currentTab.pagination,
          OrganisationLocationId:this.selectedOrganisation,
          FromAdmin:1
        })
       }else{
        this.getBookingList({
          bookingTab: currentTab.BookingTab,
          sort: currentTab.sort,
          filters: currentTab.activeFilters,
          pagination: currentTab.pagination
        })
       }
      
    }
  }

  changeProvFilter(selectedFilter) {
    let currentTab = this.bookingListCategories[this.bookingListTabIndex];
    // Check if filter is same as previous.
    let filterExist = currentTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_META);
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
      let bookingMetaFilterExist = currentTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_META);
      if (bookingMetaFilterExist) {
        currentTab.activeFilters = currentTab.activeFilters.filter(f => f.key !== this.BOOKING_LIST_FILTER.BOOKING_META);
      }
    } else {
      // filter have some value
      let bookingMetaFilterExist = currentTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_META);
      if (!bookingMetaFilterExist) {
        currentTab.activeFilters.push({
          key: this.BOOKING_LIST_FILTER.BOOKING_META,
          values: [selectedFilter]
        });
      } else {
        bookingMetaFilterExist.values = [selectedFilter]
      }
    }
    currentTab.pagination.curPage = 1;
    currentTab.pagination.itemCount = 0;
    if(this.selectedOrganisation){
      this.getBookingList({
        bookingTab: currentTab.BookingTab,
        sort: currentTab.sort,
        filters: currentTab.activeFilters,
        pagination: currentTab.pagination,
        OrganisationLocationId:this.selectedOrganisation,
        FromAdmin:1
      })
     }else{
      this.getBookingList({
        bookingTab: currentTab.BookingTab,
        sort: currentTab.sort,
        filters: currentTab.activeFilters,
        pagination: currentTab.pagination
      })
     }
    


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

  changeCurBListTab(event) {
    this.setDefaultFilters();
    let selectedTab = this.bookingListCategories.find(f => f.BookingTab === event.index);
    if (!selectedTab.Bookings.length || this.selectedOrganisation) {
      selectedTab.isLoading = true;
      if(this.selectedOrganisation){
        this.getBookingList({
          bookingTab: event.index,
          sort: {
            key: selectedTab.sort.key,
            value: selectedTab.sort.value,
          },
          filters: selectedTab.activeFilters,
          pagination: {
            curPage: selectedTab.pagination.curPage,
            size: selectedTab.pagination.size
          },
          OrganisationLocationId:this.selectedOrganisation,
          FromAdmin:1
        })
       }else{
        this.getBookingList({
          bookingTab: event.index,
          sort: {
            key: selectedTab.sort.key,
            value: selectedTab.sort.value,
          },
          filters: selectedTab.activeFilters,
          pagination: {
            curPage: selectedTab.pagination.curPage,
            size: selectedTab.pagination.size
          }
        })
       }
      console.log(this.bookingListCategories)
    }
  }

  changePageNumber(event, bookingTab) {
    let selectedTab = this.bookingListCategories.find(f => f.BookingTab === bookingTab);
    if (selectedTab) {
      selectedTab.isLoading = true;
      if(this.selectedOrganisation){
        this.getBookingList({
          bookingTab,
          sort: {
            key: selectedTab.sort.key,
            value: selectedTab.sort.value,
          },
          filters: selectedTab.activeFilters,
          pagination: {
            curPage: event,
            size: selectedTab.pagination.size
          },
          OrganisationLocationId:this.selectedOrganisation,
          FromAdmin:1
        })
       }else{
        this.getBookingList({
          bookingTab,
          sort: {
            key: selectedTab.sort.key,
            value: selectedTab.sort.value,
          },
          filters: selectedTab.activeFilters,
          pagination: {
            curPage: event,
            size: selectedTab.pagination.size
          }
        })
       }
     
    }
  }

  changePageSize(event, bookingTab) {
    let selectedTab = this.bookingListCategories.find(f => f.BookingTab === bookingTab);
    if (selectedTab) {
      selectedTab.pagination.curPage = 1;
      selectedTab.isLoading = true;
      if(this.selectedOrganisation){
        this.getBookingList({
          bookingTab,
          sort: {
            key: selectedTab.sort.key,
            value: selectedTab.sort.value,
          },
          filters: selectedTab.activeFilters,
          pagination: {
            curPage: selectedTab.pagination.curPage,
            size: event
          },
          OrganisationLocationId:this.selectedOrganisation,
          FromAdmin:1
        })
       }else{
        this.getBookingList({
          bookingTab,
          sort: {
            key: selectedTab.sort.key,
            value: selectedTab.sort.value,
          },
          filters: selectedTab.activeFilters,
          pagination: {
            curPage: selectedTab.pagination.curPage,
            size: event
          }
        })
       }
      
      
    }
  }

  openDetailView(bookingId: number, fromDetail: boolean = false, event: any = null): void {
    if(!window.getSelection().toString()) {
      this.detailVisible = true;
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
    
    let detailsExist = this.allBookingDetails.find(f => f.BookingId === bookingId);
    if (detailsExist) {
      this.bookingDetail = { ...detailsExist };
      this.bookingDetail.SpecialRequestArray=[]
      this.bookingDetail.customerNotes=[]
      this.isSpinning = false;
      console.log(detailsExist)
      this.webapi.request(API.BOOKING_DETAIL, {
        BookingId: bookingId,
        LastUpdated: this.bookingDetail.LastUpdated
      })
        .subscribe(
          data => {
            
            if (data.body.Data && data.body.Data.length) {
              this.bookingDetail = { ...data.body.Data[0] };
              this.bookingDetail.SpecialRequestArray=[]
              this.bookingDetail.customerNotes=[]
              this.setBookingDetailData();
              let replaceExistDetail = this.allBookingDetails.find(f => f.BookingId === bookingId);
              replaceExistDetail = null;
              replaceExistDetail = { ...this.bookingDetail };
              console.log(this.bookingDetail)
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
            this.bookingDetail.SpecialRequestArray=[]
            this.bookingDetail.customerNotes=[]
            console.log(this.bookingDetail)
            this.setBookingDetailData();
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
        console.log(this.metadata)
    }
  }
}

  setBookingDetailData() {
    this.bookingDetail.dateString = momentz.tz(this.bookingDetail.DateTime, environment.STAFF_ZONE).format("ddd, MMM DD YYYY, HH:mm z");
    this.bookingDetail.addressString = (this.bookingDetail.Floor ? this.bookingDetail.Floor + ", " : "") + (this.bookingDetail.Street ? this.bookingDetail.Street: "") + (this.bookingDetail.HouseNumber ?  ", "+ this.bookingDetail.HouseNumber  : "") +(this.bookingDetail.City ? ", " + this.bookingDetail.City : "") + (this.bookingDetail.Zip ? ", " + this.bookingDetail.Zip : "")
    if (this.bookingDetail.Ratings) {
      const ratings = this.bookingDetail.Ratings;
      this.bookingDetail.Ratings.average = (
        ratings.EaseOfBooking +
        ratings.Professionalism +
        ratings.Experience +
        ratings.Quality +
        ratings.Value) / 5
        ;
      this.bookingDetail.Ratings.average = Math.round(this.bookingDetail.Ratings.average)
    }
    let customerNotes = [];
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

      let notesObj = {Name : '', Notes: ''};
      if (product.Guest) {
        notesObj.Name = product.Guest.Name
        notesObj.Notes = product.Guest.Notes
      } else {
        notesObj.Name = this.bookingDetail.UserName ? this.bookingDetail.UserName : "- (User no longer exists)"
        notesObj.Notes = this.bookingDetail.UserNotes
      }
      if (notesObj.Notes) {
        customerNotes.push(notesObj);
      }
     
      // Creates an array of objects with unique "Name" property values.
      customerNotes = [
        ...new Map(customerNotes.map((item) => [item["Name"], item])).values(),
      ];
    });

    this.bookingDetail.customerNotes = customerNotes;
    if(this.bookingDetail.BookingChannelId){
      let bookingChannel = this.BookingChannelData.find(ch => ch.BookingChannelId === this.bookingDetail.BookingChannelId);
    this.bookingDetail.BookingChannelName=bookingChannel.Name
    }
    this.bookingDetail.SpecialRequestArray=[]
    let foundReason = this.cancelReasonList.find(f => f.Value === this.bookingDetail.CancelBookingReason);
            if(foundReason){
              this.bookingDetail.CancelBookingReasonString=foundReason.Label
            }else{
              this.bookingDetail.CancelBookingReasonString=null
            }
    this.webapi.request(API.METADATA, {
      Metadata: ["SpecialRequest"]
      
    }).subscribe(
      data => {
        this.metadata = { ...data.body.Data };

        if (this.metadata.SpecialRequest) {
          this.SpecialRequestData = this.metadata.SpecialRequest;
        }

        if (this.bookingDetail.SpecialRequest.length) {
          let allRequest = [];
          this.bookingDetail.SpecialRequest.forEach(element => {
            console.log(element)
            let foundRequest = this.SpecialRequestData.find(sp => sp.SpecialRequestId === element.SpecialRequestId);
            if (foundRequest) {
              allRequest.push(foundRequest.SpecialRequestName)
            }
          })
          this.bookingDetail.SpecialRequestArray = allRequest;
        }
      }
    );
    
    
  }

  counter(i: number) {
    return new Array(i);
  }

  closeDetail(): void {
   
    if(this.onBacksendDate!=''){
      this.onBackButtonPressed()
    }else{
      this.setDefaultFilters();
      this.detailVisible = false;
      this.loadingFlag = false;
      this.isSpinning = false;
      this.loadBookingList()
    }
  }

  setDefaultFilters(): void {
    console.log(this.metadata)
    let currentTab = this.bookingListCategories.find(f => f.BookingTab === this.bookingListTabIndex);
    if(currentTab.bookingProviders && currentTab.bookingProviders.length){
      currentTab.bookingProviders.forEach(element => {
        element.byDefault = false;
      });
    }
    
    this.bookingStatus.forEach(element => {
      element.byDefault = false;
    });
    if (currentTab.activeFilters.length) {
      let selectedPlatformFilter = currentTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_META);
      if (selectedPlatformFilter) {
        let selProv = currentTab.bookingProviders.find(f => f.value === selectedPlatformFilter.values[0]);
        selProv.byDefault = true;
      }

      let selectedStatusFilter = currentTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_STATUS);
      if (selectedStatusFilter) {
        this.bookingStatus.forEach(element => {
          let foundInSelected = selectedStatusFilter.values.find(f => f === element.value);
          if (foundInSelected) {
            element.byDefault = true;
          }
        });
      }
    }
  }

  hideCategoryErrorModal() {
    this.showCategoryNotFoundAlert = false;
  }

  openBooking(booking: any = null, newBook = false) {
    if(!booking){
      this.isLoadingData=true
    }
    if(booking){
      
      this.router.navigate(['/newbooking/'], {
        skipLocationChange: true,
        state: {
          from: '/booking/',
          selectedDate: new Date(),
          // metadata: this.metadata,
          // treatmentDetail: this.treatmentDetail,
          BookingId:booking.BookingId,
          // filterStaffList:this.calendarService.filterStaffList,
          // timeSlots:this.timeSlots,
          // appUserList:this.calendarService.appUserList
        }
      }).then(()=>{
        booking.isLoadingEdit=false;
      });
    }else{
      this.router.navigate(['/newbooking/'], {
        skipLocationChange: true,
        state: {
          from: '/booking/',
          selectedDate: new Date(),
          metadata: this.metadata,
          // treatmentDetail: this.treatmentDetail,
          // filterStaffList:this.calendarService.filterStaffList,
        timeSlots:this.timeSlots,
        // appUserList:this.calendarService.appUserList
        }
      })
    }
      // Promise.all(
      //   [this.calendarService.getStaffFilterList(moment(new Date()).format("MM/DD/YYYY")),this.calendarService.getUserList()
      // ])
      // .then(results => {
      //   this.isLoadingData=false
      //   console.log(this.calendarService.timeSlots)
      //   if(booking){
          
      //   }else{
          
      //   }
      // });
    
    
    
  }
  openBookingold(booking: any = null, newBook = false) {
    this.searchBox1Value = "";
    this.userGuest = [];
    if (!this.bookingEditMode) {
      this.isLoadingCats = true;
    }
    this.webapi.request(API.CATEGORY_PRODUCT, {
      LanguageId: 1,
      LastUpdated: this.catalogLastUpdated
    })
      .subscribe(
        data => {
          if (booking) {
            booking.isLoadingEdit = false;
          }
          if (data.body.Data && data.body.Data.length) {
            this.categoryData = [...data.body.Data];
          }
          let categoryNotFoundErr = false;
          if (this.editBookingDetail) {
            this.editBookingDetail.Products.forEach(product => {
              const catFound = this.categoryData.find(c => c.CategoryId === product.CategoryId);
              if (!catFound) {
                categoryNotFoundErr = true;
              }
            });
          }
          if (categoryNotFoundErr) {
            this.showCategoryNotFoundAlert = true;
          } else {
            this.categoryIndex = 0;
            this.catProductIndex = 0;
            this.isLoadingCats = false;
            this.treatmentNum = 0;
            this.basketUpdateMode = false;
            // this.visibleBooking = true;
            this.detailVisible = false;
            this.basket = [];
            this.categoryDataRaw = cloneDeep(this.categoryData);
            if (this.bookingEditMode) {
              this.setBasketForEdit();
            } else if (this.routerState && this.routerState.userId && !newBook) {
              this.appUser = this.routerState.userId;
              setTimeout(() => {
                this.selectUserForBooking();
              }, 1000);
            } else if (newBook) {
              this.appUser = null;
              this.appUserDetail = null;
            }
          }
          
          
        },
        error => {
          if (booking) {
            booking.isLoadingEdit = false;
          }
          this.isLoadingCats = false;
          this.loadingFlag = false;
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

  closeBooking(setAlr = false) {
    this.visibleBooking = false;
    this.detailVisible = false;
    this.searchBox1Value = "";
    // if (!setAlr) {
    //   this.bookingData = cloneDeep(this.bookingDataRaw);
    // }
    this.resetBookingForm();
    this.setStatusFilter();
  }

  catTabChange(event) {
    let catIndex = this.categoryData.findIndex(f => f.CategoryId === event);
    if (catIndex === this.categoryIndex) {
      return;
    }
    this.categoryIndex = catIndex;
    if (!this.basketUpdateMode) {
      this.catProductIndex = this.categoryData[this.categoryIndex].Products.length - 1;
      setTimeout(() => {
        this.catProductIndex = 0;
      }, 100);
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].Durations.forEach(element => {
        element.selected = false;
      });
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedUser = null;
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedUserId = null;
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedAddOns = [];
    }
    if (this.currentSelectedUser) {
      this.selectGuest(
        this.categoryData[this.categoryIndex].CategoryId,
        this.categoryData[this.categoryIndex].Products[this.catProductIndex].ProductId,
        this.currentSelectedUser,
        false
      );
    }
  }

  proTabChange(event) {
    let prodIndex = this.categoryData[this.categoryIndex].Products.findIndex(f => f.ProductId === event);
    if (this.catProductIndex === prodIndex) {
      return;
    }
    this.catProductIndex = prodIndex;
    if (!this.basketUpdateMode) {
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].Durations.forEach(element => {
        element.selected = false;
      });
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedUser = null;
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedUserId = null;
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedAddOns = [];
    }
    if (this.currentSelectedUser) {
      this.selectGuest(
        this.categoryData[this.categoryIndex].CategoryId,
        this.categoryData[this.categoryIndex].Products[this.catProductIndex].ProductId,
        this.currentSelectedUser,
        false
      );
    }
  }

  openUserForm() {
    this.visibleUserForm = true;
    this.registerNewUser = false;
    this.appUser = null;
    window.scroll(0, 0);
    const input = document.getElementById("addressInput");
    this.webapi.request(API.USER, {
      ListUserForBooking: true
    }).subscribe(
      data => {
        this.appUserList = [...data.body.Data];
      },
      error => {
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )
  }

  createNewUser() {
    this.resetUserForm();
    this.registerNewUser = true;
    this.userEmailMessage = null;
    setTimeout(() => {
      let element = document.getElementById("userName");
      element.focus();
    }, 500);
  }

  selectUserForBooking() {
    this.isFetchingUser = true;
    this.webapi.request(API.USER, {
      UserId: this.appUser
    }).subscribe(
      data => {
        let userDetails = [...data.body.Data];
        this.appUserDetail = userDetails[0];
        // if (!this.routerState) {
        this.visibleUserForm = false;
        // }
        this.isFetchingUser = false;
        this.openAddressConfirmation();
      },
      error => {
        this.isFetchingUser = false;
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )
  }

  openAddressConfirmation() {
    this.userAddressEditMode = true;
    this.appUserDetail.Elevator === 1 ? this.appUserDetail.Elevator = true : this.appUserDetail.Elevator = false;
    this.addressForm.patchValue(this.appUserDetail);
    setTimeout(() => {
      let bookingAddrElement = document.getElementById("userBookingAddr");
      bookingAddrElement.focus();
    }, 500);
  }

  setBookingAddress() {
    let newAddr = "";
    // if (this.addressForm.controls.Floor.value) {
    //   newAddr += this.addressForm.controls.Floor.value + ", ";
    // }
    newAddr += this.addressForm.controls.Street.value;
    // if (this.addressForm.controls.City.value) {
    //   newAddr += ", " + this.addressForm.controls.City.value;
    // }
    this.isLoadingAddr = true;
    this.webapi.request(API.METADATA, {
      Metadata: ['Center'],
      Source: this.centerData.Address,
      Destination: newAddr
    }).subscribe(
      data => {
        this.isLoadingAddr = false;
        const tempData = { ...data.body.Data };
        this.centerData = tempData.Center[0];
        const reachData = tempData.ReachOutData;
        if (reachData.rows[0].elements[0].status !== "OK") {
          this.toast.error({
            title: "Error",
            msg: "Sorry, we are not in selected location yet.",
            theme: "bootstrap",
            timeout: 3000
          })
        } else {
          this.reachOutTime = Math.round(reachData.rows[0].elements[0].duration.value / 60);
          let distance = reachData.rows[0].elements[0].distance.value / 1609;
          if (distance > this.centerData.ServiceArea) {
            this.serviceModalVisible = true;
            this.userAddressEditMode = false;
          } else {
            this.setAppUser();
          }
        }
      },
      error => {
        this.isLoadingAddr = false;
        this.toast.error({
          title: "Error",
          msg: error.headers.get('message'),
          theme: "bootstrap",
          timeout: 3000
        })
      }
    );
  }

  setAppUser() {
    let newAddr = "";
    // if (this.addressForm.controls.Floor.value) {
    //   newAddr += this.addressForm.controls.Floor.value + ", ";
    // }
    newAddr += this.addressForm.controls.Street.value;
    // if (this.addressForm.controls.City.value) {
    //   newAddr += ", " + this.addressForm.controls.City.value;
    // }
    this.bookingAddress = newAddr;
    this.appUserDetail.Street = this.addressForm.controls.Street.value;
    this.appUserDetail.City = null; //this.addressForm.controls.City.value;
    this.appUserDetail.Floor = null; //this.addressForm.controls.Floor.value;
    this.appUserDetail.Zip = this.addressForm.controls.Zip.value;
    this.appUserDetail.Elevator = this.addressForm.controls.Elevator.value;
    this.rootUser = {
      UserId: this.appUserDetail.UserId,
      Name: this.appUserDetail.Name,
      Email: this.appUserDetail.Email,
      Contact: this.appUserDetail.Contact,
      Gender: this.appUserDetail.Gender,
      Street: this.appUserDetail.Street,
      Floor: this.appUserDetail.Floor,
      City: this.appUserDetail.City,
      Zip: this.appUserDetail.Zip,
      Elevator: this.appUserDetail.Elevator,
      Therapist: this.appUserDetail.Therapist === null ? 2 : this.appUserDetail.Therapist,
      Notes: this.appUserDetail.Notes,
      ClientSource: this.appUserDetail.ClientSource,
      PreferredLanguage: this.appUserDetail.PreferredLanguage,
      DOB: this.appUserDetail.DOB,
      self: true,
      tempId: moment().toDate().getTime()
    };
    this.userGuest.push(this.rootUser)
    this.closeUserModal();
    let category = this.categoryData[this.categoryIndex];
    let product = category.Products[this.catProductIndex];
    this.selectGuest(category.CategoryId, product.ProductId, this.rootUser);
    this.userAddressEditMode = false;
  }

  closeUserModal() {
    this.visibleUserForm = false;
    this.resetUserForm();
  }

  resetUserForm() {
    this.userForm.reset();
    this.userForm.controls.Therapist.setValue(2);
  }

  changeStatusFilter(selectedFilters: any[],bookingTab) {
    this.selectedFilters = selectedFilters;
    this.setStatusFilter(bookingTab);
  }

  saveUser() {
    let address = "";
    // if (this.userForm.controls.Floor.value) {
    //   address += this.userForm.controls.Floor.value + ", ";
    // }
    address += this.userForm.controls.Street.value;
    // if (this.userForm.controls.City.value) {
    //   address += ", " + this.userForm.controls.City.value;
    // }
    this.isUserLoading = true;
    this.webapi.request(API.CHECK_USER_EMAIL, {
      Email: this.userForm.controls.Email.value
    }).subscribe(
      data => {
        this.webapi.request(API.METADATA, {
          Metadata: ['Center'],
          Source: this.centerData.Address,
          Destination: address
        }).subscribe(
          data => {
            this.isUserLoading = false;
            const tempData = { ...data.body.Data };
            this.centerData = tempData.Center[0];
            const reachData = tempData.ReachOutData;
            if (reachData.rows[0].elements[0].status !== "OK") {
              this.toast.error({
                title: "Error",
                msg: "Sorry, we are not in selected location yet.",
                theme: "bootstrap",
                timeout: 3000
              })
            } else {
              this.reachOutTime = Math.round(reachData.rows[0].elements[0].duration.value / 60);
              this.bookingAddress = address;
              this.rootUser = {
                ...this.userForm.value,
                self: true,
                tempId: moment().toDate().getTime()
              };
              let distance = reachData.rows[0].elements[0].distance.value / 1609;
              if (distance > this.centerData.ServiceArea) {
                this.serviceModalVisible = true;
              } else {
                this.userGuest.push(this.rootUser)
                this.closeUserModal();
                let category = this.categoryData[this.categoryIndex];
                let product = category.Products[this.catProductIndex];
                this.selectGuest(category.CategoryId, product.ProductId, this.rootUser);
              }
            }
          },
          error => {
            this.isUserLoading = false;
            this.toast.error({
              title: "Error",
              msg: error.headers.get('message'),
              theme: "bootstrap",
              timeout: 3000
            })
          }
        )
      },
      error => {
        this.isUserLoading = false;
        if (error.status === 300) {
          this.userForm.controls.Email.setErrors({
            'alreadyExist': true
          })
          this.userEmailMessage = error.headers.get("message");
        }
      }
    )
  }

  selectDuration(categoryId, productId, duration) {
    let categoryFound = this.categoryData.find(cat => cat.CategoryId === categoryId);
    let productFound = categoryFound.Products.find(prod => prod.ProductId === productId);
    let durationFound = productFound.Durations.find(dur => dur.Duration === duration);
    durationFound.selected = true;
    productFound.Durations.forEach(dur => {
      if (dur.Duration !== duration) {
        dur.selected = false;
      }
    });
  }

  selectGuest(categoryId, productId, user, doShow = true) {
    this.timings.forEach(f => f.selected = false);
    let categoryFound = this.categoryData.find(cat => cat.CategoryId === categoryId);
    let productFound = categoryFound.Products.find(prod => prod.ProductId === productId);
    if (this.treatmentNum === 0) {
      this.timings.forEach(f => f.selected = false);
    }
    if (this.treatmentNum !== 0) {
      const firstProUser = this.basket[0].User;
      if (firstProUser.tempId !== user.tempId && doShow) {
        if (!this.bookingEditMode) {
          this.timings[0].selected = true;
        }
        this.openTimeModal();
      } else {
        productFound.SameTime = false;
      }
    } else {
      productFound.SameTime = false;
    }
    productFound.selectedUser = user;
    productFound.selectedUserId = user.tempId;
    this.currentSelectedUser = user;
  }

  openTimeModal() {
    this.timeModalVisible = true;
  }

  selectTiming(timing: number) {
    if (timing === 0) {
      this.timings[0].selected = true;
      this.timings[1].selected = false;
    } else {
      this.timings[0].selected = false;
      this.timings[1].selected = true;
    }
  }

  closeTimeModal() {
    this.timeModalVisible = false;
  }

  selectAddOn(categoryId, productId, addOn) {
    let categoryFound = this.categoryData.find(cat => cat.CategoryId === categoryId);
    let productFound = categoryFound.Products.find(prod => prod.ProductId === productId);
    let addOnFound = categoryFound.AddOns.find(add => add.AddOnId === addOn.AddOnId);
    if (!productFound.selectedAddOns) {
      productFound.selectedAddOns = [addOnFound]
    } else {
      if (productFound.selectedAddOns.includes(addOn)) {
        productFound.selectedAddOns = productFound.selectedAddOns.filter(f => f.AddOnId !== addOn.AddOnId);
      } else {
        productFound.selectedAddOns.push(addOnFound);
      }
    }
    if (addOn.BookingProductAddOnId) {
      addOnFound.BookingProductAddOnId = addOn.BookingProductAddOnId;
    }
  }

  openGuestForm() {
    this.guestFormVisible = true;
    this.resetGuestForm();
    setTimeout(() => {
      let element = document.getElementById("guestName");
      element.focus();
    }, 500);
  }

  closeGuestForm() {
    this.guestFormVisible = false;
    this.resetGuestForm();
  }

  resetGuestForm() {
    this.guestForm.reset();
    this.guestForm.controls.Therapist.setValue(2);
  }

  saveGuest() {
    const userObj = {
      ...this.guestForm.value,
      self: false,
      tempId: moment().toDate().getTime()
    };
    this.userGuest.push(userObj);
    this.closeGuestForm();
    let category = this.categoryData[this.categoryIndex];
    let product = category.Products[this.catProductIndex];
    this.selectGuest(category.CategoryId, product.ProductId, userObj);
  }

  disableAddBasket(product) {
    const durationSelected = product.Durations.filter(f => f.selected);
    if (durationSelected.length === 0) {
      return true;
    }
    if (!product.selectedUser) {
      return true;
    } else {
      return false;
    }
  }

  addToBasket(categoryId, product) {
    let duration = product.Durations.filter(f => f.selected)[0].Duration;
    let amount = product.Durations.filter(f => f.selected)[0].Amount;
    if (product.selectedAddOns) {
      product.selectedAddOns.forEach(element => {
        duration += element.Duration;
        amount += element.Amount;
      });
    }
    const sameTime = this.timings.find(f => f.Value === 1).selected;
    let basketObj = {
      BookingProductId: product.BookingProductId ? product.BookingProductId : null,
      TreatmentNum: this.treatmentNum,
      ProductId: product.ProductId,
      CategoryId: categoryId,
      Name: product.Translations[0].Name,
      Duration: product.Durations.filter(f => f.selected)[0].Duration,
      TotalDuration: duration,
      Amount: product.Durations.filter(f => f.selected)[0].Amount,
      TotalAmount: amount,
      AddOns: product.selectedAddOns ? product.selectedAddOns : [],
      PreparationTime: product.PreparationTime,
      User: product.selectedUser,
      SameTime: sameTime,
      isEditable: true,
      EventId: ""
    }
    if (product.EventId) {
      basketObj.EventId = product.EventId;
    } else {
      delete basketObj.EventId;
    }
    this.timings.forEach(f => f.selected = false);
    if (this.basketUpdateMode) {
      this.basket[this.treatmentNum] = basketObj;
      this.basketUpdateMode = false;
    } else {
      this.basket.push(basketObj);
    }
    this.openBasket();
  }

  openBasket() {
    this.inSlots = false;
    this.inFinalReview = false;
    this.beforeSlots = true;
    this.basketVisible = true;
    this.bookingDrawerTitle = this.BOOKING_SUMMARY;
    this.categoryData = cloneDeep(this.categoryDataRaw);
    this.categoryIndex = 0;
    this.catProductIndex = 0;
    this.basketUpdateMode = false;
  }

  addNewTreatment() {
    this.categoryIndex = 0;
    this.catProductIndex = 0;
    this.treatmentNum = this.basket.length;
    this.closeBasket();
    this.currentSelectedUser = this.rootUser;
  }

  closeBasket() {
    this.basketVisible = false;
  }

  closeCurrentBasket() {
    let product;
    product = this.basket[this.treatmentNum];
    this.editBasketProduct(product);
  }

  editBasketProduct(product) {
    this.categoryIndex = this.categoryData.findIndex(f => f.CategoryId === product.CategoryId);
    const categoryFound = this.categoryData.find(f => f.CategoryId === product.CategoryId);
    this.catProductIndex = categoryFound.Products.findIndex(f => f.ProductId === product.ProductId);
    let duration = this.categoryData[this.categoryIndex].Products[this.catProductIndex].Durations.find(f => f.Duration === product.Duration);
    duration.selected = true;
    this.basketUpdateMode = true;
    this.treatmentNum = product.TreatmentNum;
    this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedUser = product.User;
    this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedUserId = product.User.tempId;
    this.categoryData[this.categoryIndex].Products[this.catProductIndex].selectedAddOns = [];
    if (product.EventId) {
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].EventId = product.EventId;
    }
    if (product.BookingProductId) {
      this.categoryData[this.categoryIndex].Products[this.catProductIndex].BookingProductId = product.BookingProductId;
    }
    this.closeBasket();
    product.AddOns.forEach(addOn => {
      this.selectAddOn(product.CategoryId, product.ProductId, addOn);
    });
  }

  deleteProduct(product) {
    this.basket = this.basket.filter(prod => prod !== product);
    if (this.basket.length === 0) {
      this.categoryIndex = 0;
      this.catProductIndex = 0;
      this.closeBasket();
    }
    this.basket.forEach((f, index) => f.TreatmentNum = index);
    this.treatmentNum > 0 ? this.treatmentNum -= 1 : this.treatmentNum = 0;
  }

  viewSchedule() {
    this.beforeSlots = false;
    this.inSlots = true;
    this.basket.forEach((product, index) => {
      let sameTime = product.SameTime;
      if (index === 0) {
        sameTime = false;
      } else {
        if (this.basket[0].User.tempId === product.User.tempId) {
          sameTime = false;
        }
      }
      product.SameTime = sameTime;

      product.AutoDispatch = this.globalDispatchSettings.globalDispatchSettings[0].GlobalDispatchDefault === 0 ? true : false;
      if (this.bookingEditMode && product.StaffId) {
        product.StaffAssignmentType = this.STAFF_ASSIGNMENT_TYPE.Assign;
      } else {
        product.StaffAssignmentType = this.STAFF_ASSIGNMENT_TYPE.Dispatch;
      }
      product.Staff = [];
      product.Staff = this.staffList.filter(st => {
        st.Rate = null;
        let staffProdExist = false;
        if (
          product.User.Therapist !== this.THERAPIST_PREFERENCE.EITHER &&
          product.User.Therapist !== st.Gender
        ) {
          return staffProdExist;
        }
        let catExist = st.CategoryData.find(f => f.CategoryId === product.CategoryId)
        if (catExist) {
          let prodFound = catExist.Products.find(p => p.ProductId === product.ProductId);
          if (prodFound) {
            st.Rate = catExist.Rate;
            staffProdExist = true;
          }
        }
        return staffProdExist;
      });
      // product.ManualStaffList = cloneDeep(product.Staff);
      // product.User.Therapist === 2
      //   ? product.Staff = this.staffList.filter(f => f.Categories.includes(product.CategoryId))
      //   : product.Staff = this.staffList.filter(f => f.Categories.includes(product.CategoryId) && f.Gender === product.User.Therapist);
    })
    this.fetchSlots(this.bookingEditMode && this.editBookingDetail.DateTime ? this.editBookingDetail.DateTime : null);
    if (this.bookingEditMode) {
      this.calnSelDate = moment(this.editBookingDetail.DateTime).toDate();
    }
  }

  customSlotDisableHr(): number[] {
    if (moment(BookingComponent.calselectedDate).startOf('day').isSame(moment().startOf("day"))) {
      let curnCETTime = momentz.tz(environment.STAFF_ZONE).get('hour');
      // curnCETTime += 1;
      let disabledHours = [];
      for (let index = 0; index <= curnCETTime; index++) {
        disabledHours.push(index)
      }
      return disabledHours;
    }else{
      if(moment(BookingComponent.calselectedDate).startOf('day').isBefore(moment().startOf("day"))){
        let disabledHours = [];
      for (let index = 0; index <= 23; index++) {
        disabledHours.push(index)
      }
      return disabledHours;
      }else{
        return [];
      }
    }
    
  }

  fetchSlots(selectedDate: Date = null) {
    this.selectedSlot = null;
    if (!selectedDate) {
      this.selectedBookingDate = moment().format("ddd DD/MM/YY");
    } else {
      this.selectedBookingDate = moment(selectedDate).format("ddd DD/MM/YY");
    }
    BookingComponent.calselectedDate=moment(this.selectedBookingDate).format("ddd DD/MM/YY");
    let fetchObj = {
      BookingDate: selectedDate ? moment(selectedDate).format("MM/DD/YYYY") : moment().format("MM/DD/YYYY"),
      ReachOutTime: this.reachOutTime,
      DateTime: moment().utc().format(),
      Products: [],
      Events: []
    }
    let events = [];
    this.basket.forEach((product, index) => {
      fetchObj.Products.push({
        ProductId: product.ProductId,
        CategoryId: product.CategoryId,
        Therapist: product.User.Therapist,
        Duration: product.TotalDuration,
        PreparationTime: product.PreparationTime,
        Name: product.User.Name,
        SameTime: product.SameTime
      })
      if (this.bookingEditMode) {
        if (product.EventId) {
          events.push(product.EventId)
        }
      }
    })
    if (this.bookingEditMode) {
      fetchObj.Events = events;
    } else {
      delete fetchObj.Events;
    }
    this.availableTimeSlots = [];
    if (!this.isCustomSlot) {
      this.getTimeSlots(fetchObj);
    }
    this.customSlot = null;
    this.bookingDrawerTitle = this.SCHEDULE_BOOKING;
    setTimeout(() => {
      let calElement = document.getElementById("calContainer");
      const calHeight = calElement.offsetHeight.toString();
      document.getElementById("slotContainer").style.height = calHeight + "px";
      document.getElementById("slotContainer").style.minHeight = calHeight + "px";
      document.getElementById("slotContainer").style.maxHeight = calHeight + "px";
    }, 100);
  }

  disableCalDate = (date: Date): boolean => {
    console.log(date);
    return true;
  }

  getTimeSlots(fetchObj) {
    this.availableTimeSlots = [];
    this.slotSpin = true;
    this.webapi.request(API.TIME_SLOT, fetchObj)
      .subscribe(
        data => {
          let calElement = document.getElementById("calContainer");
          const calHeight = calElement.offsetHeight.toString();
          document.getElementById("slotContainer").style.height = calHeight + "px";
          document.getElementById("slotContainer").style.minHeight = calHeight + "px";
          document.getElementById("slotContainer").style.maxHeight = calHeight + "px";
          this.availableTimeSlots = [...data.body.Data];
          this.slotSpin = false;
          this.finalBasket = [];
          this.finalBasket = cloneDeep(this.basket);
          if (this.bookingEditMode) {
            let bookedTime = momentz.tz(this.editBookingDetail.DateTime, environment.STAFF_ZONE).format("HH:mm");
            let slotFound = this.availableTimeSlots.find(d => d.Slot === bookedTime);
            if (slotFound) {
              this.selectSlot(bookedTime);
            }
          }
        },
        error => {
          this.slotSpin = false;
          this.toast.error({
            title: error.headers.get("message"),
            msg: "",
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  selectSlot(slot: any) {
    const found = this.availableTimeSlots.find(sl => sl.Slot === slot);
    if (found) {
      // set current slot as selected and mark all other as selected - false
      found.selected = true;
      this.availableTimeSlots.forEach(f => {
        if (slot !== f.Slot) {
          f.selected = false;
        }
      });
      found.Products.forEach((product, index) => {
        let curBasketProduct = this.finalBasket[index];
        curBasketProduct.AvailableStaff = cloneDeep(product.Staff);
        curBasketProduct.DispatchList = [];
        let productCat = this.metadata.Product.find(f => f.ProductId === curBasketProduct.ProductId);
        product.Staff.forEach(staff => {
          let st = this.metadata.Staff.find(f => f.StaffId === staff.StaffId);
          let catRate = st.CategoryData.find(f => f.CategoryId === productCat.CategoryId);
          curBasketProduct.DispatchList.push({
            StaffId: staff.StaffId,
            StaffName: st.StaffName,
            Rank: st.Rank,
            StaffGroupId: st.StaffGroupId,
            StaffGroupName: st.StaffGroupName,
            Rate: catRate.Rate
          });
        });
        curBasketProduct.StartTime = found.Products[index].StartTime;
        curBasketProduct.Staff.forEach(element => element.isAvailable = false);
        curBasketProduct.AvailableStaff.forEach(staff => {
          const staffFound = curBasketProduct.Staff.find(st => st.StaffId === staff.StaffId);
          if (staffFound) {
            staffFound.isAvailable = true;
          }
        });
        if (curBasketProduct.StaffId && this.bookingEditMode) {
          let staffExist = product.Staff.find(f => f.StaffId === curBasketProduct.StaffId);
          if (staffExist) {
            curBasketProduct.selectedStaffId = curBasketProduct.StaffId;
          } else {
            curBasketProduct.selectedStaffId = null;
          }
        } else {
          curBasketProduct.selectedStaffId = curBasketProduct.AvailableStaff[0].StaffId;
        }
        curBasketProduct.selStaffAvailable = true;
      });
    }
    if (typeof slot === "string") {
      this.selectedSlot = slot;
      this.isCustomSlot = false;
    } else {
      this.selectedSlot = moment(slot).format("HH:mm");
      this.finalBasket.forEach(f => {
        f.AvailableStaff = [];
        f.selStaffAvailable = true;
        f.Staff.forEach(element => {
          delete element.isAvailable;
        });
        f.selectedStaffId = null;
      })
    }
    try {
      setTimeout(() => {
        let ele = document.getElementById(slot);
        if (ele) {
          let root = document.getElementById("slotContainer")
          root.scrollTo({
            top: ele.offsetTop - 75,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch (error) {
      console.log(error);
    }
  }

  selectCustomSlot(event) {
    this.isCustomSlot = event;
    this.selectedSlot = "";
    this.customSlot = null;
    this.availableTimeSlots = [];
    this.availableTimeSlots.forEach(f => f.selected = false);
    this.finalBasket.forEach(f => {
      f.AvailableStaff = [];
      f.selStaffAvailable = true;
      f.Staff.forEach(element => {
        delete element.isAvailable;
      });
      f.selectedStaffId = null;
      f.StaffAssignmentType = this.STAFF_ASSIGNMENT_TYPE.Assign;
    });
  }

  goBackToBeforeSlots() {
    this.finalBasket = [];
    this.inSlots = false;
    this.beforeSlots = true;
    this.bookingDrawerTitle = this.BOOKING_SUMMARY;
    this.calnSelDate = null;
    this.isCustomSlot = false;
    this.selectedSlot = "";
  }

  disableSchedule() {
    // return true for disable and false for enable.
    const element = document.getElementById("scheduleBtn");
    if (!this.selectedSlot) {
      this.scheduleButtonTitle = "Please select time slot";
      element.title = this.scheduleButtonTitle;
      return true;
    }
    let prodValid = false;
    for (let prIn = 0; prIn < this.finalBasket.length; prIn++) {
      const product = this.finalBasket[prIn];
      if (product.AvailableStaff.length === 0) {
        prodValid = true;
        this.scheduleButtonTitle = "Please select staff";
        break;
      } else {
        if (!product.AvailableStaff[0].StaffId) {
          this.scheduleButtonTitle = "Please select staff";
          prodValid = true;
          break;
        }
      }
    }
    if (moment(this.selectedBookingDate, "ddd DD/MM/YY").isBefore(moment().startOf("day"))) {
      prodValid = true;
      this.scheduleButtonTitle = "Invalid selected date";
    }
    if (!prodValid) {
      this.scheduleButtonTitle = "Schedule";
    }
    element.title = this.scheduleButtonTitle;
    return prodValid;
  }

  scheduleBooking() {
    this.beforeSlots = false;
    this.inSlots = false;
    this.inFinalReview = true;
    this.bookingDrawerTitle = this.FINALIZE_BOOKING;
    this.finalBasket.forEach((element, index) => {
      const staffFound = element.Staff.find(f => f.StaffId === element.selectedStaffId);
      const availableStaff = element.AvailableStaff.filter(f => f.GoogleEmail !== staffFound.GoogleEmail);
      element.AvailableStaff = [];
      element.AvailableStaff = [staffFound];
      element.AvailableStaff.push(...availableStaff);
      // if (!this.isCustomSlot) {
      //   const availableStaff = element.AvailableStaff.filter(f => f.GoogleEmail !== staffFound.GoogleEmail);
      //   element.AvailableStaff = [];
      //   element.AvailableStaff = [staffFound];
      //   element.AvailableStaff.push(...availableStaff);
      // } else {
      //   element.AvailableStaff[0].StaffName = staffFound.StaffName;
      //   element.AvailableStaff[0].GoogleEmail = staffFound.GoogleEmail;
      //   if (!element.SameTime) {
      //     element.StartTime = moment(this.selectedBookingDate + " " + this.selectedSlot, "ddd DD/MM/YY HH:mm");
      //     if (index > 0) {
      //       element.StartTime.add(this.finalBasket[0].TotalDuration, "minute");
      //       if (this.finalBasket[0].AvailableStaff[0].StaffId === element.AvailableStaff[0].StaffId) {
      //         element.StartTime.add(element.PreparationTime, "minute");
      //       }
      //     }
      //     element.StartTime = element.StartTime.utc().format();
      //   } else {
      //     element.StartTime = moment(this.selectedBookingDate + " " + this.selectedSlot, "ddd DD/MM/YY HH:mm").utc().format();
      //   }
      // }
      if (this.isCustomSlot) {
        if (!element.SameTime) {
          element.StartTime = momentz.tz(this.selectedBookingDate + " " + this.selectedSlot, "ddd DD/MM/YY HH:mm", environment.STAFF_ZONE);
          if (index > 0) {
            element.StartTime.add(this.finalBasket[0].TotalDuration, "minute");
            if (this.finalBasket[0].selectedStaffId === element.selectedStaffId) {
              element.StartTime.add(element.PreparationTime, "minute");
            }
          }
          element.StartTime = element.StartTime.utc().format();
        } else {
          element.StartTime = momentz.tz(this.selectedBookingDate + " " + this.selectedSlot, "ddd DD/MM/YY HH:mm", environment.STAFF_ZONE).utc().format();
        }
      }
    });
    this.finalSelectedDate = momentz.tz(this.selectedBookingDate + " " + this.selectedSlot, "ddd DD/MM/YY HH:mm", environment.STAFF_ZONE).format("ddd DD-MMM-YYYY, HH:mm z");
  }

  editBooking() {
    this.inFinalReview = false;
    this.inSlots = true;
    this.beforeSlots = false;
    setTimeout(() => {
      let calElement = document.getElementById("calContainer");
      const calHeight = calElement.offsetHeight.toString();
      document.getElementById("slotContainer").style.height = calHeight + "px";
      document.getElementById("slotContainer").style.minHeight = calHeight + "px";
      document.getElementById("slotContainer").style.maxHeight = calHeight + "px";
    }, 100);
    this.bookingDrawerTitle = this.SCHEDULE_BOOKING;
    this.calnSelDate = moment(this.selectedBookingDate, "ddd DD/MM/YY").toDate();
  }

  saveBooking(forceAllot = false) {
    let amount = 0;
    let duration = 0;
    let finalProducts = [];
    this.finalBasket.forEach(product => {
      amount += product.TotalAmount;
      // if (!product.SameTime) {
      //   duration += product.TotalDuration;
      // } else {
      //   if (this.finalBasket[0].TotalDuration < product.TotalDuration) {
      //     duration = product.TotalDuration;
      //   }
      // }
      let prodObj = {
        ProductId: product.ProductId,
        CategoryId: product.CategoryId,
        Name: product.Name,
        Duration: product.Duration,
        Amount: product.Amount,
        AddOns: product.AddOns ? product.AddOns : [],
        Guest: product.User.self ? null : {
          Name: product.User.Name,
          Contact: product.User.Contact,
          Relation: product.User.Relation,
          Gender: product.User.Gender,
          Notes: product.User.Notes,
        },
        SameTime: product.SameTime,
        StartTime: product.StartTime,
        AvailableStaff: product.AvailableStaff,
        DispatchType: null,
        ManualStaffId: null,
        ManualStaffEmail: null,
        Therapist: product.User.Therapist
      }
      console.log(product)
      if (product.StaffAssignmentType === this.STAFF_ASSIGNMENT_TYPE.Assign) {
        prodObj.DispatchType = this.PRODUCT_DISPATCH_TYPE.DIRECT_ASSIGNMENT
        // prodObj.AvailableStaff = product.AvailableStaff;
      } else if (product.StaffAssignmentType === this.STAFF_ASSIGNMENT_TYPE.Dispatch) {
        // prodObj.AvailableStaff = product.AvailableStaff;
        if (product.AutoDispatch) {
          prodObj.DispatchType = this.PRODUCT_DISPATCH_TYPE.AUTOMATIC_DISPATCH;
        } else {
          prodObj.DispatchType = this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH;
          // let selStaff = product.Staff.find(f => f.ManualDispatchStaffSelected);
          // prodObj.ManualStaffId = selStaff.StaffId;
          // prodObj.ManualStaffEmail = selStaff.GoogleEmail;
        }
      }
      finalProducts.push(prodObj)
    })
    let bookingObj = {
      UserId: this.rootUser.UserId ? this.rootUser.UserId : null,
      Name: this.rootUser.Name,
      Email: this.rootUser.Email,
      Contact: this.rootUser.Contact,
      Gender: this.rootUser.Gender,
      Street: this.rootUser.Street,
      Floor: this.rootUser.Floor,
      City: this.rootUser.City,
      Zip: this.rootUser.Zip,
      Elevator: this.rootUser.Elevator ? 1 : 0,
      Therapist: this.rootUser.Therapist,
      Notes: this.rootUser.Notes,
      DOB: this.rootUser.DOB,
      PreferredLanguage: this.rootUser.PreferredLanguage,
      ClientSource: this.rootUser.ClientSource,
      ReachOutTime: this.reachOutTime,
      DateTime: moment(this.selectedBookingDate + " " + this.selectedSlot, "ddd DD/MM/YY HH:mm").utc().format(),
      Amount: amount,
      Products: finalProducts,
      PaidPrice: amount,
      ForceStaffAllot: false
    }
    if (forceAllot) {
      bookingObj.ForceStaffAllot = true;
    } else {
      for (let prInc = 0; prInc < this.finalBasket.length; prInc++) {
        const element = this.finalBasket[prInc];
        if (!element.selStaffAvailable) {
          bookingObj.ForceStaffAllot = true;
          break;
        }
      }
    }
    if (this.bookingConfirmModalVisible) {
      this.bookingConfirmModalVisible = false;
    }
    console.log(bookingObj);
    this.spinner.show();
    this.webapi.request(API.SAVE_BOOKING_CMS, bookingObj)
      .subscribe(
        data => {
          // this.bookingListCategories.forEach(element => {
          //   element.Bookings = [];
          //   element.BookingsRaw = [];
          // });
          // this.bookingData = [...data.body.Data];
          // this.setConstraints();
          // this.bookingDataRaw = cloneDeep(this.bookingData);
          // this.setStatusFilter();
          this.loadBookingList();
          this.closeBooking(true);
          this.spinner.hide();
        },
        error => {
          this.spinner.hide();
          if (error.status === 410) {
            // open booking staff allotment confirmation model
            this.bookingConfirmModalVisible = true;
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

  loadBookingList() {
    let currentTab = this.bookingListCategories.find(f => f.BookingTab === this.bookingListTabIndex);
    this.bookingListCategories.forEach(tab => {
      tab.Bookings = [];
    });
    if (currentTab) {
      if(this.selectedOrganisation){
        this.getBookingList({
          bookingTab: this.bookingListTabIndex,
          sort: currentTab.sort,
          filters: currentTab.activeFilters,
          pagination: currentTab.pagination,
          OrganisationLocationId:this.selectedOrganisation,
          FromAdmin:1
        })
       }else{
        this.getBookingList({
          bookingTab: this.bookingListTabIndex,
          filters: currentTab.activeFilters,
          pagination: currentTab.pagination,
          sort: currentTab.sort
        })
       }
     
    }
    console.log(this.metadata)
    
  }

  setConstraints({
    bookings,
    bookingTab
  }) {
    // let maxId = 0;
    bookings.forEach(booking => {
      // if (booking.BookingId > maxId) {
      //   maxId = booking.BookingId;
      // }
      booking.BookingIdShow = "#" + booking.BookingId;
      booking.address = (booking.Floor ? booking.Floor + ", " : "") + (booking.Street ? booking.Street + ", " : "") + (booking.HouseNumber ? booking.HouseNumber + ", " : "") +(booking.City ?  booking.City+", "  : "") + (booking.Zip ? booking.Zip+", "  : "");
      if (booking.address && booking.address.length > 55) {
        booking.AddressShow = booking.address.substr(0, 55) + "...";
        booking.AddressExtra = true;
      } else {
        booking.AddressShow = booking.address;
        booking.AddressExtra = false;
      }
      let userNameToShow = "";
      let productToShow = "";
      booking.Products.length === 1
        ? productToShow = booking.Products[0].Product
        : productToShow = booking.Products[0].Product + " +" + (booking.Products.length - 1);
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

      booking.AutoDispatch = false;
      let dispatchTypes = [];
      booking.Products.forEach(element => {
        if (element.StaffVacConflict === 1) {
          booking.StaffVacConflict = true;
        } else {
          element.StaffVacConflict = false;
        }
        if (element.DispatchType === this.PRODUCT_DISPATCH_TYPE.DIRECT_ASSIGNMENT) {
          element.DispatchString = "Assigned";
          !dispatchTypes.includes("Assigned") ? dispatchTypes.push("Assigned") : true;
        }
        if (element.DispatchType === this.PRODUCT_DISPATCH_TYPE.AUTOMATIC_DISPATCH) {
          element.DispatchString = "Automatic";
          element.AutoDispatch = true;
          booking.AutoDispatch = true;
          !dispatchTypes.includes("Automatic") ? dispatchTypes.push("Automatic") : true;
        }
        if (element.DispatchType === this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH) {
          element.DispatchString = "Manual";
          element.AutoDispatch = false;
          !dispatchTypes.includes("Manual") ? dispatchTypes.push("Manual") : true;
        }
      });
      booking.DispatchString = dispatchTypes.join(" + ");
    });
    switch (bookingTab) {
      case this.BOOKING_LIST_TAB.UNFILLED: {
        const notFilledBookings = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.UNFILLED);
        bookings.forEach(booking => {
          booking.Products.forEach(product => {
            if (!product.StaffId) {
              const existInNotFilled = notFilledBookings.Bookings.find(f => f.BookingId === booking.BookingId);
              if (!existInNotFilled) {
                let differ = moment().diff(moment(booking.Created), "minutes");
                booking.TimeLapsed = "-";
                if (differ > 60) {
                  let hrs = moment().diff(moment(booking.Created), "hours");
                  let mins = differ % 60;
                  booking.TimeLapsed = `${hrs}hrs ${mins} mins`;
                } else {
                  booking.TimeLapsed = differ + "mins";
                }
                notFilledBookings.Bookings.push(booking);
              }
            }
          });
        });
        notFilledBookings.isLoading = false;
        this.bookingListTabIndex = 0;
        // setTimeout(() => {
        //   this.bookingListTabIndex = bookingTab;
        // }, 10);
        break;
      }
      case this.BOOKING_LIST_TAB.FILLED: {
        const filledBookings = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.FILLED);
        bookings.forEach(booking => {
          const existInFilled = filledBookings.Bookings.find(f => f.BookingId === booking.BookingId);
          if (!existInFilled) {
            booking.TherapistString = "";
            let thers = [];
            booking.Products.forEach(element => {
              thers.push(element.StaffName);
            });
            booking.TherapistString = thers.join(", ");
            filledBookings.Bookings.push(booking);
          }
        });
        filledBookings.isLoading = false;
        break;
      }
      case this.BOOKING_LIST_TAB.ON_GOING: {
        const ongoingBookings = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.ON_GOING);
        bookings.forEach(booking => {
          const existInOnGoing = ongoingBookings.Bookings.find(f => f.BookingId === booking.BookingId);
          if (!existInOnGoing) {
            ongoingBookings.Bookings.push(booking);
          }
        });
        ongoingBookings.isLoading = false;
        break;
      }
      case this.BOOKING_LIST_TAB.COMPLETED: {
        const completedBookings = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.COMPLETED);
        bookings.forEach(booking => {
          const existInCompleted = completedBookings.Bookings.find(f => f.BookingId === booking.BookingId);
          if (!existInCompleted) {
            completedBookings.Bookings.push(booking);
          }
        });
        completedBookings.isLoading = false;
        break;
      }
      case this.BOOKING_LIST_TAB.OTHERS: {
        const otherBookings = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.OTHERS);
        bookings.forEach(booking => {
          const existInOthers = otherBookings.Bookings.find(f => f.BookingId === booking.BookingId);
          if (!existInOthers) {
            otherBookings.Bookings.push(booking);
          }
        });
        otherBookings.isLoading = false;
        break;
      }
      default:
        break;
    }
    // this.bookingListCategories.forEach(tab => {
    //   tab.BookingsRaw = cloneDeep(tab.Bookings);
    // });
  }

  resetBookingForm() {
    this.userGuest = [];
    this.basket = [];
    this.rootUser = null;
    this.currentSelectedUser = null;
    this.bookingAddress = "";
    this.reachOutTime = 0;
    this.timings.forEach(f => f.selected = false);
    this.categoryIndex = 0;
    this.catProductIndex = 0;
    this.inSlots = false;
    this.inFinalReview = false;
    this.beforeSlots = false;
    this.basketVisible = false;
    this.selectedBookingDate = "";
    this.selectedSlot = "";
    this.bookingDrawerTitle = this.BOOKING_SUMMARY;
    this.availableTimeSlots = [];
    this.finalBasket = [];
    this.isCustomSlot = false;
    this.bookingEditMode = false;
    this.calnSelDate = null;
    this.sendPushInUpdate = false;
  }

  fillEditBooking(bookingId) {
    let curTab = this.bookingListCategories[this.bookingListTabIndex];
    const found = curTab.Bookings.find(f => f.BookingId === bookingId);
    found.isLoadingEdit = true;
    this.bookingEditMode = true;
    this.openBooking(found);
    // this.webapi.request(API.BOOKING_DETAIL, {
    //   BookingId: bookingId
    // }).subscribe(
    //   data => {
    //     this.editBookingDetail = { ...data.body.Data[0] };
    //     this.bookingEditMode = true;
    //     this.openBooking(found);
    //   },
    //   error => {
    //     found.isLoadingEdit = false;
    //     this.toast.error({
    //       title: "Error",
    //       msg: error.headers.get('message'),
    //       timeout: 3000,
    //       theme: "bootstrap"
    //     })
    //   }
    // )
  }

  setBasketForEdit() {
    this.basket = this.editBookingDetail.Products;
    this.reachOutTime = this.editBookingDetail.ReachOutTime;
    this.userGuest = [];
    let address = "";
    if (this.editBookingDetail.Floor) {
      address += this.editBookingDetail.Floor + ", ";
    }
    address += this.editBookingDetail.Street;
    if (this.editBookingDetail.HouseNumber) {
      address += ", " + this.editBookingDetail.HouseNumber;
    }
    if (this.editBookingDetail.City) {
      address += ", " + this.editBookingDetail.City;
    }
    this.editBookingDetail.Elevator === 1
      ? this.editBookingDetail.Elevator = true
      : this.editBookingDetail.Elevator = false;
    this.bookingAddress = address;
    // this.webapi.request("metadata", {
    //   Metadata: ['Center'],
    //   Source: this.centerData.Address,
    //   Destination: address
    // }).subscribe(
    //   data => {
    //     const tempData = { ...data.body.Data };
    //     this.centerData = tempData.Center[0];
    //     const reachData = tempData.ReachOutData;
    //     if (reachData.rows[0].elements[0].status !== "OK") {
    //       this.toast.error({
    //         title: "Error",
    //         msg: "Please fill valid address",
    //         theme: "bootstrap",
    //         timeout: 3000
    //       })
    //     } else {
    //       this.reachOutTime = Math.round(reachData.rows[0].elements[0].duration.value / 60);
    //     }
    //   }
    // );
    this.userGuest.push({
      Name: this.editBookingDetail.UserName,
      Street: this.editBookingDetail.Street,
      Floor: this.editBookingDetail.Floor,
      City: this.editBookingDetail.City,
      Elevator: this.editBookingDetail.Elevator,
      Therapist: this.editBookingDetail.UserTherapist,
      self: true
    })
    this.basket.forEach((product, index) => {
      product.TreatmentNum = index;
      product.Name = product.ProductName;
      product.TotalDuration = product.Duration;
      product.TotalAmount = product.Amount;
      product.AddOns = product.AddOns.filter(element => {
        if (element.ExtraAddOn && element.RequestStatus === 2) {
          return false;
        }
        return true;
      })
      product.AddOns.forEach(element => {
        element.Name = cloneDeep(element.AddOn);
        delete element.AddOn;
        product.TotalDuration += element.Duration;
        product.TotalAmount += element.Amount;
      });
      let therapist = 2;
      const stFound = this.staffList.find(f => f.StaffId === product.StaffId);
      stFound ? therapist = stFound.Gender : therapist = 2;
      product.IsAlreadyExist = true;
      const catFound = this.categoryData.find(c => c.CategoryId === product.CategoryId);
      const prFound = catFound.Products.find(p => p.ProductId === product.ProductId);
      if (!prFound) {
        product.isEditable = false;
      } else {
        product.isEditable = true;
      }

      if (!product.Myself) {
        const guestObj = {
          ...product.Guest,
          Therapist: product.Therapist
        };
        let exist = false;
        for (let userInc = 0; userInc < this.userGuest.length; userInc++) {
          const element = this.userGuest[userInc];
          if (lodash.isEqual(element, guestObj)) {
            exist = true;
            break;
          } else {
            exist = false;
          }
        }
        if (!exist) {
          this.userGuest.push(guestObj);
        }
        product.User = guestObj;
      } else {
        product.User = this.userGuest.find(f => f.self);
        product.User.Therapist = product.Therapist;
      }
    })
    this.userGuest.forEach(f => {
      f.tempId = moment().toDate().getTime() + Math.random();
    })
    this.openBasket();
  }

  editBookingAddress() {
    this.bookingAddEditMode = true;
    window.scroll(0, 0);
    this.addressForm.reset();
    setTimeout(() => {
      this.addressForm.patchValue({
        Street: this.editBookingDetail.Street,
        Floor: this.editBookingDetail.Floor,
        City: this.editBookingDetail.City,
        Elevator: this.editBookingDetail.Elevator,
        Zip: this.editBookingDetail.Zip
      })
    }, 200);
  }

  setEditBookAddr() {
    let newAddr = "";
    if (this.addressForm.controls.Street.value !== this.editBookingDetail.Street) {
      this.addressForm.controls.Floor.reset();
      this.addressForm.controls.City.reset();
    }
    if (this.addressForm.controls.Floor.value) {
      newAddr += this.addressForm.controls.Floor.value + ", ";
    }
    newAddr += this.addressForm.controls.Street.value;
    if (this.addressForm.controls.City.value) {
      newAddr += ", " + this.addressForm.controls.City.value;
    }
    if (this.bookingAddress !== newAddr) {
      this.isLoadingAddr = true;
      this.webapi.request(API.METADATA, {
        Metadata: ['Center'],
        Source: this.centerData.Address,
        Destination: newAddr
      }).subscribe(
        data => {
          this.isLoadingAddr = false;
          const tempData = { ...data.body.Data };
          this.centerData = tempData.Center[0];
          const reachData = tempData.ReachOutData;
          if (reachData.rows[0].elements[0].status !== "OK") {
            this.toast.error({
              title: "Error",
              msg: "Sorry, we are not in selected location yet.",
              theme: "bootstrap",
              timeout: 3000
            })
          } else {
            this.reachOutTime = Math.round(reachData.rows[0].elements[0].duration.value / 60);
            let distance = reachData.rows[0].elements[0].distance.value / 1609;
            if (distance > this.centerData.ServiceArea) {
              this.serviceModalVisible = true;
            } else {
              this.sendPushInUpdate = true;
              this.bookingAddress = newAddr;
              this.bookingAddEditMode = false;
              if (this.editBookingDetail.Street !== this.addressForm.controls.Street.value) {
                //empty floor and city
                this.addressForm.controls.Floor.reset();
                this.addressForm.controls.City.reset();
                this.editBookingDetail.Floor = null;
                this.editBookingDetail.City = null;
              } else {
                this.editBookingDetail.Floor = this.addressForm.controls.Floor.value;
                this.editBookingDetail.City = this.addressForm.controls.City.value;
              }
              this.editBookingDetail.Street = this.addressForm.controls.Street.value;
              this.editBookingDetail.Zip = this.addressForm.controls.Zip.value;
              this.editBookingDetail.Elevator = this.addressForm.controls.Elevator.value;
            }
          }
        },
        error => {
          this.isLoadingAddr = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            theme: "bootstrap",
            timeout: 3000
          })
        }
      );
    } else {
      this.isLoadingAddr = false;
      this.bookingAddEditMode = false;
    }
    this.editBookingDetail.Elevator = this.addressForm.controls.Elevator.value;
  }

  closeAddressModal() {
    this.bookingAddEditMode = false;
  }

  closeUserAddressEditModal() {
    this.userAddressEditMode = false;
  }

  updateBooking(forceAllot = false) {
    let amount = 0;
    let duration = 0;
    let finalProducts = [];
    let events = [];
    this.finalBasket.forEach(product => {
      amount += product.TotalAmount;
      if (!product.SameTime) {
        duration += product.TotalDuration;
      } else {
        if (this.finalBasket[0].TotalDuration < product.TotalDuration) {
          duration = product.TotalDuration;
        }
      }
      let prodObj = {
        BookingProductId: product.BookingProductId ? product.BookingProductId : null,
        ProductId: product.ProductId,
        CategoryId: product.CategoryId,
        Name: product.Name,
        Duration: product.Duration,
        Amount: product.Amount,
        AddOns: product.AddOns ? product.AddOns : [],
        Guest: product.User.self ? null : {
          Name: product.User.Name,
          Contact: product.User.Contact,
          Relation: product.User.Relation,
          Gender: product.User.Gender,
          Notes: product.User.Notes,
        },
        SameTime: product.SameTime,
        AvailableStaff: product.AvailableStaff,
        IsAlreadyExist: product.IsAlreadyExist ? product.IsAlreadyExist : false,
        PreparationTime: product.PreparationTime,
        Therapist: product.User.Therapist ? product.User.Therapist : 2,
        DispatchType: null,
        ManualStaffId: null,
        ManualStaffEmail: null,
        StartTime: product.StartTime
      }
      if (product.EventId) {
        events.push(product.EventId);
      }
      if (product.StaffAssignmentType === this.STAFF_ASSIGNMENT_TYPE.Assign) {
        prodObj.DispatchType = this.PRODUCT_DISPATCH_TYPE.DIRECT_ASSIGNMENT
        // prodObj.AvailableStaff = product.AvailableStaff;
      } else if (product.StaffAssignmentType === this.STAFF_ASSIGNMENT_TYPE.Dispatch) {
        if (product.AutoDispatch) {
          prodObj.DispatchType = this.PRODUCT_DISPATCH_TYPE.AUTOMATIC_DISPATCH;
          // prodObj.AvailableStaff = product.AvailableStaff;
        } else {
          prodObj.DispatchType = this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH;
          // let selStaff = product.Staff.find(f => f.ManualDispatchStaffSelected);
          // prodObj.ManualStaffId = selStaff.StaffId;
          // prodObj.ManualStaffEmail = selStaff.GoogleEmail;
        }
      }
      finalProducts.push(prodObj)
    })
    if (amount !== this.editBookingDetail.Amount) {
      this.sendPushInUpdate = true;
    }
    let bookingObj = {
      BookingId: this.editBookingDetail.BookingId,
      Name: this.editBookingDetail.UserName,
      Street: this.editBookingDetail.Street,
      Floor: this.editBookingDetail.Floor,
      City: this.editBookingDetail.City,
      Zip: this.editBookingDetail.Zip,
      Elevator: this.editBookingDetail.Elevator ? 1 : 0,
      ReachOutTime: this.reachOutTime,
      DateTime: moment(this.selectedBookingDate + " " + this.selectedSlot, "ddd DD/MM/YY HH:mm").utc().format(),
      Amount: amount,
      Products: finalProducts,
      PaidPrice: amount,
      ForceStaffAllot: false,
      IsPushNotification: this.sendPushInUpdate,
      Events: events,
      IsNewBooking: false
    }
    if (forceAllot) {
      bookingObj.ForceStaffAllot = true;
    } else {
      for (let prInc = 0; prInc < this.finalBasket.length; prInc++) {
        const element = this.finalBasket[prInc];
        if (!element.selStaffAvailable) {
          bookingObj.ForceStaffAllot = true;
          break;
        }
      }
    }
    if (this.bookingConfirmModalVisible) {
      this.bookingConfirmModalVisible = false;
    }

    bookingObj.IsNewBooking = this.checkNewBookingReq(bookingObj);
    this.spinner.show();
    this.webapi.request(API.UPDATE_BOOKING_CMS, bookingObj)
      .subscribe(
        data => {
          // this.bookingListCategories.forEach(element => {
          //   element.Bookings = [];
          //   element.BookingsRaw = [];
          // });
          // this.bookingData = [...data.body.Data];
          // // this.setConstraints();
          // this.bookingDataRaw = cloneDeep(this.bookingData);
          // this.setStatusFilter();
          this.spinner.hide();
          this.loadBookingList();
          this.closeBooking(true);
        },
        error => {
          this.spinner.hide();
          if (error.status === 410) {
            // open booking staff allotment confirmation model
            this.bookingConfirmModalVisible = true;
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

  checkNewBookingReq(bookingObj: any): boolean {
    let isNewBooking = false;
    console.log(this.editBookingDetail);
    console.log(bookingObj);
    if (this.editBookingDetail.Products.length !== bookingObj.Products.length) {
      isNewBooking = true;
      return;
    }
    for (let prInc = 0; prInc < bookingObj.Products.length; prInc++) {
      const product = bookingObj.Products[prInc];
      if (!product.BookingProductId) {
        isNewBooking = true;
        break;
      }
      let prodFound = this.editBookingDetail.Products.find(p => p.BookingProductId === product.BookingProductId);
      if (!prodFound) {
        isNewBooking = true;
        break;
      }
      if (prodFound.Duration !== product.Duration) {
        isNewBooking = true;
        break;
      }
      if (prodFound.Amount !== product.Amount) {
        isNewBooking = true;
        break;
      }
      if (prodFound.AddOns.length !== product.AddOns.length) {
        isNewBooking = true;
        break;
      }
      let addOnInValid = false;
      for (let addInc = 0; addInc < product.AddOns.length; addInc++) {
        const addOn = product.AddOns[addInc];
        if (!addOn.BookingProductAddOnId) {
          addOnInValid = true;
          break;
        }
        let addOnFound = prodFound.AddOns.find(ad => ad.BookingProductAddOnId === addOn.BookingProductAddOnId);
        if (!addOnFound) {
          addOnInValid = true;
        }
        if (addOnFound.Duration !== addOn.Duration) {
          addOnInValid = true;
        }
        if (addOnFound.Amount !== addOn.Amount) {
          addOnInValid = true;
        }
      }
      if (addOnInValid) {
        isNewBooking = true;
        break;
      }
    }
    return isNewBooking;
  }

  checkStaff(staffId, product) {
    if (this.isCustomSlot) {
      if (typeof product !== 'undefined') {
        delete product.selStaffAvailable;
      }
      let checkObj = {
        StaffId: staffId,
        StartTime: null,
        Duration: 0
      }
      console.log(product)
      checkObj.StartTime = momentz.tz(this.selectedBookingDate + " " + this.selectedSlot, "ddd DD/MM/YY HH:mm", environment.STAFF_ZONE);
      if (product.TreatmentNum > 0) {
        if (!product.SameTime) {
          checkObj.StartTime.add(this.finalBasket[0].TotalDuration, "minute");
        } else {
          if (this.finalBasket[0].selectedStaffId === staffId) {
            product.selStaffAvailable = false;
            return;
          }
        }
      }
      let reachOutTime = this.reachOutTime;
      let reminder = reachOutTime % 5;
      if (reminder > 0) {
        let toAdd = 5 - reminder;
        reachOutTime += toAdd;
      }
      checkObj.StartTime.subtract(product.PreparationTime + reachOutTime, "minute")
      checkObj.StartTime = checkObj.StartTime.utc().format();
      checkObj.Duration += product.TotalDuration + reachOutTime;
      this.isStaffChecking = true;
      this.webapi.request(API.CHECK_STAFF_AVAILABILITY, checkObj)
        .subscribe(
          data => {
            this.isStaffChecking = false;
            const isAvailable = { ...data.body.Data };
            product.selStaffAvailable = isAvailable.IsAvailable;
            let existProduct = this.finalBasket.find(f => f.TreatmentNum === product.TreatmentNum);
            let staffExist = product.Staff.find(f => f.StaffId === staffId);
            existProduct.AvailableStaff.unshift(staffExist);
          },
          error => {
            this.isStaffChecking = false;
            this.toast.error({
              title: "Error",
              msg: error.headers.get('message'),
              timeout: 3000,
              theme: "bootstrap"
            })
          }
        )
    }
  }

  changeBookingStaff() {
    this.editBooking();
    this.closeBookingConfirmModal();
  }

  closeBookingConfirmModal() {
    this.bookingConfirmModalVisible = false;
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

  cancelCurrentAddress() {
    this.userForm.controls.Street.setValue(null);
    this.userForm.controls.Zip.setValue(null);
    if (this.bookingEditMode) {
      this.addressForm.controls.Street.setValue(null);
      this.addressForm.controls.Zip.setValue(null);
    }
    this.serviceModalVisible = false;
    if (this.appUserDetail) {
      this.userAddressEditMode = true;
    }
  }

  continueAppUserAddr() {
    this.serviceModalVisible = false;
    this.setAppUser();
  }

  continueAddress() {
    this.serviceModalVisible = false;
    if (!this.bookingEditMode) {
      this.userGuest.push(this.rootUser);
      this.closeUserModal();
      let category = this.categoryData[this.categoryIndex];
      let product = category.Products[this.catProductIndex];
      this.selectGuest(category.CategoryId, product.ProductId, this.rootUser);
    } else {
      this.sendPushInUpdate = true;
      this.bookingAddress = this.addressForm.controls.Street.value;
      this.bookingAddEditMode = false;
      this.editBookingDetail.Floor = null; //this.addressForm.controls.Floor.value;
      this.editBookingDetail.Street = this.addressForm.controls.Street.value;
      this.editBookingDetail.City = null; //this.addressForm.controls.City.value;
      this.editBookingDetail.Zip = this.addressForm.controls.Zip.value;
    }
  }

  chatWithUser(userId) {
    this.router.navigate(['/support'], {
      state: {
        userId
      }
    })
  }

  cancelBooking(bookingId) {
    this.loadingFlag = true;
    this.isSpinning = true;
    let selTab = this.bookingListCategories.find(f => f.BookingTab === this.bookingListTabIndex);
    selTab.isLoading = true;
    let reasonObj=this.cancelBookingForm.value
    console.log(reasonObj)
    // return;
    this.webapi.request(API.CANCEL_BOOKING, {
      BookingId: bookingId,
      ...reasonObj
    })
      .subscribe(
        data => {
          this.cancelReason = false;
          this.cancelBookingForm.reset()
          // this.bookingListCategories.forEach(element => {
          //   element.Bookings = [];
          //   element.BookingsRaw = [];
          // });
          // this.bookingData = [...data.body.Data];
          // // this.setConstraints();
          // this.loadingFlag = false;
          // this.isSpinning = false;
          // this.bookingDataRaw = cloneDeep(this.bookingData);
          this.setStatusFilter();
          if (this.detailVisible) {
            this.openDetailView(this.bookingDetail.BookingId, true);
           
          } else {
            this.loadBookingList();
          }
         
          this.toast.success({
            title: "Success",
            msg: data.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap"
          })
         
        },
        error => {
          this.isSpinning = false;
          this.loadingFlag = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  toggleExport() {
    this.exportModalVisible = !this.exportModalVisible;
    this.exportType = "1";
    this.selExportStartDate = moment().startOf("month").toDate();
    this.selExportEndDate = moment().endOf("month").toDate();
    this.exportErrMsg = "";
    this.exportFilterIncluded = true;
  }

  changeExportStart() {
    if (
      moment(this.selExportEndDate).isBefore(moment(this.selExportStartDate))
    ) {
      this.selExportEndDate = null;
    }
  }

  disableExpEndDate = (date: Date) => {
    let startDate = moment(this.selExportStartDate);
    let selDate = moment(date);
    if (startDate.isAfter(selDate)) {
      return true;
    } else {
      return false;
    }
  }

  disableExpStartDate = (date: Date) => {
    let endDate = moment(this.selExportEndDate);
    let selDate = moment(date);
    if (selDate.isAfter(endDate)) {
      return true;
    } else {
      return false;
    }
  }

  exportBooking() {
    let obj = {
      Type: null,
      StartDate: null,
      EndDate: null,
      Filters: [],
      BookingId: []
    }
    if (this.exportType === "0") {
      obj.Type = 0;
      let start = moment(this.selExportStartDate);
      let end = moment(this.selExportEndDate);
      if (start.isAfter(end)) {
        this.toast.error({
          title: "End date can't be less then start date.",
          msg: "",
          timeout: 3000,
          theme: "bootstrap"
        });
        this.isExporting = false;
        return;
      }
      obj.StartDate = start.format("MM/DD/YYYY");
      obj.EndDate = end.format("MM/DD/YYYY");
      if (this.exportFilterIncluded) {
        obj.Filters = this.selectedFilters;
      }
    } else {
      obj.Type = 1;
      let start = (this.bookingTablePageIndex - 1) * this.pageSize;
      let end = this.bookingTablePageIndex * this.pageSize;
      for (let bInc = start; bInc < end; bInc++) {
        const booking = this.bookingData[bInc];
        if (booking) {
          obj.BookingId.push(booking.BookingId);
        }
      }
    }
    this.isExporting = true;
    this.webapi.request(API.EXPORT_BOOKING, obj)
      .subscribe(
        data => {
          let response = { ...data.body.Data };
          let byteCharacters = atob(response.File); //data.file there
          let byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            let slice = byteCharacters.slice(offset, offset + 512);

            let byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
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

  toggleAdminNotes(editMode = false) {
    this.showAdminNotesTextBox = !this.showAdminNotesTextBox;
    if (editMode) {
      this.adminNotes = this.bookingDetail.AdminNotes;
    }
  }

  updateAdminNotes() {
    this.savingAdminNotes = true;
    let obj = {
      BookingId: this.bookingDetail.BookingId,
      AdminNotes: this.adminNotes
    }
    this.webapi.request(API.UPDATE_BOOKING_EXTRA, obj)
      .subscribe(
        data => {
          this.bookingDetail = { ...data.body.Data };
          this.bookingDetail.SpecialRequestArray=[]
          this.bookingDetail.customerNotes=[]
          this.setBookingDetailData();
          this.savingAdminNotes = false;
          this.adminNotes = null;
          this.showAdminNotesTextBox = false;
        },
        error => {
          this.savingAdminNotes = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  generateDispatchString(): void {
    let dispatchString = "";
    if (this.globalDispatchSettings.globalDispatchSettings[0].GlobalDispatchDefault === 0) {
      // automatic dispatch
      dispatchString += "Automatic dispatch";
      if (this.globalDispatchSettings.globalDispatchSettings[0].IsFilterApplied === 1) {
        dispatchString += " (applied filters)"
      } else {
        dispatchString += " (filters not applied)"
      }
      if (this.globalDispatchSettings.globalDispatchSettings[0].InstantConfirmation === 0) {
        dispatchString += " with Instant Confirmation.";
      } else {
        dispatchString += " without Instant Confirmation.";
      }
    } else {
      dispatchString += "Manual dispatch"
    }
    this.globalDispatchString = dispatchString;
  }

  openGlobalSettingsModal(): void {
    this.showGlobalDispatchSettingsModal = true;
    this.globalDispatchForm.reset();
    let staffGroups = [];
    this.activeStaffGroupList = [];
    this.globalDispatchSettings.activeStaffGroups.forEach(group => {
      staffGroups.push(group.StaffGroupId);
      let groupDetail = this.staffGroupList.find(f => f.StaffGroupId === group.StaffGroupId);
      this.activeStaffGroupList.push({
        StaffGroupId: group.StaffGroupId,
        Name: groupDetail.Name,
        Priority: group.Priority
      })
    });
    this.activeStaffGroupList.sort((a, b) => a.Priority - b.Priority);
    this.rawGlobalSettingsFormData = {
      GlobalDispatchDefault: this.globalDispatchSettings.globalDispatchSettings[0].GlobalDispatchDefault + "",
      InstantConfirmation: this.globalDispatchSettings.globalDispatchSettings[0].InstantConfirmation ? false : true,
      IsFilterApplied: this.globalDispatchSettings.globalDispatchSettings[0].IsFilterApplied ? true : false,
      IsPriorityActive: this.globalDispatchSettings.globalDispatchSettings[0].IsPriorityActive ? true : false,
      StaffGroups: staffGroups,
      Ranking: this.globalDispatchSettings.globalDispatchFilters &&
        this.globalDispatchSettings.globalDispatchFilters.find(f => f.DispatchFilterId === this.DISPATCH_FILTER_ID.RANK).IsActive
        ? true
        : false,
      Availability: this.globalDispatchSettings.globalDispatchFilters &&
        this.globalDispatchSettings.globalDispatchFilters.find(f => f.DispatchFilterId === this.DISPATCH_FILTER_ID.AVAILABILITY)
        ? true
        : false
    };
    this.globalDispatchForm.patchValue(this.rawGlobalSettingsFormData);
    this.globalDispatchForm.controls.StaffGroups.valueChanges.subscribe((val) => {
      this.activeStaffGroupList = [];
      if (val && val.length) {
        val.forEach(staffGroupId => {
          let group = this.staffGroupList.find(st => st.StaffGroupId === staffGroupId);
          this.activeStaffGroupList.push({
            StaffGroupId: staffGroupId,
            Name: group.Name
          })
        });
      }
    })
  }

  disableGDBtn(): boolean {
    let disable = false;
    if (this.globalDispatchForm.controls.IsFilterApplied.value && !this.globalDispatchForm.controls.StaffGroups.value.length) {
      disable = true;
    }
    return disable;
  }

  disableICSelection(): boolean {
    let disable = false;
    if (this.globalDispatchForm.controls.GlobalDispatchDefault.value === "1") {
      disable = true;
    }
    return disable;
  }

  disableICAuto(): boolean {
    let disable = false;
    if (
      this.globalDispatchForm.controls.InstantConfirmation.value === "1" ||
      this.globalDispatchForm.controls.GlobalDispatchDefault.value === "1"
    ) {
      disable = true;
    }
    return disable;
  }

  enableFilterSelection(): boolean {
    let enable = false;
    if (this.globalDispatchForm.controls.IsFilterApplied.value && this.globalDispatchForm.controls.IsPriorityActive.value) {
      enable = true;
    }
    return enable;
  }

  disableFilterSelection(): boolean {
    let disable = false;
    if (!this.globalDispatchForm.controls.IsFilterApplied.value || !this.globalDispatchForm.controls.IsPriorityActive.value) {
      disable = true;
    }
    return disable;
  }

  disableICFilters(): boolean {
    let disable = false;
    if (
      !this.globalDispatchForm.controls.IsFilterApplied.value ||
      this.globalDispatchForm.controls.GlobalDispatchDefault.value === "1"
    ) {
      disable = true;
    }
    return disable;
  }

  hideGlobalDispatchModal(): void {
    this.showGlobalDispatchSettingsModal = false;
  }

  saveGDform(): void {
    let dispatchDefault = parseInt(this.globalDispatchForm.controls.GlobalDispatchDefault.value);
    let filterApplied = this.globalDispatchForm.controls.IsFilterApplied.value;
    let priorityActive = this.globalDispatchForm.controls.IsPriorityActive.value;
    let icAuto = this.globalDispatchForm.controls.InstantConfirmation.value;
    let reqObj = {
      GlobalDispatchDefault: dispatchDefault,
      InstantConfirmation: !dispatchDefault && icAuto ? 0 : 1,
      IsFilterApplied: !dispatchDefault && filterApplied ? true : false,
      IsPriorityActive: !dispatchDefault && filterApplied && priorityActive ? true : false,
      DispatchFilters: [
        {
          DispatchFilterId: this.DISPATCH_FILTER_ID.GROUP,
          IsActive: !dispatchDefault && filterApplied &&
            this.globalDispatchForm.controls.StaffGroups.value.length
            ? true
            : false,
          ActiveStaffGroupsId: []
        },
        {
          DispatchFilterId: this.DISPATCH_FILTER_ID.RANK,
          IsActive: !dispatchDefault && filterApplied && this.globalDispatchForm.controls.Ranking.value ? true : false
        },
        {
          DispatchFilterId: this.DISPATCH_FILTER_ID.AVAILABILITY,
          IsActive: true
        }
      ]
    }
    !dispatchDefault && filterApplied
      ? this.activeStaffGroupList.forEach(staff => {
        reqObj.DispatchFilters[0].ActiveStaffGroupsId.push(staff.StaffGroupId);
      })
      : true;
    this.loadingGlobalDispatch = true;
    this.webapi.request(API.UPDATE_GLOBAL_DISPATCH, reqObj)
      .subscribe(
        data => {
          this.metadata.GlobalDispatchSettings = { ...data.body.Data.GlobalDispatchSettings };
          this.loadingGlobalDispatch = false;
          this.globalDispatchSettings = null;
          this.globalDispatchSettings = this.metadata.GlobalDispatchSettings;
          this.setDispatchMeta();
          this.toast.success({
            title: "",
            msg: data.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
          this.hideGlobalDispatchModal();
        },
        error => {
          this.loadingGlobalDispatch = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  reOrderGroup(event: any): void {
    moveItemInArray(this.activeStaffGroupList, event.previousIndex, event.currentIndex);
  }

  openBookingDispatchChanger(bookingId: number): void {
  console.log(this.metadata)
    this.showBookingDispatchSettingsModal = true;
    let selectedBookingTab = this.bookingListCategories.find(f => f.BookingTab === this.bookingListTabIndex);
    this.dispatchSetBookingDetail = cloneDeep(selectedBookingTab.Bookings.find(f => f.BookingId === bookingId));
    this.dispatchSetBookingDetail.Products.forEach(product => {
      let newDispatchList = [];
      product.DispatchList ? product.DispatchList.forEach(element => {
        if (element.DispatchId && element.StaffId) {
          newDispatchList.push({ ...element })
        }
      }) : true;
      newDispatchList.length ? product.DispatchList = newDispatchList : true;
      // if (!product.StaffId) {
       
        console.log(product)
      let productCat = this.metadata.Product.find(f => f.ProductId === product.ProductId);
      product.DispatchList ? product.DispatchList.forEach(staff => {
        let staffDetail = this.metadata.Staff.find(st => st.StaffId === staff.StaffId);
        staff.StaffName = staffDetail.StaffName;
        staff.Rank = staffDetail.Rank;
        staff.StaffGroupId = staffDetail.StaffGroupId;
        staff.StaffGroupName = staffDetail.StaffGroupName;
        staff.Rate = null;
        if (productCat) {
          let catRate = staffDetail.CategoryData.find(f => f.CategoryId === productCat.CategoryId);
          if (catRate && catRate.Rate) {
            staff.Rate = catRate.Rate;
          }
        }
        staff.ManualDispatchStaffSelected = staff.Status === 1 && product.DispatchType === this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH ? true : false;
        staff.IsConsideredStaff = true;
      }) : true;
      product.ManualStaffList = product.DispatchList && product.DispatchList.length ? [...product.DispatchList] : [];
      this.metadata.Staff.forEach(staff => {
        let eix = product.ManualStaffList.find(s => s.StaffId === staff.StaffId);
        if (!eix) {
          let catRate;
          if (productCat) {
            catRate = staff.CategoryData.find(f => f.CategoryId === productCat.CategoryId);
          }
          if (catRate) {
            let skillExist = catRate.Products.find(f => f.ProductId === product.ProductId);
            if (skillExist) {
              product.ManualStaffList.push({
                ...staff,
                ManualDispatchStaffSelected: false,
                IsConsideredStaff: false,
                Rate: catRate && catRate.Rate ? catRate.Rate : null
              });
            }
          }
        }
      });
      product.ManualStaffListRaw = cloneDeep(product.ManualStaffList);
      product.NewDispatchStaffId = product.StaffId ? product.StaffId : null;
      // }
    });
    this.dispatchSetBookingDetail.selectedTab = 0;
    console.log(this.dispatchSetBookingDetail);
  }

  hideBookingDispatchDrawer() {
    this.showBookingDispatchSettingsModal = false;
  }

  selectManualStaff(bookingProductId: number, staffId: number): void {
    this.dispatchSetBookingDetail.Products.forEach(product => {
      if (product.BookingProductId === bookingProductId) {
        product.ManualStaffList.forEach(staff => {
          if (staff.StaffId === staffId) {
            staff.ManualDispatchStaffSelected = true;
          } else {
            staff.ManualDispatchStaffSelected = false;
          }
        });
        product.ManualStaffListRaw.forEach(staff => {
          if (staff.StaffId === staffId) {
            staff.ManualDispatchStaffSelected = true;
          } else {
            staff.ManualDispatchStaffSelected = false;
          }
        });
      }
    });
  }

  // Sort the table according to given key.
  sortDispatchList(bookingProductId: number, sort: { key: string; value: string }): void {
    if (sort.key) {
      let selectBookingProduct = this.dispatchSetBookingDetail.Products.find(p => p.BookingProductId === bookingProductId);
      if (selectBookingProduct) {
        const data = selectBookingProduct.ManualStaffList.sort((a, b) =>
          sort.value === "ascend"
            ? a[sort.key] > b[sort.key]
              ? 1
              : -1
            : b[sort.key] > a[sort.key]
              ? 1
              : -1
        );
        selectBookingProduct.ManualStaffList = [...data];
      }
    }
  }

  filterDispatchGroup(bookingProductId: number, selectedFilter: any) {
    let selectedBookingProduct = this.dispatchSetBookingDetail.Products.find(p => p.BookingProductId === bookingProductId);
    if (selectedFilter.length) {
      selectedBookingProduct.ManualStaffList = selectedBookingProduct.ManualStaffListRaw.filter(staff => {
        let isGroupFound = false;
        if (selectedFilter.includes(staff.StaffGroupId)) {
          isGroupFound = true;
        }
        return isGroupFound;
      })
    } else {
      selectedBookingProduct.ManualStaffList = cloneDeep(selectedBookingProduct.ManualStaffListRaw);
    }
  }

  updateBookingDispatch(): void {
    let reqObj = {
      BookingId: this.dispatchSetBookingDetail.BookingId,
      Products: []
    }
    try {
      this.dispatchSetBookingDetail.Products.forEach(product => {
        // if (!product.StaffId) {
        let prodDispatchType = this.PRODUCT_DISPATCH_TYPE.DIRECT_ASSIGNMENT;
        let manualStaffId = null;
        // if (product.DispatchType !== prodDispatchType) {
        if (product.AutoDispatch) {
          prodDispatchType = this.PRODUCT_DISPATCH_TYPE.AUTOMATIC_DISPATCH;
        } else {
          prodDispatchType = this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH;
          let selectedStaff = product.ManualStaffListRaw.find(f => f.ManualDispatchStaffSelected === true);
          if (!selectedStaff) {
            this.dispatchSetBookingDetail.selectedTab = this.dispatchSetBookingDetail.Products.findIndex(f => f.BookingProductId === product.BookingProductId);
            throw new Error("Please select a staff");
          }
          manualStaffId = selectedStaff.StaffId;
        }
        // }
        reqObj.Products.push({
          BookingProductId: product.BookingProductId,
          DispatchType: prodDispatchType,
          ManualStaffId: manualStaffId
        })
        // }
      });
    } catch (error) {
      let element = document.getElementById("mnStaffSelErr");
      element.style.display = "inline";
      setTimeout(() => {
        element.style.display = "none";
      }, 3000);
      return;
    }
    console.log(reqObj);
    this.spinner.show();
    this.webapi.request(API.UPDATE_BOOKING_DISPATCH, reqObj)
      .subscribe(
        data => {
          // this.bookingData = [];
          // this.bookingDataRaw = [];
          // this.bookingListCategories.forEach(listgroup => {
          //   listgroup.Bookings = [];
          // });
          // this.bookingData = [...data.body.Data];
          // // this.setConstraints();
          // this.bookingListTabIndex = 1000;
          // setTimeout(() => {
          //   this.bookingListTabIndex = 0;
          // }, 10);
          this.spinner.hide();
          this.loadBookingList();
          this.hideBookingDispatchDrawer();
          // this.bookingDataRaw = cloneDeep(this.bookingData);
          this.toast.success({
            title: "",
            msg: data.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
          this.dispatchSetBookingDetail = null;
        },
        error => {
          this.spinner.hide();
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  getStaffName(staffId): string {
    let staff = this.metadata.Staff.find(st => st.StaffId === staffId);
    return staff && staff.StaffName ? staff.StaffName : "";
  }

  selectBooProManualStaff(pIndex, staffId) {
    let product = this.finalBasket[pIndex]
    product.ManualStaffList.forEach(staff => {
      if (staff.StaffId === staffId) {
        staff.ManualDispatchStaffSelected = true;
      } else {
        staff.ManualDispatchStaffSelected = false;
      }
    });
    product.Staff.forEach(staff => {
      if (staff.StaffId === staffId) {
        staff.ManualDispatchStaffSelected = true;
      } else {
        staff.ManualDispatchStaffSelected = false;
      }
    });
  }

  // Sort the table according to given key.
  sortBooProDispatchList(pIndex: number, sort: { key: string; value: string }): void {
    if (sort.key) {
      let selectBookingProduct = this.finalBasket[pIndex];
      if (selectBookingProduct) {
        const sortData = selectBookingProduct.ManualStaffList.sort((a, b) =>
          sort.value === "ascend"
            ? a[sort.key] > b[sort.key]
              ? 1
              : -1
            : b[sort.key] > a[sort.key]
              ? 1
              : -1
        );
        selectBookingProduct.ManualStaffList = [...sortData];
      }
    }
  }

  filterBooProDispatchGroup(pIndex: number, selectedFilter: any) {
    let selectedBookingProduct = this.finalBasket[pIndex];
    if (selectedFilter.length) {
      selectedBookingProduct.ManualStaffList = selectedBookingProduct.Staff.filter(staff => {
        let isGroupFound = false;
        if (selectedFilter.includes(staff.StaffGroupId)) {
          isGroupFound = true;
        }
        return isGroupFound;
      })
    } else {
      selectedBookingProduct.ManualStaffList = cloneDeep(selectedBookingProduct.Staff);
    }
  }

  getRowTitle(rate: any): string {
    if (!rate) {
      return "Rate not available.";
    }
    return ""
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
changeDateFilter(selectedFilter) {
  this.closeDropdown=true;
  let currentTab = this.bookingListCategories[this.bookingListTabIndex];
  currentTab.dateRangeCalled=selectedFilter
  // Check if filter is same as previous.
  let filterExist = currentTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_DATE);
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
    let bookingDateFilterExist = currentTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_DATE);
    if (bookingDateFilterExist) {
      currentTab.activeFilters = currentTab.activeFilters.filter(f => f.key !== this.BOOKING_LIST_FILTER.BOOKING_DATE);
    }
  } else {
    // filter have some value
    let bookingDateFilterExist = currentTab.activeFilters.find(f => f.key === this.BOOKING_LIST_FILTER.BOOKING_DATE);
    if (!bookingDateFilterExist) {
      currentTab.activeFilters.push({
        key: this.BOOKING_LIST_FILTER.BOOKING_DATE,
        values: selectedFilter
      });
    } else {
      bookingDateFilterExist.values = selectedFilter
    }
  }
  currentTab.pagination.curPage = 1;
  currentTab.pagination.itemCount = 0;
  if(this.selectedOrganisation){
    this.getBookingList({
      bookingTab: currentTab.BookingTab,
      sort: currentTab.sort,
      filters: currentTab.activeFilters,
      pagination: currentTab.pagination,
      OrganisationLocationId:this.selectedOrganisation,
      FromAdmin:1
    })
   }else{
    this.getBookingList({
      bookingTab: currentTab.BookingTab,
      sort: currentTab.sort,
      filters: currentTab.activeFilters,
      pagination: currentTab.pagination
    })
   }
  
 


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


resetDate(currentTab){
  currentTab.dateRange=[];
  currentTab.dateRangeCalled=[];
  this.closeDropdown=true;
}

getTreatments() {
    
  this.webapi.request(API.GET_TREATMENTS, null)
    .subscribe(
      data => {
       
        this.treatmentDetail = [...data.body.Data];
        console.log(this.treatmentDetail)
        this.treatmentDetail.forEach((element,index) => {
          let text=element.CategoryName.charAt(0).toUpperCase();
          this.treatmentDetail[index].Text=text
        });
      },
      error => {
        
        console.log(error)
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )
}
getCMSTimeSlots(){
  this.TimeSlotInterval
  let config = {
    slotInterval: this.TimeSlotInterval,
    openTime: '00:00',
    closeTime: '23:59'
};

// Format the time
let startTime = moment(config.openTime, "HH:mm");

//Format the end time and the next day to it 
let endTime = moment(config.closeTime, "HH:mm")

//Times
var allTimes = [];

//Loop over the times - only pushes time with 30 minutes interval
console.log(startTime)
console.log(endTime)
while (startTime < endTime) {
    //Push times
    allTimes.push(startTime.format("HH:mm")); 
    //Add interval of 'slotInterval' minutes
    startTime.add(config.slotInterval, 'minutes');
}
this.timeSlots=allTimes;
}

getOrganisationList(){
  this.calendarService.getOrganisationList(true).then(results => {

    let organisationList = this.calendarService.organisationList
    this.orgFilterList=[...organisationList]
    
    this.sortOrganisationList()
    console.log(this.orgFilterList)
  });
}

sortOrganisationList(): void {
  // this.orgFilterList.sort((a, b) => {
  //   if ( a.Name.toLowerCase() < b.Name.toLowerCase() ){
  //     return -1;
  //   }
  //   if ( a.Name.toLowerCase() > b.Name.toLowerCase() ){
  //     return 1;
  //   }
  //   return 0;
  // });
  this.orgFilterList.sort((a, b) => {
    if (a.OrganisationLocationId === -1 ) {
      return -1; // Keep the object with the 'keepOnTop' name at the beginning
    } else if (b.OrganisationLocationId === -1) {
      return 1; // Move the 'keepOnTop' object to the beginning
    } else {
      return a.Name.localeCompare(b.Name); // Sort the remaining objects by name
    }
  });
}

changeOrganisation(selectedOrg) {
  let currentTab = this.bookingListCategories[this.bookingListTabIndex];
  // Check if filter is same as previous.
  currentTab.pagination.curPage = 1;
  currentTab.pagination.itemCount = 0;
 if(selectedOrg){
  this.getBookingList({
    bookingTab: currentTab.BookingTab,
    sort: currentTab.sort,
    filters: currentTab.activeFilters,
    pagination: currentTab.pagination,
    OrganisationLocationId:selectedOrg,
    FromAdmin:1
  })
 }else{
  this.getBookingList({
    bookingTab: currentTab.BookingTab,
    sort: currentTab.sort,
    filters: currentTab.activeFilters,
    pagination: currentTab.pagination
  })
 }



 


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

clearSelectedOrg(i){
this.selectedOrganisation=null
let currentTab = this.bookingListCategories[this.bookingListTabIndex];
  // Check if filter is same as previous.
  currentTab.pagination.curPage = 1;
  currentTab.pagination.itemCount = 0;

  this.getBookingList({
    bookingTab: currentTab.BookingTab,
    sort: currentTab.sort,
    filters: currentTab.activeFilters,
    pagination: currentTab.pagination
  })
 

}
onBackButtonPressed() {
  
  this.router.navigate(['/calendar/'], {
    state: {
      selectedDate:this.onBacksendDate,
    } 
  }).then(value=>{
    
    return;
  })
  
  
}
stopViewDetail(event) {
  event.stopPropagation()
}

hideCancelReasonModal() {
  this.cancelBookingForm.reset()
  this.cancelReason = false;
}
showCancelReasonModal(bookingId) {
  this.cancelBookingForm.reset()
  this.cancelReason = true;
  this.bookingToCancel = bookingId;
}
copyText(text) {
  navigator.clipboard.writeText(text).catch(() => {
    console.error("Unable to copy text");
  });
}

  // Remove these function - for development only
  // printCat() {
  //   console.log(this.categoryData)
  // }

  // filluser() {
  //   this.getReachOutTime("5HS Elandsstraat  amsterdam-centrum");
  //   this.bookingAddress = "5HS Elandsstraat  amsterdam-centrum";
  //   this.userGuest.push({
  //     Name: "Shubham Sharma",
  //     Email: "shubham@isol.com",
  //     Street: "5HS Elandsstraat  amsterdam-centrum",
  //     Therapist: 0,
  //     self: true,
  //     tempId: moment().toDate().getTime()
  //   })
  // }
}