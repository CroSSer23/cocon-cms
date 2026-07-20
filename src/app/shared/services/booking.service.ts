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
export class BookingService {
    DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    bookingProviders = [
        {
            text: "Cocon App",
            value: 0,
            byDefault: false
        },
        {
            text: "Cocon CMS",
            value: 1,
            byDefault: false
        },
        {
            text: "Conflicts",
            value: 2,
            byDefault: false
        }
    ];
    bookingListCategories = [
        {
            BookingCategoryId: 1,
            Name: "Not filled/Partially filled",
            Bookings: [],
            BookingsRaw: [],
            BookingTab: 0,
            pagesData: [],
            isLoading: true,
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
            bookingProviders: this.bookingProviders,
            tableId: "unfilledBookingTable",
            dateRange:[],
            dateRangeCalled:[],
            showDropDown:false
        },
        {
            BookingCategoryId: 2,
            Name: "Filled",
            Bookings: [],
            BookingsRaw: [],
            BookingTab: 1,
            pagesData: [],
            isLoading: true,
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
            bookingProviders: this.bookingProviders,
            tableId: "filledBookingTable",
            dateRange:[],
            showDropDown:false,
            dateRangeCalled:[],
        },
        {
            BookingCategoryId: 3,
            Name: "On Going",
            Bookings: [],
            BookingsRaw: [],
            BookingTab: 2,
            pagesData: [],
            isLoading: true,
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
            bookingProviders: this.bookingProviders,
            tableId: "onGoingBookingTable",
            dateRange:[],
            showDropDown:false,
            dateRangeCalled:[]
        },
        {
            BookingCategoryId: 4,
            Name: "Completed",
            Bookings: [],
            BookingsRaw: [],
            BookingTab: 3,
            pagesData: [],
            isLoading: true,
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
            bookingProviders: this.bookingProviders,
            tableId: "completedBookingTable",
            dateRange:[],
            showDropDown:false,
            dateRangeCalled:[]
        },
        {
            BookingCategoryId: 5,
            Name: "Others",
            Bookings: [],
            BookingsRaw: [],
            BookingTab: 4,
            pagesData: [],
            isLoading: true,
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
            bookingProviders: this.bookingProviders,
            tableId: "otherBookingTable",
            dateRange:[],
            showDropDown:false,
            dateRangeCalled:[]
        },
        {
            BookingCategoryId: 6,
            Name: "Drafts",
            Bookings: [],
            BookingsRaw: [],
            BookingTab: 5,
            pagesData: [],
            isLoading: true,
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
            bookingProviders: this.bookingProviders,
            tableId: "draftBookingTable",
            dateRange:[],
            showDropDown:false,
            dateRangeCalled:[]
        },
        {
            BookingCategoryId: 7,
            Name: "All",
            Bookings: [],
            BookingsRaw: [],
            BookingTab: 6,
            pagesData: [],
            isLoading: true,
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
            bookingProviders: this.bookingProviders,
            tableId: "allBookingTable",
            dateRange:[],
            showDropDown:false,
            dateRangeCalled:[]
        }
    ];
    userForm = this.fb.group({
        Name: [null, [Validators.required]],
        Email: [null, [Validators.required, CustomValidators.email]],
        Contact: [null, [Validators.required]],
        Gender: [null, [Validators.required]],
        Street: [null, [Validators.required]],
        Floor: [null],
        City: [null],
        Zip: [null, [Validators.required]],
        Elevator: [null],
        Therapist: [null, [Validators.required]],
        PreferredLanguage: [null, [Validators.required]],
        ClientSource: [null, [Validators.required]],
        DOB: [null, [Validators.required]],
       
    });
    addressForm = this.fb.group({
        Street: [null, [Validators.required]],
        Floor: [null],
        City: [null],
        Zip: [null],
        Elevator: [null]
    });
    guestForm = this.fb.group({
        Name: [null, [Validators.required]],
        Gender: [null],
        Contact: [null, [Validators.required]],
        Therapist: [null, [Validators.required]],
        Notes: [null]
    });
    globalDispatchForm = this.fb.group({
        GlobalDispatchDefault: [null, [Validators.required]],
        InstantConfirmation: [null, [Validators.required]],
        IsFilterApplied: [null, [Validators.required]],
        IsPriorityActive: [null, [Validators.required]],
        StaffGroups: [null],
        Ranking: [null],
        Availability: [null]
    });
    prefTherList = [
        {
            pref: 0,
            Name: "Male"
        },
        {
            pref: 1,
            Name: "Female"
        },
        {
            pref: 2,
            Name: "Either"
        }
    ];
    genderList = [
        {
            Id: 0,
            Name: "Male",
        },
        {
            Id: 1,
            Name: "Female",
        }
    ];
    timings = [
        {
            Name: "Back to Back",
            Value: 0,
            selected: false
        },
        {
            Name: "Same Time",
            Value: 1,
            selected: false
        }
    ];
    language = [
        {
            Id: 0,
            Name: "English",
        },
        {
            Id: 1,
            Name: "Dutch",
        }
    ];
    clientSource = [
        {
            Id: 0,
            Name: "Walk-In",
        },
        {
            Id: 1,
            Name: "Client Referral",
        },
        {
            Id: 2,
            Name: "Website/Booking Form",
        },
        {
            Id: 3,
            Name: "APP",
        },
        {
            Id: 4,
            Name: "VIP",
        },
        {
            Id: 5,
            Name: "SM: Instagram/FB",
        }
    ];
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
    

    public THERAPIST_PREFERENCE = {
        MALE: 0,
        FEMALE: 1,
        EITHER: 2
    }
    public BOOKING_STATUS = {
        NEW: 0,
        COMPLETED: 1,
        CANCELLED: 2,
        ON_GOING: 3,
        CONFIRMED: 4,
        LAPSED: 5,
        UPDATED_TO_NEW: 6,
        CANCELLED_MANUALLY: 7,
        INCONCLUSIVE: 8
    }
    public PRODUCT_DISPATCH_TYPE = {
        DIRECT_ASSIGNMENT: 0,
        AUTOMATIC_DISPATCH: 1,
        MANUAL_DISPATCH: 2,
    }
    public BOOKING_LIST_TAB = {
        UNFILLED: 0,
        FILLED: 1,
        ON_GOING: 2,
        COMPLETED: 3,
        OTHERS: 4,
        DRAFT:5,
        ALL:6
    }

    constructor(
        private webService: WebService,
        private tableService: TableService,
        private fb: FormBuilder
    ) { }

    private bookingCatsActived = new BehaviorSubject<any>(this.bookingListCategories);
    bookingListChanges: Observable<any> = this.bookingCatsActived.asObservable();

    getBookingListCategories() {
        return this.bookingListCategories;
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
            // booking.address = (booking.Floor ? booking.Floor + ", " : "") + booking.Street + (booking.HouseNumber ? ", " + booking.HouseNumber : "")+(booking.City ? ", " + booking.City : "") + (booking.Zip ? ", " + booking.Zip : "");
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
            if(booking.Products.length===0){
                productToShow='-'
            }else{
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
            let foundReason = this.cancelReasonList.find(f => f.Value === booking.CancelBookingReason);
            if(foundReason){
                booking.CancelBookingReasonString=foundReason.Label
            }else{
                booking.CancelBookingReasonString=null
            }
            booking.createdString = momentz.tz(booking.Created, environment.STAFF_ZONE).format("ddd, MMM DD YYYY, HH:mm z");
            booking.statusToShow=null
            switch (booking.Status) {
                case this.BOOKING_STATUS.COMPLETED:
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
                   if(booking.Status!=this.BOOKING_STATUS.CONFIRMED){
                    booking.statusToShow = "Confirmed";
                   }else{
                    booking.statusToShow = null;
                   }
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
                  console.log
                  break;
                case this.BOOKING_STATUS.CANCELLED_MANUALLY:
                case this.BOOKING_STATUS.CANCELLED:
                  booking.statusToShow = "Cancelled";
                  booking.style = {
                    background: '#f78787 !important'
                  };
                  break
              }
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
            case this.BOOKING_LIST_TAB.DRAFT: {
                const draftBookings = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.DRAFT);
                bookings.forEach(booking => {
                    const existInCompleted = draftBookings.Bookings.find(f => f.BookingId === booking.BookingId);
                    if (!existInCompleted) {
                        draftBookings.Bookings.push(booking);
                    }
                });
                draftBookings.isLoading = false;
                break;
            }
            case this.BOOKING_LIST_TAB.ALL: {
                const allBookings = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.ALL);
                console.log("all?")
                bookings.forEach(booking => {
                    
                    const existInCompleted = allBookings.Bookings.find(f => f.BookingId === booking.BookingId);
                    if (!existInCompleted) {
                        booking.TherapistString = "";
                            let thers = [];
                            booking.Products.forEach(element => {
                                thers.push(element.StaffName);
                            });
                            booking.TherapistString = thers.join(", ");
                        allBookings.Bookings.push(booking);
                    }
                });
                allBookings.isLoading = false;
                
                console.log("all?")
                break;
            }
            default:
                break;
        }
        
        
        console.log("bookings",bookings)
    }

    updatePagesData(data, bookingTab) {
        console.log("data",data)
        console.log(data)
        let selectedTab = this.bookingListCategories.find(f => f.BookingTab === bookingTab);
        console.log("selectedTab",selectedTab)
        selectedTab.pagination.curPage = data.body.Pagination.Number;
        selectedTab.pagination.size = data.body.Pagination.Size;
        selectedTab.pagination.itemCount = data.body.TotalItems;
        selectedTab.Bookings = [];
        this.setConstraints({
            bookings: [...data.body.Data],
            bookingTab,
        });
        let pageExist = selectedTab.pagesData.find(f => f.pageNum === selectedTab.pagination.curPage);
        if (pageExist) {
            selectedTab.Bookings = this.tableService.setPageData(selectedTab.Bookings, pageExist.data, data.body.CurrentIds, "BookingId");
            pageExist.data = cloneDeep(selectedTab.Bookings);
            pageExist.lastUpdated = data.body.LastUpdated;
        } else {
            selectedTab.pagesData.push({
                pageNum: selectedTab.pagination.curPage,
                data: cloneDeep(selectedTab.Bookings),
                lastUpdated: data.body.LastUpdated
            })
        }
        this.bookingCatsActived.next(selectedTab);
    }

    setInitialBookingData() {
        let selTab = this.bookingListCategories.find(f => f.BookingTab === this.BOOKING_LIST_TAB.UNFILLED);
        selTab.isLoading = true;
        let pageExist = selTab.pagesData.find(f => f.pageNum === 1);
        let curExistIds = [];
        let lastUpdated = null;
        if (pageExist) {
            curExistIds = pageExist.data.map(f => f.BookingId);
            lastUpdated = pageExist.lastUpdated;
        } else {
            selTab.pagesData.push({
                pageNum: 1,
                data: [],
                lastUpdated: null
            })
        }
        this.webService.request(API.BOOKING, {
            BookingTab: selTab.BookingTab,
            Search: "",
            Sort: {
                Key: null,
                Value: null
            },
            Filters: [],
            Pagination: {
                Number: 1,
                Size: this.DEFAULT_PAGE_SIZE
            },
            CurrentIds: curExistIds,
            LastUpdated: lastUpdated
        }).subscribe(
            data => {
                this.updatePagesData(data, selTab.BookingTab);
            },
            error => {
                console.warn(error);
            }
        )
    }

    bookingProvidersList() {
        return this.bookingProviders;
    }

    getUserForm() {
        return this.userForm;
    }

    getAddressForm() {
        return this.addressForm;
    }

    getGuestForm() {
        return this.guestForm;
    }

    getGlobalDispatchForm() {
        return this.globalDispatchForm;
    }

    getPrefTherList() {
        return this.prefTherList;
    }

    getGenderList() {
        return this.genderList;
    }

    getTimings() {
        return this.timings;
    }
    getPrefLanguage() {
        return this.language;
    }
    getClientSource() {
        return this.clientSource;
    }
}