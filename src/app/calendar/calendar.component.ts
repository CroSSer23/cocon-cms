import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, ElementRef, NgZone, OnInit, ViewChild, ViewEncapsulation,HostListener } from '@angular/core';
import * as moment from 'moment';
import * as momentz from "moment-timezone";
import { ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import { WebService } from '../shared/services/web.service';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScheduleService } from '../shared/services/schedule.service';
import { CookieService } from "ngx-cookie-service";

import {
  // faSpa,
  // faMarsAndVenus,
  // faStar,
  // faCalendarAlt,
  // faUser,
  // faMoneyCheckDollar,
  // faRectangleXmark,
  // faFile,
  faMapLocationDot,
  faLocationDot,
  // faPersonBiking,
  faStickyNote,
  faMars,
  faVenus,
  faMapMarker,
  faCommentAlt

} from '@fortawesome/free-solid-svg-icons';
// import { CalendarOptions } from '@fullcalendar/angular';
import * as cloneDeep from "lodash/cloneDeep";
import { Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray,transferArrayItem } from '@angular/cdk/drag-drop';
import { API } from '../shared/enums/apiNames.enum';
import { Console, group } from 'console';
import { CustomValidators } from 'ng2-validation';
import { element } from 'protractor';
import { BookingService } from '../shared/services/booking.service';
import { NewBookingComponent } from '../new-booking/new-booking.component';
import { CalendarService } from '../shared/services/calendar.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],

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
    ])
  ],
  host: {
    '(window:resize)': 'onResize($event)'
  }
})
export class CalendarComponent implements OnInit {
  metadata: any;
  public screenWidth: number;  
  public screenHeight: any;  
  gridWidth= 250  
  public gridHeight: any;  
  staffViewList: { ViewId: number; Name: string; }[] = [
    {
      ViewId: 1,
      Name: "Working"
    },
    {
      ViewId: 2,
      Name: "All"
    }
  ];
  // if(this.screenWidth <= 1500) { this.gridWidth=200; }


  selStaffView: number = 0;
  selectedDate: Date = new Date();
  blockSelectedDate: Date = new Date();
  scheduleData: any[];
  isLoadingStaff: boolean = true;
  isloadingStaffFilterList: boolean = true;
  selectAllTherapistValue: boolean = true;
  staffList: any[];
  dayTime: { hourZoom: number; unitGridWidth: number, gridUnit: number, hours: string[]; } = {
    hourZoom: 2,
    unitGridWidth: this.gridWidth,
    gridUnit: this.gridWidth/4,
    hours: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
  };
  showCurrentTimeLIne: boolean = false;
  item = ["Add new block time", "Add new appointment"]
  scheduleModalVisible: boolean = false
  scheduleEditMode: boolean;
  selectedStaff: any;
  selectedSchedule: any
  FORMAT_DD_MM_YYYY: string;
  SCHEDULE_TYPE = {
    GENERAL_OFFER: {
      VALUE: 0,
      LABEL: "GeneralOffer",
      HEADING: "GENERAL OFFER"
    },
    INSTANT_CONFIRMATION: {
      VALUE: 1,
      LABEL: "InstantConfirmation",
      HEADING: "INSTANT CONFIRMATION"
    },
    BLOCKTIME: {
      VALUE: 2,
      LABEL: "BlockTime",
      HEADING: "BLOCK TIME"
    },
  }

  BOOKING_PAYMENT_STATUS = {
    INITIATED: 0,
    SUCCEEDED: 1,
    CANCELLED: 2,
    FAILED: 3,
    MANUAL: 4,
    NOT_REQUIRED: 5,
    PENDING: 6
  }
  @ViewChild("calTimeline", null) calTimeline: ElementRef<HTMLDivElement>;
  @ViewChild("calGrid", null) calGrid: ElementRef<HTMLDivElement>;
  @ViewChild("vLine", null) vLine: ElementRef<HTMLDivElement>;
  @ViewChild("vLineLabel", null) vLineLabel: ElementRef<HTMLDivElement>;
  @ViewChild("therListContainer", null) therListContainer: ElementRef<HTMLDivElement>;
  @ViewChild(NewBookingComponent, { static: true }) child: NewBookingComponent;
  HH_MM_SS = "HH:mm:ss";
  HH_MM = "HH:mm";
  tempOriginalPosEle: HTMLDivElement;
  draggingStaffRow: HTMLElement;
  currentDraggingBlock: any;
  WEEK: any;
  updateConfirmation: boolean;
  deleteConfirmation: boolean;
  confirmationModalVisible: boolean;
  isUpdMultiLoading: boolean;
  isUpdSingleLoading: boolean;
  isDelLoading: boolean;
  isDelMultiLoading: boolean;
  isDelSingleLoading: boolean;
  warningText: string;
  hour: string;
  minute: string;
  scheduleForm: FormGroup
  popVisible: boolean = false
  repeatType: { Code: number; Name: string; }[];
  blockTimeForm: FormGroup;
  
  isSchLoading: boolean;
  loadingFlag: boolean;
  currentWeek: { DayCode: string; Date: Date; DateShow: string; }[];
  calVisible: boolean;
  selectedWeekString: string;
  todaySelected: boolean;
  DEFAULT_PAGE_SIZE: any;
  singleStaffId: any;
  COLUMN_NAME_FORMAT: string;
  existScheduleDetail: any;
  TIME_FORMAT_HH_MM: string;
  dateFormat: string;
  TIME_FORMAT_HH_MM_SS: string;
  prevDayDisable: boolean = false;
  selectedTime = "00:45"
  ongoingDrag: boolean = false;
  ifDblClick: boolean = false
  draggingDuration: string;
  draggingStart: string;
  draggingEnd: string;
  showAllStaff: boolean = false;
  filterDropVisible: boolean = false;

  staffNames;
  data: string[];
  staff: { Name: string; StaffId: number; }[];
  staffGroupData: { Name: string, StaffGroupId: number, selected: boolean }[];
  staffFilterArray: { groups: number[], skills: number[], searchValue: string, isWorking: string, selectedDate: String,OrganisationLocationId:number[] }
  staffFilterArray2: { groups: number[], skills: number[], searchValue: string, isWorking: string, selectedDate: String , OrganisationLocationId:number[]}
  filteredCategories: string[];
  filteredGroups: string[];
  productData: any;
  isWorkingLabel: string
  filterStaffList: any[];
  filterStaffList2: any[];
  filterStaffList3: any[];
  autoCompleteStaffList: any[] = [];
  minuteDivision: any = 15;
  minuteArray: any[];
  selectedStaffList: number[];
  showFilterPop: boolean = false
  showCardPop: boolean = false
  showFilterPopSingle: boolean = false
  showGroupPop: boolean = false
  showSkillPop: boolean = false
  categoryList: any[];
  isSpinning: boolean = false
  newBooking: boolean = false;
  tempResizeBg: any;
  selectedTherapist: any = {};
  visibleCustomerList: boolean = false
  timeSlots: any;
  selectedTherapistId: any;
  selectedStartTime: string;
  selectedDuration: any;
  isLoadingData:boolean=false
  centerData: any;
  ongoingResize: boolean = false;
  lineLeft: number;
  SpecialRequestData: any=[];
  BookingChannelData: any;
  currentRoute: any;
  isPopAnalyticLoading: boolean;
  UserAnalyticDetail: any;
  treatmentDetail: any[];
  bookingNumber:any = 26; 
  faMars = faMars;
  faVenus = faVenus;
  faMapMarker=faMapMarker;
  faStickyNote=faStickyNote;
  faCommentAlt=faCommentAlt;
  faLocationDot = faLocationDot;
  TimeSlotInterval: any;



  calLeftSpan: any = 24;
  calRightSpan: any = 0;
  calHeaderOne = 5;
  calHeaderTwo = 10;
  calHeaderThree = 9;
  calPanelVisible: boolean = false;
  toDisplay: any = true;
  unfilledList: any []=[];
  clonedArray: any = [];
  typingTimeout: NodeJS.Timeout;
  parseFloat=parseFloat;
  myInterval: NodeJS.Timeout;
  bookingCardHeight: number;
  showOnBookingAlert: boolean;
  showOnBlockAlert: boolean;
  showNoScheduleAlert: boolean;
  DropObj: any;
  unfilledList_global: any[]=[];
  allUnfiled="1";
  targetStartTime: any;
  dragBlockTime: any;
  dragCardTime: any;
  shadowOffset: number;
  orgFilterList: any[];
  filteredOrg: any[]=[];
  receivedData: any;
  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private ngZone: NgZone,
    private fb: FormBuilder,
    private router: Router,
    private bookingService: BookingService,
    private calendarService: CalendarService,
    private cookieService: CookieService,
  ) {

    this.screenWidth = window.innerWidth;  
      if(this.screenWidth<=1500)  {this.gridWidth=200; this.gridHeight='100px';this.bookingCardHeight=94;}
      if(this.screenWidth>1500 && this.screenWidth<=1700)  {this.gridWidth=225; this.gridHeight='110px';this.bookingCardHeight=104;}
      if(this.screenWidth>1700 && this.screenWidth<=1900)  {this.gridWidth=250; this.gridHeight='115px';this.bookingCardHeight=109;}
      if(this.screenWidth>1900 && this.screenWidth<=2100)  {this.gridWidth=280; this.gridHeight='125px';this.bookingCardHeight=119;}
      if(this.screenWidth>2100 && this.screenWidth<=2300)  {this.gridWidth=310; this.gridHeight='140px';this.bookingCardHeight=134;}
      if(this.screenWidth>2300 && this.screenWidth<=2500)  {this.gridWidth=335; this.gridHeight='150px';this.bookingCardHeight=144;}
      if(this.screenWidth>2500)  {this.gridWidth=365; this.gridHeight='165px';this.bookingCardHeight=159;}
      this.dayTime.unitGridWidth=this.gridWidth;
      //console.log("ngoninit="+this.gridWidth);

    this.currentRoute = this.router.getCurrentNavigation();




    this.dayTime.gridUnit = this.gridWidth / (60 / this.minuteDivision)
    //console.log(this.dayTime.gridUnit)
    this.scheduleForm = fb.group({
      DayStartTime: [null, [Validators.required]],
      DayEndTime: [null, [Validators.required]],
      EndDate: [null],
      Repeat: [null],
      StaffId: [null, [Validators.required]],
      BlockTimeDate: [null, [Validators.required]],
      Therapist: [null],
      BlockTime: this.fb.array([])
    });


    this.repeatType = [
      {
        Code: 0,
        Name: "Don't repeat"
      },
      {
        Code: 1,
        Name: "Weekly ongoing"
      },
      {
        Code: 2,
        Name: "Specific date"
      }
    ]

    this.selectedStaffList = [];
    this.blockTimeForm = this.fb.group({
      Name: [null],
      StartTime: [null, [Validators.required]],
      EndTime: [null, [Validators.required]]
    });
    this.selStaffView = 1;
    this.dateFormat = "dd/MM/yyyy";
    this.FORMAT_DD_MM_YYYY = "DD/MM/YYYY";
    this.TIME_FORMAT_HH_MM = "HH:mm";
    this.TIME_FORMAT_HH_MM_SS = "HH:mm:ss";
    this.COLUMN_NAME_FORMAT = "ddd DD MMM";
    this.draggingStart = ""
    this.draggingEnd = ""
    this.fetchSchedule(this.selectedDate);
    this.staffList = []
    this.WEEK = [
      {
        Code: 1,
        Day: "Monday",
        DateStart: "MondayStartDate",
        DateEnd: "MondayEndDate",
        DayStart: "MondayStartTime",
        DayEnd: "MondayEndTime",
        Block: "MondayBlockTimeId"
      },
      {
        Code: 2,
        Day: "Tuesday",
        DateStart: "TuesdayStartDate",
        DateEnd: "TuesdayEndDate",
        DayStart: "TuesdayStartTime",
        DayEnd: "TuesdayEndTime",
        Block: "TuesdayBlockTimeId"
      },
      {
        Code: 3,
        Day: "Wednesday",
        DateStart: "WednesdayStartDate",
        DateEnd: "WednesdayEndDate",
        DayStart: "WednesdayStartTime",
        DayEnd: "WednesdayEndTime",
        Block: "WednesdayBlockTimeId"
      },
      {
        Code: 4,
        Day: "Thursday",
        DateStart: "ThursdayStartDate",
        DateEnd: "ThursdayEndDate",
        DayStart: "ThursdayStartTime",
        DayEnd: "ThursdayEndTime",
        Block: "ThursdayBlockTimeId"
      },
      {
        Code: 5,
        Day: "Friday",
        DateStart: "FridayStartDate",
        DateEnd: "FridayEndDate",
        DayStart: "FridayStartTime",
        DayEnd: "FridayEndTime",
        Block: "FridayBlockTimeId"
      },
      {
        Code: 6,
        Day: "Saturday",
        DateStart: "SaturdayStartDate",
        DateEnd: "SaturdayEndDate",
        DayStart: "SaturdayStartTime",
        DayEnd: "SaturdayEndTime",
        Block: "SaturdayBlockTimeId"
      },
      {
        Code: 0,
        Day: "Sunday",
        DateStart: "SundayStartDate",
        DateEnd: "SundayEndDate",
        DayStart: "SundayStartTime",
        DayEnd: "SundayEndTime",
        Block: "SundayBlockTimeId"
      },
    ];
    this.showAllStaff = true;
    this.staffFilterArray = { groups: [], skills: [], searchValue: '', isWorking: '1', selectedDate: moment(this.selectedDate).format("MM/DD/YYYY"),OrganisationLocationId:[] }
    this.staffFilterArray2 = { groups: [], skills: [], searchValue: '', isWorking: '1', selectedDate: moment(this.selectedDate).format("MM/DD/YYYY"),OrganisationLocationId:[] }

    this.filteredCategories = [];
    this.filteredGroups = [];
    this.selectedTherapist = {};
    this.selectedTherapistId = null;
    // this.selectedUser = null;
    this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
    this.getStaffFilterList(true)
    switch (this.minuteDivision) {
      case 5:
        this.minuteArray = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
        break;
      case 10:
        this.minuteArray = ['00', '10', '20', '30', '40', '50'];
        break;
      case 15:
        this.minuteArray = ['00', '15', '30', '45'];
        break;
      default:
        this.minuteArray = ['00', '15', '30', '45'];
        break;
    }
    


    // this.unfilledList = [
    //   {
    //     Date : '19 Dec 2022',
    //     Bookings: this.clonedArray
        
    //   },
    //   {
    //     Date : '20 Dec 2022',
    //     Bookings: []
    //   },
    // ]

  }

  

  ngOnInit() {

      

    if (this.currentRoute.extras.state && this.currentRoute.extras.state.toast) {
      if(this.currentRoute.extras.state.toast.title=="Warning"){
        setTimeout(() => {
          this.toast.warning({ ...this.currentRoute.extras.state.toast })
        }, 100);
      }else{
        if(this.currentRoute.extras.state.invoiceUrl){
          navigator.clipboard.writeText(this.currentRoute.extras.state.invoiceUrl).catch(() => {
            console.error("Unable to copy text");
          });
          setTimeout(() => {
            this.toast.success({ ...this.currentRoute.extras.state.toast })
          }, 200);
        }else{
          setTimeout(() => {
            this.toast.success({ ...this.currentRoute.extras.state.toast })
          }, 100);
        }
        
      }
      
    }
    var cookieDate = this.getCookie("onbackselectdate");
    if(cookieDate!='' && cookieDate!=null){
      this.selectedDate=moment(cookieDate).toDate();
      this.cookieService.set('onbackselectdate', "", null, "/");
    }
    if (this.currentRoute.extras.state && this.currentRoute.extras.state.selectedDate) {
      this.selectedDate=this.currentRoute.extras.state.selectedDate
    }
    // window.onpopstate = (event) => {
    //   const state = event.state; // Retrieve the state object
    //   // Use the state object to access the sent data and perform necessary actions
    //   console.log(state)
    // }
    this.getMetadata()
    this.getStaffList();
    this.getUnfilledBookings()
    this.getOrganisationList()

  }


  showUnfilledBookings() {
    this.calLeftSpan = 18;
    this.calRightSpan = 6;
    this.calHeaderOne = 6;
    this.calHeaderTwo = 14;
    this.calHeaderThree = 4;
    this.calPanelVisible = true;
    this.toDisplay = !this.toDisplay
  }

  hideUnfilledBookings() {
    this.calLeftSpan = 24;
    this.calRightSpan = 0;
    this.calHeaderOne = 5;
    this.calHeaderTwo = 10;
    this.calHeaderThree = 9;
    this.toDisplay = !this.toDisplay;
    this.calPanelVisible = false;
  }

  ngOnDestroy() {
    clearInterval(this.myInterval )
    // //console.log("Clear interval "+this.myInterval)
  }

  ngAfterViewInit(){
    // call metadata
    // this.getMetadata();
    // this.getTreatments();
    // this.getStaffList();

  }

  getMetadata(): void {
    this.webapi.requestAnonymous(API.METADATA, {
      Metadata: ['StaffCalView', "StaffGroup", "Product", "Category", "Center", "SpecialRequest", "BookingChannel","TimeSlotInterval"]
    })
      .subscribe(
        data => {
          this.metadata = { ...data.body.Data };
          if (this.metadata.StaffCalView) {
            this.staffViewList = this.metadata.StaffCalView;
          }
          if (this.metadata.StaffGroup) {
            this.staffGroupData = this.metadata.StaffGroup;
            this.staffGroupData.forEach(group => {
              group.selected = false;
            });
          }
          if (this.metadata.Product) {
            this.productData = this.metadata.Product;
            this.productData.forEach(product => {
              product.selected = false;
            });
          }
          this.centerData = this.metadata.Center[0];
          let cats = this.metadata['Category'];
          let prods = this.metadata['Product'];
          this.categoryList = [];
          cats.forEach(element => {
            let catObj = {
              CategoryId: element.CategoryId,
              Name: element.Name,
              Products: [],
              Selected: false
            }
            let catProds = prods.filter(f => f.CategoryId === element.CategoryId);
            catProds.forEach(pro => {
              catObj.Products.push({
                ProductId: pro.ProductId,
                Name: pro.Name,
                selected: false
              })
            });
            this.categoryList.push(catObj);
          });

          if (this.metadata.SpecialRequest) {
            console.log("in")
            this.SpecialRequestData = this.metadata.SpecialRequest;
            this.setSpecialRequest();
          }
          if (this.metadata.BookingChannelData) {
            this.BookingChannelData = this.metadata.BookingChannelData;
          }
          if (this.metadata.TimeSlotInterval) {
            this.TimeSlotInterval = this.metadata.TimeSlotInterval;
          }else{
            this.TimeSlotInterval=5;
          }
          this.getTimeSlots()
          if (this.staffList.length) {
            this.updateStaffData();
            this.setConstraints();
          }
        },
        error => {
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }


  hoursCurClass = {
    "hour-zoom-1": this.dayTime.hourZoom === 1,
    "hour-zoom-2": this.dayTime.hourZoom === 2,
    "hour-zoom-3": this.dayTime.hourZoom === 3
  }
  minsCurClass = {
    "min-zoom-1-15": this.dayTime.hourZoom === 1 && this.minuteDivision === 15,
    "min-zoom-2-15": this.dayTime.hourZoom === 2 && this.minuteDivision === 15,
    "min-zoom-3-15": this.dayTime.hourZoom === 3 && this.minuteDivision === 15,
    "min-zoom-1-10": this.dayTime.hourZoom === 1 && this.minuteDivision === 10,
    "min-zoom-2-10": this.dayTime.hourZoom === 2 && this.minuteDivision === 10,
    "min-zoom-3-10": this.dayTime.hourZoom === 3 && this.minuteDivision === 10,
    "min-zoom-1-05": this.dayTime.hourZoom === 1 && this.minuteDivision === 5,
    "min-zoom-2-05": this.dayTime.hourZoom === 2 && this.minuteDivision === 5,
    "min-zoom-3-05": this.dayTime.hourZoom === 3 && this.minuteDivision === 5
  }


  getStaffList(targetStartTime=null): void {
    this.isLoadingStaff = true;
    this.isSpinning = true;
    let obj = {
      Date: moment(this.selectedDate).format("MM/DD/YYYY"),
      IsWorking: this.staffFilterArray.isWorking,
      StaffIds: []
    };
    if (this.selectedStaffList.length > 0) {
      obj.StaffIds = [...this.selectedStaffList]
    }
    this.webapi.request(API.CALENDAR_STAFF, {
      ...obj
    })
      .subscribe(
        data => {
          this.showAllStaff = this.selStaffView === 1 ? false : true;
          this.staffList = [];
          this.isLoadingStaff = false;
          this.isSpinning = false;
          
          this.staffList = [...data.body.data];
          this.updateStaffData();
          this.setConstraints();
          //console.log(`staffs:`)
          console.log(this.staffList)
          this.setScroll(targetStartTime)
          
          setTimeout(() => {
            this.setCurrentTimeLine();
          }, 1000);
        },
        error => {
          this.isLoadingStaff = false;
          this.isSpinning = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  dragBlockHour(e) {
    // set the ui for original position.
    this.tempOriginalPosEle = document.createElement("div");
    if (e.source.element.nativeElement.style.transform) {
      let le = ((parseInt(e.source.data.viewConf.left.split("px")[0]) + parseInt(e.source.element.nativeElement.style.transform.split("(")[1].split("px")[0]))) + "px";
      this.tempOriginalPosEle.style.left = le;
    } else {
      this.tempOriginalPosEle.style.left = e.source.data.viewConf.left;
    }
    this.tempOriginalPosEle.style.width = e.source.data.viewConf.width;
    this.tempOriginalPosEle.style.position = "absolute";
    this.tempOriginalPosEle.style.top = "0px";
    this.tempOriginalPosEle.style.height = this.gridHeight;
    this.tempOriginalPosEle.style.position = "absolute";
    this.tempOriginalPosEle.style.backgroundColor = "#eaeaeab8";
    this.tempOriginalPosEle.style.border = "1px dashed #000000b8";
    this.tempOriginalPosEle.style.zIndex = "1";

    this.tempOriginalPosEle.dataset['temp'] = "true";
    let rowId = "row" + e.source.element.nativeElement.dataset.staffid;
    this.draggingStaffRow = document.getElementById(rowId);
    this.draggingStaffRow.append(this.tempOriginalPosEle);
    this.ongoingDrag = true;
  }

  dropBlockHour(e) {
    //console.log("dropped blockhours");
    let newLeftPosition1 = parseInt(e.source.element.nativeElement.offsetLeft + e.distance.x);
    // e.source.data.viewConf.left = newLeftPosition + "px";
    // let prevUnitGridPos = newLeftPosition - (newLeftPosition % this.dayTime.gridUnit);
    // e.source.element.nativeElement.style.left = prevUnitGridPos + "px";
    // e.source.element.nativeElement.style.removeProperty('transform');
    let hour = parseInt((newLeftPosition1 / this.dayTime.unitGridWidth) + "");
    let mins = parseInt((((newLeftPosition1 % this.dayTime.unitGridWidth) / this.dayTime.unitGridWidth) * 60) + "");
    const getNearest5 = () => {
      let reminder = mins % 5;
      if (reminder > 2) {
        mins += reminder;
      } else if (reminder <= 2) {
        mins -= reminder;
      }
    };
    // getNearest5();
    let startTime = hour + ":" + mins + ":00";
    let duration = moment(e.source.data.EndTime, "HH:mm:ss").diff(moment(e.source.data.StartTime, "HH:mm:ss"), "minutes");
    let endTime = moment(startTime, "HH:mm:ss").add(duration, "minutes").format("HH:mm:ss");
    let staffId = parseInt(e.source.element.nativeElement.dataset.staffid);
    let staffBlockTimeId = parseInt(e.source.element.nativeElement.dataset.staffblocktimeid);
    this.handleBlockDrag(staffId, staffBlockTimeId, startTime, endTime)
    this.tempOriginalPosEle.remove();
  }

  startResize(e) {
    let parent = e.source.element.nativeElement.parentElement.parentElement;
    let newEl = document.createElement("div");
    newEl.className = "resize-block-copy"
    newEl.style.width = e.source.element.nativeElement.parentElement.style.width;
    newEl.style.height = this.gridHeight;
    newEl.style.backgroundColor = "#e5ddd8";
    newEl.style.position = "absolute";
    newEl.style.top = "0px";
    newEl.style.left = e.source.element.nativeElement.parentElement.style.left;
    newEl.style.border = "0.5px solid #c6c1be";
    newEl.style.boxShadow = "1px 1px 5px 2px #eaeaea";
    newEl.style.zIndex = "1";
    newEl.style.cursor = "w-resize";
    newEl.style.borderRadius = "0px 6px 6px 0px";
    newEl.innerHTML = "&nbsp;"
    parent.append(newEl);
    this.tempResizeBg = newEl;
    this.ongoingResize = true;
  }
  resizingBlock(event) {
    let w = event.source.element.nativeElement.parentElement.offsetWidth + event.distance.x;
    this.tempResizeBg.style.width = w + "px";

    //code to show the dragging block
    let newLeftPosition1 = parseInt(event.source.element.nativeElement.parentElement.offsetLeft) + w;
    let hour = parseInt((newLeftPosition1 / this.dayTime.unitGridWidth) + "");
    let mins = parseInt((((newLeftPosition1 % this.dayTime.unitGridWidth) / this.dayTime.unitGridWidth) * 60) + "");
    let startTime = event.source.data.StartTime;
    let endTime = hour + ":" + mins + ":00";
    // let totalMinutes= mins+(hour*60);
    // let startTimeFormat=moment(startTime).format(this.HH_MM)
    // let endTimetoShow = moment(startTimeFormat).add( moment.duration(hour + ":" + mins ) )

    event.source.data.showSpan = true;
    this.draggingStart = moment(startTime, "HH:mm:ss").format(this.HH_MM)
    this.draggingEnd = moment(endTime, "HH:mm:ss").format(this.HH_MM)
  }
  resizeBlockHour(e) {
    let parent = e.source.element.nativeElement.parentElement;
    let totalWidth = (parent.offsetWidth + e.distance.x);
    parent.style.width = totalWidth + "px";
    e.source._dragRef.reset();
    this.tempResizeBg.remove();
    this.tempResizeBg = null;
    let newLeftPosition1 = parseInt(parent.offsetLeft) + totalWidth;
    let hour = parseInt((newLeftPosition1 / this.dayTime.unitGridWidth) + "");
    let mins = parseInt((((newLeftPosition1 % this.dayTime.unitGridWidth) / this.dayTime.unitGridWidth) * 60) + "");
    let startTime = e.source.data.StartTime;
    let endTime = hour + ":" + mins + ":00";
    let staffId = parseInt(e.source.element.nativeElement.parentElement.dataset.staffid);
    let staffBlockTimeId = parseInt(e.source.element.nativeElement.parentElement.dataset.staffblocktimeid);
    this.handleBlockDrag(staffId, staffBlockTimeId, startTime, endTime)
  }

  handleBlockDrag(staffId: number, staffBlockTimeId: number, startTime: string, endTime: string) {
    // TODO: show popus for ongoing schedules editing.
    // TODO: hit the api to edit
    //console.log(staffId);
    //console.log(staffBlockTimeId);
    //console.log(startTime);
    //console.log(endTime);


    let staff = this.staffList.find(f => f.StaffId === staffId);

    //console.log(staff.Schedule.BlockTime.Blocks);

    let blockTimeIndex = -1
    staff.Schedule.BlockTime.Blocks.forEach(function (value, i) {
      if (value.StaffBlocKTimeId == staffBlockTimeId) {
        blockTimeIndex = i;
      }
    })
    //console.log(blockTimeIndex)
    if (blockTimeIndex != -1) {
      staff.Schedule.BlockTime.Blocks[blockTimeIndex].StartTime = startTime;
      staff.Schedule.BlockTime.Blocks[blockTimeIndex].EndTime = endTime;
    }
    this.selectedStaff = staff;
    this.updateScheduleByDrag()


  }

  dropStaffList(event) {
    this.isSpinning = true;
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.staffList, event.previousIndex, event.currentIndex);
    let oldStaffList = cloneDeep(this.staffList);
    let obj = {
      Order: []
    }
    this.staffList.forEach(element => {
      obj.Order.push(element.StaffId);
    });
    this.webapi.request(API.UPDATE_STAFF_SEQUENCE, obj).subscribe(
      data => {
        this.getStaffList();
      },
      error => {
        //console.log(error)
        this.staffList = cloneDeep(oldStaffList);
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          theme: "bootstrap",
          timeout: 3000
        })
      }
    )
  }

  setScroll(targetStartTime=null): void {
    // switch (this.dayTime.hourZoom) {
    //   case 1:
    //     this.calTimeline.nativeElement.scrollTo({ left: 800 })
    //     break;
    //   case 2:
    //     this.calTimeline.nativeElement.scrollTo({ left: 1600 })
    //     break;
    //   case 3:
    //     this.calTimeline.nativeElement.scrollTo({ left: 2400 })
    //     break;

    //   default:
    //     break;
    // }
    this.setCurrentTimeLineUI()
    let hour = moment().hour()
    let minute = moment().minutes()
    if(targetStartTime){
      const time = moment(targetStartTime, 'HH:mm');
      hour = moment(time).hour()
      minute = moment(time).minutes()
    }
    let hourCollection = document.getElementsByClassName("hour-header")
    // let calElement = document.getElementById("bg");
    let hourHeaderelement = <HTMLScriptElement>hourCollection.item(hour)
    // let compStyle = window.getComputedStyle(hourHeaderelement);
    // let compLeft = compStyle.getPropertyValue('left')
    // const calHeight = this.calGrid.nativeElement.offsetHeight;
    const initialLeft = this.calGrid.nativeElement.offsetLeft;
    // const calTop = calElement.offsetTop.toString();
    const calLeft = hourHeaderelement.offsetLeft.toString();
    const eleWidth = hourHeaderelement.offsetWidth.toString();
    let minuteWidth = parseInt(eleWidth) / 60;
    let minuteWiseLeft = minuteWidth * minute;
    let lineLeft = parseInt(calLeft) + initialLeft + minuteWiseLeft;
    lineLeft = (lineLeft - 10)
    let staffContainer = document.getElementById("cal-head-filler");

    const staffLeft = staffContainer.offsetLeft.toString();
    let leftScroll = lineLeft - parseInt(staffLeft)
    this.calTimeline.nativeElement.scrollTo({ left: leftScroll })
  }

  updateStaffData(): void {
    // format the skill data
    this.staffList.forEach(staff => {
      if (staff.Categories.length === 1) {
        staff.Skills = staff.Categories[0].CategoryName
      } else if (staff.Categories.length > 1) {
        staff.Skills = staff.Categories[0].CategoryName
        if (staff.Categories.length > 1) {
          staff.Skills = staff.Skills + `+${staff.Categories.length - 1}`
        }
      }
    });
  }

  async setConstraints(): Promise<void> {
    for (let staffInc = 0; staffInc < this.staffList.length; staffInc++) {
      const staff = this.staffList[staffInc];
      if (staff.Schedule.IsWorking) {
        // Commented after including IC and GO together
        // staff.Schedule.GeneralOffer.viewConf = this.getWorkingWidth(staff.Schedule.GeneralOffer, "go");
        // staff.Schedule.GeneralOffer.workingTime = staff.Schedule.GeneralOffer.DayStart + " - " + staff.Schedule.GeneralOffer.DayEnd;
        // staff.Schedule.GeneralOffer.minParts = this.getMinParts(staff.Schedule.GeneralOffer);

        // New code  after including IC and GO together
        staff.Schedule.GeneralOffer.viewConf = this.getWorkingWidth(staff.Schedule, "go");
        staff.Schedule.GeneralOffer.workingTime = staff.Schedule.DayStart + " - " + staff.Schedule.DayEnd;
        staff.Schedule.GeneralOffer.minParts = this.getMinParts(staff.Schedule);
        //console.log(staff.Schedule.GeneralOffer.minParts)
      }
      if (staff.Schedule.BlockTime && staff.Schedule.BlockTime.Blocks) {
        // staff.Schedule.BlockTime.Blocks = staff.Schedule.BlockTime.Blocks.sort(function (a, b) {
        //   let firstElement = moment(a.StartTime, "HH:mm:ss");
        //   let nextElement = moment(b.StartTime, "HH:mm:ss");
        //   if (firstElement.isBefore(nextElement)) {
        //     return -1;
        //   } else if (firstElement.isSame(nextElement)) {
        //     return 0;
        //   } else {
        //     return 1;
        //   }
        // })
        staff.Schedule.BlockTime.Blocks.forEach(block => {
          block.viewConf = this.getWorkingWidth(block, "block")
          block.blockedTime = moment(block.StartTime, "HH:mm:ss").format(this.HH_MM) + " - " + moment(block.EndTime, "HH:mm:ss").format(this.HH_MM);
          block.blockedTimeReason = (block.Name ? block.Name : "");
          block.minParts = this.getBlockMinParts(block);
          block.showSpan = false;
        });
      }
      let concurrentBookingData= await this.getConcurrentBookings(staff.Bookings);
      staff.Bookings=concurrentBookingData.Bookings
      staff.Bookings.forEach(booking => {
        booking.viewConf = this.getWorkingWidth(booking, "booking");
        booking.popVisible = false;
        booking.isPrevious=this.checkTodayBooking(booking.StartTime)
        // booking.showStartTime = moment(booking.StartTime,this.HH_MM_SS).format(this.HH_MM)
        booking.showStartTime = momentz.tz(booking.StartTime, environment.STAFF_ZONE).format(this.HH_MM)
        // booking.showEndTime = moment(booking.EndTime,this.HH_MM_SS).format(this.HH_MM)
        // booking.showEndTime = momentz.tz(booking.EndTime, environment.STAFF_ZONE).format(this.HH_MM)
        booking.showEndTime = momentz.tz(booking.StartTime, environment.STAFF_ZONE).add(booking.ProdTotalDuration, "minutes").format(this.HH_MM)
        booking.SpecialRequestArray=[];
        if(booking.SpecialRequest.length){
          let allRequest=[];
          let isUserDefined=1;
          booking.SpecialRequest.forEach(element => {
            //console.log(element)
            let foundRequest = this.SpecialRequestData.find(sp => sp.SpecialRequestId === element.SpecialRequestId);
            
            if(foundRequest){
              allRequest.push(foundRequest.SpecialRequestName)
              if(!foundRequest.IsUserDefined){
                isUserDefined=0
              }
            }
        })
        booking.SpecialRequestArray=allRequest;
        booking.IsUserDefined=isUserDefined;
        
      }
      if(booking.ConcurrentBookings >1){
        let height=this.bookingCardHeight/booking.ConcurrentBookings
        let top= ((height * booking.ConcSeq)-height)
        booking.viewConf.height= height+"px"
        booking.viewConf.top=top+3+"px"
      }else{
        booking.viewConf.height=this.bookingCardHeight+"px"
      }
      //console.log(booking)
      this.clonedArray.push(booking);
      
      });
    }

    
  }
  async getConcurrentBookings(Bookings: any) {
   
        
       
       
          Bookings.forEach((elementtoCompare,index) => {
            let concurrentBookings = 1
            if(!elementtoCompare.ConcSeq){
              Bookings[index].ConcSeq=1;
            }
            let startTime = momentz.tz(elementtoCompare.StartTime, environment.STAFF_ZONE).format(this.HH_MM_SS);
        // startTime = item.StartTime
             let  endTime = momentz.tz(elementtoCompare.StartTime, environment.STAFF_ZONE).add(elementtoCompare.ProdTotalDuration, "minutes").format(this.HH_MM_SS);
             Bookings.forEach((elementtoCompareWith,compIndex) => {
              if (elementtoCompareWith.BookingProductId != elementtoCompare.BookingProductId) {
                let startTimeToCompare = momentz.tz(elementtoCompareWith.StartTime, environment.STAFF_ZONE).format(this.HH_MM_SS);
                let endTimeToCompare = momentz.tz(elementtoCompareWith.StartTime, environment.STAFF_ZONE).add(elementtoCompareWith.ProdTotalDuration, "minutes").format(this.HH_MM_SS);
                if ((moment(startTime,this.HH_MM_SS).isSame(moment(startTimeToCompare,this.HH_MM_SS))) && (moment(endTime,this.HH_MM_SS).isSame(moment(endTimeToCompare,this.HH_MM_SS)))) {
                  concurrentBookings++
                  if(!elementtoCompareWith.ConcSeq){
                    Bookings[compIndex].ConcSeq=concurrentBookings;
                  }
                  // Bookings[index].ConcSeq=concurrentBookings
                } else if ((moment(startTime,this.HH_MM_SS).isAfter(moment(startTimeToCompare,this.HH_MM_SS))) && (moment(endTime,this.HH_MM_SS).isBefore(moment(endTimeToCompare,this.HH_MM_SS)))) {
                  concurrentBookings++
                  if(!elementtoCompareWith.ConcSeq){
                    Bookings[compIndex].ConcSeq=concurrentBookings;
                  }
                  // Bookings[index].ConcSeq=concurrentBookings
                }
                else if ((moment(startTime,this.HH_MM_SS).isBefore(moment(startTimeToCompare,this.HH_MM_SS))) && (moment(endTime,this.HH_MM_SS).isAfter(moment(endTimeToCompare,this.HH_MM_SS)))) {
                  concurrentBookings++
                  if(!elementtoCompareWith.ConcSeq){
                    Bookings[compIndex].ConcSeq=concurrentBookings;
                  }
                 
                }
                else if ((moment(startTime,this.HH_MM_SS).isSame(moment(startTimeToCompare,this.HH_MM_SS))) && (moment(endTime,this.HH_MM_SS).isBefore(moment(endTimeToCompare,this.HH_MM_SS)))) {
                  concurrentBookings++
                  if(!elementtoCompareWith.ConcSeq){
                    Bookings[compIndex].ConcSeq=concurrentBookings;
                  }
                 
                }
                else if ((moment(startTime,this.HH_MM_SS).isAfter(moment(startTimeToCompare,this.HH_MM_SS))) && (moment(endTime,this.HH_MM_SS).isSame(moment(endTimeToCompare,this.HH_MM_SS)))) {
                  concurrentBookings++
                  if(!elementtoCompareWith.ConcSeq){
                    Bookings[compIndex].ConcSeq=concurrentBookings;
                  }
                 
                }
                
              }
             
             })
             Bookings[index].ConcurrentBookings=concurrentBookings
             if(concurrentBookings>1){
              //  seq++
              //  Bookings[index].ConcSeq=seq;
             }

          })
        return{
          Bookings:Bookings,
          // ConcurrentBoookings:concurrentBookings
        }
  }

  setCurrentTimeLineUI(timeString=null): void {
    //console.log("interval "+this.myInterval)
    let hour = moment().hour()
    let minute = moment().minutes()
    if(timeString){
      const time = moment(timeString, 'HH:mm');
      hour = moment(time).hour()
      minute = moment(time).minutes()
    }
    let hourCollection = document.getElementsByClassName("hour-header")
    let calElement = document.getElementById("bg");
    let hourHeaderelement = <HTMLScriptElement>hourCollection.item(hour)
    let compStyle = window.getComputedStyle(hourHeaderelement);
    let compLeft = compStyle.getPropertyValue('left')
    const calHeight = this.calGrid.nativeElement.offsetHeight;
    const initialLeft = this.calGrid.nativeElement.offsetLeft;
    const calTop = calElement.offsetTop.toString();
    const calLeft = hourHeaderelement.offsetLeft.toString();
    const eleWidth = hourHeaderelement.offsetWidth.toString();
    let minuteWidth = parseInt(eleWidth) / 60;
    let minuteWiseLeft = minuteWidth * minute;
    let lineLeft = parseInt(calLeft) + initialLeft + minuteWiseLeft;
    this.lineLeft = (lineLeft - 10)
    if(document.getElementById("vline")){
      document.getElementById("vline").style.height = (calHeight + 35) + "px";
    document.getElementById("vline").style.left = lineLeft + "px";
    //console.log((calHeight + 35) + "px--height")
    //console.log(lineLeft + "px--left")
    let labelElement = document.getElementById("vlinelabel");
    const labelElementWidth = labelElement.offsetWidth.toString();
    let decWidth = parseInt(labelElementWidth) / 2;
    labelElement.style.left = (lineLeft - decWidth) + "px";
    }
    
    


    let minPrefix = (minute < 10) ? '0' : ''
    let hourPrefix = (hour < 10) ? '0' : ''
    this.hour = hourPrefix + hour;
    this.minute = minPrefix + minute;
    

  }

  setCurrentTimeLine(): void {
    this.setCurrentTimeLineUI();
    if(this.myInterval){
      clearInterval(this.myInterval)
    }
    this.myInterval=setInterval(() => {
      this.setCurrentTimeLineUI();
    }, 60000);
    // //console.log("Set interval "+this.myInterval)
  }

  getWorkingWidth(item: any, itemType: string): any {
    let resp :any= {
     
    }
    let startTime, endTime;
    switch (itemType) {
      case "go": {
        startTime = item.DayStart;
        endTime = item.DayEnd;
        break;
      }
      case "block": {
        startTime = item.StartTime;
        endTime = item.EndTime;
        break;
      }
      case "booking": {
        startTime = momentz.tz(item.StartTime, environment.STAFF_ZONE).format(this.HH_MM_SS);
        // startTime = item.StartTime
        endTime = momentz.tz(item.StartTime, environment.STAFF_ZONE).add(item.ProdTotalDuration, "minutes").format(this.HH_MM_SS);
        // endTime = momentz.tz(item.EndTime, environment.STAFF_ZONE).format(this.HH_MM_SS);
        resp["border-left"] = "3px solid " + (item.ColorCode ? item.ColorCode : "#ee6d1c");
        break;
      }
      default:
        break;
    }
    let totalMinutes = moment(endTime, this.HH_MM_SS).diff(moment(startTime, this.HH_MM_SS), "minute");
    let startDiff = moment(startTime, this.HH_MM_SS).diff(moment(startTime, this.HH_MM_SS).startOf("day"), "minute");
    resp.width = ((totalMinutes / 60) * this.dayTime.unitGridWidth) + "px";
    // //console.log("unitgridwidth="+this.dayTime.unitGridWidth);
    // //console.log("unitgridwidth="+totalMinutes);
    // //console.log("asdfkj"+resp.width)
    if (startDiff) {
      resp.left = ((startDiff / 60) * this.dayTime.unitGridWidth) + "px";
    }
    
    
    return resp;
  }

  getMinParts(go): any {
    console.log("in parts")
    console.log(go)
    let allMins = [];
    let mins = this.minuteDivision;
    let dayStart = momentz.tz(go.DayStart, this.HH_MM_SS, environment.STAFF_ZONE)

    let coveredTime1 = momentz.tz(go.DayStart, this.HH_MM_SS, environment.STAFF_ZONE).clone();
    let minutes= coveredTime1.minutes()
    let diff=0
    console.log("min",minutes)
    if(minutes>=1 && minutes<=15){
       diff=15-minutes;

    }else if(minutes>=16 && minutes<=30){
      diff=30-minutes;
    }
    else if(minutes>=31 && minutes<=45){
      diff=45-minutes;
    }
    else if(minutes>=46 && minutes<=60){
      diff=60-minutes;
    }
    let cov=moment(coveredTime1).add(diff, "minute").format(this.HH_MM_SS)
    let coveredTime = momentz.tz(cov, this.HH_MM_SS, environment.STAFF_ZONE);
    console.log("cov",cov)
    console.log("ct",coveredTime)
    let dayEnd = momentz.tz(go.DayEnd, this.HH_MM_SS, environment.STAFF_ZONE);
    console.log(dayEnd)
    let oneMinLength=this.dayTime.gridUnit/this.minuteDivision
    let extraMinLength=oneMinLength*diff
    if (moment(coveredTime1).add(mins, "minute").isBefore(dayEnd)) {
      allMins.push({
        style: {
          left: ((allMins.length * this.dayTime.gridUnit)+extraMinLength) + "px"
        },
        value: coveredTime.format(this.HH_MM),
        popVisible: false
      })
      console.log("q")
    }
    
    while (coveredTime.add(mins, "minute").isBefore(dayEnd)) {
      console.log("qq")
      
      allMins.push({
        style: {
          left: ((allMins.length * this.dayTime.gridUnit)+extraMinLength) + "px"
        },
        value: coveredTime.format(this.HH_MM),
        popVisible: false
      });
    }
    console.log(allMins)
    return allMins;
  }

  getBlockMinParts(block): any {
    let allMins = [];
    let mins = this.minuteDivision;
    let dayStart = momentz.tz(block.StartTime, this.HH_MM_SS, environment.STAFF_ZONE)
    let coveredTime = momentz.tz(block.StartTime, this.HH_MM_SS, environment.STAFF_ZONE);
    let dayEnd = momentz.tz(block.EndTime, this.HH_MM_SS, environment.STAFF_ZONE);
    if (moment(coveredTime).add(mins, "minute").isBefore(dayEnd)) {
      allMins.push({
        value: coveredTime.format(this.HH_MM)
      })
    }
    while (coveredTime.add(mins, "minute").isBefore(dayEnd)) {
      allMins.push({
        style: {
          left: (allMins.length * this.dayTime.gridUnit) + "px"
        },
        value: coveredTime.format(this.HH_MM),
        popVisible: false
      });
    }
    return allMins;
  }

  onSelectDate(selectedDate) {
    console.log(selectedDate)
    this.staffFilterArray.selectedDate= moment(this.selectedDate).format("MM/DD/YYYY");
    this.staffFilterArray2.selectedDate= moment(this.selectedDate).format("MM/DD/YYYY");
    this.getStaffList();
    this.checkToday(this.selectedDate)
    this.getUnfilledBookings();
    this.setUnfilledData(this.unfilledList_global);
    this.getStaffFilterList(true);
  }

  onChangeDate(selectedDate) {
    
    switch (selectedDate) {
      case "today": {
        //console.log("today");
        this.selectedDate = new Date();
        break;
      }
      case "previous": {
        //console.log("previous");
        this.selectedDate = moment(this.selectedDate).add(-1, "days").toDate();
        break;
      }
      case "next": {
        //console.log("next");
        this.selectedDate = moment(this.selectedDate).add(1, 'days').toDate();
        break;
      }
      default: {
        this.selectedDate = new Date();
        break;
      }
    }
    this.checkToday(this.selectedDate)
    this.staffFilterArray.selectedDate=moment(this.selectedDate).format("MM/DD/YYYY");
    this.staffFilterArray2.selectedDate=moment(this.selectedDate).format("MM/DD/YYYY");
    this.getStaffList();
    this.getStaffFilterList(true);
    this.getUnfilledBookings();
    this.setUnfilledData(this.unfilledList_global);
  }

  changeZoom(zoom: number) {
    switch (zoom) {
      case 1: {
        this.dayTime.hourZoom = 1;
        this.dayTime.unitGridWidth = 100;
        this.dayTime.gridUnit = 100 / (60 / this.minuteDivision);
        break;
      }
      case 2: {
        this.dayTime.hourZoom = 2;
        this.dayTime.gridUnit = this.gridWidth / (60 / this.minuteDivision);
        this.dayTime.unitGridWidth = this.gridWidth;
        break;
      }
      case 3: {
        this.dayTime.hourZoom = 3;
        this.dayTime.gridUnit = 300 / (60 / this.minuteDivision);
        this.dayTime.unitGridWidth = 300;
        break;
      }
      default:
        break;
    }
    this.hoursCurClass = {
      "hour-zoom-1": this.dayTime.hourZoom === 1,
      "hour-zoom-2": this.dayTime.hourZoom === 2,
      "hour-zoom-3": this.dayTime.hourZoom === 3
    }
    this.minsCurClass = {
      "min-zoom-1-15": this.dayTime.hourZoom === 1 && this.minuteDivision === 15,
      "min-zoom-2-15": this.dayTime.hourZoom === 2 && this.minuteDivision === 15,
      "min-zoom-3-15": this.dayTime.hourZoom === 3 && this.minuteDivision === 15,
      "min-zoom-1-10": this.dayTime.hourZoom === 1 && this.minuteDivision === 10,
      "min-zoom-2-10": this.dayTime.hourZoom === 2 && this.minuteDivision === 10,
      "min-zoom-3-10": this.dayTime.hourZoom === 3 && this.minuteDivision === 10,
      "min-zoom-1-05": this.dayTime.hourZoom === 1 && this.minuteDivision === 5,
      "min-zoom-2-05": this.dayTime.hourZoom === 2 && this.minuteDivision === 5,
      "min-zoom-3-05": this.dayTime.hourZoom === 3 && this.minuteDivision === 5
    }

    let clone = cloneDeep(this.staffList);
    this.staffList = [];
    this.staffList = [...clone];
    this.setConstraints();
    setTimeout(() => {
      this.setCurrentTimeLineUI();
    }, 100);
  }

  getPartByHour(hour: string, min: string): object {
    return {
      time:hour.split(":")[0] + ":" + min,
      popVisible:false
    };
  }

  getTotalParts(go) {
    //console.log(go)
  }

  closeScheduleModal() {
    this.scheduleModalVisible = false;
    this.scheduleEditMode = false;
  }
  closeConfirmationModal() {
    this.confirmationModalVisible = false;
    this.scheduleModalVisible = true;
  }
  openScheduleModal(selectedTime) {
    // this.scheduleModalVisible = true;
    //console.log(this.selectedDate)
    this.blockSelectedDate = this.selectedDate
    this.scheduleEditMode = false;
    this.selectedSchedule = {
      StaffId: this.selectedStaff.StaffId,
      staffName: this.selectedStaff.Name,
      dateShow: moment(this.blockSelectedDate, this.FORMAT_DD_MM_YYYY).format("dddd, DD MMMM YYYY"),
      Schedule: {
        RequestType: 0,
        ScheduleType: this.SCHEDULE_TYPE['BLOCKTIME'].VALUE,
        ScheduleTypeName: this.SCHEDULE_TYPE['BLOCKTIME'].HEADING,
        Date: moment(this.blockSelectedDate, this.FORMAT_DD_MM_YYYY).format(this.FORMAT_DD_MM_YYYY),
        EndDate: moment(this.blockSelectedDate, this.FORMAT_DD_MM_YYYY).add(7, "day").toDate(),
        CurrentSchedular: null,
        DayStartTime: null,
        DayEndTime: null,
        Repeat: 0,
        BlockTime: []
      }
    }
    let blockArray = this.scheduleForm.get('BlockTime') as FormArray;
    let obj = {
      Name: "",
      StartTime: moment(selectedTime, this.TIME_FORMAT_HH_MM_SS).toDate(),
      EndTime: null
    };
    this.resetScheduleForm();
    blockArray.push(this.pushBlockControls(obj));
    this.selectedSchedule.Schedule.BlockTime.push(obj);
  }


  setSelected(staff) {
    this.selectedStaff = staff
    //console.log("setselected")

  }
  checkToday(formDate = null) {
    let today = moment().startOf("day");
    let selectedDay
    if (formDate) {
      selectedDay = moment(formDate, this.FORMAT_DD_MM_YYYY).startOf("day");
    } else {
      selectedDay = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).startOf("day");
    }
    if (selectedDay.isBefore(today)) {
      this.prevDayDisable = true;
    } else {
      this.prevDayDisable = false;
    }
    if (selectedDay.isSame(today, 'day')) {
      this.todaySelected = true;
    } else {
      this.todaySelected = false;
    }
  }
  disabledSave() {
    if (this.selectedSchedule && this.selectedSchedule.Schedule.ScheduleType !== this.SCHEDULE_TYPE.BLOCKTIME.VALUE) {
      if (!this.scheduleForm.valid) {
        return true;
      }
    } else {
      if (!this.scheduleForm.controls.BlockTime.value.length) {
        return false;
      }
      let invalid = false;
      this.scheduleForm.controls.BlockTime.value.forEach(element => {
        if (!element.StartTime || !element.EndTime) {
          invalid = true;
        }
      });
      return invalid;
    }
    if (this.selectedSchedule &&
      this.selectedSchedule.Schedule.ScheduleType === this.SCHEDULE_TYPE.BLOCKTIME.VALUE &&
      this.scheduleForm.controls.BlockTime.value.length === 0
    ) {
      return true;
    }
    if (this.scheduleForm.controls.Repeat.value === 2 && !this.scheduleForm.controls.EndDate.value) {
      return true;
    }
    let today = moment().startOf("day");
    if (this.selectedSchedule && this.selectedSchedule.Schedule) {
      let selectedDay = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).startOf("day");
      if (selectedDay.isBefore(today)) {
        return true;
      }
    }
    return false;
  }

  addBlockTimeControls() {
    let blockArray = this.scheduleForm.get('BlockTime') as FormArray;
    blockArray.push(this.pushBlockControls());
    let element = document.getElementById("blocksCont");
    element.scroll({
      behavior: "smooth",
      top: 10000
    })
  }
  pushBlockControls(obj = null) {
    if (!obj) {
      return this.fb.group({
        Name: [null, [Validators.required]],
        StartTime: [null, [Validators.required]],
        EndTime: [null, [Validators.required]]
      })
    } else {
      let startTime = obj.StartTime ? moment(obj.StartTime).toDate() : null;
      let endTime = obj.EndTime ? moment(obj.EndTime).toDate() : null;
      return this.fb.group({
        Name: [obj.Name, [Validators.required]],
        StartTime: [startTime, [Validators.required]],
        EndTime: [endTime, [Validators.required]]
      })
    }
  }
  deleteBlock(index: number): void {
    const day = this.scheduleForm.get('BlockTime') as FormArray;
    day.removeAt(index);
    if (day.length == 0) {
      let blockArray = this.scheduleForm.get('BlockTime') as FormArray;
      blockArray.push(this.pushBlockControls());
    }

  }

  submitNewSchedule() {
    if (this.selectedSchedule.Schedule.ScheduleType !== this.SCHEDULE_TYPE.BLOCKTIME.VALUE) {
      //console.log(this.selectedSchedule)
      let dayStart = moment(this.scheduleForm.controls.DayStartTime.value).startOf("minute");
      let dayEnd = moment(this.scheduleForm.controls.DayEndTime.value).startOf("minute");
      if (dayStart.isAfter(dayEnd) || dayStart.isSame(dayEnd)) {
        this.toast.error({
          title: `Please enter valid day timing.`,
          msg: "",
          timeout: 3000,
          theme: "bootstrap"
        })
        return;
      }
    } else if (!this.scheduleForm.controls.BlockTime.value.length) {
      this.toast.error({
        title: `Please enter block times.`,
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
      return;
    }
    const valid = this.checkBlocks();
    if (!valid) {
      return;
    }
    let obj = {
      StaffId: this.selectedSchedule.StaffId,
      Schedule: {
        RequestType: 0,
        ScheduleType: this.selectedSchedule.Schedule.ScheduleType,
        Date: this.selectedSchedule.Schedule.Date,
        EndDate: null,
        CurrentSchedular: null,
        DayStartTime: this.scheduleForm.controls.DayStartTime.value ? moment(this.scheduleForm.controls.DayStartTime.value).format(this.TIME_FORMAT_HH_MM) : "",
        DayEndTime: this.scheduleForm.controls.DayEndTime.value ? moment(this.scheduleForm.controls.DayEndTime.value).format(this.TIME_FORMAT_HH_MM) : "",
        BlockTime: []
      }
    }
    if (this.scheduleForm.controls.Repeat.value === 0) {
      obj.Schedule.EndDate = this.selectedSchedule.Schedule.Date;
    }
    if (this.scheduleForm.controls.Repeat.value === 2) {
      obj.Schedule.EndDate = moment(this.scheduleForm.controls.EndDate.value).format(this.FORMAT_DD_MM_YYYY);
    }
    this.scheduleForm.controls.BlockTime.value.forEach(block => {
      obj.Schedule.BlockTime.push({
        Name: block.Name,
        StartTime: moment(block.StartTime).format(this.TIME_FORMAT_HH_MM),
        EndTime: moment(block.EndTime).format(this.TIME_FORMAT_HH_MM)
      })
    });
    this.isSchLoading = true;
    //console.log(obj)
    this.isLoadingStaff = true;
    this.webapi.request(API.UPDATE_STAFF_SCHEDULE, obj)
      .subscribe(
        data => {
          this.isLoadingStaff = false;
          this.isSchLoading = false;
          this.scheduleModalVisible = false;
          // this.fetchSchedule(moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate());
          this.getStaffList();
          this.resetScheduleForm();
          this.existScheduleDetail = null;
          this.selectedSchedule = null;
        },
        error => {
          this.isSchLoading = false;
          this.toast.error({
            title: `Error`,
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  checkBlocks(): boolean {
    let blocksValid = true;
    let blocks = this.scheduleForm.controls.BlockTime.value;
    // let dayStart = moment(this.scheduleForm.controls.DayStartTime.value);
    // let dayEnd = moment(this.scheduleForm.controls.DayEndTime.value);

    blocks.forEach(block => {
      // let startTime = moment(block.StartTime, "HH:mm");
      // let endTime = moment(block.EndTime, "HH:mm");
      let startTime = moment(block.StartTime).startOf("minute");
      let endTime = moment(block.EndTime).startOf("minute");
      // if (
      //   !startTime.isBetween(dayStart, dayEnd, "minute", "[]") ||
      //   !endTime.isBetween(dayStart, dayEnd, "minute", "[]")
      // ) {
      //   this.toast.error({
      //     title: `Block time got out of range, please correct and save.`,
      //     msg: "",
      //     timeout: 3000,
      //     theme: "bootstrap"
      //   })
      //   blocksValid = false;
      //   return;
      // }
      if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
        blocksValid = false;
      }
    });
    //console.log(blocksValid)
    if (!blocksValid) {
      this.toast.error({
        title: `Please enter valid block timing.`,
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
    }
    return blocksValid;
  }
  fetchSchedule(date: Date, curPage?: any, size?: any) {
    this.loadingFlag = true;
    this.setCurrentWeek(date);
    this.calVisible = false;
    this.selectedWeekString =
      `${moment(this.currentWeek[0].Date).format("DD MMM")} -  
      ${moment(this.currentWeek[6].Date).format("DD MMM, YYYY")}`
    let selectedDate = moment(date);
    if (moment().isSame(moment(this.selectedDate), 'day')) {
      this.todaySelected = true;
    } else {
      this.todaySelected = false;
    }
    this.selectedDate = selectedDate.toDate();
    let obj = {
      StartDate: selectedDate.format(this.FORMAT_DD_MM_YYYY),
      EndDate: selectedDate.format(this.FORMAT_DD_MM_YYYY),
      StaffId: null,
      Pagination: {
        Number: "",
        Size: ""
      },
    }
    if (this.singleStaffId) {
      obj.StaffId = this.singleStaffId;
    }
    // this.webapi.request(API.STAFF_SCHEDULE, obj)
    //   .subscribe(

    //     data => {
    //       //console.log(data.body)
    //       this.scheduleData = [...data.body.Data];
    //       this.setTimeFormat(this.scheduleData);
    //       this.loadingFlag = false;

    //     },
    //     error => {
    //       this.loadingFlag = false;
    //       //console.log(error)
    //     }
    //   )

  }

  resetScheduleForm() {
    this.scheduleForm.reset();
    let blocks = this.scheduleForm.get('BlockTime') as FormArray;
    while (blocks.length > 0) {
      blocks.removeAt(0);
    }
  }
  setCurrentWeek(date: Date) {
    let selectedDate = moment(date);
    const weekDayNum = selectedDate.day();
    this.currentWeek = [
      {
        DayCode: "Monday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 1 - 7 : 1).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 1 - 7 : 1).format(this.COLUMN_NAME_FORMAT),
      },
      {
        DayCode: "Tuesday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 2 - 7 : 2).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 2 - 7 : 2).format(this.COLUMN_NAME_FORMAT)
      },
      {
        DayCode: "Wednesday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 3 - 7 : 3).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 3 - 7 : 3).format(this.COLUMN_NAME_FORMAT)
      },
      {
        DayCode: "Thursday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 4 - 7 : 4).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 4 - 7 : 4).format(this.COLUMN_NAME_FORMAT)
      },
      {
        DayCode: "Friday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 5 - 7 : 5).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 5 - 7 : 5).format(this.COLUMN_NAME_FORMAT)
      },
      {
        DayCode: "Saturday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 6 - 7 : 6).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 6 - 7 : 6).format(this.COLUMN_NAME_FORMAT)
      },
      {
        DayCode: "Sunday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 0 : 7).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 0 : 7).format(this.COLUMN_NAME_FORMAT)
      },
    ];
  }
  calTimeLine = {
    'padding': '0px',
    "max-height": "calc(100vh - 205px)",
    "white-space": "nowrap",
    "width": "auto",
    "min-height": "300px",
    "border": "none"
  }

  // callType defines that function is called for add block (ADD_NEW_BLOCK) or to edit block (EDIT_BLOCK)
  editSchedule(staffId: number, scheduleType: string, callType: string, selectedTime) {
    //console.log(this.ongoingDrag)
    if (this.ongoingDrag == false && this.ongoingResize == false) {
      // //console.log(staffId)
      // //console.log(this.scheduleData)
      let staff = this.staffList.find(f => f.StaffId === staffId);
      this.selectedStaff = staff;
      //console.log("staff here :", staff)
      let sch = staff.Schedule[this.SCHEDULE_TYPE[scheduleType].LABEL];
      //console.log("sch : ", sch)
      // let selectedDate = staff.Schedule[dayCode].Date;

      this.existScheduleDetail = sch;
      let selectedScheduleDate = moment(staff.Schedule.Date, this.FORMAT_DD_MM_YYYY).format("dddd, DD MMMM YYYY");
      this.blockSelectedDate = moment(selectedScheduleDate, 'dddd, DD MMMM YYYY').toDate();
      this.selectedSchedule = {
        StaffId: staff.StaffId,
        staffName: staff.Name,
        dateShow: selectedScheduleDate,
        Schedule: {
          RequestType: 0,
          ScheduleType: this.SCHEDULE_TYPE[scheduleType].VALUE,
          ScheduleTypeName: this.SCHEDULE_TYPE[scheduleType].HEADING,
          Date: staff.Schedule.Date,
          EndDate: null,
          CurrentSchedular: sch.CurrentSchedular,
          DayStartTime: sch.DayStart ? moment(sch.DayStart, this.TIME_FORMAT_HH_MM).toDate() : "",
          DayEndTime: sch.DayEnd ? moment(sch.DayEnd, this.TIME_FORMAT_HH_MM).toDate() : "",
          Repeat: 0,
          BlockTime: [],
          BlockTimeDate: moment(staff.Schedule.Date, this.FORMAT_DD_MM_YYYY).format("dddd, DD MMMM YYYY"),
          Therapist: staff.StaffId
        }
      }

      if (Object.keys(this.existScheduleDetail).length === 0) {
        this.selectedSchedule.Schedule.Repeat = 0;
      } else if (!this.existScheduleDetail.CurrentScheduleEnd) {
        this.selectedSchedule.Schedule.Repeat = 1;
      } else if (moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY).isSame(selectedScheduleDate)) {
        this.selectedSchedule.Schedule.Repeat = 0;
      } else {
        this.selectedSchedule.Schedule.Repeat = 2;
        this.selectedSchedule.Schedule.EndDate = moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY).toDate();
      }
      let blockArray = this.scheduleForm.get('BlockTime') as FormArray;
      this.resetScheduleForm();
      if (sch.Blocks) {
        
        sch.Blocks.forEach(element => {
          console.log(element)
          if(element.Type!=1){
          let obj = {
            Name: element.Name,
            StartTime: moment(element.StartTime, this.TIME_FORMAT_HH_MM_SS).toDate(),
            EndTime: moment(element.EndTime, this.TIME_FORMAT_HH_MM_SS).toDate()
          };
          blockArray.push(this.pushBlockControls(obj));
          this.selectedSchedule.Schedule.BlockTime.push(obj);
          }
        })
      } else {
        let obj = {
          Name: "",
          StartTime: moment(selectedTime, this.TIME_FORMAT_HH_MM_SS).toDate(),
          EndTime: null
        };
        blockArray.push(this.pushBlockControls(obj));
      }
      //console.log(this.selectedSchedule)

      this.scheduleForm.patchValue(this.selectedSchedule.Schedule);
      this.scheduleForm.controls.BlockTimeDate.setValue(this.selectedSchedule.Schedule.BlockTimeDate);
      this.scheduleModalVisible = true;
      this.scheduleEditMode = true;
      this.checkToday();
    } else {
      this.ongoingDrag = false;
      this.ongoingResize = false
    }


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
  disabledDelete() {
    let today = moment().startOf("day");
    let selectedDay = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).startOf("day");
    if (selectedDay.isBefore(today)) {
      return true;
    }
    return false;
  }

  confirmUpdation() {
    let showUpdConf = false;
    // check if exist schedule is ongoing weekly
    if (!this.existScheduleDetail.CurrentScheduleEnd) {
      showUpdConf = true;
    } else {
      let existScheduleEnd = moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
      let existScheduleStart = moment(this.existScheduleDetail.CurrentSchedular, this.FORMAT_DD_MM_YYYY);
      if (existScheduleEnd.isAfter(existScheduleStart)) {
        showUpdConf = true;
      } else {
        showUpdConf = false;
      }
    }
    // showUpdConf will be true now if exist schedule is ongoing somehow.

    if (showUpdConf) {
      if (this.scheduleForm.controls.Repeat.value !== 0) {
        // need to show confirmation dialog
        let weekDayCode = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).day();
        let dayCode = this.WEEK.find(f => f.Code === weekDayCode);
        this.warningText = `You have edited a shift that repeats weekly. Updating upcoming shifts
        will overwrite ${this.selectedSchedule.staffName}'s `;
        if (this.scheduleForm.controls.Repeat.value === 1) {
          // show ongoing warning
          this.warningText += `ongoing ${dayCode.Day} schedule`;
        } else {
          // show date specific warning
          this.warningText += `${dayCode.Day} schedule up to ${moment(this.scheduleForm.controls.EndDate.value).format("DD MMMM YYYY")}`;
        }
        this.updateConfirmation = true;
        this.deleteConfirmation = false;
        this.scheduleModalVisible = false;
      } else {
        showUpdConf = false;
      }
    } else {
      // dont show the message just hit API.
      showUpdConf = false;
    }

    if (showUpdConf) {
      this.confirmationModalVisible = true;
    } else {
      this.updateSchedule();
    }
  }
  updateSchedule(updateOngoing = null) {
    let dayStart = moment(this.scheduleForm.controls.DayStartTime.value);
    let dayEnd = moment(this.scheduleForm.controls.DayEndTime.value);
    if (dayStart.isAfter(dayEnd) || dayStart.isSame(dayEnd)) {
      this.toast.error({
        title: `Please enter valid day timing.`,
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
      return;
    }
    const valid = this.checkBlocks();
    if (!valid) {
      return;
    }
    let obj = {
      StaffId: this.scheduleForm.controls.Therapist.value,
      Schedule: {
        RequestType: 0,
        ScheduleType: this.selectedSchedule.Schedule.ScheduleType,
        Date: this.selectedSchedule.Schedule.Date,
        EndDate: null,
        CurrentSchedular: this.existScheduleDetail.CurrentSchedular,
        DayStartTime: moment(this.scheduleForm.controls.DayStartTime.value).format(this.TIME_FORMAT_HH_MM),
        DayEndTime: moment(this.scheduleForm.controls.DayEndTime.value).format(this.TIME_FORMAT_HH_MM),
        BlockTime: []
      }
    }
    if (this.scheduleForm.controls.Repeat.value === 0 || updateOngoing === false) {
      obj.Schedule.EndDate = this.selectedSchedule.Schedule.Date;
    } else if (this.scheduleForm.controls.Repeat.value === 2) {
      obj.Schedule.EndDate = moment(this.scheduleForm.controls.EndDate.value).format(this.FORMAT_DD_MM_YYYY);
    }
    this.scheduleForm.controls.BlockTime.value.forEach(block => {
      obj.Schedule.BlockTime.push({
        Name: block.Name,
        StartTime: moment(block.StartTime).format(this.TIME_FORMAT_HH_MM),
        EndTime: moment(block.EndTime).format(this.TIME_FORMAT_HH_MM)
      })
    });
    this.isSchLoading = true;
    this.isSpinning = true;
    updateOngoing ? this.isUpdMultiLoading = true : this.isUpdSingleLoading = true;
    this.isLoadingStaff = true;
    this.webapi.request(API.UPDATE_STAFF_SCHEDULE, obj)
      .subscribe(
        data => {
          this.isLoadingStaff = false;
          this.isSchLoading = false;
          this.isUpdMultiLoading = false;
          this.isUpdSingleLoading = false;
          this.isSpinning = false;
          if (this.confirmationModalVisible) {
            this.confirmationModalVisible = false;
          }
          if (this.scheduleModalVisible) {
            this.closeScheduleModal();
          }
          this.scheduleEditMode = false;
          // this.fetchSchedule(moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate());
          this.getStaffList();
          this.resetScheduleForm();
          this.selectedSchedule = null;
          this.existScheduleDetail = null;
        },
        error => {
          this.isSchLoading = false;
          this.isUpdMultiLoading = false;
          this.isUpdSingleLoading = false;
          this.isSpinning = false;
          this.toast.error({
            title: `Error`,
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }
  confirmDelete() {
    let showDelConf = false;
    // check if exist schedule is ongoing weekly
    if (!this.existScheduleDetail.CurrentScheduleEnd) {
      showDelConf = true;
    } else {
      let existScheduleEnd = moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
      let existScheduleStart = moment(this.existScheduleDetail.CurrentSchedular, this.FORMAT_DD_MM_YYYY);
      if (existScheduleEnd.isAfter(existScheduleStart)) {
        if (moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).isSame(existScheduleEnd)) {
          showDelConf = false;
        } else {
          showDelConf = true;
        }
      } else {
        showDelConf = false;
      }
    }
    // showUpdConf will be true now if exist schedule is ongoing anyhow.

    if (showDelConf) {
      // need to show confirmation dialog
      let weekDayCode = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).day();
      let dayCode = this.WEEK.find(f => f.Code === weekDayCode);
      this.warningText = `You are deleting a shift that repeats weekly. Deleting upcoming shifts will overwrite ${this.selectedSchedule.staffName}'s `;
      if (this.scheduleForm.controls.Repeat.value === 1 || !this.existScheduleDetail.CurrentScheduleEnd) {
        // show ongoing warning
        this.warningText += `ongoing ${dayCode.Day} schedule`;
      } else {
        // show date specific warning
        this.warningText += `${dayCode.Day} schedule up to ${moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY).format("DD MMMM YYYY")}`;
      }
      this.scheduleModalVisible = false;
      this.updateConfirmation = false;
      this.deleteConfirmation = true;
      this.confirmationModalVisible = true;
    } else {
      this.deleteSchedule();
    }
  }
  deleteSchedule(deleteOngoing = false) {
    let obj = {
      StaffId: this.selectedSchedule.StaffId,
      Schedule: {
        RequestType: 1,
        ScheduleType: this.selectedSchedule.Schedule.ScheduleType,
        Date: this.selectedSchedule.Schedule.Date,
        EndDate: null,
        CurrentSchedular: this.existScheduleDetail.CurrentSchedular,
        DayStartTime: moment(this.scheduleForm.controls.DayStartTime.value).format(this.TIME_FORMAT_HH_MM),
        DayEndTime: moment(this.scheduleForm.controls.DayEndTime.value).format(this.TIME_FORMAT_HH_MM),
        BlockTime: [],
        DeleteOngoing: deleteOngoing
      }
    }
    this.isDelLoading = true;
    deleteOngoing ? this.isDelMultiLoading = true : this.isDelSingleLoading = true;
    this.isLoadingStaff = true;
    this.webapi.request(API.UPDATE_STAFF_SCHEDULE, obj)
      .subscribe(
        data => {
          this.isDelLoading = false;
          this.isDelMultiLoading = false;
          this.isDelSingleLoading = false;
          if (this.confirmationModalVisible) {
            this.confirmationModalVisible = false;
          }
          if (this.scheduleModalVisible) {
            this.closeScheduleModal();
          }
          // this.fetchSchedule(moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate());
          this.getStaffList();
          this.resetScheduleForm();
          this.scheduleEditMode = false;
          this.selectedSchedule = null;
          this.existScheduleDetail = null;
        },
        error => {
          this.isDelLoading = false;
          this.isDelMultiLoading = false;
          this.isDelSingleLoading = false;
          this.toast.error({
            title: `Error`,
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }
  onSelectFormDate(selectedDate) {
    //console.log("prev")
    this.checkToday(selectedDate)
  }
  updateScheduleByDrag(updateOngoing = null) {

    const valid = this.checkBlocksForDrag();
    if (!valid) {
      return;
    }

    let obj = {
      StaffId: this.selectedStaff.StaffId,
      Schedule: {
        RequestType: 0,
        ScheduleType: 2,
        Date: this.selectedStaff.Schedule.Date,
        EndDate: null,
        CurrentSchedular: null,
        DayStartTime: "",
        DayEndTime: "",
        BlockTime: []
      }
    }
    obj.Schedule.BlockTime = this.selectedStaff.Schedule.BlockTime.Blocks
    // if (this.scheduleForm.controls.Repeat.value === 0) {
    //   obj.Schedule.EndDate = this.selectedSchedule.Schedule.Date;
    // }
    // if (this.scheduleForm.controls.Repeat.value === 2) {
    //   obj.Schedule.EndDate = moment(this.scheduleForm.controls.EndDate.value).format(this.FORMAT_DD_MM_YYYY);
    // }
    // this.scheduleForm.controls.BlockTime.value.forEach(block => {
    //   obj.Schedule.BlockTime.push({
    //     Name: block.Name,
    //     StartTime: moment(block.StartTime).format(this.TIME_FORMAT_HH_MM),
    //     EndTime: moment(block.EndTime).format(this.TIME_FORMAT_HH_MM)
    //   })
    // });

    this.isSchLoading = true;
    updateOngoing ? this.isUpdMultiLoading = true : this.isUpdSingleLoading = true;
    this.isLoadingStaff = true;
    this.isSpinning = true;
    this.webapi.request(API.UPDATE_STAFF_SCHEDULE, obj)
      .subscribe(
        data => {
          this.isLoadingStaff = false;
          this.isSchLoading = false;
          this.isUpdMultiLoading = false;
          this.isUpdSingleLoading = false;
          this.isSpinning = false;
          if (this.confirmationModalVisible) {
            this.confirmationModalVisible = false;
          }
          if (this.scheduleModalVisible) {
            this.closeScheduleModal();
          }
          this.scheduleEditMode = false;
          // this.fetchSchedule(moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate());
          this.getStaffList();
          this.resetScheduleForm();
          this.selectedSchedule = null;
          this.existScheduleDetail = null;
          this.toast.success({
            title: "Success",
            msg: "Updated successfully",
            timeout: 3000,
            theme: "bootstrap"
          })
        },
        error => {
          this.isLoadingStaff = false;
          this.isSchLoading = false;
          this.isUpdMultiLoading = false;
          this.isUpdSingleLoading = false;
          this.isSpinning = false;
          this.toast.error({
            title: `Error`,
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  checkBlocksForDrag(): boolean {
    let blocksValid = true;
    let blocks = this.selectedStaff.Schedule.BlockTime.Blocks;
    // let dayStart = moment(this.scheduleForm.controls.DayStartTime.value);
    // let dayEnd = moment(this.scheduleForm.controls.DayEndTime.value);

    blocks.forEach(block => {
      // let startTime = moment(block.StartTime, "HH:mm");
      // let endTime = moment(block.EndTime, "HH:mm");
      let startTime = moment(block.StartTime).startOf("minute");
      let endTime = moment(block.EndTime).startOf("minute");
      // if (
      //   !startTime.isBetween(dayStart, dayEnd, "minute", "[]") ||
      //   !endTime.isBetween(dayStart, dayEnd, "minute", "[]")
      // ) {
      //   this.toast.error({
      //     title: `Block time got out of range, please correct and save.`,
      //     msg: "",
      //     timeout: 3000,
      //     theme: "bootstrap"
      //   })
      //   blocksValid = false;
      //   return;
      // }
      if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
        blocksValid = false;
      }
    });
    //console.log(blocksValid)
    if (!blocksValid) {
      this.toast.error({
        title: `Please enter valid block timing.`,
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
    }
    return blocksValid;
  }

  viewBooking(bookingId) {
    this.router.navigate(['/booking/'], {
      state: {
        bookingId
      }
    })
  }
  scheduleConfirm(staffId, selectedTime) {
    //console.log(this.selectedDate)
    this.router.navigate(['/schedule/'], {
      state: {
        "staffId": staffId,
        "selectedDate": this.selectedDate,
        "scheduleType": "GENERAL_OFFER",
        "selectedTime": selectedTime
      }
    })

  }
  changeStaffView() {
    this.getStaffList();
  }
  onStaffViewChange(staffViewId) {
    //console.log(staffViewId)
    this.selStaffView = staffViewId
    // this.getStaffList();
  }
  draggingBlock(e) {
    //console.log(e)
    let newLeftPosition1 = parseInt(e.source.element.nativeElement.offsetLeft + e.distance.x);
    // e.source.data.viewConf.left = newLeftPosition + "px";
    // let prevUnitGridPos = newLeftPosition - (newLeftPosition % this.dayTime.gridUnit);
    // e.source.element.nativeElement.style.left = prevUnitGridPos + "px";
    // e.source.element.nativeElement.style.removeProperty('transform');
    let hour = parseInt((newLeftPosition1 / this.dayTime.unitGridWidth) + "");
    let mins = parseInt((((newLeftPosition1 % this.dayTime.unitGridWidth) / this.dayTime.unitGridWidth) * 60) + "");
    const getNearest5 = () => {
      let reminder = mins % 5;
      if (reminder > 2) {
        mins += reminder;
      } else if (reminder <= 2) {
        mins -= reminder;
      }
    };
    // getNearest5();
    let startTime = hour + ":" + mins + ":00";
    let duration = moment(e.source.data.EndTime, "HH:mm:ss").diff(moment(e.source.data.StartTime, "HH:mm:ss"), "minutes");
    let endTime = moment(startTime, "HH:mm:ss").add(duration, "minutes").format("HH:mm:ss");
    let staffId = parseInt(e.source.element.nativeElement.dataset.staffid);
    let staffBlockTimeId = parseInt(e.source.element.nativeElement.dataset.staffblocktimeid);
    //console.log(startTime + "=>" + endTime)
    e.source.data.showSpan = true;
    this.draggingStart = moment(startTime, "HH:mm:ss").format(this.HH_MM)
    this.draggingEnd = moment(endTime, "HH:mm:ss").format(this.HH_MM)
  }



  selectGroupSelect(staffGroupData) {
    //console.log(staffGroupData)
    let selectedGroups = []
    this.filteredGroups=[]
    staffGroupData.forEach(group => {
      if (group.selected === true) {
        selectedGroups.push(group.StaffGroupId)
        this.filteredGroups.push(group.Name);
      }
    })
    this.staffFilterArray.groups = selectedGroups
    //console.log("selectGroupSelect this.staffFilterArray", this.staffFilterArray)
    this.getStaffFilterList()

  }
  selectSkill(categoryList) {
    //console.log(categoryList)
    let selectedProducts = []
    this.filteredCategories=[]
    categoryList.forEach(cat => {
      cat.Products.forEach(product => {
        if (product.selected === true) {
          selectedProducts.push(product.ProductId)
          if (this.filteredCategories.indexOf(cat.Name) === -1) {
            this.filteredCategories.push(cat.Name)
          }
        }
      })
    })

    //console.log(this.staffFilterArray)
    this.staffFilterArray.skills = selectedProducts
    //console.log("selectSkill this.staffFilterArray", this.staffFilterArray)
    this.getStaffFilterList()
  }
  onSearchKeyUp() {
    //console.log(this.staffFilterArray)
    clearTimeout(this.typingTimeout);

      this.typingTimeout = setTimeout(() => {
        this.getStaffFilterList()
      }, 700);
   
   

  }
  changeIsWorking() {
    console.log(this.staffFilterArray)
    // const { groups, skills, searchValue } = this.staffFilterArray
    // let isFiltered = groups.length !== 0 || skills.length !== 0 || searchValue !== '';
    // this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
    // this.isWorkingLabel = `${this.isWorkingLabel} ${isFiltered ? "(Filtered)" : ""}`;
    this.getStaffFilterList(true)
  }

  getStaffFilterList(firstLoad = null): void {
    this.isloadingStaffFilterList = true;
    let obj = { ...this.staffFilterArray, IgnoreBookings: false}
    this.webapi.request(API.GET_STAFF_FILTER_LIST, {
      ...obj
    })
      .subscribe(
        data => {

          this.isloadingStaffFilterList = false;
          //console.log("getStaffFilterList :", data);
          this.filterStaffList = [...data.body.data];
          this.autoCompleteStaffList = this.filterStaffList;
          if (firstLoad) {
            if (!this.showFilterPopSingle) {
              this.filterStaffList.forEach(function (value, i) {
                value.selected = true;
                
              })
              this.selectAllTherapistValue=true;
            } else {
              this.filterStaffList.forEach(function (value, i) {
                value.selected = false;
              })
            }
            this.filterStaffList2= JSON.parse(JSON.stringify(this.filterStaffList))
            this.filterStaffList3= JSON.parse(JSON.stringify(this.filterStaffList))

          } else {
            if (this.selectAllTherapistValue) {
              this.filterStaffList.forEach(function (value, i) {
                value.selected = true;
              })
            } else {
              this.filterStaffList.forEach(function (value, i) {
                value.selected = false;
              })
            }
          }
          //console.log(this.filterStaffList)
          // this.setConstraints();
          // this.setScroll()

        },
        error => {
          this.isloadingStaffFilterList = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  openNewBookingOld(staffId = null, time = null) {
      this.isLoadingData=true
      Promise.all(
        [this.calendarService.getStaffFilterList(moment(this.selectedDate).format("MM/DD/YYYY")), this.calendarService.getUserList()
      ])
      .then(results => {
        this.isLoadingData=false
        this.newBooking = true;
        this.router.navigate(['/newbooking/'], {
          skipLocationChange: true,
          state: {
            from: '/calendar/',
            selectedDate: this.selectedDate,
            metadata: this.metadata,
            // treatmentDetail: this.treatmentDetail,
            staffId: staffId,
            time: time,
            // filterStaffList:this.calendarService.filterStaffList,
            timeSlots:this.timeSlots,
            // appUserList:this.calendarService.appUserList
          }
        }
        )
        
      });
   
  }
  openNewBooking(staffId = null, time = null) {
      this.isLoadingData=true
     
      this.newBooking = true;
      this.router.navigate(['/newbooking/'], {
        skipLocationChange: true,
        state: {
          from: '/calendar/',
          selectedDate: this.selectedDate,
          // metadata: this.metadata,
          // treatmentDetail: this.treatmentDetail,
          staffId: staffId,
          time: time,
          // filterStaffList:this.calendarService.filterStaffList,
          // timeSlots:this.timeSlots,
          // appUserList:this.calendarService.appUserList
        }
      }
      )
   
  }
  editBooking(bookingId) {
    this.isSpinning=true
    this.isSpinning=false
    this.newBooking = true;
    
    this.router.navigate(['/newbooking/'], {
      skipLocationChange: true,
      state: {
        from: '/calendar/',
        selectedDate: this.selectedDate,
        // metadata: this.metadata,
        BookingId: bookingId,
        // treatmentDetail: this.treatmentDetail,
        // filterStaffList:this.calendarService.filterStaffList,
        // timeSlots:this.timeSlots,
        // appUserList:this.calendarService.appUserList
      }
    }
    )



    
  }
  fetchAnalytics(event, userId) {
    if (event && userId) {
      this.isPopAnalyticLoading = true
      //console.log("called")
      //console.log(event)
      let obj = { UserId: userId }
      this.webapi.request(API.USER_ANALYTIC_DETAIL, obj)
        .subscribe(
          data => {
            this.isPopAnalyticLoading = false

            this.UserAnalyticDetail = { ...data.body.Data[0] }
            //console.log(this.UserAnalyticDetail)
          },
          error => {
            this.isPopAnalyticLoading = false

            var msg = error.headers.get('message');
            this.toast.error({
              title: "Error",
              msg,
              theme: 'bootstrap',
              timeout: 3000
            })
          }
        )
    }else{
      this.UserAnalyticDetail={}
    }

  }

  getTreatments() {

    this.webapi.request(API.GET_TREATMENTS, null)
      .subscribe(
        data => {

          this.treatmentDetail = [...data.body.Data];
          //console.log(this.treatmentDetail)
          this.treatmentDetail.forEach((element, index) => {
            let text = element.CategoryName.charAt(0).toUpperCase();
            this.treatmentDetail[index].Text = text
          });
        },
        error => {

          //console.log(error)
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  isApplyValid() {
    let selectedStaffList = []
    this.filterStaffList.forEach(staff => {
      if (staff.selected === true) {
        selectedStaffList.push(staff.StaffId)
      }
    })
    if (selectedStaffList.length == 0) {
      return false
    } else {
      return true
    }
  }

  setSelectAllCheck() {
    setTimeout(() => {
      let selectedStaffList = []
      this.filterStaffList.forEach(staff => {
        if (staff.selected === true) {
          selectedStaffList.push(staff.StaffId)
        }
      })
      if (selectedStaffList.length == this.filterStaffList.length) {
        this.selectAllTherapistValue = true
      } else {
        this.selectAllTherapistValue = false
      }
    }, 100);

  }

  applyStaffFilter() {
    this.filterStaffList2= JSON.parse(JSON.stringify(this.filterStaffList))
    this.selectedStaffList = []
    this.filterStaffList.forEach(staff => {
      if (staff.selected === true) {
        this.selectedStaffList.push(staff.StaffId)
      }
    })
    this.getStaffList();
    //console.log(this.selectedStaffList)

    const { groups, skills, searchValue } = this.staffFilterArray;
    let isFiltered = groups.length !== 0 || skills.length !== 0 || searchValue !== '';
    this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
    this.isWorkingLabel = `${this.isWorkingLabel} ${isFiltered ? " (Filtered)" : ""}`;
    this.staffFilterArray2=JSON.parse(JSON.stringify(this.staffFilterArray))

    // this.isWorkingLabel = isFiltered ? "(Filtered)" : ""
  }
  resetGroupSelect() {
    this.staffFilterArray.groups = []
    this.filteredGroups = [];
    this.staffGroupData.forEach(group => {
      group.selected = false;
    })
    this.getStaffFilterList();
    //  this.getStaffList();
  }
  resetSkillSelect() {
    this.staffFilterArray.skills = []
    this.filteredCategories = [];
    this.productData.forEach(product => {
      product.selected = false;
    })
    this.categoryList.forEach(cat => {
      cat.Selected=false;
      cat.Products.forEach(product => {
        product.selected = false;
      
      })
    })
    this.getStaffFilterList();
    //  this.getStaffList();
  }

  selectAllTherapist(value) {
    if (value) {
      this.filterStaffList.forEach(staff => {
        staff.selected = true

      })
    } else {
      this.filterStaffList.forEach(staff => {
        staff.selected = false

      })
    }
  }

  resetStaffFilter() {
    this.staffFilterArray = { groups: [], skills: [], searchValue: '', isWorking: '1', selectedDate: moment(this.selectedDate).format("MM/DD/YYYY"),OrganisationLocationId:[] }
    this.filteredCategories = [];
    this.filteredGroups = [];
    this.filteredOrg = [];
    

    this.categoryList.forEach(cat => {
      cat.Selected=false;
      cat.Products.forEach(product => {
        product.selected = false;
      
      })
    })

    this.staffGroupData.forEach(group => {
      group.selected = false;
    })
    this.orgFilterList.forEach(org => {
      org.selected = false;
    })
    // this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
    this.filterStaffList= JSON.parse(JSON.stringify(this.filterStaffList3))
    // this.getStaffFilterList(true);
    // this.getStaffList();
  }

  chatWithUser(userId) {
    this.router.navigate(['/support'], {
      state: {
        userId
      }
    })
  }
  setFilter(event){
    
    if(event==true)
    {
      this.filteredCategories=[];
      this.filteredGroups=[];
      this.filteredOrg=[];
      
      this.filterStaffList= JSON.parse(JSON.stringify(this.filterStaffList2))
      this.staffFilterArray=JSON.parse(JSON.stringify(this.staffFilterArray2))
      console.log(this.staffFilterArray)

      this.staffGroupData.forEach(group => {
        
        if(this.staffFilterArray.groups.indexOf(group.StaffGroupId) !== -1)
        {   group.selected = true;
          this.filteredGroups.push(group.Name);
        }
        else{
          group.selected = false;
        }
        
      })

      let selectedStaffList = []
      this.filterStaffList.forEach(staff => {
        if (staff.selected === true) {
          selectedStaffList.push(staff.StaffId)
        }
      })

      if (selectedStaffList.length == this.filterStaffList.length) {
        this.selectAllTherapistValue = true
      } else {
        this.selectAllTherapistValue = false
      }


      this.categoryList.forEach(cat => {
        cat.Selected=false;
        cat.Products.forEach(product => {

          if(this.staffFilterArray.skills.indexOf(product.ProductId) !== -1)
        {product.selected = true;
          if (this.filteredCategories.indexOf(cat.Name) === -1) {
            this.filteredCategories.push(cat.Name)
          }
          
          cat.Selected=true;
        }
        else{
          product.selected = false;
        }
         
        })
      })

      this.orgFilterList.forEach(org => {
        
        if(this.staffFilterArray.OrganisationLocationId.indexOf(org.OrganisationLocationId) !== -1)
        {   org.selected = true;
          this.filteredOrg.push(org.Name);
        }
        else{
          org.selected = false;
        }
        
      })

      

      
      
       
    const { groups, skills, searchValue } = this.staffFilterArray
    let isFiltered = groups.length !== 0 || skills.length !== 0 || searchValue !== '';
    this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
    this.isWorkingLabel = `${this.isWorkingLabel} ${isFiltered ? "(Filtered)" : ""}`;
      
    }
    
  }
  checkTodayBooking(bookingDate = null) {
    var today = momentz.tz(environment.STAFF_ZONE).startOf("day");
    var booking= momentz.tz(bookingDate, environment.STAFF_ZONE).startOf("day");

    //   var duration =moment(today,"YYYY-MM-DDTHH:mm:ss").diff(moment(today,"YYYY-MM-DDTHH:mm:ss"), "minutes");
    // let today = moment().startOf("day");
    // let selectedDay
    // if (formDate) {
    //   selectedDay = moment(formDate, this.FORMAT_DD_MM_YYYY).startOf("day");
    // } else {
    //   selectedDay = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).startOf("day");
    // }
    if (booking.isBefore(today)) {
      return true
    } else {
      return false
    }
    
  }
  onSelectCategory(category) {
    //console.log(category)
    if (category.Selected) {
      category.Products.forEach(pro => {
        pro.selected = true

      });
    } else {
      category.Products.forEach(pro => {
        pro.selected = false

      });
    }

  }

  getTimeSlots(){
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
  //console.log(startTime)
  //console.log(endTime)
  while (startTime < endTime) {
      //Push times
      allTimes.push(startTime.format("HH:mm")); 
      //Add interval of 'slotInterval' minutes
      startTime.add(config.slotInterval, 'minutes');
  }
  this.timeSlots=allTimes;
  }


  staffValid() {
    return true;
  }
  
  drag(e) {
    console.log(e.target);
    //console.log("drop data out");
    e.dataTransfer.setData("productid", e.target.dataset.productid);
    e.dataTransfer.setData("bookingid", e.target.dataset.bookingid);
    e.dataTransfer.setData("totalduration", e.target.dataset.totalduration);
    e.dataTransfer.setData("starttime", e.target.dataset.starttime);
    e.dataTransfer.setData("id", e.target.id);
    e.dataTransfer.setData("left", e.target.dataset.left);
  }
  drag_card(e, booking) {
    //console.log("popvisible="+booking.popVisible);
    booking.popVisible = false;
    
    //calculate first click position left
    const firstClickX = e.clientX;
    const firstClickY = e.clientY;
    console.log(firstClickX, firstClickY)
    const clickedElement = e.target;
    const parentElement = clickedElement.parentNode;
    const parentRect = parentElement.getBoundingClientRect();
    const leftValue = e.clientX - parentRect.left;

    console.log("leftValue" + leftValue)

    //fetch the card left value and split the px string
    const cardLeft=e.target.dataset.left
    const cardLeftValue=parseInt(cardLeft)
    console.log("cardLeftValue" + cardLeftValue)

    //calculate the shadowleft to be substracted
    this.shadowOffset=leftValue-cardLeftValue

    console.log("shadowOffsett" + this.shadowOffset)

    console.log("card drop data out");
    e.dataTransfer.setData("productid", e.target.dataset.productid);
    e.dataTransfer.setData("bookingid", e.target.dataset.bookingid);
    e.dataTransfer.setData("totalduration", e.target.dataset.totalduration);
    e.dataTransfer.setData("starttime", e.target.dataset.starttime);
    e.dataTransfer.setData("id", e.target.id);
    e.dataTransfer.setData("left", e.target.dataset.left);
    this.dragCardTime = booking.StartTime
    console.log(this.dragCardTime)
    if (e.target.classList[0] == "booking-card") {
      let slides = document.getElementsByClassName("booking_drag_card");

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        slide.style.width = e.target.style.width;


      }


    }
  }

  allowDrop(e) {
    
    e.preventDefault();
    // //console.log("allowdop");
    // //console.log(e);
   
  }
  allowDragleave(e) {
    
    e.preventDefault();
    //console.log("allowleave");
    //console.log(e);
    if(e.target.parentElement.classList[0]=="grid-min-block")
      {
        // document.getElementsByClassName("grid-min-block").classList.remove("addbordergrren")
        // e.target.parentElement.classList.remove("addbordergrren");
        
        // e.target.parentElement.style.border = "none";
        // e.target.parentElement.style.borderRight = "1px dotted #97979733";
      }
      
      
            
      
  }
  allowDragenter(e) {
    e.preventDefault();
    if(e.target.parentElement.classList[0]=="grid-min-block")
    {
      let slides=document.getElementsByClassName("booking_drag_card");
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        slide.style.display = "none";
      } 
      let drag_divid="1"+e.target.offsetParent.id; 
      let div_drag=document.getElementById(drag_divid);
      div_drag.style.height = e.target.clientHeight+"px";
      div_drag.style.left = e.target.offsetLeft+"px";
      div_drag.style.display="block";
      
    }
    else if(e.target.parentElement.classList[0]=="schedule-min")
    {
      let slides=document.getElementsByClassName("booking_drag_card");
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        slide.style.display = "none";
      } 
      //console.log(e.target.offsetParent.offsetParent.offsetParent.id+"newid");
      let drag_divid="1"+e.target.offsetParent.offsetParent.offsetParent.id; 
      let div_drag=document.getElementById(drag_divid);
      div_drag.style.height = e.target.clientHeight+"px";
      let end = moment(e.target.innerText, "HH:mm");
      let start = moment("00:00", "HH:mm");
     let diffnew=end.diff(start);
    //console.log("diffnew="+diffnew);
    diffnew=(diffnew/60000)
    let gridWidthMiute=this.gridWidth/60;
    let targetOffsetLeft=diffnew*gridWidthMiute+"px";

      div_drag.style.left = targetOffsetLeft;
      div_drag.style.display="block";
      
    }
    else if(e.target.classList[0]=="block-time-container")
    {
      let slides=document.getElementsByClassName("booking_drag_card");
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        slide.style.display = "none";
      } 
      //console.log(e.target.offsetParent.offsetParent.id+"newid");
      let drag_divid="1"+e.target.offsetParent.offsetParent.id; 
      let div_drag=document.getElementById(drag_divid);
      div_drag.style.height = e.target.clientHeight+"px";
    //   let end = moment(e.target.innerText, "HH:mm");
    //   let start = moment("00:00", "HH:mm");
    //  let diffnew=end.diff(start);
    // //console.log("diffnew="+diffnew);
    // diffnew=(diffnew/60000)
    // let gridWidthMiute=this.gridWidth/60;
    // let targetOffsetLeft=diffnew*gridWidthMiute+"px";

    //   div_drag.style.left = targetOffsetLeft;
    //   div_drag.style.display="block";
      
    }




    const elements = document.querySelectorAll('.grid-min-block');
    const elements2 = document.querySelectorAll('.schedule-min');



    // if(e.target.parentElement.classList[0]=="grid-min-block")
    // {
    //   elements.forEach((element) => {
    //     element.classList.remove('addbordergrren');
    //   });
    //   elements2.forEach((element) => {
    //     element.classList.remove('addbordergrren');
    //   });
    //   e.target.parentElement.classList.add("addbordergrren");
    // }
    // else if(e.target.parentElement.classList[0]=="schedule-min")
    // {
    //   elements.forEach((element) => {
    //     element.classList.remove('addbordergrren');
    //   });
    //   elements2.forEach((element) => {
    //     element.classList.remove('addbordergrren');
    //   });
    //   e.target.parentElement.classList.add("addbordergrren");
    // }
    
  }
  

  onDrop(e) {
    //console.log("drop data in");
    console.log(e);
    // if(e.target.parentElement.classList[0]=="grid-min-block")
    //   {
    //     e.target.parentElement.classList.remove("addbordergrren"); 
    //     // e.target.parentElement.style.border = "none";
    //     // e.target.parentElement.style.borderRight = "1px dotted #97979733";
    //   }
    //   else if(e.target.parentElement.parentElement.classList[0]=="grid-min-block")
    //   {
    //     e.target.parentElement.parentElement.classList.remove("addbordergrren"); 
    //   }
    //   else if(e.target.parentElement.classList[0]=="schedule-min")
    //   {
    //     e.target.parentElement.classList.remove("addbordergrren"); 
    //   }

    let slides=document.getElementsByClassName("booking_drag_card");
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        slide.style.display = "none";
      } 
      
    //console.log("drop data in");
    let dragElementId = e.dataTransfer.getData("id");
    console.log(e.dataTransfer.getData("left"));
    //console.log("dragelementid="+dragElementId);
    let obj:any={}
    if(dragElementId=="drag-element")
    {
      let targetStartTime=e.target.innerText;
     
      // //console.log("end"+end)    
    //console.log(document.getElementById(dragElementId));
    //console.log("data via id");
    this.staffValid();
    let productDataId = e.dataTransfer.getData("productid");
    let bID=e.dataTransfer.getData("bookingid");
    console.log("bId",bID)
    console.log("e.dataTransfer.getDa",e.dataTransfer.getData("bookingid"))
    let productduration=e.dataTransfer.getData("totalduration");
    let startTime=e.dataTransfer.getData("starttime");
     targetStartTime = momentz.tz(startTime, environment.STAFF_ZONE).format(this.HH_MM)
    //console.log(e.target.parentElement.offsetParent.attributes);
    // let staffId = e.target.parentElement.offsetParent.dataset.staffid;
    // let staffId = e.target.parentElement.offsetParent.attributes.getNamedItem('id').value;
    let  eventtarget=e.target;
     //console.log("event target=");
     //console.log(eventtarget);
     do {  
      eventtarget= eventtarget.offsetParent;
     }  
     while (eventtarget.classList[0]!= "row-container"); 

     //console.log("ddewr="+eventtarget);
     let staffId = eventtarget.attributes.getNamedItem('id').value;
    
    staffId=staffId.replace('row', '');
    //console.log(this.staffList);
    let staffIndex = this.staffList.find(object => { 
      return object.StaffId == staffId;
    });
    obj.StaffId=staffId
    obj.BookingId= bID
    obj.BookingProductId=productDataId
    console.log("obj",obj)
    this.DropObj=obj
    this.targetStartTime=targetStartTime
    let overlapResult=this.checkOverlap(targetStartTime,staffId,productduration)
    console.log("overlap")
    console.log(overlapResult)
    if(overlapResult.onBooking){
      this.showOnBookingAlert=true;
    }else{
      if(overlapResult.onBlock){
        this.showOnBlockAlert=true;
    }else{
      if(overlapResult.noSchedule){
        this.showNoScheduleAlert=true;
      }else{
        this.updateUnfilledBooking(obj,targetStartTime)
      }
      }
    }
    


    // //console.log("staffindex");
    // //console.log(staffIndex);
    // //console.log(this.clonedArray);
    // // index.Bookings.push(this.clonedArray[0]);
    // //console.log(this.unfilledList);
    // //console.log("lenght");
    // //console.log(this.unfilledList.length);
    // for (let unfilledStaff = 0; unfilledStaff < this.unfilledList.length; unfilledStaff++) {
    //   const staffN = this.unfilledList[unfilledStaff];
    //   //console.log(staffN);
    //   staffN.Bookings.forEach((booking,index) => {
    //     if(booking.BookingProductId == productDataId) {
    //       //console.log(booking);
    //       //console.log(index);
    //       staffIndex.Bookings.push(booking)
    //       staffN.Bookings.splice(index, 1)
    //       let bookingScrollTime=booking.showStartTime;
    //       //console.log(bookingScrollTime);
          
    //       let end = moment(bookingScrollTime, "HH:mm");
    //       let start = moment("00:00", "HH:mm");
          
    //       let diffnew=end.diff(start);
    //       //console.log("diffnew="+diffnew);
    //       diffnew=(diffnew/60000)
    //       let gridWidthMiute=this.gridWidth/60;
    //       let scrollWidth=diffnew*gridWidthMiute;
    //       let elementScroll = document.getElementById("cal-timeline-scroll");
    //       elementScroll.scroll({
    //         behavior: "smooth",
    //         left: scrollWidth
    //       })


    //     }
    //   });
    //   // //console.log(this.staffList);
    // }
  }
  else{
    //console.log("id is null");
    //console.log(e);

    let targetStartTime=e.target.innerText;
    let end = moment(targetStartTime, "HH:mm");
    let start = moment("00:00", "HH:mm");
    let productduration=e.dataTransfer.getData("totalduration");
    
    let diffnew=end.diff(start);
    //console.log("diffnew="+diffnew);
    diffnew=(diffnew/60000)
    let gridWidthMiute=this.gridWidth/60;
    let targetOffsetLeft=diffnew*gridWidthMiute+"px";
    //console.log("target="+targetOffsetLeft);
     let productDataId = e.dataTransfer.getData("productid");
     //console.log('productid='+productDataId)
     let  eventtarget=e.target;
     //console.log("event target=");
     //console.log(eventtarget);
     do {  
      eventtarget= eventtarget.offsetParent;
     }  
     while (eventtarget.classList[0]!= "row-container"); 

     //console.log("ddewr="+eventtarget);
     let staffId = eventtarget.attributes.getNamedItem('id').value;
    // let staffId = e.target.parentElement.offsetParent.attributes.getNamedItem('id').value;
    
    staffId=staffId.replace('row', '');
    //console.log(staffId);
    //console.log(this.staffList);
    let startDate=  moment(this.selectedDate).format("YYYY-MM-DD")
    obj.StaffId=staffId
    obj.BookingId= e.dataTransfer.getData("bookingid");
    obj.BookingProductId=productDataId
    obj.StartTime=  momentz.tz(startDate + ' ' + targetStartTime,'YYYY-MM-DDTHH:mm:ss',environment.STAFF_ZONE).utc().format("YYYY-MM-DDTHH:mm:ss");
    this.DropObj=obj
    this.targetStartTime=targetStartTime
    let overlapResult=this.checkOverlap(targetStartTime,staffId,productduration,obj.BookingId)
    if(overlapResult.onBooking){
      // e.preventDefault();
      this.showOnBookingAlert=true;
      // return;
      
    }else{
      if(overlapResult.onBlock){
        // e.preventDefault();
        this.showOnBlockAlert=true;
        // return;
    }else{
      if(overlapResult.noSchedule){
        // e.preventDefault();
        this.showNoScheduleAlert=true;
        // return;
      }else{
        this.updateUnfilledBooking(obj,targetStartTime)
      }
      }
    }



    // let staffIndex = this.staffList.find(object => { 
    //   return object.StaffId == staffId;
    // });

    // let productDataIndex = this.clonedArray.find(object => { 
    //   return object.BookingProductId == productDataId;
    // });
    // //console.log("productDataIndex");
    // //console.log(productDataIndex);
    
    // let oldStaffIndex = this.staffList.find(object => { 
    //   return object.StaffId == productDataIndex.StaffId;
    // });
    // let oldStaffBookingIndex = oldStaffIndex.Bookings.find(object => { 
    //   return object.BookingProductId == productDataId;
    // });

    // oldStaffIndex.Bookings.splice(oldStaffBookingIndex);
    
    // productDataIndex.StaffId=staffId;
    // productDataIndex.StaffName=staffIndex.Name;

    // let endShow= moment(productDataIndex.showEndTime, "HH:mm");
    // let startShow = moment(productDataIndex.showStartTime, "HH:mm");
    
    // let diffnew2=endShow.diff(startShow);
    // diffnew2=(diffnew2/60000);
    // //console.log("diffnew2="+diffnew2);
    // let entimeShow=moment(targetStartTime, "HH:mm").add(diffnew2, 'minutes').format('HH:mm');
    // // entimeShow=moment(entimeShow, "HH:mm");
    // //console.log("entimeshwo="+entimeShow);
    // productDataIndex.showStartTime=targetStartTime;
    // productDataIndex.showEndTime=entimeShow;
    // productDataIndex.viewConf.left=targetOffsetLeft;
    
    // //console.log(productDataIndex);
    // staffIndex.Bookings.push(productDataIndex);
    
    
    
    // //console.log("staffindex");
    // //console.log(staffIndex);
    // //console.log(this.clonedArray);
    // // index.Bookings.push(this.clonedArray[0]);

    // for (let indexStaff = 0; indexStaff < this.staffList.length; indexStaff++) {
    //   const staffN = this.staffList[indexStaff];
      
    //   // staffN.Bookings.forEach((booking,index) => {
    //   //   if(booking.BookingProductId == productDataId) {
    //   //     //console.log(booking);
    //   //     //console.log(index);
    //   //     staffIndex.Bookings.push(booking)
    //   //     staffN.Bookings.splice(index, 1)
    //   //     let bookingScrollTime=booking.showStartTime;
    //   //     //console.log(bookingScrollTime);
          
    //   //     let end = moment(bookingScrollTime, "HH:mm");
    //   //     let start = moment("00:00", "HH:mm");
          
    //   //     let diffnew=end.diff(start);
    //   //     //console.log("diffnew="+diffnew);
    //   //     diffnew=(diffnew/60000)
    //   //     let gridWidthMiute=this.gridWidth/60;
    //   //     let scrollWidth=diffnew*gridWidthMiute;
    //   //     let elementScroll = document.getElementById("cal-timeline-scroll");
    //   //     elementScroll.scroll({
    //   //       behavior: "smooth",
    //   //       left: scrollWidth
    //   //     })


    //   //   }
    //   // });
    // }

    
   
    
  }

    
    
    
  }

  continueDrop(){
    let obj=this.DropObj
    this.updateUnfilledBooking(obj,this.targetStartTime)
  }
  checkOverlap(targetStartTime: any, staffId: any, duration: any,bookingId=null) {
    let found = this.staffList.findIndex(staff => staff.StaffId == staffId);
    let startDate = moment(this.selectedDate).format("YYYY-MM-DD")
    let startTime = momentz.tz(startDate + ' ' + targetStartTime, 'YYYY-MM-DDTHH:mm:ss', environment.STAFF_ZONE).format(this.HH_MM_SS);
    let endTime = momentz.tz(startTime,this.HH_MM_SS, environment.STAFF_ZONE).add(duration, "minutes").format(this.HH_MM_SS);
    let onBlock = false;
    let onBooking = false;
    let noSchedule = false;
    if (found != -1) {
      if(this.staffList[found].Schedule.BlockTime.Blocks){
        this.staffList[found].Schedule.BlockTime.Blocks.forEach(block => {
          let startDate = moment(this.selectedDate).format("YYYY-MM-DD")
          let startTimeToCompare = momentz.tz(startDate + ' ' + block.StartTime, environment.STAFF_ZONE).format(this.HH_MM_SS);
          let endTimeToCompare = momentz.tz(startDate + ' ' + block.EndTime, environment.STAFF_ZONE).format(this.HH_MM_SS);
          if ((moment(startTimeToCompare, this.HH_MM_SS).isAfter(moment(startTime, this.HH_MM_SS))) && (moment(startTimeToCompare, this.HH_MM_SS).isBefore(moment(endTime, this.HH_MM_SS)))) {

            onBlock = true
          } else if ((moment(endTimeToCompare, this.HH_MM_SS).isAfter(moment(startTime, this.HH_MM_SS))) && (moment(endTimeToCompare, this.HH_MM_SS).isBefore(moment(endTime, this.HH_MM_SS)))) {
    
            onBlock = true
          }
          else if ((moment(startTime, this.HH_MM_SS).isAfter(moment(startTimeToCompare, this.HH_MM_SS))) && (moment(startTime, this.HH_MM_SS).isBefore(moment(endTimeToCompare, this.HH_MM_SS)))) {
    
            onBlock = true
          }
          else if ((moment(endTime, this.HH_MM_SS).isAfter(moment(startTimeToCompare, this.HH_MM_SS))) && (moment(endTime, this.HH_MM_SS).isBefore(moment(endTimeToCompare, this.HH_MM_SS)))) {
    
            onBlock = true
          }else if ((moment(endTime, this.HH_MM_SS).isSame(moment(startTimeToCompare, this.HH_MM_SS))) || (moment(endTime, this.HH_MM_SS).isSame(moment(endTimeToCompare, this.HH_MM_SS)))) {
    
            onBlock = true
          }
          else if ((moment(startTime, this.HH_MM_SS).isSame(moment(startTimeToCompare, this.HH_MM_SS))) || (moment(startTime, this.HH_MM_SS).isSame(moment(endTimeToCompare, this.HH_MM_SS)))) {
    
            onBlock = true
          }
        })
      }
      
    // if(!this.staffList[found].Schedule.GeneralOffer){
    if(!Object.keys(this.staffList[found].Schedule.GeneralOffer).length && !Object.keys(this.staffList[found].Schedule.InstantConfirmation).length){
      noSchedule = true
    }else{
      let startTimeToCompare = momentz.tz(this.staffList[found].Schedule.DayStart, this.HH_MM_SS,environment.STAFF_ZONE).format(this.HH_MM_SS);
      let endTimeToCompare = momentz.tz(this.staffList[found].Schedule.DayEnd, this.HH_MM_SS,environment.STAFF_ZONE).format(this.HH_MM_SS);
      if ((moment(startTime, this.HH_MM_SS).isSame(moment(startTimeToCompare, this.HH_MM_SS))) && ((moment(endTime, this.HH_MM_SS).isSame(moment(endTimeToCompare, this.HH_MM_SS))))){
        noSchedule = false
      }else if ((moment(startTime, this.HH_MM_SS).isSame(moment(startTimeToCompare, this.HH_MM_SS))) && ((moment(endTime, this.HH_MM_SS).isBefore(moment(endTimeToCompare, this.HH_MM_SS))))){
        noSchedule = false
      }
      else if ((moment(startTime, this.HH_MM_SS).isAfter(moment(startTimeToCompare, this.HH_MM_SS))) && ((moment(endTime, this.HH_MM_SS).isSame(moment(endTimeToCompare, this.HH_MM_SS))))){
        noSchedule = false
      }
      else if ((moment(startTime, this.HH_MM_SS).isAfter(moment(startTimeToCompare, this.HH_MM_SS))) && ((moment(endTime, this.HH_MM_SS).isBefore(moment(endTimeToCompare, this.HH_MM_SS))))){
        noSchedule = false
      }else{
        noSchedule = true
      }
    }
    console.log( this.staffList[found].Bookings)
    this.staffList[found].Bookings.forEach(booking => {
      let startTimeToCompare = momentz.tz(booking.StartTime, environment.STAFF_ZONE).tz(environment.STAFF_ZONE).format(this.HH_MM_SS);
      let endTimeToCompare = momentz.tz(booking.StartTime, environment.STAFF_ZONE).add(booking.ProdTotalDuration, "minutes").tz(environment.STAFF_ZONE).format(this.HH_MM_SS);
      console.log(booking)
        console.log(startTimeToCompare)
        console.log(endTimeToCompare)
        console.log(startTime)
        console.log(endTime)
        console.log(bookingId)
        console.log(booking.BookingId)
        if(bookingId!=booking.BookingId){
      if ((moment(startTimeToCompare, this.HH_MM_SS).isAfter(moment(startTime, this.HH_MM_SS))) && (moment(startTimeToCompare, this.HH_MM_SS).isBefore(moment(endTime, this.HH_MM_SS)))) {

        onBooking = true
        console.log("1")
        
        console.log("1")
      } else if ((moment(endTimeToCompare, this.HH_MM_SS).isAfter(moment(startTime, this.HH_MM_SS))) && (moment(endTimeToCompare, this.HH_MM_SS).isBefore(moment(endTime, this.HH_MM_SS)))) {

        onBooking = true
        console.log("2")
      }
      else if ((moment(startTime, this.HH_MM_SS).isAfter(moment(startTimeToCompare, this.HH_MM_SS))) && (moment(startTime, this.HH_MM_SS).isBefore(moment(endTimeToCompare, this.HH_MM_SS)))) {

        onBooking = true
        console.log("3")
      }
      else if ((moment(endTime, this.HH_MM_SS).isAfter(moment(startTimeToCompare, this.HH_MM_SS))) && (moment(endTime, this.HH_MM_SS).isBefore(moment(endTimeToCompare, this.HH_MM_SS)))) {

        onBooking = true
        console.log("4")
      }else if ((moment(endTime, this.HH_MM_SS).isSame(moment(startTimeToCompare, this.HH_MM_SS))) || (moment(endTime, this.HH_MM_SS).isSame(moment(endTimeToCompare, this.HH_MM_SS)))) {

        onBooking = true
        console.log("5")
      }
      else if ((moment(startTime, this.HH_MM_SS).isSame(moment(startTimeToCompare, this.HH_MM_SS))) || (moment(startTime, this.HH_MM_SS).isSame(moment(endTimeToCompare, this.HH_MM_SS)))) {

        onBooking = true
        console.log("6")
      }
    }
    })
  }
  return {
    onBlock:onBlock,
    onBooking:onBooking,
    noSchedule:noSchedule
  }
  }

  // onDrop(event: CdkDragDrop<string[]>) {
  //   //console.log("ondrop call");
  //   //console.log(event);
  // }
  
  onResize(event) {
    this.screenWidth = window.innerWidth;  
      
    if(this.screenWidth<=1500)  {this.gridWidth=200; this.gridHeight='100px';this.bookingCardHeight=94;}
    if(this.screenWidth>1500 && this.screenWidth<=1700)  {this.gridWidth=225; this.gridHeight='110px';this.bookingCardHeight=104;}
    if(this.screenWidth>1700 && this.screenWidth<=1900)  {this.gridWidth=250; this.gridHeight='115px';this.bookingCardHeight=109;}
    if(this.screenWidth>1900 && this.screenWidth<=2100)  {this.gridWidth=280; this.gridHeight='125px';this.bookingCardHeight=119;}
    if(this.screenWidth>2100 && this.screenWidth<=2300)  {this.gridWidth=310; this.gridHeight='140px';this.bookingCardHeight=134;}
    if(this.screenWidth>2300 && this.screenWidth<=2500)  {this.gridWidth=335; this.gridHeight='150px';this.bookingCardHeight=144;}
    if(this.screenWidth>2500)  {this.gridWidth=365; this.gridHeight='165px';this.bookingCardHeight=159;}
    this.dayTime.unitGridWidth=this.gridWidth;
    //console.log("ngoninit="+this.gridWidth);
    this.updateStaffData();
    this.setConstraints();
    //console.log(`staffs:`)
    //console.log(this.staffList)
    this.setScroll()

    setTimeout(() => {
      this.setCurrentTimeLine();
    }, 1000);
  }

  updateUnfilledBooking(obj,targetStartTime=null){
    this.isSpinning = true;
    this.webapi.request(API.UPDATE_UNFILLED_BOOKINGS, {
      ...obj
    })
    .subscribe(
      data => {

        this.getUnfilledBookings();
        this.getStaffList(targetStartTime);
      },
      error => {

        //console.log(error)
        this.getUnfilledBookings();
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )
  }
  
  getUnfilledBookings(): void {
    // this.isLoadingStaff = true;
    // this.isSpinning = true;
    let obj = {
      
    };
    
    this.webapi.request(API.UNFILLED_BOOKINGS, {
      ...obj
    })
      .subscribe(
        data => {
         
          // this.isLoadingStaff = false;
          // this.isSpinning = false;
          
          let unfilledList = [...data.body.Data];
          this.unfilledList_global = [...data.body.Data];
          this.setUnfilledData(unfilledList);
        },
        error => {
          // this.isLoadingStaff = false;
          // this.isSpinning = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  setUnfilledData(unfilledList){
    let unfilledData=[]
    unfilledList.forEach(booking => {
      
      // booking.viewConf = this.getWorkingWidth(booking, "booking");
        
        
        booking.showStartTime = momentz.tz(booking.StartTime, environment.STAFF_ZONE).format(this.HH_MM)
        booking.showEndTime = momentz.tz(booking.StartTime, environment.STAFF_ZONE).add(booking.ProdTotalDuration, "minutes").format(this.HH_MM)
        booking.SpecialRequestArray=[];
        if(booking.SpecialRequest.length){
          let allRequest=[];
          let isUserDefined=1;
          booking.SpecialRequest.forEach(element => {
            //console.log(element)
            let foundRequest = this.SpecialRequestData.find(sp => sp.SpecialRequestId === element.SpecialRequestId);
            
            if(foundRequest){
              allRequest.push(foundRequest.SpecialRequestName)
              if(!foundRequest.IsUserDefined){
                isUserDefined=0
              }
            }
        })
        booking.SpecialRequestArray=allRequest;
        booking.IsUserDefined=isUserDefined;
      }
        let found=unfilledData.findIndex(f => f.Date === momentz.tz(booking.StartTime, environment.STAFF_ZONE).format(this.FORMAT_DD_MM_YYYY));
        if(found!=-1){
          unfilledData[found].Bookings.push({...booking})
        }else{
          let newselecteddate=momentz.tz(this.selectedDate, environment.STAFF_ZONE).format(this.FORMAT_DD_MM_YYYY);
          let newselecteddate2=momentz.tz(booking.StartTime, environment.STAFF_ZONE).format(this.FORMAT_DD_MM_YYYY);
          
          //console.log("seleced date="+newselecteddate);
          //console.log("seleced date="+newselecteddate2);
          //console.log(moment(newselecteddate).isSame(newselecteddate2));
          unfilledData.push({
            Date:momentz.tz(booking.StartTime, environment.STAFF_ZONE).format(this.FORMAT_DD_MM_YYYY),
            Bookings:[{...booking}],
            IsSelected:(newselecteddate)==(newselecteddate2)
          })
        }
        
      
   
    });
    this.unfilledList=unfilledData
    this.sortList()
  }
  sortList(): void {
    this.unfilledList.sort((a, b) => {
      if (moment(a.Date,this.FORMAT_DD_MM_YYYY).isBefore(moment(b.Date,this.FORMAT_DD_MM_YYYY)) ){
        return -1;
      }
      if (moment(a.Date,this.FORMAT_DD_MM_YYYY).isAfter(moment(b.Date,this.FORMAT_DD_MM_YYYY)) ){
        return 1;
      }
      return 0;
    });
  }
  
   setSpecialRequest(){
    // console.log(this.unfilledList)
    for (let staffInc = 0; staffInc < this.staffList.length; staffInc++) {
      const staff = this.staffList[staffInc];
      
      // let concurrentBookingData= await this.getConcurrentBookings(staff.Bookings);
      // staff.Bookings=concurrentBookingData.Bookings
      staff.Bookings.forEach(booking => {
        
        booking.SpecialRequestArray=[];
        if(booking.SpecialRequest.length){
          let allRequest=[];
          let isUserDefined=1;
          booking.SpecialRequest.forEach(element => {
           
            let foundRequest = this.SpecialRequestData.find(sp => sp.SpecialRequestId === element.SpecialRequestId);
            
            if(foundRequest){
              allRequest.push(foundRequest.SpecialRequestName)
              if(!foundRequest.IsUserDefined){
                isUserDefined=0
              }
            }
        })
        booking.SpecialRequestArray=allRequest;
        booking.IsUserDefined=isUserDefined;
        
      }
      
      
      });
    }

    for (let unfilledInc = 0; unfilledInc < this.unfilledList.length; unfilledInc++) {
      const unfilled = this.unfilledList[unfilledInc];
      
      // let concurrentBookingData= await this.getConcurrentBookings(staff.Bookings);
      // staff.Bookings=concurrentBookingData.Bookings
      unfilled.Bookings.forEach(booking => {
        
        booking.SpecialRequestArray=[];
        if(booking.SpecialRequest.length){
          let allRequest=[];
          let isUserDefined=1;
          booking.SpecialRequest.forEach(element => {
           
            let foundRequest = this.SpecialRequestData.find(sp => sp.SpecialRequestId === element.SpecialRequestId);
            
            if(foundRequest){
              allRequest.push(foundRequest.SpecialRequestName)
              if(!foundRequest.IsUserDefined){
                isUserDefined=0
              }
            }
        })
        booking.SpecialRequestArray=allRequest;
        booking.IsUserDefined=isUserDefined;
        
      }
      
      
      });
    }

    
  }
  getOrganisationList(){
    this.calendarService.getOrganisationList(true).then(results => {
  
      let organisationList = this.calendarService.organisationList
      this.orgFilterList=[...organisationList]
      this.orgFilterList.forEach(group => {
        group.selected = false;
      });
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

  selectOrgSelect(staffOrgData) {
    console.log(staffOrgData)
    let selectedOrganisations = []
    this.filteredOrg=[]
    staffOrgData.forEach(org => {
      if (org.selected === true) {
        selectedOrganisations.push(org.OrganisationLocationId)
        this.filteredOrg.push(org.Name);
      }
    })
    this.staffFilterArray.OrganisationLocationId = selectedOrganisations
    //console.log("selectGroupSelect this.staffFilterArray", this.staffFilterArray)
    this.getStaffFilterList()

  }
  resetOrgSelect() {
    this.staffFilterArray.OrganisationLocationId = []
    this.filteredOrg = [];
    this.orgFilterList.forEach(org => {
      org.selected = false;
    })
    this.getStaffFilterList();
    //  this.getStaffList();
  }
  go(bookingId){
  let date=moment(this.selectedDate).format()
  this.cookieService.set("onbackselectdate",date, null, "/");
    this.router.navigate(['/booking/'], {
      state: {
        bookingId,
        selectedDate:this.selectedDate
      }
    })
  }
  // @HostListener('window:popstate', ['$event'])
  onBackButtonPressed(event: PopStateEvent) {
    console.log(event.state)
  // Check if the previous state contains the desired data
  if (event.state && event.state.receivedData) {
    this.receivedData = event.state.receivedData;
    // Do something with the received data
    console.log('Received data:', this.receivedData);
  }
}
getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      }
  }
  return "";
}

}